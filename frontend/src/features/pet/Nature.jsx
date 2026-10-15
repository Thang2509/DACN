import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BackSide, CanvasTexture, Color, RepeatWrapping, SRGBColorSpace } from 'three'
import { seededRandom } from './minigames'

/**
 * Cảnh thiên nhiên hoạt hình dựng bằng code, dùng chung cho các minigame: bầu trời, mặt trời, mây, đồi núi,
 * cây, bụi cây, đá, hoa, cỏ, hàng rào. Khối hình đơn giản mặt phẳng (low-poly), màu tươi, sương mù tạo chiều sâu.
 * Các lớp cảnh trôi theo ref tốc độ (speed.current, đơn vị cảnh/giây); lớp xa trôi chậm hơn (parallax).
 */

const FOLIAGE = ['#5fae4f', '#4c9a43', '#7cc36a', '#3f8a46']
const pick = (list, i) => list[i % list.length]

// Ánh sáng ban ngày ấm, trời xanh, sương mù xa
export function Daylight({ fog = [18, 55] }) {
  return (
    <>
      <color attach="background" args={['#bfe3ff']} />
      <fog attach="fog" args={['#cfe9ff', ...fog]} />
      <hemisphereLight args={['#dcefff', '#6a9a48', 1.5]} />
      <directionalLight position={[-6, 10, 6]} intensity={2.1} color="#fff1d6" />
    </>
  )
}

// Vòm trời chuyển màu từ xanh đậm (đỉnh) sang xanh nhạt (chân trời) và mặt trời có quầng sáng
export function Sky() {
  const uniforms = useMemo(() => ({ uTop: { value: new Color('#3f97ec') }, uHorizon: { value: new Color('#dff3ff') } }), [])
  return (
    <>
      <mesh scale={90} renderOrder={-1}>
        <sphereGeometry args={[1, 32, 16]} />
        <shaderMaterial
          side={BackSide}
          depthWrite={false}
          uniforms={uniforms}
          vertexShader={/* glsl */ `
            varying float vHeight;
            void main() {
              vHeight = normalize(position).y;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`}
          fragmentShader={/* glsl */ `
            uniform vec3 uTop;
            uniform vec3 uHorizon;
            varying float vHeight;
            void main() {
              gl_FragColor = vec4(mix(uHorizon, uTop, smoothstep(0.0, 0.55, vHeight)), 1.0);
              #include <colorspace_fragment>
            }`}
        />
      </mesh>
      <group position={[-16, 13, -48]}>
        <mesh>
          <circleGeometry args={[2.4, 40]} />
          <meshBasicMaterial color="#fff7d6" fog={false} />
        </mesh>
        <mesh position-z={-0.1}>
          <circleGeometry args={[4.2, 40]} />
          <meshBasicMaterial color="#fff2c2" transparent opacity={0.35} fog={false} />
        </mesh>
      </group>
    </>
  )
}

