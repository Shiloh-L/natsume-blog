export interface Heading {
  level: number
  text: string
  id: string
}

/** 生成锚点 id：保留中文，空白转连字符，去除多余符号 */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
}

/** 从 Markdown 中提取 1~3 级标题，按出现顺序生成去重锚点 */
export function extractHeadings(markdown: string): Heading[] {
  if (!markdown) return []
  // 去掉围栏代码块，避免把代码里的 # 当成标题
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, '')
  const lines = withoutCode.split('\n')
  const seen = new Map<string, number>()
  const headings: Heading[] = []
  for (const line of lines) {
    const m = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line)
    if (!m) continue
    const level = m[1].length
    const text = m[2].replace(/[`*_~]/g, '').trim()
    let base = slugify(text) || 'heading'
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    const id = count === 0 ? base : `${base}-${count}`
    headings.push({ level, text, id })
  }
  return headings
}

/** 字数统计（中文按字符计，英文按词计）与预计阅读分钟数 */
export function readingStats(markdown: string): { words: number; minutes: number } {
  if (!markdown) return { words: 0, minutes: 1 }
  const plain = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~\-]/g, '')
  const cjk = (plain.match(/[\u4e00-\u9fa5]/g) || []).length
  const en = (plain.match(/[a-zA-Z0-9]+/g) || []).length
  const words = cjk + en
  const minutes = Math.max(1, Math.round(words / 400))
  return { words, minutes }
}
