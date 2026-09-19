export interface GridCellSizeOptions {
  minCellSize?: number;
  maxCellSize?: number;
  paddingX?: number;
  paddingY?: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function calculateGridCellSize(
  roomWidth: number,
  roomHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  options: GridCellSizeOptions = {}
): number {
  const {
    minCellSize = 64,
    maxCellSize = 96,
    paddingX = 96,
    paddingY = 180,
  } = options;

  const availableWidth = Math.max(1, viewportWidth - paddingX);
  const availableHeight = Math.max(1, viewportHeight - paddingY);
  const idealCellSize = Math.min(availableWidth / roomWidth, availableHeight / roomHeight);

  return clamp(Math.floor(idealCellSize), minCellSize, maxCellSize);
}
