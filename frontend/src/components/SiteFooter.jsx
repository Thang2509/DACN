import { Link } from 'react-router-dom'

// Chân trang chung: giới thiệu, liên kết nhanh, thông tin đồ án và nguồn tài nguyên CC0
export default function SiteFooter() {
  const links = {
    '/courses': 'Khóa học',
    '/pet': 'Thú cưng',
    '/quests': 'Nhiệm vụ',
    '/achievements': 'Thành tích',
    '/leaderboard': 'Bảng xếp hạng',
    '/shop': 'Cửa hàng',
  }

  return (
    <footer className="mt-16 border-t border-primary-100 bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.4fr_1fr_1.4fr]">
        <div className="space-y-2">
          <p className="text-xl font-extrabold text-primary-700">
            Edu<span className="text-accent-500">Quest</span>
          </p>
          <p className="text-sm text-muted">
            Học lập trình theo từng khối nội dung ngắn, code chạy ngay trên trình duyệt, nhận XP và xu, nuôi thú cưng 3D lớn lên cùng bạn.
          </p>
        </div>
        <div>
          <p className="mb-2 font-bold">Khám phá</p>
          <ul className="space-y-1.5 text-sm">
            {Object.entries(links).map(([to, label]) => (
              <li key={to}><Link to={to} className="text-muted hover:text-primary-600">{label}</Link></li>
            ))}
          </ul>
        </div>
        <div className="space-y-1.5 text-sm text-muted">
          <p className="font-bold text-ink">Đồ án chuyên ngành</p>
          <p>Xây dựng hệ thống học tập trực tuyến tích hợp đổi thưởng</p>
          <p>Sinh viên: Võ Quốc Thắng · GVHD: ThS. Phạm Thị Trúc Mai</p>
          <p>Thú cưng, nội thất và căn phòng 3D dựng hoàn toàn bằng code (three.js)</p>
        </div>
      </div>
      <p className="border-t border-primary-100 py-4 text-center text-xs text-muted">© 2026 EduQuest</p>
    </footer>
  )
}
