import React, { useContext, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
} from 'react-native';
import * as Keychain from 'react-native-keychain';
import { AuthContext } from '../AuthContext';
import axios from 'axios';

import { API_URL, API_PORT } from '@env';

import gloabl_style from '../../style';
import { useIsFocused } from '@react-navigation/native';

const UserScreen = ({ navigation }) => {
    const { authToken, setAuthToken } = useContext(AuthContext);
    const [userData, setUserData] = useState({});
    const [confirmPassword, setConfirmPassword] = useState('');
    const isFocused = useIsFocused();

    const logout = async () => {
        await Keychain.resetGenericPassword();
        setAuthToken(null);
    };

    const fetchData = async () => {
        try {
            const response = await axios.get(`http://${API_URL}:${API_PORT}/user/`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `${authToken}`,
                },
            });

            setUserData(response.data);
        } catch (error) {
            Alert.alert('Error', error.response.data.message);
            console.error(error);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        fetchData();
    }, [isFocused]);

    const handleChangeData = (field, value) => {
        setUserData({ ...userData, [field]: value });
    }

    const handleSave = async () => {
        if (userData.email === '' || userData.name === '' || userData.surname === '') {
            Alert.alert('Error', 'All fields must be filled');
            return;
        }

        var validRegex =
            /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        if (!userData.email.match(validRegex)) {
            Alert.alert('Error', 'Invalid email address');
            return;
        }

        bodyToSend = {
            name: userData.name,
            surname: userData.surname,
            email: userData.email,
        }

        if (userData.password !== '') {
            if (userData.password !== confirmPassword) {
                Alert.alert('Error', 'Passwords do not match');
                return;
            }

            let validPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!userData.password.match(validPasswordRegex)) {
                Alert.alert('Error', 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character');
                return;
            }

            bodyToSend.password = userData.password;
        }

        try {
            const response = await axios.patch(`http://${API_URL}:${API_PORT}/user/`, bodyToSend, 
                { headers: {
                    'Content-Type': 'application/json',
                    Authorization: `${authToken}`,
                },
            });

            if (confirmPassword !== '') {
                setConfirmPassword("");
                setUserData({...userData, password: ""});
                await Keychain.setGenericPassword('jwtToken', response.data.token);
                setAuthToken(response.data.token);
            }
            Alert.alert('Success', 'User updated');
        } catch (error) {
            Alert.alert('Error', 'User not updated');
            console.error(error);
        }
    };

    return (
        <SafeAreaView style={gloabl_style.main_view}>
            <ScrollView style={{width: "100%"}}>

                <View style={style.form_container}>
                    <View style={style.field_container}>
                        <Text style={{fontSize: 25, fontWeight: "bold"}}>Balance: {userData.balance / 100}€</Text>
                    </View>
                </View>

                <KeyboardAvoidingView style={style.form_container}>
                    <View style={style.form_container}>
                        <View style={style.field_container}>
                            <Text>Name</Text>
                            <TextInput style={style.text_input} value={userData.name} onChangeText={(text) => handleChangeData("name", text)} />
                        </View>
                    </View>
                    
                    <View style={style.form_container}>
                        <View style={style.field_container}>
                            <Text>Surname</Text>
                            <TextInput style={style.text_input} value={userData.surname} onChangeText={text => handleChangeData("surname", text)} />
                        </View>
                    </View>
                    
                    <View style={style.form_container}>
                        <View style={style.field_container}>
                            <Text>Email</Text>
                            <TextInput style={style.text_input} value={userData.email} onChangeText={text => handleChangeData("email", text)} />
                        </View>
                    </View>

                    <View style={style.form_container}>
                        <View style={style.field_container}>
                            <Text>Password</Text>
                            <TextInput secureTextEntry style={style.text_input} value={userData.password ?? ""} onChangeText={text => handleChangeData("password", text)}/>
                        </View>
                    </View>

                    <View style={style.form_container}>
                        <View style={style.field_container}>
                            <Text>Password confirm  </Text>
                            <TextInput style={style.text_input} secureTextEntry value={confirmPassword} onChangeText={text => setConfirmPassword(text)} />
                        </View>
                    </View>

                    <View style={style.rows_btns}>  
                        <View style={style.btns}>
                            <TouchableOpacity onPress={() => handleSave()} style={style.btn}>
                                <Text style={{ color: gloabl_style.text_color_in_btn }}>Save</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={style.btns}>
                            <TouchableOpacity onPress={() => logout()} style={style.btn}>
                                <Text style={{ color: gloabl_style.text_color_in_btn }}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </ScrollView>
        </SafeAreaView>
    );
};

const style = StyleSheet.create({
    rows_btns: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    form_container: {
        width: '100%',
        // height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    field_container: {
        width: '92%',
        margin: 15,
    },
    text_input: {
        height: 40,
        borderWidth: 1,
        marginTop: 5,
        borderRadius: 5,
    },
    btns: {
        width: '40%',
        margin: 15,
    },
    btn: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: 50,
        backgroundColor: gloabl_style.main_color,
        marginTop: 35,
        borderRadius: 5,
        elevation: 5,
    },
    texts_container: {
        width: '80%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});

export default UserScreen;
