import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

// Game difficulty levels
const DIFFICULTIES = {
  EASY: { size: 4, name: 'Easy (4x4)' },
  MEDIUM: { size: 6, name: 'Medium (6x6)' },
  HARD: { size: 8, name: 'Hard (8x8)' },
  EXPERT: { size: 10, name: 'Expert (10x10)' },
  MASTER: { size: 12, name: 'Master (12x12)' },
};

// High contrast color palette
const COLORS = [
  '#E74C3C',
  '#2ECC71',
  '#3498DB',
  '#F39C12',
  '#9B59B6',
  '#1ABC9C',
  '#E67E22',
  '#F1C40F',
  '#8E44AD',
  '#16A085',
  '#D35400',
  '#27AE60',
  '#f48fb1',
  '#4db6ac',
  '#ffab91',
  '#81c784',
];

// Simpler solvability check using backtracking - more permissive than logical-only solving
const isBacktrackSolvable = (colorGrid: number[][], size: number): boolean => {
  const testGrid = Array(size)
    .fill(null)
    .map(() => Array(size).fill(0));

  const isValidPlacement = (row: number, col: number): boolean => {
    const currentColor = colorGrid[row][col];

    // Check row constraint
    for (let c = 0; c < size; c++) {
      if (c !== col && testGrid[row][c] === 2) return false;
    }

    // Check column constraint
    for (let r = 0; r < size; r++) {
      if (r !== row && testGrid[r][col] === 2) return false;
    }

    // Check color constraint
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (
          (r !== row || c !== col) &&
          colorGrid[r][c] === currentColor &&
          testGrid[r][c] === 2
        ) {
          return false;
        }
      }
    }

    // Check adjacency constraint (no adjacent queens)
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if ((r !== row || c !== col) && testGrid[r][c] === 2) {
          if (Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1) {
            return false;
          }
        }
      }
    }

    return true;
  };

  const solve = (row: number): boolean => {
    if (row === size) return true;

    for (let col = 0; col < size; col++) {
      if (isValidPlacement(row, col)) {
        testGrid[row][col] = 2;
        if (solve(row + 1)) return true;
        testGrid[row][col] = 0;
      }
    }

    return false;
  };

  return solve(0);
};

