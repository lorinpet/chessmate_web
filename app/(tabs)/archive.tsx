import { View, Text, StyleSheet, useWindowDimensions, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import Svg, { Rect } from 'react-native-svg';
import * as Updates from 'expo-updates';

// Types for the chess pieces
const whiteKeys = ['P', 'N', 'B', 'R', 'Q', 'K'];
const blackKeys = ['p', 'n', 'b', 'r', 'q', 'k'];
type PieceKey = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K' | 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
type BoardState = (PieceKey | '')[][];

// Server ip
const server = 'chessmate-production.up.railway.app';

// Local PNG images for chess pieces
const pieces: Record<PieceKey, any> = {
  'P': require('../../pieces/wp.png'),
  'N': require('../../pieces/wn.png'),
  'B': require('../../pieces/wb.png'),
  'R': require('../../pieces/wr.png'),
  'Q': require('../../pieces/wq.png'),
  'K': require('../../pieces/wk.png'),
  'p': require('../../pieces/bp.png'),
  'n': require('../../pieces/bn.png'),
  'b': require('../../pieces/bb.png'),
  'r': require('../../pieces/br.png'),
  'q': require('../../pieces/bq.png'),
  'k': require('../../pieces/bk.png')
};

// Initial board setup
let initialBoard: BoardState = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  ['' , '' , '' , '' , '' , '' , '' , '' ],
  ['' , '' , '' , '' , '' , '' , '' , '' ],
  ['' , '' , '' , '' , '' , '' , '' , '' ],
  ['' , '' , '' , '' , '' , '' , '' , '' ],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

// Interface for chessboard
interface ChessBoardInterface {
  boardSize: number;
  boardState: BoardState;
  fliped: boolean;
}

const ChessBoard: React.FC<ChessBoardInterface> = ({ boardSize, boardState, fliped }) => {
  // Size of square
  const squareSize = boardSize / 8;

  // Rotate board
  const rotateCoordinates = (row: number, col: number) => {
    return fliped ? { row: 7 - row, col: 7 - col } : { row, col };
  };

  // Square rendering
  const renderSquares = () => {
    const squares = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const { row: displayRow, col: displayCol } = rotateCoordinates(row, col);
        const x = displayCol * squareSize;
        const y = displayRow * squareSize;
        const color = (row + col) % 2 === 0 ? '#c3c2c2' : '#504d55';

        squares.push(
          <Rect
            key={`square-${row}-${col}`}
            x={x}
            y={y}
            width={squareSize}
            height={squareSize}
            fill={color}
          />
        );
      }
    }

    return squares;
  };

  // Piece rendering
  const renderPieces = () => {
    const pieceComponents = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = boardState[row][col];

        if (piece) {
          const { row: displayRow, col: displayCol } = rotateCoordinates(row, col);
          const x = displayCol * squareSize;
          const y = displayRow * squareSize;

          pieceComponents.push(
            <Image
              key={`piece-${row}-${col}`}
              source={pieces[piece]}
              style={{ position: 'absolute', left: x, top: y, width: squareSize, height: squareSize}}
            />
          );
        }
      }
    }

    return pieceComponents;
  };

  return (
    <View style={{ width: boardSize, height: boardSize }}>
      <Svg width={boardSize} height={boardSize}>
        {renderSquares()}
      </Svg>

      {renderPieces()}
    </View>
  );
};

const GameScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const archive = params.archive;
  const [validating, setValidating] = useState(true);
  const [archivedGame, setArchivedGame] = useState<{ game: any; whitePlayer: any; blackPlayer: any, moves: any[] } | null>(null);
  const [analysis, setAnalysis] = useState({bestmove: 'Press button to analyse', evaluation: ''});
  const [analysing, setAnalysing] = useState(false);
  const [currMove, setCurrMove] = useState(-1);
  const [whiteUsername, setWhiteUsername] = useState('????');
  const [whiteImageUrl, setWhiteImageUrl] = useState('https://' + server + '/uploads/_.png');
  const [whiteRating, setWhiteRating] = useState('????');
  const [blackUsername, setBlackUsername] = useState('????');
  const [blackImageUrl, setBlackImageUrl] = useState('https://' + server + '/uploads/_.png');
  const [blackRating, setBlackRating] = useState('????');
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const boardSize = isLandscape ? height * 0.9 : width * 0.9;
  const files = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'].reverse();
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [boardState, setBoardState] = useState<BoardState>(initialBoard);
  const [fliped, setFlip] = useState<boolean>(false);

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
        resetApp();
      }
    });
  }

  useEffect(() => {
    if (validating) {
      verifyToken();
    }
  }, []);

  const resetApp = async () => {
    if (Platform.OS === 'web') {
      window.location.href = 'https://lorinpet.github.io/chessmate_web';
    } else {
      await Updates.reloadAsync();
    }
  }

  const fetchData = async () => {
    const gameResponse = await fetch('https://' + server + '/game?gameId=' + archive);
    const game = await gameResponse.json();
    const whitePlayerId = await game.message.white_player;
    const whitePlayerResponse = await fetch('https://' + server + '/player?playerId=' + whitePlayerId);
    const whitePlayer = await whitePlayerResponse.json();
    const blackPlayerId = await game.message.black_player;
    const blackPlayerResponse = await fetch('https://' + server + '/player?playerId=' + blackPlayerId);
    const blackPlayer = await blackPlayerResponse.json();
    const whiteUsername = await whitePlayer.message.username;
    setWhiteUsername(whiteUsername);
    const blackUsername = await blackPlayer.message.username;
    setBlackUsername(blackUsername);
    const whiteProfile = await whitePlayer.message.profile_picture_url;
    const whiteImage = await fetch('https://' + server + '/' + whiteProfile);
    setWhiteImageUrl(whiteImage.url);
    const blackProfile = await blackPlayer.message.profile_picture_url;
    const blackImage = await fetch('https://' + server + '/' + blackProfile);
    setBlackImageUrl(blackImage.url);
    const timeControl = await game.message.time_control;

    if (['60+0', '120+1', '180+0'].includes(timeControl)) {
      const whiteBulletRating = await whitePlayer.message.bullet_rating;
      setWhiteRating(whiteBulletRating);
      const blackBulletRating = await blackPlayer.message.bullet_rating;
      setBlackRating(blackBulletRating);
    } else if (['180+2', '300+0', '300+3'].includes(timeControl)) {
      const whiteBlitzRating = await whitePlayer.message.blitz_rating;
      setWhiteRating(whiteBlitzRating);
      const blackBlitzRating = await blackPlayer.message.blitz_rating;
      setBlackRating(blackBlitzRating);
    } else if (['600+0', '600+5', '900+0'].includes(timeControl)) {
      const whiteRapidRating = await whitePlayer.message.rapid_rating;
      setWhiteRating(whiteRapidRating);
      const blackRapidRating = await blackPlayer.message.rapid_rating;
      setBlackRating(blackRapidRating);
    } else if (['900+10', '1800+0', '1800+20'].includes(timeControl)) {
      const whiteClassicalRating = await whitePlayer.message.classical_rating;
      setWhiteRating(whiteClassicalRating);
      const blackClassicalRating = await blackPlayer.message.classical_rating;
      setBlackRating(blackClassicalRating);
    }

    const fen = await game.message.starting_position;
    setPosition(fen);
  }

  const setPosition = (fen: any) => {
    setFen(fen);
    const position = fen.split(' ')[0];

    const board: BoardState = [
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '']
    ];

    let i = 0;

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(position[i])) {
          x += parseInt(position[i]);
          x--;
        } else if (whiteKeys.includes(position[i]) || blackKeys.includes(position[i])) {
          board[y][x] = position[i];
        }

        i++;

        if (position[i] === '/') {
          i++;
        }
      }
    }

    initialBoard = board;
    setBoardState(board);
  }

  const fetchArchive = async () => {
    const response = await fetch('https://' + server + '/fetch?archive=' + archive);
    response.json().then((item) => setArchivedGame(item.game));
  }

  useEffect(() => {
    if (whiteUsername === '????' && blackUsername === '????') {
      fetchData();
      fetchArchive();
    }
  }, []);

  const flipBoard = () => {
    if (fliped) {
      setFlip(false);
    } else {
      setFlip(true);
    }
  }

  const responsiveFontSize = (size: any) => {
    const scale = Math.min(height / 800, width / 400, 2);

    return Math.max(size * scale, 2);
  };

  const buttonWidth = width * 0.25;

  const handleStart = () => {
    if (currMove !== -1) {
      setAnalysis({bestmove: 'Press button to analyse', evaluation: ''});
    }

    const fen = initialBoard;
    setCurrMove(-1);
    setBoardState(fen);
  };

  const handlePrev = () => {
    if (currMove !== -1) {
      setAnalysis({bestmove: 'Press button to analyse', evaluation: ''});
      const fen = currMove - 1 !== -1 ? JSON.parse(archivedGame?.moves[currMove - 1].fen) : initialBoard;
      setCurrMove(Math.max(currMove - 1, -1));
      setBoardState(fen);
    }
  };

  const handleNext = () => {
    const index = archivedGame?.moves.length ? archivedGame?.moves.length - 1 : -1;

    if (index === -1) {
      return;
    }

    if (currMove !== index) {
      setAnalysis({bestmove: 'Press button to analyse', evaluation: ''});
      const fen = JSON.parse(archivedGame?.moves[currMove + 1].fen);
      setCurrMove(Math.min(currMove + 1, index));
      setBoardState(fen);
    }
  };

  const handleEnd = () => {
    const index = archivedGame?.moves.length ? archivedGame?.moves.length - 1 : -1;

    if (index === -1) {
      return;
    }

    if (currMove !== index) {
      setAnalysis({bestmove: 'Press button to analyse', evaluation: ''});
    }

    const fen = JSON.parse(archivedGame?.moves[index].fen);
    setCurrMove(index);
    setBoardState(fen);
  };

  const handleAnalyse = async () => {
    const uci: string[] = [];
    archivedGame?.moves.forEach((item) => {if (uci.length <= currMove) uci.push(item.uci);});
    setAnalysing(true);
    const analysis = await fetch('https://' + server + '/analyse?fen=' + fen + '&moves=' + uci.join(' '));
    analysis.json().then((item) => setAnalysis(item));
    setAnalysing(false);
  };

  return (
    <ScrollView>
      <View style={[styles.container, { minHeight: height }]}>
        <View style={styles.topBar}>
          <View style={styles.backArrow}>
            <Link href="profile">
              <View>
                <MaterialIcons name="arrow-back" size={responsiveFontSize(30)} color="#ccc" />
              </View>
            </Link>
          </View>

          <View style={styles.topCenter}>
            <Text style={[styles.analysisIndicator, { fontSize: responsiveFontSize(20) }]}>
              {analysis.bestmove.trim() === 'bestmove (none)' ? 'No possible move' : analysis.bestmove.trim()}
            </Text>

            <Text style={[styles.analysisIndicator, { fontSize: responsiveFontSize(20) }]}>
              {analysis.bestmove.trim() === 'bestmove (none)' ? '' : analysis.evaluation.trim()}
            </Text>
          </View>

          <View style={styles.topRight}>
            <Image
              source={{ uri: (!fliped ? blackImageUrl : whiteImageUrl) }}
              style={[styles.profilePicture, { width: responsiveFontSize(50), height: responsiveFontSize(50) }]}
            />

            <Text style={[styles.userInfo, { fontSize: responsiveFontSize(18) }]}>{(!fliped ? blackUsername : whiteUsername)}</Text>
            <Text style={[styles.rating, { fontSize: responsiveFontSize(14) }]}>{(!fliped ? blackRating : whiteRating)}</Text>
          </View>
        </View>

        <View style={[styles.fileLabelsContainer, { width: boardSize }]}>
          {files.map((file, index) => (
            <Text
              key={`file-top-${file}`}
              style={[styles.fileLabel, { fontSize: 12 }]}
            >
              {fliped ? files[files.length - 1 - index] : file}
            </Text>
          ))}
        </View>

        <View style={styles.boardWithLabelsContainer}>
          <View style={styles.rankLabelsContainer}>
            {ranks.map((rank, index) => (
              <Text
                key={`rank-${rank}`}
                style={[styles.rankLabel, { marginVertical: boardSize / 26, fontSize: 12 }]}
              >
                {fliped ? ranks[ranks.length - 1 - index] : rank}
              </Text>
            ))}
          </View>

          <View>
            <ChessBoard
              boardSize={boardSize}
              boardState={boardState}
              fliped={fliped}
            />
          </View>

          <View style={styles.rankLabelsContainer}>
            {ranks.map((rank, index) => (
              <Text
                key={`rank-right-${rank}`}
                style={[styles.rankLabel, { marginVertical: boardSize / 26, fontSize: 12 }]}
              >
                {fliped ? ranks[ranks.length - 1 - index] : rank}
              </Text>
            ))}
          </View>
        </View>

        <View style={[styles.fileLabelsContainer, { width: boardSize }]}>
          {files.map((file, index) => (
            <Text
              key={`file-bottom-${file}`}
              style={[styles.fileLabel, { fontSize: 12 }]}
            >
              {fliped ? files[files.length - 1 - index] : file}
            </Text>
          ))}
        </View>

        <View style={styles.bottomBar}>
          <View style={styles.bottomLeft}>
            <Image
              source={{ uri: (!fliped ? whiteImageUrl : blackImageUrl) }}
              style={[styles.profilePicture, { width: responsiveFontSize(50), height: responsiveFontSize(50) }]}
            />

            <Text style={[styles.userInfo, { fontSize: responsiveFontSize(18) }]}>{(!fliped ? whiteUsername : blackUsername)}</Text>
            <Text style={[styles.rating, { fontSize: responsiveFontSize(14) }]}>{(!fliped ? whiteRating : blackRating)}</Text>
          </View>

          <View style={styles.bottomCenter}>
            <TouchableOpacity onPress={handleAnalyse} style={[styles.analyseButton, { width: buttonWidth }]}>
              <Text style={[styles.analysisIndicator, { fontSize: responsiveFontSize(16) }]}>{analysing ? "ANALYSING" : "ANALYSE"}</Text>
            </TouchableOpacity>

            <Text style={[styles.moveIndicator, { fontSize: responsiveFontSize(16) }]}>{currMove === -1 ? 'Start position' : archivedGame?.moves[currMove].uci}</Text>
          </View>

          <View style={styles.flipBoard}>
            <TouchableOpacity>
              <MaterialIcons name="flip" size={responsiveFontSize(30)} color="#ccc" onPress={flipBoard} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleStart} style={[styles.button, { width: buttonWidth }]}>
              <MaterialIcons name="keyboard-double-arrow-left" size={responsiveFontSize(30)} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePrev} style={[styles.button, { width: buttonWidth }]}>
              <MaterialIcons name="keyboard-arrow-left" size={responsiveFontSize(30)} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNext} style={[styles.button, { width: buttonWidth }]}>
              <MaterialIcons name="keyboard-arrow-right" size={responsiveFontSize(30)} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleEnd} style={[styles.button, { width: buttonWidth }]}>
              <MaterialIcons name="keyboard-double-arrow-right" size={responsiveFontSize(30)} color="#fff" />
            </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#444'
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20
  },
  backArrow: {
    flex: 1,
    alignItems: 'flex-start'
  },
  flipBoard: {
    flex: 1,
    alignItems: 'flex-end'
  },
  topCenter: {
    flex: 2,
    alignItems: 'center'
  },
  topRight: {
    flex: 1,
    alignItems: 'flex-end'
  },
  profilePicture: {
    borderRadius: 25
  },
  analysisIndicator: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ccc',
    marginVertical: 5
  },
  moveIndicator: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ccc',
    marginTop: 10
  },
  userInfo: {
    fontWeight: 'bold',
    color: '#888'
  },
  rating: {
    color: '#ccc'
  },
  boardWithLabelsContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  rankLabelsContainer: {
    justifyContent: 'space-between',
    marginHorizontal: 5
  },
  rankLabel: {
    color: '#ccc'
  },
  fileLabelsContainer: {
    flexDirection: 'row',
    marginVertical: 5
  },
  fileLabel: {
    color: '#ccc',
    textAlign: "center",
    flex: 1
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 10
  },
  bottomLeft: {
    flex: 1,
    alignItems: 'flex-start'
  },
  bottomCenter: {
    flex: 2,
    alignItems: 'center'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20
  },
  button: {
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ccc',
    backgroundColor: '#888',
    paddingVertical: 10,
    borderRadius: 5
  },
  analyseButton: {
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 5
  }
});

export default GameScreen;