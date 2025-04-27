import { ScrollView, useWindowDimensions, View, Text, StyleSheet, Image } from 'react-native';
import { Link } from 'expo-router';

const NotFoundScreen = () => {
  return (
    <ScrollView>
      <View style={[styles.container, { minHeight: useWindowDimensions().height }]}>
        <Image source={require('../pieces/cm.png')} style={styles.image} resizeMode="contain"/>
        <Text style={styles.title}>Oops! Page Not Found</Text>
        <Text style={styles.subtitle}>The page you're looking for doesn't exist or has been moved.</Text>
        
        <Link href='login' style={styles.button}>
          <Text style={styles.buttonText}>Go to Home</Text>
        </Link>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#444'
  },
  image: {
    width: 250,
    height: 250,
    marginBottom: 25
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#ccc',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20
  },
  button: {
    backgroundColor: '#08f',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 15,
    textAlign: 'center',
    width: '100%'
  },
  buttonText: {
    color: '#fff',
    fontSize: 18
  }
});

export default NotFoundScreen;