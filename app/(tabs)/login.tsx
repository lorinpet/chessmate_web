import { ScrollView, useWindowDimensions, StyleSheet, Text, View, TextInput, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter, usePathname } from 'expo-router';
import { useState, useEffect } from 'react';

const LoginScreen = () => {
    const [validating, setValidating] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isValid, setIsValid] = useState({username: false, password: false});
    const [serverCode, setServerCode] = useState('0');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
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
            } else if (pathname === '/chessmate_web') {
                router.push('login');
            }
        });
    }

    useEffect(() => {
        if (validating) {
            verifyToken();
        }
    }, []);

    const handleLogin = async () => {
        const valid = {username: false, password: false};
        let invalid = false;
        const usernameRegex = /^[A-Za-z][A-Za-z0-9_]{2,14}$/;

        if (!usernameRegex.test(username)) {
            valid.username = true;
            setServerCode('0');
            invalid = true;
        }

        const passwordRegex = /^[A-Za-z0-9_]{8,32}$/;

        if (!passwordRegex.test(password)) {
            valid.password = true;
            setServerCode('0');
            invalid = true;
        }

        setIsValid(valid);

        if (invalid) return;

        setIsLoading(true);

        try {
            const response = await fetch('https://' + server + '/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json();
                await AsyncStorage.setItem('token', data.message);
                router.push('dashboard');
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
                <Image source={{ uri: 'https://' + server + '/uploads/cm.png' }} style={styles.profileImage} />
                
                <TextInput
                    style={styles.input}
                    placeholder="USERNAME"
                    placeholderTextColor="#bbb"
                    value={username}
                    onChangeText={setUsername}
                />

                {isValid.username && <Text style={styles.warning}>
                    Invalid username.
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
                    Invalid password.
                </Text>}

                <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
                    <Text style={styles.buttonText}>{isLoading ? 'Logging in...' : 'LOGIN'}</Text>
                </TouchableOpacity>

                {(serverCode !== '0') && <Text style={styles.warning}>
                    {serverCode === '1' ? 'Account not confirmed by email yet.' : (serverCode === '2' ? 'Wrong password.' : (serverCode === '3' ? 'User doesn\'t exist.' : 'Unknown error.'))}
                </Text>}

                <Link href="forgot" style={styles.linkText}>
                    <Text style={styles.linkText}>Forgot password?</Text>
                </Link>

                <Link href="register" style={styles.linkText}>
                    <Text style={styles.linkText}>Don't have an account yet? Register.</Text>
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
        marginBottom: 10,
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

export default LoginScreen;