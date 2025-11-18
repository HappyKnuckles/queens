// src/components/Game.tsx

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { COLORS, Difficulty } from '../constants/config';

// Define the types for this component's props
interface GameProps {
  difficulty: Difficulty;
  grid: number[][];
  colorGrid: number[][];
  moves: number;
  hintsUsed: number;
  errors: string[];
  isSolved: boolean;
  onCellTap: (row: number, col: number) => void;
  onNewGame: () => void;
  onShowMenu: () => void;
  onGenerateHint: () => void;
}

const Game: React.FC<GameProps> = ({
  difficulty,
  grid,
  colorGrid,
  moves,
  hintsUsed,
  errors,
  isSolved,
  onCellTap,
  onNewGame,
  onShowMenu,
  onGenerateHint,
}) => {
  const { width, height } = Dimensions.get('window');
  const availableWidth = width - 24;
  const availableHeight = height - 150;
  const maxGridSize = Math.min(availableWidth, availableHeight);
  const cellSize = maxGridSize / difficulty.size;
  const fontSize = Math.max(8, cellSize * 0.55);

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onShowMenu}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.gameTitle}>{difficulty.name}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.hintButton} onPress={onGenerateHint}>
            <Text style={styles.hintButtonText}>💡 Hint</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={onNewGame}>
            <Text style={styles.resetButtonText}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.movesText}>Moves: {moves}</Text>
        <Text style={styles.hintsText}>Hints: {hintsUsed}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.gridContainer, { maxWidth: maxGridSize }]}>
          {grid.map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((cell, j) => {
                const BOLD_BORDER_WIDTH = 2;
                const cellStyle = {
                  width: cellSize,
                  height: cellSize,
                  backgroundColor:
                    colorGrid[i]?.[j] != null
                      ? COLORS[colorGrid[i][j] % COLORS.length]
                      : 'transparent',
                  borderTopWidth:
                    i > 0 && colorGrid[i]?.[j] !== colorGrid[i - 1]?.[j]
                      ? BOLD_BORDER_WIDTH
                      : 0.5,
                  borderLeftWidth:
                    j > 0 && colorGrid[i]?.[j] !== colorGrid[i][j - 1]
                      ? BOLD_BORDER_WIDTH
                      : 0.5,
                  borderColor: '#000',
                };
                return (
                  <TouchableOpacity
                    key={`${i}-${j}`}
                    style={[styles.cell, cellStyle]}
                    onPress={() => onCellTap(i, j)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.cellText, { fontSize }]}>
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
};

const styles = StyleSheet.create({
  gameContainer: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
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
  gridContainer: { borderWidth: 2, borderColor: '#000' },
  row: { flexDirection: 'row' },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#333',
  },
  cellText: {
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statusContainer: { width: '100%', marginTop: 20 },
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

export default Game;
