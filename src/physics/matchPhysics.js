import * as planck from 'planck';
import { PLACEMENT_CONFIG } from '../config/gameConfig.js';
import { PHYSICS_CONFIG } from '../config/physicsConfig.js';
import { getLaunchVector } from '../match/aiming.js';

const CELL_HALF_SIZE = 0.46;

export function simulateLaunch({
  playerPlacements,
  selectedPieceId,
  aimVector,
  config = PHYSICS_CONFIG,
  boardConfig = PLACEMENT_CONFIG,
  stepCount = 90,
}) {
  const worldState = createWorldFromPlacements(playerPlacements, config);
  const launchBody = worldState.bodiesByPieceId.get(selectedPieceId);

  if (!launchBody) {
    return {
      playerPlacements,
      knockedOutPieceIds: [],
    };
  }

  const launch = getLaunchVector(aimVector, config.MAX_DRAG_DISTANCE);
  const impulse = planck.Vec2(
    launch.x * launch.power * config.MAX_IMPULSE,
    launch.y * launch.power * config.MAX_IMPULSE,
  );

  launchBody.applyLinearImpulse(impulse, launchBody.getWorldCenter(), true);

  for (let step = 0; step < stepCount; step += 1) {
    worldState.world.step(config.FIXED_TIME_STEP);
  }

  return projectWorldToPlacements(worldState, playerPlacements, boardConfig);
}

export function createWorldFromPlacements(playerPlacements, config = PHYSICS_CONFIG) {
  const world = new planck.World({
    gravity: planck.Vec2(0, 0),
  });
  const bodiesByPieceId = new Map();
  const localCellsByPieceId = new Map();

  for (const ownerId of [1, 2]) {
    for (const placement of playerPlacements[ownerId] ?? []) {
      const centroid = getCentroid(placement.occupiedCells);
      const body = world.createBody({
        type: 'dynamic',
        position: planck.Vec2(centroid.x, centroid.y),
        linearDamping: config.LINEAR_DAMPING,
        angularDamping: config.ANGULAR_DAMPING,
      });
      const localCells = placement.occupiedCells.map((cell) => ({
        x: cell.x - centroid.x,
        y: cell.y - centroid.y,
      }));

      for (const localCell of localCells) {
        body.createFixture({
          shape: planck.Box(CELL_HALF_SIZE, CELL_HALF_SIZE, planck.Vec2(localCell.x, localCell.y), 0),
          density: 1,
          friction: config.FIXTURE_FRICTION,
          restitution: config.FIXTURE_RESTITUTION,
        });
      }

      bodiesByPieceId.set(placement.pieceId, body);
      localCellsByPieceId.set(placement.pieceId, localCells);
    }
  }

  return {
    world,
    bodiesByPieceId,
    localCellsByPieceId,
  };
}

function projectWorldToPlacements(worldState, originalPlacements, boardConfig) {
  const nextPlacements = {
    1: [],
    2: [],
  };
  const knockedOutPieceIds = [];

  for (const ownerId of [1, 2]) {
    for (const placement of originalPlacements[ownerId] ?? []) {
      const body = worldState.bodiesByPieceId.get(placement.pieceId);
      const localCells = worldState.localCellsByPieceId.get(placement.pieceId);
      const occupiedCells = localCells.map((localCell) => {
        const worldPoint = body.getWorldPoint(planck.Vec2(localCell.x, localCell.y));

        return {
          x: Math.round(worldPoint.x),
          y: Math.round(worldPoint.y),
        };
      });

      if (occupiedCells.every((cell) => isOutsideBoard(cell, boardConfig))) {
        knockedOutPieceIds.push(placement.pieceId);
        continue;
      }

      nextPlacements[ownerId].push({
        ...placement,
        occupiedCells: dedupeCells(occupiedCells),
      });
    }
  }

  return {
    playerPlacements: nextPlacements,
    knockedOutPieceIds,
  };
}

function getCentroid(cells) {
  const total = cells.reduce(
    (sum, cell) => ({
      x: sum.x + cell.x,
      y: sum.y + cell.y,
    }),
    { x: 0, y: 0 },
  );

  return {
    x: total.x / cells.length,
    y: total.y / cells.length,
  };
}

function dedupeCells(cells) {
  const seen = new Set();
  const deduped = [];

  for (const cell of cells) {
    const key = `${cell.x},${cell.y}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(cell);
    }
  }

  return deduped;
}

function isOutsideBoard({ x, y }, boardConfig) {
  return x < 0 || x >= boardConfig.BOARD_COLUMNS || y < 0 || y >= boardConfig.BOARD_ROWS;
}
