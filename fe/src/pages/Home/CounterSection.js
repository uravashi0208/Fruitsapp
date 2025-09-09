import { Box, Grid, Typography, Paper } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

export default function CounterSection() {
  const counters = [
    { label: "satisfied customers", value: "1963", icon: <PeopleIcon sx={{ fontSize: 90 }} /> },
    { label: "quality of service", value: "99%", icon: <WorkspacePremiumIcon sx={{ fontSize: 90 }} /> },
    { label: "quality certificates", value: "33", icon: <EmojiEventsIcon sx={{ fontSize: 90 }} /> },
    { label: "Available Products", value: "789", icon: <ShoppingBagIcon sx={{ fontSize: 90 }} /> },
  ];

  return (
    <Box sx={{ py: 5 }}>
      <Box sx={{ maxWidth: "1200px", mx: "auto" }}>
        <Box sx={{ bgcolor: "grey.100", p: { xs: 3, md: 5 }, borderRadius: 3 }}>
          <Grid container spacing={3} justifyContent="center">
            {counters.map((counter, index) => (
              <Grid item xs={12} sm={6} md={6} lg={3} key={index}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 5,
                    borderRadius: 3,
                    textAlign: "center",
                  }}
                >
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      justifyContent: "center",
                      color: "secondary.main",
                    }}
                  >
                    {counter.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ textTransform: "capitalize", mb: 1,color:'#81C408',whiteSpace:'normal',wordWrap:'break-word' }}
                  >
                    {counter.label}
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {counter.value}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}
