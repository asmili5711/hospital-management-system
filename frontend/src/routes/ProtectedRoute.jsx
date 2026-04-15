import { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import api from "../utils/api";

export default function ProtectedRoute() {
  const loc = useLocation();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let isMounted = true;

    api
      .get("/users/session")
      .then(() => {
        if (isMounted) setStatus("authenticated");
      })
      .catch(() => {
        if (isMounted) setStatus("unauthenticated");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "checking") {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return status === "authenticated"
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: loc }} />;
}
