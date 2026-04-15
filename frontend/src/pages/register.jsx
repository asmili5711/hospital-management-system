import { Box, TextField, Button, Typography, Paper, Alert } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../utils/api";
import { API_BASE } from "../utils/config";

export default function Register() {
 const[name,setName] = useState("");
 const[email,setEmail] = useState("");
 const[phone,setPhone] = useState("");
 const[password,setPassword] = useState("");
 const[error,setError] = useState("");
 const[loading,setLoading] = useState(false);
 const navigate = useNavigate();

function handleRegister(e) {
  e.preventDefault();
  setError("");
  setLoading(true);

  // Basic client-side validation
  if (!name.trim()) {
    setError("Name is required");
    setLoading(false);
    return;
  }
  if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
    setError("Enter a valid email");
    setLoading(false);
    return;
  }
  if (!/^\d{10}$/.test(phone)) {
    setError("Enter a 10-digit phone number");
    setLoading(false);
    return;
  }
  if (password.length < 6) {
    setError("Password must be at least 6 characters");
    setLoading(false);
    return;
  }

  const user={
    name,
    email,
    phone,
    password
  };
  api.post(`${API_BASE}/users/signup`, user)
  .then (() => {
    navigate(`/login?registered=1&email=${encodeURIComponent(email)}`);
  }).catch((error) => {
    setError(error.response?.data?.message || "Registration failed");
    console.error("Registration error:", error);
  }).finally(() => setLoading(false)); 

}

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #e3f2fd, #ffffff)"
      }}
    >
      <Paper
        elevation={6}
        sx={{
          padding: 4,
          width: 400,
          borderRadius: 3
        }}
      >
        <Typography
          variant="h5"
          align="center"
          gutterBottom
          sx={{ fontWeight: 600, color: "#1976d2" }}
        >
          Create Account
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box
          component="form"
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          onSubmit={handleRegister}
        >
          <TextField
            label="Full Name"
            variant="outlined"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <TextField
            label="Email"
            type="email"
            variant="outlined"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <TextField
            label="Phone Number"
            type="tel"
            variant="outlined"
            fullWidth
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputProps={{
              maxLength: 10
            }}
            required
          />

          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />


          <Button
            variant="contained"
            size="large"
            type="submit"
            sx={{
              mt: 1,
              textTransform: "none",
              fontWeight: 600
            }}
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </Button>

          <Typography variant="body2" align="center">
            Already have an account?{" "}
            <Box
              component={Link}
              to="/login"
              sx={{ color: "#1976d2", textDecoration: "none", fontWeight: 600, display: "inline" }}
            >
              Login
            </Box>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}


