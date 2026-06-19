import { PLACEMENT_CONFIG, PLAYER_COLORS } from '../config/gameConfig.js';
import { toCellKey } from '../drawing/drawingValidation.js';
import {
  getNextRotation,
  getPlacedCells,
  isPlayerPlacementComplete,
  validatePiecePlacement,
} from '../placement/placementValidation.js';

/**
 * @param {{
 *   ownerId: 1 | 2,
 *   pieces: { id: string, cells: { x: number, y: number }[], pixelCount: number, color: string }[],
 *   placements: { pieceId: string, ownerId: 1 | 2, anchor: { x: number, y: number }, rotation: number, occupiedCells: { x: number, y: number }[] }[],
 *   onConfirmPlacement: (placement: { pieceId: string, ownerId: 1 | 2, anchor: { x: number, y: number }, rotation: number, occupiedCells: { x: number, y: number }[] }) => void,
 *   onAutoPlace: () => void,
 *   onClearPlacements: () => void,
 *   onBack: () => void,
 * }} params
 * @returns {HTMLElement}
 */
export function renderPlacementScreen({
  ownerId,
  pieces,
  placements,
  onConfirmPlacement,
  onAutoPlace,
  onClearPlacements,
  onBack,
}) {
  const screen = document.createElement('main');
  screen.className = 'screen drawing-screen';

  const header = document.createElement('header');
  header.className = 'drawing-header';

  const titleGroup = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'screen-eyebrow';
  eyebrow.textContent = `PLAYER ${ownerId}`;

  const title = document.createElement('h1');
  title.className = 'pixel-title';
  title.textContent = '말 배치';

  titleGroup.append(eyebrow, title);

  const backButton = document.createElement('button');
  backButton.className = 'secondary-action';
  backButton.type = 'button';
  backButton.textContent = '메인';
  backButton.addEventListener('click', onBack);

  header.append(titleGroup, backButton);

  const layout = document.createElement('section');
  layout.className = 'placement-layout';

  const board = document.createElement('div');
  board.className = 'placement-board';
  board.style.setProperty('--player-ink', PLAYER_COLORS[ownerId]);
  board.style.setProperty('--board-columns', PLACEMENT_CONFIG.BOARD_COLUMNS);
  board.style.setProperty('--board-rows', PLACEMENT_CONFIG.BOARD_ROWS);
  board.setAttribute('aria-label', `${ownerId}P 말 배치 보드`);

  const panel = document.createElement('aside');
  panel.className = 'drawing-panel placement-panel';

  let placedPieceIds = new Set(placements.map((placement) => placement.pieceId));
  let selectedPiece = pieces.find((piece) => !placedPieceIds.has(piece.id)) ?? pieces[0] ?? null;
  let selectedAnchor = null;
  let rotation = 0;
  const cellMap = new Map();

  const progress = document.createElement('div');
  progress.className = 'piece-progress';

  const pieceList = document.createElement('div');
  pieceList.className = 'placement-piece-list';

  const rotationButton = document.createElement('button');
  rotationButton.className = 'secondary-action';
  rotationButton.type = 'button';

  const validationMessage = document.createElement('p');
  validationMessage.className = 'validation-message';

  const confirmButton = document.createElement('button');
  confirmButton.className = 'primary-action';
  confirmButton.type = 'button';

  const autoPlaceButton = document.createElement('button');
  autoPlaceButton.className = 'primary-action';
  autoPlaceButton.type = 'button';
  autoPlaceButton.textContent = '자동 배치';
  autoPlaceButton.addEventListener('click', onAutoPlace);

  const resetButton = document.createElement('button');
  resetButton.className = 'secondary-action';
  resetButton.type = 'button';
  resetButton.textContent = '배치 초기화';
  resetButton.addEventListener('click', onClearPlacements);

  const syncBoard = () => {
    placedPieceIds = new Set(placements.map((placement) => placement.pieceId));
    const placedCells = new Map();
    for (const placement of placements) {
      for (const cell of placement.occupiedCells) {
        placedCells.set(toCellKey(cell), placement.ownerId);
      }
    }

    const previewCells = new Set(
      getPlacedCells({
        piece: selectedPiece,
        anchor: selectedAnchor,
        rotation,
      }).map(toCellKey),
    );

    const validation = validatePiecePlacement({
      piece: selectedPiece,
      anchor: selectedAnchor,
      rotation,
      ownerId,
      existingPlacements: placements,
    });

    for (const [key, cell] of cellMap) {
      const placedOwner = placedCells.get(key);
      cell.className = 'placement-cell';
      cell.classList.toggle('is-home', isHomeRow(Number(cell.dataset.y), ownerId));
      cell.classList.toggle('is-placed', Boolean(placedOwner));
      cell.classList.toggle('is-preview', previewCells.has(key));
      cell.style.setProperty(
        '--cell-ink',
        placedOwner ? PLAYER_COLORS[placedOwner] : PLAYER_COLORS[ownerId],
      );
    }

    validationMessage.textContent = validation.valid
      ? '이 위치에 배치할 수 있습니다.'
      : validation.errors[0] ?? '말과 위치를 선택해 주세요.';
    validationMessage.classList.toggle('is-valid', validation.valid);
    confirmButton.disabled = !validation.valid;
    confirmButton.textContent = isPlayerPlacementComplete(pieces, placements)
      ? '배치 완료'
      : '이 위치에 배치';
    rotationButton.textContent = `회전 ${rotation}도`;
  };

  const syncPieces = () => {
    progress.replaceChildren();
    pieceList.replaceChildren();

    for (let index = 0; index < pieces.length; index += 1) {
      const piece = pieces[index];
      const isPlaced = placedPieceIds.has(piece.id);

      const marker = document.createElement('span');
      marker.textContent = String(index + 1);
      marker.className = isPlaced ? 'piece-marker is-complete' : 'piece-marker';
      if (selectedPiece?.id === piece.id) {
        marker.classList.add('is-current');
      }
      progress.append(marker);

      const pieceButton = document.createElement('button');
      pieceButton.className = 'placement-piece-button';
      pieceButton.type = 'button';
      pieceButton.disabled = isPlaced;
      pieceButton.classList.toggle('is-active', selectedPiece?.id === piece.id);
      pieceButton.textContent = `${index + 1}번 ${piece.pixelCount}칸`;
      pieceButton.addEventListener('click', () => {
        selectedPiece = piece;
        selectedAnchor = null;
        rotation = 0;
        syncPieces();
        syncBoard();
      });
      pieceList.append(pieceButton);
    }
  };

  for (let y = 0; y < PLACEMENT_CONFIG.BOARD_ROWS; y += 1) {
    for (let x = 0; x < PLACEMENT_CONFIG.BOARD_COLUMNS; x += 1) {
      const cell = document.createElement('button');
      cell.className = 'placement-cell';
      cell.type = 'button';
      cell.dataset.x = String(x);
      cell.dataset.y = String(y);
      cell.setAttribute('aria-label', `${x + 1}열 ${y + 1}행`);
      cell.addEventListener('click', () => {
        selectedAnchor = { x, y };
        syncBoard();
      });

      cellMap.set(`${x},${y}`, cell);
      board.append(cell);
    }
  }

  rotationButton.addEventListener('click', () => {
    rotation = getNextRotation(rotation);
    syncBoard();
  });

  confirmButton.addEventListener('click', () => {
    const validation = validatePiecePlacement({
      piece: selectedPiece,
      anchor: selectedAnchor,
      rotation,
      ownerId,
      existingPlacements: placements,
    });

    if (!validation.valid) {
      return;
    }

    onConfirmPlacement({
      pieceId: selectedPiece.id,
      ownerId,
      anchor: selectedAnchor,
      rotation,
      occupiedCells: validation.occupiedCells,
    });
  });

  panel.append(
    progress,
    pieceList,
    rotationButton,
    validationMessage,
    autoPlaceButton,
    resetButton,
    confirmButton,
  );
  layout.append(board, panel);
  screen.append(header, layout);

  syncPieces();
  syncBoard();

  return screen;
}

