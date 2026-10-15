import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { CanvasTexture, MathUtils, SRGBColorSpace } from 'three'
import ErrorBoundary, { SceneFallback } from '../../components/ErrorBoundary'
import { daylight } from './daylight'
import Effects from './Effects'
import Furniture from './Furniture'
import PetBody from './PetBody'
import { petBoost, petSize } from './anatomy'
import { Egg, RealisticLight } from './PetScene'
import { MOODS, PET_STATES, SPECIES, STAGES } from './petStates'
import {
  BALL_RADIUS,
  besideCell,
  canPlace,
  CELL,
  cellAt,
  cellCenter,
  findPath,
  footprint,
  freeCells,
  GRID,
  occupancy,
  stepBall,
  throwVelocity,
} from './room'

const SIZE = GRID * CELL // sàn 4 × 4 đơn vị
const PET_HEIGHT = 0.55 // thú trưởng thành cao khoảng bằng cái ghế sofa
const BED_HEIGHT = 0.06
const CAMERA = [4.4, 4.2, 4.4]
const CLOSE_CAMERA = [0.55, 0.48, 0.68] // hướng nhìn gần (trang Thú cưng), độ xa nhân theo cỡ thú
const TOYS = ['teddy_bear', 'cardboard_box']

/**
 * Cảnh 3D phòng thú cưng, dựng hoàn toàn bằng code.
 * Bấm sàn: ném bóng cho thú nhặt (hoặc đặt món đang cầm khi có tool); bấm vào thú: vuốt ve.
 * command { type, id }: lệnh từ trang (nhảy, ăn, đi, chạy), id đổi là chạy lệnh mới.
 * follow: camera nhìn gần và trượt theo thú (trang Thú cưng); không có thì nhìn toàn phòng.
 * tool / hover / onHover / onFloorClick / onItemClick: chế độ sắp xếp đồ của trang Phòng.
 */
export default function RoomScene({
  layout,
  itemsById,
  pet,
  command = null,
  celebrate = false,
  hatching = false,
  follow = false,
  tool = null,
  hover = null,
  onHover,
  onFloorClick,
  onItemClick,
}) {
  const hour = useHour()
  const light = daylight(hour)
  const blocked = useMemo(() => occupancy(layout, itemsById).object, [layout, itemsById])
  const spots = useMemo(() => findSpots(layout, itemsById), [layout, itemsById])
  const ballRef = useRef(null)
  const petRef = useRef()
  const [ballThrown, setBallThrown] = useState(false)
  const ghost = tool && hover && { pet_item_id: tool.itemId, x: hover[0], z: hover[1], rotation: tool.rotation }
  // Thú càng nhỏ (mới nở) camera càng lại gần để vẫn thấy rõ lông, mặt
  const closeness = pet ? Math.min(3, Math.max(1, PET_HEIGHT * STAGES[pet.stage].scale * 4.5)) : 3

  const floorClick = (cell) => {
    if (tool) return onFloorClick?.(cell)
    // Ném từ phía camera, bóng rơi đúng ô được bấm sau 0,75 giây
    const [x, z] = cellCenter(...cell)
    const start = [x * 0.4 + 1.4, 1.3, z * 0.4 + 1.6]
    ballRef.current = { x: start[0], y: start[1], z: start[2], ...throwVelocity(start, [x, BALL_RADIUS, z], 0.75), held: false }
    setBallThrown(true)
  }

  return (
    <ErrorBoundary fallback={<SceneFallback />}>
      <Canvas shadows camera={{ position: follow ? CLOSE_CAMERA.map((v) => (v / 0.996) * closeness) : CAMERA, fov: 40 }} dpr={[1, 2]}>
        <color attach="background" args={[light.background]} />
        <RealisticLight night={light.night} />
        <hemisphereLight args={['#ffffff', '#c6caff', light.ambient * 0.55]} />
        <directionalLight
          castShadow
          position={light.sunPosition}
          intensity={light.sunIntensity}
          color={light.sunColor}
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-3}
          shadow-camera-right={3}
          shadow-camera-top={3}
          shadow-camera-bottom={-3}
          shadow-bias={-0.0004}
        />
        {/* Đèn trần ấm áp, sáng dần khi trời tối */}
        <pointLight position={[0, 1.9, 0.4]} color="#ffd59a" intensity={light.night * 1.1} distance={6} decay={1.2} />

        <RoomShell light={light} />
        <Floor onHover={onHover} onClick={floorClick} showGrid={!!tool} />

        {layout.map((placement, index) =>
          index === tool?.index ? null : (
            <PlacedItem
              key={`${index}-${placement.pet_item_id}`}
              item={itemsById[placement.pet_item_id]}
              placement={placement}
              night={light.night}
              onClick={onItemClick && (() => onItemClick(index))}
            />
          ),
        )}
        {ghost && <Ghost item={itemsById[tool.itemId]} placement={ghost} valid={canPlace(layout, itemsById, ghost, tool.index ?? -1)} night={light.night} />}

        {pet && (
          <PetActor
            key={pet.id}
            pet={pet}
            petRef={petRef}
            blocked={blocked}
            spots={spots}
            ballRef={ballRef}
            command={command}
            celebrate={celebrate}
            hatching={hatching}
          />
        )}
        {ballThrown && <Ball ballRef={ballRef} blocked={blocked} />}

        {follow && <FollowPet petRef={petRef} />}
        <OrbitControls
          makeDefault
          target={[0, 0.3, 0]}
          enablePan={false}
          minDistance={follow ? 0.6 : 4}
          maxDistance={follow ? 6 : 9}
          minPolarAngle={0.5}
          maxPolarAngle={1.25}
          minAzimuthAngle={-0.15}
          maxAzimuthAngle={Math.PI / 2 + 0.15}
        />
      </Canvas>
    </ErrorBoundary>
  )
}

