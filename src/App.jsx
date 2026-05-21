import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Licenses from './pages/Licenses'
import Customers from './pages/Customers'
import Packages from './pages/Packages'
import Layout from './components/Layout'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="licenses" element={<Licenses />} />
            <Route path="customers" element={<Customers />} />
            <Route path="packages" element={<Packages />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
