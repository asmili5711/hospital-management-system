
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import DashboardIcon from "@mui/icons-material/Dashboard";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { API_BASE } from "../utils/config";

const sidebarLinks = [
  { label: "Dashboard", path: "/app/dashboard", icon: <DashboardIcon fontSize="small" /> },
  { label: "Book Appointments", path: "/app/book-appointments", icon: <EventAvailableIcon fontSize="small" /> },
  { label: "My Appointments", path: "/app/my-appointments", icon: <CalendarMonthIcon fontSize="small" /> },
  { label: "Doctors", path: "/app/doctors", icon: <MedicalServicesIcon fontSize="small" /> },
  { label: "Profile", path: "/app/profile", icon: <PersonIcon fontSize="small" /> },
];

const getLinkStyles = ({ isActive }) => ({
  textDecoration: "none",
  color: isActive ? "#0d47a1" : "#1e293b",
  backgroundColor: isActive ? "#e3f2fd" : "transparent",
  borderRadius: "10px",
  padding: "10px 12px",
  fontWeight: isActive ? 700 : 500,
  transition: "all 0.3s ease",
});

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await api.post(`${API_BASE}/users/logout`);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      navigate("/login");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", backgroundColor: "#f8fbff" }}>
      <Paper
        elevation={3}
        sx={{
          width: 260,
          borderRadius: 0,
          p: 3,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4 }}>
            <LocalHospitalIcon sx={{ color: "#1976d2" }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#1976d2" }}>
              MediCare
            </Typography>
          </Stack>

          <Stack spacing={1}>
            {sidebarLinks.map((link) => (
              <NavLink key={link.path} to={link.path} style={getLinkStyles}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", color: "#1976d2" }}>
                    {link.icon}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: "inherit" }}>
                    {link.label}
                  </Typography>
                </Box>
              </NavLink>
            ))}
          </Stack>
        </Box>

        <Button
          variant="outlined"
          color="primary"
          onClick={handleLogout}
          sx={{ mt: 3 }}
          startIcon={<LogoutIcon />}
        >
          Logout
        </Button>
      </Paper>

      <Box sx={{ flex: 1, p: 3 }}>
        <Box
          key={location.pathname}
          sx={{
            "@keyframes pageFadeSlide": {
              from: { opacity: 0, transform: "translateY(14px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
            animation: "pageFadeSlide 420ms ease",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
