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
import type { LightOrbExpression } from "../../ecs/systems/MentorSystem";
import type { BedtimePhase } from "../../lib/bedtime/bedtimeManager";

export interface ShrineSceneInitData {
  world?: GameWorld;
  room?: RoomDefinition;
  onCellTap?: (point: GridPoint, screenX: number, screenY: number) => void;
  onRoomCompleted?: () => void;
  onNpcTap?: (npc: Entity) => void;
  onMirrorTap?: (mirror: Entity) => void;
  bedtimePhase?: BedtimePhase;
}

export class ShrineScene extends Phaser.Scene {
  public world!: GameWorld;
  public room!: RoomDefinition;
  public onCellTap?: (point: GridPoint, screenX: number, screenY: number) => void;
  public onRoomCompleted?: () => void;
  public onNpcTap?: (npc: Entity) => void;
  public onMirrorTap?: (mirror: Entity) => void;

  public static readonly CANVAS_WIDTH = 1280;
  public static readonly CANVAS_HEIGHT = 720;

  // Grid layout metrics
  public layoutMetrics!: SceneLayoutMetrics;
  public tileSize: number = 80;
  public gridOffsetX: number = 0;
  public gridOffsetY: number = 0;
  public roomWidth: number = 8;
  public roomHeight: number = 6;

