import Phaser from "phaser";
import { GameWorld } from "../../ecs/world";
import { Entity } from "../../ecs/entities";
import { GridPoint, RoomDefinition } from "../../types/game";
import { SHRINE_00_EQUILIBRIUM } from "../rooms";
import {
  calculateSceneLayout,
  screenToGridPoint,
  gridToScreenPoint,
  SceneLayoutMetrics,
} from "../layout";

export interface ShrineSceneInitData {
  world?: GameWorld;
  room?: RoomDefinition;
  onCellTap?: (point: GridPoint, screenX: number, screenY: number) => void;
  onRoomCompleted?: () => void;
  onNpcTap?: (npc: Entity) => void;
}

export class ShrineScene extends Phaser.Scene {
  public world!: GameWorld;
  public room!: RoomDefinition;
  public onCellTap?: (point: GridPoint, screenX: number, screenY: number) => void;
  public onRoomCompleted?: () => void;
  public onNpcTap?: (npc: Entity) => void;

  public static readonly CANVAS_WIDTH = 1280;
  public static readonly CANVAS_HEIGHT = 720;

  // Grid layout metrics
  public layoutMetrics!: SceneLayoutMetrics;
  public tileSize: number = 80;
  public gridOffsetX: number = 0;
  public gridOffsetY: number = 0;
  public roomWidth: number = 8;
  public roomHeight: number = 6;

  // Visual game object tracking
  private gridContainer?: Phaser.GameObjects.Container;
  private entityContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private entityRegisteredGridPos: Map<string, { x: number; y: number }> = new Map();
  private entityTweens: Map<string, Phaser.Tweens.Tween> = new Map();
  private plateStates: Map<string, boolean> = new Map();
  private doorStates: Map<string, boolean> = new Map();
  private npcSoothedStates: Map<string, boolean> = new Map();
  private lightOrbContainer?: Phaser.GameObjects.Container;

  constructor(config?: Phaser.Types.Scenes.SettingsConfig) {
    super({ key: "ShrineScene", ...(config || {}) });
  }

  public init(data?: ShrineSceneInitData): void {
    if (data?.room) {
      this.room = data.room;
    } else {
      this.room = SHRINE_00_EQUILIBRIUM;
    }

    if (data?.world) {
      this.world = data.world;
    } else {
      this.world = new GameWorld(this.room);
      this.world.setEntities(JSON.parse(JSON.stringify(this.room.entities)));
    }

    this.onCellTap = data?.onCellTap;
    this.onRoomCompleted = data?.onRoomCompleted;
    this.onNpcTap = data?.onNpcTap;
  }

  public create(): void {
    this.calculateLayout();
    this.buildGrid();
    this.buildEntities();
    this.buildCompanionOrb();
    this.setupInputHandling();
  }

  public update(): void {
    this.syncEntitiesWithECS();
  }

  /**
   * Computes grid metrics to center the room within the 1280x720 16:9 canvas
   * while ensuring touch targets satisfy Fitts's Law (>= 64px, target >= 80px).
   */
  public calculateLayout(): void {
    this.roomWidth = this.room?.width || 8;
    this.roomHeight = this.room?.height || 6;

    this.layoutMetrics = calculateSceneLayout(
      this.roomWidth,
      this.roomHeight,
      ShrineScene.CANVAS_WIDTH,
      ShrineScene.CANVAS_HEIGHT
    );
    this.tileSize = this.layoutMetrics.tileSize;
    this.gridOffsetX = this.layoutMetrics.gridOffsetX;
    this.gridOffsetY = this.layoutMetrics.gridOffsetY;
  }

