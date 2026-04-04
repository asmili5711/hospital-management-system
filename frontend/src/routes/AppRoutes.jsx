import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layouts from "../components/layout";
import DashboardLayout from "../layouts/DashboardLayout";
import Home from "../pages/home";
import Login from "../pages/login";
import Register from "../pages/register";
import Dashboard from "../pages/Dashboard";
import AppoinmentForm from "../pages/Appoinment";
import MyAppoinments from "../pages/my-Appoinments";
import Doctors from "../pages/Doctors";
import Profile from "../pages/Profile";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layouts />}>
          <Route path="/" element={<Home />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<DashboardLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="book-appointments" element={<AppoinmentForm />} />
            <Route path="my-appointments" element={<MyAppoinments />} />
            <Route path="doctors" element={<Doctors />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
