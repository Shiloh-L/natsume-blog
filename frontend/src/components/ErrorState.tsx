import { Link } from 'react-router-dom'

export default function ErrorState({
  message = '出了点小状况，没能加载内容',
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="py-20 text-center">
      <div className="text-4xl">🍂</div>
      <p className="mt-3 text-ink-soft">{message}</p>
      <div className="mt-5 flex justify-center gap-3">
        {onRetry && (
          <button onClick={onRetry} className="ghibli-btn-primary text-sm">
            再试一次
          </button>
        )}
        <Link to="/" className="ghibli-btn-ghost text-sm">
          回到首页
        </Link>
      </div>
    </div>
  )
}