// Một đám mây bông: vài khối cầu trắng chồng nhau
export function Cloud({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      {[[0, 0, 0, 1], [1, -0.15, 0.1, 0.75], [-1, -0.2, 0, 0.7], [0.45, 0.45, -0.1, 0.65], [-0.5, 0.35, 0.1, 0.6]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} scale={[r, r * 0.8, r]}>
          <icosahedronGeometry args={[1, 2]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.25} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Lớp cảnh trôi ngang: mỗi khối con dời sang trái theo tốc độ × factor, ra khỏi mép trái thì vòng lại mép phải.
 * drift: tốc độ trôi riêng (mây vẫn trôi khi đứng yên).
 */
export function Scroller({ speed, factor = 1, span, drift = 0, children }) {
  const group = useRef(null)
  useFrame((_, delta) => {
    const dx = ((speed?.current ?? 0) * factor + drift) * Math.min(delta, 0.05)
    if (!dx) return
    for (const child of group.current.children) {
      child.position.x -= dx
      if (child.position.x < -span / 2) child.position.x += span
    }
  })
  return <group ref={group}>{children}</group>
}

// Mây trôi chậm trên trời
export function Clouds({ speed, count = 7, span = 70 }) {
  const clouds = useMemo(() => {
    const random = seededRandom(count)
    return Array.from({ length: count }, (_, i) => ({ x: -span / 2 + (i + random(0, 0.6)) * (span / count), y: random(7, 12), z: random(-38, -22), s: random(1.2, 2.2) }))
  }, [count, span])
  return (
    <Scroller speed={speed} factor={0.04} drift={0.35} span={span}>
      {clouds.map((cloud, i) => <Cloud key={i} position={[cloud.x, cloud.y, cloud.z]} scale={cloud.s} />)}
    </Scroller>
  )
}

// Dãy đồi tròn xa (càng xa càng mờ trong sương) và núi nhọn phía sau
export function Hills({ speed, span = 80 }) {
  const { hills, peaks } = useMemo(() => {
    const random = seededRandom(span)
    return {
      hills: Array.from({ length: 9 }, (_, i) => ({ x: -span / 2 + i * (span / 9) + random(0, 3), r: random(5, 9), z: random(-30, -24), color: pick(['#7cc06a', '#69b25c', '#8ccc72'], i) })),
      peaks: Array.from({ length: 7 }, (_, i) => ({ x: -span / 2 + i * (span / 7) + random(0, 4), h: random(9, 15), z: random(-46, -40) })),
    }
  }, [span])
  return (
    <>
      <Scroller speed={speed} factor={0.05} span={span}>
        {peaks.map((peak, i) => (
          <mesh key={i} position={[peak.x, peak.h / 2 - 1, peak.z]}>
            <coneGeometry args={[peak.h * 0.75, peak.h, 7]} />
            <meshStandardMaterial color="#8fb0cf" flatShading roughness={1} />
          </mesh>
        ))}
      </Scroller>
      <Scroller speed={speed} factor={0.15} span={span}>
        {hills.map((hill, i) => (
          <mesh key={i} position={[hill.x, -hill.r * 0.55, hill.z]} scale={[hill.r * 1.4, hill.r, hill.r]}>
            <icosahedronGeometry args={[1, 2]} />
            <meshStandardMaterial color={hill.color} flatShading roughness={1} />
          </mesh>
        ))}
      </Scroller>
    </>
  )
}

// Cây: thân gỗ và tán lá tròn (nhiều khối cầu) hoặc cây thông (3 tầng nón)
export function Tree({ position, scale = 1, kind = 'round', color = FOLIAGE[0] }) {
  return (
    <group position={position} scale={scale}>
      <mesh position-y={0.5}>
        <cylinderGeometry args={[0.09, 0.14, 1, 7]} />
        <meshStandardMaterial color="#7a5034" roughness={0.9} flatShading />
      </mesh>
      {kind === 'pine'
        ? [0, 1, 2].map((i) => (
            <mesh key={i} position-y={0.95 + i * 0.42}>
              <coneGeometry args={[0.62 - i * 0.15, 0.8, 8]} />
              <meshStandardMaterial color={color} roughness={0.85} flatShading />
            </mesh>
          ))
        : [[0, 1.35, 0, 0.62], [0.36, 1.12, 0.1, 0.42], [-0.34, 1.18, -0.05, 0.45], [0.05, 1.72, 0, 0.42]].map(([x, y, z, r], i) => (
            <mesh key={i} position={[x, y, z]}>
              <icosahedronGeometry args={[r, 1]} />
              <meshStandardMaterial color={color} roughness={0.8} flatShading />
            </mesh>
          ))}
    </group>
  )
}

export function Bush({ position, scale = 1, color = FOLIAGE[1] }) {
  return (
    <group position={position} scale={scale}>
      {[[0, 0.3, 0, 0.36], [0.3, 0.22, 0.05, 0.27], [-0.3, 0.22, 0, 0.28], [0.05, 0.22, 0.25, 0.24]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color={color} roughness={0.85} flatShading />
        </mesh>
      ))}
    </group>
  )
}

export function Rock({ position, scale = 1 }) {
  return (
    <mesh position={position} scale={[scale * 1.1, scale * 0.75, scale]}>
      <dodecahedronGeometry args={[0.4, 0]} />
      <meshStandardMaterial color="#9a9fae" roughness={0.95} flatShading />
    </mesh>
  )
}

export function Flower({ position, color = '#ff8fb8' }) {
  return (
    <group position={position}>
      <mesh position-y={0.12}>
        <cylinderGeometry args={[0.012, 0.012, 0.24, 4]} />
        <meshStandardMaterial color="#4f9a40" />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[Math.cos((i / 5) * Math.PI * 2) * 0.05, 0.25, Math.sin((i / 5) * Math.PI * 2) * 0.05]}>
          <sphereGeometry args={[0.04, 8, 6]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      ))}
      <mesh position-y={0.25}>
        <sphereGeometry args={[0.03, 8, 6]} />
        <meshStandardMaterial color="#ffd54f" />
      </mesh>
    </group>
  )
}

