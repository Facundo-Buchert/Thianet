import { RouterProvider, createBrowserRouter } from 'react-router-dom'
//USER PANEL IMPORTS
import { Header } from './UserPanel/components/Header'
import { Footer } from './UserPanel/components/Footer'
import { Home } from './UserPanel/pages/Home'
import { Cart } from './UserPanel/pages/Cart'
import { Catalogo } from './UserPanel/pages/Catalogo'
import { Login } from './UserPanel/pages/Login'
import { Register } from './UserPanel/pages/Register'
import { Profile } from './UserPanel/pages/Profile'
import FAQ from './UserPanel/pages/FAQ'
import TermsAndConditions from './UserPanel/pages/TermsAndConditions'
import MerchDetail  from './UserPanel/pages/MerchDetail'
//ADMIN PANEL IMPORTS
import HeaderA from './AdminPanel/components/HeaderA'
import MenuA from './AdminPanel/components/MenuA' 
import { Dashboard } from './AdminPanel/pages/Dashboard'
import Products from './AdminPanel/pages/Products'
import { Orders } from './AdminPanel/pages/Orders'
import { Clients } from './AdminPanel/pages/Clients'
import { Config } from './AdminPanel/pages/Config'

//GLOBAL STYLES
import './index.css'

const user = JSON.parse(localStorage.getItem("thianet_user"));
const isAdmin = user?.mail === "ventasthiagol20@gmail.com";

const routes = [
  // USER PANEL
  { path: "/", element: <><Header /><Home /><Footer /></> },
  { path: "/catalogo", element: <><Header /><Catalogo /><Footer /></> },
  { path: "/merch/:id", element: <><Header /><MerchDetail /><Footer /></> },
  { path: "/carrito", element: <><Header /><Cart /><Footer /></> },
  { path: "/profile", element: <><Header /><Profile /><Footer /></> },
  { path: "/profile/login", element: <Login /> },
  { path: "/profile/register", element: <Register /> },
  { path: "/preguntas-frecuentes", element: <><Header /><FAQ /><Footer /></> },
  { path: "/terminos-y-condiciones", element: <><Header /><TermsAndConditions /><Footer /></> },
];

// ADMIN PANEL
if (isAdmin) {
  routes.push(
    {path: "/admin", element: (<><HeaderA /><MenuA /><Dashboard /></>)},
    {path: "/admin/productos", element: (<><HeaderA /><MenuA /><Products /></>)},
    {path: "/admin/ordenes", element: (<><HeaderA /><MenuA /><Orders /></>)},
    {path: "/admin/clientes", element: (<><HeaderA /><MenuA /><Clients /></>)},
    {path: "/admin/config", element: (<><HeaderA /><MenuA /><Config /></>)},
  );
}

const router = createBrowserRouter(routes);

export default function App() {     
  return <RouterProvider router={router} />;
}
