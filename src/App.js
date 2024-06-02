import { createBrowserRouter, RouterProvider } from "react-router-dom";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import { AuthProvider } from "./components/AuthContext";

const router = createBrowserRouter([
  { path: "/", element: <SignIn /> },
  { path: "/dashboard", element: <Dashboard /> },
]);
function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
