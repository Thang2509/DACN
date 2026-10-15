import { useEffect, useMemo, useRef, useState } from 'react'
import ErrorBoundary, { SceneFallback } from '../../components/ErrorBoundary'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { petBoost } from './anatomy'
import { Bush, Clouds, Daylight, Fence, Flower, Ground, Hills, Sky, Tree } from './Nature'
import PetBody from './PetBody'
import { categoryAt, KEYWORD_GAME_SECONDS, KEYWORD_SETS, LIVES, randomWord, seededRandom } from './minigames'

const FIELD = 4.5 // thú đi trong khoảng x từ -4,5 tới 4,5
const PET_SPEED = 7
const CATCH_HEIGHT = 1.1 // chữ rơi tới ngang đầu thú thì xét có hứng được không
const CATCH_WIDTH = 0.9

/**
 * Hứng từ khóa code: chữ rơi từ trên xuống, chỉ hứng chữ thuộc chủ đề đang yêu cầu.
 * Đúng +10 điểm, sai mất 1 mạng; hết 60 giây hoặc hết mạng thì kết thúc.
 */
export default function KeywordGame({ pet, onGameOver }) {
  const [phase, setPhase] = useState('ready')
  const [words, setWords] = useState([])
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(LIVES)
  const [elapsed, setElapsed] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const targetX = useRef(0)
  const nextId = useRef(1)
  const reported = useRef(false)
  const category = categoryAt(elapsed)
  // Hết giờ hoặc hết mạng thì lượt chơi kết thúc (tính ngay khi render, không cần lưu state)
  const finished = phase === 'playing' && (lives <= 0 || elapsed >= KEYWORD_GAME_SECONDS)
  const playing = phase === 'playing' && !finished

  // Đồng hồ đếm giây khi đang chơi
  useEffect(() => {
    if (!playing) return
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => clearInterval(timer)
  }, [playing])

  // Báo điểm cho trang đúng một lần khi kết thúc
  useEffect(() => {
    if (finished && !reported.current) {
      reported.current = true
      onGameOver(score, Math.max(1, elapsed))
    }
  }, [finished, score, elapsed, onGameOver])

  const spawn = (speed) => {
    const word = { id: nextId.current++, ...randomWord(category), x: (Math.random() * 2 - 1) * FIELD, speed }
    setWords((list) => [...list, word])
  }
  const remove = (id) => setWords((list) => list.filter((word) => word.id !== id))
  const caught = (word) => {
    remove(word.id)
    if (word.correct) setScore((value) => value + 10)
    else setLives((value) => value - 1)
    setFeedback({ id: word.id, x: word.x, good: word.correct, text: word.correct ? `+10 ${word.text}` : `Sai: ${word.text}` })
  }

  // Rê chuột: thú chạy tới vị trí chuột theo chiều ngang
  const follow = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    targetX.current = (((event.clientX - rect.left) / rect.width) * 2 - 1) * FIELD * 1.15
  }

  return (
    <div
      className="relative h-full select-none"
      onPointerMove={follow}
      onPointerDown={() => phase === 'ready' && setPhase('playing')}
    >
      <ErrorBoundary fallback={<SceneFallback />}>
        <Canvas flat camera={{ position: [0, 3.2, 9], fov: 45, far: 200 }} dpr={[1, 1.75]} onCreated={({ camera }) => camera.lookAt(0, 2.8, 0)}>
          <Garden />
          <Field pet={pet} phase={finished ? 'over' : phase} words={words} targetX={targetX} elapsed={elapsed} onSpawn={spawn} onCatch={caught} onMiss={remove} />
          {feedback && <Burst key={feedback.id} seed={feedback.id} x={feedback.x} good={feedback.good} />}
        </Canvas>
      </ErrorBoundary>

      <div className="pointer-events-none absolute inset-x-4 top-4 flex flex-wrap items-center gap-2">
        <span className="rounded-xl bg-primary-600 px-4 py-2 font-extrabold text-white shadow-card">
          Hứng {KEYWORD_SETS[category].label}
        </span>
        <span className="rounded-xl bg-card/90 px-3 py-2 font-bold shadow-card">Điểm: {score}</span>
        <span className="rounded-xl bg-card/90 px-3 py-2 font-bold text-danger shadow-card">{'♥'.repeat(Math.max(0, lives))}</span>
        <span className="ml-auto rounded-xl bg-card/90 px-3 py-2 font-bold shadow-card">{Math.max(0, KEYWORD_GAME_SECONDS - elapsed)} giây</span>
      </div>
      {feedback && (
        <p key={feedback.id} className={`pointer-events-none absolute inset-x-0 bottom-6 animate-drop text-center text-lg font-extrabold ${feedback.good ? 'text-success' : 'text-danger'}`}>
          {feedback.text}
        </p>
      )}
      {phase === 'ready' && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <p className="rounded-2xl bg-card/95 px-6 py-4 text-center text-lg font-bold shadow-card">
            Chạm (hoặc bấm phím ←/→) để bắt đầu<br />
            <span className="text-sm font-semibold text-muted">Chủ đề đổi mỗi 20 giây, chú ý dòng chữ phía trên</span>
          </p>
        </div>
      )}
      <StartWithKeys phase={phase} onStart={() => setPhase('playing')} targetX={targetX} />
    </div>
  )
}

