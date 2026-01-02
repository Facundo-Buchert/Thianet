import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Header } from './UserPanel/components/Header'
import { Footer } from './UserPanel/components/Footer'
import { Home } from './UserPanel/pages/Home'
import { Inventory } from './UserPanel/pages/Inventory'
import { MerchDetail } from './UserPanel/components/MerchDetail'

const router = createBrowserRouter([
  //USER PANEL ROUTES
  { path: "/", element: <><Header /><Home /><Footer /></> },
  { path: "/inventory", element: <><Header /><Inventory /><Footer /></> },
  { path: "/merch/:name", element: <><Header /><MerchDetail /><Footer /></> },

  //ADMIN PANEL ROUTES
])

export default function App() {
  return <RouterProvider router={router} />
}
