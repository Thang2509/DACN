import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Sparkles } from '@react-three/drei'
import { CanvasTexture, Color, MathUtils, Plane, Raycaster, Vector2, Vector3 } from 'three'
import ErrorBoundary, { SceneFallback } from '../../components/ErrorBoundary'
import Effects from './Effects'
import PetBody from './PetBody'
import { petBoost } from './anatomy'
import { RealisticLight } from './PetScene'

// Ba loài khởi đầu đứng trên bục, hơi quay vào giữa; height: chiều cao (đã gồm phóng to thú nhỏ) để đặt tim, chữ Z
const PETS = [
  { code: 'rabbit', position: [-0.6, 0, -0.1], turn: 0.45, height: 0.5, equipment: [{ slot: 'neck', code: 'bow_tie' }] },
  { code: 'shiba', position: [0, 0, 0.14], turn: 0, height: 0.75, equipment: [{ slot: 'head', code: 'party_hat' }, { slot: 'neck', code: 'scarf' }] },
  { code: 'tabby', position: [0.6, 0, -0.04], turn: -0.48, height: 0.55, equipment: [] },
]
// Trang chủ phóng thú nhỏ vừa phải: thỏ vẫn nhỏ hơn Shiba nhưng không bị lọt thỏm
const BOOST = 0.6
const CENTER = new Vector3(0, 0.42, 0)
const FOV = 32
const TAN_HALF_FOV = Math.tan(MathUtils.degToRad(FOV / 2))
const IDLE_SLEEP_MS = 20000 // để yên chuột 20 giây thì cả ba nằm ngủ, rê chuột là dậy
const FUR_LAYERS = 16 // ba thú cùng lúc nên dùng nửa số lớp lông so với trang thú cưng cho nhẹ máy

/**
 * Cảnh 3D ở khối mở đầu trang chủ: ba thú cưng quay đầu, liếc mắt theo chuột; rê chuột vào thì vui, bấm thì nhảy,
 * để yên lâu thì ngủ. progress: ref tiến độ cuộn 0 → 1 của khối mở đầu, camera bay theo.
 */
export default function HeroPets({ progress }) {
  const wrapper = useRef(null)
  const pointer = useRef(null) // chuột theo khung canvas, -1..1 (có thể vượt ra ngoài khi chuột ở ngoài khung)
  const target = useRef(null) // điểm trong cảnh mà các thú nhìn theo
  const [sleeping, setSleeping] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let lastMove = performance.now()
    const move = (event) => {
      const rect = wrapper.current.getBoundingClientRect()
      pointer.current = [((event.clientX - rect.left) / rect.width) * 2 - 1, 1 - ((event.clientY - rect.top) / rect.height) * 2]
      lastMove = performance.now()
      setSleeping(false)
    }
    const timer = setInterval(() => setSleeping(performance.now() - lastMove > IDLE_SLEEP_MS), 1000)
    // Cuộn qua hết khối mở đầu thì dừng vẽ cho nhẹ máy
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    observer.observe(wrapper.current)
    window.addEventListener('pointermove', move, { passive: true })
    return () => {
      clearInterval(timer)
      observer.disconnect()
      window.removeEventListener('pointermove', move)
    }
  }, [])

  return (
    <div ref={wrapper} className="absolute inset-0">
      <ErrorBoundary fallback={<SceneFallback />}>
        <Canvas flat frameloop={visible ? 'always' : 'never'} camera={{ fov: FOV, position: [0, 1, 5] }} dpr={[1, 1.5]}>
          <Background pointer={pointer} progress={progress} />
          <CameraRig pointer={pointer} progress={progress} />
          <LookTarget pointer={pointer} onTarget={(point) => (target.current = point)} />
          <RealisticLight effects={false} />
          <directionalLight position={[3, 5, 4]} intensity={1.4} color="#fff4e6" />
          <directionalLight position={[-4, 2, -3]} intensity={1.2} color="#9f8cff" />
          {PETS.map((pet) => <HeroPet key={pet.code} pet={pet} target={target} sleeping={sleeping} />)}
          <Podium />
          <Bubbles />
          <Sparkles count={40} scale={[7, 3.4, 4]} position={[0, 1.4, -0.6]} size={3.2} speed={0.35} color="#ffe2b8" />
        </Canvas>
      </ErrorBoundary>
    </div>
  )
}

