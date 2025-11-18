export interface PuzzleData {
  colorGrid: number[][];
  puzzleGrid: number[][];
  seed: number;
}

const solvePuzzleLogically = (
  startGrid: number[][],
  colorGrid: number[][],
): { grid: number[][]; queens: number; solvable: boolean } => {
  const size = startGrid.length;
  const grid = startGrid.map(row => [...row]);
  let changed = true;
  let queensPlaced = 0;
  grid.forEach(row =>
    row.forEach(cell => {
      if (cell === 2) queensPlaced++;
    }),
  );

  const placeQueen = (r: number, c: number): boolean => {
    if (grid[r][c] !== 0) return false;
    grid[r][c] = 2;
    queensPlaced++;
    return true;
  };

  while (changed) {
    changed = false;
    if (queensPlaced === size) break;

    const queens: [number, number][] = [];
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++) if (grid[r][c] === 2) queens.push([r, c]);

    for (const [qr, qc] of queens) {
      const queenColor = colorGrid[qr][qc];
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          if (grid[i][j] === 0) {
            const isAttacked =
              i === qr ||
              j === qc ||
              (Math.abs(i - qr) <= 1 && Math.abs(j - qc) <= 1) ||
              colorGrid[i][j] === queenColor;
            if (isAttacked) {
              grid[i][j] = 1;
              changed = true;
            }
          }
        }
      }
    }

    for (let i = 0; i < size; i++) {
      const checkConstraintForSingles = (cells: [number, number][]) => {
        if (cells.some(([r, c]) => grid[r][c] === 2)) return;
        const possibleSpots = cells.filter(([r, c]) => grid[r][c] === 0);
        if (possibleSpots.length === 1) {
          if (placeQueen(possibleSpots[0][0], possibleSpots[0][1]))
            changed = true;
          return;
        }
        const validCandidates: [number, number][] = [];
        for (const [r, c] of possibleSpots) {
          let isPossible = true;
          for (const [qr, qc] of queens) {
            if (
              r === qr ||
              c === qc ||
              (Math.abs(r - qr) <= 1 && Math.abs(c - qc) <= 1) ||
              colorGrid[r][c] === colorGrid[qr][qc]
            ) {
              isPossible = false;
              break;
            }
          }
          if (isPossible) {
            validCandidates.push([r, c]);
          }
        }
        if (validCandidates.length === 1) {
          if (placeQueen(validCandidates[0][0], validCandidates[0][1]))
            changed = true;
        }
      };
      if (changed) continue;
      checkConstraintForSingles(Array.from({ length: size }, (_, c) => [i, c]));
      if (changed) continue;
      checkConstraintForSingles(Array.from({ length: size }, (_, r) => [r, i]));
      const colorCells: [number, number][] = [];
      for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++)
          if (colorGrid[r][c] === i) colorCells.push([r, c]);
      if (colorCells.length > 0) {
        checkConstraintForSingles(colorCells);
      }
    }
    if (changed) continue;

    const colorCandidates: [number, number][][] = Array.from(
      { length: size },
      () => [],
    );
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (grid[r][c] === 0) colorCandidates[colorGrid[r][c]].push([r, c]);
    for (let color = 0; color < size; color++) {
      let hasQueen = false;
      for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++)
          if (grid[r][c] === 2 && colorGrid[r][c] === color) hasQueen = true;
      if (hasQueen) continue;
      const candidates = colorCandidates[color];
      if (candidates.length < 2) continue;
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

export const generatePuzzle = (
  size: number,
  removalRatio: number,
  initialSeed: number,
): PuzzleData | null => {
  let solutionQueens: [number, number][] = [];
  let colorGrid: number[][] = [];
  let currentSeed = initialSeed;
  const seededRandom = () => {
    const x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
  };

  const findQueenSolution = () => {
    const queens: [number, number][] = [];
    const solve = (row: number): boolean => {
      if (row === size) return true;
      const columns = Array.from({ length: size }, (_, i) => i);
      columns.sort(() => seededRandom() - 0.5);
      for (const col of columns) {
        let isSafe = true;
        for (const [qRow, qCol] of queens) {
          if (
            qRow === row ||
            qCol === col ||
            Math.abs(qRow - row) === Math.abs(qCol - col) ||
            (Math.abs(qRow - row) <= 1 && Math.abs(qCol - col) <= 1)
          ) {
            isSafe = false;
            break;
          }
        }
        if (isSafe) {
          queens.push([row, col]);
          if (solve(row + 1)) return true;
          queens.pop();
        }
      }
      return false;
    };
    solve(0);
    solutionQueens = queens;
  };

  const createColorGrid = () => {
    const grid = Array(size)
      .fill(null)
      .map(() => Array(size).fill(-1));
    const queues: [number, number][][] = Array.from({ length: size }, () => []);
    solutionQueens.forEach(([r, c], color) => {
      grid[r][c] = color;
      queues[color].push([r, c]);
    });
    let unassigned = size * size - size;
    while (unassigned > 0) {
      const colorOrder = Array.from({ length: size }, (_, i) => i).sort(
        () => seededRandom() - 0.5,
      );
      for (const color of colorOrder) {
        if (queues[color].length > 0) {
          const [r, c] = queues[color].shift()!;
          const directions = [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ];
          directions.sort(() => seededRandom() - 0.5);
          for (const [dr, dc] of directions) {
            const nr = r + dr,
              nc = c + dc;
            if (
              nr >= 0 &&
              nr < size &&
              nc >= 0 &&
              nc < size &&
              grid[nr][nc] === -1
            ) {
              grid[nr][nc] = color;
              queues[color].push([nr, nc]);
              unassigned--;
            }
          }
        }
      }
    }
    colorGrid = grid;
  };

  findQueenSolution();
  if (solutionQueens.length !== size) return null;
  createColorGrid();

  const puzzleGrid = Array(size)
    .fill(null)
    .map(() => Array(size).fill(1));
  const solutionSet = new Set(solutionQueens.map(([r, c]) => `${r},${c}`));
  const removableClues: [number, number][] = [];

  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      if (solutionSet.has(`${r},${c}`)) {
        puzzleGrid[r][c] = 0;
      } else {
        removableClues.push([r, c]);
      }
    }
  removableClues.sort(() => seededRandom() - 0.5);

  const cluesToRemoveCount = Math.floor(removableClues.length * removalRatio);
  let removedCount = 0;

  for (const [r, c] of removableClues) {
    if (removedCount >= cluesToRemoveCount) break;
    puzzleGrid[r][c] = 0;
    const result = solvePuzzleLogically(puzzleGrid, colorGrid);
    if (!result.solvable) {
      puzzleGrid[r][c] = 1;
    } else {
      removedCount++;
    }
  }

  return { colorGrid, puzzleGrid, seed: currentSeed };
};