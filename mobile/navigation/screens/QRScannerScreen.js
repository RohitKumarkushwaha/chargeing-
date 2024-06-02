import React, { useEffect, useState, useContext } from "react";
import { Alert, SafeAreaView, View, Text } from "react-native";
import QRCodeScanner from "react-native-qrcode-scanner";
import { RNCamera } from "react-native-camera";
import { AuthContext } from "../AuthContext";
import {Base64} from "js-base64";
import { API_URL, API_PORT } from "@env";

import global_style from "../../style";

import axios from "axios";
import { useNavigation } from "@react-navigation/native";

const QRScannerScreen = () => {
    const navigate = useNavigation();
    const { authToken } = useContext(AuthContext);
    const [decodedToken, setDecodedToken] = useState({});

    useEffect(() => {
        if (authToken) {
            const decodedToken = JSON.parse(Base64.decode(authToken.split('.')[1]));
            setDecodedToken(decodedToken);
        }
    }, []);

    const handleOperation = async (id) => {
        try {
            const res = await axios.get(
                `http://${API_URL}:${API_PORT}/station/${id}/`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: authToken,
                    },
                }
            );

            if (res.data.status === 0 && await handleStartCharging(id))
                Alert.alert("Success activation", "Station is activated for charging");
            else if (res.data.status === 2 && await handleStopCharging(id))
                Alert.alert("Success deactivation", "Station is deactivated from charging");

            navigate.navigate("Home");

        } catch (error) {
            Alert.alert('Error', error.response.data.message);
            console.error("Error:", error);
        }
    }

    const handleStartCharging = async (stationId) => {
        try {
            await axios.post(
                `http://${API_URL}:${API_PORT}/station/${stationId}/start_charging/`,
                { }, { 
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: authToken,
                    } 
                },
            );
            return true;
        } catch (error) {
            Alert.alert('Error', error.response.data.message);
            console.error('Error:', error);
            return false;
        }
    }

    const handleStopCharging = async (stationId) => {
        try {
            const res = await axios.post(
                `http://${API_URL}:${API_PORT}/station/${stationId}/stop_charging/`,
                { }, { 
                    headers: { 
                        'Content-Type': 'application/json',
                        Authorization: authToken,
                    } 
                },
            );
            return true;
        } catch (error) {
            Alert.alert('Error', error.response.data.message);
            console.error('Error:', error);
            return false;
        }
    }

    return (
        <QRCodeScanner 
            onRead={async (value) => await handleOperation(value.data)}  reactivate={true} reactivateTimeout={2000}
            showMarker={true}
            topContent={
                <View>
                    <Text style={{fontSize: 20, marginBottom: 50}}>
                        Scan QR code to start/stop charging
                    </Text>
                </View>
            }
        />
    );
};

export default QRScannerScreen;