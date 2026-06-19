import { PLAYER_COLORS } from '../config/gameConfig.js';

/**
 * @param {{
 *   result: { winnerId: 1 | 2 | null, draw: boolean },
 *   playerPlacements: Record<1 | 2, { pieceId: string }[]>,
 *   onQuickRestart: () => void,
 *   onBackToTitle: () => void,
 * }} params
 * @returns {HTMLElement}
 */
export function renderMatchOverScreen({
  result,
  playerPlacements,
  onQuickRestart,
  onBackToTitle,
}) {
  const safeResult = result ?? {
    winnerId: null,
    draw: true,
  };
  const screen = document.createElement('main');
  screen.className = 'screen drawing-screen';

  const header = document.createElement('header');
  header.className = 'drawing-header';

  const titleGroup = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'screen-eyebrow';
  eyebrow.textContent = 'MATCH OVER';

  const title = document.createElement('h1');
  title.className = 'pixel-title';
  title.textContent = safeResult.draw ? '무승부' : `${safeResult.winnerId}P 승리`;

  titleGroup.append(eyebrow, title);

  const actions = document.createElement('div');
  actions.className = 'title-actions';

  const quickRestartButton = document.createElement('button');
  quickRestartButton.className = 'primary-action';
  quickRestartButton.type = 'button';
  quickRestartButton.textContent = '빠른 재시작';
  quickRestartButton.addEventListener('click', onQuickRestart);

  const titleButton = document.createElement('button');
  titleButton.className = 'secondary-action';
  titleButton.type = 'button';
  titleButton.textContent = '메인';
  titleButton.addEventListener('click', onBackToTitle);

  actions.append(quickRestartButton, titleButton);
  header.append(titleGroup, actions);

  const summary = document.createElement('section');
  summary.className = 'drawing-complete-layout';

  for (const ownerId of [1, 2]) {
    const panel = document.createElement('article');
    panel.className = 'drawing-panel';
    panel.style.setProperty('--player-ink', PLAYER_COLORS[ownerId]);

    const label = document.createElement('p');
    label.className = 'panel-label';
    label.textContent = `${ownerId}P 남은 말`;

    const count = document.createElement('strong');
    count.className = 'ink-count';
    count.textContent = `${playerPlacements[ownerId]?.length ?? 0}`;

    const status = document.createElement('p');
    status.className =
      safeResult.winnerId === ownerId ? 'validation-message is-valid' : 'validation-message';
    status.textContent = getPlayerStatus({ ownerId, result: safeResult });

    panel.append(label, count, status);
    summary.append(panel);
  }

  screen.append(header, summary);
  return screen;
}

function getPlayerStatus({ ownerId, result }) {
  if (result.draw) {
    return '마지막 말이 함께 나갔습니다.';
  }

  return result.winnerId === ownerId ? '상대 말을 모두 낙장시켰습니다.' : '모든 말이 낙장했습니다.';
}