// Một thú: rê chuột vào thì vui (vẫy đuôi, tim bay), bấm thì nhảy và bắn chùm tim
function HeroPet({ pet, target, sleeping }) {
  const [hover, setHover] = useState(false)
  const [jumping, setJumping] = useState(false)
  const [hearts, setHearts] = useState(0)
  const state = jumping ? 'jump' : sleeping ? 'sleep' : hover ? 'happy' : 'idle'

  useEffect(() => () => {
    document.body.style.cursor = ''
  }, [])

  return (
    <group position={pet.position} rotation-y={pet.turn}>
      <group
        onPointerOver={(event) => {
          event.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = ''
        }}
        onClick={(event) => {
          event.stopPropagation()
          setJumping(true)
          setHearts((count) => count + 1)
        }}
      >
        <group scale={petBoost(pet.code, BOOST)}>
          <PetBody species={pet.code} state={state} lookAt={target} furLayers={FUR_LAYERS} equipment={pet.equipment} onFinished={() => setJumping(false)} />
        </group>
      </group>
      <BlobShadow width={pet.height * 0.55} length={pet.height * 1.15} />
      <Effects height={pet.height} happy={hover && !sleeping} hearts={hearts} sleeping={sleeping && !jumping} />
    </group>
  )
}

// Chuột → một điểm trong cảnh trên mặt phẳng hướng về camera, nằm trước mặt các thú, để thú nhìn theo
function LookTarget({ pointer, onTarget }) {
  const camera = useThree((three) => three.camera)
  const tools = useMemo(() => ({ ray: new Raycaster(), plane: new Plane(), ndc: new Vector2(), normal: new Vector3(), point: new Vector3() }), [])

  useFrame(() => {
    if (!pointer.current) return
    const { ray, plane, ndc, normal, point } = tools
    camera.getWorldDirection(normal).negate()
    plane.setFromNormalAndCoplanarPoint(normal, point.copy(CENTER).addScaledVector(normal, 0.9))
    ray.setFromCamera(ndc.set(...pointer.current), camera)
    if (ray.ray.intersectPlane(plane, point)) onTarget(point.setY(MathUtils.clamp(point.y, 0.05, 2.4)))
  })
  return null
}

/**
 * Camera theo tiến độ cuộn: đầu trang nhìn chính diện, thú ở nửa phải (chữ ở trái); cuộn xuống thì bay vòng sang phải,
 * lại gần, thú sang nửa trái. Màn hẹp: thú ở nửa dưới, chữ ở trên. Chuột lệch nhẹ góc nhìn tạo chiều sâu.
 */
function CameraRig({ pointer, progress }) {
  const { camera, size } = useThree()
  const goal = useMemo(() => ({ position: new Vector3(), look: new Vector3(), current: CENTER.clone() }), [])

  useFrame((_, delta) => {
    const aspect = size.width / size.height
    const wide = aspect > 1.15
    const p = MathUtils.smoothstep(progress.current, 0, 1)
    const [mx, my] = pointer.current ?? [0, 0]
    const yaw = MathUtils.lerp(0, 0.6, p) + MathUtils.clamp(mx, -1, 1) * 0.07
    const pitch = MathUtils.lerp(0.2, 0.07, p) + MathUtils.clamp(my, -1, 1) * 0.04
    // Ba thú rộng khoảng 2 đơn vị: màn rộng cần nửa bề ngang khung ≥ 2.05 để thú lọt nửa khung, màn hẹp cần ≥ 1.1.
    // TAN_HALF_FOV × khoảng cách × tỉ lệ khung = nửa bề ngang khung nhìn
    const fit = wide ? MathUtils.clamp(2.05 / (TAN_HALF_FOV * aspect), 3.8, 6.5) : MathUtils.clamp(1.1 / (TAN_HALF_FOV * aspect), 4, 9)
    const distance = fit * MathUtils.lerp(1, 0.92, p)
    const halfWidth = distance * TAN_HALF_FOV * aspect
    const side = wide ? MathUtils.lerp(-0.48, 0.36, p) * halfWidth : 0
    const lift = wide ? 0 : distance * 0.16

    goal.look.set(Math.cos(yaw) * side, CENTER.y + lift, -Math.sin(yaw) * side)
    goal.position.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(distance).add(goal.look)
    const k = 1 - Math.exp(-delta * 4)
    camera.position.lerp(goal.position, k)
    goal.current.lerp(goal.look, k)
    camera.lookAt(goal.current)
  })
  return null
}

