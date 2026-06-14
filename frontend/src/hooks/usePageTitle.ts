import { useEffect } from 'react'

const SUFFIX = '夏目友人帐 · 温柔小屋'

/**
 * 设置浏览器标签页标题；路由切换时各页各自设置。
 * 传入页面名，最终标题形如「文章标题 · 夏目友人帐 · 温柔小屋」。
 * 传空则仅显示站点标题。
 */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SUFFIX}` : SUFFIX
  }, [title])
}
