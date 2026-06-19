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
