import { DRAWING_CONFIG } from '../config/gameConfig.js';
import { getMinInkForCurrentPiece } from './inkAllocator.js';

export function toCellKey({ x, y }) {
  return `${x},${y}`;
}

export function normalizeCells(cells) {
  const seen = new Set();
  const normalized = [];

  for (const cell of cells) {
    const key = toCellKey(cell);
    if (!seen.has(key)) {
      seen.add(key);
      normalized.push({ x: cell.x, y: cell.y });
    }
  }

  return normalized;
}

export function areCellsOrthogonallyConnected(cells) {
  const normalized = normalizeCells(cells);
  if (normalized.length <= 1) {
    return true;
  }

  const cellKeys = new Set(normalized.map(toCellKey));
  const visited = new Set();
  const queue = [normalized[0]];

  while (queue.length > 0) {
    const current = queue.shift();
    const currentKey = toCellKey(current);

    if (visited.has(currentKey)) {
      continue;
    }

    visited.add(currentKey);

    for (const neighbor of getOrthogonalNeighbors(current)) {
      const neighborKey = toCellKey(neighbor);
      if (cellKeys.has(neighborKey) && !visited.has(neighborKey)) {
        queue.push(neighbor);
      }
    }
  }

  return visited.size === normalized.length;
}

export function validatePieceDraft({
  cells,
  completedPieces,
  config = DRAWING_CONFIG,
}) {
  const normalized = normalizeCells(cells);
  const currentInk = normalized.length;
  const usedInk = completedPieces.reduce((sum, piece) => sum + piece.pixelCount, 0);
  const remainingInkBeforeConfirm = config.TOTAL_INK - usedInk;
  const pieceIndex = completedPieces.length;
  const remainingPiecesAfterConfirm = config.PIECES_PER_PLAYER - pieceIndex - 1;
  const isLastPiece = remainingPiecesAfterConfirm === 0;
  const minInk = getMinInkForCurrentPiece(completedPieces, config);
  const futureMinimumInk = remainingPiecesAfterConfirm * config.MIN_INK_PER_PIECE;
  const maxInk = Math.min(
    config.MAX_INK_PER_PIECE,
    remainingInkBeforeConfirm - futureMinimumInk,
  );
  const errors = [];

  if (completedPieces.length >= config.PIECES_PER_PLAYER) {
    errors.push('이미 모든 말을 만들었습니다.');
  }

  if (currentInk < minInk) {
    errors.push(`잉크가 부족합니다. ${minInk}칸 이상 필요합니다.`);
  }

  if (currentInk > maxInk) {
    errors.push(`잉크가 너무 많습니다. 이번 말은 최대 ${maxInk}칸입니다.`);
  }

  if (!areCellsInsideGrid(normalized, config)) {
    errors.push('픽셀이 제작 그리드 밖에 있습니다.');
  }

  if (!areCellsOrthogonallyConnected(normalized)) {
    errors.push('모든 픽셀은 상하좌우로 연결되어야 합니다.');
  }

  if (isLastPiece && currentInk !== remainingInkBeforeConfirm) {
    errors.push(`마지막 말은 남은 ${remainingInkBeforeConfirm}칸을 모두 사용해야 합니다.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    currentInk,
    minInk,
    maxInk,
    remainingInkBeforeConfirm,
    remainingInkAfterConfirm: remainingInkBeforeConfirm - currentInk,
    remainingPiecesAfterConfirm,
  };
}

function getOrthogonalNeighbors({ x, y }) {
  return [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 },
  ];
}

function areCellsInsideGrid(cells, config) {
  return cells.every(
    ({ x, y }) => x >= 0 && x < config.GRID_COLUMNS && y >= 0 && y < config.GRID_ROWS,
  );
}