// Phím ← → (hoặc A, D) dời điểm đích của thú; bấm lần đầu thì bắt đầu chơi
function StartWithKeys({ phase, onStart, targetX }) {
  useEffect(() => {
    const onKey = (event) => {
      const step = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1 }[event.code]
      if (!step) return
      event.preventDefault()
      if (phase === 'ready') onStart()
      targetX.current = Math.max(-FIELD, Math.min(FIELD, targetX.current + step * 1.2))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, onStart, targetX])
  return null
}

// Khu vườn: trời xanh, mây trôi, đồi xa, hàng rào gỗ, cây sau rào, bụi và hoa hai bên lối đi
const GARDEN = {
  trees: [[-7, -5.5, 1.5, 'round'], [-4.2, -6.5, 1.8, 'pine'], [-1.5, -5.8, 1.3, 'round'], [1.6, -6.8, 1.9, 'pine'], [4.5, -5.6, 1.5, 'round'], [7.2, -6.4, 1.7, 'pine']],
  bushes: [[-6.4, -2.9, 1.1], [-2.8, -3.1, 0.9], [2.6, -3, 1], [6.2, -2.9, 1.2]],
  flowers: Array.from({ length: 18 }, (_, i) => [-7.5 + i * 0.9, i % 2 ? 1.7 : -1.6, ['#ff8fb8', '#ffd54f', '#ffffff', '#b39dff', '#ff9f6b'][i % 5]]),
}

function Garden() {
  return (
    <>
      <Daylight />
      <Sky />
      <Clouds />
      <Hills />
      <Ground />
      <Fence position={[0, 0, -2.4]} length={FIELD * 2 + 6} />
      {GARDEN.trees.map(([x, z, scale, kind], i) => <Tree key={i} position={[x, 0, z]} scale={scale} kind={kind} color={['#5fae4f', '#4c9a43', '#7cc36a'][i % 3]} />)}
      {GARDEN.bushes.map(([x, z, scale], i) => <Bush key={i} position={[x, 0, z]} scale={scale} />)}
      {GARDEN.flowers.map(([x, z, color], i) => <Flower key={i} position={[x, 0, z]} color={color} />)}
    </>
  )
}

