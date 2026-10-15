import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal, useFrame } from '@react-three/fiber'
import {
  Bone,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CapsuleGeometry,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  Skeleton,
  SkinnedMesh,
  SphereGeometry,
  SRGBColorSpace,
  TubeGeometry,
  Uint16BufferAttribute,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import Accessory from './Accessories'
import { FUR_LAYERS, furGeometry, furMaterial } from './fur'
import { blendPose, DUTY, LEG_NAMES, NEUTRAL, nextGesture, poseFor, spring } from './petMotion'
import { PET_STATES, SPECIES } from './petStates'

// Giai đoạn → độ "non" của dáng (thú con đầu to, chân ngắn)
const YOUTH = { hatchling: 1, baby: 0.55, adult: 0, evolved: 0 }
const SILHOUETTE = '#2b2170'

/**
 * Thú cưng dựng hoàn toàn bằng code, tỉ lệ như thật: thân liền một khối có bộ xương, lông nhiều lớp,
 * mắt, mũi, miệng, móng, ria; tư thế tính bằng code (petMotion.js), chân đặt xuống sàn bằng IK.
 * species: mã loài; stage: giai đoạn lớn lên; look: null | 'evolved' | 'silhouette'; state: một trong PET_STATES;
 * speed: tốc độ di chuyển (đơn vị mô hình/giây) để bước chân khớp quãng đường; equipment: [{ slot, code }];
 * lookAt: ref tới một điểm trong cảnh (Vector3) để đầu và mắt nhìn theo (vd. con trỏ chuột), không có thì nhìn camera;
 * furLayers: số lớp lông (ít lớp nhẹ máy hơn, dùng khi có nhiều thú cùng lúc như trang chủ).
 */
export default function PetBody({
  species: code, stage = 'adult', look = null, state = 'idle', speed = null, onFinished, equipment = [], lookAt = null, furLayers = FUR_LAYERS,
}) {
  const body = useBody(SPECIES[code] ? code : 'shiba', YOUTH[stage] ?? 0)
  const rig = useMemo(() => (body ? createRig(body, look, furLayers) : null), [body, look, furLayers])
  const motion = useRef(null)

  useEffect(() => () => rig?.dispose(), [rig])

  useFrame(({ clock, camera }, delta) => {
    if (!rig) return
    motion.current ??= newMotion()
    const target = lookAt?.current ?? camera.getWorldPosition(temp.camera)
    animate(rig, motion.current, { state, speed, onFinished, now: clock.elapsedTime, delta: Math.min(delta, 0.05), target })
  })

  if (!rig) return null
  return (
    <>
      <primitive object={rig.root} />
      {equipment.map(({ slot, code: item }) =>
        rig.anchors[slot] ? <Fragment key={slot}>{createPortal(<Accessory code={item} />, rig.anchors[slot])}</Fragment> : null,
      )}
    </>
  )
}

// ---- Dựng lưới trong Web Worker (khoảng 1 giây mỗi con), lưu lại theo loài + độ tuổi ----
const bodies = new Map()
let worker = null

function requestBody(code, youth) {
  const key = `${code}:${youth}`
  if (!bodies.has(key)) {
    bodies.set(
      key,
      new Promise((resolve) => {
        worker ??= new Worker(new URL('./anatomy.worker.js', import.meta.url), { type: 'module' })
        const listen = ({ data }) => {
          if (data.key !== key) return
          worker.removeEventListener('message', listen)
          resolve(data.body)
        }
        worker.addEventListener('message', listen)
        worker.postMessage({ key, code, youth })
      }),
    )
  }
  return bodies.get(key)
}

function useBody(code, youth) {
  const key = `${code}:${youth}`
  const [loaded, setLoaded] = useState(null)
  useEffect(() => {
    let alive = true
    requestBody(code, youth).then((body) => alive && setLoaded({ key, body }))
    return () => {
      alive = false
    }
  }, [code, youth, key])
  return loaded?.key === key ? loaded.body : null
}

// ---- Dựng các đối tượng three.js từ dữ liệu giải phẫu ----

function createRig(body, look, furLayers) {
  const { bones: data, mesh, breed, head, joints, round, traits, nose } = body
  const species = SPECIES[body.code]
  const disposables = []
  const keep = (item) => (disposables.push(item), item)

  // Bộ xương: mọi xương ở tư thế nghỉ đều không xoay, nên góc xoay khi diễn hoạt chính là góc so với tư thế đứng
  const bones = data.map(({ name }) => Object.assign(new Bone(), { name }))
  const rest = {}
  data.forEach(({ name, parent, position }, i) => {
    rest[name] = new Vector3(...position)
    const origin = parent >= 0 ? data[parent].position : [0, 0, 0]
    bones[i].position.set(position[0] - origin[0], position[1] - origin[1], position[2] - origin[2])
    if (parent >= 0) bones[parent].add(bones[i])
  })
  const bone = Object.fromEntries(bones.map((item) => [item.name, item]))
  const skeleton = new Skeleton(bones)

  // Lưới gốc + màu theo kiểu nhìn (tiến hóa ngả màu hào quang, bóng đen cho loài chưa có)
  const base = keep(new BufferGeometry())
  base.setAttribute('position', new BufferAttribute(mesh.positions, 3))
  base.setAttribute('normal', new BufferAttribute(mesh.normals, 3))
  base.setAttribute('color', new BufferAttribute(colorsFor(mesh.colors, look, species.aura), 3))
  base.setAttribute('furLength', new BufferAttribute(mesh.furLength, 1))
  base.setAttribute('furStiff', new BufferAttribute(mesh.furStiff, 1))
  base.setAttribute('furComb', new BufferAttribute(mesh.comb, 3))
  base.setAttribute('furAo', new BufferAttribute(mesh.ao, 1))
  base.setAttribute('skinIndex', new Uint16BufferAttribute(mesh.skinIndex, 4))
  base.setAttribute('skinWeight', new BufferAttribute(mesh.skinWeight, 4))
  base.setIndex(new BufferAttribute(mesh.indices, 1))

  const material = keep(furMaterial({ density: breed.fur.density, curl: breed.fur.curl, glow: look === 'evolved' ? species.aura : null, spineDensity: breed.spines?.density, sheen: breed.fur.sheen, tipDark: breed.fur.tipDark }))
  const fur = new SkinnedMesh(keep(furGeometry(base, furLayers)), material)
  fur.frustumCulled = false
  fur.raycast = () => {} // bấm chuột dùng khối bao đơn giản bên dưới cho nhẹ
  fur.add(bones[0])
  fur.bind(skeleton)
  // Bản lưới vô hình chỉ để đổ bóng (bóng của 32 lớp lông thì thừa)
  const shadow = new SkinnedMesh(base, keep(new MeshBasicMaterial({ colorWrite: false, depthWrite: false })))
  shadow.castShadow = true
  shadow.frustumCulled = false
  shadow.raycast = () => {}
  shadow.bind(skeleton)

  const root = new Group()
  root.add(fur, shadow)
  const attach = (boneName, object, modelPosition) => {
    object.position.copy(modelPosition).sub(rest[boneName])
    bone[boneName].add(object)
    return object
  }
  const silhouette = look === 'silhouette'
  const tone = (hex) => (silhouette ? SILHOUETTE : hex)
  const mw = breed.head.muzzleWidth

  // Mắt: nhãn cầu bóng ướt có mống mắt, mí trên/mí dưới khép lại khi chớp
  const iris = keep(irisTexture(tone(breed.eyes.color), breed.eyes.slit, traits.sclera))
  const eyeMaterial = keep(new MeshPhysicalMaterial({ map: iris, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.02 }))
  const lidColor = traits.lid === 'fur' ? colorNear(mesh, head.eyes[0].center, head.eyes[0].radius * 2.5) : traits.lid
  const lidMaterial = keep(new MeshStandardMaterial({ color: tone(lidColor), roughness: 0.8 }))
  const eyes = head.eyes.map(({ side, center, radius }) => {
    // Nhãn cầu nằm lùi trong hốc mắt, chỉ phần trước nhô ra giữa hai mí
    const pivot = attach('head', new Object3D(), new Vector3(...center).add(new Vector3(side * radius * 0.05, 0, -radius * 0.15)))
    pivot.rotation.y = side * traits.eyeAngle // thỏ, capybara mắt nằm hẳn hai bên đầu
    const gaze = new Object3D()
    gaze.add(new Mesh(keep(new SphereGeometry(radius, 32, 24)), eyeMaterial))
    const upper = new Mesh(keep(new SphereGeometry(radius * 1.14, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2)), lidMaterial)
    const lower = new Mesh(keep(new SphereGeometry(radius * 1.12, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)), lidMaterial)
    pivot.add(gaze, upper, lower)
    return { side, gaze, upper, lower }
  })

  // Mũi bóng ướt (lưới dựng sẵn trong worker, đã ở tọa độ mô hình)
  const noseGeometry = keep(new BufferGeometry())
  noseGeometry.setAttribute('position', new BufferAttribute(nose.positions, 3))
  noseGeometry.setAttribute('normal', new BufferAttribute(nose.normals, 3))
  noseGeometry.setIndex(new BufferAttribute(nose.indices, 1))
  attach('head', new Mesh(noseGeometry, keep(new MeshPhysicalMaterial({ color: tone(breed.nose), roughness: 0.42, clearcoat: 0.8, clearcoatRoughness: 0.25 }))), new Vector3())

  // Miệng: khoang miệng tối, lưỡi gắn hàm dưới, răng nanh
  const tip = new Vector3(...head.muzzleTip)
  const muzzleBase = new Vector3(...head.muzzleBase)
  const mouthLength = Math.max(tip.distanceTo(muzzleBase), mw)
  const mouthCenter = tip.clone().lerp(muzzleBase, 0.45).add(new Vector3(0, -mw * 0.72, 0))
  const interior = attach('head', new Mesh(keep(new SphereGeometry(1, 20, 14)), keep(new MeshStandardMaterial({ color: tone('#4a1a1f'), roughness: 0.6 }))), mouthCenter)
  interior.scale.set(mw * 0.55, mw * 0.3, mouthLength * 0.55)
  const tongue = attach('jaw', new Object3D(), mouthCenter.clone().add(new Vector3(0, -mw * 0.08, 0)))
  const tongueMesh = new Mesh(keep(new CapsuleGeometry(mw * 0.3, mouthLength * 0.7, 6, 12)), keep(new MeshPhysicalMaterial({ color: tone('#e46d7c'), roughness: 0.35, clearcoat: 0.4 })))
  tongueMesh.rotation.x = Math.PI / 2
  tongueMesh.scale.set(1, 1, 0.35)
  tongue.add(tongueMesh)
  const toothMaterial = keep(new MeshStandardMaterial({ color: tone('#f6f1e7'), roughness: 0.25 }))
  // Răng nanh chỉ hiện khi há miệng (khi ngậm thì nằm sau môi)
  const teeth = []
  if (traits.teeth === 'incisor') {
    // Thú gặm nhấm (thỏ, hamster, capybara): hai răng cửa trắng ngà luôn lộ dưới môi trên
    const incisor = keep(new BoxGeometry(mw * 0.16, mw * 0.3, mw * 0.07))
    for (const side of [1, -1]) attach('head', new Mesh(incisor, toothMaterial), tip.clone().add(new Vector3(side * mw * 0.085, -mw * (round ? 0.6 : 0.85), mw * (round ? 0.08 : 0.3))))
  } else {
    const tooth = keep(new ConeGeometry(mw * (round ? 0.06 : 0.085), mw * (round ? 0.3 : 0.36), 10))
    for (const side of [1, -1]) {
      const upperTooth = attach('head', new Mesh(tooth, toothMaterial), tip.clone().add(new Vector3(side * mw * 0.42, -mw * 0.66, -mw * 0.35)))
      upperTooth.rotation.x = Math.PI
      teeth.push(upperTooth, attach('jaw', new Mesh(tooth, toothMaterial), new Vector3(...head.jawTip).add(new Vector3(side * mw * 0.32, mw * 0.3, -mw * 0.2))))
    }
  }

  // Móng chân (chó, capybara, nhím; mèo thu móng vào trong, thỏ và hamster lông phủ)
  if (traits.claws) {
    const paw = breed.leg.paw
    const claw = keep(new ConeGeometry(paw * 0.07, paw * 0.3, 6))
    const clawMaterial = keep(new MeshStandardMaterial({ color: tone('#3a3330'), roughness: 0.4 }))
    for (const leg of LEG_NAMES) {
      const side = leg[1] === 'L' ? 1 : -1
      const p4 = new Vector3(...joints[`${leg}4`])
      for (const [i, dx] of [-1.5, -0.5, 0.5, 1.5].entries()) {
        const outer = i === 0 || i === 3
        const at = p4.clone().add(new Vector3(side * dx * paw * 0.42, -paw * 0.27, paw * (outer ? 0.9 : 1.15)))
        attach(`${leg}4`, new Mesh(claw, clawMaterial), at).rotation.x = Math.PI / 2 + 0.5
      }
    }
  }

  // Ria mép và ria lông mày
  attach('head', new Mesh(keep(whiskerGeometry(head, mw, traits.whiskers, round)), keep(new MeshStandardMaterial({ color: tone(round ? '#f4f1ea' : '#2b2420'), roughness: 0.5 }))), new Vector3())

  // Điểm neo trang bị (khung đơn vị như Accessories.jsx mô tả)
  // Đồ nằm trên lớp lông / gai (nhím gai dài nên mũ, balo phải nâng lên); thú gần như không có cổ (hamster, nhím)
  // thì khăn, vòng cổ giới hạn theo cỡ đầu để không trùm cả thân
  const hw = breed.head.width
  const furTop = Math.max(breed.fur.length, (breed.spines?.length ?? 0) * 0.7)
  const anchors = {
    head: attach('head', new Object3D(), new Vector3(...head.skull).add(new Vector3(0, hw * 0.95 + furTop * 0.6, -breed.head.length * 0.15))),
    neck: attach('neck1', new Object3D(), new Vector3(...joints.neckMid)),
    back: attach('chest', new Object3D(), new Vector3(0, breed.withers + 0.01 + furTop * 0.8, joints.chest[2] - breed.length * 0.25)),
  }
  anchors.head.scale.setScalar((hw + furTop * 0.4) * 2)
  anchors.back.scale.setScalar(breed.chestWidth * 2)
  const neckAxis = new Vector3(...joints.head).sub(new Vector3(...joints.neckBase)).normalize()
  const throat = new Vector3(0, 0, 1).addScaledVector(neckAxis, -neckAxis.z).normalize()
  anchors.neck.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(new Vector3().crossVectors(throat, neckAxis), throat, neckAxis))
  anchors.neck.scale.setScalar(Math.min(breed.neck.thickness * 1.05 + breed.fur.length * 0.9, hw * 1.6))

  // Khối bao vô hình để bấm vào thú
  const hitbox = new Mesh(keep(new SphereGeometry(1, 12, 8)), keep(new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })))
  hitbox.scale.set(breed.chestWidth * 1.8, breed.withers * 0.65, breed.length * 0.9)
  hitbox.position.set(0, breed.withers * 0.62, 0)
  root.add(hitbox)

  // Dữ liệu cho IK từng chân: độ dài đoạn, hướng nghỉ, hướng gập khớp giữa
  const legs = LEG_NAMES.map((leg) => {
    const r = [1, 2, 3, 4].map((i) => rest[`${leg}${i}`])
    return {
      leg,
      bones: [1, 2, 3, 4].map((i) => bone[`${leg}${i}`]),
      rest: r,
      lengths: [r[0].distanceTo(r[1]), r[1].distanceTo(r[2])],
      directions: [0, 1, 2].map((i) => r[i + 1].clone().sub(r[i]).normalize()),
      pastern: r[3].clone().sub(r[2]),
      pole: new Vector3(0, 0, leg[0] === 'F' ? -1 : 1), // khuỷu chân trước gập ra sau, gối chân sau hướng ra trước
    }
  })

  return {
    root,
    fur,
    bone,
    rest,
    eyes,
    tongue,
    teeth,
    tongueRest: tongue.position.clone(),
    mouthLength,
    anchors,
    legs,
    breed,
    kind: traits.kind,
    gait: traits.gait,
    uniforms: material.userData.uniforms,
    longEars: breed.ears.type === 'rabbit',
    curlTail: breed.tail.shape === 'curl',
    dispose: () => disposables.forEach((item) => item.dispose()),
  }
}

