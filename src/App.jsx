import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Header } from './UserPanel/components/Header'
import { Footer } from './UserPanel/components/Footer'
import { Home } from './UserPanel/pages/Home'
import { Cart } from './UserPanel/pages/Cart'
import { Catalogo } from './UserPanel/pages/Catalogo'
import MerchDetail  from './UserPanel/pages/MerchDetail'
import './index.css'

const router = createBrowserRouter([
  //USER PANEL ROUTES
  { path: "/", element: <><Header /><Home /><Footer /></> },
  { path: "/catalogo", element: <><Header /><Catalogo /><Footer /></> },
  { path: "/merch/:id", element: <><Header /><MerchDetail /><Footer /></> },
  { path: "/carrito", element: <><Header /><Cart /><Footer /></> },

  //ADMIN PANEL ROUTES
])

export default function App() {
  return <RouterProvider router={router} />
}
