// Bộ biểu tượng nét đơn (24 × 24, viền 2px) vẽ bằng SVG, không dùng thư viện icon
const PATHS = {
  home: 'M3 11l9-8 9 8M5 9.5V20h5v-6h4v6h5V9.5',
  book: 'M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 5v16M8 7h7',
  play: 'M6 4l14 8-14 8z',
  paw: 'M6.4 8.5a1.6 2 0 1 0 3.2 0a1.6 2 0 1 0-3.2 0M14.4 8.5a1.6 2 0 1 0 3.2 0a1.6 2 0 1 0-3.2 0M3 13a1.5 1.8 0 1 0 3 0a1.5 1.8 0 1 0-3 0M18 13a1.5 1.8 0 1 0 3 0a1.5 1.8 0 1 0-3 0M12 13c-3 0-5 3-5 5 0 1.5 1.5 2 2.5 2s1.5-.5 2.5-.5 1.5.5 2.5.5 2.5-.5 2.5-2c0-2-2-5-5-5z',
  trophy: 'M8 4h8v5a4 4 0 01-8 0zM8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M8 21h8M9 17h6',
  quest: 'M10 6h10M10 12h10M10 18h10M3.5 6l1.5 1.5L8 4.5M3.5 12l1.5 1.5L8 10.5M3.5 18l1.5 1.5L8 16.5',
  podium: 'M9 20V8h6v12M3 20v-7h6M15 20v-5h6v5M2 20h20M12 3l.8 1.6 1.7.2-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.2z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  shop: 'M4 8h16l-1.5 11a2 2 0 01-2 1.7h-9a2 2 0 01-2-1.7zM9 8V6a3 3 0 016 0v2',
  cards: 'M7 4h11a1 1 0 011 1v12M4 8h11a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  teach: 'M3 8l9-4 9 4-9 4zM7 10v5c0 1.5 2.5 3 5 3s5-1.5 5-3v-5M21 8v6',
  shield: 'M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6z',
  logout: 'M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 16l4-4-4-4M14 12H4',
  login: 'M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 8l4 4-4 4M14 12H4',
  blocks: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 16.5h7M16.5 13v7',
  code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
  gift: 'M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-1.5-3-5-3-5-1s3 1 5 1c2 0 5 1 5-1s-3.5-2-5 1',
  sparkle: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z',
}

export default function Icon({ name, className = 'size-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  )
}
