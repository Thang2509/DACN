import { Suspense, useCallback, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Button, Card } from '../../components/ui'
import PetModel from './PetModel'
import { PET_STATES } from './petStates'

export default function PetPage() {
  const [state, setState] = useState('idle')

  // Clip chạy 1 lần xong thì chuyển sang trạng thái kế tiếp (nếu có)
  const handleFinished = useCallback(() => {
    setState((current) => PET_STATES[current].next ?? current)
  }, [])

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <Card className="h-[480px] overflow-hidden bg-gradient-to-b from-primary-100 via-primary-50 to-accent-50 p-0">
        <Canvas camera={{ position: [2.3, 1.6, 3.2], fov: 35 }} dpr={[1, 2]}>
          <PetScene state={state} onFinished={handleFinished} />
        </Canvas>
      </Card>

      <Card className="space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold">Shiba</h1>
          <p className="text-sm text-muted">Bản thử hoạt ảnh · đang: {PET_STATES[state].label}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(PET_STATES).map(([key, { label }]) => (
            <Button
              key={key}
              size="sm"
              variant={key === state ? 'primary' : 'outline'}
              onClick={() => setState(key)}
            >
              {label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted">Mô hình: Shiba Inu – Quaternius (CC0)</p>
      </Card>
    </div>
  )
}

function PetScene({ state, onFinished }) {
  return (
    <>
      <hemisphereLight args={['#ffffff', '#c6caff', 1.8]} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} color="#fff4e6" />

      <Suspense fallback={null}>
        <PetModel state={state} onFinished={onFinished} />
      </Suspense>

      {/* Bục tròn low-poly */}
      <mesh position-y={-0.08}>
        <cylinderGeometry args={[1, 1.08, 0.16, 18]} />
        <meshStandardMaterial color="#c6caff" flatShading />
      </mesh>
      <ContactShadows position-y={0.001} scale={2.4} blur={2.4} opacity={0.45} far={1.5} />

      <OrbitControls
        target={[0, 0.4, 0]}
        enablePan={false}
        minDistance={1.8}
        maxDistance={5}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  )
}
