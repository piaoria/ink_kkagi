import { MATCH_RENDER_CONFIG, PLACEMENT_CONFIG, PLAYER_COLORS } from '../config/gameConfig.js';
import {
  clampAimVector,
  getAimPower,
  getLaunchVector,
  isLaunchReady,
  setAimPower,
} from './aiming.js';
import { getPlacementPose } from './boardOccupancy.js';

const PIECE_SCALE = 0.76;

export function createMatchCanvas({ board, state, onSelectPiece, onAimChange, onFire }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'match-canvas';
  canvas.tabIndex = 0;
  board.append(canvas);

  const context = canvas.getContext('2d');
  let currentState = state;
  let dragStart = null;
  let hoverPieceId = null;
  let particles = [];
  let size = { width: 0, height: 0, unit: 0 };

  const resize = () => {
    const width = board.clientWidth;
    const height = board.clientHeight;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    size = { width, height, unit: width / PLACEMENT_CONFIG.BOARD_COLUMNS };
    draw();
  };

  const observer = new window.ResizeObserver(resize);
  observer.observe(board);

  canvas.addEventListener('pointerdown', (event) => {
    if (currentState.isSimulating) return;
    const point = getBoardPoint(event);
    const piece = getPieceAtPoint(point);

    if (!piece || piece.ownerId !== currentState.activePlayerId) return;
    if (piece.pieceId !== currentState.selectedPieceId) {
      onSelectPiece(piece.pieceId);
      return;
    }

    dragStart = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('is-dragging');
  });

  canvas.addEventListener('pointermove', (event) => {
    if (dragStart) {
      const aimVector = clampAimVector({
        x: event.clientX - dragStart.x,
        y: event.clientY - dragStart.y,
      });
      currentState = { ...currentState, aimVector };
      onAimChange(aimVector);
      draw();
      return;
    }

    const piece = getPieceAtPoint(getBoardPoint(event));
    hoverPieceId = piece?.ownerId === currentState.activePlayerId ? piece.pieceId : null;
    updateCursor();
    draw();
  });

  const stopDrag = () => {
    dragStart = null;
    canvas.classList.remove('is-dragging');
    updateCursor();
  };
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);
  canvas.addEventListener('keydown', (event) => {
    if (currentState.isSimulating || !currentState.selectedPieceId) return;

    if (event.key === 'Enter' && isLaunchReady(currentState.aimVector)) {
      event.preventDefault();
      onFire();
      return;
    }

    if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || getAimPower(currentState.aimVector) === 0) {
      return;
    }

    event.preventDefault();
    const nextPower = Math.min(
      1,
      Math.max(0.08, getAimPower(currentState.aimVector) + (event.key === 'ArrowRight' ? 0.01 : -0.01)),
    );
    const aimVector = setAimPower(currentState.aimVector, nextPower);
    currentState = { ...currentState, aimVector };
    onAimChange(aimVector);
    draw();
  });

  const update = (nextState) => {
    currentState = { ...currentState, ...nextState };
    for (const impact of nextState.impacts ?? []) {
      particles.push({ ...impact, life: 16 });
    }
    particles = particles.filter((particle) => particle.life > 0);
    updateCursor();
    draw();
  };

  const destroy = () => observer.disconnect();

  function draw() {
    if (size.width === 0 || size.height === 0) return;
    context.clearRect(0, 0, size.width, size.height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, size.width, size.height);
    drawFineGrid();
    drawPieces();
    drawAim();
    drawParticles();
  }

  function drawFineGrid() {
    const fineUnit = size.unit / MATCH_RENDER_CONFIG.FINE_GRID_SCALE;
    context.strokeStyle = 'rgba(18, 22, 27, 0.13)';
    context.lineWidth = 1;
    context.beginPath();
    for (let x = 0; x <= PLACEMENT_CONFIG.BOARD_COLUMNS; x += 0.25) {
      context.moveTo(x * size.unit, 0);
      context.lineTo(x * size.unit, size.height);
    }
    for (let y = 0; y <= PLACEMENT_CONFIG.BOARD_ROWS; y += 0.25) {
      context.moveTo(0, y * size.unit);
      context.lineTo(size.width, y * size.unit);
    }
    context.stroke();
    void fineUnit;
  }

  function drawPieces() {
    for (const ownerId of [1, 2]) {
      for (const placement of currentState.playerPlacements[ownerId] ?? []) {
        drawPiece(placement);
      }
    }
  }

  function drawPiece(placement) {
    const center = getOriginalCenter(placement.occupiedCells);
    const pose = getPlacementPose(placement);
    const selected = placement.pieceId === currentState.selectedPieceId;
    const hovered = placement.pieceId === hoverPieceId;
    const cellSize = size.unit * PIECE_SCALE;
    context.save();
    context.translate((center.x + pose.x + 0.5) * size.unit, (center.y + pose.y + 0.5) * size.unit);
    context.rotate(pose.angle);
    context.fillStyle = PLAYER_COLORS[placement.ownerId];
    context.strokeStyle = selected || hovered ? '#fff04a' : '#12161b';
    context.lineWidth = selected ? 4 : hovered ? 3 : 2;

    for (const cell of placement.occupiedCells) {
      const x = (cell.x - center.x) * size.unit - cellSize / 2;
      const y = (cell.y - center.y) * size.unit - cellSize / 2;
      context.fillRect(x, y, cellSize, cellSize);
      context.strokeRect(x, y, cellSize, cellSize);
      context.fillStyle = 'rgba(18, 22, 27, 0.16)';
      context.fillRect(x + cellSize * 0.7, y + cellSize * 0.7, cellSize * 0.3, cellSize * 0.3);
      context.fillStyle = PLAYER_COLORS[placement.ownerId];
    }
    context.restore();
  }

  function drawAim() {
    if (!currentState.selectedPieceId || !isLaunchReady(currentState.aimVector)) return;
    const placement = findPlacement(currentState.selectedPieceId);
    if (!placement) return;
    const center = getOriginalCenter(placement.occupiedCells);
    const pose = getPlacementPose(placement);
    const launch = getLaunchVector(currentState.aimVector);
    const startX = (center.x + pose.x + 0.5) * size.unit;
    const startY = (center.y + pose.y + 0.5) * size.unit;
    const length = Math.hypot(currentState.aimVector.x, currentState.aimVector.y);
    const endX = startX + launch.x * length;
    const endY = startY + launch.y * length;
    context.strokeStyle = '#fff04a';
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.stroke();
  }

  function drawParticles() {
    for (const particle of particles) {
      const alpha = particle.life / 16;
      context.fillStyle = `rgba(255, 240, 74, ${alpha})`;
      for (let index = 0; index < 6; index += 1) {
        const angle = (Math.PI * 2 * index) / 6;
        const distance = (16 - particle.life) * 1.7 + 8;
        context.fillRect(
          (particle.x + 0.5) * size.unit + Math.cos(angle) * distance - 2,
          (particle.y + 0.5) * size.unit + Math.sin(angle) * distance - 2,
          4,
          4,
        );
      }
      particle.life -= 1;
    }
  }

  function getBoardPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * PLACEMENT_CONFIG.BOARD_COLUMNS,
      y: ((event.clientY - rect.top) / rect.height) * PLACEMENT_CONFIG.BOARD_ROWS,
    };
  }

  function getPieceAtPoint(point) {
    const pieces = [
      ...(currentState.playerPlacements[2] ?? []),
      ...(currentState.playerPlacements[1] ?? []),
    ];
    return pieces.find((placement) => isPointInsidePiece(point, placement)) ?? null;
  }

  function isPointInsidePiece(point, placement) {
    const center = getOriginalCenter(placement.occupiedCells);
    const pose = getPlacementPose(placement);
    const origin = { x: center.x + pose.x + 0.5, y: center.y + pose.y + 0.5 };
    const cosine = Math.cos(-pose.angle);
    const sine = Math.sin(-pose.angle);
    const translated = { x: point.x - origin.x, y: point.y - origin.y };
    const local = {
      x: translated.x * cosine - translated.y * sine,
      y: translated.x * sine + translated.y * cosine,
    };
    const half = PIECE_SCALE / 2;
    return placement.occupiedCells.some(
      (cell) =>
        Math.abs(local.x - (cell.x - center.x)) <= half &&
        Math.abs(local.y - (cell.y - center.y)) <= half,
    );
  }

  function findPlacement(pieceId) {
    return [1, 2]
      .flatMap((ownerId) => currentState.playerPlacements[ownerId] ?? [])
      .find((placement) => placement.pieceId === pieceId);
  }

  function updateCursor() {
    const selected = Boolean(currentState.selectedPieceId);
    canvas.style.cursor = dragStart ? 'grabbing' : hoverPieceId || selected ? 'grab' : 'default';
  }

  resize();
  return { update, destroy };
}

function getOriginalCenter(cells) {
  const total = cells.reduce(
    (sum, cell) => ({ x: sum.x + cell.x, y: sum.y + cell.y }),
    { x: 0, y: 0 },
  );
  return { x: total.x / cells.length, y: total.y / cells.length };
}
