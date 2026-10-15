import { useEffect, useMemo, useRef, useState } from 'react'
import ErrorBoundary, { SceneFallback } from '../../components/ErrorBoundary'
import { Canvas, useFrame } from '@react-three/fiber'
import { petBoost, petSize } from './anatomy'
import Effects from './Effects'
import { GRAVITY, JUMP_SPEED, nextGap, overlaps, runnerSpeed, seededRandom } from './minigames'
import { Bush, Clouds, Daylight, Flower, Ground, Hills, Rock, Scroller, Sky, Tree } from './Nature'
import PetBody from './PetBody'

const PET_X = -3
const SPAWN_X = 12
const POOL_SIZE = 6 // số chướng ngại tối đa cùng lúc trên màn hình
const SPAN = 36 // bề ngang các lớp cây, hoa trôi vòng lại

const random = (min, max) => min + Math.random() * (max - min)
// Chướng ngại: khúc gỗ nằm ngang, tảng đá, gốc cây cao thấp khác nhau, bụi cây; w, h: hộp va chạm
const OBSTACLE_TYPES = ['log', 'rock', 'stump', 'bush']
const OBSTACLE_SIZE = {
  log: () => ({ w: 0.5, h: 0.45 }),
  rock: () => ({ w: 0.7, h: 0.55 }),
  stump: () => ({ w: 0.5, h: random(0.55, 0.85) }),
  bush: () => ({ w: 0.75, h: 0.6 }),
}
const FLOWER_COLORS = ['#ff8fb8', '#ffd54f', '#ffffff', '#b39dff', '#ff9f6b']

/**
 * Vượt chướng ngại: thú chạy tại chỗ trên con đường đất giữa đồng cỏ; đường, cây, đồi trôi về phía thú
 * (lớp càng xa trôi càng chậm). Trạng thái game (vị trí, vận tốc, chướng ngại) nằm trong ref và cập nhật mỗi khung hình;
 * chỉ đổi state React khi bắt đầu / kết thúc để không render lại cả cảnh 60 lần mỗi giây.
 */
