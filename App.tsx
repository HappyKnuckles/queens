import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Alert, SafeAreaView, StatusBar, ScrollView, ActivityIndicator,
} from 'react-native';

const DIFFICULTIES = {
  EASY: { size: 4, name: 'Easy (4x4)', removalRatio: 0.5 },
  MEDIUM: { size: 6, name: 'Medium (6x6)', removalRatio: 0.6 },
  HARD: { size: 8, name: 'Hard (8x8)', removalRatio: 0.75 },
  EXPERT: { size: 10, name: 'Expert (10x10)', removalRatio: 0.85 },
  MASTER: { size: 12, name: 'Master (12x12)', removalRatio: 0.95 },
};

const COLORS = [
  '#E74C3C', '#2ECC71', '#3498DB', '#F39C12', '#9B59B6', '#1ABC9C',
  '#E67E22', '#F1C40F', '#8E44AD', '#16A085', '#D35400', '#27AE60',
  '#f48fb1', '#4db6ac', '#ffab91', '#81c784',
];

// --- The Enhanced "Human" Solver ---
const solvePuzzleLogically = (
  startGrid: number[][], colorGrid: number[][]
): { grid: number[][], queens: number, solvable: boolean } => {
    const size = startGrid.length;
    const grid = startGrid.map(row => [...row]);
    let changed = true;
    let queensPlaced = 0;
    grid.forEach(row => row.forEach(cell => { if (cell === 2) queensPlaced++; }));

    const placeQueen = (r: number, c: number): boolean => {
        if (grid[r][c] !== 0) return false;
        grid[r][c] = 2;
        queensPlaced++;
        return true; // We'll handle marking other cells in a separate step
    };

    // Main solver loop that repeats as long as logical deductions are being made
    while (changed) {
        changed = false;
        if (queensPlaced === size) break;

        // --- STEP 1: Basic Constraint Propagation (Cleanup) ---
        // A human would first mark all cells attacked by existing queens.
        const queens: [number, number][] = [];
        for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (grid[r][c] === 2) queens.push([r, c]);

        for (const [qr, qc] of queens) {
            const queenColor = colorGrid[qr][qc];
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    if (grid[i][j] === 0) {
                        const isAttacked =
                            (i === qr) || (j === qc) || // Row/Col
                            (Math.abs(i - qr) <= 1 && Math.abs(j - qc) <= 1) || // Adjacency
                            (colorGrid[i][j] === queenColor); // Color
                        if (isAttacked) {
                            grid[i][j] = 1;
                            changed = true;
                        }
                    }
                }
            }
        }
        
        // --- STEP 2: Naked and Hidden Singles ---
        // This is the most common human deduction.
        for (let i = 0; i < size; i++) {
            const checkConstraintForSingles = (cells: [number, number][]) => {
                // If a queen is already in this group, skip.
                if (cells.some(([r, c]) => grid[r][c] === 2)) return;

                const possibleSpots = cells.filter(([r, c]) => grid[r][c] === 0);

                // NAKED SINGLE: If there's only one empty cell left in a group, a queen must go there.
                if (possibleSpots.length === 1) {
                    if (placeQueen(possibleSpots[0][0], possibleSpots[0][1])) changed = true;
                    return; // Move on, as the state has changed
                }

                // HIDDEN SINGLE: Find if a cell is the only valid placement within this group.
                const validCandidates: [number, number][] = [];
                for(const [r, c] of possibleSpots) {
                    let isPossible = true;
                    // Check if this spot is attacked by any queen OUTSIDE the current constraint group
                    for(const [qr, qc] of queens) {
                         const isAttacked =
                            (r === qr) || (c === qc) || 
                            (Math.abs(r - qr) <= 1 && Math.abs(c - qc) <= 1) || 
                            (colorGrid[r][c] === colorGrid[qr][qc]);
                        if (isAttacked) {
                            isPossible = false;
                            break;
                        }
                    }
                    if(isPossible) {
                        validCandidates.push([r, c]);
                    }
                }

                if (validCandidates.length === 1) {
                     if (placeQueen(validCandidates[0][0], validCandidates[0][1])) changed = true;
                }
            };
            
            if (changed) continue;
            checkConstraintForSingles(Array.from({ length: size }, (_, c) => [i, c])); // Check Row i
            if (changed) continue;
            checkConstraintForSingles(Array.from({ length: size }, (_, r) => [r, i])); // Check Column i

            // Check Color group i
            const colorCells: [number, number][] = [];
            for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (colorGrid[r][c] === i) colorCells.push([r, c]);
            if (colorCells.length > 0) {
                 checkConstraintForSingles(colorCells);
            }
        }
        if (changed) continue; // Restart loop if a queen was placed

        // --- STEP 3: Intersection Pointing (Advanced Logic) ---
        // If a change was made above, we restart to check for simpler logic first.
        const colorCandidates: [number, number][][] = Array.from({ length: size }, () => []);
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] === 0) {
                    const color = colorGrid[r][c];
                    colorCandidates[color].push([r,c]);
                }
            }
        }

        for (let color = 0; color < size; color++) {
            // Check if this color group already has a queen
            let hasQueen = false;
            for(let r=0; r<size; r++) for(let c=0; c<size; c++) if(grid[r][c] === 2 && colorGrid[r][c] === color) hasQueen = true;
            if(hasQueen) continue;

            const candidates = colorCandidates[color];
            if (candidates.length < 2) continue;

            // Pointing Pair in a Row
            const uniqueRows = new Set(candidates.map(([r]) => r));
            if (uniqueRows.size === 1) {
                const row = uniqueRows.values().next().value;
                for (let c = 0; c < size; c++) {
                    if (grid[row!][c] === 0 && colorGrid[row!][c] !== color) {
                        grid[row!][c] = 1;
                        changed = true;
                    }
                }
            }

            // Pointing Pair in a Column
            const uniqueCols = new Set(candidates.map(([, c]) => c));
            if (uniqueCols.size === 1) {
                const col = uniqueCols.values().next().value;
                for (let r = 0; r < size; r++) {
                    if (grid[r][col!] === 0 && colorGrid[r][col!] !== color) {
                        grid[r][col!] = 1;
                        changed = true;
                    }
                }
            }
        }
    }
    return { grid, queens: queensPlaced, solvable: queensPlaced === size };
};

