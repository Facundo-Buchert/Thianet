// src/App.jsx
import { RouterProvider, createBrowserRouter } from "react-router-dom";

// User panel
import { Header } from "./UserPanel/components/Header";
import { Footer } from "./UserPanel/components/Footer";
import { Home } from "./UserPanel/pages/Home";
import { Cart } from "./UserPanel/pages/Cart";
import { Catalogo } from "./UserPanel/pages/Catalogo";
import { Login } from "./UserPanel/pages/Login";
import { Register } from "./UserPanel/pages/Register";
import { Profile } from "./UserPanel/pages/Profile";
import { EditProfile } from "./UserPanel/pages/EditProfile";
import FAQ from "./UserPanel/pages/FAQ";
import TermsAndConditions from "./UserPanel/pages/TermsAndConditions";
import MerchDetail from "./UserPanel/pages/MerchDetail";

// Admin panel
import { AdminLayout } from "./AdminPanel/components/AdminLayout";
import Dashboard from "./AdminPanel/pages/Dashboard";
import Products from "./AdminPanel/pages/Products";
import ProductsDetail from "./AdminPanel/pages/ProductsDetail";
import Orders from "./AdminPanel/pages/Orders";
import Clients from "./AdminPanel/pages/Clients";
import { Config } from "./AdminPanel/pages/Config";

// Guards
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

import "./index.css";

const router = createBrowserRouter([
  { path: "/", element: <><Header /><Home /><Footer /></> },
  { path: "/catalogo", element: <><Header /><Catalogo /><Footer /></> },
  { path: "/merch/:id", element: <><Header /><MerchDetail /><Footer /></> },
  { path: "/carrito", element: <><Header /><Cart /><Footer /></> },

  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <Header />
        <Profile />
        <Footer />
      </ProtectedRoute>
    ),
  },

  { path: "/profile/login", element: <Login /> },
  { path: "/profile/register", element: <Register /> },
  
  { path: "/profile/edit", element: 
    <ProtectedRoute>
      <Header /><EditProfile /><Footer />
    </ProtectedRoute>
  },

  { path: "/preguntas-frecuentes", element: <><Header /><FAQ /><Footer /></> },
  { path: "/terminos-y-condiciones", element: <><Header /><TermsAndConditions /><Footer /></> },

  // ADMIN
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminLayout><Dashboard /></AdminLayout>
      </AdminRoute>
    ),
  },
  {
    path: "/admin/productos",
    element: (
      <AdminRoute>
        <AdminLayout><Products /></AdminLayout>
      </AdminRoute>
    ),
  },
  {
    path: "/admin/productos/:id/edit",
    element: (
      <AdminRoute>
        <AdminLayout><ProductsDetail /></AdminLayout>
      </AdminRoute>
    ),
  },
  {
    path: "/admin/ordenes",
    element: (
      <AdminRoute>
        <AdminLayout><Orders /></AdminLayout>
      </AdminRoute>
    ),
  },
  {
    path: "/admin/clientes",
    element: (
      <AdminRoute>
        <AdminLayout><Clients /></AdminLayout>
      </AdminRoute>
    ),
  },
  {
    path: "/admin/config",
    element: (
      <AdminRoute>
        <AdminLayout><Config /></AdminLayout>
      </AdminRoute>
    ),
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
