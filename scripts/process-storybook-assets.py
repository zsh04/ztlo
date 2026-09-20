import os
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import label, binary_opening

def extract_main_component(im, threshold=232):
    im = im.convert('RGBA')
    data = np.array(im)
    r, g, b = data[:,:,0], data[:,:,1], data[:,:,2]
    fg = (r < threshold) | (g < threshold) | (b < threshold)
    fg_opened = binary_opening(fg, structure=np.ones((3,3)))
    labeled, num_features = label(fg_opened)
    if num_features == 0:
        return im
    counts = np.bincount(labeled.flat)
    counts[0] = 0
    largest_label = counts.argmax()
    mask = (labeled == largest_label)
    data[:, :, 3] = np.where(mask, 255, 0).astype(np.uint8)
    return Image.fromarray(data, 'RGBA')

def process_zyra_pose(sheet, crop_box, target_path):
    cropped = sheet.crop(crop_box)
    clean = extract_main_component(cropped, threshold=232)
    bbox = clean.split()[3].getbbox()
    if bbox:
        clean = clean.crop(bbox)
    clean.thumbnail((256, 256), Image.Resampling.LANCZOS)
    square = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
    square.paste(clean, ((256 - clean.width) // 2, (256 - clean.height) // 2))
    square.save(target_path, format="PNG")
    print(f"✓ Saved Zyra Pose: {target_path}")

def make_transparent_feathered(im, threshold=240, feather=1.5):
    im = im.convert("RGBA")
    data = np.array(im)
    r, g, b, a = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]
    white_mask = (r > threshold) & (g > threshold) & (b > threshold)
    alpha = np.where(white_mask, 0, 255).astype(np.uint8)
    alpha_img = Image.fromarray(alpha, mode='L')
    if feather > 0:
        alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(radius=feather / 2))
    im.putalpha(alpha_img)
    return im

def main():
    brain_dir = "/Users/zishanmalik/.gemini/antigravity/brain/a9c39cda-05c2-48db-9b7c-3005cc485618"
    worktree = "/Users/zishanmalik/.gemini/antigravity/worktrees/Z&TLO/async_project_manager"
    sprites_dir = os.path.join(worktree, "public/assets/sprites/storybook")
    bg_dir = os.path.join(worktree, "public/assets/backgrounds")
    os.makedirs(sprites_dir, exist_ok=True)
    os.makedirs(bg_dir, exist_ok=True)
    
    # 1. Background
    bg_path = os.path.join(brain_dir, "temple_sanctuary_bg_1789910051962.jpg")
    if os.path.exists(bg_path):
        bg_im = Image.open(bg_path).convert("RGB")
        bg_im = bg_im.resize((1280, 720), Image.Resampling.LANCZOS)
        out_bg = os.path.join(bg_dir, "temple_sanctuary_bg.webp")
        bg_im.save(out_bg, format="WEBP", quality=90)
        print(f"✓ Saved Background: {out_bg} ({os.path.getsize(out_bg) / 1024:.1f} KB)")
        
    # 2. Zyra Sprites
    zyra_path = os.path.join(brain_dir, "zyra_character_sprites_1789910070656.jpg")
    if os.path.exists(zyra_path):
        zyra_sheet = Image.open(zyra_path)
        zyra_poses = {
            "zyra-idle.png": (60, 90, 290, 520),
            "zyra-run-front.png": (350, 80, 620, 520),
            "zyra-run-side.png": (650, 80, 950, 520),
            "zyra-push.png": (60, 560, 410, 940),
            "zyra-celebrate.png": (630, 540, 950, 920),
        }
        for name, box in zyra_poses.items():
            process_zyra_pose(zyra_sheet, box, os.path.join(sprites_dir, name))
            
    # 3. Puzzle Entities
    entities_path = os.path.join(brain_dir, "puzzle_entities_sheet_1789910089399.jpg")
    if os.path.exists(entities_path):
        ent_sheet = Image.open(entities_path)
        crops = {
            "stone-block.png": (50, 50, 335, 340),
            "ice-block.png": (370, 60, 620, 340),
            "pressure-plate.png": (630, 70, 970, 320),
            "pressure-plate-active.png": (640, 410, 960, 620),
            "door-portal.png": (50, 440, 530, 920),
            "tile-floor-limestone.png": (590, 690, 970, 930),
        }
        for name, bbox in crops.items():
            cropped = ent_sheet.crop(bbox)
            transparent = make_transparent_feathered(cropped, threshold=242, feather=1.5)
            bbox = transparent.split()[3].getbbox()
            if bbox:
                transparent = transparent.crop(bbox)
            if "door" in name:
                transparent = transparent.resize((256, 320), Image.Resampling.LANCZOS)
            else:
                transparent = transparent.resize((256, 256), Image.Resampling.LANCZOS)
            out_path = os.path.join(sprites_dir, name)
            transparent.save(out_path, format="PNG")
            print(f"✓ Saved Entity Sprite: {out_path}")

    # 4. Generate Derived Storybook Animation Frames
    print("\nGenerating derived storybook animation frames...")
    import subprocess
    gen_script = os.path.join(os.path.dirname(__file__), "generate-storybook-frames.py")
    if os.path.exists(gen_script):
        subprocess.run(["python3", gen_script], check=True)

    print("\n✓ All Storybook Assets Successfully Extracted & Packed!")

if __name__ == "__main__":
    main()
