export function interpolateOrthogonalPath(from, to) {
  if (!from) {
    return [to];
  }

  const path = [];
  let x = from.x;
  let y = from.y;

  while (x !== to.x) {
    x += Math.sign(to.x - x);
    path.push({ x, y });
  }

  while (y !== to.y) {
    y += Math.sign(to.y - y);
    path.push({ x, y });
  }

  return path;
}

