import { Routes, Route } from 'react-router'
import './App.css'
import { Login } from './pages/auth/login'

function App() {
  return (
    <>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
    </Routes>
    </>
  )
}

export default App