const generatePuzzle = (size: number, removalRatio: number, initialSeed: number) => {
    let solutionQueens: [number, number][] = [];
    let colorGrid: number[][] = [];
    let currentSeed = initialSeed;
    const seededRandom = () => { const x = Math.sin(currentSeed++) * 10000; return x - Math.floor(x); };

    // 1. & 2. Generate a valid solution and a color grid
    const findQueenSolution = () => {
        const queens: [number, number][] = [];
        const solve = (row: number): boolean => {
            if (row === size) return true;
            const columns = Array.from({ length: size }, (_, i) => i);
            columns.sort(() => seededRandom() - 0.5);
            for (const col of columns) {
                let isSafe = true;
                for (const [qRow, qCol] of queens) {
                    if (qRow === row || qCol === col || Math.abs(qRow - row) === Math.abs(qCol - col) || (Math.abs(qRow - row) <= 1 && Math.abs(qCol - col) <= 1)) {
                        isSafe = false; break;
                    }
                }
                if (isSafe) { queens.push([row, col]); if (solve(row + 1)) return true; queens.pop(); }
            }
            return false;
        };
        solve(0); solutionQueens = queens;
    };
    const createColorGrid = () => {
        const grid = Array(size).fill(null).map(() => Array(size).fill(-1));
        const queues: [number, number][][] = Array.from({ length: size }, () => []);
        solutionQueens.forEach(([r, c], color) => { grid[r][c] = color; queues[color].push([r, c]); });
        let unassigned = size * size - size;
        while (unassigned > 0) {
            const colorOrder = Array.from({ length: size }, (_, i) => i).sort(() => seededRandom() - 0.5);
            for (const color of colorOrder) {
                if (queues[color].length > 0) {
                    const [r, c] = queues[color].shift()!;
                    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                    directions.sort(() => seededRandom() - 0.5);
                    for (const [dr, dc] of directions) {
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === -1) {
                            grid[nr][nc] = color; queues[color].push([nr, nc]); unassigned--;
                        }
                    }
                }
            }
        }
        colorGrid = grid;
    };

    findQueenSolution();
    if (solutionQueens.length !== size) return null; // Generation failed
    createColorGrid();

    // 3. Start with a full grid and "carve" out clues
    const puzzleGrid = Array(size).fill(null).map(() => Array(size).fill(1)); // 1 means "cannot place"
    const solutionSet = new Set(solutionQueens.map(([r, c]) => `${r},${c}`));
    const clueCells: [number, number][] = [];

    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
        if (solutionSet.has(`${r},${c}`)) {
            puzzleGrid[r][c] = 0; // Empty cells where queens should go
        } else {
            clueCells.push([r, c]); // These are the cells we can potentially remove (make empty)
        }
    }
    clueCells.sort(() => seededRandom() - 0.5); // Randomize removal order

    const cluesToRemoveCount = Math.floor(clueCells.length * removalRatio);
    let removedCount = 0;

    for (const [r, c] of clueCells) {
        if (removedCount >= cluesToRemoveCount) break;

        const originalValue = puzzleGrid[r][c];
        puzzleGrid[r][c] = 0; // Tentatively remove the clue (make it an empty cell)
        
        // Test if the puzzle is still logically solvable
        const result = solvePuzzleLogically(puzzleGrid, colorGrid);

        if (!result.solvable) {
            puzzleGrid[r][c] = originalValue; // Put the clue back, it's critical
        } else {
            removedCount++; // Removal successful, the clue was redundant
        }
    }
    
    // The final player grid is always completely empty.
    // The solvability is baked into the structure of the colors and the removed clues.
    // const playerGrid = Array(size).fill(null).map(() => Array(size).fill(0));
    
    return { colorGrid, puzzleGrid, seed: currentSeed };
};