  // Companion Light Orb state & visuals
  public currentExpression: LightOrbExpression = "happy";
  public bedtimePhase: BedtimePhase = "daylight";
  private lastRenderedExpression?: LightOrbExpression;
  private lastRenderedBedtimeDimmed?: boolean;
  private lightOrbContainer?: Phaser.GameObjects.Container;
  private orbVisualContainer?: Phaser.GameObjects.Container;
  private orbGraphics?: Phaser.GameObjects.Graphics;
  private orbBobTween?: Phaser.Tweens.Tween;
  private particleEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  // Visual game object tracking
  private gridContainer?: Phaser.GameObjects.Container;
  private entityContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private entityRegisteredGridPos: Map<string, { x: number; y: number }> = new Map();
  private entityTweens: Map<string, Phaser.Tweens.Tween> = new Map();
  private plateStates: Map<string, boolean> = new Map();
  private doorStates: Map<string, boolean> = new Map();
  private npcSoothedStates: Map<string, boolean> = new Map();
  private mirrorAngles: Map<string, number> = new Map();
  private receptorStates: Map<string, boolean> = new Map();
  private gateStates: Map<string, boolean> = new Map();
  private switchStates: Map<string, boolean> = new Map();
  private conduitGraphics?: Phaser.GameObjects.Graphics;
  private beamGraphics?: Phaser.GameObjects.Graphics;

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
    this.onMirrorTap = data?.onMirrorTap;
  }

  public preload(): void {
    if (!this.textures.exists("atlas-global-entities")) {
      this.load.atlas(
        "atlas-global-entities",
        "/assets/atlases/atlas-global-entities.webp",
        "/assets/atlases/atlas-global-entities.json"
      );
    }
    if (!this.textures.exists("atlas-shrine-environment")) {
      this.load.atlas(
        "atlas-shrine-environment",
        "/assets/atlases/atlas-shrine-environment.webp",
        "/assets/atlases/atlas-shrine-environment.json"
      );
    }
  }

  public hasAtlas(atlasKey: string): boolean {
    return Boolean(this.textures && this.textures.exists(atlasKey));
  }

  public hasFrame(atlasKey: string, frameKey: string): boolean {
    if (!this.hasAtlas(atlasKey)) return false;
    const texture = this.textures.get(atlasKey);
    return Boolean(texture && texture.has(frameKey));
  }

  public registerAnimations(): void {
    if (!this.textures || !this.textures.exists("atlas-global-entities")) {
      return;
    }

    const anims = this.anims;

    // zyra_idle: frames zyra-idle-01..06 @ 8 FPS repeat -1
    if (!anims.exists("zyra_idle")) {
      anims.create({
        key: "zyra_idle",
        frames: anims.generateFrameNames("atlas-global-entities", {
          prefix: "zyra-idle-",
          start: 1,
          end: 6,
          zeroPad: 2,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // zyra_walk: frames zyra-walk-01..08 @ 12 FPS repeat -1
    if (!anims.exists("zyra_walk")) {
      anims.create({
        key: "zyra_walk",
        frames: anims.generateFrameNames("atlas-global-entities", {
          prefix: "zyra-walk-",
          start: 1,
          end: 8,
          zeroPad: 2,
        }),
        frameRate: 12,
        repeat: -1,
      });
    }

    // zyra_push: frames zyra-push-01..06 @ 12 FPS
    if (!anims.exists("zyra_push")) {
      anims.create({
        key: "zyra_push",
        frames: anims.generateFrameNames("atlas-global-entities", {
          prefix: "zyra-push-",
          start: 1,
          end: 6,
          zeroPad: 2,
        }),
        frameRate: 12,
      });
    }

    // zyra_celebrate: frames zyra-celebrate-01..08 @ 12 FPS
    if (!anims.exists("zyra_celebrate")) {
      anims.create({
        key: "zyra_celebrate",
        frames: anims.generateFrameNames("atlas-global-entities", {
          prefix: "zyra-celebrate-",
          start: 1,
          end: 8,
          zeroPad: 2,
        }),
        frameRate: 12,
      });
    }

    // sprout_anxious: frames sprout-anxious-01..08 @ 8 FPS repeat -1
    if (!anims.exists("sprout_anxious")) {
      anims.create({
        key: "sprout_anxious",
        frames: anims.generateFrameNames("atlas-global-entities", {
          prefix: "sprout-anxious-",
          start: 1,
          end: 8,
          zeroPad: 2,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // sprout_breathe: frames sprout-breathe-01..08 @ 8 FPS repeat -1
    if (!anims.exists("sprout_breathe")) {
      anims.create({
        key: "sprout_breathe",
        frames: anims.generateFrameNames("atlas-global-entities", {
          prefix: "sprout-breathe-",
          start: 1,
          end: 8,
          zeroPad: 2,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  public create(): void {
    this.conduitGraphics = this.add.graphics();
    this.conduitGraphics.setDepth(1);
    this.beamGraphics = this.add.graphics();
    this.beamGraphics.setDepth(12);

    this.registerAnimations();

    this.load.on("complete", () => {
      this.registerAnimations();
      this.buildGrid();
      this.buildEntities();
      this.buildCompanionOrb();
    });

    if (
      (!this.textures.exists("atlas-global-entities") || !this.textures.exists("atlas-shrine-environment")) &&
      !this.load.isLoading()
    ) {
      if (!this.textures.exists("atlas-global-entities")) {
        this.load.atlas(
          "atlas-global-entities",
          "/assets/atlases/atlas-global-entities.webp",
          "/assets/atlases/atlas-global-entities.json"
        );
      }
      if (!this.textures.exists("atlas-shrine-environment")) {
        this.load.atlas(
          "atlas-shrine-environment",
          "/assets/atlases/atlas-shrine-environment.webp",
          "/assets/atlases/atlas-shrine-environment.json"
        );
      }
      this.load.start();
    }

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

    const hasEnvAtlas = this.hasFrame("atlas-shrine-environment", "tile-floor-light");

    // Grid cells with storybook atlas tiles or alternating pastel fills
    for (let y = 0; y < this.roomHeight; y++) {
      for (let x = 0; x < this.roomWidth; x++) {
        const cellX = this.gridOffsetX + x * this.tileSize;
        const cellY = this.gridOffsetY + y * this.tileSize;
        const isAlternate = (x + y) % 2 === 0;

        if (hasEnvAtlas) {
          const frameKey = isAlternate ? "tile-floor-light" : "tile-floor-dark";
          const tileSprite = this.add.sprite(
            cellX + this.tileSize / 2,
            cellY + this.tileSize / 2,
            "atlas-shrine-environment",
            frameKey
          );
          tileSprite.setDisplaySize(this.tileSize, this.tileSize);
          this.gridContainer.add(tileSprite);
        } else {
          // Fallback: light pastel cream/white vs soft grayish blue
          const fillColor = isAlternate ? 0xF8FAFC : 0xEDF2F7;
          graphics.fillStyle(fillColor, 0.9);
          graphics.lineStyle(1, 0xCBD5E1, 0.5);

          graphics.fillRoundedRect(cellX + 2, cellY + 2, this.tileSize - 4, this.tileSize - 4, 8);
          graphics.strokeRoundedRect(cellX + 2, cellY + 2, this.tileSize - 4, this.tileSize - 4, 8);
        }
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

    const s = this.tileSize;

    switch (entity.renderable.shape) {
      case "avatar": {
        if (this.hasFrame("atlas-global-entities", "zyra-idle-01")) {
          const sprite = this.add.sprite(0, 0, "atlas-global-entities", "zyra-idle-01");
          sprite.setDisplaySize(s, s);
          container.add(sprite);
          container.setData("sprite", sprite);
          if (this.anims.exists("zyra_idle")) {
            sprite.play("zyra_idle");
          }
        } else {
          const graphics = this.add.graphics();
          container.add(graphics);
          container.setData("graphics", graphics);
          this.renderAvatarGraphic(graphics, this.tileSize);
          this.tweens.add({
            targets: container,
            scaleY: 1.03,
            scaleX: 0.98,
            duration: 1100,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });
        }
        break;
      }

      case "stone": {
        if (this.hasFrame("atlas-global-entities", "stone-block")) {
          const sprite = this.add.sprite(0, 0, "atlas-global-entities", "stone-block");
          sprite.setDisplaySize(s, s);
          container.add(sprite);
          container.setData("sprite", sprite);
        } else {
          const graphics = this.add.graphics();
          container.add(graphics);
          container.setData("graphics", graphics);
          this.renderStoneBlockGraphic(graphics, this.tileSize);
        }
        break;
      }

      case "ice": {
        if (this.hasFrame("atlas-global-entities", "ice-block")) {
          const sprite = this.add.sprite(0, 0, "atlas-global-entities", "ice-block");
          sprite.setDisplaySize(s, s);
          container.add(sprite);
          container.setData("sprite", sprite);
        } else {
          const graphics = this.add.graphics();
          container.add(graphics);
          container.setData("graphics", graphics);
          this.renderIceBlockGraphic(graphics, this.tileSize);
        }
        break;
      }

      case "plate": {
        const isDepressed = entity.trigger?.isDepressed || false;
        this.plateStates.set(entity.id, isDepressed);
        const frameKey = isDepressed ? "plate-active" : "plate-dormant";
        if (this.hasFrame("atlas-shrine-environment", frameKey)) {
          const sprite = this.add.sprite(0, 0, "atlas-shrine-environment", frameKey);
          sprite.setDisplaySize(s, s);
          container.add(sprite);
          container.setData("sprite", sprite);
        } else {
          const graphics = this.add.graphics();
          container.add(graphics);
          container.setData("graphics", graphics);
          this.renderPressurePlateGraphic(graphics, this.tileSize, isDepressed);
        }
        break;
      }

      case "door": {
        const isOpen = entity.collider ? !entity.collider.isSolid : false;
        this.doorStates.set(entity.id, isOpen);
        const frameKey = isOpen ? "door-open" : "door-sealed";
        if (this.hasFrame("atlas-shrine-environment", frameKey)) {
          const sprite = this.add.sprite(0, 0, "atlas-shrine-environment", frameKey);
          sprite.setDisplaySize(s, s);
          container.add(sprite);
          container.setData("sprite", sprite);
        } else {
          const graphics = this.add.graphics();
          container.add(graphics);
          container.setData("graphics", graphics);
          this.renderDoorGraphic(graphics, this.tileSize, isOpen);
        }
        break;
      }

      case "wall": {
        if (this.hasFrame("atlas-shrine-environment", "wall-cap-chamfer-top")) {
          const sprite = this.add.sprite(0, 0, "atlas-shrine-environment", "wall-cap-chamfer-top");
          sprite.setDisplaySize(s, s);
          container.add(sprite);
          container.setData("sprite", sprite);
        } else {
          const graphics = this.add.graphics();
          container.add(graphics);
          container.setData("graphics", graphics);
          this.renderWallGraphic(graphics, this.tileSize);
        }
        break;
      }

      case "npc": {
        const isSoothed = entity.npc?.isSoothed || false;
        this.npcSoothedStates.set(entity.id, isSoothed);
        const initialFrame = isSoothed ? "sprout-breathe-01" : "sprout-anxious-01";
        if (this.hasFrame("atlas-global-entities", initialFrame)) {
          const sprite = this.add.sprite(0, 0, "atlas-global-entities", initialFrame);
          sprite.setDisplaySize(s, s);
          container.add(sprite);
          container.setData("sprite", sprite);
          const animKey = isSoothed ? "sprout_breathe" : "sprout_anxious";
          if (this.anims.exists(animKey)) {
            sprite.play(animKey);
          }
        } else {
          const graphics = this.add.graphics();
          container.add(graphics);
          container.setData("graphics", graphics);
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
        }
        break;
      }

      case "emitter": {
        const dir = entity.optics?.direction || "east";
        const frameKey = `emitter-brass-${dir}`;
        if (this.hasFrame("atlas-shrine-environment", frameKey)) {
          const sprite = this.add.sprite(0, 0, "atlas-shrine-environment", frameKey);
          sprite.setDisplaySize(s, s);
          container.add(sprite);
          container.setData("sprite", sprite);
        } else {
          const graphics = this.add.graphics();
          container.add(graphics);
          container.setData("graphics", graphics);
          this.renderEmitterGraphic(graphics, this.tileSize, entity);
        }
        break;
      }

      case "mirror": {
        const mAngle = entity.optics?.angle ?? 45;
        this.mirrorAngles.set(entity.id, mAngle);
        const normAngle = ((mAngle % 180) + 180) % 180;
        const frameKey = `mirror-prism-${normAngle}deg`;
        if (this.hasFrame("atlas-shrine-environment", frameKey)) {
          const sprite = this.add.sprite(0, 0, "atlas-shrine-environment", frameKey);
          sprite.setDisplaySize(s, s);
          container.add(sprite);
          container.setData("sprite", sprite);
        } else {
          const graphics = this.add.graphics();
          container.add(graphics);
          container.setData("graphics", graphics);
          this.renderMirrorGraphic(graphics, this.tileSize, mAngle);
        }
        break;
      }

      case "receptor": {
        const isRecActivated = entity.optics?.isActivated ?? false;
        this.receptorStates.set(entity.id, isRecActivated);
        const frameKey = isRecActivated ? "receptor-solar-active" : "receptor-solar-dormant";
        if (this.hasFrame("atlas-shrine-environment", frameKey)) {
          const sprite = this.add.sprite(0, 0, "atlas-shrine-environment", frameKey);
          sprite.setDisplaySize(s, s);
          container.add(sprite);
          container.setData("sprite", sprite);
        } else {
          const graphics = this.add.graphics();
          container.add(graphics);
          container.setData("graphics", graphics);
          this.renderReceptorGraphic(graphics, this.tileSize, isRecActivated);
        }
        break;
      }

      case "gate": {
        const isSatisfied = entity.logicGate?.isSatisfied ?? false;
        this.gateStates.set(entity.id, isSatisfied);
        const frameKey = isSatisfied ? "logic-nexus-active" : "logic-nexus-dormant";
        if (this.hasFrame("atlas-shrine-environment", frameKey)) {
          const sprite = this.add.sprite(0, 0, "atlas-shrine-environment", frameKey);
          sprite.setDisplaySize(s, s);
          container.add(sprite);
          container.setData("sprite", sprite);
        } else {
          const graphics = this.add.graphics();
          container.add(graphics);
          container.setData("graphics", graphics);
          this.renderGateGraphic(graphics, this.tileSize, isSatisfied);
        }
        break;
      }

      case "switch": {
        const isDepSw = entity.trigger?.isDepressed ?? false;
        this.switchStates.set(entity.id, isDepSw);
        let dotCount = 1;
        if (entity.id.includes("2")) dotCount = 2;
        else if (entity.id.includes("3")) dotCount = 3;
        const frameKey = `switch-runic-${dotCount}-${isDepSw ? "on" : "off"}`;
        if (this.hasFrame("atlas-shrine-environment", frameKey)) {
          const sprite = this.add.sprite(0, 0, "atlas-shrine-environment", frameKey);
          sprite.setDisplaySize(s, s);
          container.add(sprite);
          container.setData("sprite", sprite);
        } else {
          const graphics = this.add.graphics();
          container.add(graphics);
          container.setData("graphics", graphics);
          this.renderFloorSwitchGraphic(graphics, this.tileSize, entity, isDepSw);
        }
        break;
      }
    }

    this.entityContainers.set(entity.id, container);
    this.entityRegisteredGridPos.set(entity.id, { x: entity.position.x, y: entity.position.y });

    return container;
  }

  /**
   * Generates a procedural radial bokeh particle texture for the companion Light Orb aura trail.
   */
  public ensureBokehParticleTexture(): void {
    if (this.textures.exists("ztlo_bokeh_particle")) return;

    const g = this.make.graphics({ x: 0, y: 0 });
    // Smooth radial bokeh starlight layers with exponential falloff
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(16, 16, 3.5);

    g.fillStyle(0xFDE68A, 0.7);
    g.fillCircle(16, 16, 7.5);

    g.fillStyle(0xFBBF24, 0.38);
    g.fillCircle(16, 16, 11.5);

    g.fillStyle(0xF59E0B, 0.12);
    g.fillCircle(16, 16, 16);

    g.generateTexture("ztlo_bokeh_particle", 32, 32);
    g.destroy();
  }

  public isBedtimeTwilight(): boolean {
    return this.bedtimePhase === "twilight" || this.bedtimePhase === "bedtime";
  }

  /**
   * Builds the floating companion Light Orb near the player with procedural bokeh particle trail.
   */
  public buildCompanionOrb(): void {
    if (this.lightOrbContainer) {
      this.lightOrbContainer.destroy(true);
      this.lightOrbContainer = undefined;
    }
    if (this.particleEmitter) {
      this.particleEmitter.destroy();
      this.particleEmitter = undefined;
    }

    this.ensureBokehParticleTexture();

    const player = this.world.getPlayer();
    const startGridX = player ? player.position.x : 1;
    const startGridY = player ? Math.max(0, player.position.y - 1) : 1;

    const orbPos = gridToScreenPoint(startGridX, startGridY, this.layoutMetrics);
    const orbX = orbPos.x + 18;
    const orbY = orbPos.y - 14;

    this.lightOrbContainer = this.add.container(orbX, orbY);
    this.lightOrbContainer.setDepth(15);

    const isBedtime = this.isBedtimeTwilight();

    // Procedural radial bokeh particle trail following the Light Orb
    this.particleEmitter = this.add.particles(orbX, orbY, "ztlo_bokeh_particle", {
      lifespan: { min: 600, max: 1100 },
      speed: { min: 8, max: 24 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.65, end: 0.05, ease: "Sine.easeOut" },
      alpha: isBedtime ? { start: 0.28, end: 0 } : { start: 0.65, end: 0 },
      tint: isBedtime
        ? [0xC4B5FD, 0xA78BFA, 0xFDE68A, 0xDDD6FE]
        : [0xFDE68A, 0xF59E0B, 0xFFFFFF, 0xFBBF24],
      blendMode: Phaser.BlendModes.ADD,
      frequency: 140,
      quantity: 1,
    });
    this.particleEmitter.setDepth(14);
    this.particleEmitter.startFollow(this.lightOrbContainer);

    // Inner visual container so translation and sinusoidal bobbing don't conflict
    this.orbVisualContainer = this.add.container(0, 0);
    this.lightOrbContainer.add(this.orbVisualContainer);

    this.currentExpression = this.world
      ? this.world.getMentorExpression(this.bedtimePhase)
      : this.currentExpression;
    this.lastRenderedExpression = this.currentExpression;
    this.lastRenderedBedtimeDimmed = isBedtime;

    this.renderCompanionVisualContents();

    // Gentle sinusoidal bobbing tween on inner visual container
    this.orbBobTween = this.tweens.add({
      targets: this.orbVisualContainer,
      y: -8,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  /**
   * Renders visual contents of the Light Orb (aura + vector graphic face).
   */
  private renderCompanionVisualContents(): void {
    if (!this.orbVisualContainer) return;
    this.orbVisualContainer.removeAll(true);

    const isBedtime = this.isBedtimeTwilight();
    const frameKey = `orb-faces-${this.currentExpression}`;

    if (this.hasFrame("atlas-global-entities", frameKey)) {
      const aura = this.add.graphics();
      aura.fillStyle(isBedtime ? 0xC4B5FD : 0xFDE68A, isBedtime ? 0.3 : 0.45);
      aura.fillCircle(0, 0, this.tileSize * 0.33);
      aura.fillStyle(isBedtime ? 0xDDD6FE : 0xFEF08A, isBedtime ? 0.6 : 0.95);
      aura.fillCircle(0, 0, this.tileSize * 0.22);
      this.orbVisualContainer.add(aura);

      const sprite = this.add.sprite(0, 0, "atlas-global-entities", frameKey);
      sprite.setDisplaySize(this.tileSize * 0.48, this.tileSize * 0.48);
      if (isBedtime) {
        sprite.setAlpha(0.85);
      }
      this.orbVisualContainer.add(sprite);
    } else {
      this.orbGraphics = this.add.graphics();
      this.orbVisualContainer.add(this.orbGraphics);
      this.renderLightOrbGraphic(this.orbGraphics, this.tileSize, this.currentExpression, isBedtime);
    }
  }

  /**
   * Updates Light Orb visual representation and particle trail to match current expression & phase.
   */
  public updateLightOrbVisuals(): void {
    this.renderCompanionVisualContents();

    const isBedtime = this.isBedtimeTwilight();
    if (this.particleEmitter) {
      if (isBedtime) {
        this.particleEmitter.setAlpha(0.28);
        this.particleEmitter.particleTint = 0xC4B5FD;
      } else {
        this.particleEmitter.setAlpha(0.65);
        this.particleEmitter.particleTint = 0xFDE68A;
      }
    }
  }

  public setCompanionExpression(expression: LightOrbExpression): void {
    if (this.currentExpression === expression) return;
    this.currentExpression = expression;
    this.lastRenderedExpression = expression;
    this.updateLightOrbVisuals();
  }

  public setBedtimePhase(phase: BedtimePhase): void {
    if (this.bedtimePhase === phase) return;
    this.bedtimePhase = phase;
    if (this.isBedtimeTwilight()) {
      this.currentExpression = "sleepy";
    }
    this.updateLightOrbVisuals();
  }

  public getCompanionExpression(): LightOrbExpression {
    return this.currentExpression;
  }

  public getParticleEmitter(): Phaser.GameObjects.Particles.ParticleEmitter | undefined {
    return this.particleEmitter;
  }

  public getLightOrbContainer(): Phaser.GameObjects.Container | undefined {
    return this.lightOrbContainer;
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

        const tappedMirror = this.world.getEntityList().find(
          (e) => e.optics?.opticsType === "mirror" && e.position.x === point.x && e.position.y === point.y
        );
        if (tappedMirror) {
          this.world.rotateMirror(tappedMirror.id);
          if (this.onMirrorTap) {
            this.onMirrorTap(tappedMirror);
          }
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

        // Update Light Orb position to follow Zyra gently in 2D
        if (entity.renderable.shape === "avatar" && this.lightOrbContainer) {
          this.tweens.add({
            targets: this.lightOrbContainer,
            x: pos.x + 18,
            y: pos.y - 14,
            duration: 420,
            ease: "Quad.easeOut",
          });
        }
      }

      // Handle Avatar sprite animation states (idle, walk, push)
      if (entity.renderable.shape === "avatar") {
        const sprite = container.getData("sprite") as Phaser.GameObjects.Sprite | undefined;
        if (sprite) {
          const isMoving = Boolean(entity.movement?.isMoving);
          const isPushing = Boolean(isMoving && entities.some((e) => e.pushable?.isSliding));
          const currentAnim = sprite.anims.currentAnim?.key;

          if (isPushing) {
            if (currentAnim !== "zyra_push" && this.anims.exists("zyra_push")) {
              sprite.play("zyra_push", true);
            }
          } else if (isMoving) {
            if (currentAnim !== "zyra_walk" && this.anims.exists("zyra_walk")) {
              sprite.play("zyra_walk", true);
            }
          } else {
            if (currentAnim !== "zyra_idle" && currentAnim !== "zyra_celebrate" && this.anims.exists("zyra_idle")) {
              sprite.play("zyra_idle", true);
            }
          }

          // Orient sprite based on movement direction
          if (entity.movement?.target) {
            if (entity.movement.target.x < entity.position.x) {
              sprite.setFlipX(true);
            } else if (entity.movement.target.x > entity.position.x) {
              sprite.setFlipX(false);
            }
          }
        }
      }

      // Handle Ice block sliding sprite state
      if (entity.renderable.shape === "ice") {
        const sprite = container.getData("sprite") as Phaser.GameObjects.Sprite | undefined;
        if (sprite) {
          const frameKey = entity.pushable?.isSliding ? "ice-block-sliding" : "ice-block";
          if (this.hasFrame("atlas-global-entities", frameKey)) {
            sprite.setFrame(frameKey);
          }
        }
      }

      // Handle Pressure Plate visual state changes (depressed / released)
      if (entity.renderable.shape === "plate" && entity.trigger) {
        const lastDepressed = this.plateStates.get(entity.id);
        const currentDepressed = entity.trigger.isDepressed;

        if (lastDepressed !== currentDepressed) {
          this.plateStates.set(entity.id, currentDepressed);
          const sprite = container.getData("sprite") as Phaser.GameObjects.Sprite | undefined;
          if (sprite) {
            const frameKey = currentDepressed ? "plate-active" : "plate-dormant";
            if (this.hasFrame("atlas-shrine-environment", frameKey)) {
              sprite.setFrame(frameKey);
            }
          }
          const graphics = container.getData("graphics") as Phaser.GameObjects.Graphics | undefined;
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
          const sprite = container.getData("sprite") as Phaser.GameObjects.Sprite | undefined;
          if (sprite) {
            const animKey = currentSoothed ? "sprout_breathe" : "sprout_anxious";
            if (this.anims.exists(animKey)) {
              sprite.play(animKey);
            } else {
              const frameKey = currentSoothed ? "sprout-breathe-01" : "sprout-anxious-01";
              if (this.hasFrame("atlas-global-entities", frameKey)) {
                sprite.setFrame(frameKey);
              }
            }
          }
          const graphics = container.getData("graphics") as Phaser.GameObjects.Graphics | undefined;
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
          const sprite = container.getData("sprite") as Phaser.GameObjects.Sprite | undefined;
          if (sprite) {
            const frameKey = currentOpen ? "door-open" : "door-sealed";
            if (this.hasFrame("atlas-shrine-environment", frameKey)) {
              sprite.setFrame(frameKey);
            }
          }
          const graphics = container.getData("graphics") as Phaser.GameObjects.Graphics | undefined;
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

      // Handle Mirror rotation angle changes
      if (entity.renderable.shape === "mirror" && entity.optics) {
        const lastAngle = this.mirrorAngles.get(entity.id);
        const currentAngle = entity.optics.angle ?? 45;

        if (lastAngle !== currentAngle) {
          this.mirrorAngles.set(entity.id, currentAngle);
          const sprite = container.getData("sprite") as Phaser.GameObjects.Sprite | undefined;
          if (sprite) {
            const normAngle = ((currentAngle % 180) + 180) % 180;
            const frameKey = `mirror-prism-${normAngle}deg`;
            if (this.hasFrame("atlas-shrine-environment", frameKey)) {
              sprite.setFrame(frameKey);
            }
          }
          const graphics = container.getData("graphics") as Phaser.GameObjects.Graphics | undefined;
          if (graphics) {
            graphics.clear();
            this.renderMirrorGraphic(graphics, this.tileSize, currentAngle);
          }

          this.tweens.add({
            targets: container,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 150,
            yoyo: true,
            ease: "Back.easeOut",
          });
        }
      }

      // Handle Receptor visual activation
      if (entity.renderable.shape === "receptor" && entity.optics) {
        const lastActivated = this.receptorStates.get(entity.id);
        const currentActivated = entity.optics.isActivated ?? false;

        if (lastActivated !== currentActivated) {
          this.receptorStates.set(entity.id, currentActivated);
          const sprite = container.getData("sprite") as Phaser.GameObjects.Sprite | undefined;
          if (sprite) {
            const frameKey = currentActivated ? "receptor-solar-active" : "receptor-solar-dormant";
            if (this.hasFrame("atlas-shrine-environment", frameKey)) {
              sprite.setFrame(frameKey);
            }
          }
          const graphics = container.getData("graphics") as Phaser.GameObjects.Graphics | undefined;
          if (graphics) {
            graphics.clear();
            this.renderReceptorGraphic(graphics, this.tileSize, currentActivated);
          }

          if (currentActivated) {
            this.tweens.add({
              targets: container,
              scaleX: 1.2,
              scaleY: 1.2,
              duration: 200,
              yoyo: true,
              ease: "Back.easeOut",
            });
          }
        }
      }

      // Handle Gate visual state changes
      if (entity.renderable.shape === "gate" && entity.logicGate) {
        const lastSatisfied = this.gateStates.get(entity.id);
        const currentSatisfied = entity.logicGate.isSatisfied;

        if (lastSatisfied !== currentSatisfied) {
          this.gateStates.set(entity.id, currentSatisfied);
          const sprite = container.getData("sprite") as Phaser.GameObjects.Sprite | undefined;
          if (sprite) {
            const frameKey = currentSatisfied ? "logic-nexus-active" : "logic-nexus-dormant";
            if (this.hasFrame("atlas-shrine-environment", frameKey)) {
              sprite.setFrame(frameKey);
            }
          }
          const graphics = container.getData("graphics") as Phaser.GameObjects.Graphics | undefined;
          if (graphics) {
            graphics.clear();
            this.renderGateGraphic(graphics, this.tileSize, currentSatisfied);
          }

          if (currentSatisfied) {
            this.tweens.add({
              targets: container,
              scaleX: 1.2,
              scaleY: 1.2,
              duration: 250,
              yoyo: true,
              ease: "Back.easeOut",
            });
          }
        }
      }

      // Handle Floor Switch visual state changes
      if (entity.renderable.shape === "switch" && entity.trigger) {
        const lastDepressed = this.switchStates.get(entity.id);
        const currentDepressed = entity.trigger.isDepressed;

        if (lastDepressed !== currentDepressed) {
          this.switchStates.set(entity.id, currentDepressed);
          const sprite = container.getData("sprite") as Phaser.GameObjects.Sprite | undefined;
          if (sprite) {
            let dotCount = 1;
            if (entity.id.includes("2")) dotCount = 2;
            else if (entity.id.includes("3")) dotCount = 3;
            const frameKey = `switch-runic-${dotCount}-${currentDepressed ? "on" : "off"}`;
            if (this.hasFrame("atlas-shrine-environment", frameKey)) {
              sprite.setFrame(frameKey);
            }
          }
          const graphics = container.getData("graphics") as Phaser.GameObjects.Graphics | undefined;
          if (graphics) {
            graphics.clear();
            this.renderFloorSwitchGraphic(graphics, this.tileSize, entity, currentDepressed);
          }

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
    }

    this.renderFloorConduits();
    this.renderOpticsBeams();
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
    this.renderFloorConduits();
    this.renderOpticsBeams();
  }

  /**
   * Triggers Zyra's celebration animation upon room or puzzle completion.
   */
  public celebrateCompletion(): void {
    const avatar = this.world.getEntityList().find((e) => e.renderable.shape === "avatar");
    if (avatar) {
      const container = this.entityContainers.get(avatar.id);
      const sprite = container?.getData("sprite") as Phaser.GameObjects.Sprite | undefined;
      if (sprite && this.anims.exists("zyra_celebrate")) {
        sprite.play("zyra_celebrate");
      }
    }
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



  public renderFloorConduits(): void {
    if (!this.conduitGraphics) return;
    this.conduitGraphics.clear();

    const gates = this.world.getLogicGates();
    if (!gates || gates.length === 0) return;

    for (const gateEntity of gates) {
      const gate = gateEntity.logicGate;
      if (!gate) continue;

      const isSatisfied = gate.isSatisfied;
      const tiles = gate.conduitTiles;

      if (tiles && tiles.length > 1) {
        const screenPoints = tiles.map((t) =>
          gridToScreenPoint(t.x, t.y, this.layoutMetrics)
        );

        if (isSatisfied) {
          // Active glowing cyan conduit circuit
          this.conduitGraphics.lineStyle(8, 0x06B6D4, 0.45);
          this.conduitGraphics.beginPath();
          this.conduitGraphics.moveTo(screenPoints[0].x, screenPoints[0].y);
          for (let i = 1; i < screenPoints.length; i++) {
            this.conduitGraphics.lineTo(screenPoints[i].x, screenPoints[i].y);
          }
          this.conduitGraphics.strokePath();

          this.conduitGraphics.lineStyle(4, 0x22D3EE, 0.8);
          this.conduitGraphics.beginPath();
          this.conduitGraphics.moveTo(screenPoints[0].x, screenPoints[0].y);
          for (let i = 1; i < screenPoints.length; i++) {
            this.conduitGraphics.lineTo(screenPoints[i].x, screenPoints[i].y);
          }
          this.conduitGraphics.strokePath();

          this.conduitGraphics.lineStyle(2, 0xFFFFFF, 0.95);
          this.conduitGraphics.beginPath();
          this.conduitGraphics.moveTo(screenPoints[0].x, screenPoints[0].y);
          for (let i = 1; i < screenPoints.length; i++) {
            this.conduitGraphics.lineTo(screenPoints[i].x, screenPoints[i].y);
          }
          this.conduitGraphics.strokePath();

          // Solder node dots
          for (const pt of screenPoints) {
            this.conduitGraphics.fillStyle(0xFFFFFF, 0.95);
            this.conduitGraphics.fillCircle(pt.x, pt.y, 4);
          }
        } else {
          // Dormant soft slate conduit
          this.conduitGraphics.lineStyle(3, 0x64748B, 0.35);
          this.conduitGraphics.beginPath();
          this.conduitGraphics.moveTo(screenPoints[0].x, screenPoints[0].y);
          for (let i = 1; i < screenPoints.length; i++) {
            this.conduitGraphics.lineTo(screenPoints[i].x, screenPoints[i].y);
          }
          this.conduitGraphics.strokePath();

          // Dormant node dots
          for (const pt of screenPoints) {
            this.conduitGraphics.fillStyle(0x64748B, 0.4);
            this.conduitGraphics.fillCircle(pt.x, pt.y, 3);
          }
        }
      }
    }
  }

  private renderGateGraphic(g: Phaser.GameObjects.Graphics, size: number, isSatisfied: boolean): void {
    const s = size * 0.76;
    const half = s / 2;

    // Ground shadow
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(0, half * 0.85, s * 0.8, s * 0.25);

    if (isSatisfied) {
      // Radiant Cyan Nexus
      g.fillStyle(0x06B6D4, 0.35);
      g.fillCircle(0, 0, half * 1.25);

      g.fillStyle(0x0891B2, 1);
      g.lineStyle(2.5, 0x22D3EE, 1);
      g.beginPath();
      g.moveTo(0, -half * 0.85);
      g.lineTo(half * 0.85, 0);
      g.lineTo(0, half * 0.85);
      g.lineTo(-half * 0.85, 0);
      g.closePath();
      g.fillPath();
      g.strokePath();

      // Inner glowing core
      g.fillStyle(0x67E8F9, 1);
      g.fillCircle(0, 0, half * 0.4);

      g.fillStyle(0xFFFFFF, 0.95);
      g.fillCircle(0, 0, half * 0.2);
    } else {
      // Dormant Logic Pedestal
      g.fillStyle(0x334155, 1);
      g.lineStyle(2.5, 0x1E293B, 1);
      g.beginPath();
      g.moveTo(0, -half * 0.85);
      g.lineTo(half * 0.85, 0);
      g.lineTo(0, half * 0.85);
      g.lineTo(-half * 0.85, 0);
      g.closePath();
      g.fillPath();
      g.strokePath();

      // Inactive glyph
      g.lineStyle(2, 0x64748B, 0.7);
      g.strokeCircle(0, 0, half * 0.35);
    }
  }

  private renderFloorSwitchGraphic(
    g: Phaser.GameObjects.Graphics,
    size: number,
    entity: Entity,
    isDepressed: boolean
  ): void {
    const s = size * 0.78;
    const half = s / 2;

    // Determine sequence dot count from ID (e.g. switch-1 -> 1, switch-2 -> 2, switch-3 -> 3)
    let dotCount = 1;
    if (entity.id.includes("2")) dotCount = 2;
    else if (entity.id.includes("3")) dotCount = 3;

    if (isDepressed) {
      // Active State
      g.fillStyle(0xF59E0B, 0.3);
      g.fillCircle(0, 0, half * 1.15);

      g.fillStyle(0xD97706, 1);
      g.lineStyle(3, 0xFBBF24, 1);
      g.fillRoundedRect(-half, -half, s, s, 14);
      g.strokeRoundedRect(-half, -half, s, s, 14);

      // Inner rune ring
      g.lineStyle(2, 0xFEF3C7, 1);
      g.strokeCircle(0, 0, half * 0.55);

      // Rune Dots in Center
      g.fillStyle(0xFFFFFF, 0.95);
      if (dotCount === 1) {
        g.fillCircle(0, 0, 4);
      } else if (dotCount === 2) {
        g.fillCircle(-half * 0.25, 0, 3.5);
        g.fillCircle(half * 0.25, 0, 3.5);
      } else if (dotCount === 3) {
        g.fillCircle(-half * 0.3, 0, 3);
        g.fillCircle(0, 0, 3);
        g.fillCircle(half * 0.3, 0, 3);
      }
    } else {
      // Inactive Storybook Slate/Amber Switch
      g.fillStyle(0xFEF3C7, 1); // Soft parchment amber
      g.lineStyle(3, 0xD97706, 1);
      g.fillRoundedRect(-half, -half, s, s, 14);
      g.strokeRoundedRect(-half, -half, s, s, 14);

      // Inner target circle
      g.lineStyle(2, 0xF59E0B, 0.7);
      g.strokeCircle(0, 0, half * 0.55);

      // Rune Dots
      g.fillStyle(0xB45309, 1);
      if (dotCount === 1) {
        g.fillCircle(0, 0, 3.5);
      } else if (dotCount === 2) {
        g.fillCircle(-half * 0.25, 0, 3);
        g.fillCircle(half * 0.25, 0, 3);
      } else if (dotCount === 3) {
        g.fillCircle(-half * 0.3, 0, 2.5);
        g.fillCircle(0, 0, 2.5);
        g.fillCircle(half * 0.3, 0, 2.5);
      }
    }
  }

  public renderOpticsBeams(): void {
    if (!this.beamGraphics) return;
    this.beamGraphics.clear();

    const paths = this.world.getOpticsPaths();
    if (!paths || paths.length === 0) return;

    for (const path of paths) {
      if (!path.points || path.points.length < 2) continue;

      const screenPoints = path.points.map((p) =>
        gridToScreenPoint(p.x, p.y, this.layoutMetrics)
      );

      const colorNum = parseInt(path.beamColor.replace("#", ""), 16) || 0xfacc15;

      // Outer soft bloom glow
      this.beamGraphics.lineStyle(14, colorNum, 0.25);
      this.beamGraphics.beginPath();
      this.beamGraphics.moveTo(screenPoints[0].x, screenPoints[0].y);
      for (let i = 1; i < screenPoints.length; i++) {
        this.beamGraphics.lineTo(screenPoints[i].x, screenPoints[i].y);
      }
      this.beamGraphics.strokePath();

      // Mid intense glow
      this.beamGraphics.lineStyle(6, 0xfef08a, 0.65);
      this.beamGraphics.beginPath();
      this.beamGraphics.moveTo(screenPoints[0].x, screenPoints[0].y);
      for (let i = 1; i < screenPoints.length; i++) {
        this.beamGraphics.lineTo(screenPoints[i].x, screenPoints[i].y);
      }
      this.beamGraphics.strokePath();

      // Sharp white core
      this.beamGraphics.lineStyle(2.5, 0xffffff, 0.95);
      this.beamGraphics.beginPath();
      this.beamGraphics.moveTo(screenPoints[0].x, screenPoints[0].y);
      for (let i = 1; i < screenPoints.length; i++) {
        this.beamGraphics.lineTo(screenPoints[i].x, screenPoints[i].y);
      }
      this.beamGraphics.strokePath();

      // Draw reflection sparkle glints at nodes
      for (const node of path.reflectionNodes) {
        const pt = gridToScreenPoint(node.x, node.y, this.layoutMetrics);
        this.beamGraphics.fillStyle(0xffffff, 0.95);
        this.beamGraphics.fillCircle(pt.x, pt.y, 4);
        this.beamGraphics.fillStyle(colorNum, 0.5);
        this.beamGraphics.fillCircle(pt.x, pt.y, 8);
      }
    }
  }

  private renderEmitterGraphic(g: Phaser.GameObjects.Graphics, size: number, entity: Entity): void {
    const s = size * 0.82;
    const half = s / 2;
    const dir = entity.optics?.direction || "east";

    // Ground shadow
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(0, half * 0.85, s * 0.75, s * 0.25);

    // Brass / Golden pedestal base
    g.fillStyle(0xB45309, 1);
    g.lineStyle(2, 0x78350F, 1);
    g.fillCircle(0, 0, half * 0.85);
    g.strokeCircle(0, 0, half * 0.85);

    // Radiant inner sun crystal
    g.fillStyle(0xFACC15, 1);
    g.lineStyle(2, 0xFEF08A, 1);
    g.fillCircle(0, 0, half * 0.55);
    g.strokeCircle(0, 0, half * 0.55);

    // Core white-hot star spark
    g.fillStyle(0xFFFFFF, 0.95);
    g.fillCircle(0, 0, half * 0.25);

    // Directional emitter nozzle
    g.fillStyle(0x92400E, 1);
    g.lineStyle(1.5, 0xFDE047, 1);
    const nozzleDist = half * 0.75;
    let nx = 0, ny = 0;
    if (dir === "east") nx = nozzleDist;
    else if (dir === "west") nx = -nozzleDist;
    else if (dir === "north") ny = -nozzleDist;
    else if (dir === "south") ny = nozzleDist;
    g.fillCircle(nx, ny, 5);
    g.strokeCircle(nx, ny, 5);
  }

  private renderMirrorGraphic(g: Phaser.GameObjects.Graphics, size: number, angle: number): void {
    const s = size * 0.82;
    const half = s / 2;

    // Ground shadow
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(0, half * 0.85, s * 0.8, s * 0.25);

    // Prism diamond frame
    g.fillStyle(0x0369A1, 1);
    g.lineStyle(2.5, 0x38BDF8, 1);
    g.beginPath();
    g.moveTo(0, -half * 0.9);
    g.lineTo(half * 0.9, 0);
    g.lineTo(0, half * 0.9);
    g.lineTo(-half * 0.9, 0);
    g.closePath();
    g.fillPath();
    g.strokePath();

    // Polished crystal glass surface
    g.fillStyle(0xE0F2FE, 0.9);
    g.beginPath();
    g.moveTo(0, -half * 0.65);
    g.lineTo(half * 0.65, 0);
    g.lineTo(0, half * 0.65);
    g.lineTo(-half * 0.65, 0);
    g.closePath();
    g.fillPath();

    // Internal reflective mirror line oriented at angle
    const normAngle = ((angle % 180) + 180) % 180;
    g.lineStyle(3, 0x0284C7, 1);
    g.beginPath();
    if (normAngle === 45) {
      g.moveTo(-half * 0.55, half * 0.55);
      g.lineTo(half * 0.55, -half * 0.55);
    } else {
      g.moveTo(-half * 0.55, -half * 0.55);
      g.lineTo(half * 0.55, half * 0.55);
    }
    g.strokePath();

    // Prismatic facet highlight glints
    g.fillStyle(0xFFFFFF, 0.9);
    g.fillCircle(0, 0, 3);
  }

  private renderReceptorGraphic(g: Phaser.GameObjects.Graphics, size: number, isActivated: boolean): void {
    const s = size * 0.82;
    const half = s / 2;

    // Ground shadow
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(0, half * 0.85, s * 0.8, s * 0.25);

    if (isActivated) {
      // Golden Radiant Solar Aura
      g.fillStyle(0xFACC15, 0.35);
      g.fillCircle(0, 0, half * 1.3);

      // Altar base
      g.fillStyle(0x78350F, 1);
      g.lineStyle(2.5, 0xD97706, 1);
      g.fillRoundedRect(-half * 0.85, -half * 0.85, s * 0.85, s * 0.85, 12);
      g.strokeRoundedRect(-half * 0.85, -half * 0.85, s * 0.85, s * 0.85, 12);

      // Incandescent solar gem core
      g.fillStyle(0xFDE047, 1);
      g.lineStyle(2, 0xFFFFFF, 1);
      g.fillCircle(0, 0, half * 0.5);
      g.strokeCircle(0, 0, half * 0.5);

      // White core burst
      g.fillStyle(0xFFFFFF, 0.95);
      g.fillCircle(0, 0, half * 0.22);
    } else {
      // Resting Altar Base
      g.fillStyle(0x334155, 1);
      g.lineStyle(2.5, 0x1E293B, 1);
      g.fillRoundedRect(-half * 0.85, -half * 0.85, s * 0.85, s * 0.85, 12);
      g.strokeRoundedRect(-half * 0.85, -half * 0.85, s * 0.85, s * 0.85, 12);

      // Latent Amethyst Crystal
      g.fillStyle(0x7E22CE, 0.9);
      g.lineStyle(2, 0xA855F7, 0.8);
      g.fillCircle(0, 0, half * 0.45);
      g.strokeCircle(0, 0, half * 0.45);

      // Faint crystal glint
      g.fillStyle(0xE9D5FF, 0.7);
      g.fillCircle(-half * 0.12, -half * 0.12, 2);
    }
  }

  public renderLightOrbGraphic(
    g: Phaser.GameObjects.Graphics,
    size: number,
    expression: LightOrbExpression = "happy",
    isBedtimeDimmed: boolean = false
  ): void {
    const radius = size * 0.22;
    const strokeColor = isBedtimeDimmed ? 0x6B21A8 : 0x78350F;

    if (isBedtimeDimmed) {
      // Dimmed, soothing nightlight glow mode for the 15-minute Bedtime Twilight phase
      // Reduce glow opacity and shift to gentle lavender/amber nightlight aura
      g.fillStyle(0xC4B5FD, 0.22); // Outer lavender glow with reduced opacity
      g.fillCircle(0, 0, radius * 1.45);

      g.fillStyle(0xFEF3C7, 0.32); // Gentle warm amber mid aura
      g.fillCircle(0, 0, radius * 1.18);

      // Gentle nightlight core
      g.fillStyle(0xFBF7EE, 0.88);
      g.lineStyle(2, 0xA78BFA, 0.65);
      g.fillCircle(0, 0, radius);
      g.strokeCircle(0, 0, radius);
    } else {
      // Daylight radiant outer glow
      g.fillStyle(0xFDE68A, 0.45);
      g.fillCircle(0, 0, radius * 1.5);

      // Warm inner glowing core
      g.fillStyle(0xFEF08A, 1);
      g.lineStyle(2, 0xF59E0B, 0.9);
      g.fillCircle(0, 0, radius);
      g.strokeCircle(0, 0, radius);
    }

    // Render facial expressions: happy, thinking, curious, sleepy
    switch (expression) {
      case "happy": {
        // Cheerful eyes with bright starlight catchlight
        g.fillStyle(strokeColor, 1);
        g.fillCircle(-radius * 0.35, -radius * 0.15, 2.2);
        g.fillCircle(radius * 0.35, -radius * 0.15, 2.2);

        g.fillStyle(0xFFFFFF, 0.9);
        g.fillCircle(-radius * 0.35 - 0.7, -radius * 0.15 - 0.7, 0.8);
        g.fillCircle(radius * 0.35 - 0.7, -radius * 0.15 - 0.7, 0.8);

        // Rosy blush
        g.fillStyle(0xFB7185, 0.28);
        g.fillCircle(-radius * 0.48, radius * 0.08, 2.2);
        g.fillCircle(radius * 0.48, radius * 0.08, 2.2);

        // Cheerful warm smile arc
        g.lineStyle(1.8, strokeColor, 1);
        g.beginPath();
        g.arc(0, 0, radius * 0.45, Phaser.Math.DegToRad(30), Phaser.Math.DegToRad(150), false);
        g.strokePath();
        break;
      }

      case "thinking": {
        // Pondering eyes gazing upward-right
        g.fillStyle(strokeColor, 1);
        g.fillCircle(-radius * 0.35, -radius * 0.18, 1.9);
        g.fillCircle(radius * 0.36 + 0.8, -radius * 0.24, 2.3);

        g.fillStyle(0xFFFFFF, 0.9);
        g.fillCircle(-radius * 0.35 - 0.6, -radius * 0.18 - 0.6, 0.7);
        g.fillCircle(radius * 0.36 + 0.4, -radius * 0.24 - 0.7, 0.8);

        // Inquisitive pondering eyebrow
        g.lineStyle(1.2, strokeColor, 0.9);
        g.beginPath();
        g.arc(
          radius * 0.36 + 0.8,
          -radius * 0.42,
          radius * 0.18,
          Phaser.Math.DegToRad(190),
          Phaser.Math.DegToRad(350),
          false
        );
        g.strokePath();

        // Thoughtful "o" mouth
        g.fillStyle(strokeColor, 1);
        g.fillCircle(0, radius * 0.22, 1.8);
        break;
      }

      case "curious": {
        // Wide curious wonder eyes with double starlight reflections
        g.fillStyle(strokeColor, 1);
        g.fillCircle(-radius * 0.35, -radius * 0.15, 2.7);
        g.fillCircle(radius * 0.35, -radius * 0.15, 2.7);

        // Primary sparkle
        g.fillStyle(0xFFFFFF, 1);
        g.fillCircle(-radius * 0.35 - 0.8, -radius * 0.15 - 0.8, 1.1);
        g.fillCircle(radius * 0.35 - 0.8, -radius * 0.15 - 0.8, 1.1);
        // Secondary sub-sparkle
        g.fillCircle(-radius * 0.35 + 0.7, -radius * 0.15 + 0.7, 0.6);
        g.fillCircle(radius * 0.35 + 0.7, -radius * 0.15 + 0.7, 0.6);

        // Wonder blush
        g.fillStyle(0xFBBF24, 0.35);
        g.fillCircle(-radius * 0.5, radius * 0.1, 2);
        g.fillCircle(radius * 0.5, radius * 0.1, 2);

        // Gentle open curious smile
        g.lineStyle(1.8, strokeColor, 1);
        g.beginPath();
        g.arc(0, radius * 0.12, radius * 0.32, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160), false);
        g.strokePath();
        break;
      }

      case "sleepy": {
        // Peaceful closed resting eye arcs (u u)
        g.lineStyle(1.8, strokeColor, 0.85);
        g.beginPath();
        g.arc(-radius * 0.35, -radius * 0.1, radius * 0.2, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false);
        g.strokePath();

        g.beginPath();
        g.arc(radius * 0.35, -radius * 0.1, radius * 0.2, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false);
        g.strokePath();

        // Lavender bedtime blush
        g.fillStyle(0xC084FC, 0.32);
        g.fillCircle(-radius * 0.48, radius * 0.1, 2.4);
        g.fillCircle(radius * 0.48, radius * 0.1, 2.4);

        // Peaceful resting smile
        g.lineStyle(1.6, strokeColor, 0.85);
        g.beginPath();
        g.arc(0, radius * 0.2, radius * 0.22, Phaser.Math.DegToRad(30), Phaser.Math.DegToRad(150), false);
        g.strokePath();
        break;
      }
    }
  }
}
