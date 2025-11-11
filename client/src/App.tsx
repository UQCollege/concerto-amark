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
import { useAuth } from "./utils/useAuth";

const isAuthDisabled = import.meta.env.VITE_AUTH_DISABLED === "true";
function App() {
  const {login} = useAuth();
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (isAuthDisabled) {
      const devToken = "FAKE_DEV_TOKEN";
      sessionStorage.setItem("access_token", devToken);
      dispatch(setToken(devToken));
    } else {
     
const params = new URLSearchParams(window.location.search);
    const startLogin = params.get('startLogin');

    if (startLogin === 'true') {
      login();
      window.history.replaceState(null, '', window.location.pathname);
    }
    dispatch(setToken(sessionStorage.getItem("access_token")));
 
    }
  }, [dispatch,login]);
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
