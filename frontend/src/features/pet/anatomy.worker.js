import { buildBody } from './anatomy'

// Dựng lưới thú trong luồng phụ (mỗi con mất khoảng 1 giây) để trang không bị đứng; mảng số được chuyển giao, không sao chép
self.onmessage = ({ data: { key, code, youth } }) => {
  const body = buildBody(code, youth)
  const buffers = [...Object.values(body.mesh), ...Object.values(body.nose)].map((array) => array.buffer)
  self.postMessage({ key, body }, buffers)
}
