import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';

const SettingsScreen = () => {
  const [validating, setValidating] = useState(true);
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [profileImage, setProfileImage]: any = useState('');
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
      if (code.code === '1') {
        router.push('/login');
      }
    });
  }

  useEffect(() => {
    if (validating) {
      verifyToken();
    }
  }, []);

  const fetchData = async () => {
    let tokenString = await AsyncStorage.getItem('token');
    setToken(tokenString ? tokenString : '');
    const dataResponse = await fetch('https://' + server + '/data?token=' + tokenString);
    const data = await dataResponse.json();
    const username = await data.message.username;
    const profile_picture_url = await data.message.profile_picture_url;
    setUsername(username);
    const imageResponse = await fetch('https://' + server + '/' + profile_picture_url);
    setImageUrl(imageResponse.url);
    const description = await data.message.description;
    setDescription(description);
  }

  useEffect(() => {
    if (!username) {
      fetchData();
    }
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({mediaTypes: 'images', allowsEditing: true, quality: 0.8, base64: true});

      if (result.assets) {
        setProfileImage(result.assets[0]);
      }
    } catch (error) {
      alert('Invalid image!');
    }
  };

  const uploadImage = async () => {
    setIsLoading(true);

    try {
      if (!profileImage.base64) {
        setServerCode('1');
      }
  
      let fileExt = 'jpg';

      if (profileImage.uri) {
        fileExt = profileImage.uri.split('/')[1].split(';')[0].toLowerCase();
      }

      const validTypes = ['jpg', 'jpeg', 'png'];

      if (!validTypes.includes(fileExt)) {
        setServerCode('1');
      }
  
      const response = await fetch('https://' + server + '/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          image: profileImage.base64,
          filename: `image_${Date.now()}.${fileExt}`,
          description
        })
      });
  
      const message = await response.json();
  
      if (response.ok) {
        setServerCode(message.message);
      } else {
        setServerCode(message.error);
      }
    } catch (error) {
      setServerCode('3');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Link href="/profile">
          <View>
            <Ionicons name="arrow-back" size={24} color="#ccc" />
          </View>
        </Link>

        <Text style={styles.headerText}>Settings</Text>

        <Link href="/dashboard">
          <View>
            <Ionicons name="menu" size={24} color="#ccc" />
          </View>
        </Link>
      </View>

      <View style={styles.profileSection}>
        <TouchableOpacity onPress={pickImage}>
          <Image source={profileImage ? profileImage : { uri: imageUrl }} style={styles.profileImage} />
          <Ionicons name="camera" size={24} color="#ccc" style={styles.cameraIcon} />
        </TouchableOpacity>

        <Text style={styles.userName}>{username}</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Description</Text>

        <TextInput
          style={styles.input}
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />
      </View>

      {(serverCode !== '0') && <Text style={styles.warning}>
          {serverCode === '1' ? 'Invalid image.' : (serverCode === '2' ? 'Unable to save image.' : 'Unknown error.')}
      </Text>}

      <TouchableOpacity onPress={uploadImage} style={styles.saveButton} disabled={isLoading}>
        <Text style={styles.saveButtonText}>{isLoading ? 'Saving...' : 'SAVE'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#444'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  headerText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold'
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#0008',
    borderRadius: 12,
    padding: 4
  },
  userName: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold'
  },
  inputContainer: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#888',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 16
  },
  warning: {
    width: '80%',
    color: '#f00',
    marginBottom: 10,
    fontSize: 16,
    fontWeight: 'bold'
  },
  saveButton: {
    backgroundColor: '#00f',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center'
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default SettingsScreen;