  /**
   * Builds the modern storybook vector grid with soft alternating tiles
   * and a gentle rounded chamber frame.
   */
  public buildGrid(): void {
    if (this.gridContainer) {
      this.gridContainer.destroy(true);
    }
    this.gridContainer = this.add.container(0, 0);

    const graphics = this.add.graphics();
    this.gridContainer.add(graphics);

    const totalWidth = this.roomWidth * this.tileSize;
    const totalHeight = this.roomHeight * this.tileSize;
    const framePadding = 16;

    // Chamber outer frame with drop shadow effect
    graphics.fillStyle(0xCBD5E1, 0.4);
    graphics.fillRoundedRect(
      this.gridOffsetX - framePadding + 4,
      this.gridOffsetY - framePadding + 6,
      totalWidth + framePadding * 2,
      totalHeight + framePadding * 2,
      28
    );

    // Chamber main platform background
    graphics.fillStyle(0xE2E8F0, 0.95);
    graphics.lineStyle(3, 0xBCCCDC, 0.8);
    graphics.fillRoundedRect(
      this.gridOffsetX - framePadding,
      this.gridOffsetY - framePadding,
      totalWidth + framePadding * 2,
      totalHeight + framePadding * 2,
      24
    );
    graphics.strokeRoundedRect(
      this.gridOffsetX - framePadding,
      this.gridOffsetY - framePadding,
      totalWidth + framePadding * 2,
      totalHeight + framePadding * 2,
      24
    );

    // Grid cells with alternating storybook pastel fills
    for (let y = 0; y < this.roomHeight; y++) {
      for (let x = 0; x < this.roomWidth; x++) {
        const cellX = this.gridOffsetX + x * this.tileSize;
        const cellY = this.gridOffsetY + y * this.tileSize;
        const isAlternate = (x + y) % 2 === 0;

        // Alternate fill: light pastel cream/white vs soft grayish blue
        const fillColor = isAlternate ? 0xF8FAFC : 0xEDF2F7;
        graphics.fillStyle(fillColor, 0.9);
        graphics.lineStyle(1, 0xCBD5E1, 0.5);

        graphics.fillRoundedRect(cellX + 2, cellY + 2, this.tileSize - 4, this.tileSize - 4, 8);
        graphics.strokeRoundedRect(cellX + 2, cellY + 2, this.tileSize - 4, this.tileSize - 4, 8);
      }
    }
  }

  /**
   * Instantiates visual vector containers for every entity in the GameWorld.
   */
  public buildEntities(): void {
    // Clear existing containers
    for (const container of this.entityContainers.values()) {
      container.destroy(true);
    }
    this.entityContainers.clear();
    this.entityRegisteredGridPos.clear();
    this.entityTweens.clear();
    this.plateStates.clear();
    this.doorStates.clear();
    this.npcSoothedStates.clear();

    const entities = this.world.getEntityList();
    // Sort entities by zIndex for proper rendering order (plates < doors/walls < blocks < player)
    const sorted = [...entities].sort((a, b) => a.renderable.zIndex - b.renderable.zIndex);

    for (const entity of sorted) {
      this.createEntityVisual(entity);
    }
  }

