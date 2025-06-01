import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./pages/Root";
import { AdminDashboard } from "./pages/AdminDashboard";
import { UserDashboard } from "./pages/UserDashboard";
import Home from "./pages/Home";

import { Navigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "./store/hooks";
import { setToken } from "./features/auth/authSlice";
import ClassDashboard from "./pages/ClassDashboard";
import { useEffect } from "react";
import { apiService, establishDjangoSession, getCSRFTokenFromCookie } from "./utils/apiService";

const isAuthDisabled = import.meta.env.VITE_AUTH_DISABLED === "true";
function App() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const handleAuth = async () => {
      if (isAuthDisabled) {
        const devToken = "FAKE_DEV_TOKEN";
        sessionStorage.setItem("access_token", devToken);
        dispatch(setToken(devToken));
        try {
          await apiService.post("/bootstrap/", { access_token: devToken });
        } catch {
          console.log("locally failed");
        }
        return;
      }

      // Skip if CSRF token already exists
      if (getCSRFTokenFromCookie()) return;

      const params = new URLSearchParams(window.location.search);
      const token = params.get("access_token") || sessionStorage.getItem("access_token");
      console.log("need cognito token")
      if (!token) return;

      dispatch(setToken(token));
      sessionStorage.setItem("access_token", token);
      window.history.replaceState({}, document.title, "/");
      try {
        await establishDjangoSession(token);
      } catch (e) {
        console.error("Failed to establish session with Django backend:", e);
      }
    };

    handleAuth();
  }, [dispatch]);

  const groups = useAppSelector((state) => state.auth.groups);
  const isAdmin = groups.includes("Admin") || groups.includes("Admin-Rater");

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Root />,
      children: [
        { path: "/", element: <Home /> },
        {
          path: "/admin",
          element: (
            isAdmin ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/" />
            )
          ),
        },
        { path: "/raters/:name", element: <UserDashboard /> },
        { path: "/classes/:name", element: <ClassDashboard /> }, //todo: remove to Another App
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
