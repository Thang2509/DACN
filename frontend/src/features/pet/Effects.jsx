import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { CanvasTexture, SRGBColorSpace, Vector3 } from 'three'

/**
 * Hiệu ứng cảm xúc quanh thú (đặt trong nhóm vị trí của thú, chưa phóng to theo giai đoạn; +z là phía trước mặt):
 * tim khi vui / được vuốt ve, chữ Z khi ngủ, mây mưa khi buồn, vụn thức ăn khi ăn, bụi khi chạy, hào quang khi tiến hóa.
 * height: chiều cao thú (đơn vị cảnh). hearts: số lần bắn chùm tim (tăng lên là bắn).
 */
export default function Effects({ height, happy, hearts, sleeping, sad, eating, running, evolved, celebrate, aura }) {
  return (
    <>
      <Emitter kind="heart" active={happy} rate={0.5} life={1.6} size={height * 0.28} burst={hearts} spawn={heartSpawn(height)} />
      <Emitter kind="z" active={sleeping} rate={0.7} life={2.4} size={height * 0.24} spawn={zSpawn(height)} />
      <Emitter kind="dot" color="#a0612e" active={eating} rate={7} life={0.6} size={height * 0.07} gravity={1.5} spawn={crumbSpawn(height)} />
      <Emitter kind="dot" color="#d8cfc2" active={running} rate={12} life={0.7} size={height * 0.3} spawn={dustSpawn(height)} />
      {sad && <RainCloud height={height} />}
      {evolved && <Aura color={aura} height={height} />}
      {celebrate && <Sparkles count={40} scale={[height * 2.2, height * 2, height * 2.2]} position-y={height * 0.6} size={6} speed={1.5} color={aura} />}
    </>
  )
}

const random = (min, max) => min + Math.random() * (max - min)

// Vị trí và vận tốc ban đầu của từng loại hạt
const heartSpawn = (height) => (position, velocity) => {
  position.set(random(-0.1, 0.1) * height, height * 1.05, random(0, 0.15) * height)
  velocity.set(random(-0.08, 0.08), 0.3 + Math.random() * 0.15, random(-0.05, 0.05))
}
const zSpawn = (height) => (position, velocity) => {
  position.set(height * 0.25, height * 0.7, height * 0.25)
  velocity.set(0.06, 0.16, 0.02)
}
const crumbSpawn = (height) => (position, velocity) => {
  position.set(random(-0.05, 0.05) * height, height * 0.25, height * 0.55)
  velocity.set(random(-0.15, 0.15), random(0.1, 0.35), random(0, 0.2))
}
const dustSpawn = (height) => (position, velocity) => {
  position.set(random(-0.2, 0.2) * height, 0.02, -height * 0.35)
  velocity.set(random(-0.05, 0.05), random(0.03, 0.1), -random(0.05, 0.15))
}

// Ảnh nhỏ vẽ bằng canvas cho hạt (vẽ một lần rồi dùng lại)
const textures = {}

function texture(kind) {
  if (textures[kind]) return textures[kind]
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const context = canvas.getContext('2d')
  if (kind === 'heart') {
    context.fillStyle = '#ff4f7b'
    context.beginPath()
    context.moveTo(32, 56)
    context.bezierCurveTo(2, 34, 8, 4, 32, 20)
    context.bezierCurveTo(56, 4, 62, 34, 32, 56)
    context.fill()
  } else if (kind === 'z') {
    context.font = 'bold 50px sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.lineWidth = 8
    context.strokeStyle = '#5b43e6'
    context.strokeText('Z', 32, 34)
    context.fillStyle = '#ffffff'
    context.fillText('Z', 32, 34)
  } else if (kind === 'drop') {
    context.fillStyle = '#7fb8ff'
    context.beginPath()
    context.moveTo(32, 4)
    context.quadraticCurveTo(54, 42, 32, 60)
    context.quadraticCurveTo(10, 42, 32, 4)
    context.fill()
  } else {
    const glow = context.createRadialGradient(32, 32, 0, 32, 32, 32)
    glow.addColorStop(0, 'rgba(255,255,255,1)')
    glow.addColorStop(0.5, 'rgba(255,255,255,0.8)')
    glow.addColorStop(1, 'rgba(255,255,255,0)')
    context.fillStyle = glow
    context.fillRect(0, 0, 64, 64)
  }
  textures[kind] = new CanvasTexture(canvas)
  textures[kind].colorSpace = SRGBColorSpace
  return textures[kind]
}

