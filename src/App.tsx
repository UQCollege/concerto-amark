import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./pages/Root";
import { AdminDashboard } from "./pages/AdminDashboard";
import { UserDashboard } from "./pages/UserDashboard";
import Home from "./pages/Home";

import { Navigate } from "react-router-dom";
import { useAppSelector } from "./store/hooks";

function App() {

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Root />,
      children: [
        { path: "/", element: <Home /> },
        {
          path: "/admin",
          element: (
            useAppSelector((state) => state.auth.groups).includes("Admin") ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/" />
            )
          ),
        },
        { path: "/raters/:name", element: <UserDashboard /> },
      ],
    },
  ]);
  return (
    <>

        <RouterProvider router={router} />

    </>
  );
}

export default App;
