import React, { useState } from "react";
import {
    Box,
    Button,
    Container,
    FormControl,
    Grid,
    TextField,
    Typography,
} from "@mui/material";

import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

import axios from "axios";

const LoginScreen = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_PORT}/auth/login`,
                {
                    email: email,
                    password: password,
                },
                { headers: { "Content-Type": "application/json" } }
            );

            let decoded = jwtDecode(res.data.token);

            if (!decoded.isAdmin)
                return alert("You are not authorized to access this page!");

            localStorage.setItem("token", res.data.token);

            navigate("/");
        } catch (error) {
            alert(error.response.data.message);
        }
    };

    const handleUsernameChange = (e) => {
        setEmail(e.target.value);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    return (
        <Container maxWidth="sm" style={{ padding: "3em" }}>
            <Box boxShadow={3} style={{ padding: "1em" }}>
                <Typography variant="h4">Login</Typography>

                <form onSubmit={handleLogin}>
                    <FormControl style={{ marginTop: "1em" }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    required
                                    id="outlined-basic"
                                    label="Email"
                                    variant="outlined"
                                    type="email"
                                    onChange={handleUsernameChange}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    required
                                    id="outlined-password-input"
                                    label="Password"
                                    type="password"
                                    onChange={handlePasswordChange}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <Button type="submit" variant="contained">
                                    Login
                                </Button>
                            </Grid>
                        </Grid>
                    </FormControl>
                </form>
            </Box>
        </Container>
    );
};

export default LoginScreen;
