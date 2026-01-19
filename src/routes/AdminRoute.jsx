// src/routes/AdminRoute.jsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import supabase from "../../utils/supabase";

export default function AdminRoute({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      const email = data?.user?.email;

      if (email === "ventasthiagol20@gmail.com") {
        setStatus("ok");
      } else {
        setStatus("denied");
      }
    };
    check();
  }, []);

  if (status === "loading") return null;
  if (status === "denied") return <Navigate to="/" replace />;

  return children;
}
