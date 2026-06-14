import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import NyankoChat from './components/NyankoChat'
import ToastHost from './components/ToastHost'
import HomePage from './pages/HomePage'
import PostDetailPage from './pages/PostDetailPage'
import CategoryPage from './pages/CategoryPage'
import SearchPage from './pages/SearchPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import WritePage from './pages/WritePage'
import AboutPage from './pages/AboutPage'
import AskPage from './pages/AskPage'
import UserCenterPage from './pages/UserCenterPage'
import MomentsPage from './pages/MomentsPage'
import FollowFeedPage from './pages/FollowFeedPage'
import BookmarksPage from './pages/BookmarksPage'
import ArchivePage from './pages/ArchivePage'
import TagPage from './pages/TagPage'

export default function App() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <ToastHost />
      <Navbar />
      <main className="flex-1">
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
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
      <Footer />
      <NyankoChat />
    </div>
  )
}
