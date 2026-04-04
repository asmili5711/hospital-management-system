import {
  Box,
  Container,
  Typography,
  IconButton,
  Stack,
  Divider
} from "@mui/material";

import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        background: "linear-gradient(90deg, #1976d2, #1565c0)",
        color: "white",
        mt: 6,
        pt: 5,
        pb: 3
      }}
    >
      <Container maxWidth="lg">

        {/* Top Section */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "center", md: "flex-start" }}
          spacing={4}
          textAlign={{ xs: "center", md: "left" }}
        >
          {/* Brand */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              ClinicCare
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 300 }}>
              Smart and secure healthcare management. Book appointments,
              track history, and manage your profile with ease.
            </Typography>
          </Box>

          {/* Quick Links */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Quick Links
            </Typography>
            <Stack spacing={0.8}>
              <Typography variant="body2" sx={{ cursor: "pointer", opacity: 0.85 }}>
                Dashboard
              </Typography>
              <Typography variant="body2" sx={{ cursor: "pointer", opacity: 0.85 }}>
                Book Appointment
              </Typography>
              <Typography variant="body2" sx={{ cursor: "pointer", opacity: 0.85 }}>
                My Appointments
              </Typography>
            </Stack>
          </Box>

          {/* Social */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Connect With Us
            </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton sx={{ color: "white" }}>
                <FacebookIcon />
              </IconButton>
              <IconButton sx={{ color: "white" }}>
                <TwitterIcon />
              </IconButton>
              <IconButton sx={{ color: "white" }}>
                <InstagramIcon />
              </IconButton>
              <IconButton sx={{ color: "white" }}>
                <LinkedInIcon />
              </IconButton>
            </Stack>
          </Box>
        </Stack>

        {/* Divider */}
        <Divider sx={{ my: 3, backgroundColor: "rgba(255,255,255,0.2)" }} />

        {/* Bottom Section */}
        <Typography
          variant="body2"
          align="center"
          sx={{ opacity: 0.75 }}
        >
          © {new Date().getFullYear()} ClinicCare. All rights reserved.
        </Typography>

      </Container>
    </Box>
  );
}
