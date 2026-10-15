import { lazy, Suspense, useEffect, useRef } from 'react'
import { STAGES } from '../pet/petStates'

// Cảnh 3D kéo theo three.js (khá nặng) nên tải riêng, phần chữ hiện ra trước
const HeroPets = lazy(() => import('../pet/HeroPet'))

const HEADER_HEIGHT = 56 // thanh menu dính trên cùng (h-14)

/**
 * Khối mở đầu trang chủ dạng cảnh 3D tràn màn hình: ba thú cưng nhìn theo chuột trên nền phát sáng.
 * Khối cao 2 màn hình, khung cảnh đứng yên (sticky) trong lúc cuộn; tiến độ cuộn 0 → 1 lưu ở ref (camera đọc)
 * và ở biến CSS --p (phần chữ đọc): đầu trang hiện intro bên trái, cuộn xuống thì chuyển sang phần giới thiệu thú cưng.
 * intro: chữ mở đầu; cta: nút ở phần thú cưng; decor: thẻ trang trí quanh thú (ẩn trên màn hẹp).
 */
export default function HomeHero({ intro, cta, decor }) {
  const section = useRef(null)
  const progress = useRef(0)

  useEffect(() => {
    const update = () => {
      const element = section.current
      const rect = element.getBoundingClientRect()
      const scrollable = rect.height - (window.innerHeight - HEADER_HEIGHT)
      const p = Math.min(1, Math.max(0, (HEADER_HEIGHT - rect.top) / scrollable))
      progress.current = p
      element.style.setProperty('--p', p.toFixed(4))
      element.dataset.stage = p < 0.5 ? 'intro' : 'outro'
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <section ref={section} data-stage="intro" className="group/hero relative mx-[calc(50%-50vw)] -mt-8 h-[200svh] text-white">
      {/* Dưới 1280px trừ thêm thanh tab dưới đáy (h-16) để không che chân thú */}
      <div className="sticky top-14 h-[calc(100svh-7.5rem)] overflow-hidden bg-[#2b2170] xl:h-[calc(100svh-3.5rem)]">
        <Suspense fallback={null}>
          <HeroPets progress={progress} />
        </Suspense>

        <div className="pointer-events-none relative mx-auto grid h-full max-w-6xl items-start px-4 py-10 md:grid-cols-2 md:items-center">
          {/* Cuộn xuống: intro lùi ra xa và mờ đi */}
          <div
            className="pointer-events-auto space-y-5 [grid-area:1/1] group-data-[stage=outro]/hero:invisible"
            style={{
              opacity: 'clamp(0, 1 - var(--p, 0) * 2.4, 1)',
              transform: 'translate3d(0, calc(var(--p, 0) * -90px), 0) scale(calc(1 - var(--p, 0) * 0.15))',
            }}
          >
            {intro}
          </div>

          {/* Phần thú cưng bay vào từ chiều sâu, nằm bên phải (màn hẹp: ở trên) */}
          <div
            className="pointer-events-auto max-w-md space-y-4 rounded-3xl bg-[#2b2170]/60 p-6 ring-1 ring-white/20 [grid-area:1/1] group-data-[stage=intro]/hero:invisible md:ml-auto md:[grid-area:1/2]"
            style={{
              opacity: 'clamp(0, (var(--p, 0) - 0.5) * 2.6, 1)',
              transform: 'perspective(900px) translate3d(0, calc((1 - var(--p, 0)) * 90px), 0) rotateY(calc((1 - var(--p, 0)) * -18deg))',
            }}
          >
            <p className="text-sm font-bold tracking-widest text-accent-300 uppercase">Thú cưng 3D</p>
            <h2 className="text-3xl font-extrabold leading-tight md:text-4xl">Học càng chăm,<br />thú càng lớn</h2>
            <p className="text-white/80">
              Mỗi bài học giúp thú no hơn, vui hơn và lớn dần qua từng giai đoạn. Rê chuột để thú nhìn theo, bấm vào để thú nhảy lên.
            </p>
            <ol className="flex flex-wrap gap-2 text-sm font-semibold">
              {Object.values(STAGES).map((stage, i) => (
                <li key={stage.label} className="rounded-full bg-white/15 px-3 py-1">{i + 1}. {stage.label}</li>
              ))}
            </ol>
            {cta}
          </div>

          {decor && (
            <div className="absolute inset-0 hidden md:block" style={{ opacity: 'clamp(0, 1 - var(--p, 0) * 3, 1)' }}>
              {decor}
            </div>
          )}
        </div>

        <p
          className="pointer-events-none absolute inset-x-0 bottom-5 text-center text-sm font-semibold text-white/70"
          style={{ opacity: 'clamp(0, 1 - var(--p, 0) * 5, 1)' }}
        >
          Cuộn để khám phá <span className="inline-block motion-safe:animate-bounce">↓</span>
        </p>
      </div>
    </section>
  )
}
