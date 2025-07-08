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
import { PatientBookingPage } from './pages/patient/PatientBookingPage';
import { PatientAppointmentsPage } from './pages/patient/PatientAppointmentsPage';
import { StaffAppointmentsPage } from './pages/staff/StaffAppointmentsPage';
import ScheduleManagementPage from './pages/staff/ScheduleManagementPage';
import PatientTreatmentRecords from './pages/patient/PatientViewTreatmentRecord';
import ViewTreatmentProgressPage from './pages/patient/ViewTreatmentProgress';
import PatientList from './pages/patient/PatientList';
import OrthodonticTreatmentPlansPage from './pages/OrthodonticTreatmentPlans';
import OrthodonticTreatmentPlanFormPage from './pages/OrthodonticTreatmentPlanFormPage';
import FUAppointmentPage from './pages/appointment/FUAppointmentPage';
import { PrescriptionTemplatesPage } from './pages/prescription/PrescriptionTemplatesPage';
import { CreatePrescriptionTemplatePage } from './pages/prescription/CreatePrescriptionTemplatePage';
import { EditPrescriptionTemplatePage } from './pages/prescription/EditPrescriptionTemplatePage';
import { PrescriptionTemplateDetailPage } from './pages/prescription/PrescriptionTemplateDetailPage';
import { InventoryPage } from './pages/supply/InventoryPage';
import { CreateSupplyPage } from './pages/supply/CreateSupplyPage';
import { EditSupplyPage } from './pages/supply/EditSupplyPage';
import { SupplyDetailPage } from './pages/supply/SupplyDetailPage';
import UserManagement from './pages/auth/UserManagement';
import AssignedTasks from './pages/assistant/AssignedTasks';
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
        <Route path="/patient/dashboard" element={<PatientDashboardPage />} />
        <Route path="/dashboard" element={<StaffDashboard />} />
        <Route path="/patient/book-appointment" element={<PatientBookingPage />} />
        <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
        <Route path="/appointments" element={<StaffAppointmentsPage />} />
        <Route path="/schedules" element={<ScheduleManagementPage />} />
        <Route path="/patient/view-treatment-records" element={<PatientTreatmentRecords />} />
        <Route path="/patient/view-treatment-progress/:treatmentRecordId" element={<ViewTreatmentProgressPage />} />
        <Route path="/patients" element={<PatientList />} />
        <Route path="/patients/:patientId/orthodontic-treatment-plans" element={<OrthodonticTreatmentPlansPage />} />
        <Route path="/patients/:patientId/orthodontic-treatment-plans/new" element={<OrthodonticTreatmentPlanFormPage />} />
        <Route path="/patient/follow-up" element={<FUAppointmentPage />} />
        <Route path="/prescription-templates" element={<PrescriptionTemplatesPage />} />
        <Route path="/prescription-templates/create" element={<CreatePrescriptionTemplatePage />} />
        <Route path="/prescription-templates/:id" element={<PrescriptionTemplateDetailPage />} />
        <Route path="/prescription-templates/:id/edit" element={<EditPrescriptionTemplatePage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/inventory/create" element={<CreateSupplyPage />} />
        <Route path="/inventory/:supplyId" element={<SupplyDetailPage />} />
        <Route path="/inventory/:supplyId/edit" element={<EditSupplyPage />} />
        <Route path="/administrator/user-list" element={<UserManagement/>}/>
        <Route path="/assistant/assigned-tasks" element={<AssignedTasks/>}/>
      </Routes>
    </>
  );
}

export default App;