// Màu đỉnh theo kiểu nhìn (mảng gốc dùng chung giữa các con cùng loài nên tạo bản sao khi đổi)
function colorsFor(colors, look, aura) {
  if (look === 'silhouette') {
    const c = new Color(SILHOUETTE)
    const result = new Float32Array(colors.length)
    for (let i = 0; i < result.length; i += 3) result.set([c.r, c.g, c.b], i)
    return result
  }
  if (look !== 'evolved') return colors
  const glow = new Color(aura)
  return colors.map((value, i) => value + ([glow.r, glow.g, glow.b][i % 3] - value) * 0.3)
}

// Màu lông trung bình (hex sRGB) của các đỉnh quanh một điểm, dùng cho mí mắt cùng màu lông quanh mắt
function colorNear({ positions, colors }, [x, y, z], radius) {
  const sum = [0, 0, 0]
  let count = 0
  for (let v = 0; v < positions.length / 3; v++) {
    if (Math.hypot(positions[v * 3] - x, positions[v * 3 + 1] - y, positions[v * 3 + 2] - z) > radius) continue
    for (let i = 0; i < 3; i++) sum[i] += colors[v * 3 + i]
    count++
  }
  const [r, g, b] = count ? sum.map((value) => value / count) : [0.5, 0.4, 0.3]
  return `#${new Color().setRGB(r, g, b).getHexString()}`
}

