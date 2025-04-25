import { View, Text, StyleSheet, useWindowDimensions, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useMemo } from 'react';
import Svg, { Rect } from 'react-native-svg';

// Types for the chess pieces
type PieceKey = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K' | 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
type BoardState = (PieceKey | '')[][];

// Server ip
const server = 'chessmate-production.up.railway.app';

// Local PNG images for chess pieces
const pieces: Record<PieceKey, any> = {
  'P': 'https://' + server + '/uploads/wp.png',
  'N': 'https://' + server + '/uploads/wn.png',
  'B': 'https://' + server + '/uploads/wb.png',
  'R': 'https://' + server + '/uploads/wr.png',
  'Q': 'https://' + server + '/uploads/wq.png',
  'K': 'https://' + server + '/uploads/wk.png',
  'p': 'https://' + server + '/uploads/bp.png',
  'n': 'https://' + server + '/uploads/bn.png',
  'b': 'https://' + server + '/uploads/bb.png',
  'r': 'https://' + server + '/uploads/br.png',
  'q': 'https://' + server + '/uploads/bq.png',
  'k': 'https://' + server + '/uploads/bk.png'
};

// Piece types
const whiteKeys: Array<string> = ['P', 'N', 'B', 'R', 'Q', 'K'];
const blackKeys: Array<string> = ['p', 'n', 'b', 'r', 'q', 'k'];

// Initial board setup
const initialBoard: BoardState = [
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
  onSquarePress: (row: number, col: number) => void;
  selectedPiece: { row: number; col: number; piece: PieceKey } | null;
  fliped: boolean;
  epFlags: {start: { row: number; col: number } | null; target: { row: number; col: number } | null};
  castleFlags: { whiteKingside: boolean; blackKingside: boolean; whiteQueenside: boolean; blackQueenside: boolean };
}

// Check if a square is under attack
const isSquareUnderAttack = (row: number, col: number, boardState: BoardState, isWhite: boolean,
  epFlags: {start: { row: number; col: number } | null; target: { row: number; col: number } | null},
  castleFlags: { whiteKingside: boolean; blackKingside: boolean; whiteQueenside: boolean; blackQueenside: boolean }
): boolean => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = boardState[r][c];

      if (piece && (isWhite ? blackKeys.includes(piece) : whiteKeys.includes(piece))) {
        const moves = getLegalMoves(r, c, piece, boardState, true, false, epFlags, castleFlags);

        if (moves.some(move => move.row === row && move.col === col)) {
          return true;
        }
      }
    }
  }

  return false;
};

// Simulate making a move
const simulateMove = (boardState: BoardState, from: { row: number; col: number },  to: { row: number; col: number }): BoardState => {
  const newBoard = boardState.map((row) => [...row]);
  const piece = newBoard[from.row][from.col];
  newBoard[from.row][from.col] = '';
  newBoard[to.row][to.col] = piece;

  return newBoard;
};

// Check if king is in check
const isInCheck = (boardState: BoardState, isWhite: boolean,
  epFlags: {start: { row: number; col: number } | null; target: { row: number; col: number } | null},
  castleFlags: { whiteKingside: boolean; blackKingside: boolean; whiteQueenside: boolean; blackQueenside: boolean }
): boolean => {
  const king = isWhite ? 'K' : 'k';
  let kingRow = -1;
  let kingCol = -1;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (boardState[row][col] === king) {
        kingRow = row;
        kingCol = col;

        break;
      }
    }

    if (kingRow !== -1) break;
  }

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = boardState[row][col];

      if (piece && (isWhite ? blackKeys.includes(piece) : whiteKeys.includes(piece))) {
        const moves = getLegalMoves(row, col, piece, boardState, true, false, epFlags, castleFlags);

        if (moves.some((move) => move.row === kingRow && move.col === kingCol)) {
          return true;
        }
      }
    }
  }

  return false;
};