const MAX_PARTICLES = 14
const SLOTS = Array.from({ length: MAX_PARTICLES }, (_, i) => i)

/**
 * Bể hạt cố định: active thì sinh rate hạt/giây; burst đổi giá trị thì bắn ngay một chùm.
 * Mỗi hạt bay theo vận tốc (có trọng lực nếu cần), to dần khi mới sinh rồi mờ dần tới hết life giây.
 */
function Emitter({ kind, color = '#ffffff', active, rate, life, size, spawn, gravity = 0, burst = 0 }) {
  const sprites = useRef([])
  const pool = useRef(null)
  const timer = useRef(0)
  const lastBurst = useRef(burst)

  useFrame((_, delta) => {
    pool.current ??= SLOTS.map(() => ({ alive: false, age: 0, position: new Vector3(), velocity: new Vector3() }))
    const emit = (count) => {
      for (const particle of pool.current) {
        if (count <= 0) break
        if (particle.alive) continue
        particle.alive = true
        particle.age = 0
        spawn(particle.position, particle.velocity)
        count--
      }
    }
    if (burst !== lastBurst.current) {
      lastBurst.current = burst
      emit(6)
    }
    if (active) {
      timer.current += delta * rate
      for (; timer.current >= 1; timer.current--) emit(1)
    }
    pool.current.forEach((particle, i) => {
      const sprite = sprites.current[i]
      if (!sprite) return
      if (particle.alive) {
        particle.age += delta
        particle.alive = particle.age < life
      }
      sprite.visible = particle.alive
      if (!particle.alive) return
      particle.velocity.y -= gravity * delta
      particle.position.addScaledVector(particle.velocity, delta)
      sprite.position.copy(particle.position)
      sprite.material.opacity = Math.min(1, (1 - particle.age / life) * 1.6)
      sprite.scale.setScalar(size * Math.min(1, 0.4 + particle.age * 4))
    })
  })

  return SLOTS.map((i) => (
    <sprite key={i} ref={(node) => (sprites.current[i] = node)} visible={false}>
      <spriteMaterial map={texture(kind)} color={color} transparent depthWrite={false} />
    </sprite>
  ))
}

const CLOUD_PUFFS = [[-0.12, 0, 0.1], [0, 0.04, 0.13], [0.12, 0, 0.1], [0.05, -0.03, 0.09]]

// Đám mây nhỏ trên đầu khi buồn, lắc nhẹ và nhỏ giọt mưa
function RainCloud({ height }) {
  const cloud = useRef()
  useFrame(({ clock }) => {
    cloud.current.position.x = Math.sin(clock.elapsedTime * 0.8) * height * 0.05
  })
  return (
    <group ref={cloud} position-y={height * 1.35} scale={height}>
      {CLOUD_PUFFS.map(([x, y, radius]) => (
        <mesh key={x} position={[x, y, 0]}>
          <sphereGeometry args={[radius, 14, 10]} />
          <meshStandardMaterial color="#9aa3c7" roughness={1} />
        </mesh>
      ))}
      <Emitter kind="drop" active rate={5} life={0.8} size={0.08} gravity={1.5} spawn={dropSpawn} />
    </group>
  )
}

const dropSpawn = (position, velocity) => {
  position.set(random(-0.15, 0.15), -0.06, random(-0.05, 0.05))
  velocity.set(0, -0.3, 0)
}

// Vòng hào quang dưới chân và đốm sáng bay quanh thú đã tiến hóa
function Aura({ color, height }) {
  const ring = useRef()
  useFrame(({ clock }) => {
    ring.current.rotation.z = clock.elapsedTime * 0.6
    ring.current.material.emissiveIntensity = 1.2 + Math.sin(clock.elapsedTime * 2) * 0.4
  })
  return (
    <>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.01}>
        <torusGeometry args={[height * 0.55, height * 0.03, 8, 48]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} transparent opacity={0.85} />
      </mesh>
      <Sparkles count={18} scale={[height * 1.6, height * 1.4, height * 1.6]} position-y={height * 0.6} size={3} speed={0.4} color={color} />
    </>
  )
}