/**
 * Ảnh mống mắt trên nhãn cầu (UV của SphereGeometry: phía trước +z nằm ở u = 0,25, v = 0,5).
 * Vẽ theo góc so với trục nhìn: đồng tử (tròn hoặc khe dọc ở mèo), mống mắt có sợi tỏa tia, viền sẫm, phần lòng trắng
 * (sclera: thấy lòng trắng như mèo; không thì phần ngoài mống mắt sẫm như chó, thỏ).
 */
function irisTexture(hex, slit, sclera) {
  const width = 512
  const height = 256
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  const image = context.createImageData(width, height)
  const iris = new Color(hex)
  const irisSize = sclera ? 0.95 : 0.82 // bán kính góc của mống mắt (rad)
  for (let y = 0; y < height; y++) {
    const theta = (y / height) * Math.PI
    for (let x = 0; x < width; x++) {
      const phi = (x / width) * Math.PI * 2
      const dir = [-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta)]
      const angle = Math.acos(Math.min(1, dir[2]))
      const around = Math.atan2(dir[1], dir[0])
      const radial = angle / irisSize
      let rgb
      const pupilShape = slit ? Math.hypot(dir[0] / 0.22, dir[1]) : Math.hypot(dir[0], dir[1])
      if (pupilShape < (slit ? 0.62 : 0.36) && dir[2] > 0) rgb = [6, 5, 8]
      else if (radial < 1) {
        const fibers = 0.75 + 0.25 * Math.sin(around * 38 + Math.sin(around * 7) * 2) * Math.sin(radial * 9)
        const ring = 0.55 + 0.45 * Math.min(1, (1 - radial) * 5) // viền sẫm ngoài mép
        const inner = 1.15 - radial * 0.35
        rgb = [iris.r, iris.g, iris.b].map((c) => Math.min(255, Math.pow(c, 1 / 2.2) * 255 * fibers * ring * inner))
      } else {
        rgb = sclera ? [235, 225, 210] : [70, 45, 35] // lòng trắng (chó, thỏ hầu như chỉ thấy phần sẫm)
      }
      const o = (y * width + x) * 4
      image.data.set([rgb[0], rgb[1], rgb[2], 255], o)
    }
  }
  context.putImageData(image, 0, 0)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

