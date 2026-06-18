export const GAME_INFO = Object.freeze({
  koreanTitle: '잉까기',
  englishTitle: 'Ink Kkagi',
});

export const DRAWING_CONFIG = Object.freeze({
  PIECES_PER_PLAYER: 3,
  GRID_COLUMNS: 8,
  GRID_ROWS: 8,
  TOTAL_INK: 42,
  MIN_INK_PER_PIECE: 8,
  MAX_INK_PER_PIECE: 22,
  CONNECTION_MODE: 'ORTHOGONAL',
});

export const PLACEMENT_CONFIG = Object.freeze({
  BOARD_COLUMNS: 14,
  BOARD_ROWS: 20,
  HOME_ROWS: 10,
  ROTATIONS: [0, 90, 180, 270],
});

export const PLAYER_COLORS = Object.freeze({
  1: '#1677c7',
  2: '#e75f2a',
});
