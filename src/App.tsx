import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Root from './pages/Root';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserDashboard } from './pages/UserDashboard';
import Home from './pages/Home';
import "primereact/resources/themes/lara-light-cyan/theme.css";

function App() {
  const router = createBrowserRouter([
    { path: "/", element: <Root />, children: [{ path: "/", element: <Home /> }, { path: '/admin', element: <AdminDashboard /> }, { path: "/raters", element: <UserDashboard /> }] }
  ])
  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App