// Ria: các sợi cong mảnh mọc từ đệm ria hai bên mõm, cộng vài sợi trên mí mắt; [count, length]: số sợi mỗi bên, độ dài
function whiskerGeometry(head, mw, [count, length], round) {
  const tip = new Vector3(...head.muzzleTip)
  const pieces = []
  const strand = (base, direction, length, droop, radius) => {
    const end = base.clone().addScaledVector(direction, length).add(new Vector3(0, -droop, 0))
    const middle = base.clone().addScaledVector(direction, length * 0.5).add(new Vector3(0, -droop * 0.2, 0))
    pieces.push(new TubeGeometry(new CatmullRomCurve3([base, middle, end]), 8, radius, 3))
  }
  const radius = mw * (round ? 0.015 : 0.009)
  for (const side of [1, -1]) {
    for (let i = 0; i < count; i++) {
      const base = tip.clone().add(new Vector3(side * mw * (round ? 0.6 : 0.62), -mw * (0.05 + i * 0.045), -mw * (round ? 0.25 : 0.45)))
      const direction = new Vector3(side, 0.18 - i * 0.07, round ? -0.25 : -0.1).normalize()
      strand(base, direction, length * (1 - i * 0.05), length * 0.09, radius)
    }
    for (const eye of head.eyes.filter((item) => item.side === side)) {
      for (let i = 0; i < 2; i++) {
        const base = new Vector3(...eye.center).add(new Vector3(side * eye.radius * (0.2 + i * 0.5), eye.radius * 1.5, 0))
        strand(base, new Vector3(side * 0.6, 0.7, 0.2).normalize(), length * 0.4, length * 0.03, radius * 0.8)
      }
    }
  }
  return mergeGeometries(pieces)
}