// Nền gradient tím có các đốm sáng trôi chậm, lệch theo chuột và đổi sắc khi cuộn (vẽ phủ kín màn hình, sau mọi vật)
const BACKGROUND_SHADER = {
  depthTest: false,
  depthWrite: false,
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uProgress;
    uniform vec3 uTop, uBottom, uPink, uWarm, uCyan;
    varying vec2 vUv;
    float glow(vec2 uv, vec2 center, float radius) {
      return smoothstep(radius, 0.0, distance(uv, center));
    }
    void main() {
      vec2 uv = vUv;
      vec3 color = mix(uBottom, uTop, smoothstep(0.0, 1.0, uv.y * 0.9 + uv.x * 0.25));
      float t = uTime * 0.12;
      vec2 m = uMouse * 0.06;
      color += uPink * 0.55 * glow(uv, vec2(0.78 + sin(t) * 0.06, 0.72 + cos(t * 1.3) * 0.05) - m, 0.45);
      color += uWarm * 0.35 * glow(uv, vec2(0.2 + cos(t * 0.8) * 0.05, 0.18 + uProgress * 0.3) + m * 1.5, 0.4);
      color += uCyan * 0.35 * glow(uv, vec2(0.55 + sin(t * 0.7) * 0.08 - uProgress * 0.3, 0.05 + cos(t) * 0.04) - m * 0.6, 0.5);
      // nhiễu hạt nhỏ để gradient không bị sọc
      color += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
      gl_FragColor = vec4(color, 1.0);
      #include <colorspace_fragment>
    }`,
}

function Background({ pointer, progress }) {
  const mesh = useRef(null)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new Vector2() },
      uProgress: { value: 0 },
      uTop: { value: new Color('#5b43e6') },
      uBottom: { value: new Color('#1d1548') },
      uPink: { value: new Color('#ff6fb5') },
      uWarm: { value: new Color('#ffad5c') },
      uCyan: { value: new Color('#3fc8ff') },
    }),
    [],
  )

  useFrame(({ clock }, delta) => {
    const { uTime, uProgress, uMouse } = mesh.current.material.uniforms
    uTime.value = clock.elapsedTime
    uProgress.value = progress.current
    const [mx, my] = pointer.current ?? [0, 0]
    uMouse.value.lerp({ x: MathUtils.clamp(mx, -1.5, 1.5), y: MathUtils.clamp(my, -1.5, 1.5) }, 1 - Math.exp(-delta * 2))
  })

  return (
    <mesh ref={mesh} renderOrder={-1} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial {...BACKGROUND_SHADER} uniforms={uniforms} />
    </mesh>
  )
}

// Bục kính tròn có viền sáng
function Podium() {
  return (
    <group>
      <mesh position-y={-0.09}>
        <cylinderGeometry args={[1.35, 1.45, 0.18, 72]} />
        <meshPhysicalMaterial color="#cfc6ff" roughness={0.12} clearcoat={1} transparent opacity={0.5} />
      </mesh>
      <mesh position-y={0.004} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.28, 1.34, 120]} />
        <meshBasicMaterial color="#e2d9ff" />
      </mesh>
    </group>
  )
}

// Bong bóng ánh cầu vồng lơ lửng quanh cảnh: [x, y, z, bán kính]
const BUBBLES = [[-2.4, 1.7, -1.6, 0.24], [2.5, 2.1, -2.1, 0.32], [1.75, 0.95, 0.7, 0.11], [-3.1, 2.5, -2.6, 0.36]]

function Bubbles() {
  return BUBBLES.map(([x, y, z, radius], i) => (
    <Float key={i} speed={1 + i * 0.17} floatIntensity={1.4} rotationIntensity={0.5}>
      <mesh position={[x, y, z]} scale={radius}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0.04}
          clearcoat={1}
          iridescence={1}
          iridescenceIOR={1.35}
          iridescenceThicknessRange={[120, 480]}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>
    </Float>
  ))
}

// Bóng mờ hình bầu dục dưới chân, vẽ sẵn một lần (nhẹ hơn nhiều so với bóng tính lại mỗi khung hình)
let shadowMap = null
function shadowTexture() {
  if (shadowMap) return shadowMap
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(30, 20, 70, 0.55)')
  gradient.addColorStop(1, 'rgba(30, 20, 70, 0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 64, 64)
  shadowMap = new CanvasTexture(canvas)
  return shadowMap
}

function BlobShadow({ width, length }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0.003} scale={[width, length, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={shadowTexture()} transparent depthWrite={false} />
    </mesh>
  )
}
