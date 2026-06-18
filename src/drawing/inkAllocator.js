import { DRAWING_CONFIG } from '../config/gameConfig.js';

export function getUsedInk(completedPieces) {
  return completedPieces.reduce((sum, piece) => sum + piece.pixelCount, 0);
}

export function getRemainingInk(completedPieces, config = DRAWING_CONFIG) {
  return config.TOTAL_INK - getUsedInk(completedPieces);
}

export function getCurrentPieceNumber(completedPieces) {
  return completedPieces.length + 1;
}

export function getMaxInkForCurrentPiece(completedPieces, config = DRAWING_CONFIG) {
  const remainingInk = getRemainingInk(completedPieces, config);
  const remainingPiecesAfterCurrent =
    config.PIECES_PER_PLAYER - completedPieces.length - 1;
  const reservedForFuturePieces = remainingPiecesAfterCurrent * config.MIN_INK_PER_PIECE;

  return Math.min(config.MAX_INK_PER_PIECE, remainingInk - reservedForFuturePieces);
}

export function getMinInkForCurrentPiece(completedPieces, config = DRAWING_CONFIG) {
  const remainingInk = getRemainingInk(completedPieces, config);
  const remainingPiecesAfterCurrent =
    config.PIECES_PER_PLAYER - completedPieces.length - 1;
  const futureMaximumInk = remainingPiecesAfterCurrent * config.MAX_INK_PER_PIECE;

  return Math.max(config.MIN_INK_PER_PIECE, remainingInk - futureMaximumInk);
}

export function isPlayerDrawingComplete(completedPieces, config = DRAWING_CONFIG) {
  return (
    completedPieces.length === config.PIECES_PER_PLAYER &&
    getRemainingInk(completedPieces, config) === 0
  );
}
