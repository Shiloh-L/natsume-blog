import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { extractHeadings } from '../utils/toc'

export default function MarkdownView({ content }: { content: string }) {
  const headings = useMemo(() => extractHeadings(content), [content])

  // react-markdown 按源码顺序渲染标题，用一个计数器与 extractHeadings 的顺序对齐
  const counter = { i: 0 }
  const renderHeading = (level: 1 | 2 | 3) => {
    const Comp = ({ children }: { children?: React.ReactNode }) => {
      const h = headings[counter.i]
      counter.i += 1
      const Tag = `h${level}` as 'h1' | 'h2' | 'h3'
      return (
        <Tag id={h?.id} className="scroll-mt-24">
          {children}
        </Tag>
      )
    }
    return Comp
  }

  return (
    <div className="prose-natsume max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: renderHeading(1),
          h2: renderHeading(2),
          h3: renderHeading(3),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
