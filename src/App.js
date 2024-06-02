import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import SignIn from "./pages/SignIn";
import { AuthProvider } from "./components/AuthContext";

const router = createBrowserRouter([{ path: "/", element: <SignIn /> }]);
function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
