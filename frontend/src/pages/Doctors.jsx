import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Fade,
  TextField,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import api from "../utils/api";
import { API_BASE } from "../utils/config";
import { useEffect, useState } from "react";


export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 4;
  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get(`${API_BASE}/doctors`, {
        params: { page, limit, search: search || undefined }
      })
      .then((res) => {
        const payload = res.data || {};
        setDoctors(payload.doctors || []);
        setTotalPages(payload.pagination?.totalPages || 1);
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load doctors")
      )
      .finally(() => setLoading(false));
  }, [API_BASE, page, limit, search]);

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const renderImageSrc = (doctor) => {
    if (!doctor?.image) return "";
    if (doctor.image.startsWith("http")) return doctor.image;
    // backend stores image paths like "/images/doctor1.jpg"
    return `${API_BASE}${doctor.image.startsWith("/") ? "" : "/"}${doctor.image}`;
  };

  const visibleDoctors = (() => {
    const term = search.trim().toLowerCase();
    if (!term) return doctors;
    return doctors.filter((doc) => {
      const name = doc.name?.toLowerCase() || "";
      const dept = doc.department?.toLowerCase() || "";
      return name.includes(term) || dept.includes(term);
    });
  })();

  return (
    <Box sx={{ pb: 12 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Doctors
          </Typography>
          <Typography color="text.secondary">Browse available doctors and departments.</Typography>
        </Box>
        <TextField
          value={search}
          onChange={handleSearchChange}
          size="small"
          placeholder="Search name or department"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" fontSize="small" />
              </InputAdornment>
            ),
          }}
          inputProps={{
            sx: {
              fontSize: 13,
              "::placeholder": { fontSize: 13 },
            },
          }}
          sx={{ width: { xs: "100%", sm: 240 } }}
        />
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Stack alignItems="center" sx={{ mt: 4 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <Fade in timeout={800} key={`${page}-${search}`}>
          <Grid container spacing={2} direction="column">
            {visibleDoctors.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: 3, width: "100%", maxWidth: 720, mx: "auto" }}>
                  <Typography color="text.secondary">No doctors found for that search.</Typography>
                </Paper>
              </Grid>
            ) : (
              visibleDoctors.map((doctor) => (
                <Grid item xs={12} key={doctor._id || doctor.name}>
                  <Paper sx={{ p: 3, borderRadius: 3, width: "100%", maxWidth: 720, mx: "auto" }}>
                    <Box
                      sx={{
                        width: "100%",
                        height: { xs: 240, sm: 280 },
                        mb: 2,
                        borderRadius: 3,
                        overflow: "hidden",
                        background:
                          "linear-gradient(180deg, rgba(227,242,253,0.9) 0%, rgba(248,251,255,1) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #dce7ff",
                      }}
                    >
                      <img
                        src={renderImageSrc(doctor)}
                        alt={doctor.name}
                        width="100%"
                        height="100%"
                        loading="lazy"
                        style={{
                          objectFit: "contain",
                          objectPosition: "center top",
                          borderRadius: "12px",
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </Box>
                    <Typography sx={{ fontWeight: 700 }}>{doctor.name}</Typography>
                    <Typography color="text.secondary">{doctor.department}</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {doctor.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))
            )}
          </Grid>
        </Fade>
      )}

      <Box
        sx={{
          position: "fixed",
          bottom: 16,
          right: 8,
          zIndex: 10,
          px: 2,
          py: 1,
          bgcolor: "transparent",
          borderRadius: 0,
          boxShadow: "none",
          border: "none",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Page {page} of {totalPages}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            aria-label="Previous page"
            disabled={page === 1 || loading}
            onClick={handlePrev}
          >
            Previous
          </Button>
          <Button
            size="small"
            variant="outlined"
            aria-label="Next page"
            disabled={page === totalPages || loading}
            onClick={handleNext}
          >
            Next
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
