import { PLACEMENT_CONFIG } from '../config/gameConfig.js';
import { normalizeCells, toCellKey } from '../drawing/drawingValidation.js';

export function getPieceFootprint(cells, rotation = 0) {
  const normalized = normalizeToOrigin(cells);
  const bounds = getBounds(normalized);
  const rotated = normalized.map((cell) => rotateCell(cell, bounds, rotation));

  return normalizeToOrigin(rotated);
}

export function getPlacedCells({ piece, anchor, rotation }) {
  if (!piece || !anchor) {
    return [];
  }

  return getPieceFootprint(piece.cells, rotation).map((cell) => ({
    x: anchor.x + cell.x,
    y: anchor.y + cell.y,
  }));
}

export function getNextRotation(rotation, config = PLACEMENT_CONFIG) {
  const rotationIndex = config.ROTATIONS.indexOf(rotation);
  const nextIndex = rotationIndex === -1 ? 0 : (rotationIndex + 1) % config.ROTATIONS.length;

  return config.ROTATIONS[nextIndex];
}

export function validatePiecePlacement({
  piece,
  anchor,
  rotation = 0,
  ownerId,
  existingPlacements = [],
  config = PLACEMENT_CONFIG,
}) {
  const errors = [];
  const placedCells = getPlacedCells({ piece, anchor, rotation });

  if (!piece) {
    errors.push('배치할 말을 선택해 주세요.');
  }

  if (!anchor) {
    errors.push('보드에서 배치할 위치를 선택해 주세요.');
  }

  if (piece && existingPlacements.some((placement) => placement.pieceId === piece.id)) {
    errors.push('이미 배치한 말입니다.');
  }

  if (placedCells.some((cell) => !isInsideBoard(cell, config))) {
    errors.push('말이 보드 밖으로 나갑니다.');
  }

  if (placedCells.some((cell) => !isInsideHomeZone(cell, ownerId, config))) {
    errors.push(`${ownerId}P 진영 안에만 배치할 수 있습니다.`);
  }

  const occupiedKeys = new Set(
    existingPlacements.flatMap((placement) => placement.occupiedCells.map(toCellKey)),
  );

  if (placedCells.some((cell) => occupiedKeys.has(toCellKey(cell)))) {
    errors.push('다른 말과 겹칩니다.');
  }

  return {
    valid: errors.length === 0,
    errors,
    occupiedCells: placedCells,
  };
}

export function isPlayerPlacementComplete(pieces, placements) {
  const placedPieceIds = new Set(placements.map((placement) => placement.pieceId));

  return pieces.length > 0 && pieces.every((piece) => placedPieceIds.has(piece.id));
}

function normalizeToOrigin(cells) {
  const normalized = normalizeCells(cells);
  const bounds = getBounds(normalized);

  return normalized
    .map((cell) => ({
      x: cell.x - bounds.minX,
      y: cell.y - bounds.minY,
    }))
    .sort((a, b) => a.y - b.y || a.x - b.x);
}

function getBounds(cells) {
  if (cells.length === 0) {
    return {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
    };
  }

  return cells.reduce(
    (currentBounds, cell) => ({
      minX: Math.min(currentBounds.minX, cell.x),
      maxX: Math.max(currentBounds.maxX, cell.x),
      minY: Math.min(currentBounds.minY, cell.y),
      maxY: Math.max(currentBounds.maxY, cell.y),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  );
}

function rotateCell(cell, bounds, rotation) {
  if (rotation === 90) {
    return {
      x: bounds.maxY - cell.y,
      y: cell.x,
    };
  }

  if (rotation === 180) {
    return {
      x: bounds.maxX - cell.x,
      y: bounds.maxY - cell.y,
    };
  }

  if (rotation === 270) {
    return {
      x: cell.y,
      y: bounds.maxX - cell.x,
    };
  }

  return cell;
}

function isInsideBoard({ x, y }, config) {
  return x >= 0 && x < config.BOARD_COLUMNS && y >= 0 && y < config.BOARD_ROWS;
}

function isInsideHomeZone({ y }, ownerId, config) {
  if (ownerId === 1) {
    return y < config.HOME_ROWS;
  }

  return y >= config.BOARD_ROWS - config.HOME_ROWS;
}
