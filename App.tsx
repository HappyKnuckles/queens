// App.tsx

import React, { useState } from 'react';
import {
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  View,
  ActivityIndicator,
  Text,
} from 'react-native';

import { DIFFICULTIES, Difficulty } from './src/constants/config';
import { generatePuzzle, PuzzleData } from './src/game/generator';
import Menu from './src/components/Menu';
import Game from './src/components/Game';

type GameState = 'menu' | 'playing' | 'won';

const App = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTIES.EASY);
  const [grid, setGrid] = useState<number[][]>([]);
  const [colorGrid, setColorGrid] = useState<number[][]>([]);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [moves, setMoves] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSolved, setIsSolved] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [lastPressTime, setLastPressTime] = useState(0);
  const [lastPressedDifficulty, setLastPressedDifficulty] =
    useState<Difficulty | null>(null);
  const [seed, setSeed] = useState(0);
  const [loading, setLoading] = useState(false);

  const initializeGame = (diff: Difficulty, newSeed?: number) => {
    setLoading(true);
    setTimeout(() => {
      const initialSeed = newSeed !== undefined ? newSeed : Date.now();
      const puzzleData: PuzzleData | null = generatePuzzle(
        diff.size,
        diff.removalRatio,
        initialSeed,
      );

      if (!puzzleData) {
        setLoading(false);
        Alert.alert('Generation Failed', 'Could not create a puzzle.', [
          { text: 'OK' },
        ]);
        return;
      }

      const {
        colorGrid: newColorGrid,
        puzzleGrid: newGrid,
        seed: gameSeed,
      } = puzzleData;

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

  const handleDifficultyPress = (diff: Difficulty) => {
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

  const validateGameState = (currentGrid: number[][]): boolean => {
    const size = difficulty.size;
    const newErrors: string[] = [];
    const queens: [number, number][] = [];
    for (let i = 0; i < size; i++)
      for (let j = 0; j < size; j++)
        if (currentGrid[i][j] === 2) queens.push([i, j]);

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
    for (const color in colorCounts)
      if (colorCounts[color] > 1)
        newErrors.push(`A color region has ${colorCounts[color]} queens.`);

    setErrors([...new Set(newErrors)]);
    return newErrors.length === 0;
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

  const generateHint = () => {
    if (gameState !== 'playing' || isSolved) return;
    const size = difficulty.size;
    const newGrid = grid.map(row => [...row]);
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (newGrid[r][c] === 0) {
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
      }
    }
    Alert.alert(
      'No Obvious Hints',
      'No empty cells directly conflict with your current queens.',
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Generating new puzzle...</Text>
        </View>
      );
    }

    if (gameState === 'playing' || gameState === 'won') {
      return (
        <Game
          difficulty={difficulty}
          grid={grid}
          colorGrid={colorGrid}
          moves={moves}
          hintsUsed={hintsUsed}
          errors={errors}
          isSolved={isSolved}
          onCellTap={handleCellTap}
          onNewGame={() => initializeGame(difficulty)}
          onShowMenu={() => setGameState('menu')}
          onGenerateHint={generateHint}
        />
      );
    }

    return (
      <Menu
        onStartGame={initializeGame}
        onSelectDifficulty={handleDifficultyPress}
        selectedDifficulty={difficulty}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#2c3e50' },
});

export default App;
