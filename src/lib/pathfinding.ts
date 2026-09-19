import { GridPoint } from "../types/game";

interface Node {
  point: GridPoint;
  f: number;
  g: number;
  h: number;
  parent: Node | null;
}

export function findPathAStar(
  start: GridPoint,
  goal: GridPoint,
  width: number,
  height: number,
  isBlocked: (x: number, y: number) => boolean
): GridPoint[] {
  // If goal itself is blocked and not the start, can't move directly onto it
  if (isBlocked(goal.x, goal.y)) {
    return [];
  }

  const openList: Node[] = [];
  const closedSet = new Set<string>();

  const toKey = (p: GridPoint) => `${p.x},${p.y}`;
  const heuristic = (a: GridPoint, b: GridPoint) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  openList.push({
    point: start,
    f: heuristic(start, goal),
    g: 0,
    h: heuristic(start, goal),
    parent: null,
  });

  const directions = [
    { x: 0, y: -1 }, // Up
    { x: 1, y: 0 },  // Right
    { x: 0, y: 1 },  // Down
    { x: -1, y: 0 }, // Left
  ];

  while (openList.length > 0) {
    // Sort by lowest f value
    openList.sort((a, b) => a.f - b.f);
    const current = openList.shift()!;

    if (current.point.x === goal.x && current.point.y === goal.y) {
      // Reconstruct path
      const path: GridPoint[] = [];
      let temp: Node | null = current;
      while (temp !== null) {
        path.unshift(temp.point);
        temp = temp.parent;
      }
      return path;
    }

    closedSet.add(toKey(current.point));

    for (const dir of directions) {
      const neighbor: GridPoint = {
        x: current.point.x + dir.x,
        y: current.point.y + dir.y,
      };

      // Bounds check
      if (neighbor.x < 0 || neighbor.x >= width || neighbor.y < 0 || neighbor.y >= height) {
        continue;
      }

      // Blocked check
      if (closedSet.has(toKey(neighbor)) || isBlocked(neighbor.x, neighbor.y)) {
        continue;
      }

      const tentativeG = current.g + 1;
      const existing = openList.find((n) => n.point.x === neighbor.x && n.point.y === neighbor.y);

      if (!existing) {
        const h = heuristic(neighbor, goal);
        openList.push({
          point: neighbor,
          g: tentativeG,
          h,
          f: tentativeG + h,
          parent: current,
        });
      } else if (tentativeG < existing.g) {
        existing.g = tentativeG;
        existing.f = tentativeG + existing.h;
        existing.parent = current;
      }
    }
  }

  return [];
}