// Generates a puzzle with interconnected regions, guaranteed to be solvable.
const generateRegionBasedPuzzle = (size: number, initialSeed: number) => {
  let solutionQueens: [number, number][] | null = null;
  let colorGrid: number[][] | null = null;
  let currentSeed = initialSeed;

  const seededRandom = () => {
    const x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
  };

  const findQueenSolution = () => {
    const queens: [number, number][] = [];
    const isSafe = (row: number, col: number) => {
      for (const [qRow, qCol] of queens) {
        if (
          qRow === row ||
          qCol === col ||
          Math.abs(qRow - row) === Math.abs(qCol - col)
        )
          return false;
        if (Math.abs(qRow - row) <= 1 && Math.abs(qCol - col) <= 1)
          return false;
      }
      return true;
    };
    const solve = (row: number): boolean => {
      if (row === size) return true;
      const columns = Array.from({ length: size }, (_, i) => i);
      for (let i = columns.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [columns[i], columns[j]] = [columns[j], columns[i]];
      }
      for (const col of columns) {
        if (isSafe(row, col)) {
          queens.push([row, col]);
          if (solve(row + 1)) return true;
          queens.pop();
        }
      }
      return false;
    };
    if (solve(0)) {
      solutionQueens = queens;
      return true;
    }
    return false;
  };

  const growRegionsFromSolution = () => {
    if (!solutionQueens) return false;
    const grid = Array(size)
      .fill(null)
      .map(() => Array(size).fill(-1));
    const cellsPerColor = Math.floor((size * size) / size);
    const extraCells = (size * size) % size;
    const regionSizes = Array(size).fill(cellsPerColor);
    for (let i = 0; i < extraCells; i++) regionSizes[i]++;
    const queues: [number, number][][] = Array(size)
      .fill(null)
      .map(() => []);
    const currentRegionSizes = Array(size).fill(0);
    solutionQueens.forEach(([r, c], color) => {
      grid[r][c] = color;
      queues[color].push([r, c]);
      currentRegionSizes[color]++;
    });
    let activeQueues = true;
    while (activeQueues) {
      activeQueues = false;
      const colorOrder = Array.from({ length: size }, (_, i) => i);
      for (let i = colorOrder.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [colorOrder[i], colorOrder[j]] = [colorOrder[j], colorOrder[i]];
      }

      for (const color of colorOrder) {
        if (
          queues[color].length > 0 &&
          currentRegionSizes[color] < regionSizes[color]
        ) {
          activeQueues = true;
          const [row, col] = queues[color].shift()!;
          const directions = [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ];
          for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(seededRandom() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
          }
          for (const [dr, dc] of directions) {
            const nr = row + dr;
            const nc = col + dc;
            if (
              nr >= 0 &&
              nr < size &&
              nc >= 0 &&
              nc < size &&
              grid[nr][nc] === -1
            ) {
              if (currentRegionSizes[color] < regionSizes[color]) {
                grid[nr][nc] = color;
                queues[color].push([nr, nc]);
                currentRegionSizes[color]++;
              }
            }
          }
        }
      }
    }
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === -1) {
          const neighbors = [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ]
            .map(([dr, dc]) => [r + dr, c + dc])
            .filter(
              ([nr, nc]) =>
                nr >= 0 &&
                nr < size &&
                nc >= 0 &&
                nc < size &&
                grid[nr][nc] !== -1,
            );
          if (neighbors.length > 0)
            grid[r][c] = grid[neighbors[0][0]][neighbors[0][1]];
        }
      }
    }
    colorGrid = grid;
    return true;
  };

  let attempts = 0;
  while (attempts < 100) {
    // Reduced attempts for faster generation
    if (findQueenSolution() && growRegionsFromSolution()) {
      if (isBacktrackSolvable(colorGrid!, size)) {
        console.log(
          `✓ Generated solvable puzzle with seed ${currentSeed} in ${
            attempts + 1
          } attempts.`,
        );
        return { colorGrid: colorGrid!, seed: currentSeed };
      }
    }
    attempts++;
  }

  // --- UPDATED --- Add fallback generation if complex method fails
  console.error(
    `Complex generation failed after ${attempts} attempts. Trying simple method...`,
  );

  // Simple fallback: create diagonal-based regions that are guaranteed to be solvable
  const createSimpleFallback = (gridSize: number): number[][] => {
    const grid = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(0));

    // Create diagonal stripe regions
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        grid[r][c] = (r + c) % gridSize;
      }
    }

    return grid;
  };

  const fallbackColorGrid = createSimpleFallback(size);

  // Verify the fallback is solvable (it should be)
  if (isBacktrackSolvable(fallbackColorGrid, size)) {
    console.log(`✓ Using simple fallback pattern for size ${size}`);
    return { colorGrid: fallbackColorGrid, seed: -1 };
  }

  return { colorGrid: null, seed: -1 };
};

