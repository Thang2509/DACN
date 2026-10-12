// Các bước của sắp xếp nổi bọt để vẽ hoạt ảnh.
// Mỗi phần tử có id cố định để hoạt ảnh biết phần tử nào di chuyển khi đổi chỗ.
export function bubbleSortSteps(values) {
  const items = values.map((value, id) => ({ id, value }))
  const steps = [{ items: [...items], compare: null, sorted: 0, message: 'Mảng ban đầu' }]

  for (let end = items.length - 1; end > 0; end--) {
    const sorted = items.length - 1 - end
    for (let i = 0; i < end; i++) {
      const [a, b] = [items[i], items[i + 1]]
      const swap = a.value > b.value
      steps.push({
        items: [...items],
        compare: [i, i + 1],
        sorted,
        message: `So sánh ${a.value} và ${b.value}: ${swap ? 'đổi chỗ' : 'giữ nguyên'}`,
      })
      if (swap) {
        ;[items[i], items[i + 1]] = [b, a]
        steps.push({ items: [...items], compare: [i, i + 1], sorted, swapped: true, message: `Đã đổi chỗ ${a.value} và ${b.value}` })
      }
    }
  }

  steps.push({ items: [...items], compare: null, sorted: items.length, message: 'Đã sắp xếp xong!' })
  return steps
}