// Function to get legal moves for a piece
const getLegalMoves = (row: number, col: number, piece: PieceKey, boardState: BoardState, capture: boolean, check: boolean,
  epFlags: {start: { row: number; col: number } | null; target: { row: number; col: number } | null},
  castleFlags: { whiteKingside: boolean; blackKingside: boolean; whiteQueenside: boolean; blackQueenside: boolean }): { row: number; col: number}[] => {
  const moves: { row: number; col: number}[] = [];
  const isWhite = piece === piece.toUpperCase();

  // Helper function to check if a square is within the board
  const isWithinBoard = (r: number, c: number) => r > -1 && r < 8 && c > -1 && c < 8;

  // Helper function to check if a square is empty or contains an opponent's piece
  const canMoveTo = (r: number, c: number) => {
    const targetPiece = boardState[r][c];

    return !targetPiece || (isWhite ? targetPiece === targetPiece.toLowerCase() : targetPiece === targetPiece.toUpperCase());
  };

  // Helper function to add a move if it's valid
  const addMove = (r: number, c: number) => {
    if (isWithinBoard(r, c)) {
      moves.push({ row: r, col: c});
    }
  };

  // Movement logic for each piece
  switch (piece.toUpperCase()) {
    case 'P':
      // Pawn moves
      const direction = isWhite ? -1 : 1;
      const startRow = isWhite ? 6 : 1;

      // Move forward one square
      if (!capture && isWithinBoard(row + direction, col) && !boardState[row + direction][col]) {
        addMove(row + direction, col);

        // Move forward two squares
        if (row === startRow && !boardState[row + 2 * direction][col]) {
          addMove(row + 2 * direction, col);
        }
      }

      // Capture diagonally
      if (isWithinBoard(row + direction, col - 1) && boardState[row + direction][col - 1] && canMoveTo(row + direction, col - 1)) {
        addMove(row + direction, col - 1);
      }

      // Capture diagonally
      if (isWithinBoard(row + direction, col + 1) && boardState[row + direction][col + 1] && canMoveTo(row + direction, col + 1)) {
        addMove(row + direction, col + 1);
      }

      // En passant capture
      if (!capture && epFlags.start && epFlags.target) {
        const { from, to }: any = { from: epFlags.start, to: epFlags.target };
        const lastMovedPiece = boardState[to.row][to.col];

        // Check if the move corresponds to EnPassant
        if (lastMovedPiece.toLowerCase() === 'p' && Math.abs(from.row - to.row) === 2 && to.row === row && (to.col === col - 1 || to.col === col + 1)) {
          addMove(row + direction, to.col);
        }
      }

      break;
    case 'N':
      // Knight moves
      const knightMoves = [
        { row: row - 2, col: col - 1 },
        { row: row - 2, col: col + 1 },
        { row: row - 1, col: col - 2 },
        { row: row - 1, col: col + 2 },
        { row: row + 1, col: col - 2 },
        { row: row + 1, col: col + 2 },
        { row: row + 2, col: col - 1 },
        { row: row + 2, col: col + 1 },
      ];

      knightMoves.forEach((move) => {
        if (isWithinBoard(move.row, move.col) && canMoveTo(move.row, move.col)) {
          addMove(move.row, move.col);
        }
      });

      break;
    case 'B':
      // Diagonal moves
      for (let i = 1; i < 8; i++) {
        if (!isWithinBoard(row + i, col + i)) break;

        if (boardState[row + i][col + i]) {
          if (canMoveTo(row + i, col + i)) addMove(row + i, col + i);

          break;
        }

        addMove(row + i, col + i);
      }

      for (let i = 1; i < 8; i++) {
        if (!isWithinBoard(row + i, col - i)) break;

        if (boardState[row + i][col - i]) {
          if (canMoveTo(row + i, col - i)) addMove(row + i, col - i);

          break;
        }

        addMove(row + i, col - i);
      }

      for (let i = 1; i < 8; i++) {
        if (!isWithinBoard(row - i, col + i)) break;

        if (boardState[row - i][col + i]) {
          if (canMoveTo(row - i, col + i)) addMove(row - i, col + i);

          break;
        }

        addMove(row - i, col + i);
      }

      for (let i = 1; i < 8; i++) {
        if (!isWithinBoard(row - i, col - i)) break;

        if (boardState[row - i][col - i]) {
          if (canMoveTo(row - i, col - i)) addMove(row - i, col - i);

          break;
        }

        addMove(row - i, col - i);
      }

      break;
    case 'R': // Rook
      // Orthogonal moves
      for (let i = 1; i < 8; i++) {
        if (!isWithinBoard(row + i, col)) break;

        if (boardState[row + i][col]) {
          if (canMoveTo(row + i, col)) addMove(row + i, col);

          break;
        }

        addMove(row + i, col);
      }
      for (let i = 1; i < 8; i++) {
        if (!isWithinBoard(row - i, col)) break;

        if (boardState[row - i][col]) {
          if (canMoveTo(row - i, col)) addMove(row - i, col);

          break;
        }

        addMove(row - i, col);
      }
      for (let i = 1; i < 8; i++) {
        if (!isWithinBoard(row, col + i)) break;

        if (boardState[row][col + i]) {
          if (canMoveTo(row, col + i)) addMove(row, col + i);

          break;
        }

        addMove(row, col + i);
      }
      for (let i = 1; i < 8; i++) {
        if (!isWithinBoard(row, col - i)) break;

        if (boardState[row][col - i]) {
          if (canMoveTo(row, col - i)) addMove(row, col - i);

          break;
        }

        addMove(row, col - i);
      }

      break;
    case 'Q':
      // Combine orthogonal and diagonal moves
      getLegalMoves(row, col, isWhite ? 'R' : 'r', boardState, false, check, epFlags, castleFlags).forEach((move) => addMove(move.row, move.col));
      getLegalMoves(row, col, isWhite ? 'B' : 'b', boardState, false, check, epFlags, castleFlags).forEach((move) => addMove(move.row, move.col));

      break;
    case 'K':
      // King moves
      const kingMoves = [
        { row: row - 1, col: col - 1 },
        { row: row - 1, col: col },
        { row: row - 1, col: col + 1 },
        { row: row, col: col - 1 },
        { row: row, col: col + 1 },
        { row: row + 1, col: col - 1 },
        { row: row + 1, col: col },
        { row: row + 1, col: col + 1 },
      ];
    
      kingMoves.forEach((move) => {
        if (isWithinBoard(move.row, move.col) && canMoveTo(move.row, move.col)) {
          addMove(move.row, move.col);
        }
      });

      if (!capture) {
        // Kingside castling
        if ((isWhite && !castleFlags.whiteKingside || !isWhite && !castleFlags.blackKingside) &&
          !boardState[row][col + 1] && !boardState[row][col + 2] &&
          !isSquareUnderAttack(row, col, boardState, isWhite, epFlags, castleFlags) &&
          !isSquareUnderAttack(row, col + 1, boardState, isWhite, epFlags, castleFlags) &&
          !isSquareUnderAttack(row, col + 2, boardState, isWhite, epFlags, castleFlags)) {
          addMove(row, col + 2);
        }
    
        // Queenside castling
        if ((isWhite && !castleFlags.whiteQueenside || !isWhite && !castleFlags.blackQueenside) &&
          !boardState[row][col - 1] && !boardState[row][col - 2] && !boardState[row][col - 3] &&
          !isSquareUnderAttack(row, col, boardState, isWhite, epFlags, castleFlags) &&
          !isSquareUnderAttack(row, col - 1, boardState, isWhite, epFlags, castleFlags) &&
          !isSquareUnderAttack(row, col - 2, boardState, isWhite, epFlags, castleFlags)) {
          addMove(row, col - 2);
        }
      }

      break;
    default:
      break;
  }

  // Filter out illegal moves
  if (check) {
    const legalMoves = moves.filter((move) => {
      const newBoard = simulateMove(boardState, { row, col }, move);

      return !isInCheck(newBoard, isWhite, epFlags, castleFlags);
    });

    return legalMoves;
  }

  return moves;
};