// Điểm nhìn của camera trượt dần tới thú, camera dời theo cùng một khoảng nên góc nhìn người chơi chọn được giữ nguyên
function FollowPet({ petRef }) {
  useFrame(({ controls }, delta) => {
    const pet = petRef.current
    if (!controls || !pet) return
    const k = Math.min(1, delta * 2.5)
    const dx = (pet.position.x - controls.target.x) * k
    const dz = (pet.position.z - controls.target.z) * k
    controls.target.x += dx
    controls.target.z += dz
    controls.object.position.x += dx
    controls.object.position.z += dz
    controls.update()
  })
  return null
}

// Giờ hiện tại, cập nhật mỗi phút. Thêm ?gio=21 vào URL để xem thử ban đêm khi trình bày
function readHour() {
  const params = new URLSearchParams(window.location.search)
  if (params.has('gio')) return Math.min(24, Math.max(0, Number(params.get('gio')) || 0))
  const now = new Date()
  return now.getHours() + now.getMinutes() / 60
}

function useHour() {
  const [hour, setHour] = useState(readHour)
  useEffect(() => {
    const timer = setInterval(() => setHour(readHour()), 60000)
    return () => clearInterval(timer)
  }, [])
  return hour
}

// Chỗ thú tương tác: bát ăn, ổ nằm, đồ chơi (ô đặt của món đầu tiên mỗi loại)
function findSpots(layout, itemsById) {
  const spots = { bowl: null, bed: null, toys: [] }
  for (const placement of layout) {
    const code = itemsById[placement.pet_item_id]?.code
    const cell = [placement.x, placement.z]
    if (code === 'food_bowl') spots.bowl ??= cell
    if (code === 'pet_bed') spots.bed ??= cell
    if (TOYS.includes(code)) spots.toys.push(cell)
  }
  return spots
}

