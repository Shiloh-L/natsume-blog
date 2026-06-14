export default function Footer() {
  return (
    <footer className="relative mt-16">
      <svg viewBox="0 0 1440 120" className="w-full" preserveAspectRatio="none">
        <path
          d="M0,64 C240,112 480,16 720,48 C960,80 1200,128 1440,72 L1440,120 L0,120 Z"
          fill="#8FAE7B"
          opacity="0.25"
        />
        <path
          d="M0,80 C240,40 480,120 720,88 C960,56 1200,24 1440,64 L1440,120 L0,120 Z"
          fill="#5E7C5A"
          opacity="0.18"
        />
      </svg>
      <div className="bg-matcha-deep/10 px-4 py-8 text-center text-sm text-ink-soft">
        <p className="brush-title text-lg text-matcha-deep">名字一旦归还，便化作温柔的风</p>
        <p className="mt-2 text-ink-light">
          夏目友人帐 · 温柔小屋 — 用 React + Spring Boot 编织的模块化单体博客
        </p>
        <p className="mt-1 text-xs text-ink-light/70">
          © {new Date().getFullYear()} Natsume Blog · 仅供学习交流 · 插画与封面均为原创
        </p>
      </div>
    </footer>
  )
}