// Hàng rào gỗ: cọc và hai thanh ngang, dài length theo trục x
export function Fence({ position, length = 10 }) {
  const posts = Math.round(length / 1.2) + 1
  return (
    <group position={position}>
      {Array.from({ length: posts }, (_, i) => (
        <mesh key={i} position={[-length / 2 + (i * length) / (posts - 1), 0.45, 0]}>
          <boxGeometry args={[0.12, 0.9, 0.12]} />
          <meshStandardMaterial color="#c08a55" roughness={0.9} flatShading />
        </mesh>
      ))}
      {[0.35, 0.7].map((y) => (
        <mesh key={y} position={[0, y, 0.07]}>
          <boxGeometry args={[length, 0.09, 0.05]} />
          <meshStandardMaterial color="#d49a62" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

// ---- Mặt đất: cỏ và đường đất vẽ bằng canvas, lặp lại và cuộn theo tốc độ chạy ----
const textures = {}

function paint(kind) {
  if (textures[kind]) return textures[kind]
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const context = canvas.getContext('2d')
  if (kind === 'grass') {
    context.fillStyle = '#6cb556'
    context.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 1400; i++) {
      context.fillStyle = pick(['#5aa547', '#7cc463', '#64ad50', '#86cc6c'], i)
      const x = Math.random() * 256
      const y = Math.random() * 256
      context.fillRect(x, y, 2, 4 + Math.random() * 5)
    }
  } else {
    context.fillStyle = '#c99a63'
    context.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 260; i++) {
      context.fillStyle = pick(['#b98a55', '#d6a874', '#a8794a', '#e0b682'], i)
      context.beginPath()
      context.ellipse(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 6, 1.5 + Math.random() * 3, 0, 0, Math.PI * 2)
      context.fill()
    }
    // Vệt bánh xe chạy dọc đường
    context.fillStyle = 'rgba(120, 80, 45, 0.25)'
    context.fillRect(0, 70, 256, 10)
    context.fillRect(0, 176, 256, 10)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = texture.wrapT = RepeatWrapping
  textures[kind] = texture
  return texture
}

/**
 * Mặt cỏ rộng và (tùy chọn) đường đất chạy dọc trục x ở z = pathZ; speed: ref tốc độ để vân đất, vân cỏ cuộn theo.
 */
export function Ground({ speed, path = true, pathZ = 0, width = 70, depth = 40 }) {
  const grassMesh = useRef(null)
  const dirtMesh = useRef(null)
  const grass = useMemo(() => tiled('grass', width / 4, depth / 4), [width, depth])
  const dirt = useMemo(() => tiled('dirt', width / 3, 1), [width])

  useFrame((_, delta) => {
    const dx = (speed?.current ?? 0) * Math.min(delta, 0.05)
    if (!dx) return
    grassMesh.current.material.map.offset.x += dx / 4
    if (dirtMesh.current) dirtMesh.current.material.map.offset.x += dx / 3
  })

  return (
    <>
      <mesh ref={grassMesh} rotation-x={-Math.PI / 2} position={[0, 0, -depth / 2 + 6]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial map={grass} roughness={1} />
      </mesh>
      {path && (
        <mesh ref={dirtMesh} rotation-x={-Math.PI / 2} position={[0, 0.004, pathZ]}>
          <planeGeometry args={[width, 2.2]} />
          <meshStandardMaterial map={dirt} roughness={1} />
        </mesh>
      )}
    </>
  )
}

// Bản sao texture (mỗi mặt đất cuộn riêng) lặp lại repeatX × repeatY lần
function tiled(kind, repeatX, repeatY) {
  const texture = paint(kind).clone()
  texture.repeat.set(repeatX, repeatY)
  return texture
}
