import { Routes, Route } from 'react-router'
import './App.css'
import { Login } from './pages/auth/login'
import { ForgotPassword } from './pages/auth/forgotPassword'

function App() {
  return (
    <>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Routes>
    </>
  )
}

export default App