/**
 * @param {{
 *   playerPieces: Record<1 | 2, { id: string, pixelCount: number }[]>,
 *   playerPlacements: Record<1 | 2, { ownerId: 1 | 2, occupiedCells: { x: number, y: number }[] }[]>,
 *   onStartMatch: () => void,
 *   onBackToTitle: () => void,
 * }} params
 * @returns {HTMLElement}
 */
export function renderMatchReadyScreen({
  playerPieces,
  playerPlacements,
  onStartMatch,
  onBackToTitle,
}) {
  const screen = document.createElement('main');
  screen.className = 'screen drawing-screen';

  const header = document.createElement('header');
  header.className = 'drawing-header';

  const titleGroup = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'screen-eyebrow';
  eyebrow.textContent = 'LOCAL 1:1';

  const title = document.createElement('h1');
  title.className = 'pixel-title';
  title.textContent = '배치 완료';

  titleGroup.append(eyebrow, title);

  const backButton = document.createElement('button');
  backButton.className = 'secondary-action';
  backButton.type = 'button';
  backButton.textContent = '메인';
  backButton.addEventListener('click', onBackToTitle);

  const startButton = document.createElement('button');
  startButton.className = 'primary-action';
  startButton.type = 'button';
  startButton.textContent = '경기 시작';
  startButton.addEventListener('click', onStartMatch);

  const headerActions = document.createElement('div');
  headerActions.className = 'title-actions';
  headerActions.append(startButton, backButton);

  header.append(titleGroup, headerActions);

  const layout = document.createElement('section');
  layout.className = 'placement-layout';

  const board = document.createElement('div');
  board.className = 'placement-board is-readonly';
  board.style.setProperty('--board-columns', PLACEMENT_CONFIG.BOARD_COLUMNS);
  board.style.setProperty('--board-rows', PLACEMENT_CONFIG.BOARD_ROWS);
  board.setAttribute('aria-label', '배치 완료 보드');

  const occupied = new Map();
  for (const ownerId of [1, 2]) {
    for (const placement of playerPlacements[ownerId]) {
      for (const cell of placement.occupiedCells) {
        occupied.set(toCellKey(cell), ownerId);
      }
    }
  }

  for (let y = 0; y < PLACEMENT_CONFIG.BOARD_ROWS; y += 1) {
    for (let x = 0; x < PLACEMENT_CONFIG.BOARD_COLUMNS; x += 1) {
      const cell = document.createElement('span');
      const ownerId = occupied.get(`${x},${y}`);
      cell.className = 'placement-cell';
      cell.classList.toggle('is-placed', Boolean(ownerId));
      cell.style.setProperty('--cell-ink', ownerId ? PLAYER_COLORS[ownerId] : PLAYER_COLORS[1]);
      board.append(cell);
    }
  }

  const summary = document.createElement('aside');
  summary.className = 'drawing-panel placement-panel';

  for (const ownerId of [1, 2]) {
    const label = document.createElement('p');
    label.className = 'panel-label';
    label.textContent = `${ownerId}P 배치`;

    const count = document.createElement('strong');
    count.className = 'ink-count';
    count.textContent = `${playerPlacements[ownerId].length}/${playerPieces[ownerId].length}`;

    summary.append(label, count);
  }

  layout.append(board, summary);
  screen.append(header, layout);

  return screen;
}

function isHomeRow(y, ownerId) {
  if (ownerId === 1) {
    return y < PLACEMENT_CONFIG.HOME_ROWS;
  }

  return y >= PLACEMENT_CONFIG.BOARD_ROWS - PLACEMENT_CONFIG.HOME_ROWS;
}
