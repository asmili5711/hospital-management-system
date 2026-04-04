import { Box, TextField, Button, Typography, Paper, Alert } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../utils/api";
import { API_BASE } from "../utils/config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      setError("Enter a valid email");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    api
      .post(`${API_BASE}/users/login`, { email, password })
      .then(() => {
        navigate("/app/dashboard");
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Login failed");
        console.error("Login error:", err);
      })
      .finally(() => setLoading(false));
  };

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
          sx={{
            fontWeight: 600,
            color: "#1976d2"
          }}
        >
          Log In
        </Typography>

        <Box
          component="form"
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
          onSubmit={handleLogin}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {error}
            </Alert>
          )}
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <TextField
            label="Password"
            type="password"
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
            {loading ? "Logging in..." : "Log In"}
          </Button>

          <Typography variant="body2" align="center">
            Don't have an account?{" "}
            <Box
              component={Link}
              to="/register"
              sx={{ color: "#1976d2", textDecoration: "none", fontWeight: 600, display: "inline" }}
            >
              Register
            </Box>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
