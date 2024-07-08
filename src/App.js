import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";

import PrivateRoute from "./components/PrivateRoute";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import Teachers from "./pages/Teachers";
import CreateTeacherPage from "./pages/CreateTeacherPage";
import Classes from "./pages/Classes";
import CreateClass from "./pages/CreateClass";
import Students from "./pages/Students";
import CreateStudent from "./pages/CreateStudent";
import AddRequirement from "./pages/AddRequirements";
import StudentClearance from "./pages/StudentClearance";
import ApproveClearanceTeachers from "./pages/ApproveClearanceTeachers"
import UserManagement from "./pages/UserManagement";
import AddOfficeRequirement from "./pages/AddOfficeRequirement";
import CreateUser from "./pages/CreateUser";
import ApproveClearanceOffice from "./pages/ApproveClearanceOffice";
import ViewClasses from "./pages/ViewClasses";
import ClassDetails from "./pages/ClassDetails";
import ClassDetailsForAdviser from "./pages/ClassDetailsForAdviser";
import AuditLogs from "./pages/AuditLogs";
import StudentsMasterList from "./pages/StudentsMasterList";
import Chat from "./pages/Chat";
import ViewMessages from "./pages/ViewMessages";
import ViewMessagesStudent from "./pages/ViewMessagesStudent"
import DisciplinaryRecords from "./pages/DisciplinaryRecords";
import UpdateClass from "./pages/UpdateClass";
import ManageRequirements from "./pages/ManageRequirements";
import ManageOfficeRequirements from "./pages/ManageOfficeRequirements";
import OfficeClearanceManual from "./pages/OfficeClearanceManual";
import ForgotPassword from "./pages/ForgotPassword";
import SchoolEvents from "./pages/SchoolEvents";
import SendPaymentConfirmationEmail from "./pages/SendPaymentConfirmationEmail";

const router = createBrowserRouter([
  { path: "/", element: <SignIn /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/dashboard", element: <PrivateRoute><Dashboard /></PrivateRoute> },
  { path: "/teachers", element: <PrivateRoute><Teachers /></PrivateRoute> },
  { path: "/create-teacher", element: <PrivateRoute><CreateTeacherPage /></PrivateRoute> },
  { path: "/classes", element: <PrivateRoute><Classes /></PrivateRoute> },
  { path: "/create-class", element: <PrivateRoute><CreateClass /></PrivateRoute> },
  { path: "/students", element: <PrivateRoute><Students /></PrivateRoute> },
  { path: "/create-student", element: <PrivateRoute><CreateStudent /></PrivateRoute> },
  { path: "/add-requirement", element: <PrivateRoute><AddRequirement /></PrivateRoute> },
  { path: "/student-clearance", element: <PrivateRoute><StudentClearance /></PrivateRoute> },
  { path: "/approve-clearance-faculty", element: <PrivateRoute><ApproveClearanceTeachers /></PrivateRoute>},
  { path: "/user-management", element: <PrivateRoute><UserManagement /></PrivateRoute> },
  { path: "/create-user", element: <PrivateRoute><CreateUser /></PrivateRoute>},
  { path: "/add-office-requirement", element: <PrivateRoute><AddOfficeRequirement /></PrivateRoute>},
  { path: "/approve-clearance-office", element: <PrivateRoute><ApproveClearanceOffice /></PrivateRoute>},
  { path: "/view-classes", element: <PrivateRoute><ViewClasses /></PrivateRoute>},
  { path: "/class-details/:classId", element: <PrivateRoute><ClassDetails /></PrivateRoute>},
  { path: "/class-details-adviser/:classId", element: <PrivateRoute><ClassDetailsForAdviser /></PrivateRoute>},
  { path: "/audit-log", element: <PrivateRoute><AuditLogs /></PrivateRoute>},
  { path: "/student-master-list", element: <PrivateRoute><StudentsMasterList /></PrivateRoute>},
  { path: "/chat/:recipientId", element: <PrivateRoute><Chat /></PrivateRoute>},
  { path: "/view-messages", element: <PrivateRoute><ViewMessages /></PrivateRoute>},
  { path: "/view-messages-student", element: <PrivateRoute><ViewMessagesStudent /></PrivateRoute>},
  { path: "/disciplinary-records", element: <PrivateRoute><DisciplinaryRecords /></PrivateRoute>},
  { path: "/update-class/:classId", element: <PrivateRoute><UpdateClass /></PrivateRoute>},
  { path: "/manage-requirements", element: <PrivateRoute><ManageRequirements /></PrivateRoute>},
  { path: "/manage-office-requirements", element: <PrivateRoute><ManageOfficeRequirements /></PrivateRoute>},
  { path: "/office-clearance-manual", element: <PrivateRoute><OfficeClearanceManual /></PrivateRoute>},
  { path: "/school-events", element: <PrivateRoute><SchoolEvents /></PrivateRoute>},
  { path: "/send-payment-confirmation", element: <PrivateRoute><SendPaymentConfirmationEmail /></PrivateRoute>}
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
