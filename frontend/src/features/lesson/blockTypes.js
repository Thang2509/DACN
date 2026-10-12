// Các loại khối và nội dung mặc định khi thêm mới (khớp SaveBlocksRequest ở backend).
// "Phần" là tiêu đề chia bài thành nhiều phần như Sydexa.
export const BLOCK_TYPES = {
  section: { label: 'Phần', create: () => ({ title: '' }) },
  markdown: { label: 'Văn bản', create: () => ({ text: '' }) },
  video: { label: 'Video', create: () => ({ url: '', caption: '' }) },
  quiz: { label: 'Quiz', create: () => ({ variant: 'quick', questions: [newQuestion()] }) },
  animation: { label: 'Hoạt ảnh', create: () => ({ component: '', params: {} }) },
  code: { label: 'Code', create: () => ({ language: 'javascript', instructions: '', starter: '', solution: '', expected: '' }) },
  flashcard: { label: 'Flashcard', create: () => ({ cards: [{ front: '', back: '' }] }) },
}

export function newQuestion() {
  return { question: '', options: ['', ''], answer: 0, explanation: '' }
}

export const QUIZ_VARIANTS = {
  quick: 'Quiz nhanh',
  predict: 'Dự đoán trước khi xem',
  test: 'Kiểm tra kiến thức',
}

// "Kiểm tra kiến thức" và "Tổng kết" là phần cuối bài, không đánh số
const UNNUMBERED_SECTIONS = ['kiểm tra kiến thức', 'tổng kết']

// Số thứ tự "Phần N" cho từng khối (null nếu không phải Phần được đánh số), cùng thứ tự với blocks
export function sectionNumbers(blocks) {
  let count = 0
  return blocks.map((block) => {
    if (block.type !== 'section') return null
    const title = (block.content.title ?? '').trim().toLowerCase()
    return UNNUMBERED_SECTIONS.some((special) => title.startsWith(special)) ? null : ++count
  })
}

// Tên các component hoạt ảnh (cài đặt ở Animations.jsx)
export const ANIMATIONS = ['StackAnimation', 'BubbleSortAnimation']

// Link YouTube (watch, youtu.be, shorts, embed) → mã video 11 ký tự; không phải YouTube thì trả null
export function youtubeId(url) {
  return url?.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)?.[1] ?? null
}

export function youtubeEmbedUrl(url) {
  const id = youtubeId(url)
  return id ? `https://www.youtube.com/embed/${id}` : null
}
