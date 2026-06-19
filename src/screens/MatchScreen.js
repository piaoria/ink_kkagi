import { PHYSICS_CONFIG } from '../config/physicsConfig.js';
import { MATCH_RENDER_CONFIG, PLACEMENT_CONFIG, PLAYER_COLORS } from '../config/gameConfig.js';
import {
  getActivePieces,
  getPlacementPose,
  getPieceCenterPercent,
} from '../match/boardOccupancy.js';
import {
  clampAimVector,
  getAimPower,
  getLaunchVector,
  getVectorMagnitude,
  isLaunchReady,
} from '../match/aiming.js';

export function renderMatchScreen({
  activePlayerId,
  selectedPieceId,
  aimVector,
  lastKnockedOutPieceIds = [],
  playerPieces,
  playerPlacements,
  isSimulating = false,
  onSelectPiece,
  onAimChange,
  onFire,
  onBackToTitle,
}) {
  const screen = document.createElement('main');
  screen.className = 'screen drawing-screen';
  screen.classList.toggle('is-simulating', isSimulating);

  const header = document.createElement('header');
  header.className = 'drawing-header';
  const titleGroup = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'screen-eyebrow';
  eyebrow.textContent = `PLAYER ${activePlayerId} TURN`;
  const title = document.createElement('h1');
  title.className = 'pixel-title';
  title.textContent = '대전';
  titleGroup.append(eyebrow, title);

  const backButton = document.createElement('button');
  backButton.className = 'secondary-action';
  backButton.type = 'button';
  backButton.textContent = '나가기';
  backButton.addEventListener('click', onBackToTitle);
  header.append(titleGroup, backButton);

  const layout = document.createElement('section');
  layout.className = 'placement-layout match-layout';
  const board = document.createElement('div');
  board.className = 'placement-board match-board';
  board.style.setProperty('--board-columns', PLACEMENT_CONFIG.BOARD_COLUMNS);
  board.style.setProperty('--board-rows', PLACEMENT_CONFIG.BOARD_ROWS);
  board.style.setProperty(
    '--fine-grid-columns',
    PLACEMENT_CONFIG.BOARD_COLUMNS * MATCH_RENDER_CONFIG.FINE_GRID_SCALE,
  );
  board.style.setProperty(
    '--fine-grid-rows',
    PLACEMENT_CONFIG.BOARD_ROWS * MATCH_RENDER_CONFIG.FINE_GRID_SCALE,
  );
  board.setAttribute('aria-label', '경기 보드');

  let dragStart = null;
  let currentAimVector = aimVector;
  let powerValue;
  let fireButton;
  let status;
  let aimGuide;

  const syncAimControls = () => {
    const power = getAimPower(currentAimVector);
    const magnitude = getVectorMagnitude(currentAimVector);
    const launchVector = getLaunchVector(currentAimVector);
    const angle = Math.atan2(launchVector.y, launchVector.x);

    aimGuide.style.setProperty('--aim-length', `${Math.max(24, magnitude)}px`);
    aimGuide.style.setProperty('--aim-angle', `${angle}rad`);
    aimGuide.classList.toggle(
      'is-active',
      !isSimulating && selectedPieceId && isLaunchReady(currentAimVector),
    );
    powerValue.textContent = `${Math.round(power * 100)}%`;
    fireButton.disabled = isSimulating || !selectedPieceId || !isLaunchReady(currentAimVector);
    status.className =
      !isSimulating && selectedPieceId && isLaunchReady(currentAimVector)
        ? 'validation-message is-valid'
        : 'validation-message';
    status.textContent = getStatusText({ selectedPieceId, aimVector: currentAimVector, isSimulating });
  };

  const syncAimFromPointer = (event) => {
    if (!dragStart || !selectedPieceId) {
      return;
    }

    currentAimVector = clampAimVector(
      {
        x: event.clientX - dragStart.x,
        y: event.clientY - dragStart.y,
      },
      PHYSICS_CONFIG.MAX_DRAG_DISTANCE,
    );
    onAimChange(currentAimVector);
    syncAimControls();
  };

  board.addEventListener('pointerdown', (event) => {
    if (isSimulating || !selectedPieceId) {
      return;
    }

    event.preventDefault();
    dragStart = { x: event.clientX, y: event.clientY };
    currentAimVector = { x: 0, y: 0 };
    board.setPointerCapture(event.pointerId);
    onAimChange(currentAimVector);
    syncAimControls();
  });
  board.addEventListener('pointermove', (event) => {
    if (dragStart) {
      event.preventDefault();
      syncAimFromPointer(event);
    }
  });
  board.addEventListener('pointerup', () => {
    dragStart = null;
  });
  board.addEventListener('pointercancel', () => {
    dragStart = null;
  });

  const aimOrigin = getPieceCenterPercent(playerPlacements, selectedPieceId, PLACEMENT_CONFIG);
  for (const ownerId of [1, 2]) {
    for (const placement of playerPlacements[ownerId] ?? []) {
      board.append(
        renderMatchPiece({
          placement,
          selectedPieceId,
          activePlayerId,
          isSimulating,
          onSelectPiece,
        }),
      );
    }
  }

  aimGuide = document.createElement('div');
  aimGuide.className = 'aim-guide';
  aimGuide.style.setProperty('--aim-origin-x', `${aimOrigin.x}%`);
  aimGuide.style.setProperty('--aim-origin-y', `${aimOrigin.y}%`);
  board.append(aimGuide);
  board.classList.toggle('is-simulating', isSimulating);

  const panel = document.createElement('aside');
  panel.className = 'drawing-panel placement-panel';
  const turnLabel = createPanelLabel('현재 턴');
  const turnValue = document.createElement('strong');
  turnValue.className = 'ink-count';
  turnValue.textContent = `${activePlayerId}P`;
  const piecesLabel = createPanelLabel('말 선택');
  const pieceList = document.createElement('div');
  pieceList.className = 'placement-piece-list';

  for (const piece of getActivePieces(playerPieces, playerPlacements, activePlayerId)) {
    const button = document.createElement('button');
    button.className = 'placement-piece-button';
    button.classList.toggle('is-active', piece.id === selectedPieceId);
    button.type = 'button';
    button.disabled = isSimulating;
    button.textContent = `${piece.id.split('-').at(-1)}번 말 / ${piece.pixelCount}칸`;
    button.addEventListener('click', () => onSelectPiece(piece.id));
    pieceList.append(button);
  }

  const powerLabel = createPanelLabel('발사 세기');
  powerValue = document.createElement('strong');
  powerValue.className = 'ink-count';
  fireButton = document.createElement('button');
  fireButton.className = 'primary-action';
  fireButton.type = 'button';
  fireButton.textContent = '발사';
  fireButton.addEventListener('click', onFire);
  status = document.createElement('p');
  const lastResult = document.createElement('p');
  lastResult.className =
    lastKnockedOutPieceIds.length > 0 ? 'validation-message is-valid' : 'validation-message';
  lastResult.textContent =
    lastKnockedOutPieceIds.length > 0
      ? `낙장: ${lastKnockedOutPieceIds.join(', ')}`
      : '아직 낙장된 말이 없습니다.';

  panel.append(
    turnLabel,
    turnValue,
    piecesLabel,
    pieceList,
    powerLabel,
    powerValue,
    fireButton,
    status,
    lastResult,
  );
  layout.append(board, panel);
  screen.append(header, layout);
  syncAimControls();

  return screen;
}

