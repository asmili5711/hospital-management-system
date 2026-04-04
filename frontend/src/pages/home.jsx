import { Box, Container, Typography, Button, Grid } from "@mui/material";

import { Link } from "react-router-dom";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import SecurityIcon from "@mui/icons-material/Security";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import { CenterFocusStrong } from "@mui/icons-material";

export default function Home() {
  return (
    <Box>
      {/* HERO SECTION */}
      <Box id="home"
        sx={{
          background: "linear-gradient(135deg, #e3f2fd, #ffffff)",
          py: 10,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            {/* LEFT SIDE */}
            <Grid item xs={12} sm={6} md={6}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                }}
              >
                Your Health, Simplified.
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Book appointments, manage your medical history, and connect with
                trusted doctors — all in one secure platform.
              </Typography>

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  component={Link}
                  to="/register"
                >
                  Get Started
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  component={Link}
                  to="/login"
                >
                  Login
                </Button>
              </Box>
            </Grid>

            {/* RIGHT SIDE */}
            <Grid
              item
              xs={12}
              sm={6}
              md={6}
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  p: { xs: 4, md: 6 },
                  borderRadius: 5,
                  background:
                    "linear-gradient(140deg, rgba(255,255,255,0.96), rgba(227,242,253,0.92))",
                  boxShadow: "0 16px 40px rgba(25,118,210,0.18)",
                  border: "1px solid #cfe8ff",
                  borderLeft: "8px solid #1976d2",
                  maxWidth: 700,
                  width: "100%",
                  backdropFilter: "blur(4px)",
                  transition: "all 0.35s ease",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: "0 22px 50px rgba(25,118,210,0.24)",
                  },
                  "&::before": {
                    content: '"“"',
                    position: "absolute",
                    top: { xs: 12, md: 16 },
                    right: { xs: 18, md: 24 },
                    fontSize: { xs: "3.2rem", md: "4rem" },
                    color: "rgba(25,118,210,0.18)",
                    fontWeight: 700,
                    lineHeight: 1,
                  },
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: "#0d47a1",
                    mb: 2,
                    letterSpacing: 0.2,
                    lineHeight: 1.3,
                  }}
                >
                  We care for your health like family.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "#334155",
                    lineHeight: 2,
                    fontSize: { xs: "1rem", md: "1.12rem" },
                    maxWidth: 620,
                  }}
                >
                  At MediCare, every appointment is built on trust, compassion, and
                  medical excellence. From your first consultation to follow-up care,
                  our platform is designed to make healthcare simple, transparent, and
                  stress-free so you can focus on what truly matters: your well-being.
                </Typography>
                <Box
                  sx={{
                    mt: 3,
                    display: "flex",
                    gap: 1.2,
                    flexWrap: "wrap",
                  }}
                >
                  <Box
                    sx={{
                      px: 1.6,
                      py: 0.7,
                      borderRadius: 6,
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "#0d47a1",
                      backgroundColor: "#d9ecff",
                    }}
                  >
                    Trusted Doctors
                  </Box>
                  <Box
                    sx={{
                      px: 1.6,
                      py: 0.7,
                      borderRadius: 6,
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "#0d47a1",
                      backgroundColor: "#d9ecff",
                    }}
                  >
                    Secure Records
                  </Box>
                  <Box
                    sx={{
                      px: 1.6,
                      py: 0.7,
                      borderRadius: 6,
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "#0d47a1",
                      backgroundColor: "#d9ecff",
                    }}
                  >
                    Quick Support
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* SERVICES SECTION */}
      <Box id="services" sx={{ py: 12, backgroundColor: "#f9fbfd" }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            textAlign="center"
            fontWeight={700}
            gutterBottom
          >
            Our Services
          </Typography>

          <Typography textAlign="center" color="text.secondary" sx={{ mb: 8 }}>
            Everything you need to manage your healthcare easily.
          </Typography>

          <Grid
            container
            spacing={6}
            justifyContent="center"
            alignItems="stretch"
          >
            {[
              {
                title: "Book Appointments",
                desc: "Schedule appointments with trusted doctors easily.",
              },
              {
                title: "Doctor Directory",
                desc: "Browse available doctors and choose the right specialist.",
              },
              {
                title: "Medical Records",
                desc: "Access your medical history anytime, anywhere.",
              },
              {
                title: "Secure Platform",
                desc: "Your health data is encrypted and fully protected.",
              },
            ].map((service, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box
                  sx={{
                    p: 5,
                    height: "100%",
                    borderRadius: 4,
                    backgroundColor: "white",
                    boxShadow: 2,
                    textAlign: "center",
                    transition: "0.3s",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    "&:hover": {
                      transform: "translateY(-10px)",
                      boxShadow: 6,
                    },
                  }}
                >
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {service.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {service.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* HOW IT WORKS SECTION */}
      <Box id="howitworks" sx={{ py: 14, backgroundColor: "#f9fbfd" }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            textAlign="center"
            fontWeight={700}
            gutterBottom
          >
            How It Works
          </Typography>

          <Typography textAlign="center" color="text.secondary" sx={{ mb: 10 }}>
            Get started in just three simple steps.
          </Typography>

          <Grid
            container
            spacing={6}
            justifyContent="center"
            alignItems="stretch"
          >
            {[
              {
                step: "01",
                title: "Create Account",
                desc: "Sign up and complete your profile in minutes.",
              },
              {
                step: "02",
                title: "Book Appointment",
                desc: "Choose your doctor and schedule your visit easily.",
              },
              {
                step: "03",
                title: "Consult Doctor",
                desc: "Meet your doctor in person or online securely.",
              },
            ].map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box
                  sx={{
                    height: "100%",
                    p: 5,
                    borderRadius: 4,
                    backgroundColor: "white",
                    boxShadow: 2,
                    textAlign: "center",
                    transition: "0.3s",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: 6,
                    },
                  }}
                >
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: "primary.main",
                      mb: 3,
                    }}
                  >
                    {item.step}
                  </Typography>

                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {item.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {item.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* WHY CHOOSE US SECTION */}
      <Box id="whyus" sx={{ py: 14 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            textAlign="center"
            fontWeight={700}
            gutterBottom
          >
            Why Choose Us
          </Typography>

          <Typography textAlign="center" color="text.secondary" sx={{ mb: 10 }}>
            We provide trusted, secure, and modern healthcare solutions.
          </Typography>

          <Grid container spacing={6} justifyContent="center">
            {[
              {
                icon: <MedicalServicesIcon sx={{ fontSize: 50 }} />,
                title: "Experienced Doctors",
                desc: "Our certified professionals ensure quality healthcare for every patient.",
              },
              {
                icon: <SecurityIcon sx={{ fontSize: 50 }} />,
                title: "Secure Data",
                desc: "All medical records are encrypted and safely stored.",
              },
              {
                icon: <SupportAgentIcon sx={{ fontSize: 50 }} />,
                title: "24/7 Support",
                desc: "Our support team is always ready to assist you anytime.",
              },
              {
                icon: <HealthAndSafetyIcon sx={{ fontSize: 50 }} />,
                title: "Modern Technology",
                desc: "We use advanced systems to simplify your healthcare journey.",
              },
            ].map((item, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={3}
                sx={{ display: "flex", justifyContent: "center" }}
                key={index}
              >
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: 280,
                    p: 5,
                    height: "100%",
                    borderRadius: 4,
                    backgroundColor: "#f9fbfd",
                    textAlign: "center",
                    transition: "0.3s",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: 4,
                    },
                  }}
                >
                  {/* ICON */}
                  <Box
                    sx={{
                      color: "primary.main",
                      mb: 3,
                    }}
                  >
                    {item.icon}
                  </Box>

                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {item.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {item.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* TESTIMONIALS SECTION */}
      <Box id="testimonials" sx={{ py: 14, backgroundColor: "#f9fbfd" }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            textAlign="center"
            fontWeight={700}
            gutterBottom
          >
            What Our Patients Say
          </Typography>

          <Typography textAlign="center" color="text.secondary" sx={{ mb: 10 }}>
            Trusted by thousands of patients.
          </Typography>

          <Grid
            container
            spacing={6}
            justifyContent="center"
            alignItems="stretch"
          >
            {[
              {
                name: "Rahul Sharma",
                text: "Booking appointments has never been this easy. The platform is smooth and reliable.",
              },
              {
                name: "Ananya Verma",
                text: "I can manage my medical history anytime. It gives me peace of mind.",
              },
              {
                name: "Karthik R",
                text: "The doctors are very professional and the system is extremely secure.",
              },
            ].map((item, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={index}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: 350,
                    p: 5,
                    borderRadius: 4,
                    backgroundColor: "white",
                    boxShadow: 2,
                    height: "100%",
                    transition: "0.3s",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: 6,
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                  >
                    “{item.text}”
                  </Typography>

                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    color="primary.main"
                  >
                    — {item.name}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* FINAL CALL TO ACTION */}
      <Box id="cta" sx={{ py: 14 }}>
        <Container maxWidth="md">
          <Box
            sx={{
              p: 8,
              borderRadius: 5,
              textAlign: "center",
              backgroundColor: "white",
              boxShadow: 4,
              border: "1px solid #e3f2fd",
            }}
          >
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Ready to Manage Your Health Easily?
            </Typography>

            <Typography color="text.secondary" sx={{ mb: 5 }}>
              Join thousands of patients who trust our platform for secure,
              simple, and modern healthcare management.
            </Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 3,
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="contained"
                size="large"
                sx={{
                  px: 4,
                  fontWeight: 600,
                }}
                component={Link}
                  to="/register"
              >
                Create Account
              </Button>

              <Button
                variant="outlined"
                size="large"
                sx={{
                  px: 4,
                  fontWeight: 600,
                }}
              >
                Book Appointment
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
