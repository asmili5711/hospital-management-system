import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useState, useEffect } from "react";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id) => {
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <AppBar
      position="fixed"
      elevation={scrolled ? 4 : 0}
      sx={{
        backgroundColor: scrolled ? "#ffffff" : "transparent",
        color: scrolled ? "#0d47a1" : "#ffffff",
        transition: "all 0.3s ease",
      }}
    >
      <Toolbar>
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "#1976d2",
          }}
        >
          <LocalHospitalIcon sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
            MediCare
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button onClick={() => scrollTo("home")}>Home</Button>
          <Button onClick={() => scrollTo("services")}>Services</Button>
          <Button onClick={() => scrollTo("howitworks")}>How It Works</Button>
          <Button onClick={() => scrollTo("whyus")}>Why Us</Button>
          <Button onClick={() => scrollTo("testimonials")}>Reviews</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
