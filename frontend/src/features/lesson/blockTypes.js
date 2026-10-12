// 6 loại khối nội dung và nội dung mặc định khi thêm mới (khớp SaveBlocksRequest ở backend)
export const BLOCK_TYPES = {
  markdown: { label: 'Văn bản', create: () => ({ text: '' }) },
  video: { label: 'Video', create: () => ({ url: '', caption: '' }) },
  quiz: { label: 'Quiz', create: () => ({ questions: [newQuestion()] }) },
  animation: { label: 'Hoạt ảnh', create: () => ({ component: '', params: {} }) },
  code: { label: 'Code', create: () => ({ language: 'javascript', instructions: '', starter: '', solution: '', expected: '' }) },
  flashcard: { label: 'Flashcard', create: () => ({ cards: [{ front: '', back: '' }] }) },
}

export function newQuestion() {
  return { question: '', options: ['', ''], answer: 0, explanation: '' }
}

// Tên các component hoạt ảnh (sẽ cài đặt ở trình học bài)
export const ANIMATIONS = ['StackAnimation', 'BubbleSortAnimation']

// Link YouTube (watch, youtu.be, shorts, embed) → mã video 11 ký tự; không phải YouTube thì trả null
export function youtubeId(url) {
  return url?.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)?.[1] ?? null
}

export function youtubeEmbedUrl(url) {
  const id = youtubeId(url)
  return id ? `https://www.youtube.com/embed/${id}` : null
}
