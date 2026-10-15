import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import ErrorBoundary, { SceneFallback } from '../../components/ErrorBoundary'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, Line, OrbitControls, SoftShadows, Sparkles } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO } from '@react-three/postprocessing'
import { BackSide, CanvasTexture, Color, LatheGeometry, SRGBColorSpace, Vector2 } from 'three'
import { petBoost, petSize } from './anatomy'
import PetBody from './PetBody'
import { SPECIES, STAGES } from './petStates'

const EGG_SCALE = 0.7

// Cảnh 3D trang thú cưng: thú trên bục tròn; thú tiến hóa có hào quang phát sáng
// hatching: thú vừa nhận, hiện quả trứng đang lắc và nứt trước khi thú bật ra
// silhouette: loài chưa sở hữu (bộ sưu tập) vẽ thành bóng đen, không hào quang
export function PetScene({ pet, state, onFinished, celebrate = false, hatching = false, silhouette = false }) {
  const evolved = pet.stage === 'evolved' && !silhouette
  const look = silhouette ? 'silhouette' : evolved ? 'evolved' : null
  const { code, egg_color: eggColor } = pet.species
  const aura = SPECIES[code]?.aura ?? '#ffd36b'
  const scale = hatching ? EGG_SCALE : STAGES[pet.stage].scale * petBoost(code)
  // Thú càng nhỏ (hamster, nhím, thú mới nở) camera càng lại gần, để thú luôn chiếm phần lớn khung hình
  const height = hatching ? 0.9 : scale * petSize(code) * 1.6
  const fit = Math.min(1, Math.max(0.5, (height / 0.8) ** 0.6))
  const focusY = hatching ? 0.45 : Math.max(0.12, height * 0.5)

  return (
    // flat: tắt tone mapping ở mọi giai đoạn để màu giống hệt lúc bật Bloom (EffectComposer tự tắt tone mapping)
    <ErrorBoundary fallback={<SceneFallback />}>
      <Canvas flat camera={{ position: [2.3, 1.6, 3.2], fov: 35 }} dpr={[1, 2]}>
        <Backdrop />
        <hemisphereLight args={['#ffffff', '#c6caff', 1.8]} />
        <directionalLight position={[3, 5, 4]} intensity={1.6} color="#fff4e6" />

        {/* key đổi khi trứng nở: Grow dựng lại từ tỉ lệ nhỏ nên thú "bật" ra khỏi trứng */}
        <Grow key={hatching ? 'egg' : 'pet'} scale={scale}>
          {hatching ? (
            <Egg color={eggColor} progress={1} />
          ) : (
            <PetBody species={code} stage={pet.stage} look={look} state={state} onFinished={onFinished} equipment={pet.equipment ?? []} />
          )}
        </Grow>
        {evolved && <Aura color={aura} />}
        {celebrate && <Sparkles count={70} scale={[2.2, 2, 2.2]} position-y={0.9} size={7} speed={1.5} color={aura} />}

        {/* Bục tròn low-poly */}
        <mesh position-y={-0.08}>
          <cylinderGeometry args={[1, 1.08, 0.16, 18]} />
          <meshStandardMaterial color="#c6caff" flatShading />
        </mesh>
        {/* Thú tiến hóa đứng trên vòng hào quang; bóng tiếp xúc sẽ in cả đốm sáng thành ô vuông nên bỏ đi */}
        {!evolved && <ContactShadows position-y={0.001} scale={2.4} blur={2.4} opacity={0.45} far={1.5} />}

        <CameraFit fit={fit} focusY={focusY} />
        <OrbitControls
          target={[0, focusY, 0]}
          enablePan={false}
          minDistance={1.8 * fit}
          maxDistance={5}
          maxPolarAngle={Math.PI / 2.1}
        />
        {/* Chỉ phần sáng hơn ngưỡng (hào quang) mới tỏa sáng */}
        {evolved && (
          <EffectComposer>
            <Bloom mipmapBlur luminanceThreshold={1} intensity={1.2} />
          </EffectComposer>
        )}
      </Canvas>
    </ErrorBoundary>
  )
}

// Đặt lại camera khi đổi thú (bộ sưu tập dùng chung một cảnh cho nhiều loài): lùi xa thú to, lại gần thú nhỏ
function CameraFit({ fit, focusY }) {
  const camera = useThree((three) => three.camera)
  useEffect(() => {
    camera.position.set(2.3, 1.6, 3.2).multiplyScalar(fit)
    camera.lookAt(0, focusY, 0)
  }, [camera, fit, focusY])
  return null
}

