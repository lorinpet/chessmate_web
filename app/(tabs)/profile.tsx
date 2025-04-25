import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';

const ProfileScreen = () => {
  const [validating, setValidating] = useState(true);
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState({bullet: 0, blitz: 0, rapid: 0, classical: 0, all: 0});
  const [games, setGames] = useState({
    bulletWins: 0, bulletLosses: 0, bulletDraws: 0, bulletGames: 0,
    blitzWins: 0, blitzLosses: 0, blitzDraws: 0, blitzGames: 0,
    rapidWins: 0, rapidLosses: 0, rapidDraws: 0, rapidGames: 0,
    classicalWins: 0, classicalLosses: 0, classicalDraws: 0, classicalGames: 0,
    allWins: 0, allLosses: 0, allDraws: 0, allGames: 0
  });
  const [archivedGames, setArchivedGames] = useState([]);
  // Dropdown stat states
  const [showStats, setShowStats] = useState(true);
  const [selectedValue, setSelectedValue] = useState(null);
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
        router.push('login');
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
    const bullet_rating = await data.message.bullet_rating;
    const blitz_rating = await data.message.blitz_rating;
    const rapid_rating = await data.message.rapid_rating;
    const classical_rating = await data.message.classical_rating;
    setRating({bullet: bullet_rating, blitz: blitz_rating, rapid: rapid_rating, classical: classical_rating,
      all: Math.round((bullet_rating + blitz_rating + rapid_rating + classical_rating) / 4)});
    const bullet_wins = await data.message.bullet_wins;
    const bullet_losses = await data.message.bullet_losses;
    const bullet_draws = await data.message.bullet_draws;
    const blitz_wins = await data.message.blitz_wins;
    const blitz_losses = await data.message.blitz_losses;
    const blitz_draws = await data.message.blitz_draws;
    const rapid_wins = await data.message.rapid_wins;
    const rapid_losses = await data.message.rapid_losses;
    const rapid_draws = await data.message.rapid_draws;
    const classical_wins = await data.message.classical_wins;
    const classical_losses = await data.message.classical_losses;
    const classical_draws = await data.message.classical_draws;
    setGames({
      bulletWins: bullet_wins, bulletLosses: bullet_losses, bulletDraws: bullet_draws,
      bulletGames: bullet_wins + bullet_losses + bullet_draws,
      blitzWins: blitz_wins, blitzLosses: blitz_losses, blitzDraws: blitz_draws,
      blitzGames: blitz_wins + blitz_losses + blitz_draws,
      rapidWins: rapid_wins, rapidLosses: rapid_losses, rapidDraws: rapid_draws,
      rapidGames: rapid_wins + rapid_losses + rapid_draws,
      classicalWins: classical_wins, classicalLosses: classical_losses, classicalDraws: classical_draws,
      classicalGames: classical_wins + classical_losses + classical_draws,
      allWins: bullet_wins + blitz_wins + rapid_wins + classical_wins,
      allLosses: bullet_losses + blitz_losses + rapid_losses + classical_losses,
      allDraws: bullet_draws + blitz_draws + rapid_draws + classical_draws,
      allGames: bullet_wins + blitz_wins + rapid_wins + classical_wins +
      bullet_losses + blitz_losses + rapid_losses + classical_losses +
      bullet_draws + blitz_draws + rapid_draws + classical_draws
    });
  }

  useEffect(() => {
    if (!username) {
      fetchData();
    }
  }, []);

  const fetchArchives = async () => {
    const response = await fetch('https://' + server + '/archives?token=' + token);

    response.json().then((games) => {
      games.sort((a: any, b: any) => b.completed_at.localeCompare(a.completed_at));
      setArchivedGames(games);
    });
  }

  const spectateGame = (gameId: string) => {
    router.push(`archive?archive=${gameId}`);
  };

  // Dropdown item values
  const dropdownItems = [
    { label: 'Bullet', value: 'bullet' },
    { label: 'Blitz', value: 'blitz' },
    { label: 'Rapid', value: 'rapid' },
    { label: 'Classical', value: 'classical' }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Link href="dashboard">
          <View>
            <Ionicons name="arrow-back" size={24} color="#ccc" />
          </View>
        </Link>

        <Text style={styles.headerText}>Profile</Text>

        <Link href="settings">
          <View>
            <Ionicons name="settings" size={24} color="#ccc" />
          </View>
        </Link>
      </View>

      <View style={styles.profileSection}>
        <Image source={{ uri: imageUrl }} style={styles.profileImage} />
        <Text style={styles.userName}>{username}</Text>
      </View>

      <Text style={styles.userDescription}>{description}</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => {setShowStats(true);}}>
          <Text style={styles.buttonText}>Stats</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => {fetchArchives(); setShowStats(false);}}>
          <Text style={styles.buttonText}>Games</Text>
        </TouchableOpacity>
      </View>

      {showStats ? (
        <View style={styles.statContainer}>
          <View style={styles.dropdownContainer}>
            <RNPickerSelect
              onValueChange={(value) => setSelectedValue(value)}
              items={dropdownItems}
              placeholder={{ label: 'All', value: 'all' }}
            />
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Rating</Text>
            <Text style={styles.statValue}>{
              selectedValue === 'bullet' ? rating.bullet : (
              selectedValue === 'blitz' ? rating.blitz : (
              selectedValue === 'rapid' ? rating.rapid : (
              selectedValue === 'classical' ? rating.classical : (
              rating.all))))
            }</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Games Played</Text>
            <Text style={styles.statValue}>{
              selectedValue === 'bullet' ? games.bulletGames : (
              selectedValue === 'blitz' ? games.blitzGames : (
              selectedValue === 'rapid' ? games.rapidGames : (
              selectedValue === 'classical' ? games.classicalGames : (
              games.allGames))))
            }</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Wins</Text>
            <Text style={styles.statValue}>{
              selectedValue === 'bullet' ? games.bulletWins : (
              selectedValue === 'blitz' ? games.blitzWins : (
              selectedValue === 'rapid' ? games.rapidWins : (
              selectedValue === 'classical' ? games.classicalWins : (
              games.allWins))))
            }</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Losses</Text>
            <Text style={styles.statValue}>{
              selectedValue === 'bullet' ? games.bulletLosses : (
              selectedValue === 'blitz' ? games.blitzLosses : (
              selectedValue === 'rapid' ? games.rapidLosses : (
              selectedValue === 'classical' ? games.classicalLosses : (
              games.allLosses))))
            }</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Draws</Text>
            <Text style={styles.statValue}>{
              selectedValue === 'bullet' ? games.bulletDraws : (
              selectedValue === 'blitz' ? games.blitzDraws : (
              selectedValue === 'rapid' ? games.rapidDraws : (
              selectedValue === 'classical' ? games.classicalDraws : (
              games.allDraws))))
            }</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Win Rate</Text>
            <Text style={styles.statValue}>{
              selectedValue === 'bullet' ? (Number(games.bulletGames) === 0 ? 0 : (Number(games.bulletWins) * 100 / Number(games.bulletGames)).toFixed(2)) : (
              selectedValue === 'blitz' ? (Number(games.blitzGames) === 0 ? 0 : (Number(games.blitzWins) * 100 / Number(games.blitzGames)).toFixed(2)) : (
              selectedValue === 'rapid' ? (Number(games.rapidGames) === 0 ? 0 : (Number(games.rapidWins) * 100 / Number(games.rapidGames)).toFixed(2)) : (
              selectedValue === 'classical' ? (Number(games.classicalGames) === 0 ? 0 : (Number(games.classicalWins) * 100 / Number(games.classicalGames)).toFixed(2)) : (
              Number(games.allGames) === 0 ? 0 : (Number(games.allWins) * 100 / Number(games.allGames)).toFixed(2)))))
            }%</Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={archivedGames}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
              <TouchableOpacity style={styles.gameItem} onPress={() => {spectateGame(item.id)}}>
                <Text style={styles.gameText}>{item.user}</Text>
                <Text style={styles.gameText}>{item.rating}</Text>
                <Text style={styles.gameText}>{item.color}</Text>
                <Text style={styles.gameText}>{item.starting_position === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' ? 'Standard' : 'Custom'}</Text>
                <Text style={styles.gameText}>{item.time_control}</Text>
                <Text style={styles.gameText}>{item.result === 'white' ? 'White\u00A0won' : (item.result === 'black' ? 'Black\u00A0won' : 'Draw')}</Text>
                <Text style={styles.gameText}>{item.completed_at.substring(0, 10).replace('-', '\u2011').replace('-', '\u2011')}</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
          ListEmptyComponent={ <Text style={styles.emptyText}>No games in the archive</Text> }
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#444'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  userName: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold'
  },
  userDescription: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#888',
    borderRadius: 5,
    marginBottom: 20
  },
  button: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    borderRadius: 5
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  statContainer: {
    backgroundColor: '#888',
    borderRadius: 8,
    padding: 16
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  statLabel: {
    fontSize: 16
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center'
  },
  gameItem: {
    flexDirection: 'row',
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#ccc',
    borderRadius: 5,
    justifyContent: 'space-between'
  },
  gameText: {
    backgroundColor: '#888',
    fontWeight: 'bold',
    color: '#fff',
    borderRadius: 5,
    padding: 10,
    margin: 5
  },
  emptyText: {
    color: '#ccc',
    textAlign: 'center',
    marginVertical: 20
  }
});

export default ProfileScreen;