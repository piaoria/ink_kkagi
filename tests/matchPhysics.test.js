import { describe, expect, it } from 'vitest';
import { PHYSICS_CONFIG } from '../src/config/physicsConfig.js';
import { simulateLaunch } from '../src/physics/matchPhysics.js';

const makePlacement = (pieceId, ownerId, occupiedCells) => ({
  pieceId,
  ownerId,
  anchor: occupiedCells[0],
  rotation: 0,
  occupiedCells,
});

const getPose = (result, ownerId = 1, index = 0) => result.playerPlacements[ownerId][index].pose;

describe('match physics', () => {
  it('moves the selected piece in the launch direction with a continuous pose', () => {
    const result = simulateLaunch({
      playerPlacements: {
        1: [makePlacement('p1-piece-1', 1, [{ x: 4, y: 4 }])],
        2: [],
      },
      selectedPieceId: 'p1-piece-1',
      aimVector: { x: -120, y: 0 },
      stepCount: 45,
    });

    expect(getPose(result).x).toBeGreaterThan(1);
    expect(getPose(result).x % 1).not.toBe(0);
  });

  it('gives small and large pieces comparable launch distance at the same power', () => {
    const smallResult = simulateLaunch({
      playerPlacements: {
        1: [makePlacement('small', 1, [{ x: 2, y: 4 }])],
        2: [],
      },
      selectedPieceId: 'small',
      aimVector: { x: -180, y: 0 },
      stepCount: 30,
    });
    const largeResult = simulateLaunch({
      playerPlacements: {
        1: [
          makePlacement('large', 1, [
            { x: 2, y: 4 },
            { x: 3, y: 4 },
            { x: 4, y: 4 },
            { x: 5, y: 4 },
            { x: 6, y: 4 },
            { x: 7, y: 4 },
            { x: 8, y: 4 },
          ]),
        ],
        2: [],
      },
      selectedPieceId: 'large',
      aimVector: { x: -180, y: 0 },
      stepCount: 30,
    });

    expect(getPose(smallResult).x).toBeGreaterThan(2);
    expect(getPose(largeResult).x).toBeCloseTo(getPose(smallResult).x, 6);
  });

  it('keeps diagonal launch coordinates without snapping them to a grid', () => {
    const result = simulateLaunch({
      playerPlacements: {
        1: [makePlacement('p1-piece-1', 1, [{ x: 4, y: 4 }])],
        2: [],
      },
      selectedPieceId: 'p1-piece-1',
      aimVector: { x: -180, y: -180 },
      stepCount: 30,
    });

    expect(getPose(result).x).toBeGreaterThan(1);
    expect(getPose(result).y).toBeGreaterThan(1);
    expect(getPose(result).x).toBeCloseTo(getPose(result).y, 6);
  });

  it('captures replay frames with an updated pose', () => {
    const result = simulateLaunch({
      playerPlacements: {
        1: [makePlacement('p1-piece-1', 1, [{ x: 4, y: 4 }])],
        2: [],
      },
      selectedPieceId: 'p1-piece-1',
      aimVector: { x: -120, y: 0 },
      stepCount: 40,
      frameCount: 4,
    });

    expect(result.frames).toHaveLength(4);
    expect(getPose(result.frames.at(-1)).x).toBeGreaterThan(1);
  });

  it('keeps the original ink shape while the pose moves continuously', () => {
    const cells = [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 3, y: 3 },
      { x: 3, y: 4 },
    ];
    const result = simulateLaunch({
      playerPlacements: { 1: [makePlacement('p1-piece-1', 1, cells)], 2: [] },
      selectedPieceId: 'p1-piece-1',
      aimVector: { x: -120, y: -80 },
      stepCount: 30,
    });

    expect(result.playerPlacements[1][0].occupiedCells).toEqual(cells);
    expect(getPose(result).angle).toBeTypeOf('number');
  });

  it('removes a piece when every part leaves the board', () => {
    const result = simulateLaunch({
      playerPlacements: {
        1: [makePlacement('p1-piece-1', 1, [{ x: 13, y: 5 }])],
        2: [],
      },
      selectedPieceId: 'p1-piece-1',
      aimVector: { x: -180, y: 0 },
      stepCount: 160,
    });

    expect(result.playerPlacements[1]).toHaveLength(0);
    expect(result.knockedOutPieceIds).toContain('p1-piece-1');
  });

  it('can preserve a sub-cell launch distance for a short physics step', () => {
    const result = simulateLaunch({
      playerPlacements: {
        1: [makePlacement('p1-piece-1', 1, [{ x: 4, y: 4 }])],
        2: [],
      },
      selectedPieceId: 'p1-piece-1',
      aimVector: { x: -180, y: 0 },
      stepCount: 1,
      config: {
        ...PHYSICS_CONFIG,
        LINEAR_DAMPING: 0,
        MAX_LAUNCH_SPEED: 3,
      },
    });

    expect(getPose(result).x).toBeCloseTo(0.05, 6);
  });
});
