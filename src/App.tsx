import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Root from './pages/Root';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserDashboard } from './pages/UserDashboard';
import Home from './pages/Home';
import { Provider } from 'react-redux';
import store from './store/store';


function App() {
  const router = createBrowserRouter([
    { path: "/", element: <Root />, children: [{ path: "/", element: <Home /> }, { path: '/admin', element: <AdminDashboard /> }, { path: "/raters", element: <UserDashboard /> }] }
  ])
  return (
    <>
      <Provider store={store}>

        <RouterProvider router={router} />
      </Provider>
    </>
  )
}

export default App
