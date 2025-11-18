export interface Difficulty {
  size: number;
  name: string;
  removalRatio: number;
}

export const DIFFICULTIES: { [key: string]: Difficulty } = {
  EASY: { size: 4, name: 'Easy (4x4)', removalRatio: 0.7 },
  MEDIUM: { size: 6, name: 'Medium (6x6)', removalRatio: 0.8 },
  HARD: { size: 8, name: 'Hard (8x8)', removalRatio: 0.85 },
  EXPERT: { size: 10, name: 'Expert (10x10)', removalRatio: 0.9 },
  MASTER: { size: 12, name: 'Master (12x12)', removalRatio: 0.95 },
  HARDCORE: { size: 20, name: 'Hardcore (20x20)', removalRatio: 0.96 },
};

export const COLORS = [
  // Primary & Secondary Colors
  '#FF1744',
  '#304FFE',
  '#00E676',
  '#FFC400',
  '#D500F9',
  '#FF6D00',
  // Vibrant Tertiary Colors
  '#00B8D4',
  '#F50057',
  '#76FF03',
  '#6200EA',
  '#1DE9B6',
  '#FFAB00',
  // Dark & Distinct Shades
  '#C51162',
  '#0091EA',
  '#880E4F',
  '#1A237E',
  '#004D40',
  '#BF360C',
  // Light & Distinct Shades
  '#827717',
  '#4E342E',
  '#616161',
  '#FF8A65',
  '#4DD0E1',
  '#BA68C8',
  // More colors for larger grids
  '#FBC02D',
  '#33691E',
  '#E65100',
  '#263238',
  '#AD1457',
  '#01579B',
];
