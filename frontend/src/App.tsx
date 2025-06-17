import { BrowserRouter as Router, Route, Routes } from 'react-router'
import { Login } from './pages/auth/login' 
import { ForgotPassword } from './pages/auth/forgotPassword'
import './App.css'
import { HomePage } from './pages/HomePage'
import { LearnMorePage } from './pages/LearnMorePage'
import { CosmeticDentistryPage, GeneralDentistryPage, OralSurgeryPage, PediatricDentistryPage, PreventiveCare, RestorativeDentistryPage } from './pages/services'
import { BookAppointmentPage } from './pages/BookAppoinmentPage'
import VerifyOTPPage from './pages/auth/VerifyOTP'
import VerifyOTP from './pages/auth/VerifyOTP'
import AddPatient from './pages/auth/CreatePatientAccount'
import ResetPassword from './pages/auth/ResetPassword'
import ViewProfile from './pages/auth/ViewProfile'
function App() {
  return (
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/learn-more" element={<LearnMorePage />} />
        <Route path="/services/general-dentistry" element={<GeneralDentistryPage />} />
        <Route path="/services/cosmetic-dentistry" element={<CosmeticDentistryPage />} />
        <Route path="/services/oral-surgery" element={<OralSurgeryPage />} />
        <Route path="/services/pediatric-dentistry" element={<PediatricDentistryPage />} />
        <Route path="/services/preventive-care" element={<PreventiveCare />} />
        <Route path="/services/restorative-dentistry" element={<RestorativeDentistryPage />} />
        <Route path="/appointment-booking" element={<BookAppointmentPage />} />
        <Route path="/verify-otp" element={<VerifyOTPPage/>} />
        <Route path="/verify-otp" element={<VerifyOTP/>} />
        <Route path="/add-patient" element={<AddPatient/>} />
        <Route path="/reset-password" element={<ResetPassword/>} />
        <Route path="/view-profile" element={<ViewProfile/>} />
      </Routes>
  )
}

export default App