// Hứng đúng: pháo giấy nhiều màu bung ra; hứng sai: làn khói xám phụt lên (tự tắt sau khoảng 1 giây)
const BURST_COLORS = ['#ff6fb5', '#ffd54f', '#5fd3ff', '#8ee07a', '#b39dff']
function Burst({ seed, x, good }) {
  const group = useRef(null)
  const pieces = useMemo(() => {
    const random = seededRandom(seed)
    return Array.from({ length: good ? 22 : 10 }, (_, i) => ({
      velocity: [random(-2, 2), random(2, 5), random(-1, 1)],
      spin: random(-6, 6),
      color: good ? BURST_COLORS[i % BURST_COLORS.length] : '#b7bac6',
    }))
  }, [seed, good])
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    group.current.children.forEach((piece, i) => {
      const { velocity, spin } = pieces[i]
      velocity[1] -= (good ? 6 : -1) * dt // pháo giấy rơi xuống, khói bay lên
      piece.position.x += velocity[0] * dt
      piece.position.y += velocity[1] * dt
      piece.position.z += velocity[2] * dt
      piece.rotation.x += spin * dt
      piece.scale.multiplyScalar(good ? 0.985 : 1.02)
      piece.material.opacity = Math.max(0, piece.material.opacity - dt * 1.1)
    })
  })
  return (
    <group ref={group} position={[x, CATCH_HEIGHT + 0.3, 0]}>
      {pieces.map((piece, i) => (
        <mesh key={i}>
          {good ? <planeGeometry args={[0.12, 0.08]} /> : <icosahedronGeometry args={[0.12, 1]} />}
          <meshStandardMaterial color={piece.color} transparent opacity={1} side={2} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function Field({ pet, phase, words, targetX, elapsed, onSpawn, onCatch, onMiss }) {
  const body = useRef()
  const petX = useRef(0)
  const untilSpawn = useRef(0.5)
  const [moving, setMoving] = useState(false)

  useFrame((_, delta) => {
    if (phase !== 'playing') return
    const dt = Math.min(delta, 0.05)

    // Thú chạy về điểm đích, quay mặt theo hướng chạy
    const target = Math.max(-FIELD, Math.min(FIELD, targetX.current))
    const gap = target - petX.current
    const step = Math.sign(gap) * Math.min(Math.abs(gap), PET_SPEED * dt)
    petX.current += step
    body.current.position.x = petX.current
    body.current.rotation.y = Math.abs(gap) > 0.05 ? Math.sign(gap) * (Math.PI / 2) : 0
    if (moving !== Math.abs(gap) > 0.05) setMoving(Math.abs(gap) > 0.05)

    // Chữ rơi nhanh dần và dày dần theo thời gian
    untilSpawn.current -= dt
    if (untilSpawn.current <= 0) {
      onSpawn(1.6 + elapsed * 0.03)
      untilSpawn.current = Math.max(0.6, 1.2 - elapsed * 0.01)
    }
  })

  return (
    <>
      {words.map((word) => (
        <FallingWord key={word.id} word={word} petX={petX} paused={phase !== 'playing'} onCatch={onCatch} onMiss={onMiss} />
      ))}
      <group ref={body}>
        <group scale={0.9 * petBoost(pet.species.code, 0.7)}>
          <PetBody
            species={pet.species.code}
            stage={pet.stage}
            look={pet.stage === 'evolved' ? 'evolved' : null}
            state={phase === 'over' ? 'happy' : moving ? 'run' : 'idle'}
            equipment={pet.equipment}
          />
        </group>
      </group>
    </>
  )
}

// Một chữ rơi trong bong bóng xà phòng: tự cập nhật độ cao, chạm đầu thú thì báo hứng được, rơi quá đất thì báo trượt
function FallingWord({ word, petX, paused, onCatch, onMiss }) {
  const group = useRef()
  const done = useRef(false)

  useFrame((_, delta) => {
    if (done.current || paused) return
    group.current.position.y -= word.speed * Math.min(delta, 0.05)
    const y = group.current.position.y
    if (y <= CATCH_HEIGHT && y > CATCH_HEIGHT - 0.4 && Math.abs(word.x - petX.current) < CATCH_WIDTH) {
      done.current = true
      onCatch(word)
    } else if (y < -0.5) {
      done.current = true
      onMiss(word.id)
    }
  })

  return (
    <group ref={group} position={[word.x, 6.2, 0]}>
      <group scale={[0.75 + word.text.length * 0.07, 0.42, 0.4]}>
        <mesh>
          <sphereGeometry args={[1, 24, 16]} />
          <meshPhysicalMaterial color="#e3f6ff" roughness={0} clearcoat={1} iridescence={1} iridescenceIOR={1.3} transparent opacity={0.16} depthWrite={false} />
        </mesh>
        {/* Đốm sáng phản chiếu trên bong bóng */}
        <mesh position={[-0.45, 0.45, 0.8]} scale={[0.18, 0.28, 0.1]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.7} depthWrite={false} />
        </mesh>
      </group>
      <Html center zIndexRange={[10, 0]}>
        <span className="whitespace-nowrap rounded-lg border-2 border-primary-300 bg-card px-2 py-1 font-mono text-sm font-bold text-ink shadow-card">
          {word.text}
        </span>
      </Html>
    </group>
  )
}
