import React, { useState, useEffect} from "react";
import { Line } from "react-chartjs-2";
import { Chart } from "chart.js/auto";
import { Container, Typography, Grid } from "@mui/material";

import axios from "axios";

const ReportScreen = () => {
    const [reportData, setReportData] = useState({});

    useEffect(() => {
        const getReportData = async () => {
            try {
                const data = await axios.get(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_PORT}/station/report`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: localStorage.getItem("token"),
                    }
                });

                setReportData(data.data);
            } catch (error) {
                alert("Error getting report data");
                console.error(error);
            }
        }

        getReportData();

    }, []);

    return (
        <Container maxWidth="xl" style={{ marginTop: "3em" }}>
            <Typography variant="h4" gutterBottom component="div">
                Report
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <Line
                        style={{ height: "30%", width: "100%" }}
                        data={{
                            labels: Object.keys(reportData),
                            datasets: [
                                {
                                    label: "Revenue",
                                    data: Object.values(reportData).map((row) => (row.revenue / 100)),
                                    backgroundColor: "rgba(1, 125, 12, 0.2)",
                                    borderColor: "rgba(1, 125, 12, 1)",
                                    borderWidth: 1,
                                },
                            ],
                        }}
                        options={{
                            indexAxis: "x",
                            scales: {
                                x: {
                                    beginAtZero: true,
                                },
                            },
                        }}
                    />
                </Grid>
                <Grid item xs={6}>
                    <Line
                        style={{ height: "30%", width: "100%" }}
                        data={{
                            labels: Object.keys(reportData),
                            datasets: [
                                {
                                    label: "Used Power",
                                    data: Object.values(reportData).map((row) => row.usedPower),
                                    backgroundColor: "rgba(99, 99, 255, 0.2)",
                                    borderColor: "rgba(99, 99, 255, 1)",
                                    borderWidth: 1,
                                },
                            ],
                        }}
                        options={{
                            indexAxis: "x",
                            scales: {
                                x: {
                                    beginAtZero: true,
                                },
                            },
                        }}
                    />
                </Grid>
            </Grid>
            
        </Container>
    );
};

export default ReportScreen;