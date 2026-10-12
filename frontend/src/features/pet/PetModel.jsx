import { useEffect, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { Box3, LoopOnce, LoopRepeat } from 'three'
import { MODEL_URL, PET_STATES } from './petStates'

const FADE_SECONDS = 0.35

// Quy mô hình về cao 1 đơn vị, chân chạm sàn, đứng giữa bục (đo 1 lần ở tư thế gốc)
function useFitToUnitHeight(scene) {
  return useMemo(() => {
    // Mô hình có xương: phải cập nhật ma trận các xương trước khi đo, nếu không khung bao bị sai
    scene.updateMatrixWorld(true)
    const box = new Box3().setFromObject(scene, true)
    const scale = 1 / (box.max.y - box.min.y)
    const position = [
      (-(box.min.x + box.max.x) / 2) * scale,
      -box.min.y * scale,
      (-(box.min.z + box.max.z) / 2) * scale,
    ]
    return { scale, position }
  }, [scene])
}

export default function PetModel({ state, onFinished }) {
  const group = useRef()
  const { scene, animations } = useGLTF(MODEL_URL)
  const { actions, mixer } = useAnimations(animations, group)
  const fit = useFitToUnitHeight(scene)

  // Trộn hoạt ảnh: clip mới mờ dần vào, clip cũ mờ dần ra trong cleanup
  useEffect(() => {
    const { clip, once, speed = 1 } = PET_STATES[state]
    const action = actions[clip]
    action.reset()
    action.setLoop(once ? LoopOnce : LoopRepeat, Infinity)
    // Đối tượng của three.js được thiết kế để gán trực tiếp, không phải state React
    // oxlint-disable-next-line react/immutability
    action.clampWhenFinished = true
    action.setEffectiveTimeScale(speed)
    action.fadeIn(FADE_SECONDS).play()
    return () => {
      action.fadeOut(FADE_SECONDS)
    }
  }, [state, actions])

  // Báo cho trang khi clip chạy 1 lần đã xong (vd. nhảy xong thì về đứng)
  useEffect(() => {
    const handleFinished = () => onFinished?.()
    mixer.addEventListener('finished', handleFinished)
    return () => mixer.removeEventListener('finished', handleFinished)
  }, [mixer, onFinished])

  return (
    <group scale={fit.scale} position={fit.position}>
      <group ref={group} dispose={null}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

useGLTF.preload(MODEL_URL)