// ---- Diễn hoạt mỗi khung hình ----

function newMotion() {
  return {
    pose: { ...NEUTRAL },
    state: null,
    stateStart: 0,
    finished: false,
    cycle: 0,
    gesture: null,
    gestureTime: 0,
    nextGestureAt: 3,
    look: [0, 0],
    springs: {},
    lastPosition: null,
    drag: new Vector3(),
    from: null, // tư thế lúc vừa đổi trạng thái, trộn chéo sang tư thế mới
    heading: null,
    turn: 0,
  }
}

// Thời gian trộn chéo khi đổi trạng thái (giây)
const BLEND = 0.35

const temp = {
  camera: new Vector3(),
  look: new Vector3(),
  inverse: new Matrix4(),
  matrix: new Matrix4(),
  parent: new Quaternion(),
  q1: new Quaternion(),
  q2: new Quaternion(),
  q3: new Quaternion(),
  q4: new Quaternion(),
  local: new Quaternion(),
  p1: new Vector3(),
  target: new Vector3(),
  joint3: new Vector3(),
  dir: new Vector3(),
  pole: new Vector3(),
  u1: new Vector3(),
  u2: new Vector3(),
  u3: new Vector3(),
  knee: new Vector3(),
  pastern: new Vector3(),
  axisX: new Vector3(1, 0, 0),
  world: new Vector3(),
  worldQuat: new Quaternion(),
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

// Lò xo cho một giá trị theo khóa (đuôi, tai lắc theo quán tính)
function springTo(motion, key, target, delta, stiffness, damping) {
  const current = motion.springs[key] ?? [target, 0]
  motion.springs[key] = spring(current[0], current[1], target, delta, stiffness, damping)
  return motion.springs[key][0]
}

function animate(rig, motion, { state, speed, onFinished, now, delta, target }) {
  const { bone, breed } = rig
  const size = breed.withers
  if (motion.state !== state) {
    motion.from = motion.pose
    motion.state = state
    motion.stateStart = now
    motion.finished = false
    if (state !== 'idle') motion.gesture = null
  }
  const config = PET_STATES[state] ?? PET_STATES.idle
  if (config.once && !motion.finished && now - motion.stateStart >= config.duration) {
    motion.finished = true
    onFinished?.()
  }

  // Bước chân khớp tốc độ di chuyển: con nhỏ bước nhanh hơn, đi nhanh thì bước dài rồi tăng nhịp; thỏ nhảy xa, nhịp chậm hơn
  const running = state === 'run'
  const hopping = rig.gait === 'hop'
  const duty = DUTY[rig.gait][running ? 1 : 0]
  const baseFreq = (running ? 2.6 : 1.5) * (hopping ? 0.75 : 1) * Math.sqrt(0.55 / size)
  const maxStride = size * (running ? 1 : 0.6) * (hopping ? 1.5 : 1)
  const wanted = speed ?? (running ? size * 2.2 : size * 1)
  const freq = Math.max(baseFreq, (wanted * duty) / maxStride)
  const stride = clamp((wanted * duty) / freq, 0, maxStride)
  motion.cycle += delta * freq

  // Cử chỉ lúc rảnh: thỉnh thoảng ngồi, ngáp, gãi tai, đánh hơi, liếm lông…
  if (state === 'idle') {
    if (motion.gesture && now - motion.gestureTime > 10) motion.gesture = null
    if (!motion.gesture && now > motion.nextGestureAt) {
      motion.gesture = nextGesture(rig.kind, Math.random())
      motion.gestureTime = now
      motion.nextGestureAt = now + 8 + Math.random() * 6
    }
  }

  const ctx = { kind: rig.kind, gait: rig.gait, size, legs: breed.withers - breed.chestDepth, stride, freq, gesture: motion.gesture, gestureTime: motion.gestureTime }
  const time = config.once ? (now - motion.stateStart) / config.duration : state === 'walk' || running ? motion.cycle / freq : now
  // Tư thế bám đúng nhịp của trạng thái hiện tại (chân không bị trễ, không trượt); chỉ lúc vừa đổi trạng thái mới
  // trộn chéo từ tư thế cũ sang trong BLEND giây cho mượt
  let p = poseFor(state, time, ctx)
  if (motion.from) {
    const w = clamp((now - motion.stateStart) / BLEND, 0, 1)
    if (w < 1) p = blendPose(motion.from, p, w * w * (3 - 2 * w))
    else motion.from = null
  }
  motion.pose = p

  // Rẽ hướng: đo tốc độ quay của cả con thú; cột sống uốn vào trong, đầu ngó trước theo hướng rẽ, thân nghiêng nhẹ
  rig.root.getWorldQuaternion(temp.worldQuat)
  temp.dir.set(0, 0, 1).applyQuaternion(temp.worldQuat)
  const heading = Math.atan2(temp.dir.x, temp.dir.z)
  if (motion.heading !== null) {
    const change = Math.atan2(Math.sin(heading - motion.heading), Math.cos(heading - motion.heading)) / Math.max(delta, 1e-3)
    motion.turn += (clamp(change, -4, 4) - motion.turn) * Math.min(1, delta * 6)
  }
  motion.heading = heading
  const bend = clamp(motion.turn * 0.08, -0.3, 0.3)

  // Thân: nâng/hạ, xoay quanh khớp hông, cột sống, ngực; thở bằng nhịp nhấp nhô rất nhẹ của ngực
  const breath = Math.sin(now * Math.PI * (p.breath > 1.2 ? 1.2 : 2.2)) * 0.015 * p.breath
  bone.root.position.y = p.lift - p.sink
  bone.hips.rotation.set(p.hipsPitch, p.hipsYaw - bend * 0.3, p.hipsRoll - bend * 0.15)
  bone.spine.rotation.set(p.spinePitch + breath * 0.3, p.spineYaw + bend * 0.6, 0)
  bone.chest.rotation.set(p.chestPitch - breath, bend * 0.2, p.chestRoll)

  // Nhìn theo người chơi (camera hoặc điểm lookAt): tính hướng trong không gian mô hình, chia cho cổ và đầu, mắt liếc thêm
  rig.root.updateMatrixWorld()
  const cameraLocal = rig.root.worldToLocal(temp.look.copy(target))
  const headRest = rig.rest.head
  const dx = cameraLocal.x - headRest.x
  const dy = cameraLocal.y - headRest.y
  const dz = cameraLocal.z - headRest.z
  const lookYaw = clamp(Math.atan2(dx, dz), -1, 1) * p.look
  const lookPitch = clamp(-Math.atan2(dy, Math.hypot(dx, dz)), -0.5, 0.35) * p.look
  motion.look[0] += (lookYaw - motion.look[0]) * Math.min(1, delta * 4)
  motion.look[1] += (lookPitch - motion.look[1]) * Math.min(1, delta * 4)
  const [yaw, pitch] = motion.look
  bone.neck1.rotation.set(p.neckPitch * 0.5 + pitch * 0.3, yaw * 0.3 + bend * 0.3, 0)
  bone.neck2.rotation.set(p.neckPitch * 0.5 + pitch * 0.2, yaw * 0.25 + bend * 0.2, 0)
  bone.head.rotation.set(p.headPitch + pitch * 0.5, p.headYaw + yaw * 0.45 + bend * 0.3, p.headRoll)
  bone.jaw.rotation.x = p.jaw * 0.5
  rig.tongue.position.copy(rig.tongueRest).add(temp.dir.set(0, -rig.mouthLength * 0.12 * p.tongue, rig.mouthLength * 0.55 * p.tongue))
  rig.tongue.rotation.x = p.tongue * 0.5
  rig.tongue.visible = p.jaw > 0.04 || p.tongue > 0.04
  for (const tooth of rig.teeth) tooth.visible = p.jaw > 0.12

  for (const eye of rig.eyes) {
    eye.gaze.rotation.set(clamp(pitch * 0.6, -0.3, 0.3), clamp(yaw * 0.5 - eye.side * 0.1, -0.35, 0.35), 0)
    const closed = 1 - clamp(p.eyes, 0, 1) * (breed.eyes.open ?? 1) // capybara mắt lim dim
    eye.upper.rotation.x = -0.55 + closed * 1.3
    eye.lower.rotation.x = 0.45 - closed * 0.55
  }

  // Tai lắc theo quán tính khi đầu quay và khi thân nhấp nhô (tai dài của thỏ mềm, lắc nhiều hơn); dựng / cụp theo cảm xúc
  const headSpeed = (yaw - (motion.lastYaw ?? yaw)) / Math.max(delta, 1e-3)
  motion.lastYaw = yaw
  const liftSpeed = (p.lift - (motion.lastLift ?? p.lift)) / Math.max(delta, 1e-3)
  motion.lastLift = p.lift
  const [stiffness, damping, bounce] = rig.longEars ? [55, 5, 0.6] : [140, 10, 0.08]
  for (const [name, side] of [['earL', 1], ['earR', -1]]) {
    const back = (p.earsUp < 0 ? p.earsUp * 0.9 : p.earsUp * 0.15) - clamp(liftSpeed, -2, 2) * bounce
    bone[name].rotation.set(
      springTo(motion, `${name}x`, back, delta, stiffness, damping),
      0,
      springTo(motion, `${name}z`, side * Math.min(0, p.earsUp) * 0.35 - headSpeed * 0.01, delta, stiffness, damping),
    )
  }

  // Đuôi: đốt gốc theo tư thế, các đốt sau trễ dần theo lò xo nên đuôi uốn mềm như roi
  const curl = rig.curlTail ? 0.15 : 0
  bone.tail1.rotation.set(p.tailLift * (rig.curlTail ? 0.35 : 0.8), p.tailWag * 0.55, 0)
  for (const [i, name] of ['tail2', 'tail3', 'tail4'].entries()) {
    const lag = springTo(motion, `${name}y`, p.tailWag * 0.35, delta, 90 - i * 20, 7)
    bone[name].rotation.set(springTo(motion, `${name}x`, p.tailLift * 0.2 + p.tailCurl * 0.3 + curl, delta, 80, 8), lag, 0)
  }

  solveLegs(rig, p)

  // Lông rủ theo trọng lực và lay ngược hướng chạy (tính trong không gian của lưới lông)
  rig.fur.getWorldQuaternion(temp.worldQuat).invert()
  rig.uniforms.uGravity.value.set(0, -1, 0).applyQuaternion(temp.worldQuat)
  rig.fur.getWorldPosition(temp.world)
  if (motion.lastPosition) {
    const velocity = temp.dir.copy(temp.world).sub(motion.lastPosition).divideScalar(Math.max(delta, 1e-3))
    velocity.applyQuaternion(temp.worldQuat).multiplyScalar(-0.35)
    if (velocity.length() > 1.5) velocity.setLength(1.5)
    motion.drag.lerp(velocity, Math.min(1, delta * 5))
  }
  motion.lastPosition = (motion.lastPosition ?? new Vector3()).copy(temp.world)
  rig.uniforms.uDrag.value.copy(motion.drag)
}

/**
 * IK hai đoạn cho từng chân: đặt khớp cổ chân (khớp 3) sao cho bàn chân (khớp 4) tới đúng điểm đích trên sàn.
 * Đoạn 1–2 gập theo hướng "pole" (khuỷu ra sau, gối ra trước); ống chân dưới giữ hướng nghỉ, gập theo độ gập ngón.
 */
function solveLegs(rig, p) {
  rig.fur.updateMatrixWorld(true)
  temp.inverse.copy(rig.fur.matrixWorld).invert()
  for (const leg of rig.legs) {
    const [b1, b2, b3, b4] = leg.bones
    const [L1, L2] = leg.lengths
    const curl = p[`${leg.leg}curl`]
    // Điểm đích bàn chân (không xuống dưới sàn) và vị trí khớp 3 tương ứng
    temp.target.copy(leg.rest[3]).add(temp.dir.set(p[`${leg.leg}x`], p[`${leg.leg}y`], p[`${leg.leg}z`]))
    temp.target.y = Math.max(temp.target.y, leg.rest[3].y)
    temp.pastern.copy(leg.pastern).applyAxisAngle(temp.axisX, -curl * 0.9 * (leg.leg[0] === 'F' ? 1 : 0.6))
    temp.joint3.copy(temp.target).sub(temp.pastern)

    temp.p1.setFromMatrixPosition(b1.matrixWorld).applyMatrix4(temp.inverse)
    temp.dir.copy(temp.joint3).sub(temp.p1)
    const distance = clamp(temp.dir.length(), Math.abs(L1 - L2) + 1e-4, L1 + L2 - 1e-4)
    temp.dir.normalize()
    const cosA = clamp((L1 * L1 + distance * distance - L2 * L2) / (2 * L1 * distance), -1, 1)
    temp.pole.copy(leg.pole).addScaledVector(temp.dir, -leg.pole.dot(temp.dir)).normalize()
    temp.u1.copy(temp.dir).multiplyScalar(cosA).addScaledVector(temp.pole, Math.sqrt(1 - cosA * cosA))
    temp.knee.copy(temp.p1).addScaledVector(temp.u1, L1)
    temp.u2.copy(temp.p1).addScaledVector(temp.dir, distance).sub(temp.knee).normalize()
    temp.u3.copy(temp.pastern).normalize()

    // Góc xoay trong không gian mô hình → góc cục bộ so với xương cha
    temp.matrix.multiplyMatrices(temp.inverse, b1.parent.matrixWorld)
    temp.parent.setFromRotationMatrix(temp.matrix)
    temp.q1.setFromUnitVectors(leg.directions[0], temp.u1)
    b1.quaternion.copy(temp.local.copy(temp.parent).invert().multiply(temp.q1))
    temp.q2.setFromUnitVectors(leg.directions[1], temp.u2)
    b2.quaternion.copy(temp.local.copy(temp.q1).invert().multiply(temp.q2))
    temp.q3.setFromUnitVectors(leg.directions[2], temp.u3)
    b3.quaternion.copy(temp.local.copy(temp.q2).invert().multiply(temp.q3))
    temp.q4.setFromAxisAngle(temp.axisX, -curl * 0.6)
    b4.quaternion.copy(temp.local.copy(temp.q3).invert().multiply(temp.q4))
  }
}