/**
 * Ánh sáng chân thực dùng chung: môi trường phản chiếu dựng bằng code (các tấm sáng, không tải ảnh HDR)
 * cho mắt, mũi, lông có ánh; bóng đổ mềm; che khuất ánh sáng giữa các vật (AO).
 * night: 0–1, ban đêm môi trường tối và ấm hơn. effects: bật hậu kỳ (AO), tắt khi cần nền trong suốt.
 */
export function RealisticLight({ night = 0, effects = true, bloom = false }) {
  const dark = night > 0.5
  return (
    <>
      <SoftShadows size={16} samples={10} focus={0.6} />
      <Environment resolution={128} environmentIntensity={0.6 - night * 0.35}>
        <mesh scale={30}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshBasicMaterial color={dark ? '#141634' : '#c9cdf5'} side={BackSide} />
        </mesh>
        <Lightformer form="rect" intensity={dark ? 0.6 : 2.5} color={dark ? '#a9b8ff' : '#fff4e6'} position={[3, 5, 3]} scale={[6, 4, 1]} />
        <Lightformer form="rect" intensity={dark ? 1.5 : 0.8} color="#ffcf8a" position={[-3, 2, 2]} scale={[3, 2, 1]} />
        <Lightformer form="circle" intensity={1.5} position={[0, 6, 0]} scale={4} />
      </Environment>
      {effects && (
        <EffectComposer multisampling={4}>
          <N8AO aoRadius={0.3} intensity={1.6} distanceFalloff={0.6} halfRes />
          {bloom ? <Bloom mipmapBlur luminanceThreshold={1} intensity={1.1} /> : <></>}
        </EffectComposer>
      )}
    </>
  )
}

// Cả 7 loài đứng thành hàng (trang /design); focus: chỉ một loài, nhìn cận cảnh để soi chi tiết khi chỉnh thông số
export function PetGallery({ state = 'idle', focus = null, equipment = [] }) {
  const codes = focus ? [focus] : Object.keys(SPECIES)
  return (
    <ErrorBoundary fallback={<SceneFallback />}>
      <Canvas key={focus ?? 'all'} flat shadows camera={{ position: focus ? [1.45, 0.7, 0.85] : [0, 1.1, 5], fov: 38 }} dpr={[1, 2]}>
        <Backdrop />
        <RealisticLight />
        <hemisphereLight args={['#ffffff', '#c6caff', 0.6]} />
        <directionalLight castShadow position={[3, 5, 4]} intensity={2.2} color="#fff4e6" shadow-mapSize={[1024, 1024]} />
        {/* Cả bộ đứng cạnh nhau đúng tỉ lệ thật để so sánh; xem riêng một loài thì phóng thú nhỏ cho dễ nhìn */}
        {codes.map((code, i) => (
          <group key={code} position={[(i - (codes.length - 1) / 2) * 0.85, 0, 0]} rotation-y={focus ? 0 : 0.6} scale={focus ? petBoost(code) : 1}>
            <PetBody species={code} state={state} equipment={equipment} />
          </group>
        ))}
        <ContactShadows position-y={0.001} scale={10} blur={2} opacity={0.4} far={1.5} />
        <OrbitControls target={[0, focus ? 0.4 : 0.45, 0]} enablePan={false} />
      </Canvas>
    </ErrorBoundary>
  )
}

// Ô nhỏ hiển thị một quả trứng ở màn chọn trứng
export function EggCanvas({ color, active }) {
  return (
    <ErrorBoundary fallback={<SceneFallback />}>
      <Canvas camera={{ position: [0, 0.35, 2.6], fov: 32 }} dpr={[1, 2]}>
        <hemisphereLight args={['#ffffff', '#c6caff', 2]} />
        <directionalLight position={[2, 4, 3]} intensity={1.5} color="#fff4e6" />
        <group position-y={-0.62}>
          <Egg color={color} progress={active ? 0.35 : 0} />
        </group>
      </Canvas>
    </ErrorBoundary>
  )
}

// Nửa mặt cắt quả trứng quay quanh trục đứng thành khối low-poly: đáy phình hơn đỉnh
const EGG_HEIGHT = 1.24
const eggRadius = (t) => Math.sin(t) * 0.42 * (1 + 0.12 * Math.cos(t)) // t: 0 = đáy, π = đỉnh
const eggY = (t) => (EGG_HEIGHT / 2) * (1 - Math.cos(t))
const EGG_GEOMETRY = new LatheGeometry(
  Array.from({ length: 9 }, (_, i) => new Vector2(eggRadius((i / 8) * Math.PI), eggY((i / 8) * Math.PI))),
  10,
)
// Đốm trang trí: [vị trí theo chiều cao t, góc quanh trứng]
const EGG_SPOTS = [[0.9, 0.3], [1.3, 1.6], [1.0, 2.7], [1.9, 0.9], [2.1, 3.6], [1.5, 4.7], [0.8, 5.5]]

