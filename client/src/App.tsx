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
const isAuthDisabled = import.meta.env.VITE_AUTH_DISABLED === "true";
function App() {
  const dispatch = useAppDispatch();
  useEffect(() => {


    if (isAuthDisabled) {
      const devToken = "FAKE_DEV_TOKEN";
      localStorage.setItem("access_token", devToken);
      dispatch(setToken(devToken));
    } else {

      const params = new URLSearchParams(window.location.search);
      const token = params.get("access_token") || localStorage.getItem("access_token");

      if (token) {
        dispatch(setToken(token));
        localStorage.setItem("access_token", token);
        window.history.replaceState({}, document.title, "/");
      }


    }
  }, [dispatch]);
  const isAdmin = useAppSelector((state) => state.auth.groups).includes("Admin")
  const isRater = useAppSelector((state) => state.auth.groups).includes("Rater")
  const isTeacher = useAppSelector((state) => state.auth.groups).includes("Teacher")
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
        { path: "/raters/:name", element: (isRater ? <UserDashboard /> : <Navigate to="/" />) },
        { path: "/classes/:name", element: (isTeacher ? <ClassDashboard /> : <Navigate to="/" />) }, //todo: remove to Another App
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
