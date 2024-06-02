import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Alert,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
} from 'react-native';

import global_style from '../../style';
import * as Keychain from 'react-native-keychain';
import { AuthContext } from '../AuthContext';
import axios from 'axios';
import { API_URL, API_PORT } from '@env';

const RegistrationScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { setAuthToken } = useContext(AuthContext);

    const register = async () => {
        const validEmailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        const validPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;


        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        if (!password.match(validPasswordRegex)) {
            Alert.alert('Error', 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character');
            return;
        }

        if (!email.match(validEmailRegex)) {
            Alert.alert('Error', 'Invalid email address');
            return;
        }

        try {
            const res = await axios.post(`http://${API_URL}:${API_PORT}/auth/register`,
                JSON.stringify({ name, surname, email, password }),
                { headers: { 'Content-Type': 'application/json' } },
            );

            const data = res.data;
            await Keychain.setGenericPassword('jwtToken', data.token);
            setAuthToken(data.token);
            navigation.navigate('Home');
        } catch (error) {
            Alert.alert('Error', error.response.data.message);
            console.error('Error:', error.response.data);
        }
    };

    return (
        <SafeAreaView style={gloabl_style.main_view}>
            <ScrollView>
                <View>
                    <KeyboardAvoidingView style={style.form_container}>
                        <View style={style.field_container}>
                            <Text>Name</Text>
                            <TextInput style={style.text_input} onChangeText={text => setName(text)} value={name} />
                        </View>
                        <View style={style.field_container}>
                            <Text>Surname</Text>
                            <TextInput style={style.text_input} onChangeText={text => setSurname(text)} value={surname} />
                        </View>
                        <View style={style.field_container}>
                            <Text>Email</Text>
                            <TextInput style={style.text_input} onChangeText={text => setEmail(text)} value={email} />
                        </View>
                        <View style={style.field_container}>
                            <Text>Password</Text>
                            <TextInput secureTextEntry={true} style={style.text_input} onChangeText={text => setPassword(text)} value={password} />
                        </View>
                        <View style={style.field_container}>
                            <Text>Confirm Password</Text>
                            <TextInput secureTextEntry={true} style={style.text_input} onChangeText={text => setConfirmPassword(text)} value={confirmPassword} />
                        </View>

                        <View style={style.texts_container}>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={{ color: global_style.main_color }}>
                                    I have already an account
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={() => register()}
                            style={style.btn}>
                            <Text style={{ color: global_style.text_color_in_btn }}>
                                Register now
                            </Text>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </View>
            </ScrollView>

        </SafeAreaView>
    );
};

const style = StyleSheet.create({
    form_container: {
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    field_container: {
        width: '80%',
        margin: 15,
    },
    text_input: {
        height: 40,
        borderWidth: 1,
        marginTop: 5,
        borderRadius: 5,
    },
    btn: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '30%',
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

export default RegistrationScreen;