export default function RunnerGame({ pet, onGameOver }) {
  const [phase, setPhase] = useState('ready') // ready | playing | over
  const jumpRequest = useRef(false)
  const scoreText = useRef()

  const press = () => {
    if (phase === 'ready') setPhase('playing')
    else jumpRequest.current = true
  }

  useEffect(() => {
    const onKey = (event) => {
      if (event.code !== 'Space' && event.code !== 'ArrowUp') return
      event.preventDefault()
      if (phase === 'ready') setPhase('playing')
      else jumpRequest.current = true
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  const crash = (score, seconds) => {
    setPhase('over')
    onGameOver(score, seconds)
  }
  // Cảnh 3D hỏi "có vừa bấm nhảy không" mỗi khung hình; ref chỉ được đọc/ghi ở component sở hữu nó
  const takeJump = () => {
    const requested = jumpRequest.current
    jumpRequest.current = false
    return requested
  }
  const showScore = (value) => {
    scoreText.current.textContent = value
  }

  return (
    <div className="relative h-full select-none" onPointerDown={press}>
      {/* Camera nhìn hơi chếch xuống, đường chạy nằm ở nửa dưới khung hình */}
      <ErrorBoundary fallback={<SceneFallback />}>
        <Canvas flat camera={{ position: [0, 2.2, 7.5], fov: 42, far: 200 }} dpr={[1, 1.75]} onCreated={({ camera }) => camera.lookAt(0, 1.3, 0)}>
          <World pet={pet} phase={phase} takeJump={takeJump} showScore={showScore} onCrash={crash} />
        </Canvas>
      </ErrorBoundary>
      <div className="pointer-events-none absolute top-4 left-4 rounded-xl bg-card/90 px-4 py-2 text-lg font-extrabold shadow-card">
        Điểm: <span ref={scoreText}>0</span>
      </div>
      {phase === 'ready' && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <p className="rounded-2xl bg-card/95 px-6 py-4 text-center text-lg font-bold shadow-card">
            Bấm Space (hoặc chạm) để bắt đầu<br />
            <span className="text-sm font-semibold text-muted">Bấm lần nữa để nhảy qua khúc gỗ, tảng đá, bụi cây</span>
          </p>
        </div>
      )}
    </div>
  )
}

function World({ pet, phase, takeJump, showScore, onCrash }) {
  const body = useRef()
  const obstacles = useRef()
  const speed = useRef(0) // tốc độ chạy hiện tại, các lớp cảnh đọc để trôi theo
  const game = useRef({ time: 0, distance: 0, y: 0, vy: 0, untilNext: 6, list: [], over: false })
  const code = pet.species.code
  const scale = 0.85 * petBoost(code, 0.7) // thú nhỏ phóng to vừa phải cho dễ nhìn
  const petHeight = Math.max(0.4, petSize(code) * 1.5 * scale)

  // Cây hàng sau, bụi và đá hàng giữa, hoa ven đường: rải ngẫu nhiên một lần
  const scenery = useMemo(() => {
    const rand = seededRandom(7)
    const along = (count, i) => -SPAN / 2 + (i + rand(0, 0.7)) * (SPAN / count)
    return {
      trees: Array.from({ length: 14 }, (_, i) => ({ x: along(14, i), z: rand(-9, -5.5), scale: rand(0.9, 1.6), kind: rand() < 0.35 ? 'pine' : 'round', color: ['#5fae4f', '#4c9a43', '#7cc36a', '#3f8a46'][i % 4] })),
      middle: Array.from({ length: 12 }, (_, i) => ({ x: along(12, i), z: rand(-3.6, -2.2), scale: rand(0.7, 1.2), rock: rand() < 0.35 })),
      flowers: Array.from({ length: 26 }, (_, i) => ({ x: along(26, i), z: rand() < 0.5 ? rand(1.3, 2.4) : rand(-1.9, -1.25), color: FLOWER_COLORS[i % FLOWER_COLORS.length] })),
    }
  }, [])

  useFrame((_, delta) => {
    const state = game.current
    if (phase !== 'playing' || state.over) {
      speed.current = 0
      return
    }
    const dt = Math.min(delta, 0.05) // tab bị ẩn rồi mở lại: không nhảy cóc quá xa
    const current = runnerSpeed(state.time)
    speed.current = current
    state.time += dt
    state.distance += current * dt

    // Nhảy: chỉ khi đang chạm đất; trọng lực kéo xuống, chạm đất thì dừng
    if (takeJump() && state.y === 0) state.vy = JUMP_SPEED
    state.vy += GRAVITY * dt
    state.y = Math.max(0, state.y + state.vy * dt)
    if (state.y === 0) state.vy = 0
    body.current.position.y = state.y

    // Sinh chướng ngại mới sau một khoảng cách ngẫu nhiên, dời tất cả về phía thú
    state.untilNext -= current * dt
    if (state.untilNext <= 0) {
      const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)]
      state.list.push({ x: SPAWN_X, type, ...OBSTACLE_SIZE[type]() })
      state.untilNext = nextGap(current)
    }
    state.list.forEach((item) => (item.x -= current * dt))
    state.list = state.list.filter((item) => item.x > -10).slice(-POOL_SIZE)

    // Gán vị trí, kiểu cho các mesh dựng sẵn (không tạo mesh mới mỗi khung hình)
    obstacles.current.children.forEach((slot, i) => {
      const item = state.list[i]
      slot.visible = !!item
      if (!item) return
      slot.position.x = item.x
      slot.children.forEach((child, k) => (child.visible = OBSTACLE_TYPES[k] === item.type))
      if (item.type === 'stump') slot.children[2].scale.y = item.h
    })

    // Va chạm: hộp của thú so với hộp chướng ngại (thu nhỏ một chút cho dễ chịu)
    const petBox = { x: PET_X, y: state.y + petHeight * 0.5, w: 0.5, h: petHeight * 0.75 }
    const hit = state.list.some((item) => overlaps(petBox, { x: item.x, y: item.h / 2, w: item.w * 0.8, h: item.h * 0.9 }))
    showScore(Math.floor(state.distance))
    if (hit) {
      state.over = true
      speed.current = 0
      onCrash(Math.floor(state.distance), Math.max(1, Math.ceil(state.time)))
    }
  })

  return (
    <>
      <Daylight />
      <Sky />
      <Clouds speed={speed} />
      <Hills speed={speed} />
      <Ground speed={speed} />

      <Scroller speed={speed} factor={0.55} span={SPAN}>
        {scenery.trees.map((tree, i) => <Tree key={i} position={[tree.x, 0, tree.z]} scale={tree.scale} kind={tree.kind} color={tree.color} />)}
      </Scroller>
      <Scroller speed={speed} factor={0.85} span={SPAN}>
        {scenery.middle.map((item, i) => (item.rock ? <Rock key={i} position={[item.x, 0.15, item.z]} scale={item.scale} /> : <Bush key={i} position={[item.x, 0, item.z]} scale={item.scale} />))}
      </Scroller>
      <Scroller speed={speed} span={SPAN}>
        {scenery.flowers.map((flower, i) => <Flower key={i} position={[flower.x, 0, flower.z]} color={flower.color} />)}
      </Scroller>

      <group ref={obstacles}>
        {Array.from({ length: POOL_SIZE }, (_, i) => (
          <group key={i} visible={false}>
            <Log />
            <Rock position={[0, 0.26, 0]} scale={1.05} />
            <Stump />
            <Bush scale={1.1} />
          </group>
        ))}
      </group>

      {/* Thú nhìn theo trục +x (về phía chướng ngại đang tới); bụi tung sau chân khi chạy */}
      <group ref={body} position={[PET_X, 0, 0]} rotation-y={Math.PI / 2}>
        <group scale={scale}>
          <PetBody
            species={code}
            stage={pet.stage}
            look={pet.stage === 'evolved' ? 'evolved' : null}
            state={phase === 'playing' ? 'run' : phase === 'over' ? 'sad' : 'idle'}
            equipment={pet.equipment}
          />
        </group>
      </group>
      <group position={[PET_X, 0, 0]} rotation-y={Math.PI / 2}>
        <Effects height={petHeight} running={phase === 'playing'} sad={phase === 'over'} />
      </group>
    </>
  )
}

// Khúc gỗ nằm ngang chắn đường: thân vỏ nâu, hai đầu lộ vân gỗ sáng
function Log() {
  return (
    <group position-y={0.24} rotation-x={Math.PI / 2}>
      <mesh>
        <cylinderGeometry args={[0.24, 0.24, 1.4, 10]} />
        <meshStandardMaterial color="#8a5a36" roughness={0.9} flatShading />
      </mesh>
      {[0.701, -0.701].map((y) => (
        <mesh key={y} position-y={y} rotation-x={y > 0 ? -Math.PI / 2 : Math.PI / 2}>
          <circleGeometry args={[0.22, 16]} />
          <meshStandardMaterial color="#e2b47c" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

// Gốc cây cụt (cao 1 đơn vị, World phóng theo độ cao từng cái) có mặt cắt vân gỗ
function Stump() {
  return (
    <group>
      <mesh position-y={0.5}>
        <cylinderGeometry args={[0.24, 0.3, 1, 10]} />
        <meshStandardMaterial color="#7c5132" roughness={0.9} flatShading />
      </mesh>
      <mesh position-y={1.001} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.23, 16]} />
        <meshStandardMaterial color="#deb07a" roughness={0.8} />
      </mesh>
    </group>
  )
}
