import { BrowserRouter as Router, Route, Routes } from 'react-router';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Quan trọng!

import './App.css';

import { Login } from './pages/auth/login';
import { ForgotPassword } from './pages/auth/forgotPassword';
import { HomePage } from './pages/homepage/HomePage';
import { LearnMorePage } from './pages/homepage/LearnMorePage';
import { CosmeticDentistryPage, GeneralDentistryPage, OralSurgeryPage, PediatricDentistryPage, PreventiveCare, RestorativeDentistryPage } from './pages/services';
import { BookAppointmentPage } from './pages/appointment/BookAppoinmentPage';
import VerifyOTPPage from './pages/auth/VerifyOTP';
import AddPatient from './pages/auth/CreatePatientAccount';
import AuthCallback from './pages/auth/AuthCallback';
import ResetPassword from './pages/auth/ResetPassword';
import ViewProfile from './pages/auth/ViewProfile';
import { PatientDashboardPage } from './pages/patient/PatientDashboardPage';
import { StaffDashboard } from './pages/staff/StaffDashboard';

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} toastStyle={{ marginTop: '80px' }} />
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
        <Route path="/verify-otp" element={<VerifyOTPPage />} />
        <Route path="/add-patient" element={<AddPatient />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/view-profile" element={<ViewProfile />} />
        <Route path="/patient/dashboard" element={<PatientDashboardPage/>} />
        <Route path="/dashboard" element={<StaffDashboard/>} />
      </Routes>
    </>
  );
}

export default App;
