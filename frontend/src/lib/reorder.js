// Chuyển phần tử từ vị trí from sang to, trả về mảng mới (vị trí ngoài mảng thì giữ nguyên)
export function moveItem(list, from, to) {
  if (from === to || to < 0 || to >= list.length) return list
  const copy = [...list]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return copy
}

// Đưa bài học lên (-1) hoặc xuống (+1); ở đầu/cuối chương thì chuyển sang chương liền kề
export function moveLesson(chapters, lessonId, direction) {
  const c = chapters.findIndex((chapter) => chapter.lessons.some((lesson) => lesson.id === lessonId))
  if (c === -1) return chapters

  const lessons = chapters[c].lessons
  const i = lessons.findIndex((lesson) => lesson.id === lessonId)
  if (i + direction >= 0 && i + direction < lessons.length) {
    return chapters.map((chapter, index) =>
      index === c ? { ...chapter, lessons: moveItem(lessons, i, i + direction) } : chapter,
    )
  }

  const target = c + direction
  if (target < 0 || target >= chapters.length) return chapters
  const moving = lessons[i]
  return chapters.map((chapter, index) => {
    if (index === c) return { ...chapter, lessons: lessons.filter((lesson) => lesson.id !== lessonId) }
    if (index === target) {
      // Lên thì vào cuối chương trước, xuống thì vào đầu chương sau
      const next = direction < 0 ? [...chapter.lessons, moving] : [moving, ...chapter.lessons]
      return { ...chapter, lessons: next }
    }
    return chapter
  })
}
