import React, { useContext, useEffect, useState } from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import HomeScreen from './screens/HomeScreen';
import UserScreen from './screens/UserScreen';
import LoginScreen from './screens/LoginScreen';
import RegistrationScreen from './screens/RegistrationScreen';
import QRScannerScreen from './screens/QRScannerScreen';
import * as Keychain from 'react-native-keychain';
import { AuthContext } from './AuthContext';
import axios from 'axios';
import { API_URL, API_PORT } from '@env';
import global_style from '../style';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import ChargingStatusScreen from './screens/ChargingStatusScreen';

// Screens name
const homeName = 'Home';
const searchName = 'Search';
const userName = 'User';
const profileName = 'Profile';
const QRScanner = 'QRScanner';
const ChargingStatus = 'ChargingStatus';
const Tab = createBottomTabNavigator();
const AuthStack = createStackNavigator();

const AuthNavigator = () => (
    <AuthStack.Navigator
        initialRouteName="Login"
        screenOptions={{
            headerShown: false,
        }}>
        <AuthStack.Screen name="User" component={UserScreen} />
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Registration" component={RegistrationScreen} />
        <AuthStack.Screen name="Home" component={HomeScreen} />
    </AuthStack.Navigator>
);

const MainContainer = () => {
    const { authToken, setAuthToken } = useContext(AuthContext);

    useEffect(() => {
        const fetchToken = async () => {
            const credentials = await Keychain.getGenericPassword();
            if (credentials) {
                axios
                    .get(`http://${API_URL}:${API_PORT}/auth/validateToken`, {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `${credentials.password}`,
                        },
                    })
                    .then(response => {
                        setAuthToken(credentials.password);
                    })
                    .catch(async error => {
                        await Keychain.resetGenericPassword();
                        setAuthToken(null);
                    });
            }
        };
        fetchToken();
    }, [authToken, setAuthToken]);

    return (
        <>    
        <GestureHandlerRootView style={{ flex: 1 }}>
            <BottomSheetModalProvider>    
                <NavigationContainer>
                    {
                        authToken === null ? <AuthNavigator/> : 
                        <Tab.Navigator
                            initialRouteName={homeName}
                            screenOptions={({ route }) => ({
                                tabBarIcon: ({ focused, color, size }) => {
                                    let iconName;
                                    let routeName = route.name;

                                    if (routeName === homeName)
                                        iconName = focused ? 'home' : 'home-outline';
                                    else if (routeName === searchName)
                                        iconName = focused ? 'search' : 'search-outline';
                                    else if (routeName === userName || routeName === profileName)
                                        iconName = focused ? 'person' : 'person-outline';
                                    else if (routeName === QRScanner)
                                        iconName = focused ? 'qr-code' : 'qr-code-outline';
                                    else if (routeName === ChargingStatus)
                                        iconName = focused ? 'battery-charging' : 'battery-charging-outline';

                                    return <Ionicons name={iconName} size={size} color={color} />;
                                },
                                headerShown: false,
                                tabBarActiveTintColor: global_style.main_color,
                                tabBarInactiveTintColor: 'grey',
                                tabBarLabelStyle: { paddingBottom: 10, fontSize: 10 },
                                tabBarStyle: { padding: 10, height: 60 },
                            })}>
                            <Tab.Screen name={homeName} component={HomeScreen} />
                            <Tab.Screen name={QRScanner} component={QRScannerScreen} />
                            <Tab.Screen name={ChargingStatus} component={ChargingStatusScreen} />
                            <Tab.Screen name={profileName} component={UserScreen}/>
                        </Tab.Navigator>
                    }       
                </NavigationContainer>
            </BottomSheetModalProvider>
        </GestureHandlerRootView>
        </>
    );
};

export default MainContainer;