const ChessBoard: React.FC<ChessBoardInterface> = React.memo(({ boardSize, boardState, onSquarePress, selectedPiece, fliped, epFlags, castleFlags }) => {
  // Size of square
  const squareSize = boardSize / 8;

  // Rotate board
  const rotateCoordinates = (row: number, col: number) => {
    return fliped ? { row: 7 - row, col: 7 - col } : { row, col };
  };

  // Square rendering
  const renderSquares = () => {
    const squares = [];

    const legalMoves = useMemo(() => {
      if (!selectedPiece) return [];
      return getLegalMoves(selectedPiece.row, selectedPiece.col, selectedPiece.piece, boardState, false, true, epFlags, castleFlags);
    }, [selectedPiece, boardState, epFlags, castleFlags]);

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const { row: displayRow, col: displayCol } = rotateCoordinates(row, col);
        const x = displayCol * squareSize;
        const y = displayRow * squareSize;
        const color = (row + col) % 2 === 0 ? '#c3c2c2' : '#504d55';
        const startColor = (row + col) % 2 === 0 ? '#fc8' : '#fc4';
        const targetColor = (row + col) % 2 === 0 ? '#c00' : '#800';
        const isLegalMove = legalMoves.some(move => move.row === row && move.col === col);

        squares.push(
          <Rect
            key={`square-${row}-${col}`}
            x={x}
            y={y}
            width={squareSize}
            height={squareSize}
            fill={isLegalMove ? targetColor : ((epFlags.start && epFlags.start.row === row && epFlags.start.col === col ||
              epFlags.target && epFlags.target.row === row && epFlags.target.col === col ||
              selectedPiece && selectedPiece.row === row && selectedPiece.col === col) ? startColor : color)}
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
              source={{ uri: pieces[piece] }}
              style={{ position: 'absolute', left: x, top: y, width: squareSize, height: squareSize}}
            />
          );
        }
      }
    }

    return pieceComponents;
  };

  // Touchable overlay rendering
  const renderTouchableOverlay = () => {
    const touchables = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const { row: displayRow, col: displayCol } = rotateCoordinates(row, col);
        const x = displayCol * squareSize;
        const y = displayRow * squareSize;

        touchables.push(
          <TouchableOpacity
            key={`touchable-${row}-${col}`}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: squareSize,
              height: squareSize,
            }}
            onPress={() => onSquarePress(row, col)}
          />
        );
      }
    }

    return touchables;
  };

  return (
    <View style={{ width: boardSize, height: boardSize }}>
      <Svg width={boardSize} height={boardSize}>
        {renderSquares()}
      </Svg>

      {renderPieces()}

      {renderTouchableOverlay()}
    </View>
  );
});

