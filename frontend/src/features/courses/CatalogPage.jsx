import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Button, Card, Input, Select } from '../../components/ui'
import { CATEGORY_OPTIONS, getCourses, getLearningPaths, LEVEL_OPTIONS } from './api'
import CourseCard from './CourseCard'

const FILTER_KEYS = ['search', 'category', 'level', 'price', 'path', 'sort', 'page']

// Danh mục khóa học; bộ lọc nằm trên URL để chia sẻ được link
export default function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, params.get(key) ?? '']))
  const { data, isLoading } = useQuery({
    queryKey: ['courses', filters],
    queryFn: () => getCourses(filters),
    placeholderData: keepPreviousData,
  })
  const { data: paths = [] } = useQuery({ queryKey: ['learning-paths'], queryFn: getLearningPaths })

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page') // đổi bộ lọc thì về trang 1
    setParams(next, { replace: true })
  }

  // Gõ tìm kiếm: chờ người dùng dừng gõ 400ms mới gọi API
  const [search, setSearch] = useState(filters.search)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (params.get('search') ?? '')) setFilter('search', search)
    }, 400)
    return () => clearTimeout(timer)
    // Chỉ chạy khi người dùng gõ, không chạy khi URL đổi (vd. bấm Back)
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const page = Number(filters.page || 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Khóa học</h1>
        <p className="text-muted">Lập trình và công nghệ thông tin, từ cơ bản đến nâng cao.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries({ '': 'Tất cả', ...CATEGORY_OPTIONS }).map(([value, text]) => (
          <Button key={value} size="sm" variant={filters.category === value ? 'primary' : 'outline'} onClick={() => setFilter('category', value)}>
            {text}
          </Button>
        ))}
      </div>

      <Card className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <Input placeholder="Tìm khóa học…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select options={{ '': 'Mọi cấp độ', ...LEVEL_OPTIONS }} value={filters.level} onChange={(e) => setFilter('level', e.target.value)} />
        <Select options={{ '': 'Mọi mức giá', free: 'Miễn phí', paid: 'Có phí' }} value={filters.price} onChange={(e) => setFilter('price', e.target.value)} />
        <Select
          options={{ '': 'Mọi lộ trình', ...Object.fromEntries(paths.map((path) => [path.slug, path.title])) }}
          value={filters.path}
          onChange={(e) => setFilter('path', e.target.value)}
        />
        <Select options={{ '': 'Mới nhất', popular: 'Phổ biến' }} value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)} />
      </Card>

      {isLoading && <p className="text-muted">Đang tải…</p>}
      {data?.data.length === 0 && <Card className="text-center text-muted">Không tìm thấy khóa học phù hợp.</Card>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.data.map((course) => <CourseCard key={course.id} course={course} />)}
      </div>

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setFilter('page', String(page - 1))}>← Trước</Button>
          <span className="text-sm text-muted">Trang {page}/{data.last_page}</span>
          <Button size="sm" variant="outline" disabled={page >= data.last_page} onClick={() => setFilter('page', String(page + 1))}>Sau →</Button>
        </div>
      )}
    </div>
  )
}
