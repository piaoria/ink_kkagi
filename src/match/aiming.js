import { PHYSICS_CONFIG } from '../config/physicsConfig.js';

export function clampAimVector(vector, maxDistance = PHYSICS_CONFIG.MAX_DRAG_DISTANCE) {
  const magnitude = getVectorMagnitude(vector);

  if (magnitude <= maxDistance || magnitude === 0) {
    return {
      x: vector.x,
      y: vector.y,
    };
  }

  const scale = maxDistance / magnitude;

  return {
    x: vector.x * scale,
    y: vector.y * scale,
  };
}

export function getVectorMagnitude({ x, y }) {
  return Math.hypot(x, y);
}

export function getAimPower(vector, maxDistance = PHYSICS_CONFIG.MAX_DRAG_DISTANCE) {
  return Math.min(1, getVectorMagnitude(vector) / maxDistance);
}

export function getLaunchVector(aimVector, maxDistance = PHYSICS_CONFIG.MAX_DRAG_DISTANCE) {
  const clamped = clampAimVector(aimVector, maxDistance);
  const power = getAimPower(clamped, maxDistance);
  const magnitude = getVectorMagnitude(clamped);

  if (magnitude === 0) {
    return {
      x: 0,
      y: 0,
      power: 0,
    };
  }

  return {
    x: -clamped.x / magnitude,
    y: -clamped.y / magnitude,
    power,
  };
}

export function isLaunchReady(aimVector) {
  return getAimPower(aimVector) >= 0.08;
}
