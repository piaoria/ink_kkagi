import * as planck from 'planck';
import { PLACEMENT_CONFIG } from '../config/gameConfig.js';
import { PHYSICS_CONFIG } from '../config/physicsConfig.js';
import { getLaunchVector } from '../match/aiming.js';
import { getPlacementPose } from '../match/boardOccupancy.js';
import { applyImpactDamage } from '../match/pieceDamage.js';

const CELL_HALF_SIZE = 0.38;

export function simulateLaunch({
  playerPlacements,
  selectedPieceId,
  aimVector,
  gripCell = null,
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

  launchBody.applyLinearImpulse(
    impulse,
    getGripWorldPoint(worldState, selectedPieceId, gripCell) ?? launchBody.getWorldCenter(),
    true,
  );

  const frames = [];
  const impacts = [];
  const damagedPairs = new Set();
  let capturedImpactCount = 0;
  const captureEvery = frameCount > 0 ? Math.max(1, Math.ceil(stepCount / frameCount)) : 0;
  const stableStepsRequired = Math.ceil(
    config.STOP_STABLE_TIME_MS / (config.FIXED_TIME_STEP * 1000),
  );
  let stableSteps = 0;
  let executedSteps = 0;

  worldState.world.on('begin-contact', (contact) => {
    const firstBody = contact.getFixtureA().getBody();
    const secondBody = contact.getFixtureB().getBody();
    const firstPiece = firstBody.getUserData()?.pieceId;
    const secondPiece = secondBody.getUserData()?.pieceId;

    if (!firstPiece || !secondPiece || firstPiece === secondPiece) {
      return;
    }

    const pairKey = [firstPiece, secondPiece].sort().join(':');
    if (damagedPairs.has(pairKey)) {
      return;
    }
    damagedPairs.add(pairKey);

    const firstPoint = getFixtureCenter(contact.getFixtureA());
    const secondPoint = getFixtureCenter(contact.getFixtureB());
    const firstVelocity = firstBody.getLinearVelocity();
    const secondVelocity = secondBody.getLinearVelocity();
    const relativeSpeed = Math.hypot(
      firstVelocity.x - secondVelocity.x,
      firstVelocity.y - secondVelocity.y,
    );
    const reducedMass =
      (firstBody.getMass() * secondBody.getMass()) / (firstBody.getMass() + secondBody.getMass());
    impacts.push({
      x: (firstPoint.x + secondPoint.x) / 2,
      y: (firstPoint.y + secondPoint.y) / 2,
      strength: Math.min(1, (relativeSpeed * Math.sqrt(reducedMass)) / 14),
      pieceIds: [firstPiece, secondPiece],
    });
  });

  for (let step = 0; step < stepCount; step += 1) {
    worldState.world.step(config.FIXED_TIME_STEP);
    executedSteps = step + 1;

    stableSteps = isWorldStable(worldState, config) ? stableSteps + 1 : 0;

    if (captureEvery > 0 && (step + 1) % captureEvery === 0) {
      const frame = projectWorldToPlacements(worldState, playerPlacements, boardConfig);
      frame.impacts = impacts.slice(capturedImpactCount);
      capturedImpactCount = impacts.length;
      frames.push(frame);
    }

    if (stableSteps >= stableStepsRequired) {
      break;
    }
  }

  const result = projectWorldToPlacements(worldState, playerPlacements, boardConfig);
  if (frameCount > 0 && executedSteps % captureEvery !== 0) {
    result.impacts = impacts.slice(capturedImpactCount);
    frames.push(result);
  }
  const damage = applyImpactDamage(result.playerPlacements, impacts);
  const finalResult = {
    ...result,
    playerPlacements: damage.playerPlacements,
    knockedOutPieceIds: [...result.knockedOutPieceIds, ...damage.destroyedPieceIds],
    fragmentedPieceIds: damage.fragmentedPieceIds,
  };

  if (frameCount > 0 && (damage.destroyedPieceIds.length > 0 || damage.fragmentedPieceIds.length > 0)) {
    for (let index = 0; index < 6; index += 1) {
      frames.push({
        ...finalResult,
        impacts: index === 0 ? impacts.slice(capturedImpactCount) : [],
      });
    }
  }

  return {
    ...finalResult,
    frames,
    impacts: impacts.slice(capturedImpactCount),
  };
}

function getGripWorldPoint(worldState, pieceId, gripCell) {
  if (!gripCell) return null;
  const body = worldState.bodiesByPieceId.get(pieceId);
  const center = worldState.centersByPieceId.get(pieceId);
  if (!body || !center) return null;

  return body.getWorldPoint(planck.Vec2(gripCell.x - center.x, gripCell.y - center.y));
}

function getFixtureCenter(fixture) {
  const bounds = fixture.getAABB(0);
  return {
    x: (bounds.lowerBound.x + bounds.upperBound.x) / 2,
    y: (bounds.lowerBound.y + bounds.upperBound.y) / 2,
  };
}

function isWorldStable(worldState, config) {
  return [...worldState.bodiesByPieceId.values()].every((body) => {
    const velocity = body.getLinearVelocity();
    return (
      Math.hypot(velocity.x, velocity.y) <= config.STOP_LINEAR_SPEED &&
      Math.abs(body.getAngularVelocity()) <= config.STOP_ANGULAR_SPEED
    );
  });
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
      body.setUserData({ pieceId: placement.pieceId });
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
      const center = worldState.centersByPieceId.get(placement.pieceId);

      if (isCenterOutsideBoard(body, boardConfig)) {
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

function isCenterOutsideBoard(body, boardConfig) {
  const position = body.getPosition();

  return (
    position.x < -0.5 ||
    position.x > boardConfig.BOARD_COLUMNS - 0.5 ||
    position.y < -0.5 ||
    position.y > boardConfig.BOARD_ROWS - 0.5
  );
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
