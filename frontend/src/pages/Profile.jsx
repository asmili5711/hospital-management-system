import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
} from "@mui/material";
import api from "../utils/api";
import { API_BASE } from "../utils/config";

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const fieldSx = {
  "& .MuiInputBase-root": {
    backgroundColor: "#f8fbff",
    borderRadius: 1,
  },
  "& .MuiInputBase-input.Mui-disabled": {
    WebkitTextFillColor: "#1f2937",
  },
};

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [editing, setEditing] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "Other",
    address: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fetchProfile = () => {
    setLoading(true);
    setError("");
    api
      .get(`${API_BASE}/users/profile`)
      .then((res) => {
        const data = res.data?.profile || null;
        setProfile(data);
        if (data) {
          const match = (data.phone || "").match(/^(\+\d{1,3})\s?(.*)$/);
          const cc = match?.[1] || "+91";
          const local = match?.[2] || data.phone || "";
          setCountryCode(cc);
          setForm({
            name: data.name || "",
            email: data.email || "",
            phone: local,
            age: data.age ?? "",
            gender: data.gender || "Other",
            address: data.address || "",
          });
        }
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load profile"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
  }, [API_BASE]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field) => (e) => {
    const value = e.target.value;
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setSaving(true);
    setError("");
    setPasswordSuccess("");

    // Basic client-side validation
    if (!form.name.trim()) {
      setError("Name is required.");
      setSaving(false);
      return;
    }
    if (!/^\d{7,15}$/.test(String(form.phone || "").replace(/\D/g, ""))) {
      setError("Enter a valid phone number (7-15 digits).");
      setSaving(false);
      return;
    }
    if (form.age !== "" && (Number.isNaN(Number(form.age)) || Number(form.age) <= 0)) {
      setError("Enter a valid age.");
      setSaving(false);
      return;
    }
    if (form.address && form.address.length > 300) {
      setError("Address should be under 300 characters.");
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name,
      phone: `${countryCode} ${form.phone}`.trim(),
      age: form.age === "" ? undefined : Number(form.age),
      gender: form.gender,
      address: form.address,
    };

    api
      .put(`${API_BASE}/users/profile`, payload)
      .then((res) => {
        const data = res.data?.profile;
        setProfile(data);
        setEditing(false);
        if (data) {
          setForm({
            name: data.name || "",
            email: data.email || "",
            phone: (data.phone || "").replace(/^(\+\d{1,3})\s?/, ""),
            age: data.age ?? "",
            gender: data.gender || "Other",
            address: data.address || "",
          });
          const match = (data.phone || "").match(/^(\+\d{1,3})\s?(.*)$/);
          const cc = match?.[1] || "+91";
          setCountryCode(cc);
        }
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to update profile"))
      .finally(() => setSaving(false));
  };

  const handleCancel = () => {
    if (profile) {
      const match = (profile.phone || "").match(/^(\+\d{1,3})\s?(.*)$/);
      const cc = match?.[1] || "+91";
      const local = match?.[2] || profile.phone || "";
      setCountryCode(cc);
      setForm({
        name: profile.name || "",
        email: profile.email || "",
        phone: local,
        age: profile.age ?? "",
        gender: profile.gender || "Other",
        address: profile.address || "",
      });
    }
    setEditing(false);
  };

  const handlePasswordSave = () => {
    setPasswordError("");
    setPasswordSuccess("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    if (passwordForm.oldPassword === passwordForm.newPassword) {
      setPasswordError("New password cannot be the same as the current password.");
      return;
    }
    setSavingPassword(true);
    api
      .post(`${API_BASE}/users/profile/change-password`, {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      })
      .then((res) => {
        setPasswordSuccess(res.data?.message || "Password updated successfully.");
        setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setEditingPassword(false);
        setTimeout(() => {
          window.location.href = "/login";
        }, 1200);
      })
      .catch((err) => {
        const message = err.response?.data?.message || "Failed to change password";

        setPasswordError(message);
      })
      .finally(() => setSavingPassword(false));
  };

  const handlePasswordCancel = () => {
    setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordError("");
    setPasswordSuccess("");
    setEditingPassword(false);
  };

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
          maxWidth: 1040,
          mx: "auto",
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          border: "1px solid #dce7ff",
          background:
            "radial-gradient(circle at 14% 18%, rgba(25,118,210,0.06) 0, rgba(25,118,210,0) 45%), #ffffff",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              Profile
            </Typography>
            <Typography color="text.secondary">Your account and appointment summary.</Typography>
          </Box>
          {!editing ? (
            <Button variant="contained" onClick={() => setEditing(true)} disabled={loading || saving}>
              Edit
            </Button>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                sx={{ minWidth: 88 }}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button variant="outlined" color="secondary" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
            </Stack>
          )}
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {passwordError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {passwordError}
          </Alert>
        )}
        {passwordSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {passwordSuccess}
          </Alert>
        )}

        {loading ? (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress />
          </Stack>
        ) : profile ? (
          <Stack spacing={2}>
            <Paper
              variant="outlined"
              sx={{
                p: 3.5,
                borderRadius: 2,
                borderColor: "#dce7ff",
                background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                boxShadow: "0 10px 30px rgba(25, 118, 210, 0.08)",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Personal Details
              </Typography>
              <Grid container rowSpacing={3} columnSpacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Name"
                    value={form.name}
                    fullWidth
                    size="small"
                    sx={fieldSx}
                    InputProps={{ readOnly: !editing }}
                    onChange={handleChange("name")}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Email"
                    value={form.email}
                    fullWidth
                    size="small"
                    sx={fieldSx}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Country Code"
                    select
                    value={countryCode}
                    fullWidth
                    size="small"
                    sx={fieldSx}
                    disabled={!editing}
                    onChange={(e) => setCountryCode(e.target.value)}
                  >
                    <MenuItem value="+91">+91 (IN)</MenuItem>
                    <MenuItem value="+1">+1 (US)</MenuItem>
                    <MenuItem value="+44">+44 (UK)</MenuItem>
                    <MenuItem value="+61">+61 (AU)</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={9}>
                  <TextField
                    label="Phone"
                    value={form.phone}
                    fullWidth
                    size="small"
                    sx={fieldSx}
                    InputProps={{ readOnly: !editing }}
                    onChange={handleChange("phone")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Age"
                    value={form.age}
                    fullWidth
                    size="small"
                    type="number"
                    sx={fieldSx}
                    InputProps={{ readOnly: !editing }}
                    onChange={handleChange("age")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Gender"
                    value={form.gender}
                    fullWidth
                    size="small"
                    select
                    sx={fieldSx}
                    disabled={!editing}
                    onChange={handleChange("gender")}
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Address"
                    value={form.address}
                    fullWidth
                    size="small"
                    multiline
                    minRows={3}
                    sx={fieldSx}
                    InputProps={{ readOnly: !editing }}
                    onChange={handleChange("address")}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: 3.5,
                borderRadius: 2,
                borderColor: "#dce7ff",
                background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                boxShadow: "0 10px 30px rgba(25, 118, 210, 0.08)",
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ sm: "center" }}
                spacing={1.5}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Security
                </Typography>
                {!editingPassword ? (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => {
                      setEditingPassword(true);
                      setPasswordError("");
                      setPasswordSuccess("");
                    }}
                  >
                    Edit Password
                  </Button>
                ) : (
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handlePasswordSave}
                      disabled={savingPassword}
                      sx={{ minWidth: 140 }}
                    >
                      {savingPassword ? "Updating..." : "Update Password"}
                    </Button>
                    <Button variant="outlined" onClick={handlePasswordCancel} disabled={savingPassword}>
                      Cancel
                    </Button>
                  </Stack>
                )}
              </Stack>

              {editingPassword && (
                <Grid container rowSpacing={3} columnSpacing={2.5} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Current Password"
                      type="password"
                      value={passwordForm.oldPassword}
                      fullWidth
                      size="small"
                      sx={fieldSx}
                      onChange={handlePasswordChange("oldPassword")}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="New Password"
                      type="password"
                      value={passwordForm.newPassword}
                      fullWidth
                      size="small"
                      sx={fieldSx}
                      onChange={handlePasswordChange("newPassword")}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Confirm New Password"
                      type="password"
                      value={passwordForm.confirmPassword}
                      fullWidth
                      size="small"
                      sx={fieldSx}
                      onChange={handlePasswordChange("confirmPassword")}
                    />
                  </Grid>
                </Grid>
              )}
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: 3.5,
                borderRadius: 2,
                borderColor: "#dce7ff",
                background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                boxShadow: "0 10px 30px rgba(25, 118, 210, 0.08)",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Activity
              </Typography>
              <Grid container rowSpacing={3} columnSpacing={2.5}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Total Appointments"
                    value={profile.totalAppointments ?? 0}
                    fullWidth
                    size="small"
                    sx={fieldSx}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Member Since"
                    value={profile.createdAt ? formatDate(profile.createdAt) : "-"}
                    fullWidth
                    size="small"
                    sx={fieldSx}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Last Updated"
                    value={profile.updatedAt ? formatDate(profile.updatedAt) : "-"}
                    fullWidth
                    size="small"
                    sx={fieldSx}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Stack>
        ) : (
          <Typography color="text.secondary">No profile data available.</Typography>
        )}
      </Paper>
    </Box>
  );
}
