import { DRAWING_CONFIG, GAME_INFO } from '../config/gameConfig.js';

/**
 * @param {{ onStartLocal: () => void }} params
 * @returns {HTMLElement}
 */
export function renderMainScreen({ onStartLocal }) {
  const screen = document.createElement('main');
  screen.className = 'screen title-screen';

  const content = document.createElement('section');
  content.className = 'title-layout';

  const copy = document.createElement('div');
  copy.className = 'title-copy';

  const title = document.createElement('h1');
  title.textContent = GAME_INFO.koreanTitle;

  const subtitle = document.createElement('p');
  subtitle.textContent = GAME_INFO.englishTitle;

  const actions = document.createElement('div');
  actions.className = 'title-actions';

  const startButton = document.createElement('button');
  startButton.className = 'primary-action';
  startButton.type = 'button';
  startButton.textContent = '로컬 대전';
  startButton.addEventListener('click', onStartLocal);

  const status = document.createElement('p');
  status.className = 'phase-status';
  status.textContent = `${DRAWING_CONFIG.PIECES_PER_PLAYER}개 말, ${DRAWING_CONFIG.TOTAL_INK}칸 잉크`;

  actions.append(startButton, status);
  copy.append(title, subtitle, actions);

  const preview = renderBoardPreview();

  content.append(copy, preview);
  screen.append(content);

  return screen;
}

function renderBoardPreview() {
  const preview = document.createElement('div');
  preview.className = 'board-preview';
  preview.setAttribute('aria-label', '픽셀 말 미리보기');

  const cells = new Set([
    '1,1',
    '2,1',
    '3,1',
    '1,2',
    '1,3',
    '1,4',
    '2,4',
    '3,4',
    '5,2',
    '6,2',
    '6,3',
    '5,4',
    '6,4',
  ]);

  for (let y = 0; y < DRAWING_CONFIG.GRID_ROWS; y += 1) {
    for (let x = 0; x < DRAWING_CONFIG.GRID_COLUMNS; x += 1) {
      const cell = document.createElement('span');
      cell.className = cells.has(`${x},${y}`) ? 'preview-cell is-inked' : 'preview-cell';
      preview.append(cell);
    }
  }

  return preview;
}
