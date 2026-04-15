import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Divider,
  Grid,
} from "@mui/material";
import api from "../utils/api";

// Appointment booking form aligned with backend POST /users/book-appointment
export default function Appoinment() {
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [reason, setReason] = useState("");
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Fetch doctors for dropdown
  useEffect(() => {
    setLoadingDoctors(true);
    api
      .get("/doctors", { params: { limit: 50 } })
      .then((res) => setDoctors(res.data?.doctors || []))
      .catch(() => setError("Failed to load doctors"))
      .finally(() => setLoadingDoctors(false));
  }, []);

  const minDateTime = useMemo(() => {
    const now = new Date();
    const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    return iso;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!doctorId || !dateTime) {
      setError("Please choose a doctor and date/time");
      return;
    }

    const chosen = new Date(dateTime);
    if (Number.isNaN(chosen.getTime()) || chosen.getTime() <= Date.now()) {
      setError("Please pick a future date/time");
      return;
    }

    if (reason.trim().length > 0 && reason.trim().length < 5) {
      setError("Reason must be at least 5 characters or left empty");
      return;
    }
    if (reason.trim().length > 300) {
      setError("Reason must be under 300 characters");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/users/book-appointment", {
        doctorId,
        date: new Date(dateTime).toISOString(),
        reason,
      });
      setMessage("Appointment booked successfully");
      setDoctorId("");
      setDateTime("");
      setReason("");
    } catch (err) {
      const msg = err.response?.data?.message || "Booking failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 560, mx: "auto", px: 2, py: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          background:
            "linear-gradient(145deg, rgba(0,122,204,0.06) 0%, rgba(255,255,255,0.9) 55%, #ffffff 100%)",
        }}
      >
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Book Appointment
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Choose a doctor, pick a date/time, and add an optional note. (Auth required)
        </Typography>
        <Divider sx={{ my: 2 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        <Stack component="form" onSubmit={handleSubmit} spacing={2.2}>
          <TextField
            select
            label="Doctor"
            required
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            helperText="Select the doctor you want to consult"
            disabled={loadingDoctors}
          >
            <MenuItem value="">{loadingDoctors ? "Loading..." : "Select"}</MenuItem>
            {doctors.map((doc) => (
              <MenuItem key={doc._id} value={doc._id}>
                {doc.name} — {doc.department}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Date & Time"
            type="datetime-local"
            required
            value={dateTime}
            onChange={(e) => {
              setDateTime(e.target.value);
            }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: minDateTime }}
            helperText="Local time — past slots are disabled"
          />

          <TextField
            label="Reason (optional)"
            multiline
            minRows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Briefly describe symptoms or visit reason"
            helperText="5–300 chars if provided"
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="flex-end">
            <Button
              variant="contained"
              type="submit"
              disabled={submitting || loadingDoctors}
              startIcon={submitting ? <CircularProgress size={18} /> : null}
              sx={{ minWidth: 180 }}
            >
              {submitting ? "Booking..." : "Book Appointment"}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
