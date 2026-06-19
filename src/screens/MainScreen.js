import { DRAWING_CONFIG, GAME_INFO } from '../config/gameConfig.js';

/**
 * @param {{ onStartLocal: () => void, onStartQuick: () => void }} params
 * @returns {HTMLElement}
 */
export function renderMainScreen({ onStartLocal, onStartQuick }) {
  const screen = document.createElement('main');
  screen.className = 'screen title-screen';

  const content = document.createElement('section');
  content.className = 'title-layout';

  const copy = document.createElement('div');
  copy.className = 'title-copy';

  const logo = renderPixelLogo();

  const title = document.createElement('h1');
  title.className = 'pixel-title';
  title.textContent = GAME_INFO.koreanTitle;

  const subtitle = document.createElement('p');
  subtitle.className = 'title-subtitle';
  subtitle.textContent = GAME_INFO.englishTitle;

  const tags = document.createElement('ul');
  tags.className = 'concept-tags';

  for (const label of ['픽셀 말 제작', '빈 공간 충돌', '로컬 1:1 승부']) {
    const tag = document.createElement('li');
    tag.textContent = label;
    tags.append(tag);
  }

  const actions = document.createElement('div');
  actions.className = 'title-actions';

  const quickStartButton = document.createElement('button');
  quickStartButton.className = 'primary-action';
  quickStartButton.type = 'button';
  quickStartButton.textContent = '빠른 시작';
  quickStartButton.addEventListener('click', onStartQuick);

  const customStartButton = document.createElement('button');
  customStartButton.className = 'secondary-action';
  customStartButton.type = 'button';
  customStartButton.textContent = '직접 제작';
  customStartButton.addEventListener('click', onStartLocal);

  const status = document.createElement('p');
  status.className = 'phase-status';
  status.textContent = `${DRAWING_CONFIG.PIECES_PER_PLAYER}개 말, ${DRAWING_CONFIG.TOTAL_INK}칸 잉크`;

  actions.append(quickStartButton, customStartButton, status);
  copy.append(logo, title, subtitle, tags, actions);

  const preview = renderBoardPreview();

  content.append(copy, preview);
  screen.append(content);

  return screen;
}

function renderPixelLogo() {
  const logo = document.createElement('div');
  logo.className = 'pixel-logo';
  logo.setAttribute('aria-hidden', 'true');

  const blueCells = new Set([
    '1,1',
    '2,1',
    '3,1',
    '1,2',
    '1,3',
    '2,4',
    '3,4',
    '4,4',
  ]);
  const orangeCells = new Set(['6,2', '7,2', '7,3', '5,5', '6,5', '7,5']);
  const sparkCells = new Set(['4,1', '5,3', '3,6', '6,6']);

  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const cell = document.createElement('span');
      const key = `${x},${y}`;
      cell.className = 'pixel-logo-cell';

      if (blueCells.has(key)) {
        cell.classList.add('is-blue');
      } else if (orangeCells.has(key)) {
        cell.classList.add('is-orange');
      } else if (sparkCells.has(key)) {
        cell.classList.add('is-spark');
      }

      logo.append(cell);
    }
  }

  return logo;
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
