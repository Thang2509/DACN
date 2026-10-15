import { RoundedBox } from '@react-three/drei'

/**
 * Nội thất phòng thú cưng dựng bằng khối cơ bản. Gốc tọa độ ở tâm vùng đặt trên sàn, mặt trước hướng +z.
 * Kích thước theo lưới 1 ô = 0,5 đơn vị: sofa, bàn trà 2 × 1 ô; thảm tròn 2 × 2; thảm chữ nhật 3 × 2; còn lại 1 ô.
 * night (0–1): độ tối của trời, đèn cây sáng dần khi tối.
 */
export default function Furniture({ code, night = 0 }) {
  const Item = FURNITURE[code] ?? Box
  return <Item night={night} />
}

function Paint({ color, roughness = 0.8, ...props }) {
  return <meshStandardMaterial color={color} roughness={roughness} {...props} />
}

function Soft({ size, radius = 0.04, color, ...props }) {
  return (
    <RoundedBox args={size} radius={radius} smoothness={3} castShadow receiveShadow {...props}>
      <Paint color={color} />
    </RoundedBox>
  )
}

function Part({ children, color, roughness, shadow = true, ...props }) {
  return (
    <mesh castShadow={shadow} receiveShadow {...props}>
      {children}
      <Paint color={color} roughness={roughness} />
    </mesh>
  )
}

const WOOD = '#c89b6d'
const WOOD_DARK = '#8a6040'
const KIBBLE = [[0, 0], [0.04, 0.03], [-0.05, 0.02], [0.02, -0.05], [-0.03, -0.04], [0.06, -0.02], [-0.06, -0.05], [0.05, 0.06], [-0.01, 0.06]]

function FoodBowl() {
  return (
    <group>
      <Part color="#5b43e6" roughness={0.35} position-y={0.045}>
        <cylinderGeometry args={[0.15, 0.11, 0.09, 24]} />
      </Part>
      <Part color="#3b2c99" position-y={0.088} shadow={false}>
        <cylinderGeometry args={[0.125, 0.125, 0.01, 24]} />
      </Part>
      {KIBBLE.map(([x, z]) => (
        <Part key={`${x},${z}`} color="#a0612e" position={[x, 0.1, z]} shadow={false}>
          <sphereGeometry args={[0.02, 8, 6]} />
        </Part>
      ))}
    </group>
  )
}

function PetBed() {
  return (
    <group>
      <Part color="#fb8c3c" position-y={0.07} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.17, 0.07, 14, 32]} />
      </Part>
      <Part color="#ffd9b8" position-y={0.035}>
        <cylinderGeometry args={[0.2, 0.21, 0.07, 32]} />
      </Part>
    </group>
  )
}

function RugRound() {
  return (
    <group>
      <Part color="#f3a6c0" position-y={0.006} shadow={false}>
        <cylinderGeometry args={[0.48, 0.48, 0.012, 48]} />
      </Part>
      <Part color="#fbd3e1" position-y={0.013} shadow={false}>
        <cylinderGeometry args={[0.34, 0.34, 0.004, 48]} />
      </Part>
      <Part color="#f3a6c0" position-y={0.016} shadow={false}>
        <cylinderGeometry args={[0.18, 0.18, 0.004, 48]} />
      </Part>
    </group>
  )
}

function RugRectangle() {
  return (
    <group>
      <Soft size={[1.42, 0.012, 0.94]} radius={0.005} color="#9fd8c8" position-y={0.006} castShadow={false} />
      {[-0.45, -0.15, 0.15, 0.45].map((x) => (
        <Part key={x} color="#e8f7f1" position={[x, 0.014, 0]} shadow={false}>
          <boxGeometry args={[0.12, 0.004, 0.86]} />
        </Part>
      ))}
    </group>
  )
}

function Pot({ radius, height, color = '#d9774a' }) {
  return (
    <group>
      <Part color={color} position-y={height / 2}>
        <cylinderGeometry args={[radius, radius * 0.75, height, 20]} />
      </Part>
      <Part color="#5a3d2b" position-y={height - 0.005} shadow={false}>
        <cylinderGeometry args={[radius * 0.9, radius * 0.9, 0.01, 20]} />
      </Part>
    </group>
  )
}

const SMALL_LEAVES = [0, 1.25, 2.5, 3.75, 5]

