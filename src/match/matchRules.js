export function getRemainingPieceCount(playerPlacements, ownerId) {
  return playerPlacements[ownerId]?.length ?? 0;
}

export function getMatchResult(playerPlacements) {
  const playerOneCount = getRemainingPieceCount(playerPlacements, 1);
  const playerTwoCount = getRemainingPieceCount(playerPlacements, 2);

  if (playerOneCount > 0 && playerTwoCount > 0) {
    return {
      finished: false,
      winnerId: null,
      draw: false,
    };
  }

  if (playerOneCount === 0 && playerTwoCount === 0) {
    return {
      finished: true,
      winnerId: null,
      draw: true,
    };
  }

  return {
    finished: true,
    winnerId: playerOneCount > 0 ? 1 : 2,
    draw: false,
  };
}