const App = () => {
  const [difficulty, setDifficulty] = useState(DIFFICULTIES.EASY);
  const [grid, setGrid] = useState<number[][]>([]);
  const [colorGrid, setColorGrid] = useState<number[][]>([]);
  const [gameState, setGameState] = useState('menu');
  const [moves, setMoves] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSolved, setIsSolved] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [lastPressTime, setLastPressTime] = useState(0);
  const [lastPressedDifficulty, setLastPressedDifficulty] = useState<any>(null);
  const [seed, setSeed] = useState(0);
  const [loading, setLoading] = useState(false);

  const initializeGame = (diff: any, newSeed?: number) => {
    setLoading(true);
    setTimeout(() => {
      const initialSeed = newSeed !== undefined ? newSeed : Date.now();
      let puzzleData: { colorGrid: number[][] | null; seed: number } = {
        colorGrid: null,
        seed: -1,
      };
      let generationAttempts = 0;

      // --- UPDATED --- Try a few times to generate a puzzle before giving up
      while (puzzleData.colorGrid === null && generationAttempts < 3) {
        puzzleData = generateRegionBasedPuzzle(
          diff.size,
          initialSeed + generationAttempts * 1000,
        );
        generationAttempts++;
      }

      if (puzzleData.colorGrid === null) {
        setLoading(false);
        Alert.alert(
          'Generation Failed',
          'Could not create a valid puzzle. Please try changing the difficulty or starting again.',
          [{ text: 'OK', onPress: () => setGameState('menu') }],
        );
        return;
      }

      const { colorGrid: newColorGrid, seed: gameSeed } = puzzleData;
      const size = diff.size;
      const newGrid = Array(size)
        .fill(null)
        .map(() => Array(size).fill(0));

      setDifficulty(diff);
      setGrid(newGrid);
      setColorGrid(newColorGrid);
      setSeed(gameSeed);
      setGameState('playing');
      setMoves(0);
      setErrors([]);
      setIsSolved(false);
      setHintsUsed(0);
      setLoading(false);
    }, 50);
  };

  const validateGameState = (currentGrid: number[][]) => {
    const size = difficulty.size;
    const newErrors: string[] = [];
    const queens: [number, number][] = [];
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (currentGrid[i][j] === 2) queens.push([i, j]);
      }
    }

    for (let i = 0; i < queens.length; i++) {
      for (let j = i + 1; j < queens.length; j++) {
        const [r1, c1] = queens[i];
        const [r2, c2] = queens[j];
        if (r1 === r2) newErrors.push(`Row ${r1 + 1} has multiple queens.`);
        if (c1 === c2) newErrors.push(`Column ${c1 + 1} has multiple queens.`);
        if (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1)
          newErrors.push(
            `Queens at (${r1 + 1},${c1 + 1}) and (${r2 + 1},${
              c2 + 1
            }) are adjacent.`,
          );
      }
    }

    const colorCounts: { [key: number]: number } = {};
    queens.forEach(([r, c]) => {
      const color = colorGrid[r][c];
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    });
    for (const color in colorCounts) {
      if (colorCounts[color] > 1)
        newErrors.push(`A color region has ${colorCounts[color]} queens.`);
    }
    setErrors([...new Set(newErrors)]);
    return newErrors.length === 0;
  };

  const generateHint = () => {
    if (gameState !== 'playing') return;
    const size = difficulty.size;
    const newGrid = grid.map(row => [...row]);
    const emptyCells: [number, number][] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (newGrid[r][c] === 0) emptyCells.push([r, c]);
      }
    }
    for (let i = emptyCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [emptyCells[i], emptyCells[j]] = [emptyCells[j], emptyCells[i]];
    }
    for (const [r, c] of emptyCells) {
      let isInvalid = false;
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          if (grid[i][j] === 2) {
            if (
              r === i ||
              c === j ||
              colorGrid[r][c] === colorGrid[i][j] ||
              (Math.abs(r - i) <= 1 && Math.abs(c - j) <= 1)
            ) {
              isInvalid = true;
              break;
            }
          }
        }
        if (isInvalid) break;
      }
      if (isInvalid) {
        newGrid[r][c] = 1;
        setGrid(newGrid);
        setHintsUsed(hintsUsed + 1);
        setMoves(moves + 1);
        return;
      }
    }
    Alert.alert(
      'No Obvious Hints',
      'No empty cells directly conflict with your current queens.',
    );
  };

  const handleCellTap = (row: number, col: number) => {
    if (gameState !== 'playing' || isSolved) return;
    const newGrid = grid.map(gridRow => [...gridRow]);
    newGrid[row][col] = (newGrid[row][col] + 1) % 3;
    setGrid(newGrid);
    setMoves(moves + 1);
    setTimeout(() => {
      const isValid = validateGameState(newGrid);
      if (isValid) checkWinCondition(newGrid);
    }, 0);
  };

  const checkWinCondition = (currentGrid: number[][]) => {
    const size = difficulty.size;
    const queenCount = currentGrid.flat().filter(cell => cell === 2).length;
    if (queenCount === size && validateGameState(currentGrid)) {
      setIsSolved(true);
      setGameState('won');
      const message =
        hintsUsed > 0
          ? `You won in ${moves} moves using ${hintsUsed} hint${
              hintsUsed > 1 ? 's' : ''
            }!`
          : `Perfect! You won in ${moves} moves without hints!`;
      Alert.alert('Congratulations!', message, [
        { text: 'Play Again', onPress: () => initializeGame(difficulty) },
        { text: 'Main Menu', onPress: () => setGameState('menu') },
      ]);
    }
  };

  const resetGame = () => initializeGame(difficulty, seed);

  const handleDifficultyPress = (diff: any) => {
    const currentTime = Date.now();
    const doublePressDelay = 300;
    if (
      lastPressedDifficulty?.size === diff.size &&
      currentTime - lastPressTime < doublePressDelay
    ) {
      initializeGame(diff);
    } else {
      setDifficulty(diff);
      setLastPressTime(currentTime);
      setLastPressedDifficulty(diff);
    }
  };

  const getCellSize = (size: number) => {
    if (size <= 4) return { width: 60, height: 60, fontSize: 30 };
    if (size <= 6) return { width: 50, height: 50, fontSize: 24 };
    if (size <= 8) return { width: 40, height: 40, fontSize: 20 };
    if (size <= 10) return { width: 32, height: 32, fontSize: 18 };
    if (size <= 12) return { width: 28, height: 28, fontSize: 16 };
    return { width: 24, height: 24, fontSize: 14 };
  };

  const renderMenu = () => (
    <ScrollView contentContainerStyle={styles.menuContainer}>
      <Text style={styles.title}>👑 Queens Game</Text>
      <Text style={styles.subtitle}>A Logic Puzzle</Text>
      <View style={styles.difficultyContainer}>
        <Text style={styles.sectionTitle}>Select Difficulty:</Text>
        {Object.values(DIFFICULTIES).map(diff => (
          <TouchableOpacity
            key={diff.name}
            style={[
              styles.difficultyButton,
              difficulty.size === diff.size && styles.selectedDifficulty,
            ]}
            onPress={() => handleDifficultyPress(diff)}
          >
            <Text
              style={[
                styles.difficultyText,
                difficulty.size === diff.size && styles.selectedDifficultyText,
              ]}
            >
              {diff.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => initializeGame(difficulty)}
      >
        <Text style={styles.startButtonText}>Start Game</Text>
      </TouchableOpacity>
      <View style={styles.rulesContainer}>
        <Text style={styles.rulesTitle}>How to Play:</Text>
        <Text style={styles.rulesText}>
          • Tap to cycle: empty → ❌ → 👑{'\n'}• One 👑 per row.{'\n'}• One 👑
          per column.{'\n'}• One 👑 per colored region.{'\n'}• Queens cannot be
          adjacent (not even diagonally).
        </Text>
      </View>
    </ScrollView>
  );

  const renderGame = () => (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setGameState('menu')}
        >
          <Text style={styles.backButtonText}>← Menu</Text>
        </TouchableOpacity>
        <Text style={styles.gameTitle}>{difficulty.name}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.hintButton} onPress={generateHint}>
            <Text style={styles.hintButtonText}>💡 Hint</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.statsContainer}>
        <Text style={styles.movesText}>Moves: {moves}</Text>
        <Text style={styles.hintsText}>Hints: {hintsUsed}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.gridContainer}>
          {grid.map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((cell, j) => {
                const cellSize = getCellSize(difficulty.size);
                const BOLD_BORDER_WIDTH = 2;
                const NORMAL_BORDER_WIDTH = 0.5;
                const BOLD_BORDER_COLOR = '#000';
                const NORMAL_BORDER_COLOR = '#000';
                const cellStyle: any = {
                  width: cellSize.width,
                  height: cellSize.height,
                  backgroundColor: COLORS[colorGrid[i][j] % COLORS.length],
                  borderTopWidth:
                    i === 0
                      ? BOLD_BORDER_WIDTH
                      : colorGrid[i][j] !== colorGrid[i - 1][j]
                      ? BOLD_BORDER_WIDTH
                      : NORMAL_BORDER_WIDTH,
                  borderTopColor:
                    i === 0
                      ? BOLD_BORDER_COLOR
                      : colorGrid[i][j] !== colorGrid[i - 1][j]
                      ? BOLD_BORDER_COLOR
                      : NORMAL_BORDER_COLOR,
                  borderLeftWidth:
                    j === 0
                      ? BOLD_BORDER_WIDTH
                      : colorGrid[i][j] !== colorGrid[i][j - 1]
                      ? BOLD_BORDER_WIDTH
                      : NORMAL_BORDER_WIDTH,
                  borderLeftColor:
                    j === 0
                      ? BOLD_BORDER_COLOR
                      : colorGrid[i][j] !== colorGrid[i][j - 1]
                      ? BOLD_BORDER_COLOR
                      : NORMAL_BORDER_COLOR,
                };
                return (
                  <TouchableOpacity
                    key={`${i}-${j}`}
                    style={[styles.cell, cellStyle]}
                    onPress={() => handleCellTap(i, j)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.cellText, { fontSize: cellSize.fontSize }]}
                    >
                      {cell === 1 ? '❌' : cell === 2 ? '👑' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
        <View style={styles.statusContainer}>
          {errors.length > 0 && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>⚠️ Errors:</Text>
              {errors.map((error, index) => (
                <Text key={index} style={styles.errorText}>
                  • {error}
                </Text>
              ))}
            </View>
          )}
          {isSolved && (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>✅ Solution Complete!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Generating new level...</Text>
        </View>
      ) : gameState === 'menu' ? (
        renderMenu()
      ) : (
        renderGame()
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', justifyContent: 'center' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#2c3e50' },
  menuContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  subtitle: { fontSize: 18, color: '#7f8c8d', marginBottom: 40 },
  difficultyContainer: { width: '100%', maxWidth: 300, marginBottom: 30 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  difficultyButton: {
    backgroundColor: '#ecf0f1',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedDifficulty: { backgroundColor: '#3498db', borderColor: '#2980b9' },
  difficultyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#2c3e50',
    fontWeight: '500',
  },
  selectedDifficultyText: { color: 'white', fontWeight: '600' },
  startButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 30,
    elevation: 3,
  },
  startButtonText: { color: 'white', fontSize: 18, fontWeight: '600' },
  rulesContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    maxWidth: 350,
    elevation: 5,
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  rulesText: { fontSize: 14, color: '#34495e', lineHeight: 22 },
  gameContainer: { flex: 1, padding: 10 },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
  },
  backButton: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: { color: 'white', fontWeight: '500' },
  gameTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  headerButtons: { flexDirection: 'row', gap: 8 },
  hintButton: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hintButtonText: { color: 'white', fontWeight: '500' },
  resetButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resetButtonText: { color: 'white', fontWeight: '500' },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 5,
  },
  movesText: { fontSize: 16, color: '#2c3e50' },
  hintsText: { fontSize: 16, color: '#8e44ad' },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#000',
    elevation: 4,
  },
  row: { flexDirection: 'row' },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statusContainer: { width: '100%', marginTop: 20, paddingHorizontal: 10 },
  errorContainer: {
    backgroundColor: '#fee',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#fcc',
  },
  errorTitle: {
    color: '#c33',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 5,
  },
  errorText: { color: '#c33', fontSize: 12 },
  successContainer: {
    backgroundColor: '#dfd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#cfc',
  },
  successText: {
    color: '#383',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default App;
