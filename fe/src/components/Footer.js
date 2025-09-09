import {
  Box,
  Container,
  Grid,
  Typography,
  TextField,
  Button,
  IconButton,
  Link,
} from "@mui/material";
import { Twitter, Facebook, YouTube, LinkedIn } from "@mui/icons-material";

export default function Footer() {
  return (
    <Box sx={{ width: '100%',bgcolor: "#445c5a", color: "rgba(255,255,255,0.7)", pt: 6, mt: 6 }}>
      <Container>
        <Grid container sx={{
          pb: 4,
          mb: 4,
          borderBottom: "1px solid rgba(226, 175, 24, 0.5)",
          alignItems: "center",
        }}>
          <Grid size={3}>
            <Typography
                variant="h4"
                sx={{ color: "#8bc34a", fontWeight: 700, mb: 0 }}
              >
                Fruitables
              </Typography>
              <Typography sx={{ color: "#ffb300", fontSize: "14px" }}>
                Fresh products
              </Typography>
          </Grid>
          <Grid size={5}>
            <Box sx={{ position: "relative" }}>
              <TextField
                placeholder="Your Email"
                fullWidth
                variant="outlined"
                InputProps={{
                  sx: {
                    bgcolor: "white",
                    borderRadius: "50px",
                    height: "50px",
                    pl: 2,
                    pr: 16,
                  },
                }}
              />
              <Button
                variant="contained"
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  height: "100%",
                  borderRadius: "50px",
                  bgcolor: "#8bc34a",
                  color: "white",
                  px: 3,
                  fontWeight: "bold",
                  textTransform: "none",
                  "&:hover": { bgcolor: "#689f38" },
                }}
              >
                Subscribe Now
              </Button>
            </Box>
          </Grid>
          <Grid size={3}>
            <Box
              sx={{
                display: "flex",
                justifyContent: { xs: "center", md: "flex-end" },
                gap: 2,
              }}
            >
              {[Twitter, Facebook, YouTube, LinkedIn].map((Icon, i) => (
                <IconButton
                  key={i}
                  sx={{
                    border: "1px solid #ffb300",
                    color: "white",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                  }}
                >
                  <Icon fontSize="small" />
                </IconButton>
              ))}
            </Box>
          </Grid>
        </Grid>
        <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
          <Grid size={6}>
            <Typography
              variant="h6"
              sx={{ color: "white", mb: 2, fontWeight: 600 }}
            >
              Why People Like us!
            </Typography>
            <Typography sx={{
              whiteSpace: "normal",     // ✅ allow wrapping
              overflowWrap: "break-word", // ✅ modern way to break long words
              wordBreak: "break-word",    // ✅ fallback
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.7)",  
            }}>
              typesetting, remaining essentially unchanged. It was popularised in
              the 1960s with the like Aldus PageMaker including of Lorem Ipsum.
            </Typography>
            <Button
              variant="outlined"
              sx={{
                borderRadius: "50px",
                borderColor: "#ffb300",
                color: "#8bc34a",
                px: 3,
                textTransform: "none",
              }}
            >
              Read More
            </Button>
          </Grid>
          <Grid size={3}>
            <Typography
              variant="h6"
              sx={{ color: "white", mb: 2, fontWeight: 600 }}
            >
              Shop Info
            </Typography>
            {[
              "Contact Us",
              "Privacy Policy",
              "Terms & Condition",
            ].map((item, i) => (
              <Link
                key={i}
                href="#"
                color="inherit"
                underline="hover"
                display="block"
                sx={{ mb: 1, fontSize: "14px" }}
              >
                {item}
              </Link>
            ))}
          </Grid>
          <Grid size={3}>
            <Typography
              variant="h6"
              sx={{ color: "white", mb: 2, fontWeight: 600 }}
            >
              Account
            </Typography>
            {[
              "My Account",
              "Shop details",
              "Shopping Cart",
              "Wishlist",
            ].map((item, i) => (
              <Link
                key={i}
                href="#"
                color="inherit"
                underline="hover"
                display="block"
                sx={{ mb: 1, fontSize: "14px" }}
              >
                {item}
              </Link>
            ))}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
