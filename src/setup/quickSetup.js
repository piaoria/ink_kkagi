import { DRAWING_CONFIG, PLAYER_COLORS } from '../config/gameConfig.js';
import { validatePiecePlacement } from '../placement/placementValidation.js';

const STARTER_PIECES = [
  [
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 3, y: 1 },
    { x: 4, y: 1 },
    { x: 1, y: 2 },
    { x: 2, y: 2 },
    { x: 3, y: 2 },
    { x: 4, y: 2 },
    { x: 1, y: 3 },
    { x: 2, y: 3 },
    { x: 3, y: 3 },
    { x: 4, y: 3 },
  ],
  [
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 3, y: 1 },
    { x: 1, y: 2 },
    { x: 1, y: 3 },
    { x: 2, y: 3 },
    { x: 3, y: 3 },
    { x: 4, y: 3 },
    { x: 4, y: 4 },
    { x: 4, y: 5 },
    { x: 3, y: 5 },
    { x: 2, y: 5 },
  ],
  [
    { x: 3, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 2 },
    { x: 4, y: 2 },
    { x: 1, y: 3 },
    { x: 2, y: 3 },
    { x: 3, y: 3 },
    { x: 4, y: 3 },
    { x: 5, y: 3 },
    { x: 3, y: 4 },
    { x: 3, y: 5 },
    { x: 2, y: 5 },
  ],
];

export function createStarterPieces(ownerId) {
  return STARTER_PIECES.map((cells, index) => ({
    id: `p${ownerId}-piece-${index + 1}`,
    ownerId,
    cells,
    pixelCount: cells.length,
    color: PLAYER_COLORS[ownerId],
  }));
}

export function createQuickMatchSetup() {
  const playerPieces = {
    1: createStarterPieces(1),
    2: createStarterPieces(2),
  };

  return {
    playerPieces,
    playerPlacements: {
      1: createAutoPlacementsForPlayer({ ownerId: 1, pieces: playerPieces[1] }),
      2: createAutoPlacementsForPlayer({ ownerId: 2, pieces: playerPieces[2] }),
    },
  };
}

export function createAutoPlacementsForPlayer({ ownerId, pieces, existingPlacements = [] }) {
  const placements = [...existingPlacements];

  for (const piece of pieces) {
    if (placements.some((placement) => placement.pieceId === piece.id)) {
      continue;
    }

    const placement = findFirstValidPlacement({ ownerId, piece, existingPlacements: placements });
    if (!placement) {
      throw new Error(`Unable to auto-place ${piece.id}.`);
    }

    placements.push(placement);
  }

  return placements;
}

export function getStarterSetupSummary() {
  return {
    piecesPerPlayer: DRAWING_CONFIG.PIECES_PER_PLAYER,
    inkPerPlayer: DRAWING_CONFIG.TOTAL_INK,
  };
}

function findFirstValidPlacement({ ownerId, piece, existingPlacements }) {
  const preferredRows =
    ownerId === 1
      ? [0, 3, 6, 1, 4, 7]
      : [15, 12, 10, 14, 11, 13];
  const preferredColumns = [0, 5, 9, 2, 7, 4, 10, 1, 6, 8, 3];

  for (const y of preferredRows) {
    for (const x of preferredColumns) {
      for (const rotation of [0, 90, 180, 270]) {
        const validation = validatePiecePlacement({
          piece,
          anchor: { x, y },
          rotation,
          ownerId,
          existingPlacements,
        });

        if (validation.valid) {
          return {
            pieceId: piece.id,
            ownerId,
            anchor: { x, y },
            rotation,
            occupiedCells: validation.occupiedCells,
          };
        }
      }
    }
  }

  return null;
}
