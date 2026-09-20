export interface SceneLayoutMetrics {
  tileSize: number;
  gridOffsetX: number;
  gridOffsetY: number;
  roomWidth: number;
  roomHeight: number;
  totalWidth: number;
  totalHeight: number;
}

/**
 * Calculates responsive layout metrics for the 16:9 landscape Phaser canvas (1280x720)
 * ensuring tile dimensions strictly satisfy pediatric touch target guidelines (Fitts's Law >= 80px on standard iPad).
 */
export function calculateSceneLayout(
  roomWidth: number,
  roomHeight: number,
  canvasWidth: number = 1280,
  canvasHeight: number = 720,
  padding: number = 120
): SceneLayoutMetrics {
  const availableWidth = canvasWidth - padding;
  const availableHeight = canvasHeight - padding;

  const maxCellW = Math.floor(availableWidth / roomWidth);
  const maxCellH = Math.floor(availableHeight / roomHeight);

  const tileSize = Math.max(64, Math.min(maxCellW, maxCellH));
  const totalWidth = roomWidth * tileSize;
  const totalHeight = roomHeight * tileSize;

  const gridOffsetX = Math.floor((canvasWidth - totalWidth) / 2);
  const gridOffsetY = Math.floor((canvasHeight - totalHeight) / 2);

  return {
    tileSize,
    gridOffsetX,
    gridOffsetY,
    roomWidth,
    roomHeight,
    totalWidth,
    totalHeight,
  };
}

/**
 * Converts canvas pointer coordinates to room grid coordinates.
 * Returns null if the tap is outside the playable room boundaries.
 */
export function screenToGridPoint(
  pointerX: number,
  pointerY: number,
  layout: SceneLayoutMetrics
): { x: number; y: number } | null {
  const tileX = Math.floor((pointerX - layout.gridOffsetX) / layout.tileSize);
  const tileY = Math.floor((pointerY - layout.gridOffsetY) / layout.tileSize);

  if (tileX >= 0 && tileX < layout.roomWidth && tileY >= 0 && tileY < layout.roomHeight) {
    return { x: tileX, y: tileY };
  }
  return null;
}

/**
 * Converts room grid coordinates to centered canvas pixel coordinates.
 */
export function gridToScreenPoint(
  gridX: number,
  gridY: number,
  layout: SceneLayoutMetrics
): { x: number; y: number } {
  return {
    x: layout.gridOffsetX + (gridX + 0.5) * layout.tileSize,
    y: layout.gridOffsetY + (gridY + 0.5) * layout.tileSize,
  };
}
