import { MATCH_RENDER_CONFIG } from '../config/gameConfig.js';
import { getPlacementPose } from './boardOccupancy.js';

export function applyImpactDamage(playerPlacements, impacts) {
  const placementsByPieceId = new Map();
  for (const ownerId of [1, 2]) {
    for (const placement of playerPlacements[ownerId] ?? []) {
      placementsByPieceId.set(placement.pieceId, clonePlacement(placement));
    }
  }

  for (const impact of impacts) {
    for (const pieceId of impact.pieceIds ?? []) {
      const placement = placementsByPieceId.get(pieceId);
      if (!placement) continue;
      damageClosestBlock(placement, impact);
    }
  }

  const nextPlacements = { 1: [], 2: [] };
  const destroyedPieceIds = [];
  const fragmentedPieceIds = [];

  for (const placement of placementsByPieceId.values()) {
    const survivingCells = placement.occupiedCells.filter(
      (cell) => placement.durability[toKey(cell)] > 0,
    );
    if (survivingCells.length === 0) {
      destroyedPieceIds.push(placement.pieceId);
      continue;
    }

    const components = splitConnectedCells(survivingCells);
    if (components.length > 1) fragmentedPieceIds.push(placement.pieceId);
    nextPlacements[placement.ownerId].push(
      ...components.map((component, index) => createFragment(placement, component, index)),
    );
  }

  return { playerPlacements: nextPlacements, destroyedPieceIds, fragmentedPieceIds };
}

function clonePlacement(placement) {
  const durability = Object.fromEntries(
    placement.occupiedCells.map((cell) => [
      toKey(cell),
      placement.durability?.[toKey(cell)] ?? MATCH_RENDER_CONFIG.BLOCK_DURABILITY,
    ]),
  );
  return { ...placement, durability };
}

function damageClosestBlock(placement, impact) {
  const center = getCenter(placement.occupiedCells);
  const pose = getPlacementPose(placement);
  const localImpact = rotate(
    {
      x: impact.x - (center.x + pose.x),
      y: impact.y - (center.y + pose.y),
    },
    -pose.angle,
  );
  const closestCell = placement.occupiedCells.reduce((closest, cell) => {
    const distance = Math.hypot(localImpact.x - (cell.x - center.x), localImpact.y - (cell.y - center.y));
    return !closest || distance < closest.distance ? { cell, distance } : closest;
  }, null);
  if (!closestCell) return;

  const damage = impact.strength >= 0.75 ? 2 : 1;
  const key = toKey(closestCell.cell);
  placement.durability[key] = Math.max(0, placement.durability[key] - damage);
}

function splitConnectedCells(cells) {
  const remaining = new Map(cells.map((cell) => [toKey(cell), cell]));
  const components = [];

  while (remaining.size > 0) {
    const [firstKey, firstCell] = remaining.entries().next().value;
    remaining.delete(firstKey);
    const component = [firstCell];
    const queue = [firstCell];
    while (queue.length > 0) {
      const cell = queue.shift();
      for (const neighbor of [
        { x: cell.x + 1, y: cell.y },
        { x: cell.x - 1, y: cell.y },
        { x: cell.x, y: cell.y + 1 },
        { x: cell.x, y: cell.y - 1 },
      ]) {
        const key = toKey(neighbor);
        const next = remaining.get(key);
        if (next) {
          remaining.delete(key);
          component.push(next);
          queue.push(next);
        }
      }
    }
    components.push(component);
  }

  return components;
}

function createFragment(placement, cells, index) {
  const originalCenter = getCenter(placement.occupiedCells);
  const fragmentCenter = getCenter(cells);
  const pose = getPlacementPose(placement);
  const rotatedOffset = rotate(
    { x: fragmentCenter.x - originalCenter.x, y: fragmentCenter.y - originalCenter.y },
    pose.angle,
  );
  const worldCenter = {
    x: originalCenter.x + pose.x + rotatedOffset.x,
    y: originalCenter.y + pose.y + rotatedOffset.y,
  };
  const durability = Object.fromEntries(cells.map((cell) => [toKey(cell), placement.durability[toKey(cell)]]));

  return {
    ...placement,
    pieceId: index === 0 ? placement.pieceId : `${placement.pieceId}-fragment-${index + 1}`,
    anchor: cells[0],
    occupiedCells: cells,
    durability,
    pose: {
      x: worldCenter.x - fragmentCenter.x,
      y: worldCenter.y - fragmentCenter.y,
      angle: pose.angle,
    },
  };
}

function getCenter(cells) {
  const total = cells.reduce((sum, cell) => ({ x: sum.x + cell.x, y: sum.y + cell.y }), { x: 0, y: 0 });
  return { x: total.x / cells.length, y: total.y / cells.length };
}

function rotate(vector, angle) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return {
    x: vector.x * cosine - vector.y * sine,
    y: vector.x * sine + vector.y * cosine,
  };
}

function toKey({ x, y }) {
  return `${x},${y}`;
}
