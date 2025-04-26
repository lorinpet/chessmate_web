import { ScrollView, useWindowDimensions, StyleSheet, Text, View, TextInput, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';

const ResetPasswordScreen = () => {
    const { email } = useLocalSearchParams();
    const [validating, setValidating] = useState(true);
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isValid, setIsValid] = useState({code: false, password: false, confirmPassword: false});
    const [serverCode, setServerCode] = useState('-1');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const server = 'chessmate-production.up.railway.app';

    const verifyToken = async () => {
        let response;

        try {
            const token = await AsyncStorage.getItem('token');
            response = await fetch('https://' + server + '/verify?token=' + token);
            setValidating(false);
        } catch (err) {
            setValidating(false);

            return;
        }

        response.json().then((code) => {
            if (code.code === '0') {
                router.push('dashboard');
            }
        });
    }

    useEffect(() => {
        if (validating) {
            verifyToken();
        }
    }, []);

    const handleResetPassword = async () => {
        const valid ={code: false, password: false, confirmPassword: false};
        let invalid = false;

        const codeRegex = /^\d{6}$/;

        if (!codeRegex.test(resetCode)) {
            valid.code = true;
            setServerCode('-1');
            invalid = true;
        }

        const passwordRegex = /^[A-Za-z0-9_]{8,32}$/;

        if (!passwordRegex.test(newPassword)) {
            valid.password = true;
            setServerCode('-1');
            invalid = true;
        } else if (confirmPassword !== newPassword) {
            valid.confirmPassword = true;
            setServerCode('-1');
            invalid = true;
        }

        setIsValid(valid);

        if (invalid) return;

        setIsLoading(true);

        try {
            const response = await fetch('https://' + server + '/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, resetCode, newPassword })
            });

            if (response.ok) {
                const message = await response.json();
                setServerCode(message.message);
            } else {
                const error = await response.json();
                setServerCode(error.error);
            }
        } catch (error) {
            setServerCode('4');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView>
            <View style={[styles.container, { minHeight: useWindowDimensions().height }]}>
                <Text style={styles.title}>ChessMate</Text>
                <Image source={require('../../pieces/cm.png')} style={styles.profileImage} />

                <Text style={styles.success}>
                    Please enter the code we've sent on given email address.
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="RESET CODE"
                    placeholderTextColor="#bbb"
                    value={resetCode}
                    onChangeText={setResetCode}
                    keyboardType="numeric"
                />

                {isValid.code && <Text style={styles.warning}>
                    Invalid code.
                </Text>}

                <TextInput
                    style={styles.input}
                    placeholder="NEW PASSWORD"
                    placeholderTextColor="#bbb"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={true}
                />

                {isValid.password && <Text style={styles.warning}>
                    Invalid password. Password must contain only letters, numbers, or underscores. Length must be between 8 and 32 characters.
                </Text>}

                <TextInput
                    style={styles.input}
                    placeholder="CONFIRM PASSWORD"
                    placeholderTextColor="#bbb"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={true}
                />

                {isValid.confirmPassword && <Text style={styles.warning}>
                    Passwords do not match.
                </Text>}

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleResetPassword}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>
                        {isLoading ? 'Resetting...' : 'RESET PASSWORD'}
                    </Text>
                </TouchableOpacity>

                {serverCode === '0' && <Text style={styles.success}>
                    Password reset successfully.
                </Text>}

                {(serverCode !== '-1' && serverCode !== '0') && <Text style={styles.warning}>
                    {serverCode === '1' ? 'Invalid code.' : (serverCode === '2' ? 'Invalid email.' : (serverCode === '3' ? 'Invalid or expired code.' : 'Unknown error.'))}
                </Text>}

                <Link href="login" style={styles.linkText}>
                    <Text style={styles.linkText}>Back to Login</Text>
                </Link>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: '#444'
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 40,
        color: '#fff'
    },
    profileImage: {
        width: 200,
        height: 200,
        borderRadius: 50,
        marginBottom: 10
    },
    input: {
        width: '80%',
        height: 50,
        backgroundColor: '#444',
        color: '#ccc',
        borderColor: '#ccc',
        borderWidth: 2,
        borderRadius: 2,
        paddingHorizontal: 15,
        marginBottom: 5,
        fontSize: 16
    },
    success: {
        width: '80%',
        color: '#000',
        marginBottom: 10,
        fontSize: 16,
        fontWeight: 'bold'
    },
    warning: {
        width: '80%',
        color: '#f00',
        marginBottom: 10,
        fontSize: 16,
        fontWeight: 'bold'
    },
    button: {
        width: '80%',
        height: 50,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
        marginBottom: 5
    },
    buttonText: {
        color: '#00f',
        fontSize: 18,
        fontWeight: 'bold'
    },
    linkText: {
        color: '#00f',
        fontSize: 14,
        fontWeight: 'bold',
        marginVertical: 10
    }
});

export default ResetPasswordScreen;