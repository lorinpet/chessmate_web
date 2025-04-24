import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions, Image, Modal, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { Link, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';

const DashboardScreen = () => {
  const [validating, setValidating] = useState(true);
  const [username, setUsername] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [rating, setRating] = useState({bullet: 0, blitz: 0, rapid: 0, classical: 0});
  const [showGameModal, setShowGameModal] = useState(false);
  const [time, setTime] = useState('');
  const [mode, setMode] = useState('');
  const [activeGames, setActiveGames] = useState([]);
  const [gameType, setGameType] = useState('player');
  const [position, setPosition] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
  const [invalid, setInvalid] = useState(false);
  const [playerColor, setPlayerColor] = useState('random');
  const [difficulty, setDifficulty] = useState(5);
  const [positionType, setPositionType] = useState('standard');
  const router = useRouter();
  const server = 'chessmate-production.up.railway.app';
  let token;

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

  const logoff = async () => {
    await AsyncStorage.setItem('token', '');
    router.push('/login');
  }

  const fetchData = async () => {
    token = await AsyncStorage.getItem('token');
    const dataResponse = await fetch('https://' + server + '/data?token=' + token);
    const data = await dataResponse.json();
    const username = await data.message.username;
    const profile_picture_url = await data.message.profile_picture_url;
    setUsername(username);
    const imageResponse = await fetch('https://' + server + '/' + profile_picture_url);
    setImageUrl(imageResponse.url);
    const bullet_rating = await data.message.bullet_rating;
    const blitz_rating = await data.message.blitz_rating;
    const rapid_rating = await data.message.rapid_rating;
    const classical_rating = await data.message.classical_rating;
    setRating({bullet: bullet_rating, blitz: blitz_rating, rapid: rapid_rating, classical: classical_rating});
  }

  const fetchActiveGames = async () => {
    try {
      const response = await fetch('https://' + server + '/games?mode=' + mode);
      const games = await response.json();
      setActiveGames(games);
    } catch (error) {
      console.error('Error fetching active games: ' + error);
    }
  };

  const createNewGame = async () => {
    try {
      const response = await fetch('https://' + server + '/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: (positionType === 'standard' ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR' : position),
          type: gameType, timeControl: time, gameMode: mode, difficulty: difficulty })
      });
      
      if (!response.ok) {
        setInvalid(true);
        return;
      }
      
      const gameId = await response.json();
      router.push(`/game?gameId=${gameId}&color=${playerColor}&name=${username}&image=${imageUrl}&rating=${
        mode === 'bullet' ? rating.bullet : (mode === 'blitz' ? rating.blitz : (mode === 'rapid' ? rating.rapid : rating.classical))}`);
    } catch (error) {
      console.error('Error creating new game: ' + error);
    }
  };

  const joinGame = (gameId: string) => {
    router.push(`/game?gameId=${gameId}&color=${playerColor}&name=${username}&image=${imageUrl}&rating=${
      mode === 'bullet' ? rating.bullet : (mode === 'blitz' ? rating.blitz : (mode === 'rapid' ? rating.rapid : rating.classical))}`);
  };

  useEffect(() => {
    if (!username) {
      fetchData();
    }
  }, []);

  useEffect(() => {
    if (showGameModal) {
      fetchActiveGames();
    }
  }, [showGameModal]);

  const openGameModal = (time: string, mode: string) => {
    setTime(time);
    setMode(mode);
    setShowGameModal(true);
  };

  const getDifficultyLabel = (level: number) => {
    if (level <= 3) return 'Beginner';
    if (level <= 6) return 'Intermediate';
    if (level <= 9) return 'Advanced';
    if (level <= 12) return 'Master';
    if (level <= 15) return 'Grandmaster';
    return 'Impossible';
  };

  const GameModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showGameModal}
      onRequestClose={() => setShowGameModal(false)}
    >
      <ScrollView>
        <View style={[styles.modalContainer, { minHeight: useWindowDimensions().height }]}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Game Options</Text>
            <Text style={styles.sectionHeader}>Game Type</Text>

            <View style={styles.optionRow}>
              <TouchableOpacity 
                style={[styles.optionButton, gameType === 'player' && styles.selectedOption]}
                onPress={() => setGameType('player')}
              >
                <Text style={styles.optionText}>Play vs Player</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.optionButton, gameType === 'ai' && styles.selectedOption]}
                onPress={() => setGameType('ai')}
              >
                <Text style={styles.optionText}>Play vs AI</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeader}>Your Color</Text>

            <View style={styles.optionRow}>
              <TouchableOpacity 
                style={[styles.optionButton, playerColor === 'white' && styles.selectedOption]}
                onPress={() => setPlayerColor('white')}
              >
                <Text style={styles.optionText}>White</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.optionButton, playerColor === 'black' && styles.selectedOption]}
                onPress={() => setPlayerColor('black')}
              >
                <Text style={styles.optionText}>Black</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.optionButton, playerColor === 'random' && styles.selectedOption]}
                onPress={() => setPlayerColor('random')}
              >
                <Text style={styles.optionText}>Random</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeader}>{gameType === 'player' ? 'Active Games' : 'AI Difficulty'}</Text>

            {gameType === 'player' ? (
              <FlatList
                data={activeGames}
                keyExtractor={(item: any) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.gameItem} onPress={() => joinGame(item.id)}>
                    <Text style={styles.gameText}>{item.opponent}</Text>
                    <Text style={styles.gameText}>{item.rating}</Text>
                    <Text style={styles.gameText}>{item.position}</Text>
                    <Text style={styles.gameText}>{item.time}</Text>
                    <Text style={styles.gameText}>{item.color}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No games to join</Text>
                }
              />
            ) : (
              <View>
                <Slider
                  minimumValue={0}
                  maximumValue={20}
                  step={1}
                  value={difficulty}
                  onValueChange={setDifficulty}
                  minimumTrackTintColor='#00f'
                  maximumTrackTintColor='#888'
                />

                <Text style={styles.difficultyText}>
                  Level: {difficulty} ({getDifficultyLabel(difficulty)})
                </Text>
              </View>
            )}

            {positionType === 'custom' && invalid && <Text style={styles.warning}>Your fen string is invalid!</Text>}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={createNewGame}
              >
                <Text style={styles.buttonText}>Create a game</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {setShowGameModal(false); setInvalid(false)}}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );

  const ModeButton = ({ time, label }: any) => (
    <TouchableOpacity 
      style={styles.modeButton}
      onPress={() => openGameModal(time, label)}
    >
      <Text style={styles.modeText}>{time}</Text>
      <Text style={styles.modeLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView>
      <View style={[styles.container, { minHeight: useWindowDimensions().height }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => logoff()}>
            <View style={styles.profileSection}>
              <Text style={styles.menuText}>Logout</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.title}>ChessMate</Text>

          <Link href="/profile">
            <View style={styles.profileSection}>
              <Image source={{ uri: imageUrl }} style={styles.profile} />
              <Text style={styles.menuText}>{username}</Text>
            </View>
          </Link>
        </View>

        <Text style={styles.fenLabel}>Starting Position {'('}fen notation{')'}</Text>

        <View style={styles.optionRow}>
          <TouchableOpacity 
            style={[styles.optionButton, positionType === 'standard' && styles.selectedOption]}
            onPress={() => setPositionType('standard')}
          >
            <Text style={styles.optionText}>Standard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionButton, positionType === 'custom' && styles.selectedOption]}
            onPress={() => setPositionType('custom')}
          >
            <Text style={styles.optionText}>Custom</Text>
          </TouchableOpacity>
        </View>

        {positionType === 'custom' && <View style={styles.optionRow}>
          <TextInput
            style={styles.position}
            value={position}
            onChangeText={setPosition}
          />
        </View>}

        <Text style={styles.sectionTitle}>Select Chess Mode to Play</Text>

        <View style={styles.modeRow}>
          <View style={styles.link}>
            <ModeButton time="1+0" label="Bullet" />
          </View>

          <View style={styles.link}>
            <ModeButton time="2+1" label="Bullet" />
          </View>

          <View style={styles.link}>
            <ModeButton time="3+0" label="Bullet" />
          </View>
        </View>

        <View style={styles.modeRow}>
          <View style={styles.link}>
            <ModeButton time="3+2" label="Blitz" />
          </View>

          <View style={styles.link}>
            <ModeButton time="5+0" label="Blitz" />
          </View>
          
          <View style={styles.link}>
            <ModeButton time="5+3" label="Blitz" />
          </View>
        </View>

        <View style={styles.modeRow}>
          <View style={styles.link}>
            <ModeButton time="10+0" label="Rapid" />
          </View>

          <View style={styles.link}>
            <ModeButton time="10+5" label="Rapid" />
          </View>
          
          <View style={styles.link}>
            <ModeButton time="15+0" label="Rapid" />
          </View>
        </View>

        <View style={styles.modeRow}>
          <View style={styles.link}>
            <ModeButton time="15+10" label="Classical" />
          </View>

          <View style={styles.link}>
            <ModeButton time="30+0" label="Classical" />
          </View>
          
          <View style={styles.link}>
            <ModeButton time="30+20" label="Classical" />
          </View>
        </View>

        <GameModal />
      </View>
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
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 16,
    borderRadius: 4,
    backgroundColor: '#888'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  profileSection: {
    flexShrink: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#000'
  },
  profile: {
    width: 20,
    height: 20,
    borderRadius: 20,
    marginRight: 5
  },
  menuText: {
    color: '#fff',
    fontSize: 16
  },
  sectionTitle: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  link: {
    flex: 1
  },
  modeButton: {
    padding: 16,
    backgroundColor: '#888',
    borderRadius: 4,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modeText: {
    fontSize: 16,
    color: '#fff'
  },
  modeLabel: {
    fontSize: 14,
    color: '#fff'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0008'
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#444',
    borderRadius: 10,
    padding: 20
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center'
  },
  position: {
    width: '100%',
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
  fenLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10
  },
  sectionHeader: {
    fontSize: 16,
    color: '#fff',
    marginTop: 15,
    marginBottom: 10
  },
  optionRow: {
    flexDirection: 'row',
    marginBottom: 10
  },
  optionButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    backgroundColor: '#888',
    alignItems: 'center'
  },
  selectedOption: {
    backgroundColor: '#00f'
  },
  optionText: {
    color: '#fff'
  },
  gameItem: {
    flexDirection: 'row',
    overflow: 'scroll',
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
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20
  },
  createButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#00f',
    borderRadius: 5,
    marginRight: 10,
    alignItems: 'center'
  },
  cancelButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#888',
    borderRadius: 5,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff'
  },
  difficultyText: {
    textAlign: 'center',
    color: '#fff',
    marginTop: 8,
    fontSize: 16
  }
});

export default DashboardScreen;