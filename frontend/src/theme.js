import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",   // Main blue
    },
    secondary: {
      main: "#0d47a1",   // Dark blue
    },
    background: {
      default: "#f5f9ff",  // Light blue background
      paper: "#ffffff",    // White cards
    },
  },
  typography: {
    fontFamily: "Inter, sans-serif",
    h5: {
      fontWeight: 600,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 10,
  },
});

export default theme;
