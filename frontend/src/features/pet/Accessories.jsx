import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DoubleSide } from 'three'

/**
 * Trang bị dựng bằng khối hình học. PetBody đặt mỗi món vào điểm neo của đầu / cổ / lưng nên chuyển động theo thú.
 * Mỗi món dựng theo khung đơn vị của điểm neo: 1 = bề ngang đầu / lưng, hoặc bán kính cổ;
 * đầu và lưng: x sang ngang, y lên trên, z hướng mặt; cổ: z dọc theo cổ, y chỉ ra phía cổ họng.
 */

// ---- Các món trang bị ----

function Paint({ color, ...props }) {
  return <meshStandardMaterial color={color} flatShading roughness={0.6} {...props} />
}

function PartyHat() {
  return (
    <group position-y={0.28}>
      <mesh>
        <coneGeometry args={[0.28, 0.62, 8]} />
        <Paint color="#ff5c8a" />
      </mesh>
      <mesh position-y={0.34}>
        <icosahedronGeometry args={[0.09, 0]} />
        <Paint color="#ffd34d" />
      </mesh>
    </group>
  )
}

function Crown() {
  return (
    <group position-y={0.08} scale={1.25}>
      <mesh>
        <cylinderGeometry args={[0.3, 0.27, 0.16, 10, 1, true]} />
        <Paint color="#ffc93c" metalness={0.6} roughness={0.3} side={DoubleSide} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.sin(angle) * 0.28, 0.14, Math.cos(angle) * 0.28]}>
            <coneGeometry args={[0.06, 0.14, 4]} />
            <Paint color="#ffc93c" metalness={0.6} roughness={0.3} />
          </mesh>
        )
      })}
      <mesh position={[0, 0.01, 0.3]}>
        <octahedronGeometry args={[0.05, 0]} />
        <Paint color="#e11d48" />
      </mesh>
    </group>
  )
}

function Flower() {
  return (
    <group position={[0.26, 0.02, 0.08]} rotation-z={-0.4}>
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.1, 0.02, Math.sin(angle) * 0.1]} scale={[1, 0.4, 1]}>
            <icosahedronGeometry args={[0.08, 0]} />
            <Paint color="#ff9ecb" />
          </mesh>
        )
      })}
      <mesh position-y={0.04}>
        <icosahedronGeometry args={[0.06, 0]} />
        <Paint color="#ffd34d" />
      </mesh>
    </group>
  )
}

function Scarf() {
  return (
    <group>
      <mesh>
        <torusGeometry args={[1.05, 0.3, 5, 12]} />
        <Paint color="#e63946" />
      </mesh>
      {/* Đuôi khăn rủ xuống trước ngực */}
      <mesh position={[0.35, 1.15, -0.45]} rotation-x={0.3}>
        <boxGeometry args={[0.4, 0.18, 0.9]} />
        <Paint color="#c92a37" />
      </mesh>
    </group>
  )
}

function BowTie() {
  return (
    <group position-y={1.1}>
      {[1, -1].map((side) => (
        <mesh key={side} position-x={side * 0.32} rotation-z={(side * Math.PI) / 2}>
          <coneGeometry args={[0.3, 0.55, 4]} />
          <Paint color="#5b43e6" />
        </mesh>
      ))}
      <mesh>
        <icosahedronGeometry args={[0.16, 0]} />
        <Paint color="#3e2da4" />
      </mesh>
    </group>
  )
}

function BellCollar() {
  return (
    <group>
      <mesh>
        <torusGeometry args={[1.02, 0.13, 4, 14]} />
        <Paint color="#3b82f6" />
      </mesh>
      <mesh position={[0, 1.3, -0.15]}>
        <icosahedronGeometry args={[0.28, 1]} />
        <Paint color="#ffc93c" metalness={0.7} roughness={0.25} />
      </mesh>
    </group>
  )
}

function Backpack() {
  return (
    <group position-y={0.12}>
      <mesh>
        <boxGeometry args={[0.62, 0.4, 0.5]} />
        <Paint color="#fb6c14" />
      </mesh>
      <mesh position={[0, 0.22, 0.02]}>
        <boxGeometry args={[0.64, 0.1, 0.46]} />
        <Paint color="#c43c0b" />
      </mesh>
      {[1, -1].map((side) => (
        <mesh key={side} position={[side * 0.34, 0.02, 0]}>
          <boxGeometry args={[0.08, 0.26, 0.3]} />
          <Paint color="#ffb070" />
        </mesh>
      ))}
    </group>
  )
}

// Hai cánh vỗ ngược chiều nhau (cánh trái là con thứ nhất, cánh phải là con thứ hai)
const WING_SIDES = [1, -1]

function Wings() {
  const pair = useRef()
  useFrame(({ clock }) => {
    const flap = 0.35 + Math.sin(clock.elapsedTime * 4) * 0.25
    pair.current.children.forEach((wing, i) => {
      wing.rotation.z = WING_SIDES[i] * flap
    })
  })

  return (
    <group ref={pair}>
      {WING_SIDES.map((side) => (
        <group key={side} position={[side * 0.2, 0.15, -0.05]}>
          <mesh position={[side * 0.42, 0.25, -0.2]} rotation-x={0.5} scale={[0.65, 0.08, 1.05]}>
            <icosahedronGeometry args={[0.5, 1]} />
            <Paint color="#ffffff" emissive="#dfe7ff" emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

const ACCESSORIES = {
  party_hat: PartyHat,
  crown: Crown,
  flower: Flower,
  scarf: Scarf,
  bow_tie: BowTie,
  bell_collar: BellCollar,
  backpack: Backpack,
  wings: Wings,
}

// Một món trang bị theo mã (không có trong danh sách thì không vẽ gì)
export default function Accessory({ code }) {
  const Item = ACCESSORIES[code]
  return Item ? <Item /> : null
}
