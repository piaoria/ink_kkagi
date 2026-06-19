import { toCellKey } from '../drawing/drawingValidation.js';

export function buildBoardOccupancy(playerPlacements) {
  const occupancy = new Map();

  for (const ownerId of [1, 2]) {
    for (const placement of playerPlacements[ownerId] ?? []) {
      for (const cell of placement.occupiedCells) {
        occupancy.set(toCellKey(cell), {
          ownerId,
          pieceId: placement.pieceId,
        });
      }
    }
  }

  return occupancy;
}

export function getPlacedPieceIds(playerPlacements, ownerId) {
  return new Set((playerPlacements[ownerId] ?? []).map((placement) => placement.pieceId));
}

export function getActivePieces(playerPieces, playerPlacements, activePlayerId) {
  const placedPieceIds = getPlacedPieceIds(playerPlacements, activePlayerId);

  return (playerPieces[activePlayerId] ?? []).filter((piece) => placedPieceIds.has(piece.id));
}

export function getPlacementByPieceId(playerPlacements, pieceId) {
  for (const ownerId of [1, 2]) {
    const placement = (playerPlacements[ownerId] ?? []).find(
      (candidate) => candidate.pieceId === pieceId,
    );

    if (placement) {
      return placement;
    }
  }

  return null;
}

export function getPieceCenter(playerPlacements, pieceId) {
  const placement = getPlacementByPieceId(playerPlacements, pieceId);

  if (!placement || placement.occupiedCells.length === 0) {
    return null;
  }

  const total = placement.occupiedCells.reduce(
    (sum, cell) => ({
      x: sum.x + cell.x,
      y: sum.y + cell.y,
    }),
    { x: 0, y: 0 },
  );

  return {
    x: total.x / placement.occupiedCells.length,
    y: total.y / placement.occupiedCells.length,
  };
}

export function getPieceCenterPercent(playerPlacements, pieceId, boardConfig) {
  const center = getPieceCenter(playerPlacements, pieceId);

  if (!center) {
    return {
      x: 50,
      y: 50,
    };
  }

  return {
    x: ((center.x + 0.5) / boardConfig.BOARD_COLUMNS) * 100,
    y: ((center.y + 0.5) / boardConfig.BOARD_ROWS) * 100,
  };
}