function surfacePoint(t, angle, offset = 1) {
  const radius = eggRadius(t) * offset
  return [Math.cos(angle) * radius, eggY(t), Math.sin(angle) * radius]
}

// Vết nứt zíc zắc quanh thân trứng, dài dần khi sắp nở
function crackPoints(progress) {
  const count = Math.max(3, Math.round(21 * Math.min(1, (progress - 0.4) / 0.6)))
  return Array.from({ length: count }, (_, i) => {
    const [x, y, z] = surfacePoint(Math.PI * 0.56, (i / 20) * Math.PI * 2, 1.05)
    return [x, y + (i % 2 ? 0.05 : -0.04), z]
  })
}

export function Egg({ color, progress }) {
  const ref = useRef()
  const spotColor = useMemo(() => new Color(color).offsetHSL(0, -0.1, 0.18), [color])

  // Lắc lư quanh đáy; càng gần nở càng lắc nhanh và mạnh
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const speed = 1.5 + progress * 6
    const amount = 0.04 + progress * 0.14
    ref.current.rotation.z = Math.sin(t * speed) * amount
    ref.current.rotation.x = Math.sin(t * speed * 0.7) * amount * 0.5
  })

  return (
    <group ref={ref}>
      <mesh geometry={EGG_GEOMETRY}>
        <meshStandardMaterial color={color} flatShading roughness={0.55} />
      </mesh>
      {EGG_SPOTS.map(([t, angle]) => (
        <mesh key={`${t}-${angle}`} position={surfacePoint(t, angle, 0.96)}>
          <icosahedronGeometry args={[0.06, 0]} />
          <meshStandardMaterial color={spotColor} flatShading />
        </mesh>
      ))}
      {progress >= 0.4 && <Line points={crackPoints(progress)} color="#3b2d1f" lineWidth={2.5} />}
    </group>
  )
}

// Phóng to/thu nhỏ mượt tới tỉ lệ đích: thú mới hiện ra sẽ "bật" lên, lên giai đoạn thì lớn dần
function Grow({ scale, children }) {
  const ref = useRef()
  useFrame((_, delta) => {
    const current = ref.current.scale.x
    ref.current.scale.setScalar(current + (scale - current) * Math.min(1, delta * 4))
  })
  return <group ref={ref} scale={0.01}>{children}</group>
}

// Vòng sáng xoay dưới chân và đốm sáng bay quanh thú tiến hóa
function Aura({ color }) {
  const ring = useRef()
  // Màu vượt ngưỡng 1 để hiệu ứng Bloom làm tỏa sáng
  const glow = useMemo(() => new Color(color).multiplyScalar(3), [color])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    ring.current.rotation.z = t * 0.6
    ring.current.scale.setScalar(1 + Math.sin(t * 2) * 0.04)
  })

  return (
    <>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.02}>
        <torusGeometry args={[0.82, 0.022, 5, 36]} />
        <meshBasicMaterial color={glow} toneMapped={false} />
      </mesh>
      <Sparkles count={40} scale={[1.7, 1.7, 1.7]} position-y={0.85} size={2.5} speed={0.4} color={color} />
    </>
  )
}

// Nền gradient vẽ trong cảnh (thay cho nền CSS) để Bloom tỏa sáng đúng; màu theo token primary-100/50, accent-50
const BACKDROP_COLORS = {
  light: ['#e0e3ff', '#eef0ff', '#fff6ed'],
  dark: ['#272057', '#1f1a45', '#2a1a12'],
}

export function Backdrop() {
  const theme = useSyncExternalStore(subscribeTheme, () => document.documentElement.dataset.theme)
  const texture = useMemo(() => gradientTexture(BACKDROP_COLORS[theme] ?? BACKDROP_COLORS.light), [theme])
  useEffect(() => () => texture.dispose(), [texture])
  return <primitive attach="background" object={texture} />
}

// Theo dõi nút đổi giao diện sáng/tối (thuộc tính data-theme của <html>)
function subscribeTheme(callback) {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

function gradientTexture([top, middle, bottom]) {
  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 256
  const context = canvas.getContext('2d')
  const gradient = context.createLinearGradient(0, 0, 0, 256)
  gradient.addColorStop(0, top)
  gradient.addColorStop(0.6, middle)
  gradient.addColorStop(1, bottom)
  context.fillStyle = gradient
  context.fillRect(0, 0, 2, 256)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}
