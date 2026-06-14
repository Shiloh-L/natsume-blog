// 原创水彩场景封面 — 唤起宫崎骏式氛围（夏日青丘 / 森林黄昏 / 星夜草原 / 海边 / 雨中森林 / 花田）
// 未上传封面时按文章 id 稳定分配，告别随机照片，且零版权风险。
const SCENES = [
  '/covers/scene-1.svg',
  '/covers/scene-2.svg',
  '/covers/scene-3.svg',
  '/covers/scene-4.svg',
  '/covers/scene-5.svg',
  '/covers/scene-6.svg',
]

function hash(seed: number | string): number {
  const s = String(seed)
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return h
}

/** 按种子（通常是文章 id）稳定地取一张主题场景封面 */
export function defaultCover(seed: number | string): string {
  return SCENES[hash(seed) % SCENES.length]
}

/** 已有封面则用之，否则回退到主题场景封面 */
export function coverOf(cover: string | undefined | null, seed: number | string): string {
  return cover && cover.trim() ? cover : defaultCover(seed)
}
