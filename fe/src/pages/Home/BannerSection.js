import { Box, Grid, Typography, Button } from "@mui/material";
import bannerImg from "../../assets/img/baner-1.png"; // replace path

export default function BannerSection() {
  return (
    <Box
      sx={{
        bgcolor: "secondary.main",
        my: 5,
        py: 5,
      }}
    >
        <Box sx={{ px: { xs: 2, sm: 4, md: 18 } }}>
            <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
                <Grid size={6}>
                    <Box sx={{ py: 4 }}>
                        <Typography
                            variant="h2"
                            sx={{ color: "white", fontWeight: 800, fontSize:'4rem',fontFamily:'"Raleway", sans-serif' }}
                        >
                            Fresh Exotic Fruits
                        </Typography>
                        <Typography
                            variant="h2"
                            sx={{ color: "#45595b", fontWeight: 400, mb: 4,fontSize:'4rem' }}
                        >
                            in Our Store
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 4, color: "#45595b" }}>
                            The generated Lorem Ipsum is therefore always free from
                            repetition injected humour, or non-characteristic words etc.
                        </Typography>
                        <Button
                            variant="outlined"
                            sx={{
                            border: "2px solid white",
                            borderRadius: "50px",
                            py: 1.5,
                            px: 6,
                            fontWeight: 600,
                            fontSize: "1rem",
                            color: "#45595b",
                            bgcolor: "transparent",
                            "&:hover": {
                                bgcolor: "white",
                                color: "secondary.main",
                            },
                            }}
                        >
                            BUY
                        </Button>
                    </Box>
                </Grid>
                <Grid size={6}>
                    <Box sx={{ position: "relative" }}>
                        <Box
                            component="img"
                            src={bannerImg}
                            alt="Banner"
                            sx={{
                            width: "100%",
                            borderRadius: 2,
                            objectFit: "cover",
                            }}
                        />
                        <Box
                            sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: 140,
                            height: 140,
                            bgcolor: "white",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 6px 12px rgba(0,0,0,0.1)",
                            p: 2,
                            }}
                        >
                            <Typography
                            variant="h1"
                            sx={{
                                fontSize: "100px",
                                lineHeight: 1.2,
                                fontWeight: 600,
                                fontFamily:'"Raleway", sans-serif'
                            }}
                            >
                            1
                            </Typography>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                                <Typography variant="h4" sx={{ fontSize: "2rem",fontWeight: 600, mb: 0,lineHeight: 1.2,fontFamily:'"Raleway", sans-serif',color:'#45595b' }}>
                                    50$
                                </Typography>
                                <Typography variant="h5" sx={{ fontSize: "1.5rem",fontWeight: 600, mb: 0,lineHeight: 1.2,fontFamily:'"Raleway", sans-serif',color:'#6c757d' }}>
                                    kg
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    </Box>
  );
}
