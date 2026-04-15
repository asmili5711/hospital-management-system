import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const followersData = [
  { day: "Mon", value: 120 },
  { day: "Tue", value: 180 },
  { day: "Wed", value: 150 },
  { day: "Thu", value: 220 },
  { day: "Fri", value: 260 },
  { day: "Sat", value: 210 },
  { day: "Sun", value: 300 },
];

export default function Dashboard() {
  const hiddenUpcomingStatuses = new Set(["Cancelled", "Cancelled by User", "Completed"]);
  const navigate = useNavigate();
  const [userName, setUserName] = useState("there");
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState("");
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [doctorsCount, setDoctorsCount] = useState(0);
  const [completedVisitsCount, setCompletedVisitsCount] = useState(0);
  const maxFollowers = Math.max(...followersData.map((item) => item.value));
  const statsWithLiveAppointments = [
    {
      title: "Upcoming Appointments",
      value: appointments.length,
      icon: <CalendarMonthIcon />,
    },
    {
      title: "Doctors Available",
      value: doctorsCount,
      icon: <MedicalServicesIcon />,
    },
    {
      title: "Completed Visits",
      value: completedVisitsCount,
      icon: <MedicalServicesIcon />,
    },
  ];

  useEffect(() => {
    api
      .get("/users/profile")
      .then((res) => {
        const profile = res.data?.profile;
        const name = profile?.name;
        if (name) {
          setUserName(name);
        }
        if (profile) setProfileCompletion(calculateCompletion(profile));
      })
      .catch(() => {
        // Silently fail; keep cached name if any
      });
  }, []);

  useEffect(() => {
    setAppointmentsLoading(true);
    setAppointmentsError("");

    api
      .get("/users/booking-history")
      .then((res) => {
        const list = res.data?.appointments || [];
        const completedCount = list.filter((item) => item.status === "Completed").length;
        const upcoming = list
          .filter(
            (item) =>
              new Date(item.date).getTime() > Date.now() &&
              !hiddenUpcomingStatuses.has(item.status)
          )
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3);
        setCompletedVisitsCount(completedCount);
        setAppointments(upcoming);
      })
      .catch((err) => {
        const message = err.response?.data?.message || "Failed to load appointments";
        setAppointmentsError(message);
        setCompletedVisitsCount(0);
        setAppointments([]);
      })
      .finally(() => setAppointmentsLoading(false));
  }, []);

  useEffect(() => {
    api
      .get("/doctors", { params: { page: 1, limit: 1 } })
      .then((res) => {
        const totalDoctors = res.data?.pagination?.totalItems;
        setDoctorsCount(Number.isFinite(totalDoctors) ? totalDoctors : 0);
      })
      .catch(() => {
        setDoctorsCount(0);
      });
  }, []);

  const formatApptDate = (dateStr) => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "Date unavailable";
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateCompletion = (profile) => {
    const fields = ["name", "email", "phone", "age", "gender", "address"];
    const filled = fields.filter((key) => {
      const value = profile?.[key];
      return value !== undefined && value !== null && String(value).trim() !== "";
    }).length;
    const pct = Math.round((filled / fields.length) * 100);
    return Math.min(100, Math.max(0, pct));
  };

  return (
    <Box sx={{ pb: 2 }}>
      {/* Top welcome section */}
      <Paper
        sx={{
          p: { xs: 3, md: 4 },
          mb: 3,
          borderRadius: 4,
          background:
            "radial-gradient(circle at top right, #bbdefb 0%, #e3f2fd 35%, #ffffff 100%)",
          border: "1px solid #d9ecff",
          boxShadow: "0 12px 30px rgba(25,118,210,0.12)",
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Welcome back, {userName}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2.5 }}>
          Manage your appointments, reports, and profile from one simple dashboard.
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button variant="contained" onClick={() => navigate("/app/book-appointments")}>
            Book Appointment
          </Button>
          <Button variant="outlined" onClick={() => navigate("/app/my-appointments")}>
            View My Appointments
          </Button>
        </Stack>
      </Paper>

      {/* Stats cards: 3 cards per row on desktop */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statsWithLiveAppointments.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.title}>
            <Paper
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid #dcebff",
                background: "linear-gradient(180deg, #ffffff 0%, #f8fcff 100%)",
                transition: "0.25s ease",
                minHeight: 122,
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: "0 10px 24px rgba(25,118,210,0.14)",
                },
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {item.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: "#1976d2" }}>
                    {item.value}
                  </Typography>
                </Box>
                <Box sx={{ color: "#1976d2" }}>{item.icon}</Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Main dashboard cards: 3 cards per row on desktop */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #e4efff",
              height: "100%",
              backgroundColor: "#ffffff",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Upcoming Appointments
            </Typography>

            {appointmentsLoading ? (
              <Stack alignItems="center" sx={{ py: 2 }}>
                <CircularProgress size={26} />
              </Stack>
            ) : appointmentsError ? (
              <Typography variant="body2" color="error">
                {appointmentsError}
              </Typography>
            ) : appointments.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No upcoming appointments.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {appointments.map((item) => (
                  <Box
                    key={item.id || item.doctor + item.date}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: "1px solid #deecff",
                      backgroundColor: "#fafcff",
                    }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>
                      {item.doctorName || item.doctorSummary?.name || "Doctor"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.doctorSummary?.department || "Department"}
                    </Typography>
                    <Typography variant="body2" color="primary.main">
                      {formatApptDate(item.date)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #e4efff",
              height: "100%",
              backgroundColor: "#ffffff",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              Followers Growth
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Weekly profile followers
            </Typography>

            <Stack direction="row" alignItems="flex-end" spacing={1} sx={{ height: 180 }}>
              {followersData.map((item) => (
                <Box
                  key={item.day}
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 0.8,
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#1976d2", fontWeight: 600 }}>
                    {item.value}
                  </Typography>
                    <Box
                      sx={{
                        width: "100%",
                        maxWidth: 24,
                        height: `${(item.value / maxFollowers) * 120}px`,
                        background: "linear-gradient(180deg, #64b5f6, #1976d2)",
                      borderRadius: "8px 8px 4px 4px",
                      transition: "0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                      },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {item.day}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #e4efff",
              height: "100%",
              backgroundColor: "#ffffff",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
              Profile Completion
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Keep your profile updated for faster booking.
            </Typography>
            <LinearProgress
              variant="determinate"
              value={profileCompletion}
              sx={{ height: 8, borderRadius: 5, mb: 1 }}
            />
            <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
              {profileCompletion}% completed
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #e4efff",
              height: "100%",
              backgroundColor: "#ffffff",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
              Quick Reminder
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap">
              <Chip label="1 bill pending" color="error" size="small" />
              <Chip label="2 reports unread" color="warning" size="small" />
            </Stack>
            <Button
              size="small"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate("/app/profile")}
            >
              Go to profile
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #e4efff",
              height: "100%",
              backgroundColor: "#ffffff",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
              Health Tips
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">- Drink enough water daily.</Typography>
              <Typography variant="body2">- Keep 7-8 hours of sleep.</Typography>
              <Typography variant="body2">- Take a 30-minute walk.</Typography>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #e4efff",
              height: "100%",
              backgroundColor: "#ffffff",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
              Notifications
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">Appointment reminder sent.</Typography>
              <Typography variant="body2">New report uploaded successfully.</Typography>
              <Typography variant="body2">Profile update pending.</Typography>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #e4efff",
              height: "100%",
              backgroundColor: "#ffffff",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
              Quick Actions
            </Typography>
            <Stack spacing={1.2}>
              <Button variant="outlined" onClick={() => navigate("/app/book-appointments")}>
                Book New Appointment
              </Button>
              <Button variant="outlined" onClick={() => navigate("/app/my-appointments")}>
                Open My Appointments
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