  /**
   * Creates an individual vector container for an entity.
   */
  private createEntityVisual(entity: Entity): Phaser.GameObjects.Container {
    const pos = gridToScreenPoint(entity.position.x, entity.position.y, this.layoutMetrics);

    const container = this.add.container(pos.x, pos.y);
    container.setDepth(entity.renderable.zIndex);

    const graphics = this.add.graphics();
    container.add(graphics);

    switch (entity.renderable.shape) {
      case "avatar":
        this.renderAvatarGraphic(graphics, this.tileSize);
        // Add gentle breathing bob animation
        this.tweens.add({
          targets: container,
          scaleY: 1.03,
          scaleX: 0.98,
          duration: 1100,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        break;

      case "stone":
        this.renderStoneBlockGraphic(graphics, this.tileSize);
        break;

      case "ice":
        this.renderIceBlockGraphic(graphics, this.tileSize);
        break;

      case "plate":
        const isDepressed = entity.trigger?.isDepressed || false;
        this.plateStates.set(entity.id, isDepressed);
        this.renderPressurePlateGraphic(graphics, this.tileSize, isDepressed);
        break;

      case "door":
        const isOpen = entity.collider ? !entity.collider.isSolid : false;
        this.doorStates.set(entity.id, isOpen);
        this.renderDoorGraphic(graphics, this.tileSize, isOpen);
        break;

      case "wall":
        this.renderWallGraphic(graphics, this.tileSize);
        break;

      case "npc":
        const isSoothed = entity.npc?.isSoothed || false;
        this.npcSoothedStates.set(entity.id, isSoothed);
        this.renderNpcGraphic(graphics, this.tileSize, entity);
        this.tweens.add({
          targets: container,
          scaleY: 1.05,
          scaleX: 1.05,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        break;

    }

    this.entityContainers.set(entity.id, container);
    this.entityRegisteredGridPos.set(entity.id, { x: entity.position.x, y: entity.position.y });

    return container;
  }

  /**
   * Builds the floating companion Light Orb near the player.
   */
  public buildCompanionOrb(): void {
    if (this.lightOrbContainer) {
      this.lightOrbContainer.destroy(true);
    }

    const player = this.world.getPlayer();
    const startGridX = player ? player.position.x : 1;
    const startGridY = player ? Math.max(0, player.position.y - 1) : 1;

    const orbPos = gridToScreenPoint(startGridX, startGridY, this.layoutMetrics);
    const orbX = orbPos.x;
    const orbY = orbPos.y - 12;

    this.lightOrbContainer = this.add.container(orbX, orbY);
    this.lightOrbContainer.setDepth(15);

    const graphics = this.add.graphics();
    this.lightOrbContainer.add(graphics);
    this.renderLightOrbGraphic(graphics, this.tileSize);

    // Sinusoidal floating tween
    this.tweens.add({
      targets: this.lightOrbContainer,
      y: orbY - 14,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  /**
   * Sets up pointerdown touch listener on the canvas.
   * Smoothly passes coordinates into A* pathfinding and triggers touch ripples.
   */
  public setupInputHandling(): void {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const point = screenToGridPoint(pointer.x, pointer.y, this.layoutMetrics);

      // Verify tap is within room boundaries
      if (point) {
        this.spawnTouchRipple(pointer.x, pointer.y);

        const tappedNpc = this.world.getEntityList().find(
          (e) => e.npc && e.position.x === point.x && e.position.y === point.y
        );
        if (tappedNpc && this.onNpcTap) {
          this.onNpcTap(tappedNpc);
        }

        if (this.onCellTap) {
          const screenX = pointer.event ? (pointer.event as MouseEvent).clientX : pointer.x;
          const screenY = pointer.event ? (pointer.event as MouseEvent).clientY : pointer.y;
          this.onCellTap(point, screenX, screenY);
        }
      }
    });
  }

  /**
   * Synchronizes visual containers with pure ECS state at 60 FPS.
   * ECS is the single source of truth; Phaser operates as the vector renderer.
   */
  public syncEntitiesWithECS(): void {
    const entities = this.world.getEntityList();

    for (const entity of entities) {
      let container = this.entityContainers.get(entity.id);
      if (!container) {
        container = this.createEntityVisual(entity);
      }

      const registeredPos = this.entityRegisteredGridPos.get(entity.id);
      const pos = gridToScreenPoint(entity.position.x, entity.position.y, this.layoutMetrics);

      // Handle coordinate changes (movement or push)
      if (!registeredPos || registeredPos.x !== entity.position.x || registeredPos.y !== entity.position.y) {
        this.entityRegisteredGridPos.set(entity.id, { x: entity.position.x, y: entity.position.y });

        // Cancel previous active tween if running
        const existingTween = this.entityTweens.get(entity.id);
        if (existingTween && existingTween.isPlaying()) {
          existingTween.stop();
        }

        // Determine tween profile:
        // Sliding ice: smooth continuous deceleration
        // Walking player: rapid linear step
        // Discrete stone: snappy ease-out
        let duration = 180;
        let ease = "Quad.easeOut";

        if (entity.pushable?.isSliding) {
          duration = 320;
          ease = "Cubic.easeOut";
        } else if (entity.renderable.shape === "avatar") {
          duration = entity.movement?.stepIntervalMs ? Math.min(140, entity.movement.stepIntervalMs) : 140;
          ease = "Linear";
        }

        const tween = this.tweens.add({
          targets: container,
          x: pos.x,
          y: pos.y,
          duration,
          ease,
          onComplete: () => {
            this.entityTweens.delete(entity.id);
          },
        });

        this.entityTweens.set(entity.id, tween);

        // Update Light Orb position to follow Zyra gently
        if (entity.renderable.shape === "avatar" && this.lightOrbContainer) {
          this.tweens.add({
            targets: this.lightOrbContainer,
            x: pos.x + 16,
            duration: 400,
            ease: "Quad.easeOut",
          });
        }
      }

      // Handle Pressure Plate visual state changes (depressed / released)
      if (entity.renderable.shape === "plate" && entity.trigger) {
        const lastDepressed = this.plateStates.get(entity.id);
        const currentDepressed = entity.trigger.isDepressed;

        if (lastDepressed !== currentDepressed) {
          this.plateStates.set(entity.id, currentDepressed);
          const graphics = container.getAt(0) as Phaser.GameObjects.Graphics;
          if (graphics) {
            graphics.clear();
            this.renderPressurePlateGraphic(graphics, this.tileSize, currentDepressed);
          }

          // Soft pop animation on plate state transition
          this.tweens.add({
            targets: container,
            scaleX: currentDepressed ? 0.94 : 1.05,
            scaleY: currentDepressed ? 0.94 : 1.05,
            duration: 150,
            yoyo: true,
            ease: "Quad.easeInOut",
          });
        }
      }

      // Handle NPC mood state transition (anxious -> soothed golden)
      if (entity.renderable.shape === "npc" && entity.npc) {
        const lastSoothed = this.npcSoothedStates.get(entity.id);
        const currentSoothed = entity.npc.isSoothed;

        if (lastSoothed !== currentSoothed) {
          this.npcSoothedStates.set(entity.id, currentSoothed);
          const graphics = container.getAt(0) as Phaser.GameObjects.Graphics;
          if (graphics) {
            graphics.clear();
            this.renderNpcGraphic(graphics, this.tileSize, entity);
          }

          // Cheerful sparkle / celebration bounce
          this.tweens.add({
            targets: container,
            scaleX: 1.18,
            scaleY: 1.18,
            duration: 250,
            yoyo: true,
            repeat: 1,
            ease: "Back.easeOut",
          });
        }
      }

      // Handle Door visual state changes (locked / open)
      if (entity.renderable.shape === "door" && entity.collider) {
        const lastOpen = this.doorStates.get(entity.id);
        const currentOpen = !entity.collider.isSolid;

        if (lastOpen !== currentOpen) {
          this.doorStates.set(entity.id, currentOpen);
          const graphics = container.getAt(0) as Phaser.GameObjects.Graphics;
          if (graphics) {
            graphics.clear();
            this.renderDoorGraphic(graphics, this.tileSize, currentOpen);
          }

          // Magical unlock glow pulse
          this.tweens.add({
            targets: container,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 200,
            yoyo: true,
            ease: "Back.easeOut",
          });
        }
      }
    }
  }

  /**
   * Spawns a radial touch ripple ring adhering to pediatric visual feedback rules (<16.7ms).
   */
  public spawnTouchRipple(x: number, y: number): void {
    const ripple = this.add.arc(x, y, 6, 0, 360, false, undefined, 0);
    ripple.setStrokeStyle(3, 0x0EA5E9, 0.9);
    ripple.setDepth(20);

    this.tweens.add({
      targets: ripple,
      radius: this.tileSize * 0.6,
      alpha: 0,
      duration: 350,
      ease: "Cubic.easeOut",
      onComplete: () => {
        ripple.destroy();
      },
    });
  }

  /**
   * Dynamically loads or resets a room without destroying the Phaser WebGL instance.
   */
  public loadRoom(room: RoomDefinition, world: GameWorld): void {
    this.room = room;
    this.world = world;

    this.calculateLayout();
    this.buildGrid();
    this.buildEntities();
    this.buildCompanionOrb();
  }

  // ==========================================
  // VECTOR RENDERING HELPERS (Flat modern storybook aesthetic)
  // ==========================================

  private renderAvatarGraphic(g: Phaser.GameObjects.Graphics, size: number): void {
    const s = size * 0.8;
    const half = s / 2;

    // Ground shadow
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(0, half * 0.85, s * 0.65, s * 0.22);

    // Warm Robe / Body
    g.fillStyle(0x0284C7, 1); // Storybook cerulean robe
    g.lineStyle(2, 0x0369A1, 1);
    g.fillRoundedRect(-half * 0.55, -half * 0.1, s * 0.55, s * 0.65, 8);
    g.strokeRoundedRect(-half * 0.55, -half * 0.1, s * 0.55, s * 0.65, 8);

    // Adventurer Hood / Scarf
    g.fillStyle(0xF97316, 1); // Warm coral accent
    g.fillRoundedRect(-half * 0.6, -half * 0.15, s * 0.6, s * 0.25, 6);

    // Head
    g.fillStyle(0xFED7AA, 1); // Warm gentle skin tone
    g.fillCircle(0, -half * 0.35, s * 0.26);

    // Soft blush cheeks
    g.fillStyle(0xFCA5A5, 0.6);
    g.fillCircle(-half * 0.2, -half * 0.3, 3);
    g.fillCircle(half * 0.2, -half * 0.3, 3);

    // Expressive friendly eyes
    g.fillStyle(0x0F172A, 1);
    g.fillCircle(-half * 0.12, -half * 0.38, 2.5);
    g.fillCircle(half * 0.12, -half * 0.38, 2.5);

    // White eye glints
    g.fillStyle(0xFFFFFF, 0.9);
    g.fillCircle(-half * 0.14, -half * 0.40, 1);
    g.fillCircle(half * 0.10, -half * 0.40, 1);
  }

  private renderStoneBlockGraphic(g: Phaser.GameObjects.Graphics, size: number): void {
    const s = size * 0.82;
    const half = s / 2;

    // Soft shadow
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(0, half * 0.9, s * 0.8, s * 0.25);

    // Stone base cube
    g.fillStyle(0x94A3B8, 1);
    g.lineStyle(3, 0x64748B, 1);
    g.fillRoundedRect(-half, -half, s, s, 12);
    g.strokeRoundedRect(-half, -half, s, s, 12);

    // Inset carved bevel
    g.lineStyle(2, 0x64748B, 0.7);
    g.strokeRoundedRect(-half * 0.65, -half * 0.65, s * 0.65, s * 0.65, 6);

    // Center weight glyph
    g.fillStyle(0x475569, 1);
    g.fillCircle(0, 0, s * 0.12);
  }

  private renderIceBlockGraphic(g: Phaser.GameObjects.Graphics, size: number): void {
    const s = size * 0.82;
    const half = s / 2;

    // Translucent ice shadow
    g.fillStyle(0x000000, 0.14);
    g.fillEllipse(0, half * 0.9, s * 0.8, s * 0.25);

    // Crystalline ice cube
    g.fillStyle(0x38BDF8, 0.85); // Storybook ice cyan
    g.lineStyle(3, 0xBAE6FD, 1);
    g.fillRoundedRect(-half, -half, s, s, 12);
    g.strokeRoundedRect(-half, -half, s, s, 12);

    // Crystal facet reflections
    g.lineStyle(2, 0xFFFFFF, 0.8);
    g.beginPath();
    g.moveTo(-half * 0.5, -half * 0.7);
    g.lineTo(half * 0.7, half * 0.5);
    g.strokePath();

    g.lineStyle(1.5, 0xFFFFFF, 0.6);
    g.beginPath();
    g.moveTo(-half * 0.7, -half * 0.2);
    g.lineTo(half * 0.2, half * 0.7);
    g.strokePath();

    // Specular corner glint
    g.fillStyle(0xFFFFFF, 0.9);
    g.fillCircle(-half * 0.55, -half * 0.55, 3);
  }

  private renderPressurePlateGraphic(g: Phaser.GameObjects.Graphics, size: number, isDepressed: boolean): void {
    const s = size * 0.76;
    const half = s / 2;

    if (isDepressed) {
      // Emerald Active State with glow
      g.fillStyle(0x10B981, 0.3);
      g.fillCircle(0, 0, half * 1.15);

      g.fillStyle(0x10B981, 1);
      g.lineStyle(3, 0x047857, 1);
      g.fillRoundedRect(-half, -half, s, s, 14);
      g.strokeRoundedRect(-half, -half, s, s, 14);

      // Inner active circuit ring
      g.lineStyle(2, 0xD1FAE5, 1);
      g.strokeCircle(0, 0, half * 0.5);
    } else {
      // Peach Inactive State (Soft interactable warm tone)
      g.fillStyle(0xFFEDD5, 1);
      g.lineStyle(3, 0xF97316, 1);
      g.fillRoundedRect(-half, -half, s, s, 14);
      g.strokeRoundedRect(-half, -half, s, s, 14);

      // Inner target circle
      g.lineStyle(2, 0xFDBA74, 1);
      g.strokeCircle(0, 0, half * 0.5);
    }
  }

  private renderDoorGraphic(g: Phaser.GameObjects.Graphics, size: number, isOpen: boolean): void {
    const s = size * 0.86;
    const half = s / 2;

    if (isOpen) {
      // Unsealed Emerald Gateway
      g.fillStyle(0x10B981, 0.35);
      g.fillRoundedRect(-half * 1.05, -half * 1.05, s * 1.05, s * 1.05, 16);

      g.fillStyle(0xD1FAE5, 0.95);
      g.lineStyle(3, 0x10B981, 1);
      g.fillRoundedRect(-half, -half, s, s, 14);
      g.strokeRoundedRect(-half, -half, s, s, 14);

      // Inviting portal archway
      g.fillStyle(0x34D399, 0.9);
      g.fillRoundedRect(-half * 0.55, -half * 0.55, s * 0.55, s * 0.8, 10);
    } else {
      // Sealed Stone Barrier
      g.fillStyle(0x475569, 1);
      g.lineStyle(3, 0x1E293B, 1);
      g.fillRoundedRect(-half, -half, s, s, 14);
      g.strokeRoundedRect(-half, -half, s, s, 14);

      // Iron barrier bars
      g.lineStyle(2, 0x334155, 1);
      g.lineBetween(-half * 0.4, -half * 0.6, -half * 0.4, half * 0.6);
      g.lineBetween(0, -half * 0.6, 0, half * 0.6);
      g.lineBetween(half * 0.4, -half * 0.6, half * 0.4, half * 0.6);

      // Center lock seal
      g.fillStyle(0xF59E0B, 1);
      g.fillCircle(0, 0, s * 0.12);
    }
  }

  private renderWallGraphic(g: Phaser.GameObjects.Graphics, size: number): void {
    const s = size * 0.92;
    const half = s / 2;

    g.fillStyle(0x334155, 1); // Deep slate wall
    g.lineStyle(2, 0x1E293B, 1);
    g.fillRoundedRect(-half, -half, s, s, 10);
    g.strokeRoundedRect(-half, -half, s, s, 10);

    // Subtle inner bevel
    g.fillStyle(0x475569, 0.6);
    g.fillRoundedRect(-half * 0.6, -half * 0.6, s * 0.6, s * 0.6, 6);
  }


  private renderNpcGraphic(g: Phaser.GameObjects.Graphics, size: number, entity: Entity): void {
    const s = size * 0.85;
    const half = s / 2;
    const isSoothed = entity.npc?.isSoothed || false;

    // 1. Glowing, pulsing mood aura halo
    if (isSoothed) {
      // Golden Peaceful / Joyful Aura
      g.fillStyle(0xFDE047, 0.4);
      g.fillCircle(0, 0, half * 1.35);
      g.fillStyle(0xFEF08A, 0.5);
      g.fillCircle(0, 0, half * 1.1);

      // Star glint sparkles
      g.fillStyle(0xFFFFFF, 0.9);
      g.fillCircle(-half * 0.8, -half * 0.8, 3);
      g.fillCircle(half * 0.8, -half * 0.7, 3);
    } else {
      // Anxious Amber Tremor Aura
      g.fillStyle(0xF59E0B, 0.35);
      g.fillCircle(0, 0, half * 1.25);
      g.lineStyle(2, 0xFBBF24, 0.6);
      g.strokeCircle(0, 0, half * 1.15);
    }

    // 2. Forest Spirit Sprout Body (Cute woodland creature)
    g.fillStyle(0x10B981, 1); // Forest emerald body
    g.lineStyle(2.5, 0x047857, 1);
    g.fillRoundedRect(-half * 0.6, -half * 0.3, s * 0.6, s * 0.7, 16);
    g.strokeRoundedRect(-half * 0.6, -half * 0.3, s * 0.6, s * 0.7, 16);

    // 3. Sprout Head Leaves
    g.fillStyle(0x34D399, 1);
    g.lineStyle(1.5, 0x059669, 1);
    // Left leaf
    g.fillEllipse(-half * 0.25, -half * 0.55, s * 0.3, s * 0.15);
    g.strokeEllipse(-half * 0.25, -half * 0.55, s * 0.3, s * 0.15);
    // Right leaf
    g.fillEllipse(half * 0.25, -half * 0.55, s * 0.3, s * 0.15);
    g.strokeEllipse(half * 0.25, -half * 0.55, s * 0.3, s * 0.15);

    // Leaf stem
    g.lineStyle(2, 0x047857, 1);
    g.lineBetween(0, -half * 0.3, 0, -half * 0.5);

    // 4. Expressive Eyes & Mood
    if (isSoothed) {
      // Cheerful Happy Curved Eyes (^ ^)
      g.lineStyle(2, 0x064E3B, 1);
      g.beginPath();
      g.arc(-half * 0.2, -half * 0.05, 4, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false);
      g.arc(half * 0.2, -half * 0.05, 4, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false);
      g.strokePath();

      // Sweet smiling mouth
      g.beginPath();
      g.arc(0, half * 0.15, 5, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160), false);
      g.strokePath();

      // Soft blushing cheeks
      g.fillStyle(0xFCA5A5, 0.6);
      g.fillCircle(-half * 0.35, half * 0.1, 3);
      g.fillCircle(half * 0.35, half * 0.1, 3);
    } else {
      // Anxious / Worried Wide Eyes
      g.fillStyle(0x064E3B, 1);
      g.fillCircle(-half * 0.2, -half * 0.05, 3);
      g.fillCircle(half * 0.2, -half * 0.05, 3);

      // Trembling wavy mouth line
      g.lineStyle(1.8, 0x064E3B, 1);
      g.beginPath();
      g.moveTo(-half * 0.15, half * 0.18);
      g.lineTo(0, half * 0.12);
      g.lineTo(half * 0.15, half * 0.18);
      g.strokePath();
    }
  }

  private renderLightOrbGraphic(g: Phaser.GameObjects.Graphics, size: number): void {
    const radius = size * 0.22;

    // Radiant outer glow
    g.fillStyle(0xFDE68A, 0.45);
    g.fillCircle(0, 0, radius * 1.5);

    // Warm inner glowing core
    g.fillStyle(0xFEF08A, 1);
    g.lineStyle(2, 0xF59E0B, 0.9);
    g.fillCircle(0, 0, radius);
    g.strokeCircle(0, 0, radius);

    // Friendly eyes
    g.fillStyle(0x78350F, 1);
    g.fillCircle(-radius * 0.35, -radius * 0.15, 2);
    g.fillCircle(radius * 0.35, -radius * 0.15, 2);

    // Gentle smile arc
    g.lineStyle(1.8, 0x78350F, 1);
    g.beginPath();
    g.arc(0, 0, radius * 0.45, Phaser.Math.DegToRad(30), Phaser.Math.DegToRad(150), false);
    g.strokePath();
  }
}
