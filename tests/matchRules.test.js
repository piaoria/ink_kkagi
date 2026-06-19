import { describe, expect, it } from 'vitest';
import { getMatchResult, getRemainingPieceCount } from '../src/match/matchRules.js';

describe('match rules', () => {
  it('counts remaining placed pieces', () => {
    expect(
      getRemainingPieceCount(
        {
          1: [{ pieceId: 'p1-piece-1' }, { pieceId: 'p1-piece-2' }],
          2: [],
        },
        1,
      ),
    ).toBe(2);
  });

  it('keeps the match active while both players have pieces', () => {
    expect(
      getMatchResult({
        1: [{ pieceId: 'p1-piece-1' }],
        2: [{ pieceId: 'p2-piece-1' }],
      }),
    ).toEqual({
      finished: false,
      winnerId: null,
      draw: false,
    });
  });

  it('awards victory to the player with remaining pieces', () => {
    expect(
      getMatchResult({
        1: [{ pieceId: 'p1-piece-1' }],
        2: [],
      }),
    ).toEqual({
      finished: true,
      winnerId: 1,
      draw: false,
    });
  });

  it('declares a draw when both players lose every piece together', () => {
    expect(
      getMatchResult({
        1: [],
        2: [],
      }),
    ).toEqual({
      finished: true,
      winnerId: null,
      draw: true,
    });
  });
});
