import {
  Box,
  Container,
  Grid,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import ShopPageHeader from "../Shop/ShopPageHeader";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";

import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";


export default function ContactPage() {
    const API_URL = process.env.REACT_APP_API_BASE || 'https://fruitsapp-0vl3.onrender.com';
    const ContactSchema = Yup.object().shape({
        name: Yup.string().trim().required("Name is required"),
        email: Yup.string().trim().email("Invalid email").required("Email is required"),
        message: Yup.string().trim().min(10, "Message too short").required("Message is required"),
    });

    const [snackbar, setSnackbar] = useState({ open: false, severity: "success", message: "" });

    return(
        <>
        <ShopPageHeader title={'Contact'}/>
        <Container sx={{mt:12 }}>
             <Box sx={{ bgcolor: "#f4f6f8", py: 6 }}>
                <Container maxWidth="lg">
                    {/* Title & Description */}
                    <Box textAlign="center" mb={4}>
                        <Typography
                            variant="h4"
                            sx={{ fontWeight: "bold", color: "#81c408", mb: 2 }}
                        >
                            Get in touch
                        </Typography>
                        <Typography sx={{ maxWidth: "700px", mx: "auto", mb: 1,color:'#747d88' }}>
                            The contact form is currently inactive. Get a functional and working
                            contact form with Ajax & PHP in a few minutes. Just copy and paste
                            the files, add a little code and you're done.{" "}
                            <Link href="https://htmlcodex.com/contact-form" underline="hover" sx={{ color: "#81c408" }}>
                            Download Now
                            </Link>.
                        </Typography>
                    </Box>

                    {/* Google Map */}
                    <Box
                    component="iframe"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d387191.33750346623!2d-73.97968099999999!3d40.6974881!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sbd!4v1694259649153!5m2!1sen!2sbd"
                    width="100%"
                    height="1000"
                    style={{ border: 0, borderRadius: "12px", marginBottom: "32px" }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    />

                    {/* Form + Contact Info */}
                    <Grid container spacing={3}>
                        {/* Left: Form */}
                        <Grid item xs={12} md={7}>
                            <Formik
                            initialValues={{ name: "", email: "", message: "" }}
                            validationSchema={ContactSchema}
                            onSubmit={async (values, { setSubmitting, resetForm }) => {
                                try {
                                setSubmitting(true);
                                const res = await fetch(`${API_URL}/api/contact`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(values),
                                });

                                if (!res.ok) {
                                    const body = await res.json().catch(() => ({}));
                                    throw new Error(body.message || `Server responded ${res.status}`);
                                }

                                setSnackbar({ open: true, severity: "success", message: "Message sent — thank you!" });
                                resetForm();
                                } catch (err) {
                                setSnackbar({
                                    open: true,
                                    severity: "error",
                                    message: err.message || "Failed to send. Try again later.",
                                });
                                } finally {
                                setSubmitting(false);
                                }
                            }}
                            >
                                {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
                                    <Form noValidate>
                                    <TextField
                                        name="name"
                                        value={values.name}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        fullWidth
                                        placeholder="Your Name"
                                        variant="outlined"
                                        sx={{
                                        mb: 3,
                                        bgcolor: "white",
                                        borderRadius: 2,
                                        "& fieldset": { border: "none" },
                                        }}
                                        error={Boolean(touched.name && errors.name)}
                                        helperText={touched.name && errors.name ? errors.name : " "}
                                    />

                                    <TextField
                                        name="email"
                                        value={values.email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        fullWidth
                                        type="email"
                                        placeholder="Enter Your Email"
                                        variant="outlined"
                                        sx={{
                                        mb: 3,
                                        bgcolor: "white",
                                        borderRadius: 2,
                                        "& fieldset": { border: "none" },
                                        }}
                                        error={Boolean(touched.email && errors.email)}
                                        helperText={touched.email && errors.email ? errors.email : " "}
                                    />

                                    <TextField
                                        name="message"
                                        value={values.message}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        fullWidth
                                        multiline
                                        rows={5}
                                        placeholder="Your Message"
                                        variant="outlined"
                                        sx={{
                                        mb: 3,
                                        bgcolor: "white",
                                        borderRadius: 2,
                                        "& fieldset": { border: "none" },
                                        }}
                                        error={Boolean(touched.message && errors.message)}
                                        helperText={touched.message && errors.message ? errors.message : " "}
                                    />

                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="outlined"
                                        disabled={isSubmitting}
                                        sx={{
                                            py: 1.5,
                                            borderRadius: 2,
                                            border: "1px solid transparent",
                                            color: "limegreen",
                                            borderColor:'#ffb524',
                                            textTransform: "none",
                                            fontWeight: "bold",
                                            fontSize:'1rem',
                                            bgcolor: "white",
                                            transition:'0.5s',
                                            "&:hover": {
                                                bgcolor: "#FFB524",
                                                color: "white",
                                            },
                                        }}
                                    >
                                        {isSubmitting ? <CircularProgress size={20} /> : "Submit"}
                                    </Button>
                                    </Form>
                                )}
                            </Formik>
                        </Grid>

                        {/* Right: Contact Info */}
                        <Grid item xs={12} md={5}>
                            <Paper
                            sx={{
                                p: 4,
                                mb: 4,
                                display: "flex",
                                alignItems: "center",
                                bgcolor: "white",
                                borderRadius: 2,
                                width:'110%'
                            }}
                            elevation={0}
                            >
                            <LocationOnIcon sx={{ fontSize: 45, mr: 2, color: "#81c408" }} />
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: "bold",color:'#45595b' }}>
                                Address
                                </Typography>
                                <Typography sx={{ color:'#747d88'}}>123 Street New York.USA</Typography>
                            </Box>
                            </Paper>

                            <Paper
                            sx={{
                                p: 4,
                                mb: 4,
                                display: "flex",
                                alignItems: "center",
                                bgcolor: "white",
                                borderRadius: 2,
                                 width:'110%'
                            }}
                            elevation={0}
                            >
                            <EmailIcon sx={{ fontSize: 45, mr: 2, color: "#81c408" }} />
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: "bold",color:'#45595b'  }}>
                                Mail Us
                                </Typography>
                                <Typography sx={{ color:'#747d88'}}>info@example.com</Typography>
                            </Box>
                            </Paper>

                            <Paper
                            sx={{
                                p: 4,
                                display: "flex",
                                alignItems: "center",
                                bgcolor: "white",
                                borderRadius: 2,
                                width:'110%'
                            }}
                            elevation={0}
                            >
                            <PhoneIcon sx={{ fontSize: 45, mr: 2, color: "#81c408" }} />
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: "bold",color:'#45595b'  }}>
                                Telephone
                                </Typography>
                                <Typography sx={{ color:'#747d88'}}>(+012) 3456 7890</Typography>
                            </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </Container>
        </>
    )
}