import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { DIFFICULTIES, Difficulty } from '../constants/config';

interface MenuProps {
  onSelectDifficulty: (diff: Difficulty) => void;
  selectedDifficulty: Difficulty;
}

const Menu: React.FC<MenuProps> = ({
  onSelectDifficulty,
  selectedDifficulty,
}) => {
  return (
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
              selectedDifficulty.size === diff.size &&
                styles.selectedDifficulty,
            ]}
            onPress={() => onSelectDifficulty(diff)}
          >
            <Text
              style={[
                styles.difficultyText,
                selectedDifficulty.size === diff.size &&
                  styles.selectedDifficultyText,
              ]}
            >
              {diff.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
};

const styles = StyleSheet.create({
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
});

export default Menu;
