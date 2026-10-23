import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import AboutPage from './pages/AboutPage'
import AdminPage from './pages/AdminPage'
import BillPage from './pages/BillPage'
import BodiesPage from './pages/BodiesPage'
import BodyPage from './pages/BodyPage'
import CodeArticlePage from './pages/CodeArticlePage'
import CodePage from './pages/CodePage'
import DocumentPage from './pages/DocumentPage'
import DumaPage from './pages/DumaPage'
import HomePage from './pages/HomePage'
import InternationalPage from './pages/InternationalPage'
import LegislationPage from './pages/LegislationPage'
import NewsArticlePage from './pages/NewsArticlePage'
import NewsPage from './pages/NewsPage'
import NotFoundPage from './pages/NotFoundPage'
import SearchPage from './pages/SearchPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="news/:id" element={<NewsArticlePage />} />
        <Route path="duma" element={<DumaPage />} />
        <Route path="duma/bills/:id" element={<BillPage />} />
        <Route path="legislation" element={<LegislationPage />} />
        <Route path="legislation/:id" element={<DocumentPage />} />
        <Route path="criminal-code" element={<CodePage kind="criminal" />} />
        <Route path="criminal-code/:id" element={<CodeArticlePage kind="criminal" />} />
        <Route path="administrative-code" element={<CodePage kind="administrative" />} />
        <Route path="administrative-code/:id" element={<CodeArticlePage kind="administrative" />} />
        <Route path="bodies" element={<BodiesPage />} />
        <Route path="bodies/:slug" element={<BodyPage />} />
        <Route path="international" element={<InternationalPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
