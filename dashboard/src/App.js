import React, { useEffect } from "react";
import CustomNavbar from "./components/CustomNavbar";
import { Routes, Route, useNavigate } from "react-router-dom";

import HomeScreen from "./screens/HomeScreen";
import EditStation from "./screens/EditStation";
import LoginScreen from "./screens/LoginScreen";

import {jwtDecode} from "jwt-decode";

import axios from "axios";
import UserScreen from "./screens/UserScreen";
import ReportScreen from "./screens/ReportScreen";

function App() {
    const navigate = useNavigate();

    useEffect(() => {
        const checkToken = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            } else {
                let decoded = jwtDecode(token);

                if (!decoded.isAdmin) {
                    navigate("/login");
                    return;
                }

                try {
                    const res = await axios.get(
                        `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_PORT}/auth/validateToken`,
                        {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: token,
                            },
                        });
                        
                    if (res.status !== 200) {
                        navigate("/login");
                        return;
                    }
                } catch (error) {
                    localStorage.removeItem("token");
                    navigate("/login");
                    return;
                }
            }
        }

        checkToken();
    }, [navigate]);

    return (
        <div className="App">
            <CustomNavbar />
            <Routes>
                <Route path="/" element={<HomeScreen />} />
                <Route path="/station" element={<EditStation />} />
                <Route path="/station/:id" element={<EditStation />} />
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/user" element={<UserScreen />} />
                <Route path="/report" element={<ReportScreen />} />
                <Route path="*" element={<h1>Not Found</h1>} />
            </Routes>
        </div>
    );
}

export default App;