// Tường sau có cửa sổ (trời đổi theo giờ), tường trái, chân tường
function RoomShell({ light }) {
  const night = light.night > 0.5
  return (
    <group>
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[SIZE + 0.2, 0.12, SIZE + 0.2]} />
        <meshStandardMaterial color="#9c6d45" />
      </mesh>
      <mesh position={[0, 0.7, -SIZE / 2 - 0.05]} receiveShadow>
        <boxGeometry args={[SIZE + 0.2, 1.4, 0.1]} />
        <meshStandardMaterial color="#f3e6ff" />
      </mesh>
      <mesh position={[-SIZE / 2 - 0.05, 0.7, 0]} receiveShadow>
        <boxGeometry args={[0.1, 1.4, SIZE]} />
        <meshStandardMaterial color="#e6dcff" />
      </mesh>
      {[
        [0, -SIZE / 2 + 0.01, SIZE, 0.03],
        [-SIZE / 2 + 0.01, 0, 0.03, SIZE],
      ].map(([x, z, w, d]) => (
        <mesh key={x} position={[x, 0.04, z]}>
          <boxGeometry args={[w, 0.08, d]} />
          <meshStandardMaterial color="#8a6a4a" />
        </mesh>
      ))}

      {/* Cửa sổ: bầu trời, mặt trời hoặc trăng và sao */}
      <group position={[0.9, 0.86, -SIZE / 2 + 0.006]}>
        <mesh>
          <planeGeometry args={[1, 0.62]} />
          <meshBasicMaterial color={light.sky} />
        </mesh>
        <mesh position={night ? [0.28, 0.14, 0.002] : [-0.25, 0.05 + light.sun * 0.12, 0.002]}>
          <circleGeometry args={[night ? 0.07 : 0.09, 24]} />
          <meshBasicMaterial color={night ? '#fff6d6' : '#fff1a8'} />
        </mesh>
        {night &&
          STARS.map(([x, y]) => (
            <mesh key={`${x},${y}`} position={[x, y, 0.002]}>
              <circleGeometry args={[0.008, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          ))}
        {[[0, 0.33, 1.08, 0.05], [0, -0.33, 1.08, 0.05], [-0.52, 0, 0.05, 0.7], [0.52, 0, 0.05, 0.7], [0, 0, 0.03, 0.62]].map(([x, y, w, h]) => (
          <mesh key={`${x},${y},${w}`} position={[x, y, 0.01]}>
            <boxGeometry args={[w, h, 0.03]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

const STARS = [[-0.4, 0.2], [-0.25, 0.1], [-0.1, 0.24], [0.05, 0.12], [0.15, 0.25], [-0.35, -0.05], [0.4, -0.1], [-0.05, -0.12], [0.22, -0.2]]

// Sàn gỗ lát ván; khi đang đặt đồ thì hiện lưới ô. Nhận sự kiện chuột để chọn ô
function Floor({ onHover, onClick, showGrid }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 512
    const context = canvas.getContext('2d')
    const PLANKS = 8
    for (let row = 0; row < PLANKS; row++) {
      const offset = (row % 2) * 128
      for (let x = -offset; x < 512; x += 256) {
        context.fillStyle = ['#e2b98b', '#dcb084', '#e8c296', '#d9ab7d'][(row + Math.floor(x / 256) + 2) % 4]
        context.fillRect(x, row * 64, 256, 64)
        context.strokeStyle = '#b98a5e'
        context.lineWidth = 2
        context.strokeRect(x, row * 64, 256, 64)
      }
    }
    const result = new CanvasTexture(canvas)
    result.colorSpace = SRGBColorSpace
    return result
  }, [])
  const cellOf = (event) => cellAt(event.point.x, event.point.z)

  return (
    <>
      <mesh
        rotation-x={-Math.PI / 2}
        position-y={0.001}
        receiveShadow
        onPointerMove={(event) => onHover?.(cellOf(event))}
        onPointerOut={() => onHover?.(null)}
        onClick={(event) => {
          if (event.delta > 4) return // vừa kéo xoay camera, không phải bấm
          event.stopPropagation()
          onClick(cellOf(event))
        }}
      >
        <planeGeometry args={[SIZE, SIZE]} />
        <meshStandardMaterial map={texture} roughness={0.7} />
      </mesh>
      {showGrid && <gridHelper args={[SIZE, GRID, '#8a6a4a', '#8a6a4a']} position-y={0.006} />}
    </>
  )
}

function PlacedItem({ item, placement, night, onClick }) {
  const [width, depth] = footprint(item, placement.rotation)
  const [x, z] = cellCenter(placement.x, placement.z, width, depth)

  return (
    <group
      position={[x, 0, z]}
      rotation-y={(placement.rotation * Math.PI) / 2}
      onClick={
        onClick &&
        ((event) => {
          if (event.delta > 4) return
          event.stopPropagation()
          onClick()
        })
      }
    >
      <Furniture code={item.code} night={night} />
    </group>
  )
}

// Món đang cầm: hiện ở ô dưới chuột, nền xanh nếu đặt được, đỏ nếu không
function Ghost({ item, placement, valid, night }) {
  const [width, depth] = footprint(item, placement.rotation)
  const [x, z] = cellCenter(placement.x, placement.z, width, depth)

  return (
    <>
      <mesh position={[x, 0.012, z]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[width * CELL, depth * CELL]} />
        <meshBasicMaterial color={valid ? '#16a34a' : '#e11d48'} transparent opacity={0.4} />
      </mesh>
      <PlacedItem item={item} placement={placement} night={night} />
    </>
  )
}

// Quả bóng: tự mô phỏng rơi, nảy, lăn (room.js); khi thú ngậm thì thú điều khiển vị trí
function Ball({ ballRef, blocked }) {
  const mesh = useRef()
  useFrame((_, delta) => {
    const ball = ballRef.current
    if (!ball) return
    if (!ball.held) Object.assign(ball, stepBall(ball, Math.min(delta, 0.05), blocked))
    mesh.current.position.set(ball.x, ball.y, ball.z)
    mesh.current.rotation.x += (ball.vz * delta) / BALL_RADIUS
    mesh.current.rotation.z -= (ball.vx * delta) / BALL_RADIUS
  })
  return (
    <mesh ref={mesh} castShadow>
      <sphereGeometry args={[BALL_RADIUS, 20, 14]} />
      <meshStandardMaterial color="#ff5c5c" roughness={0.45} />
    </mesh>
  )
}

// Ô trống gần giữa phòng nhất làm chỗ đứng ban đầu của thú
function startCell(blocked) {
  const cells = freeCells(blocked)
  cells.sort((a, b) => Math.hypot(a[0] - 3.5, a[1] - 3.5) - Math.hypot(b[0] - 3.5, b[1] - 3.5))
  return cells[0] ?? [0, 0]
}

const sameCell = (a, b) => a && b && a[0] === b[0] && a[1] === b[1]
const pick = (list) => list[Math.floor(Math.random() * list.length)]

/**
 * Thú tự hoạt động trong phòng. Ưu tiên: ngủ (về ổ nằm) → lệnh từ trang (ăn ở bát, nhảy, đi, chạy vòng)
 * → được vuốt ve → đuổi bóng, ngậm về trước mặt người chơi → rảnh thì đi dạo, ghé chơi đồ chơi.
 * Vị trí cập nhật mỗi khung hình qua ref; chỉ đổi state khi đổi tư thế (để đổi hoạt ảnh, hiệu ứng).
 */
function PetActor({ pet, petRef, blocked, spots, ballRef, command, celebrate, hatching }) {
  const inner = useRef()
  const [pose, setPose] = useState('idle')
  const [hearts, setHearts] = useState(0)
  const [start] = useState(() => cellCenter(...startCell(blocked)))
  const species = SPECIES[pet.species.code] ? pet.species.code : 'shiba'
  const scale = STAGES[pet.stage].scale
  // Thú nhỏ (thỏ, hamster, nhím) phóng nhẹ cho dễ thấy, vẫn nhỏ hơn chó
  const height = PET_HEIGHT * scale * petBoost(species, 0.5)
  // Tốc độ theo cỡ thú thật (đơn vị cảnh/giây): con nhỏ đi chậm, bước chân khớp quãng đường
  const WALK_SPEED = (0.15 + height * 1.05) * Math.sqrt(petSize(species) / 0.5)
  const RUN_SPEED = WALK_SPEED * 2.2
  const brain = useRef({ mode: 'idle', path: [], speed: WALK_SPEED, wait: 1.5, until: 0, arrive: null, face: null, command: command?.id })
  const moodPose = MOODS[pet.mood]?.state ?? 'idle'
  const frontCell = useMemo(() => {
    const cells = freeCells(blocked)
    cells.sort((a, b) => Math.hypot(a[0] - 6, a[1] - 6) - Math.hypot(b[0] - 6, b[1] - 6))
    return cells[0] ?? [GRID - 1, GRID - 1]
  }, [blocked])

  useFrame(({ clock }, delta) => {
    const body = petRef.current
    const b = brain.current
    const now = clock.elapsedTime
    const here = cellAt(body.position.x, body.position.z)
    const ballState = ballRef.current
    b.now = now

    // Nhóm bên trong "bật" ra khi mới xuất hiện / vừa nở
    const current = inner.current.scale.x
    inner.current.scale.setScalar(current + (1 - current) * Math.min(1, delta * 6))
    if (hatching) return

    const act = (mode, nextPose, seconds = 0) => {
      b.mode = mode
      b.path = []
      b.until = now + seconds
      setPose(nextPose)
    }
    // Đi tới ô đích theo đường ngắn nhất; through: ô có đồ nhưng cho phép bước lên (ổ nằm)
    const goTo = (cell, mode, speed, arrive, through = null) => {
      let walls = blocked
      if (through) {
        walls = new Set(blocked)
        walls.delete(through.join(','))
      }
      const path = sameCell(here, cell) ? [] : findPath(walls, here, cell)
      b.mode = mode
      b.speed = speed
      b.arrive = arrive
      b.path = path ?? []
      if (b.path.length) setPose(speed > WALK_SPEED ? 'run' : 'walk')
      else if (arrive) arrive()
      else act('idle', moodPose)
    }
    const faceTowards = (x, z) => (b.face = Math.atan2(x - body.position.x, z - body.position.z))
    const eat = () => {
      if (spots.bowl) faceTowards(...cellCenter(...spots.bowl))
      act('eat', 'eat', 3.5)
    }

    // 1) Ngủ: về ổ nằm (nếu có) rồi nằm; thức dậy thì về trạng thái rảnh
    if (pet.is_sleeping) {
      if (b.mode !== 'sleep' && b.mode !== 'toBed') {
        if (ballState?.held) ballState.held = false
        if (spots.bed && !sameCell(here, spots.bed)) goTo(spots.bed, 'toBed', WALK_SPEED, () => act('sleep', 'sleep'), spots.bed)
        else act('sleep', 'sleep')
      }
    } else if (b.mode === 'sleep' || b.mode === 'toBed') {
      act('idle', moodPose)
      b.wait = 1
    }

    // 2) Lệnh mới từ trang
    if (command && command.id !== b.command && !pet.is_sleeping) {
      b.command = command.id
      if (ballState?.held) ballState.held = false
      if (command.type === 'eat') {
        const spot = spots.bowl && besideCell(blocked, spots.bowl, here)
        if (spot) goTo(spot, 'toBowl', WALK_SPEED, eat)
        else eat()
      } else if (command.type === 'jump') {
        act('trick', 'jump', PET_STATES.jump.duration)
      } else if (command.type === 'run') {
        b.laps = 3
        goTo(pick(freeCells(blocked)), 'zoomies', RUN_SPEED, null)
      } else {
        goTo(pick(freeCells(blocked)), 'walk', WALK_SPEED, null)
      }
    }

    // 3) Bóng: chạy tới khi bóng đã chạm sàn, ngậm lên, mang về ô gần người chơi rồi thả xuống
    const busy = ['sleep', 'toBed', 'eat', 'toBowl', 'trick', 'zoomies'].includes(b.mode)
    if (ballState && !busy) {
      if (b.mode === 'carry') {
        const reach = height * 0.45
        ballState.x = body.position.x + Math.sin(body.rotation.y) * reach
        ballState.z = body.position.z + Math.cos(body.rotation.y) * reach
        ballState.y = height * 0.42
      } else if (!ballState.held && !ballState.fetched && ballState.y < 0.2) {
        const dx = ballState.x - body.position.x
        const dz = ballState.z - body.position.z
        const distance = Math.hypot(dx, dz)
        const ballCell = cellAt(ballState.x, ballState.z)
        if (distance < 0.1 + height * 0.35 && Math.hypot(ballState.vx, ballState.vz) < 1.2) {
          ballState.held = true
          goTo(frontCell, 'carry', WALK_SPEED * 1.4, () => {
            // Thả bóng trước mặt người chơi; bóng chờ được ném lần nữa mới đuổi tiếp
            Object.assign(ballState, { held: false, fetched: true, vx: Math.sin(body.rotation.y) * 0.4, vz: Math.cos(body.rotation.y) * 0.4, vy: 0.5 })
            faceTowards(CAMERA[0], CAMERA[2])
            setHearts((value) => value + 1)
            act('play', 'happy', 1.4)
          })
        } else if (distance < CELL) {
          // Đã ở gần: tiến thẳng tới quả bóng (bóng có thể nằm lệch tâm ô, sát tường)
          b.mode = 'chase'
          b.path = []
          b.face = Math.atan2(dx, dz)
          body.position.x += (dx / distance) * RUN_SPEED * 0.5 * delta
          body.position.z += (dz / distance) * RUN_SPEED * 0.5 * delta
          if (pose !== 'run') setPose('run')
        } else if (b.mode !== 'chase' || !sameCell(b.target, ballCell) || !b.path.length) {
          b.target = ballCell
          goTo(ballCell, 'chase', RUN_SPEED, null, ballCell)
        }
      } else if (b.mode === 'chase') {
        act('idle', moodPose)
      }
    }

    // 4) Đi theo đường đã tìm
    if (b.path.length) {
      const [targetX, targetZ] = cellCenter(...b.path[0])
      const dx = targetX - body.position.x
      const dz = targetZ - body.position.z
      const distance = Math.hypot(dx, dz)
      const step = b.speed * delta
      b.face = Math.atan2(dx, dz)
      if (distance <= step) {
        body.position.x = targetX
        body.position.z = targetZ
        b.path.shift()
        if (!b.path.length) {
          const arrive = b.arrive
          b.arrive = null
          if (b.mode === 'zoomies' && --b.laps > 0) goTo(pick(freeCells(blocked)), 'zoomies', RUN_SPEED, null)
          else if (arrive) arrive()
          else act('idle', moodPose)
        }
      } else {
        body.position.x += (dx / distance) * step
        body.position.z += (dz / distance) * step
      }
    } else if (['eat', 'trick', 'play', 'petted'].includes(b.mode) && now > b.until) {
      act('idle', moodPose)
      b.wait = 1.5
    } else if (b.mode === 'idle') {
      // 5) Rảnh: đứng một lúc rồi đi dạo, đôi khi ghé chơi đồ chơi
      if (pose !== moodPose) setPose(moodPose)
      b.wait -= delta
      if (b.wait <= 0) {
        b.wait = 2 + Math.random() * 3
        const toy = spots.toys.length && Math.random() < 0.3 ? pick(spots.toys) : null
        const spot = toy && besideCell(blocked, toy, here)
        if (spot) {
          goTo(spot, 'walk', WALK_SPEED, () => {
            faceTowards(...cellCenter(...toy))
            act('play', 'happy', 1.6)
          })
        } else {
          const target = pick(freeCells(blocked))
          if (target) goTo(target, 'walk', WALK_SPEED, null)
        }
      }
    }

    // Quay dần về hướng cần nhìn; đứng trên ổ nằm thì cao hơn sàn một chút
    if (b.face !== null) {
      const turn = MathUtils.euclideanModulo(b.face - body.rotation.y + Math.PI, Math.PI * 2) - Math.PI
      body.rotation.y += turn * Math.min(1, delta * 8)
    }
    body.position.y = MathUtils.lerp(body.position.y, sameCell(here, spots.bed) ? BED_HEIGHT : 0, Math.min(1, delta * 6))
  })

  // Vuốt ve: vẫy đuôi, nhìn về phía người chơi, bắn chùm tim
  const pat = (event) => {
    event.stopPropagation()
    setHearts((value) => value + 1)
    const b = brain.current
    if (pet.is_sleeping || ['carry', 'toBowl', 'toBed', 'zoomies'].includes(b.mode)) return
    b.mode = 'petted'
    b.path = []
    b.until = (b.now ?? 0) + 1.8
    b.face = Math.atan2(CAMERA[0] - petRef.current.position.x, CAMERA[2] - petRef.current.position.z)
    setPose('happy')
  }

  return (
    <group ref={petRef} position={[start[0], 0, start[1]]}>
      {/* key đổi khi trứng nở: nhóm dựng lại từ tỉ lệ nhỏ nên thú "bật" ra khỏi trứng */}
      <group ref={inner} key={hatching ? 'egg' : 'pet'} scale={0.01}>
        {hatching ? (
          <group scale={height * 1.4}>
            <Egg color={pet.species.egg_color} progress={1} />
          </group>
        ) : (
          <group scale={height} onClick={pat}>
            <PetBody
              species={species}
              stage={pet.stage}
              look={pet.stage === 'evolved' ? 'evolved' : null}
              state={pose}
              speed={pose === 'walk' ? WALK_SPEED / height : pose === 'run' ? RUN_SPEED / height : null}
              equipment={pet.equipment ?? []}
            />
          </group>
        )}
      </group>
      {!hatching && (
        <Effects
          height={height}
          happy={pose === 'happy'}
          hearts={hearts}
          sleeping={pose === 'sleep'}
          sad={pet.mood === 'sad' && pose !== 'sleep'}
          eating={pose === 'eat'}
          running={pose === 'run'}
          evolved={pet.stage === 'evolved'}
          celebrate={celebrate}
          aura={SPECIES[species].aura}
        />
      )}
    </group>
  )
}
