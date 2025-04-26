import { ScrollView, useWindowDimensions, StyleSheet, Text, View, TextInput, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';

const RegisterScreen = () => {
    const [validating, setValidating] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isValid, setIsValid] = useState({username: false, email: false, password: false, confirmPassword: false});
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

    const handleRegister = async () => {
        const valid ={username: false, email: false, password: false, confirmPassword: false};
        let invalid = false;
        const usernameRegex = /^[A-Za-z][A-Za-z0-9_]{2,14}$/;

        if (!usernameRegex.test(username)) {
            valid.username = true;
            setServerCode('-1');
            invalid = true;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            valid.email = true;
            setServerCode('-1');
            invalid = true;
        }

        const passwordRegex = /^[A-Za-z0-9_]{8,32}$/;

        if (!passwordRegex.test(password)) {
            valid.password = true;
            setServerCode('-1');
            invalid = true;
        } else if (confirmPassword !== password) {
            valid.confirmPassword = true;
            setServerCode('-1');
            invalid = true;
        }

        setIsValid(valid);

        if (invalid) return;

        setIsLoading(true);

        try {
            const response = await fetch('https://' + server + '/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
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

                <TextInput
                    style={styles.input}
                    placeholder="USERNAME"
                    placeholderTextColor="#bbb"
                    value={username}
                    onChangeText={setUsername}
                />

                {isValid.username && <Text style={styles.warning}>
                    Invalid username. Username must start with a letter and contain only letters, numbers, or underscores. Length must be between 3 and 15 characters.
                </Text>}

                <TextInput
                    style={styles.input}
                    placeholder="EMAIL"
                    placeholderTextColor="#bbb"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                />

                {isValid.email && <Text style={styles.warning}>
                    Invalid email address.
                </Text>}

                <TextInput
                    style={styles.input}
                    placeholder="PASSWORD"
                    placeholderTextColor="#bbb"
                    value={password}
                    onChangeText={setPassword}
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

                <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isLoading}>
                    <Text style={styles.buttonText}>{isLoading ? 'Registering...' : 'REGISTER'}</Text>
                </TouchableOpacity>

                {serverCode === '0' && <Text style={styles.success}>
                    Registration successful! We've sent you a confirmation email to prove your identity.
                </Text>}

                {(serverCode !== '-1' && serverCode !== '0') && <Text style={styles.warning}>
                    {serverCode === '1' ? 'Invalid credentials.' : (serverCode === '2' ? 'Username already taken.' : (serverCode === '3' ? 'Email already taken.' : 'Unknown error.'))}
                </Text>}

                <Link href="login" style={styles.linkText}>
                    <Text style={styles.linkText}>Already have an account? Login.</Text>
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

export default RegisterScreen;