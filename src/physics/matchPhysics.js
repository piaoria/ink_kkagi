import * as planck from 'planck';
import { PLACEMENT_CONFIG } from '../config/gameConfig.js';
import { PHYSICS_CONFIG } from '../config/physicsConfig.js';
import { getLaunchVector } from '../match/aiming.js';
import { getPlacementPose } from '../match/boardOccupancy.js';

const CELL_HALF_SIZE = 0.38;

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
  const launchSpeed = launch.power * config.MAX_LAUNCH_SPEED;
  const launchMass = launchBody.getMass();
  const impulse = planck.Vec2(
    launch.x * launchSpeed * launchMass,
    launch.y * launchSpeed * launchMass,
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
  const centersByPieceId = new Map();

  for (const ownerId of [1, 2]) {
    for (const placement of playerPlacements[ownerId] ?? []) {
      const centroid = getCentroid(placement.occupiedCells);
      const pose = getPlacementPose(placement);
      const body = world.createBody({
        type: 'dynamic',
        position: planck.Vec2(centroid.x + pose.x, centroid.y + pose.y),
        angle: pose.angle,
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
      centersByPieceId.set(placement.pieceId, centroid);
    }
  }

  return {
    world,
    bodiesByPieceId,
    localCellsByPieceId,
    centersByPieceId,
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
      const center = worldState.centersByPieceId.get(placement.pieceId);

      if (isBodyOutsideBoard(body, localCells, boardConfig)) {
        knockedOutPieceIds.push(placement.pieceId);
        continue;
      }

      const bodyPosition = body.getPosition();
      nextPlacements[ownerId].push({
        ...placement,
        pose: {
          x: bodyPosition.x - center.x,
          y: bodyPosition.y - center.y,
          angle: body.getAngle(),
        },
      });
    }
  }

  return {
    playerPlacements: nextPlacements,
    knockedOutPieceIds,
  };
}

function isBodyOutsideBoard(body, localCells, boardConfig) {
  return localCells.every((localCell) => {
    const point = body.getWorldPoint(planck.Vec2(localCell.x, localCell.y));

    return (
      point.x < 0 ||
      point.x >= boardConfig.BOARD_COLUMNS ||
      point.y < 0 ||
      point.y >= boardConfig.BOARD_ROWS
    );
  });
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