function PlantSmall() {
  return (
    <group>
      <Pot radius={0.1} height={0.15} />
      {SMALL_LEAVES.map((angle) => (
        <Part key={angle} color="#4caf6a" position={[Math.cos(angle) * 0.06, 0.24, Math.sin(angle) * 0.06]} rotation={[Math.sin(angle) * 0.5, angle, Math.cos(angle) * 0.5]} scale={[0.05, 0.11, 0.02]}>
          <sphereGeometry args={[1, 12, 10]} />
        </Part>
      ))}
    </group>
  )
}

const BIG_LEAVES = [
  [0.5, 0.55, 0.12],
  [2.1, 0.62, 0.1],
  [3.5, 0.5, 0.13],
  [4.8, 0.7, 0.08],
  [1.3, 0.78, 0.06],
  [5.8, 0.42, 0.14],
]

function PlantLarge() {
  return (
    <group>
      <Pot radius={0.15} height={0.26} color="#f2efe9" />
      <Part color="#3d7a4f" position-y={0.45}>
        <cylinderGeometry args={[0.015, 0.02, 0.4, 8]} />
      </Part>
      {BIG_LEAVES.map(([angle, y, out]) => (
        <Part key={angle} color="#3f9f5f" position={[Math.cos(angle) * out, y, Math.sin(angle) * out]} rotation={[0.6 * Math.sin(angle), angle, 0.6 * Math.cos(angle)]} scale={[0.11, 0.02, 0.17]}>
          <sphereGeometry args={[1, 14, 10]} />
        </Part>
      ))}
    </group>
  )
}

// Thùng các-tông mở nắp (mèo rất thích chui vào)
function CardboardBox() {
  const brown = '#c8955c'
  return (
    <group>
      <Part color="#b5824c" position-y={0.01}>
        <boxGeometry args={[0.4, 0.02, 0.34]} />
      </Part>
      {[[0, 0.17, 0.4, 0.008], [0, -0.17, 0.4, 0.008]].map(([x, z, w, d]) => (
        <Part key={z} color={brown} position={[x, 0.13, z]}>
          <boxGeometry args={[w, 0.26, d]} />
        </Part>
      ))}
      {[0.2, -0.2].map((x) => (
        <Part key={x} color={brown} position={[x, 0.13, 0]}>
          <boxGeometry args={[0.008, 0.26, 0.34]} />
        </Part>
      ))}
      {[0.17, -0.17].map((z) => (
        <Part key={z} color="#d9a56b" position={[0, 0.3, z + Math.sign(z) * 0.05]} rotation-x={Math.sign(z) * 0.9}>
          <boxGeometry args={[0.38, 0.008, 0.16]} />
        </Part>
      ))}
    </group>
  )
}

function TeddyBear() {
  const fur = '#a8703d'
  const light = '#e8c39a'
  const ball = (position, radius, color = fur) => (
    <Part key={position.join()} color={color} position={position}>
      <sphereGeometry args={[radius, 16, 12]} />
    </Part>
  )
  return (
    <group>
      {ball([0, 0.1, 0], 0.1)}
      {ball([0, 0.1, 0.06], 0.06, light)}
      {ball([0, 0.24, 0.01], 0.075)}
      {ball([0, 0.225, 0.065], 0.03, light)}
      {ball([0, 0.235, 0.093], 0.01, '#2a1d1a')}
      {[1, -1].map((side) => (
        <group key={side}>
          {ball([side * 0.055, 0.305, 0], 0.025)}
          {ball([side * 0.1, 0.13, 0.03], 0.035)}
          {ball([side * 0.06, 0.03, 0.07], 0.04)}
          {ball([side * 0.03, 0.255, 0.07], 0.01, '#2a1d1a')}
        </group>
      ))}
    </group>
  )
}

function FloorLamp({ night }) {
  return (
    <group>
      <Part color="#3b3a4f" position-y={0.01}>
        <cylinderGeometry args={[0.12, 0.14, 0.02, 24]} />
      </Part>
      <Part color="#3b3a4f" position-y={0.45}>
        <cylinderGeometry args={[0.012, 0.012, 0.86, 8]} />
      </Part>
      <mesh position-y={0.92} castShadow>
        <cylinderGeometry args={[0.1, 0.16, 0.18, 24, 1, true]} />
        <meshStandardMaterial color="#fff1d6" emissive="#ffcf8a" emissiveIntensity={0.15 + night * 1.6} side={2} />
      </mesh>
      {/* Đèn luôn có trong cảnh, ban ngày cường độ 0 để không phải biên dịch lại shader khi trời tối */}
      <pointLight position-y={0.85} color="#ffcf8a" intensity={night * 1.4} distance={2.6} decay={1.5} />
    </group>
  )
}

