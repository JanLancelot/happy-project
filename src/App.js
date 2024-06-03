import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";

import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import Teachers from "./pages/Teachers";
import CreateTeacherPage from "./pages/CreateTeacherPage";
import Classes from "./pages/Classes";
import CreateClass from "./pages/CreateClass";

const router = createBrowserRouter([
  { path: "/", element: <SignIn /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/teachers", element: <Teachers />},
  { path: "/create-teacher", element: <CreateTeacherPage />},
  { path: "/classes", element: <Classes />},
  { path: "/create-class", element: <CreateClass />},
]);
function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
