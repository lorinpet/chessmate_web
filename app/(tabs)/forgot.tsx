import { ScrollView, useWindowDimensions, StyleSheet, Text, View, TextInput, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';

const ForgotPasswordScreen = () => {
    const [validating, setValidating] = useState(true);
    const [email, setEmail] = useState('');
    const [emailIsInvalid, setEmailIsInvalid] = useState(false);
    const [serverCode, setServerCode] = useState('0');
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
                router.push('/dashboard');
            }
        });
    }

    useEffect(() => {
        if (validating) {
            verifyToken();
        }
    }, []);

    const handleResetPassword = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            setEmailIsInvalid(true);
            setServerCode('0');
            return;
        } else {
            setEmailIsInvalid(false);
        }

        setIsLoading(true);

        try {
            const response = await fetch('https://' + server + '/forgot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                router.push({ pathname: '/reset', params: { email } });
            } else {
                const error = await response.json();
                setServerCode(error.error);
            }
        } catch (error) {
            setServerCode('2');
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
                    placeholder="EMAIL"
                    placeholderTextColor="#bbb"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                />

                {emailIsInvalid && <Text style={styles.warning}>
                    Invalid email address.
                </Text>}

                <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={isLoading}>
                    <Text style={styles.buttonText}>
                        {isLoading ? 'Sending...' : 'RESET PASSWORD'}
                    </Text>
                </TouchableOpacity>

                {(serverCode !== '0') && <Text style={styles.warning}>
                    {serverCode === '1' ? 'We don\'t have a record of this email on our database.' : 'Unknown error.'}
                </Text>}

                <Link href="/login" style={styles.linkText}>
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

export default ForgotPasswordScreen;