const BOOK_COLORS = ['#5b43e6', '#fb8c3c', '#3f9f5f', '#e45d7a', '#f2c94c', '#4aa3ff']

function Bookcase() {
  return (
    <group>
      <Soft size={[0.46, 0.62, 0.3]} radius={0.02} color={WOOD} position-y={0.31} />
      <Part color={WOOD_DARK} position={[0, 0.33, 0.02]} shadow={false}>
        <boxGeometry args={[0.4, 0.54, 0.27]} />
      </Part>
      {[0.12, 0.38].map((y) => (
        <group key={y}>
          <Part color={WOOD} position={[0, y - 0.06, 0.03]}>
            <boxGeometry args={[0.4, 0.02, 0.26]} />
          </Part>
          {BOOK_COLORS.map((color, i) => (
            <Part key={color} color={color} position={[-0.15 + i * 0.06, y + 0.04, 0.04]} rotation-z={i === 4 ? 0.25 : 0}>
              <boxGeometry args={[0.045, 0.18 - (i % 3) * 0.02, 0.2]} />
            </Part>
          ))}
        </group>
      ))}
    </group>
  )
}

function Legs({ width, depth, height, color = WOOD_DARK }) {
  return [1, -1].flatMap((sx) =>
    [1, -1].map((sz) => (
      <Part key={`${sx}${sz}`} color={color} position={[sx * width, height / 2, sz * depth]}>
        <cylinderGeometry args={[0.018, 0.014, height, 8]} />
      </Part>
    )),
  )
}

function Armchair() {
  const fabric = '#f29e6d'
  return (
    <group>
      <Legs width={0.16} depth={0.15} height={0.1} />
      <Soft size={[0.44, 0.13, 0.42]} color={fabric} position-y={0.16} />
      <Soft size={[0.44, 0.32, 0.1]} radius={0.05} color={fabric} position={[0, 0.36, -0.17]} />
      {[0.2, -0.2].map((x) => (
        <Soft key={x} size={[0.08, 0.2, 0.4]} radius={0.035} color="#e8885a" position={[x, 0.28, 0]} />
      ))}
      <Soft size={[0.32, 0.06, 0.3]} radius={0.03} color="#ffd0b3" position={[0, 0.25, 0.03]} />
    </group>
  )
}

function CoffeeTable() {
  return (
    <group>
      <Legs width={0.4} depth={0.16} height={0.26} />
      <Soft size={[0.92, 0.05, 0.42]} radius={0.02} color={WOOD} position-y={0.28} />
      <Part color="#ffffff" roughness={0.3} position={[0.25, 0.34, 0.05]}>
        <cylinderGeometry args={[0.04, 0.035, 0.08, 16]} />
      </Part>
      <Soft size={[0.22, 0.03, 0.16]} radius={0.01} color="#5b43e6" position={[-0.2, 0.32, -0.03]} rotation-y={0.3} />
    </group>
  )
}

function Sofa() {
  const fabric = '#7c83e8'
  return (
    <group>
      <Legs width={0.42} depth={0.16} height={0.08} />
      <Soft size={[0.98, 0.16, 0.46]} color={fabric} position-y={0.15} />
      <Soft size={[0.98, 0.34, 0.12]} radius={0.05} color={fabric} position={[0, 0.34, -0.17]} />
      {[0.43, -0.43].map((x) => (
        <Soft key={x} size={[0.12, 0.26, 0.46]} radius={0.05} color="#6a70d8" position={[x, 0.27, 0]} />
      ))}
      {[0.19, -0.19].map((x) => (
        <Soft key={x} size={[0.36, 0.07, 0.34]} radius={0.03} color="#a9aef5" position={[x, 0.26, 0.03]} />
      ))}
    </group>
  )
}

// Món chưa có hình dựng riêng: hộp quà
function Box() {
  return <Soft size={[0.3, 0.3, 0.3]} color="#fb8c3c" position-y={0.15} />
}

const FURNITURE = {
  food_bowl: FoodBowl,
  pet_bed: PetBed,
  rug_round: RugRound,
  rug_rectangle: RugRectangle,
  plant_small: PlantSmall,
  plant_large: PlantLarge,
  cardboard_box: CardboardBox,
  teddy_bear: TeddyBear,
  floor_lamp: FloorLamp,
  bookcase: Bookcase,
  armchair: Armchair,
  coffee_table: CoffeeTable,
  sofa: Sofa,
}
