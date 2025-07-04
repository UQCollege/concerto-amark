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
import {jwtDecode} from "jwt-decode";

const isAuthDisabled = import.meta.env.VITE_AUTH_DISABLED === "true";
function App() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (isAuthDisabled) {
      const devToken = "FAKE_DEV_TOKEN";
      sessionStorage.setItem("access_token", devToken);
      dispatch(setToken(devToken));
    } else {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("access_token") || sessionStorage.getItem("access_token");

      if (token) {
        dispatch(setToken(token));
        sessionStorage.setItem("access_token", token);
        window.history.replaceState({}, document.title, "/");

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const decoded: any = jwtDecode(token);
          const issuedAt = decoded.iat * 1000; // convert to ms
          const sessionDuration = 3 * 60 * 60 * 1000; // 3 hour
          const reminderThreshold = sessionDuration - 5 * 60 * 1000; // remind 5 minutes before expiry

          // Save or retrieve the initial load time
          let initialLoadTime = sessionStorage.getItem("initial_load_time");
          if (!initialLoadTime) {
            initialLoadTime = Date.now().toString();
            sessionStorage.setItem("initial_load_time", initialLoadTime);
          }
          const now = parseInt(initialLoadTime, 10);
          const elapsed = now - issuedAt;
          const timeUntilReminder = reminderThreshold - elapsed;
   
          if (timeUntilReminder > 0) {
            setTimeout(() => {
              alert("Your session will expire in 5 minutes. Previous work has been saved, please log out and log back in to continue.");
              sessionStorage.removeItem("initial_load_time"); // Clean up after reminder
            }, timeUntilReminder);
          } else {
            alert("Your session will expire soon. Previous work has been saved, please log out and log back in to continue.");
            sessionStorage.removeItem("initial_load_time"); // Clean up if already expired
          }
        } catch (err) {
          console.error("Failed to decode JWT:", err);
        }
      } else {
        sessionStorage.removeItem("initial_load_time"); // Clean up if no token
      }
    }
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
        { path: "/raters/:name", element: <UserDashboard />  },
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