function renderMatchPiece({
  placement,
  selectedPieceId,
  activePlayerId,
  isSimulating,
  onSelectPiece,
}) {
  const originalCenter = getOriginalCenter(placement.occupiedCells);
  const pose = getPlacementPose(placement);
  const piece = document.createElement('div');
  piece.className = 'match-piece';
  piece.classList.toggle('is-selected', placement.pieceId === selectedPieceId);
  piece.classList.toggle('is-active-player', placement.ownerId === activePlayerId);
  piece.style.setProperty('--piece-ink', PLAYER_COLORS[placement.ownerId]);
  piece.style.left = `${((originalCenter.x + pose.x + 0.5) / PLACEMENT_CONFIG.BOARD_COLUMNS) * 100}%`;
  piece.style.top = `${((originalCenter.y + pose.y + 0.5) / PLACEMENT_CONFIG.BOARD_ROWS) * 100}%`;
  piece.style.transform = `translate(-50%, -50%) rotate(${pose.angle}rad)`;
  piece.setAttribute('aria-label', `${placement.ownerId}P 말`);

  if (!isSimulating && placement.ownerId === activePlayerId) {
    piece.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      onSelectPiece(placement.pieceId);
    });
  }

  for (const cell of placement.occupiedCells) {
    const inkCell = document.createElement('span');
    inkCell.className = 'match-ink-cell';
    inkCell.style.left = `${(cell.x - originalCenter.x - 0.5) * 100}%`;
    inkCell.style.top = `${(cell.y - originalCenter.y - 0.5) * 100}%`;
    piece.append(inkCell);
  }

  return piece;
}

function createPanelLabel(text) {
  const label = document.createElement('p');
  label.className = 'panel-label';
  label.textContent = text;
  return label;
}

function getOriginalCenter(cells) {
  const total = cells.reduce(
    (sum, cell) => ({ x: sum.x + cell.x, y: sum.y + cell.y }),
    { x: 0, y: 0 },
  );

  return {
    x: total.x / cells.length,
    y: total.y / cells.length,
  };
}

function getStatusText({ selectedPieceId, aimVector, isSimulating }) {
  if (isSimulating) {
    return '발사 결과 계산 중';
  }

  if (!selectedPieceId) {
    return '발사할 말을 선택해 주세요.';
  }

  if (!isLaunchReady(aimVector)) {
    return '보드 위에서 반대 방향으로 끌어 발사 방향과 세기를 정해 주세요.';
  }

  return '발사 준비 완료.';
}
