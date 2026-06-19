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
  frameCount = 0,
}) {
  const worldState = createWorldFromPlacements(playerPlacements, config);
  const launchBody = worldState.bodiesByPieceId.get(selectedPieceId);

  if (!launchBody) {
    return {
      playerPlacements,
      knockedOutPieceIds: [],
      frames: [],
    };
  }

  const launch = getLaunchVector(aimVector, config.MAX_DRAG_DISTANCE);
  const impulse = planck.Vec2(
    launch.x * launch.power * config.MAX_IMPULSE,
    launch.y * launch.power * config.MAX_IMPULSE,
  );

  launchBody.applyLinearImpulse(impulse, launchBody.getWorldCenter(), true);

  const frames = [];
  const captureEvery = frameCount > 0 ? Math.max(1, Math.floor(stepCount / frameCount)) : 0;

  for (let step = 0; step < stepCount; step += 1) {
    worldState.world.step(config.FIXED_TIME_STEP);

    if (captureEvery > 0 && (step + 1) % captureEvery === 0) {
      frames.push(projectWorldToPlacements(worldState, playerPlacements, boardConfig));
    }
  }

  const result = projectWorldToPlacements(worldState, playerPlacements, boardConfig);

  return {
    ...result,
    frames,
  };
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
      const projectedCells = localCells.map((localCell) => {
        const worldPoint = body.getWorldPoint(planck.Vec2(localCell.x, localCell.y));

        return {
          x: Math.round(worldPoint.x),
          y: Math.round(worldPoint.y),
        };
      });

      if (projectedCells.every((cell) => isOutsideBoard(cell, boardConfig))) {
        knockedOutPieceIds.push(placement.pieceId);
        continue;
      }

      const occupiedCells = snapPieceToBoard({
        placement,
        bodyPosition: body.getPosition(),
        boardConfig,
      });

      nextPlacements[ownerId].push({
        ...placement,
        anchor: occupiedCells[0],
        occupiedCells,
      });
    }
  }

  return {
    playerPlacements: nextPlacements,
    knockedOutPieceIds,
  };
}

export function snapPieceToBoard({ placement, bodyPosition, boardConfig = PLACEMENT_CONFIG }) {
  const originalCenter = getCentroid(placement.occupiedCells);
  const requestedOffset = {
    x: Math.round(bodyPosition.x - originalCenter.x),
    y: Math.round(bodyPosition.y - originalCenter.y),
  };
  const boundedOffset = clampOffsetToBoard(placement.occupiedCells, requestedOffset, boardConfig);

  return placement.occupiedCells.map((cell) => ({
    x: cell.x + boundedOffset.x,
    y: cell.y + boundedOffset.y,
  }));
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

function clampOffsetToBoard(cells, offset, boardConfig) {
  const bounds = getBounds(cells);

  return {
    x: clamp(offset.x, -bounds.minX, boardConfig.BOARD_COLUMNS - 1 - bounds.maxX),
    y: clamp(offset.y, -bounds.minY, boardConfig.BOARD_ROWS - 1 - bounds.maxY),
  };
}

function getBounds(cells) {
  return cells.reduce(
    (bounds, cell) => ({
      minX: Math.min(bounds.minX, cell.x),
      maxX: Math.max(bounds.maxX, cell.x),
      minY: Math.min(bounds.minY, cell.y),
      maxY: Math.max(bounds.maxY, cell.y),
    }),
    {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
    },
  );
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function isOutsideBoard({ x, y }, boardConfig) {
  return x < 0 || x >= boardConfig.BOARD_COLUMNS || y < 0 || y >= boardConfig.BOARD_ROWS;
}
