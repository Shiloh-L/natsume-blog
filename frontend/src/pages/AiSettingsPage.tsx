import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  fetchAiConfig,
  updateAiConfig,
  testAiConfig,
  type AiConfigView,
} from '../api/aiConfig'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'
import Loading from '../components/Loading'

const PRESETS = [
  { label: 'DeepSeek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  { label: 'OpenAI', baseUrl: 'https://api.openai.com', model: 'gpt-4o-mini' },
  { label: '本机网关', baseUrl: 'http://host.docker.internal:9191', model: 'claude-opus-4.6' },
]

export default function AiSettingsPage() {
  const { user, isAdmin } = useAuthStore()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [view, setView] = useState<AiConfigView | null>(null)

  const [provider, setProvider] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [model, setModel] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!isAdmin()) {
      setLoading(false)
      return
    }
    fetchAiConfig()
      .then((c) => {
        setView(c)
        setProvider(c.provider)
        setBaseUrl(c.baseUrl)
        setModel(c.model)
        setTemperature(c.temperature)
      })
      .catch(() => toast.error('加载 AI 配置失败'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <Loading />

  if (!isAdmin()) {
    return (
      <div className="py-24 text-center text-ink-soft">
        只有猫咪老师的主人（管理员）才能调教 AI 哦 🐾
      </div>
    )
  }

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setProvider(p.label)
    setBaseUrl(p.baseUrl)
    setModel(p.model)
  }

  const onSave = async () => {
    if (!baseUrl.trim() || !model.trim()) {
      toast.error('base-url 与模型名不能为空')
      return
    }
    setSaving(true)
    try {
      const updated = await updateAiConfig({
        provider,
        baseUrl: baseUrl.trim(),
        model: model.trim(),
        temperature,
        apiKey: apiKey.trim() || undefined,
      })
      setView(updated)
      setApiKey('')
      toast.success('已保存，AI 已切换 🐱')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const onTest = async () => {
    setTesting(true)
    try {
      const r = await testAiConfig()
      if (r.ok) {
        toast.success(`连通正常（${r.costMs}ms）：${(r.reply || '').slice(0, 30)}…`)
      } else {
        toast.error(`连接失败：${r.error || '未知错误'}`)
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '测试失败')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="mb-2 flex items-center justify-center gap-3 text-ink-light">
          <span className="h-px w-10 bg-ink/15" />
          <span className="text-xl">🐱</span>
          <span className="h-px w-10 bg-ink/15" />
        </div>
        <h1 className="brush-title text-4xl text-ink">调教猫咪老师</h1>
        <p className="mt-2 text-sm text-ink-soft">配置 AI 大模型，保存后立即热生效，无需重启</p>
      </motion.div>

      <div className="paper-card space-y-5 p-6">
        {/* 预设 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-ink">快速预设</label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="rounded-full bg-matcha-light/40 px-4 py-1.5 text-sm text-matcha-deep ring-1 ring-matcha/20 transition-transform hover:-translate-y-0.5"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">供应商名称</label>
          <input
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="如 DeepSeek"
            className="w-full rounded-xl bg-white/70 px-4 py-2 text-sm ring-1 ring-ink/10 outline-none focus:ring-matcha/40"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Base URL（OpenAI 兼容）</label>
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.deepseek.com"
            className="w-full rounded-xl bg-white/70 px-4 py-2 text-sm ring-1 ring-ink/10 outline-none focus:ring-matcha/40"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">模型名</label>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="deepseek-chat"
            className="w-full rounded-xl bg-white/70 px-4 py-2 text-sm ring-1 ring-ink/10 outline-none focus:ring-matcha/40"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            温度 Temperature：<span className="text-matcha-deep">{temperature.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="w-full accent-matcha"
          />
          <div className="flex justify-between text-[11px] text-ink-light">
            <span>严谨 0</span>
            <span>发散 2</span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            API Key
            {view?.apiKeySet && (
              <span className="ml-2 text-xs text-ink-light">
                当前：{view.apiKeyMasked || '已设置'}（留空则不修改）
              </span>
            )}
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={view?.apiKeySet ? '••••••（留空保持不变）' : '输入新的 API Key'}
            className="w-full rounded-xl bg-white/70 px-4 py-2 text-sm ring-1 ring-ink/10 outline-none focus:ring-matcha/40"
          />
          <p className="mt-1 text-[11px] text-ink-light">
            密钥仅保存在服务端数据库；留空时回退到环境变量 LLM_API_KEY。
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button onClick={onSave} disabled={saving} className="ghibli-btn-primary text-sm disabled:opacity-50">
            {saving ? '保存中…' : '保存并热生效'}
          </button>
          <button onClick={onTest} disabled={testing} className="ghibli-btn-ghost text-sm disabled:opacity-50">
            {testing ? '测试中…' : '🔌 测试连通'}
          </button>
          {view?.updateTime && (
            <span className="ml-auto self-center text-xs text-ink-light">
              上次更新：{view.updateTime}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