const App = () => {
    // ... No changes needed in the App component, it remains exactly the same ...
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
            const puzzleData = generatePuzzle(
                diff.size,
                diff.removalRatio,
                initialSeed,
            );

            if (!puzzleData) {
                setLoading(false);
                Alert.alert('Generation Failed', 'Could not create a puzzle.', [{ text: 'OK' }]);
                return;
            }
            
            const { colorGrid: newColorGrid, puzzleGrid: newGrid, seed: gameSeed } = puzzleData;

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
                const [r1, c1] = queens[i]; const [r2, c2] = queens[j];
                if (r1 === r2) newErrors.push(`Row ${r1 + 1} has multiple queens.`);
                if (c1 === c2) newErrors.push(`Column ${c1 + 1} has multiple queens.`);
                if (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1) newErrors.push(`Queens at (${r1 + 1},${c1 + 1}) and (${r2 + 1},${c2 + 1}) are adjacent.`);
            }
        }
        const colorCounts: { [key: number]: number } = {};
        queens.forEach(([r, c]) => {
            const color = colorGrid[r][c]; colorCounts[color] = (colorCounts[color] || 0) + 1;
        });
        for (const color in colorCounts) {
            if (colorCounts[color] > 1) newErrors.push(`A color region has ${colorCounts[color]} queens.`);
        }
        setErrors([...new Set(newErrors)]); return newErrors.length === 0;
    };
    const generateHint = () => {
        if (gameState !== 'playing' || isSolved) return;
        const size = difficulty.size; const newGrid = grid.map(row => [...row]);
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (newGrid[r][c] === 0) {
                    let isInvalid = false;
                    for (let i = 0; i < size; i++) {
                        for (let j = 0; j < size; j++) {
                            if (grid[i][j] === 2) {
                                if (r === i || c === j || colorGrid[r][c] === colorGrid[i][j] || (Math.abs(r - i) <= 1 && Math.abs(c - j) <= 1)) {
                                    isInvalid = true; break;
                                }
                            }
                        }
                        if (isInvalid) break;
                    }
                    if (isInvalid) { newGrid[r][c] = 1; setGrid(newGrid); setHintsUsed(hintsUsed + 1); setMoves(moves + 1); return; }
                }
            }
        }
        Alert.alert('No Obvious Hints', 'No empty cells directly conflict with your current queens.');
    };
    const handleCellTap = (row: number, col: number) => {
        if (gameState !== 'playing' || isSolved) return;
        const newGrid = grid.map(gridRow => [...gridRow]);
        newGrid[row][col] = (newGrid[row][col] + 1) % 3;
        setGrid(newGrid); setMoves(moves + 1);
        setTimeout(() => { const isValid = validateGameState(newGrid); if (isValid) checkWinCondition(newGrid); }, 0);
    };
    const checkWinCondition = (currentGrid: number[][]) => {
        const size = difficulty.size;
        const queenCount = currentGrid.flat().filter(cell => cell === 2).length;
        if (queenCount === size && validateGameState(currentGrid)) {
            setIsSolved(true); setGameState('won');
            const message = hintsUsed > 0 ? `You won in ${moves} moves using ${hintsUsed} hint${hintsUsed > 1 ? 's' : ''}!` : `Perfect! You won in ${moves} moves without hints!`;
            Alert.alert('Congratulations!', message, [{ text: 'Play Again', onPress: () => initializeGame(difficulty) }, { text: 'Main Menu', onPress: () => setGameState('menu') },]);
        }
    };
    const resetGame = () => initializeGame(difficulty, seed);
    const handleDifficultyPress = (diff: any) => {
        const currentTime = Date.now(); const doublePressDelay = 300;
        if (lastPressedDifficulty?.size === diff.size && currentTime - lastPressTime < doublePressDelay) {
            initializeGame(diff);
        } else {
            setDifficulty(diff); setLastPressTime(currentTime); setLastPressedDifficulty(diff);
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
            <Text style={styles.title}>👑 Queens Game</Text><Text style={styles.subtitle}>A Logic Puzzle</Text>
            <View style={styles.difficultyContainer}>
                <Text style={styles.sectionTitle}>Select Difficulty:</Text>
                {Object.values(DIFFICULTIES).map(diff => (
                    <TouchableOpacity key={diff.name} style={[styles.difficultyButton, difficulty.size === diff.size && styles.selectedDifficulty,]} onPress={() => handleDifficultyPress(diff)}>
                        <Text style={[styles.difficultyText, difficulty.size === diff.size && styles.selectedDifficultyText,]}>{diff.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity style={styles.startButton} onPress={() => initializeGame(difficulty)}>
                <Text style={styles.startButtonText}>Start Game</Text>
            </TouchableOpacity>
            <View style={styles.rulesContainer}>
                <Text style={styles.rulesTitle}>How to Play:</Text>
                <Text style={styles.rulesText}>
                    • Tap to cycle: empty → ❌ → 👑{'\n'}• One 👑 per row.{'\n'}• One 👑 per column.{'\n'}• One 👑 per colored region.{'\n'}• Queens cannot be adjacent (not even diagonally).
                </Text>
            </View>
        </ScrollView>
    );
    const renderGame = () => (
        <View style={styles.gameContainer}>
            <View style={styles.gameHeader}>
                <TouchableOpacity style={styles.backButton} onPress={() => setGameState('menu')}><Text style={styles.backButtonText}>← Menu</Text></TouchableOpacity>
                <Text style={styles.gameTitle}>{difficulty.name}</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity style={styles.hintButton} onPress={generateHint}><Text style={styles.hintButtonText}>💡 Hint</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.resetButton} onPress={resetGame}><Text style={styles.resetButtonText}>Reset</Text></TouchableOpacity>
                </View>
            </View>
            <View style={styles.statsContainer}><Text style={styles.movesText}>Moves: {moves}</Text><Text style={styles.hintsText}>Hints: {hintsUsed}</Text></View>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.gridContainer}>
                    {grid.map((row, i) => (
                        <View key={i} style={styles.row}>
                            {row.map((cell, j) => {
                                const cellSize = getCellSize(difficulty.size); const BOLD_BORDER_WIDTH = 2;
                                const cellStyle: any = {
                                    width: cellSize.width, height: cellSize.height,
                                    backgroundColor: colorGrid[i]?.[j] != null ? COLORS[colorGrid[i][j] % COLORS.length] : 'transparent',
                                    borderTopWidth: i > 0 && colorGrid[i]?.[j] !== colorGrid[i - 1]?.[j] ? BOLD_BORDER_WIDTH : 0.5,
                                    borderLeftWidth: j > 0 && colorGrid[i]?.[j] !== colorGrid[i][j - 1] ? BOLD_BORDER_WIDTH : 0.5,
                                    borderColor: '#000',
                                };
                                return (
                                    <TouchableOpacity key={`${i}-${j}`} style={[styles.cell, cellStyle]} onPress={() => handleCellTap(i, j)} activeOpacity={0.7}>
                                        <Text style={[styles.cellText, { fontSize: cellSize.fontSize }]}>{cell === 1 ? '❌' : cell === 2 ? '👑' : ''}</Text>
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
                            {errors.map((error, index) => (<Text key={index} style={styles.errorText}>• {error}</Text>))}
                        </View>
                    )}
                    {isSolved && (<View style={styles.successContainer}><Text style={styles.successText}>✅ Solution Complete!</Text></View>)}
                </View>
            </ScrollView>
        </View>
    );
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            {loading ? (
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#3498db" /><Text style={styles.loadingText}>Generating new puzzle...</Text></View>
            ) : gameState === 'menu' ? (renderMenu()) : colorGrid.length > 0 ? (renderGame()) : null}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', justifyContent: 'center' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#2c3e50' },
  menuContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10 },
  subtitle: { fontSize: 18, color: '#7f8c8d', marginBottom: 40 },
  difficultyContainer: { width: '100%', maxWidth: 300, marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#2c3e50', marginBottom: 15, textAlign: 'center' },
  difficultyButton: { backgroundColor: '#ecf0f1', padding: 15, marginVertical: 5, borderRadius: 10, borderWidth: 2, borderColor: 'transparent' },
  selectedDifficulty: { backgroundColor: '#3498db', borderColor: '#2980b9' },
  difficultyText: { fontSize: 16, textAlign: 'center', color: '#2c3e50', fontWeight: '500' },
  selectedDifficultyText: { color: 'white', fontWeight: '600' },
  startButton: { backgroundColor: '#27ae60', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25, marginBottom: 30, elevation: 3 },
  startButtonText: { color: 'white', fontSize: 18, fontWeight: '600' },
  rulesContainer: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '100%', maxWidth: 350, elevation: 5 },
  rulesTitle: { fontSize: 16, fontWeight: '600', color: '#2c3e50', marginBottom: 10 },
  rulesText: { fontSize: 14, color: '#34495e', lineHeight: 22 },
  gameContainer: { flex: 1, padding: 10 },
  gameHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10 },
  backButton: { backgroundColor: '#95a5a6', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  backButtonText: { color: 'white', fontWeight: '500' },
  gameTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  headerButtons: { flexDirection: 'row', gap: 8 },
  hintButton: { backgroundColor: '#f39c12', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  hintButtonText: { color: 'white', fontWeight: '500' },
  resetButton: { backgroundColor: '#e74c3c', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  resetButtonText: { color: 'white', fontWeight: '500' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 5 },
  movesText: { fontSize: 16, color: '#2c3e50' },
  hintsText: { fontSize: 16, color: '#8e44ad' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  gridContainer: { borderWidth: 2, borderColor: '#000' },
  row: { flexDirection: 'row' },
  cell: { justifyContent: 'center', alignItems: 'center', borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#333' },
  cellText: { fontWeight: 'bold', textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  statusContainer: { width: '100%', marginTop: 20, paddingHorizontal: 10 },
  errorContainer: { backgroundColor: '#fee', padding: 10, borderRadius: 5, marginBottom: 10, borderWidth: 1, borderColor: '#fcc' },
  errorTitle: { color: '#c33', fontWeight: 'bold', fontSize: 14, marginBottom: 5 },
  errorText: { color: '#c33', fontSize: 12 },
  successContainer: { backgroundColor: '#dfd', padding: 10, borderRadius: 5, marginBottom: 10, borderWidth: 1, borderColor: '#cfc' },
  successText: { color: '#383', fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
});

export default App;