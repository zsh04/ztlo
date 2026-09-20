import os
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

SPRITES_DIR = "public/assets/sprites/storybook"

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def translate_img(im, dx, dy):
    """Translate image within its canvas preserving RGBA transparency."""
    res = Image.new('RGBA', im.size, (0, 0, 0, 0))
    res.paste(im, (dx, dy), im)
    return res

def main():
    ensure_dir(SPRITES_DIR)
    print("Generating storybook animation frames from master assets...")
    
    # 1. Zyra Idle (6 frames with subtle breathing bob)
    idle_base = Image.open(f"{SPRITES_DIR}/zyra-idle.png")
    bobs = [0, 1, 2, 1, 0, -1]
    for i, bob in enumerate(bobs):
        frame = translate_img(idle_base, 0, bob)
        frame.save(f"{SPRITES_DIR}/zyra-idle-{i+1:02d}.png")
    print("✓ Generated zyra-idle-01..06")
    
    # 2. Zyra Walk (8 frames cycling front and side runs)
    run_front = Image.open(f"{SPRITES_DIR}/zyra-run-front.png")
    run_side = Image.open(f"{SPRITES_DIR}/zyra-run-side.png")
    run_side_flip = ImageOps.mirror(run_side)
    
    walk_frames = [
        translate_img(run_front, 0, 0),
        translate_img(run_side, 0, -2),
        translate_img(run_side, 0, -4),
        translate_img(run_front, 0, -2),
        translate_img(run_front, 0, 0),
        translate_img(run_side_flip, 0, -2),
        translate_img(run_side_flip, 0, -4),
        translate_img(run_front, 0, -2),
    ]
    for i, frame in enumerate(walk_frames):
        frame.save(f"{SPRITES_DIR}/zyra-walk-{i+1:02d}.png")
    print("✓ Generated zyra-walk-01..08")
    
    # 3. Zyra Push (6 frames with slight forward lean strain)
    push_base = Image.open(f"{SPRITES_DIR}/zyra-push.png")
    strains = [0, 2, 4, 4, 2, 0]
    for i, s in enumerate(strains):
        frame = translate_img(push_base, s, 0)
        frame.save(f"{SPRITES_DIR}/zyra-push-{i+1:02d}.png")
    print("✓ Generated zyra-push-01..06")
    
    # 4. Zyra Celebrate (8 frames jumping)
    cel_base = Image.open(f"{SPRITES_DIR}/zyra-celebrate.png")
    jumps = [0, -4, -9, -12, -9, -4, 0, 0]
    for i, j in enumerate(jumps):
        frame = translate_img(cel_base, 0, j)
        frame.save(f"{SPRITES_DIR}/zyra-celebrate-{i+1:02d}.png")
    print("✓ Generated zyra-celebrate-01..08")
    
    # 5. Stone Block (0 = default, 1 = active glow)
    stone_base = Image.open(f"{SPRITES_DIR}/stone-block.png")
    stone_base.save(f"{SPRITES_DIR}/stone-block-0.png")
    
    # Active glow: add warm golden sheen
    enhancer = ImageEnhance.Color(stone_base)
    stone_active = enhancer.enhance(1.25)
    brightener = ImageEnhance.Brightness(stone_active)
    stone_active = brightener.enhance(1.1)
    stone_active.save(f"{SPRITES_DIR}/stone-block-1.png")
    print("✓ Generated stone-block-0 and stone-block-1")
    
    # 6. Ice Block (0 = default, 1 = sliding glint)
    ice_base = Image.open(f"{SPRITES_DIR}/ice-block.png")
    ice_base.save(f"{SPRITES_DIR}/ice-block-0.png")
    ice_sliding = ImageEnhance.Brightness(ice_base).enhance(1.15)
    ice_sliding.save(f"{SPRITES_DIR}/ice-block-1.png")
    print("✓ Generated ice-block-0 and ice-block-1")
    
    # 7. Pressure Plate (dormant and active)
    plate_dormant = Image.open(f"{SPRITES_DIR}/pressure-plate.png")
    plate_dormant.save(f"{SPRITES_DIR}/plate-dormant.png")
    plate_active = Image.open(f"{SPRITES_DIR}/pressure-plate-active.png")
    plate_active.save(f"{SPRITES_DIR}/plate-active.png")
    print("✓ Generated plate-dormant and plate-active")
    
    # 8. Portal Door (sealed and open)
    door_portal = Image.open(f"{SPRITES_DIR}/door-portal.png")
    # Door open is the vibrant emerald cosmic vortex
    door_portal.save(f"{SPRITES_DIR}/door-open.png")
    # Door sealed has darker/dormant stone tones
    door_sealed = ImageEnhance.Color(door_portal).enhance(0.4)
    door_sealed = ImageEnhance.Brightness(door_sealed).enhance(0.7)
    door_sealed.save(f"{SPRITES_DIR}/door-sealed.png")
    print("✓ Generated door-open and door-sealed")
    
    # 9. Limestone Floor Tiles (light and cool-dark)
    tile_base = Image.open(f"{SPRITES_DIR}/tile-floor-limestone.png")
    tile_base.save(f"{SPRITES_DIR}/tile-floor-light.png")
    tile_dark = ImageEnhance.Brightness(tile_base).enhance(0.88)
    tile_dark.save(f"{SPRITES_DIR}/tile-floor-dark.png")
    print("✓ Generated tile-floor-light and tile-floor-dark")
    
    print("\nAll storybook frames generated successfully!")

if __name__ == "__main__":
    main()
