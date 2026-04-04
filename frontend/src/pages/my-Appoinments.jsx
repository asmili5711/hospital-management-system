import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Alert,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import RefreshIcon from "@mui/icons-material/Refresh";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import DoNotDisturbAltIcon from "@mui/icons-material/DoNotDisturbAlt";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import api from "../utils/api";
import { API_BASE } from "../utils/config";
import { keyframes } from "@mui/system";

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

export default function MyAppoinments() {
  const MIN_LOAD_MS = 1400; // ensure loader/animation is visible a bit longer
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState("Upcoming");

  const fetchAppointments = () => {
    const startedAt = Date.now();
    setLoading(true);
    setError("");
    api
      .get(`${API_BASE}/users/booking-history`)
      .then((res) => {
        setAppointments(res.data?.appointments || []);
      })
      .catch((err) => {
        const message = err.response?.data?.message || "Failed to load appointments";
        setError(message);
      })
      .finally(() => {
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, MIN_LOAD_MS - elapsed);
        setTimeout(() => setLoading(false), remaining);
      });
  };

  useEffect(() => {
    fetchAppointments();
  }, [API_BASE]);

  const isUpcoming = (dateStr) => {
    const d = new Date(dateStr);
    return d.getTime() > Date.now();
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCancel = async (id) => {
    setError("");
    setActionMessage("");
    try {
      await api.put(`${API_BASE}/users/appointments/${id}/cancel`, {});
      setActionMessage("Appointment cancelled.");
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel appointment");
    }
  };

  const sorted = useMemo(
    () =>
      [...appointments].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [appointments]
  );

  const filteredAppointments = useMemo(() => {
    const now = Date.now();

    return sorted.filter((appt) => {
      const appointmentTime = new Date(appt.date).getTime();
      const status = appt.status || "Pending";

      if (activeFilter === "Upcoming") {
        return (
          appointmentTime > now &&
          !["Completed", "Cancelled", "Cancelled by User"].includes(status)
        );
      }

      if (activeFilter === "Past") {
        return appointmentTime <= now;
      }

      if (activeFilter === "Completed") {
        return status === "Completed";
      }

      if (activeFilter === "Cancelled") {
        return status === "Cancelled" || status === "Cancelled by User";
      }

      return true;
    });
  }, [activeFilter, sorted]);

  const filterOptions = ["Upcoming", "Past", "Completed", "Cancelled", "All"];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e4f2ff 0%, #f9fbff 50%, #f2f5ff 100%)",
        px: { xs: 1.5, sm: 2.5 },
        py: 3,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          maxWidth: 960,
          mx: "auto",
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3,
          border: "1px solid #dce7ff",
          background:
            "radial-gradient(circle at 14% 18%, rgba(25,118,210,0.06) 0, rgba(25,118,210,0) 45%), #ffffff",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              My Appointments
            </Typography>
            <Typography color="text.secondary">
              Track your bookings; cancel upcoming visits if plans change.
            </Typography>
          </Box>
        <IconButton
          color="primary"
          aria-label="Refresh appointments"
          onClick={fetchAppointments}
          disabled={loading}
          sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
          title="Refresh"
        >
          <RefreshIcon
            sx={{
              animation: loading ? `${spin} 1.4s linear infinite` : "none",
            }}
          />
        </IconButton>
      </Stack>

        <Divider sx={{ my: 2.5 }} />

        <Stack direction="row" spacing={1} sx={{ mb: 2.5 }} flexWrap="wrap">
          {filterOptions.map((filter) => (
            <Chip
              key={filter}
              label={filter}
              clickable
              color={activeFilter === filter ? "primary" : "default"}
              variant={activeFilter === filter ? "filled" : "outlined"}
              onClick={() => setActiveFilter(filter)}
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {actionMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {actionMessage}
          </Alert>
        )}

        {loading ? (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress />
          </Stack>
        ) : filteredAppointments.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 2,
              borderStyle: "dashed",
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            <WarningAmberIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography>No appointments found for the {activeFilter.toLowerCase()} filter.</Typography>
          </Paper>
        ) : (
          <Stack spacing={2.2}>
            {filteredAppointments.map((appt) => {
              const key = appt.id || appt._id;
              const upcoming = isUpcoming(appt.date);
              const status = appt.status || "Pending";
              const doctor = appt.doctorName || appt.doctorSummary?.name || "Doctor";
              const department = appt.doctorSummary?.department || "Department";
              const canCancel = upcoming && (status === "Pending" || status === "Confirmed");

              const statusChip = (() => {
                if (status === "Cancelled by User") {
                  return { color: "error", icon: <CancelIcon />, text: "Cancelled by You" };
                }
                if (status === "Cancelled") return { color: "default", icon: <DoNotDisturbAltIcon />, text: "Cancelled" };
                if (status === "Completed") return { color: "success", icon: <DoneAllIcon />, text: "Completed" };
                if (status === "Confirmed") return { color: "primary", icon: <CheckCircleIcon />, text: "Confirmed" };
                return { color: "warning", icon: <HourglassBottomIcon />, text: "Pending" };
              })();

              return (
                <Paper
                  key={key}
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    borderColor: "#dce7ff",
                    background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                    spacing={1.5}
                  >
                    <Stack spacing={0.6}>
                      <Typography sx={{ fontWeight: 700 }}>{doctor}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                        <LocalHospitalIcon fontSize="small" />
                        <Typography variant="body2">{department}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                        <EventIcon fontSize="small" />
                        <Typography variant="body2">{formatDate(appt.date)}</Typography>
                      </Stack>
                      {appt.reason && (
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          Reason: {appt.reason}
                        </Typography>
                      )}
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
                      <Chip
                        icon={statusChip.icon}
                        label={statusChip.text}
                        color={statusChip.color}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        endIcon={<CancelIcon />}
                        disabled={!canCancel}
                        onClick={() => handleCancel(key)}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
