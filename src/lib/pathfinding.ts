import { GridPoint } from "../types/game";

interface Node {
  point: GridPoint;
  f: number;
  g: number;
  h: number;
  parent: Node | null;
}

const CARDINAL_DIRECTIONS: GridPoint[] = [
  { x: 0, y: -1 }, // Up
  { x: 1, y: 0 },  // Right
  { x: 0, y: 1 },  // Down
  { x: -1, y: 0 }, // Left
];

/**
 * Pure A* pathfinding algorithm on a 2D grid avoiding blocked tiles.
 * Returns an array of GridPoints from start to goal (inclusive), or empty array if unreachable.
 */
export function findPathAStar(
  start: GridPoint,
  goal: GridPoint,
  width: number,
  height: number,
  isBlocked: (x: number, y: number) => boolean
): GridPoint[] {
  // If start is the goal, already there
  if (start.x === goal.x && start.y === goal.y) {
    return [{ x: start.x, y: start.y }];
  }

  // If goal itself is blocked, cannot move directly onto it
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

  while (openList.length > 0) {
    // Sort by lowest f value, breaking ties with lowest h (closer to goal)
    openList.sort((a, b) => (a.f === b.f ? a.h - b.h : a.f - b.f));
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

    for (const dir of CARDINAL_DIRECTIONS) {
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

/**
 * Plans a path to the goal tile. If the goal tile is solid/blocked,
 * automatically navigates to the closest adjacent open tile to the target.
 */
export function findPathToGoalOrAdjacent(
  start: GridPoint,
  goal: GridPoint,
  width: number,
  height: number,
  isBlocked: (x: number, y: number) => boolean
): GridPoint[] {
  // If already at goal
  if (start.x === goal.x && start.y === goal.y) {
    return [{ x: start.x, y: start.y }];
  }

  // 1. If goal is NOT blocked, attempt direct path first
  if (!isBlocked(goal.x, goal.y)) {
    const directPath = findPathAStar(start, goal, width, height, isBlocked);
    if (directPath.length > 0) {
      return directPath;
    }
  }

  // 2. Goal is blocked or unreachable: inspect cardinal adjacent tiles of goal
  const directAdjacent: GridPoint[] = [];
  for (const dir of CARDINAL_DIRECTIONS) {
    const nx = goal.x + dir.x;
    const ny = goal.y + dir.y;
    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      if (!isBlocked(nx, ny) || (nx === start.x && ny === start.y)) {
        directAdjacent.push({ x: nx, y: ny });
      }
    }
  }

  let bestPath: GridPoint[] = [];
  let minPathLength = Infinity;

  for (const neighbor of directAdjacent) {
    // If player is already on an adjacent tile
    if (neighbor.x === start.x && neighbor.y === start.y) {
      return [{ x: start.x, y: start.y }];
    }

    const candidatePath = findPathAStar(start, neighbor, width, height, isBlocked);
    if (candidatePath.length > 0 && candidatePath.length < minPathLength) {
      minPathLength = candidatePath.length;
      bestPath = candidatePath;
    }
  }

  if (bestPath.length > 0) {
    return bestPath;
  }

  // 3. Fallback: If immediate 4 neighbors are blocked, search outward from goal
  // using breadth-first search to find the closest reachable open tile.
  const visited = new Set<string>();
  const toKey = (p: GridPoint) => `${p.x},${p.y}`;
  const queue: Array<{ point: GridPoint; distFromGoal: number }> = [{ point: goal, distFromGoal: 0 }];
  visited.add(toKey(goal));

  let currentDistLayer = 0;
  const layerCandidates: GridPoint[] = [];

  while (queue.length > 0) {
    const item = queue.shift()!;

    if (item.distFromGoal > currentDistLayer) {
      // Evaluate candidates in the finished layer
      if (layerCandidates.length > 0) {
        for (const cand of layerCandidates) {
          if (cand.x === start.x && cand.y === start.y) {
            return [{ x: start.x, y: start.y }];
          }
          const p = findPathAStar(start, cand, width, height, isBlocked);
          if (p.length > 0 && p.length < minPathLength) {
            minPathLength = p.length;
            bestPath = p;
          }
        }
        if (bestPath.length > 0) {
          return bestPath;
        }
        layerCandidates.length = 0;
      }
      currentDistLayer = item.distFromGoal;
    }

    for (const dir of CARDINAL_DIRECTIONS) {
      const nx = item.point.x + dir.x;
      const ny = item.point.y + dir.y;
      const key = `${nx},${ny}`;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited.has(key)) {
        visited.add(key);
        const pt = { x: nx, y: ny };
        const blocked = isBlocked(nx, ny) && !(nx === start.x && ny === start.y);

        if (!blocked) {
          layerCandidates.push(pt);
        } else {
          queue.push({ point: pt, distFromGoal: item.distFromGoal + 1 });
        }
      }
    }
  }

  // Final check for any remaining layer candidates
  if (layerCandidates.length > 0) {
    for (const cand of layerCandidates) {
      if (cand.x === start.x && cand.y === start.y) {
        return [{ x: start.x, y: start.y }];
      }
      const p = findPathAStar(start, cand, width, height, isBlocked);
      if (p.length > 0 && p.length < minPathLength) {
        minPathLength = p.length;
        bestPath = p;
      }
    }
  }

  return bestPath;
}
