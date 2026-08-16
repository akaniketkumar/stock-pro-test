import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ErrorBoundary from './components/ui/ErrorBoundary'
import Home from './pages/Home'
import StockDetail from './pages/StockDetail'
import IndexView from './pages/IndexView'
import Screener from './pages/Screener'
import IPOs from './pages/IPOs'
import PremiumInsights from './pages/PremiumInsights'
import Login from './pages/Login'
import Signup from './pages/Signup'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    // Poori website ko Safety Net (ErrorBoundary) me daal diya
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/stock/:id" element={<StockDetail />} />
          <Route path="/index/:id" element={<IndexView />} />
          <Route path="/screener" element={<Screener />} />
          <Route path="/ipos" element={<IPOs />} />
          <Route path="/premium" element={<PremiumInsights />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}
