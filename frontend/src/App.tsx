import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import NyankoChat from './components/NyankoChat'
import ToastHost from './components/ToastHost'
import Loading from './components/Loading'
import HomePage from './pages/HomePage'

// 路由级代码分割：首页直出，其余按需加载，减小首屏包体
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const WritePage = lazy(() => import('./pages/WritePage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const AskPage = lazy(() => import('./pages/AskPage'))
const UserCenterPage = lazy(() => import('./pages/UserCenterPage'))
const MomentsPage = lazy(() => import('./pages/MomentsPage'))
const FollowFeedPage = lazy(() => import('./pages/FollowFeedPage'))
const BookmarksPage = lazy(() => import('./pages/BookmarksPage'))
const ArchivePage = lazy(() => import('./pages/ArchivePage'))
const TagPage = lazy(() => import('./pages/TagPage'))
const AiSettingsPage = lazy(() => import('./pages/AiSettingsPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

export default function App() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <ToastHost />
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/moments" element={<MomentsPage />} />
            <Route path="/follow-feed" element={<FollowFeedPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/post/:id" element={<PostDetailPage />} />
            <Route path="/category/:id" element={<CategoryPage />} />
            <Route path="/tag/:id" element={<TagPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/ask" element={<AskPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/write" element={<WritePage />} />
            <Route path="/me" element={<UserCenterPage />} />
            <Route path="/admin/ai" element={<AiSettingsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <NyankoChat />
    </div>
  )
}
