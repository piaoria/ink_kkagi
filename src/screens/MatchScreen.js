import { PHYSICS_CONFIG } from '../config/physicsConfig.js';
import { PLACEMENT_CONFIG, PLAYER_COLORS } from '../config/gameConfig.js';
import { toCellKey } from '../drawing/drawingValidation.js';
import { buildBoardOccupancy, getActivePieces } from '../match/boardOccupancy.js';
import {
  clampAimVector,
  getAimPower,
  getLaunchVector,
  getVectorMagnitude,
  isLaunchReady,
} from '../match/aiming.js';

/**
 * @param {{
 *   activePlayerId: 1 | 2,
 *   selectedPieceId: string | null,
 *   aimVector: { x: number, y: number },
 *   playerPieces: Record<1 | 2, { id: string, pixelCount: number }[]>,
 *   playerPlacements: Record<1 | 2, { pieceId: string, ownerId: 1 | 2, occupiedCells: { x: number, y: number }[] }[]>,
 *   onSelectPiece: (pieceId: string) => void,
 *   onAimChange: (vector: { x: number, y: number }) => void,
 *   onFire: () => void,
 *   onBackToTitle: () => void,
 * }} params
 * @returns {HTMLElement}
 */
export function renderMatchScreen({
  activePlayerId,
  selectedPieceId,
  aimVector,
  playerPieces,
  playerPlacements,
  onSelectPiece,
  onAimChange,
  onFire,
  onBackToTitle,
}) {
  const screen = document.createElement('main');
  screen.className = 'screen drawing-screen';

  const header = document.createElement('header');
  header.className = 'drawing-header';

  const titleGroup = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'screen-eyebrow';
  eyebrow.textContent = `PLAYER ${activePlayerId} TURN`;

  const title = document.createElement('h1');
  title.className = 'pixel-title';
  title.textContent = '경기';

  titleGroup.append(eyebrow, title);

  const backButton = document.createElement('button');
  backButton.className = 'secondary-action';
  backButton.type = 'button';
  backButton.textContent = '메인';
  backButton.addEventListener('click', onBackToTitle);

  header.append(titleGroup, backButton);

  const layout = document.createElement('section');
  layout.className = 'placement-layout match-layout';

  const board = document.createElement('div');
  board.className = 'placement-board match-board';
  board.style.setProperty('--board-columns', PLACEMENT_CONFIG.BOARD_COLUMNS);
  board.style.setProperty('--board-rows', PLACEMENT_CONFIG.BOARD_ROWS);
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
    aimGuide.classList.toggle('is-active', selectedPieceId && isLaunchReady(currentAimVector));
    powerValue.textContent = `${Math.round(power * 100)}%`;
    fireButton.disabled = !selectedPieceId || !isLaunchReady(currentAimVector);
    status.className =
      selectedPieceId && isLaunchReady(currentAimVector)
        ? 'validation-message is-valid'
        : 'validation-message';
    status.textContent = getStatusText({
      selectedPieceId,
      aimVector: currentAimVector,
    });
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
    if (!selectedPieceId) {
      return;
    }

    event.preventDefault();
    dragStart = {
      x: event.clientX,
      y: event.clientY,
    };
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

  const endAimDrag = () => {
    dragStart = null;
  };

  board.addEventListener('pointerup', endAimDrag);
  board.addEventListener('pointercancel', endAimDrag);

  const occupancy = buildBoardOccupancy(playerPlacements);

  for (let y = 0; y < PLACEMENT_CONFIG.BOARD_ROWS; y += 1) {
    for (let x = 0; x < PLACEMENT_CONFIG.BOARD_COLUMNS; x += 1) {
      const key = toCellKey({ x, y });
      const occupant = occupancy.get(key);
      const cell = document.createElement('button');
      cell.className = 'placement-cell match-cell';
      cell.type = 'button';
      cell.disabled = !occupant || occupant.ownerId !== activePlayerId;
      cell.classList.toggle('is-placed', Boolean(occupant));
      cell.classList.toggle('is-active-player', occupant?.ownerId === activePlayerId);
      cell.classList.toggle('is-selected', occupant?.pieceId === selectedPieceId);
      cell.style.setProperty(
        '--cell-ink',
        occupant ? PLAYER_COLORS[occupant.ownerId] : PLAYER_COLORS[activePlayerId],
      );
      cell.setAttribute('aria-label', `${x + 1}열 ${y + 1}행`);

      if (occupant?.ownerId === activePlayerId) {
        cell.addEventListener('click', (event) => {
          event.stopPropagation();
          onSelectPiece(occupant.pieceId);
        });
      }

      board.append(cell);
    }
  }

  aimGuide = document.createElement('div');
  aimGuide.className = 'aim-guide';
  board.append(aimGuide);

  const panel = document.createElement('aside');
  panel.className = 'drawing-panel placement-panel';

  const turnLabel = document.createElement('p');
  turnLabel.className = 'panel-label';
  turnLabel.textContent = '현재 턴';

  const turnValue = document.createElement('strong');
  turnValue.className = 'ink-count';
  turnValue.textContent = `${activePlayerId}P`;

  const piecesLabel = document.createElement('p');
  piecesLabel.className = 'panel-label';
  piecesLabel.textContent = '선택할 말';

  const pieceList = document.createElement('div');
  pieceList.className = 'placement-piece-list';

  for (const piece of getActivePieces(playerPieces, playerPlacements, activePlayerId)) {
    const button = document.createElement('button');
    button.className = 'placement-piece-button';
    button.classList.toggle('is-active', piece.id === selectedPieceId);
    button.type = 'button';
    button.textContent = `${piece.id.split('-').at(-1)}번 ${piece.pixelCount}칸`;
    button.addEventListener('click', () => onSelectPiece(piece.id));
    pieceList.append(button);
  }

  const powerLabel = document.createElement('p');
  powerLabel.className = 'panel-label';
  powerLabel.textContent = '발사 세기';

  powerValue = document.createElement('strong');
  powerValue.className = 'ink-count';

  fireButton = document.createElement('button');
  fireButton.className = 'primary-action';
  fireButton.type = 'button';
  fireButton.textContent = '발사';
  fireButton.addEventListener('click', onFire);

  status = document.createElement('p');

  panel.append(turnLabel, turnValue, piecesLabel, pieceList, powerLabel, powerValue, fireButton, status);
  layout.append(board, panel);
  screen.append(header, layout);

  syncAimControls();

  return screen;
}

function getStatusText({ selectedPieceId, aimVector }) {
  if (!selectedPieceId) {
    return '발사할 말을 선택해 주세요.';
  }

  if (!isLaunchReady(aimVector)) {
    return '보드 위에서 뒤로 끌어당겨 방향과 세기를 정해 주세요.';
  }

  return '발사 준비 완료. 버튼을 누르면 다음 물리 단계로 넘깁니다.';
}