const PromotionMenu: React.FC<{
  isWhite: boolean;
  onSelect: (piece: PieceKey) => void;
  boardSize: number;
}> = ({ isWhite, onSelect, boardSize }) => {
  // Promotion options
  const promotionPieces: PieceKey[] = isWhite ? ['Q', 'R', 'B', 'N'] : ['q', 'r', 'b', 'n'];
  const squareSize = boardSize / 8;

  return (
    <View
      style={[
        styles.promotionMenu, {
          width: boardSize,
          height: squareSize * 1.5,
          transform: [
            { translateX: -boardSize / 2 },
            { translateY: -squareSize * 0.75 }
          ]
        }
      ]}
    >
      {promotionPieces.map((piece) => (
        <TouchableOpacity
          key={piece}
          style={styles.promotionOption}
          onPress={() => onSelect(piece)}
        >
          <Image
            source={{ uri: pieces[piece] }}
            style={{ width: squareSize, height: squareSize }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const GameScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const gameId = params.gameId;
  const playerColor = params.color;
  const playerName = params.name;
  const playerImage = params.image;
  const playerRating = params.rating;
  const [validating, setValidating] = useState(true);
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
  const [boardState, setBoardState] = useState<BoardState>(initialBoard);
  const [selectedPiece, setSelectedPiece] = useState<{ row: number; col: number; piece: PieceKey } | null>(null);
  const [promotionSquare, setPromotionSquare] = useState<{ row: number; col: number } | null>(null);
  const [capturedWhite, setCapturedWhite] = useState<PieceKey[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<PieceKey[]>([]);
  const [isWhiteTurn, setIsWhiteTurn] = useState(true);
  const [epFlags, setEpFlags] = useState<{start: { row: number; col: number } | null; target: { row: number; col: number } | null}>(
    {start: null, target: null});
  const [castleFlags, setCastleFlags] = useState<{ whiteKingside: boolean; blackKingside: boolean; whiteQueenside: boolean; blackQueenside: boolean }>(
    {whiteKingside: false, blackKingside: false, whiteQueenside: false, blackQueenside: false});
  const [color, setColor] = useState<'white' | 'black' | null>(null);
  const [fliped, setFlip] = useState<boolean>(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [whiteTimer, setWhiteTimer] = useState(0);
  const [blackTimer, setBlackTimer] = useState(0);
  const [result, setResult] = useState('ongoing');
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(false);
  const router = useRouter();
  
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

  const setImage = async (url: string, white: boolean) => {
    const imageResponse = await fetch(url)
    white ? setWhiteImageUrl(imageResponse.url) : setBlackImageUrl(imageResponse.url);
  }

  useEffect(() => {
    // Connect to the WebSocket server
    const websocket = new WebSocket('wss://' + server + '/game?gameId=' + gameId + '&color=' + playerColor + '&name=' + playerName + '&image=' + playerImage + '&rating=' + playerRating);

    websocket.onopen = () => {
      console.log('WebSocket connected');
    };

    websocket.onmessage = (message) => {
      const data = JSON.parse(message.data);

      if (data.type === 'assignColor') {
        // Update player color
        setColor(data.color);
        setFlip(data.color === 'black');
      } else if (data.type === 'setWhiteUser') {
        // Update white player data
        setWhiteUsername(data.whiteName);
        setImage(data.whiteImage, true);
        setWhiteRating(data.whiteRating);
      } else if (data.type === 'setBlackUser') {
        // Update black player data
        setBlackUsername(data.blackName);
        setImage(data.blackImage, false);
        setBlackRating(data.blackRating);
      } else if (data.type === 'gameState') {
        // Update the game state
        setBoardState(data.gameState.board);
        setIsWhiteTurn(data.gameState.currentTurn === 'white');
        setCapturedWhite(data.gameState.capturedWhite);
        setCapturedBlack(data.gameState.capturedBlack);
        setEpFlags({start: data.gameState.lastMoveStart, target: data.gameState.lastMoveTarget});
        setCastleFlags({whiteKingside: data.gameState.whiteKingside, blackKingside: data.gameState.blackKingside,
          whiteQueenside: data.gameState.whiteQueenside, blackQueenside: data.gameState.blackQueenside});
        setWhiteTimer(data.gameState.whiteTimer);
        setBlackTimer(data.gameState.blackTimer);
        
        if (data.gameState.winner) {
          setPromotionSquare(null);
          setSelectedPiece(null);
          setResult(data.gameState.winner);
        }
      } else if (data.type === 'chat') {
        setChatMessages((prevMessages) => [...prevMessages, data.message]);
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(websocket);

    // Cleanup on unmount
    return () => {
      websocket.close();
    };
  }, []);

  const handleMove = (from: { row: number; col: number }, to: { row: number; col: number }, promotion: PieceKey | null) => {
    if (ws) {
      // Send the move to the server
      ws.send(JSON.stringify({ type: 'move', from, to, promotion }));
    }
  };

  const handleSquarePress = (row: number, col: number) => {
    if (whiteUsername === '????' || blackUsername === '????') {
      return;
    }

    if (result !== 'ongoing' || promotionSquare || isChatVisible) {
      setPromotionSquare(null);
      setSelectedPiece(null);

      return;
    }

    const piece = boardState[row][col];

    if (selectedPiece) {
      const from = { row: selectedPiece.row, col: selectedPiece.col };
      const to = { row, col };

      if (selectedPiece.row === row && selectedPiece.col === col) {
        setSelectedPiece(null);
      } else if (piece && ((color === 'white' && isWhiteTurn && whiteKeys.includes(piece)) || (color === 'black' && !isWhiteTurn && blackKeys.includes(piece)))) {
        setSelectedPiece({ row, col, piece });
      } else {
        const promotionRow = isWhiteTurn ? 0 : 7;

        if (selectedPiece.piece.toLowerCase() === 'p' && row === promotionRow) {
          setPromotionSquare({ row, col });

          return;
        }

        handleMove(from, to, null);
        setSelectedPiece(null);
      }
    } else if (piece && ((color === 'white' && isWhiteTurn && whiteKeys.includes(piece)) || (color === 'black' && !isWhiteTurn && blackKeys.includes(piece)))) {
      setSelectedPiece({ row, col, piece });
    }
  };

  const handlePromotionSelect = (piece: PieceKey) => {
    if (promotionSquare && selectedPiece) {
      const from = { row: selectedPiece.row, col: selectedPiece.col };
      const to = { row: promotionSquare.row, col: promotionSquare.col };
      handleMove(from, to, piece);
      setPromotionSquare(null);
      setSelectedPiece(null);
    }
  };

  const renderCapturedPieces = (capturedPieces: PieceKey[]) => {
    const pieceHeight = boardSize / 8;
    const pieceWidth = boardSize / 16;

    return (
      <View style={[styles.capturedPiecesContainer, { height: pieceHeight }]}>
        {capturedPieces.map((piece, index) => (
          <Image
            key={`captured-${piece}-${index}`}
            source={{ uri: pieces[piece] }}
            style={[{ width: pieceWidth, height: pieceHeight }]}
          />
        ))}
      </View>
    );
  };

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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleOfferDraw = () => {
    if (result === 'ongoing' && ws) {
      ws.send(JSON.stringify({ type: 'offerDraw' }));
    }
  };

  const handleResign = () => {
    if (result === 'ongoing' && ws) {
      ws.send(JSON.stringify({ type: 'resign' }));
    }
  };

  const toggleChat = () => {
    if (whiteUsername === '????' || blackUsername === '????' || whiteUsername === 'Stockfish' || blackUsername === 'Stockfish') {
      return;
    }

    setPromotionSquare(null);
    setSelectedPiece(null);
    setIsChatVisible(!isChatVisible);
  };
  
  const handleSendMessage = () => {
    if (chatInput.trim() && ws) {
      ws.send(JSON.stringify({ type: 'chat', message: chatInput }));
      setChatInput('');
    }
  };

  return (
    <ScrollView>
      <View style={[styles.container, { minHeight: height }]}>
        <View style={styles.topBar}>
          <View style={styles.backArrow}>
            <Link href="dashboard">
              <View>
                <MaterialIcons name="arrow-back" size={responsiveFontSize(30)} color="#ccc" />
              </View>
            </Link>
          </View>

          <View style={styles.topCenter}>
            <Text style={[styles.timer, { fontSize: responsiveFontSize(32) }]}>{!fliped ? formatTime(blackTimer) : formatTime(whiteTimer)}</Text>
            <Text style={[styles.moveIndicator, { fontSize: responsiveFontSize(20) }]}>{result !== "ongoing" ? " " :
              (isWhiteTurn ? (!fliped ? " " : "White to move") : (!fliped ? "Black to move" : " "))}</Text>
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

        {renderCapturedPieces(capturedBlack)}

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
              onSquarePress={handleSquarePress}
              selectedPiece={selectedPiece}
              fliped={fliped}
              epFlags={epFlags}
              castleFlags={castleFlags}
            />

            {promotionSquare && (
              <PromotionMenu
                isWhite={color === "white"}
                onSelect={handlePromotionSelect}
                boardSize={boardSize}
              />
            )}
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

        {renderCapturedPieces(capturedWhite)}

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
            <Text style={[styles.timer, { fontSize: responsiveFontSize(32) }]}>{!fliped ? formatTime(whiteTimer) : formatTime(blackTimer)}</Text>
            <Text style={[styles.moveIndicator, { fontSize: responsiveFontSize(20) }]}>{result !== "ongoing" ? " " :
              (isWhiteTurn ? (!fliped ? "White to move" : " ") : (!fliped ? " " : "Black to move"))}</Text>
          </View>

          <View style={styles.flipBoard}>
            <TouchableOpacity>
              <MaterialIcons name="flip" size={responsiveFontSize(30)} color="#ccc" onPress={flipBoard} />
            </TouchableOpacity>
          </View>
        </View>

        <View>
          <Text style={styles.gameOverText}>{result === "ongoing" ? (color === "white" ? "You are playing the white pieces" : "You are playing the black pieces") :
            (result === "white" ? "White won" : (result === "black" ? "Black won" : "Draw"))}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleOfferDraw} style={[styles.button, { width: buttonWidth }]}>
            <MaterialIcons name="handshake" size={responsiveFontSize(30)} color="#fff" />
            <Text style={[styles.buttonText, { fontSize: responsiveFontSize(14) }]}>Offer Draw</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleResign} style={[styles.button, { width: buttonWidth }]}>
            <MaterialIcons name="flag" size={responsiveFontSize(30)} color="#fff" />
            <Text style={[styles.buttonText, { fontSize: responsiveFontSize(14) }]}>Resign</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleChat} style={[styles.button, { width: buttonWidth }]}>
            <MaterialIcons name="chat" size={responsiveFontSize(30)} color="#fff" />
            <Text style={[styles.buttonText, { fontSize: responsiveFontSize(14) }]}>Chat</Text>
          </TouchableOpacity>

          {isChatVisible && (
            <View style={styles.chatContainer}>
              <ScrollView>
                {chatMessages.map((msg, index) => (
                  <Text key={index} style={styles.chatMessage}>
                    {msg}
                  </Text>
                ))}
              </ScrollView>
              <View style={styles.chatInputContainer}>
                <TextInput
                  style={styles.chatInput}
                  value={chatInput}
                  onChangeText={setChatInput}
                  placeholder="Type a message..."
                />

                <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                  <MaterialIcons name="send" size={responsiveFontSize(20)} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
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
  timer: {
    fontWeight: 'bold',
    color: '#888'
  },
  moveIndicator: {
    fontWeight: 'bold',
    color: '#ccc'
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
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#888',
    paddingVertical: 10,
    borderRadius: 25
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 5
  },
  capturedPiecesContainer: {
    flexDirection: 'row'
  },
  capturedWhite: {
    flexDirection: 'row-reverse'
  },
  capturedBlack: {
    flexDirection: 'row'
  },
  promotionMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#888',
    borderRadius: 10,
    position: 'absolute',
    top: '50%',
    left: '50%'
  },
  promotionOption: {
    backgroundColor: '#444',
    borderRadius: 10
  },
  chatContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 300,
    height: 200,
    backgroundColor: '#888',
    borderRadius: 10,
    padding: 10
  },
  chatMessage: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5
  },
  chatInputContainer: {
    flexDirection: 'row'
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#444',
    color: '#fff',
    borderRadius: 5,
    padding: 5,
    marginRight: 10
  },
  sendButton: {
    backgroundColor: '#888',
    borderRadius: 5,
    padding: 5
  },
  gameOverText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center'
  }
});

export default GameScreen;