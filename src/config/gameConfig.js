export const GAME_INFO = Object.freeze({
  koreanTitle: '잉까기',
  englishTitle: 'Ink Kkagi',
});

export const DRAWING_CONFIG = Object.freeze({
  PIECES_PER_PLAYER: 3,
  GRID_COLUMNS: 8,
  GRID_ROWS: 8,
  TOTAL_INK: 36,
  MIN_INK_PER_PIECE: 7,
  MAX_INK_PER_PIECE: 18,
  CONNECTION_MODE: 'ORTHOGONAL',
});

export const PLACEMENT_CONFIG = Object.freeze({
  BOARD_COLUMNS: 28,
  BOARD_ROWS: 28,
  HOME_ROWS: 8,
  ROTATIONS: [0, 90, 180, 270],
});

export const MATCH_RENDER_CONFIG = Object.freeze({
  FINE_GRID_SCALE: 4,
  BLOCK_DURABILITY: 3,
});

export const PLAYER_COLORS = Object.freeze({
  1: '#1677c7',
  2: '#e75f2a',
});
