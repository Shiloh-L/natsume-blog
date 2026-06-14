import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchCategories, fetchPosts } from '../api/posts'
import PostCard from '../components/PostCard'
import Loading from '../components/Loading'
import { coverOf } from '../utils/cover'

export default function CategoryPage() {
  const { id } = useParams()
  const categoryId = Number(id)
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  const { data, isLoading } = useQuery({
    queryKey: ['posts', 'cat', categoryId],
    queryFn: () => fetchPosts({ categoryId, current: 1, size: 30 }),
  })
  const category = categories?.find((c) => c.id === categoryId)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 overflow-hidden rounded-[2rem] shadow-soft">
        <div className="relative h-44">
          <img
            src={coverOf(category?.cover, `cat${categoryId}`)}
            alt={category?.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink/40 text-white">
            <h1 className="brush-title text-4xl">{category?.name || '分类'}</h1>
            <p className="mt-2 text-sm opacity-90">{category?.description}</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Loading />
      ) : data?.records.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.records.map((p, i) => (
            <PostCard key={p.id} post={p} index={i} />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-ink-light">这个分类还空空如也 🍃</p>
      )}
    </div>
  )
}
