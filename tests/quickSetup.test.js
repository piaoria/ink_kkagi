import { describe, expect, it } from 'vitest';
import { DRAWING_CONFIG } from '../src/config/gameConfig.js';
import { validatePiecePlacement } from '../src/placement/placementValidation.js';
import {
  createAutoPlacementsForPlayer,
  createQuickMatchSetup,
  createStarterPieces,
} from '../src/setup/quickSetup.js';

describe('quick setup', () => {
  it('creates a full set of starter pieces using all ink', () => {
    const pieces = createStarterPieces(1);

    expect(pieces).toHaveLength(DRAWING_CONFIG.PIECES_PER_PLAYER);
    expect(pieces.reduce((sum, piece) => sum + piece.pixelCount, 0)).toBe(
      DRAWING_CONFIG.TOTAL_INK,
    );
  });

  it('auto-places every starter piece in legal positions', () => {
    const pieces = createStarterPieces(1);
    const placements = createAutoPlacementsForPlayer({ ownerId: 1, pieces });

    expect(placements).toHaveLength(pieces.length);

    for (let index = 0; index < placements.length; index += 1) {
      const placement = placements[index];
      const piece = pieces.find((candidate) => candidate.id === placement.pieceId);
      const previousPlacements = placements.slice(0, index);

      expect(
        validatePiecePlacement({
          piece,
          ownerId: 1,
          anchor: placement.anchor,
          rotation: placement.rotation,
          existingPlacements: previousPlacements,
        }).valid,
      ).toBe(true);
    }
  });

  it('creates ready-to-use quick match pieces and placements for both players', () => {
    const setup = createQuickMatchSetup();

    expect(setup.playerPieces[1]).toHaveLength(DRAWING_CONFIG.PIECES_PER_PLAYER);
    expect(setup.playerPieces[2]).toHaveLength(DRAWING_CONFIG.PIECES_PER_PLAYER);
    expect(setup.playerPlacements[1]).toHaveLength(DRAWING_CONFIG.PIECES_PER_PLAYER);
    expect(setup.playerPlacements[2]).toHaveLength(DRAWING_CONFIG.PIECES_PER_PLAYER);
  });
});
