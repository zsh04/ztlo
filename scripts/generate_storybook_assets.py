#!/usr/bin/env python3
"""
Project ZTLO: Master Vector Storybook Asset Generator
Generates production-ready, standalone, valid XML SVG assets conforming to:
- Issues #49 (Zyra character sprites) & #51 (Sanctuary limestone environment)
- Pediatric HCI constraints (80px collision footprint, soft palette, high clarity)
- Ghibli / Monument Valley storybook art direction (cerulean cloak #0284C7, coral scarf #F97316)
"""

import os
import math
import xml.etree.ElementTree as ET

OUTPUT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "public", "assets", "svg")
)

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ==============================================================================
# 1. ZYRA SPRITE BUILDER (160x160 canvas, 80px playfield collision box)
# ==============================================================================

def build_zyra_svg(
    frame_name: str,
    action: str,
    frame_idx: int,
    total_frames: int,
    y_bob: float = 0.0,
    leg_l_angle: float = 0.0,
    leg_r_angle: float = 0.0,
    cloak_tilt: float = 0.0,
    scarf_flutter: float = 0.0,
    blink_state: str = "open",  # "open", "half", "closed", "joyful", "focused"
    arms_pose: str = "idle",    # "idle", "walk", "push", "celebrate_up", "celebrate_land", "sleep"
    torso_lean: float = 0.0,
    sparkle: bool = False,
    effort_sweat: bool = False
) -> str:
    """
    Constructs a standalone, highly-detailed vector SVG for Zyra matching Ghibli / Monument Valley aesthetic.
    Base dimensions: 160x160 with 80px playfield collision box centered at ground contact (x: 40-120, y: 60-140).
    Cloak: Cerulean Teal #0284C7 (with #0369A1 shadow, #38BDF8 trim).
    Scarf: Warm Coral #F97316 (with #EA580C fold shadows).
    Hair: Soft Navy #1E293B. Headband Feather: Golden #FBBF24.
    """
    
    # Base coordinates
    cx = 80.0
    ground_y = 140.0
    base_torso_y = 96.0 + y_bob
    head_y = 56.0 + y_bob

    # Compute tilt transform attributes
    torso_attr = f' transform="rotate({torso_lean:.1f} {cx:.1f} {base_torso_y:.1f})"' if torso_lean != 0 else ""
    cloak_attr = f' transform="rotate({cloak_tilt:.1f} {cx:.1f} {base_torso_y - 10:.1f})"' if cloak_tilt != 0 else ""
    scarf_attr = f' transform="rotate({scarf_flutter:.1f} {cx + 10:.1f} {head_y + 16:.1f})"' if scarf_flutter != 0 else ""

    # Eye rendering depending on blink_state
    eyes_markup = ""
    if blink_state == "open":
        eyes_markup = f"""
        <!-- Left Eye -->
        <ellipse cx="{cx - 7:.1f}" cy="{head_y:.1f}" rx="3.2" ry="4.2" fill="#0F172A" />
        <circle cx="{cx - 8.2:.1f}" cy="{head_y - 1.2:.1f}" r="1.4" fill="#FFFFFF" />
        <circle cx="{cx - 6.0:.1f}" cy="{head_y + 1.6:.1f}" r="0.6" fill="#FFFFFF" />
        <!-- Right Eye -->
        <ellipse cx="{cx + 7:.1f}" cy="{head_y:.1f}" rx="3.2" ry="4.2" fill="#0F172A" />
        <circle cx="{cx + 5.8:.1f}" cy="{head_y - 1.2:.1f}" r="1.4" fill="#FFFFFF" />
        <circle cx="{cx + 8.0:.1f}" cy="{head_y + 1.6:.1f}" r="0.6" fill="#FFFFFF" />
        """
    elif blink_state == "half":
        eyes_markup = f"""
        <!-- Left Eye Half-Lid -->
        <path d="M {cx - 11:.1f} {head_y:.1f} Q {cx - 7:.1f} {head_y - 2:.1f} {cx - 3:.1f} {head_y:.1f}" stroke="#0F172A" stroke-width="2.4" stroke-linecap="round" fill="none" />
        <ellipse cx="{cx - 7:.1f}" cy="{head_y + 1:.1f}" rx="2.5" ry="1.8" fill="#0F172A" />
        <circle cx="{cx - 8:.1f}" cy="{head_y:.1f}" r="0.8" fill="#FFFFFF" />
        <!-- Right Eye Half-Lid -->
        <path d="M {cx + 3:.1f} {head_y:.1f} Q {cx + 7:.1f} {head_y - 2:.1f} {cx + 11:.1f} {head_y:.1f}" stroke="#0F172A" stroke-width="2.4" stroke-linecap="round" fill="none" />
        <ellipse cx="{cx + 7:.1f}" cy="{head_y + 1:.1f}" rx="2.5" ry="1.8" fill="#0F172A" />
        <circle cx="{cx + 6:.1f}" cy="{head_y:.1f}" r="0.8" fill="#FFFFFF" />
        """
    elif blink_state == "closed":
        eyes_markup = f"""
        <!-- Sleeping / Closed Peaceful Eyelashes -->
        <path d="M {cx - 11:.1f} {head_y:.1f} Q {cx - 7:.1f} {head_y + 3:.1f} {cx - 3:.1f} {head_y:.1f}" stroke="#0F172A" stroke-width="2.4" stroke-linecap="round" fill="none" />
        <path d="M {cx + 3:.1f} {head_y:.1f} Q {cx + 7:.1f} {head_y + 3:.1f} {cx + 11:.1f} {head_y:.1f}" stroke="#0F172A" stroke-width="2.4" stroke-linecap="round" fill="none" />
        """
    elif blink_state == "joyful":
        eyes_markup = f"""
        <!-- Cheerful Crescent Arc Eyes -->
        <path d="M {cx - 12:.1f} {head_y + 1:.1f} Q {cx - 7:.1f} {head_y - 4:.1f} {cx - 2:.1f} {head_y + 1:.1f}" stroke="#0F172A" stroke-width="2.8" stroke-linecap="round" fill="none" />
        <path d="M {cx + 2:.1f} {head_y + 1:.1f} Q {cx + 7:.1f} {head_y - 4:.1f} {cx + 12:.1f} {head_y + 1:.1f}" stroke="#0F172A" stroke-width="2.8" stroke-linecap="round" fill="none" />
        """
    elif blink_state == "focused":
        eyes_markup = f"""
        <!-- Focused / Determined Push Eyes -->
        <ellipse cx="{cx - 6:.1f}" cy="{head_y:.1f}" rx="2.8" ry="3.5" fill="#0F172A" />
        <circle cx="{cx - 7:.1f}" cy="{head_y - 1:.1f}" r="1.1" fill="#FFFFFF" />
        <ellipse cx="{cx + 8:.1f}" cy="{head_y:.1f}" rx="2.8" ry="3.5" fill="#0F172A" />
        <circle cx="{cx + 7:.1f}" cy="{head_y - 1:.1f}" r="1.1" fill="#FFFFFF" />
        <!-- Determined Brow Lines -->
        <path d="M {cx - 11:.1f} {head_y - 6:.1f} L {cx - 3:.1f} {head_y - 4:.1f}" stroke="#1E293B" stroke-width="2" stroke-linecap="round" />
        <path d="M {cx + 11:.1f} {head_y - 6:.1f} L {cx + 3:.1f} {head_y - 4:.1f}" stroke="#1E293B" stroke-width="2" stroke-linecap="round" />
        """

    # Mouth rendering
    if blink_state == "joyful":
        mouth_markup = f"""
        <!-- Broad Open Joyful Smile -->
        <path d="M {cx - 5:.1f} {head_y + 9:.1f} Q {cx:.1f} {head_y + 16:.1f} {cx + 5:.1f} {head_y + 9:.1f} Z" fill="#E11D48" />
        <path d="M {cx - 3:.1f} {head_y + 9:.1f} Q {cx:.1f} {head_y + 11:.1f} {cx + 3:.1f} {head_y + 9:.1f}" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" fill="none" />
        """
    elif blink_state == "focused":
        mouth_markup = f"""
        <!-- Determined Straight / Clenched Mouth -->
        <path d="M {cx - 4:.1f} {head_y + 10:.1f} L {cx + 4:.1f} {head_y + 9:.1f}" stroke="#78350F" stroke-width="2.2" stroke-linecap="round" />
        """
    else:
        mouth_markup = f"""
        <!-- Gentle Storybook Smile -->
        <path d="M {cx - 4:.1f} {head_y + 9:.1f} Q {cx:.1f} {head_y + 13:.1f} {cx + 4:.1f} {head_y + 9:.1f}" stroke="#78350F" stroke-width="2.0" stroke-linecap="round" fill="none" />
        """

    # Arm poses
    arms_markup = ""
    if arms_pose == "push":
        arms_markup = f"""
        <!-- Braced Push Arms Extended Forward -->
        <path d="M {cx + 8:.1f} {base_torso_y - 12:.1f} Q {cx + 28:.1f} {base_torso_y - 8:.1f} {cx + 42:.1f} {base_torso_y - 10:.1f}" 
              stroke="#0284C7" stroke-width="10" stroke-linecap="round" fill="none" />
        <path d="M {cx + 8:.1f} {base_torso_y - 6:.1f} Q {cx + 26:.1f} {base_torso_y - 2:.1f} {cx + 40:.1f} {base_torso_y - 4:.1f}" 
              stroke="#0369A1" stroke-width="8" stroke-linecap="round" fill="none" />
        <!-- Hands Planted on Stone -->
        <ellipse cx="{cx + 43:.1f}" cy="{base_torso_y - 10:.1f}" rx="4.5" ry="5.5" fill="#FED7AA" />
        <ellipse cx="{cx + 41:.1f}" cy="{base_torso_y - 4:.1f}" rx="4.5" ry="5.5" fill="#FED7AA" />
        """
    elif arms_pose == "celebrate_up":
        arms_markup = f"""
        <!-- Joyful Victory Cheering Arms Raised High -->
        <!-- Left Raised Arm -->
        <path d="M {cx - 16:.1f} {base_torso_y - 8:.1f} Q {cx - 28:.1f} {base_torso_y - 28:.1f} {cx - 24:.1f} {base_torso_y - 46:.1f}" 
              stroke="#0284C7" stroke-width="9" stroke-linecap="round" fill="none" />
        <circle cx="{cx - 24:.1f}" cy="{base_torso_y - 48:.1f}" r="5.5" fill="#FED7AA" />
        <!-- Right Raised Arm -->
        <path d="M {cx + 16:.1f} {base_torso_y - 8:.1f} Q {cx + 28:.1f} {base_torso_y - 28:.1f} {cx + 24:.1f} {base_torso_y - 46:.1f}" 
              stroke="#0284C7" stroke-width="9" stroke-linecap="round" fill="none" />
        <circle cx="{cx + 24:.1f}" cy="{base_torso_y - 48:.1f}" r="5.5" fill="#FED7AA" />
        """
    elif arms_pose == "celebrate_land":
        arms_markup = f"""
        <!-- Wide Open Celebrating Arms -->
        <path d="M {cx - 14:.1f} {base_torso_y - 6:.1f} Q {cx - 30:.1f} {base_torso_y - 12:.1f} {cx - 34:.1f} {base_torso_y - 24:.1f}" 
              stroke="#0284C7" stroke-width="9" stroke-linecap="round" fill="none" />
        <circle cx="{cx - 35:.1f}" cy="{base_torso_y - 26:.1f}" r="5.5" fill="#FED7AA" />
        <path d="M {cx + 14:.1f} {base_torso_y - 6:.1f} Q {cx + 30:.1f} {base_torso_y - 12:.1f} {cx + 34:.1f} {base_torso_y - 24:.1f}" 
              stroke="#0284C7" stroke-width="9" stroke-linecap="round" fill="none" />
        <circle cx="{cx + 35:.1f}" cy="{base_torso_y - 26:.1f}" r="5.5" fill="#FED7AA" />
        """
    elif arms_pose == "walk":
        arm_l_swing_x = cx - 22 + math.sin(math.radians(leg_l_angle)) * 6
        arm_r_swing_x = cx + 22 - math.sin(math.radians(leg_l_angle)) * 6
        arms_markup = f"""
        <!-- Dynamic Running Arms Swing -->
        <path d="M {cx - 14:.1f} {base_torso_y - 6:.1f} Q {arm_l_swing_x:.1f} {base_torso_y + 6:.1f} {cx - 20:.1f} {base_torso_y + 12:.1f}" 
              stroke="#0369A1" stroke-width="8" stroke-linecap="round" fill="none" />
        <circle cx="{cx - 20:.1f}" cy="{base_torso_y + 13:.1f}" r="4.5" fill="#FED7AA" />
        <path d="M {cx + 14:.1f} {base_torso_y - 6:.1f} Q {arm_r_swing_x:.1f} {base_torso_y + 6:.1f} {cx + 20:.1f} {base_torso_y + 12:.1f}" 
              stroke="#0284C7" stroke-width="8" stroke-linecap="round" fill="none" />
        <circle cx="{cx + 20:.1f}" cy="{base_torso_y + 13:.1f}" r="4.5" fill="#FED7AA" />
        """
    else: # idle
        arms_markup = f"""
        <!-- Resting Hands Tucked Neatly in Cloak -->
        <ellipse cx="{cx - 14:.1f}" cy="{base_torso_y + 6:.1f}" rx="4.5" ry="6" fill="#0284C7" />
        <circle cx="{cx - 12:.1f}" cy="{base_torso_y + 10:.1f}" r="3.5" fill="#FED7AA" />
        <ellipse cx="{cx + 14:.1f}" cy="{base_torso_y + 6:.1f}" rx="4.5" ry="6" fill="#0284C7" />
        <circle cx="{cx + 12:.1f}" cy="{base_torso_y + 10:.1f}" r="3.5" fill="#FED7AA" />
        """

    # Optional FX: Sparkles for victory or Effort drop for push
    fx_markup = ""
    if sparkle:
        fx_markup = f"""
        <!-- Starlight Victory Sparkles -->
        <g opacity="0.9">
          <!-- Sparkle 1 -->
          <path d="M {cx - 36:.1f} {head_y - 18:.1f} Q {cx - 32:.1f} {head_y - 18:.1f} {cx - 32:.1f} {head_y - 22:.1f} Q {cx - 32:.1f} {head_y - 18:.1f} {cx - 28:.1f} {head_y - 18:.1f} Q {cx - 32:.1f} {head_y - 18:.1f} {cx - 32:.1f} {head_y - 14:.1f} Z" fill="#FDE047" />
          <circle cx="{cx - 32:.1f}" cy="{head_y - 18:.1f}" r="1.5" fill="#FFFFFF" />
          <!-- Sparkle 2 -->
          <path d="M {cx + 34:.1f} {head_y - 24:.1f} Q {cx + 38:.1f} {head_y - 24:.1f} {cx + 38:.1f} {head_y - 28:.1f} Q {cx + 38:.1f} {head_y - 24:.1f} {cx + 42:.1f} {head_y - 24:.1f} Q {cx + 38:.1f} {head_y - 24:.1f} {cx + 38:.1f} {head_y - 20:.1f} Z" fill="#38BDF8" />
          <circle cx="{cx + 38:.1f}" cy="{head_y - 24:.1f}" r="1.5" fill="#FFFFFF" />
          <!-- Sparkle 3 -->
          <circle cx="{cx:.1f}" cy="{head_y - 32:.1f}" r="2" fill="#F97316" />
        </g>
        """
    if effort_sweat:
        fx_markup += f"""
        <!-- Effort Sweat Drop -->
        <path d="M {cx + 18:.1f} {head_y - 12:.1f} Q {cx + 22:.1f} {head_y - 6:.1f} {cx + 18:.1f} {head_y - 4:.1f} Q {cx + 14:.1f} {head_y - 6:.1f} {cx + 18:.1f} {head_y - 12:.1f} Z" fill="#38BDF8" opacity="0.85" />
        """

    # Assemble complete SVG document
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Zyra - {frame_name}">
  <defs>
    <!-- Cerulean Cloak Gradients -->
    <linearGradient id="cloakGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="25%" stop-color="#0284C7"/>
      <stop offset="100%" stop-color="#0369A1"/>
    </linearGradient>
    <linearGradient id="cloakShadowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284C7"/>
      <stop offset="100%" stop-color="#075985"/>
    </linearGradient>
    <!-- Coral Scarf Gradients -->
    <linearGradient id="scarfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FB923C"/>
      <stop offset="30%" stop-color="#F97316"/>
      <stop offset="100%" stop-color="#EA580C"/>
    </linearGradient>
    <!-- Ground Ambient Shadow -->
    <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0F172A" stop-opacity="0.25"/>
      <stop offset="70%" stop-color="#0F172A" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#0F172A" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Ground Contact Shadow (80px playfield footprint) -->
  <ellipse cx="{cx:.1f}" cy="{ground_y + 1:.1f}" rx="{28 + y_bob * -0.5:.1f}" ry="{7 + y_bob * -0.2:.1f}" fill="url(#groundShadow)"/>

  <!-- Main Character Group -->
  <g{torso_attr}>
    <!-- Back Hair Volume -->
    <path d="M {cx - 24:.1f} {head_y + 6:.1f} C {cx - 28:.1f} {head_y + 24:.1f} {cx - 22:.1f} {head_y + 36:.1f} {cx - 14:.1f} {head_y + 40:.1f} 
             C {cx:.1f} {head_y + 42:.1f} {cx + 14:.1f} {head_y + 40:.1f} {cx + 22:.1f} {head_y + 36:.1f} 
             C {cx + 28:.1f} {head_y + 24:.1f} {cx + 24:.1f} {head_y + 6:.1f} Z" fill="#0F172A"/>

    <!-- Left Leg & Boot -->
    <g transform="rotate({leg_l_angle:.1f} {cx - 12:.1f} {base_torso_y + 10:.1f})">
      <path d="M {cx - 16:.1f} {base_torso_y + 10:.1f} L {cx - 15:.1f} {ground_y - 8:.1f} L {cx - 9:.1f} {ground_y - 8:.1f} L {cx - 8:.1f} {base_torso_y + 10:.1f} Z" fill="#475569"/>
      <!-- Explorer Boot Left -->
      <path d="M {cx - 17:.1f} {ground_y - 8:.1f} Q {cx - 17:.1f} {ground_y - 2:.1f} {cx - 20:.1f} {ground_y:.1f} L {cx - 7:.1f} {ground_y:.1f} Q {cx - 6:.1f} {ground_y - 5:.1f} {cx - 8:.1f} {ground_y - 8:.1f} Z" fill="#334155"/>
      <path d="M {cx - 20:.1f} {ground_y - 1:.1f} L {cx - 6:.1f} {ground_y - 1:.1f} L {cx - 7:.1f} {ground_y + 1:.1f} L {cx - 19:.1f} {ground_y + 1:.1f} Z" fill="#1E293B"/>
    </g>

    <!-- Right Leg & Boot -->
    <g transform="rotate({leg_r_angle:.1f} {cx + 12:.1f} {base_torso_y + 10:.1f})">
      <path d="M {cx + 8:.1f} {base_torso_y + 10:.1f} L {cx + 9:.1f} {ground_y - 8:.1f} L {cx + 15:.1f} {ground_y - 8:.1f} L {cx + 16:.1f} {base_torso_y + 10:.1f} Z" fill="#475569"/>
      <!-- Explorer Boot Right -->
      <path d="M {cx + 8:.1f} {ground_y - 8:.1f} Q {cx + 6:.1f} {ground_y - 5:.1f} {cx + 7:.1f} {ground_y:.1f} L {cx + 20:.1f} {ground_y:.1f} Q {cx + 17:.1f} {ground_y - 2:.1f} {cx + 17:.1f} {ground_y - 8:.1f} Z" fill="#334155"/>
      <path d="M {cx + 7:.1f} {ground_y - 1:.1f} L {cx + 20:.1f} {ground_y - 1:.1f} L {cx + 19:.1f} {ground_y + 1:.1f} L {cx + 8:.1f} {ground_y + 1:.1f} Z" fill="#1E293B"/>
    </g>

    <!-- Cerulean Cloak Underlayer -->
    <g{cloak_attr}>
      <!-- Back Hem Flap -->
      <path d="M {cx - 26:.1f} {base_torso_y + 4:.1f} Q {cx:.1f} {base_torso_y + 8:.1f} {cx + 26:.1f} {base_torso_y + 4:.1f} 
               L {cx + 28:.1f} {base_torso_y + 24:.1f} Q {cx:.1f} {base_torso_y + 28:.1f} {cx - 28:.1f} {base_torso_y + 24:.1f} Z" 
            fill="url(#cloakShadowGrad)"/>

      <!-- Primary Ghibli Poncho / Cloak (#0284C7 cerulean teal) -->
      <path d="M {cx - 16:.1f} {base_torso_y - 14:.1f} 
               C {cx - 24:.1f} {base_torso_y - 8:.1f} {cx - 30:.1f} {base_torso_y + 6:.1f} {cx - 28:.1f} {base_torso_y + 22:.1f} 
               Q {cx - 26:.1f} {base_torso_y + 26:.1f} {cx - 20:.1f} {base_torso_y + 25:.1f} 
               C {cx - 10:.1f} {base_torso_y + 23:.1f} {cx + 10:.1f} {base_torso_y + 23:.1f} {cx + 20:.1f} {base_torso_y + 25:.1f} 
               Q {cx + 26:.1f} {base_torso_y + 26:.1f} {cx + 28:.1f} {base_torso_y + 22:.1f} 
               C {cx + 30:.1f} {base_torso_y + 6:.1f} {cx + 24:.1f} {base_torso_y - 8:.1f} {cx + 16:.1f} {base_torso_y - 14:.1f} Z" 
            fill="url(#cloakGrad)"/>

      <!-- Cloak Fold Highlights & Seam Detailing -->
      <path d="M {cx - 14:.1f} {base_torso_y - 10:.1f} Q {cx - 22:.1f} {base_torso_y + 10:.1f} {cx - 16:.1f} {base_torso_y + 24:.1f}" 
            stroke="#38BDF8" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.6"/>
      <path d="M {cx:.1f} {base_torso_y - 6:.1f} L {cx:.1f} {base_torso_y + 23:.1f}" 
            stroke="#0369A1" stroke-width="2.0" stroke-linecap="round" fill="none" opacity="0.7"/>
      <path d="M {cx + 14:.1f} {base_torso_y - 10:.1f} Q {cx + 22:.1f} {base_torso_y + 10:.1f} {cx + 16:.1f} {base_torso_y + 24:.1f}" 
            stroke="#0369A1" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.8"/>
    </g>

    <!-- Arms Layer -->
    {arms_markup}

    <!-- Trailing Scarf Ribbon (Back fold) -->
    <g{scarf_attr}>
      <path d="M {cx + 10:.1f} {head_y + 16:.1f} 
               Q {cx + 24:.1f} {head_y + 22:.1f} {cx + 34:.1f} {head_y + 32:.1f} 
               Q {cx + 26:.1f} {head_y + 36:.1f} {cx + 14:.1f} {head_y + 24:.1f} Z" 
            fill="#EA580C"/>
      <path d="M {cx + 14:.1f} {head_y + 20:.1f} 
               Q {cx + 30:.1f} {head_y + 28:.1f} {cx + 38:.1f} {head_y + 38:.1f} 
               Q {cx + 32:.1f} {head_y + 44:.1f} {cx + 16:.1f} {head_y + 26:.1f} Z" 
            fill="url(#scarfGrad)"/>
      <path d="M {cx + 34:.1f} {head_y + 37:.1f} L {cx + 37:.1f} {head_y + 39:.1f}" stroke="#FED7AA" stroke-width="1.5" stroke-linecap="round"/>
    </g>

    <!-- Head / Face (Warm Soft Peach #FED7AA) -->
    <circle cx="{cx:.1f}" cy="{head_y:.1f}" r="19" fill="#FED7AA"/>
    <!-- Subtle Rosy Cheeks -->
    <ellipse cx="{cx - 11:.1f}" cy="{head_y + 6:.1f}" rx="4.5" ry="2.6" fill="#FDA4AF" opacity="0.75"/>
    <ellipse cx="{cx + 11:.1f}" cy="{head_y + 6:.1f}" rx="4.5" ry="2.6" fill="#FDA4AF" opacity="0.75"/>
    <!-- Tiny Cute Nose -->
    <circle cx="{cx:.1f}" cy="{head_y + 5:.1f}" r="0.9" fill="#FDBA74"/>

    <!-- Eyes Layer -->
    {eyes_markup}

    <!-- Mouth Layer -->
    {mouth_markup}

    <!-- Front Storybook Hair Bangs (Soft Navy #1E293B) -->
    <path d="M {cx - 20:.1f} {head_y - 2:.1f} 
             C {cx - 22:.1f} {head_y - 16:.1f} {cx - 14:.1f} {head_y - 23:.1f} {cx:.1f} {head_y - 23:.1f} 
             C {cx + 14:.1f} {head_y - 23:.1f} {cx + 22:.1f} {head_y - 16:.1f} {cx + 20:.1f} {head_y - 2:.1f} 
             C {cx + 16:.1f} {head_y - 12:.1f} {cx + 10:.1f} {head_y - 8:.1f} {cx + 4:.1f} {head_y - 8:.1f} 
             C {cx - 2:.1f} {head_y - 8:.1f} {cx - 8:.1f} {head_y - 14:.1f} {cx - 12:.1f} {head_y - 8:.1f} 
             C {cx - 15:.1f} {head_y - 4:.1f} {cx - 18:.1f} {head_y - 6:.1f} {cx - 20:.1f} {head_y - 2:.1f} Z" 
          fill="#1E293B"/>

    <!-- Explorer Feather & Headband (#FBBF24 golden feather) -->
    <path d="M {cx - 19:.1f} {head_y - 8:.1f} Q {cx:.1f} {head_y - 18:.1f} {cx + 19:.1f} {head_y - 8:.1f}" 
          stroke="#0D9488" stroke-width="3" stroke-linecap="round" fill="none"/>
    <!-- Feather Pin -->
    <path d="M {cx + 16:.1f} {head_y - 10:.1f} 
             C {cx + 22:.1f} {head_y - 22:.1f} {cx + 26:.1f} {head_y - 30:.1f} {cx + 28:.1f} {head_y - 34:.1f} 
             C {cx + 24:.1f} {head_y - 28:.1f} {cx + 20:.1f} {head_y - 20:.1f} {cx + 16:.1f} {head_y - 10:.1f} Z" 
          fill="#FBBF24"/>
    <path d="M {cx + 17:.1f} {head_y - 12:.1f} L {cx + 27:.1f} {head_y - 32:.1f}" 
          stroke="#F59E0B" stroke-width="1.2" stroke-linecap="round"/>
    <circle cx="{cx + 16:.1f}" cy="{head_y - 9:.1f}" r="2.2" fill="#0D9488"/>

    <!-- Warm Coral Scarf (#F97316 Front Wrap) -->
    <path d="M {cx - 18:.1f} {head_y + 13:.1f} 
             C {cx - 14:.1f} {head_y + 10:.1f} {cx + 14:.1f} {head_y + 10:.1f} {cx + 18:.1f} {head_y + 13:.1f} 
             C {cx + 20:.1f} {head_y + 19:.1f} {cx + 16:.1f} {head_y + 23:.1f} {cx + 6:.1f} {head_y + 24:.1f} 
             C {cx - 6:.1f} {head_y + 24:.1f} {cx - 16:.1f} {head_y + 21:.1f} {cx - 18:.1f} {head_y + 13:.1f} Z" 
          fill="url(#scarfGrad)"/>
    <!-- Scarf Front Knot -->
    <ellipse cx="{cx + 8:.1f}" cy="{head_y + 18:.1f}" rx="4.5" ry="4" fill="#EA580C"/>
    <ellipse cx="{cx + 8:.1f}" cy="{head_y + 17:.1f}" rx="3.5" ry="3" fill="#F97316"/>
  </g>

  <!-- Optional FX (Sparkles/Sweat) -->
  {fx_markup}
</svg>"""
    return svg.strip()


# ==============================================================================
# 2. LIGHT ORB FACE BUILDER (96x96 canvas)
# ==============================================================================

def build_orb_face_svg(
    face_type: str,
    title: str
) -> str:
    """
    Constructs a standalone 96x96 master vector SVG for the Light Orb companion face states.
    Glowing golden-amber sphere (#FDE047, #F59E0B) with warm espresso facial linework (#78350F).
    """
    cx = 48.0
    cy = 48.0
    r = 34.0

    features_markup = ""
    extra_fx = ""

    if face_type == "happy":
        features_markup = f"""
        <!-- Wide Cheerful Crescent Eyes -->
        <path d="M {cx - 15} {cy - 3} Q {cx - 9} {cy - 10} {cx - 3} {cy - 3}" 
              stroke="#78350F" stroke-width="3.2" stroke-linecap="round" fill="none"/>
        <path d="M {cx + 3} {cy - 3} Q {cx + 9} {cy - 10} {cx + 15} {cy - 3}" 
              stroke="#78350F" stroke-width="3.2" stroke-linecap="round" fill="none"/>
        <!-- Soft Blush Cheeks -->
        <ellipse cx="{cx - 14}" cy="{cy + 5}" rx="5.5" ry="3" fill="#FB7185" opacity="0.6"/>
        <ellipse cx="{cx + 14}" cy="{cy + 5}" rx="5.5" ry="3" fill="#FB7185" opacity="0.6"/>
        <!-- Happy Open Smile with Tongue -->
        <path d="M {cx - 7} {cy + 7} Q {cx} {cy + 17} {cx + 7} {cy + 7} Z" fill="#78350F"/>
        <path d="M {cx - 4} {cy + 11} Q {cx} {cy + 16} {cx + 4} {cy + 11} Z" fill="#FB7185"/>
        """
        extra_fx = f"""
        <!-- Golden Joyful Radiance Sparkles -->
        <circle cx="{cx - 32}" cy="{cy - 20}" r="2" fill="#FEF08A" opacity="0.9"/>
        <circle cx="{cx + 32}" cy="{cy - 18}" r="2.5" fill="#FEF08A" opacity="0.9"/>
        <circle cx="{cx + 26}" cy="{cy + 26}" r="1.5" fill="#FEF08A" opacity="0.8"/>
        """
    elif face_type == "curious":
        features_markup = f"""
        <!-- Inquisitive Asymmetric Eyes -->
        <!-- Left Eye: Wide Curious Round -->
        <ellipse cx="{cx - 9}" cy="{cy - 4}" rx="4.2" ry="5.2" fill="#78350F"/>
        <circle cx="{cx - 10.5}" cy="{cy - 5.5}" r="1.8" fill="#FFFFFF"/>
        <!-- Right Eye: Inquisitive Arched Brow -->
        <path d="M {cx + 4} {cy - 2} Q {cx + 9} {cy - 8} {cx + 14} {cy - 2}" 
              stroke="#78350F" stroke-width="3.2" stroke-linecap="round" fill="none"/>
        <ellipse cx="{cx + 9}" cy="{cy - 2}" rx="3.0" ry="2.2" fill="#78350F"/>
        <!-- Soft Blush Cheeks -->
        <ellipse cx="{cx - 13}" cy="{cy + 5}" rx="4.5" ry="2.6" fill="#FB7185" opacity="0.5"/>
        <ellipse cx="{cx + 13}" cy="{cy + 5}" rx="4.5" ry="2.6" fill="#FB7185" opacity="0.5"/>
        <!-- Cute 'O' Mouth Tilted with Wonder -->
        <ellipse cx="{cx}" cy="{cy + 8}" rx="3.5" ry="4.5" fill="#78350F"/>
        <ellipse cx="{cx}" cy="{cy + 8}" rx="2.0" ry="3.0" fill="#451A03"/>
        """
        extra_fx = f"""
        <!-- Curious Light Spark Floating Above -->
        <path d="M {cx + 18} {cy - 28} Q {cx + 22} {cy - 28} {cx + 22} {cy - 32} Q {cx + 22} {cy - 28} {cx + 26} {cy - 28} Q {cx + 22} {cy - 28} {cx + 22} {cy - 24} Z" fill="#FFFFFF"/>
        """
    elif face_type == "thinking":
        features_markup = f"""
        <!-- Thoughtful Looking Upward Eyes -->
        <ellipse cx="{cx - 8}" cy="{cy - 6}" rx="3.8" ry="4.8" fill="#78350F"/>
        <circle cx="{cx - 9.5}" cy="{cy - 7.5}" r="1.6" fill="#FFFFFF"/>
        <ellipse cx="{cx + 10}" cy="{cy - 7}" rx="3.8" ry="4.8" fill="#78350F"/>
        <circle cx="{cx + 8.5}" cy="{cy - 8.5}" r="1.6" fill="#FFFFFF"/>
        <!-- Pondering Cheeks -->
        <ellipse cx="{cx - 13}" cy="{cy + 4}" rx="4.5" ry="2.6" fill="#FB7185" opacity="0.45"/>
        <ellipse cx="{cx + 13}" cy="{cy + 4}" rx="4.5" ry="2.6" fill="#FB7185" opacity="0.45"/>
        <!-- Pondering Wavy Thoughtful Mouth -->
        <path d="M {cx - 6} {cy + 7} Q {cx - 1} {cy + 10} {cx + 2} {cy + 6} Q {cx + 5} {cy + 7} {cx + 6} {cy + 6}" 
              stroke="#78350F" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        """
        extra_fx = f"""
        <!-- Floating Idea Sparks -->
        <circle cx="{cx - 24}" cy="{cy - 24}" r="2" fill="#FFFFFF" opacity="0.8"/>
        <circle cx="{cx - 16}" cy="{cy - 32}" r="3" fill="#FEF08A" opacity="0.9"/>
        """
    elif face_type == "sleepy":
        features_markup = f"""
        <!-- Drowsy Downward Curved Eyelids -->
        <path d="M {cx - 14} {cy - 3} Q {cx - 9} {cy + 3} {cx - 4} {cy - 3}" 
              stroke="#78350F" stroke-width="2.8" stroke-linecap="round" fill="none"/>
        <path d="M {cx + 4} {cy - 3} Q {cx + 9} {cy + 3} {cx + 14} {cy - 3}" 
              stroke="#78350F" stroke-width="2.8" stroke-linecap="round" fill="none"/>
        <!-- Gentle Dreamy Blush -->
        <ellipse cx="{cx - 13}" cy="{cy + 5}" rx="5.5" ry="3.2" fill="#FB7185" opacity="0.7"/>
        <ellipse cx="{cx + 13}" cy="{cy + 5}" rx="5.5" ry="3.2" fill="#FB7185" opacity="0.7"/>
        <!-- Soft Peaceful Smile -->
        <path d="M {cx - 4} {cy + 8} Q {cx} {cy + 12} {cx + 4} {cy + 8}" 
              stroke="#78350F" stroke-width="2.2" stroke-linecap="round" fill="none"/>
        """
        extra_fx = f"""
        <!-- Calming Twilight Zzz / Starlight Drift -->
        <text x="{cx + 22}" y="{cy - 16}" font-family="sans-serif" font-weight="bold" font-size="12" fill="#A5B4FC" opacity="0.85">z</text>
        <text x="{cx + 28}" y="{cy - 26}" font-family="sans-serif" font-weight="bold" font-size="15" fill="#818CF8" opacity="0.95">Z</text>
        """

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img" aria-label="{title}">
  <defs>
    <!-- Outer Ambient Glow -->
    <radialGradient id="orbHalo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FDE047" stop-opacity="0.6"/>
      <stop offset="60%" stop-color="#F59E0B" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#F59E0B" stop-opacity="0"/>
    </radialGradient>
    <!-- Core Luminous Sphere -->
    <radialGradient id="orbBody" cx="38%" cy="34%" r="62%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="18%" stop-color="#FEF08A"/>
      <stop offset="55%" stop-color="#FDE047"/>
      <stop offset="85%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </radialGradient>
  </defs>

  <!-- Ambient Golden Aura (Radiates to 88px) -->
  <circle cx="{cx}" cy="{cy}" r="44" fill="url(#orbHalo)"/>

  <!-- Core Glowing Sphere Body (Radius 34px) -->
  <circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#orbBody)"/>

  <!-- Glass Specular Highlight (Monument Valley clean reflection) -->
  <path d="M {cx - 16} {cy - 24} Q {cx} {cy - 28} {cx + 12} {cy - 22} Q {cx + 6} {cy - 16} {cx - 10} {cy - 18} Z" 
        fill="#FFFFFF" opacity="0.65"/>
  <circle cx="{cx - 18}" cy="{cy - 12}" r="3" fill="#FFFFFF" opacity="0.7"/>

  <!-- Facial Expression Layer -->
  {features_markup}

  <!-- Atmospheric FX (Sparkles/Stardust) -->
  {extra_fx}
</svg>"""
    return svg.strip()


# ==============================================================================
# 3. ENVIRONMENT LIMESTONE TILES BUILDER (160x160 canvas)
# ==============================================================================

def build_limestone_floor_tile(variant: str) -> str:
    """
    Constructs 160x160 master vector SVG for ancient sanctuary limestone floor pavers.
    Soft mortar bevels, delicate clover/moss accents, hand-chiseled warmth.
    """
    if variant == "light_01":
        # Clean pale limestone flagstone with subtle chisel bevels and ancient spiral motif
        svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Limestone Paver - Light Clean">
  <defs>
    <linearGradient id="mortarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E2E8F0"/>
      <stop offset="100%" stop-color="#CBD5E1"/>
    </linearGradient>
    <linearGradient id="stoneSurface" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="30%" stop-color="#F8FAFC"/>
      <stop offset="100%" stop-color="#F1F5F9"/>
    </linearGradient>
    <linearGradient id="bevelLight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="bevelShadow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#64748B" stop-opacity="0"/>
      <stop offset="100%" stop-color="#64748B" stop-opacity="0.25"/>
    </linearGradient>
  </defs>

  <!-- Mortar Joint Base Bed -->
  <rect width="160" height="160" fill="url(#mortarGrad)"/>

  <!-- Main Beveled Limestone Paver (4px inset) -->
  <rect x="4" y="4" width="152" height="152" rx="6" fill="url(#stoneSurface)"/>

  <!-- Top & Left Light Bevel -->
  <path d="M 4 10 Q 4 4 10 4 L 150 4 Q 156 4 156 10 L 150 10 L 10 10 L 10 150 L 4 156 Z" fill="url(#bevelLight)"/>

  <!-- Bottom & Right Ambient Occlusion Shadow -->
  <path d="M 4 156 L 10 150 L 150 150 L 150 10 L 156 4 Q 156 156 150 156 Z" fill="url(#bevelShadow)"/>

  <!-- Hand-Hewn Chisel Texture Grooves -->
  <g stroke="#94A3B8" stroke-width="1.2" stroke-linecap="round" opacity="0.35">
    <path d="M 28 36 L 54 34"/>
    <path d="M 112 42 L 138 40"/>
    <path d="M 34 120 L 68 122"/>
    <path d="M 98 114 L 126 112"/>
    <path d="M 72 74 L 88 74"/>
  </g>

  <!-- Subtle Ancient Sanctuary Inscribed Swirl in Center -->
  <path d="M 76 80 A 4 4 0 0 1 84 80 A 8 8 0 0 1 76 88 A 12 12 0 0 1 68 76" 
        stroke="#CBD5E1" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.5"/>
</svg>"""
    elif variant == "light_02":
        # Pale limestone flagstone with organic emerald clover sprigs in corner mortar
        svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Limestone Paver - Light Clover Accent">
  <defs>
    <linearGradient id="mortarGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E2E8F0"/>
      <stop offset="100%" stop-color="#CBD5E1"/>
    </linearGradient>
    <linearGradient id="stoneSurface2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="35%" stop-color="#F8FAFC"/>
      <stop offset="100%" stop-color="#F1F5F9"/>
    </linearGradient>
  </defs>

  <!-- Mortar Joint Bed -->
  <rect width="160" height="160" fill="url(#mortarGrad2)"/>

  <!-- Flagstone Paver -->
  <rect x="4" y="4" width="152" height="152" rx="6" fill="url(#stoneSurface2)"/>

  <!-- Bevel Edges -->
  <path d="M 4 4 L 156 4 L 150 10 L 10 10 L 10 150 L 4 156 Z" fill="#FFFFFF" opacity="0.7"/>
  <path d="M 156 4 L 156 156 L 4 156 L 10 150 L 150 150 L 150 10 Z" fill="#64748B" opacity="0.2"/>

  <!-- Surface Texture -->
  <path d="M 24 50 Q 50 48 76 52" stroke="#94A3B8" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.3"/>
  <path d="M 88 108 Q 116 106 136 110" stroke="#94A3B8" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.3"/>

  <!-- Organic Clover / Moss Cluster Sprouting at Seam (Bottom Right) -->
  <g transform="translate(118, 118)">
    <!-- Soft Moss Bed (#047857) -->
    <path d="M 6 32 Q 14 22 26 26 Q 34 20 38 32 Z" fill="#047857" opacity="0.85"/>
    <path d="M 10 32 Q 18 24 28 27 Q 34 24 36 32 Z" fill="#059669"/>
    <!-- Clover 1 (Three Emerald Leaflets #10B981) -->
    <path d="M 18 22 Q 12 14 20 10 Q 24 16 18 22 Z" fill="#10B981"/>
    <path d="M 18 22 Q 14 26 10 20 Q 14 16 18 22 Z" fill="#10B981"/>
    <path d="M 18 22 Q 24 24 22 16 Q 16 18 18 22 Z" fill="#34D399"/>
    <!-- Clover Stem -->
    <path d="M 18 22 Q 19 28 22 32" stroke="#059669" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <!-- Clover 2 (Tiny Bud) -->
    <circle cx="30" cy="22" r="3" fill="#10B981"/>
    <circle cx="34" cy="20" r="2.5" fill="#34D399"/>
    <circle cx="33" cy="24" r="2.5" fill="#059669"/>
    <!-- Dewdrop -->
    <circle cx="19" cy="14" r="1" fill="#FFFFFF" opacity="0.9"/>
  </g>
</svg>"""
    elif variant == "dark_01":
        # Deeper sage limestone flagstone with central geometric diamond relief
        svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Limestone Paver - Dark Geometric Relief">
  <defs>
    <linearGradient id="darkStoneMortar" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#94A3B8"/>
      <stop offset="100%" stop-color="#64748B"/>
    </linearGradient>
    <linearGradient id="darkStoneSurface" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#E2E8F0"/>
      <stop offset="40%" stop-color="#CBD5E1"/>
      <stop offset="100%" stop-color="#94A3B8"/>
    </linearGradient>
    <linearGradient id="reliefGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F1F5F9"/>
      <stop offset="100%" stop-color="#94A3B8"/>
    </linearGradient>
  </defs>

  <!-- Mortar Joint Bed -->
  <rect width="160" height="160" fill="url(#darkStoneMortar)"/>

  <!-- Sage Limestone Flagstone -->
  <rect x="4" y="4" width="152" height="152" rx="6" fill="url(#darkStoneSurface)"/>

  <!-- Bevel Rim -->
  <path d="M 4 4 L 156 4 L 150 10 L 10 10 L 10 150 L 4 156 Z" fill="#FFFFFF" opacity="0.5"/>
  <path d="M 156 4 L 156 156 L 4 156 L 10 150 L 150 150 L 150 10 Z" fill="#334155" opacity="0.3"/>

  <!-- Architectural Monument Valley Stepped Diamond Relief -->
  <g transform="translate(80, 80)">
    <!-- Outer Inset Stepped Diamond -->
    <polygon points="0,-48 48,0 0,48 -48,0" fill="#94A3B8" opacity="0.4"/>
    <polygon points="0,-44 44,0 0,44 -44,0" fill="url(#reliefGrad)"/>
    <!-- Inner Stepped Diamond -->
    <polygon points="0,-28 28,0 0,28 -28,0" fill="#64748B" opacity="0.35"/>
    <polygon points="0,-24 24,0 0,24 -24,0" fill="#E2E8F0"/>
    <!-- Central Core Keystone -->
    <polygon points="0,-10 10,0 0,10 -10,0" fill="#475569"/>
    <circle cx="0" cy="0" r="3" fill="#F8FAFC"/>
  </g>

  <!-- Corner Masonry Pins -->
  <circle cx="22" cy="22" r="2.5" fill="#64748B" opacity="0.6"/>
  <circle cx="138" cy="22" r="2.5" fill="#64748B" opacity="0.6"/>
  <circle cx="22" cy="138" r="2.5" fill="#64748B" opacity="0.6"/>
  <circle cx="138" cy="138" r="2.5" fill="#64748B" opacity="0.6"/>
</svg>"""
    elif variant == "dark_02":
        # Deeper sage limestone flagstone with creeping ivy and lichen edges
        svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Limestone Paver - Dark Mossy Variant">
  <defs>
    <linearGradient id="darkStoneSurface3" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#E2E8F0"/>
      <stop offset="50%" stop-color="#CBD5E1"/>
      <stop offset="100%" stop-color="#94A3B8"/>
    </linearGradient>
  </defs>

  <!-- Mortar Joint Bed -->
  <rect width="160" height="160" fill="#64748B"/>

  <!-- Sage Limestone Flagstone -->
  <rect x="4" y="4" width="152" height="152" rx="6" fill="url(#darkStoneSurface3)"/>

  <!-- Bevel Rim -->
  <path d="M 4 4 L 156 4 L 150 10 L 10 10 L 10 150 L 4 156 Z" fill="#FFFFFF" opacity="0.5"/>
  <path d="M 156 4 L 156 156 L 4 156 L 10 150 L 150 150 L 150 10 Z" fill="#334155" opacity="0.3"/>

  <!-- Surface Weathering Lines -->
  <path d="M 32 38 L 84 36 M 104 124 L 140 120" stroke="#64748B" stroke-width="1.4" stroke-linecap="round" opacity="0.35"/>

  <!-- Creeping Sanctuary Moss Along Left Seam -->
  <g>
    <!-- Base Moss Patches (#047857, #059669) -->
    <path d="M 4 16 Q 16 24 12 38 Q 20 48 10 64 Q 18 78 8 96 Q 14 114 4 126 Z" fill="#047857"/>
    <path d="M 4 20 Q 14 26 10 36 Q 16 46 8 60 Q 15 76 6 92 Q 11 110 4 122 Z" fill="#059669"/>
    <!-- Lush Leaves / Fronds (#10B981) -->
    <circle cx="12" cy="30" r="4.5" fill="#10B981"/>
    <circle cx="15" cy="44" r="5" fill="#10B981"/>
    <circle cx="11" cy="58" r="4" fill="#34D399"/>
    <circle cx="14" cy="72" r="5.5" fill="#10B981"/>
    <circle cx="10" cy="88" r="4.5" fill="#34D399"/>
    <circle cx="12" cy="104" r="5" fill="#10B981"/>
    <!-- Lichen Golden Spores (#FBBF24) -->
    <circle cx="16" cy="34" r="1.5" fill="#FBBF24"/>
    <circle cx="18" cy="76" r="1.8" fill="#FBBF24"/>
    <circle cx="14" cy="94" r="1.5" fill="#FBBF24"/>
  </g>
</svg>"""
    return svg.strip()


# ==============================================================================
# 4. WALL CAPS BUILDER (160x160 canvas)
# ==============================================================================

def build_wall_cap_svg(variant: str) -> str:
    """
    Constructs 160x160 master vector SVG for sanctuary perimeter boundary wall caps:
    - wall_cap_top: Top horizontal wall cap coping stone with cast shadow
    - wall_cap_bottom: Plinth foundation footing wall cap
    - wall_cap_corner: Chamfered corner bastion wall cap
    - wall_cap_moss: Lush weathered mossy wall cap
    """
    if variant == "top":
        svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Wall Cap - Top Horizontal Coping">
  <defs>
    <linearGradient id="wallCoping" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="30%" stop-color="#E2E8F0"/>
      <stop offset="100%" stop-color="#CBD5E1"/>
    </linearGradient>
    <linearGradient id="wallFace" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#94A3B8"/>
      <stop offset="100%" stop-color="#64748B"/>
    </linearGradient>
  </defs>

  <!-- Void / Outside Perimeter Background -->
  <rect width="160" height="160" fill="#334155"/>

  <!-- Lower Wall Face In Shadow -->
  <rect x="0" y="64" width="160" height="96" fill="url(#wallFace)"/>

  <!-- Masonry Joints on Lower Wall -->
  <path d="M 48 64 L 48 160 M 112 64 L 112 160" stroke="#475569" stroke-width="2"/>

  <!-- Overhang Cast Shadow Under Coping -->
  <rect x="0" y="60" width="160" height="12" fill="#1E293B" opacity="0.6"/>

  <!-- Stepped Limestone Coping Stone (Top Perimeter) -->
  <rect x="0" y="8" width="160" height="54" rx="2" fill="url(#wallCoping)"/>
  <rect x="0" y="0" width="160" height="14" fill="#FFFFFF" opacity="0.85"/>
  <rect x="0" y="56" width="160" height="6" fill="#94A3B8"/>

  <!-- Vertical Ashlar Coping Seams -->
  <path d="M 80 0 L 80 62" stroke="#94A3B8" stroke-width="2"/>
  <path d="M 79 0 L 79 62" stroke="#FFFFFF" stroke-width="1" opacity="0.6"/>
</svg>"""
    elif variant == "bottom":
        svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Wall Cap - Bottom Foundation Plinth">
  <defs>
    <linearGradient id="plinthGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#94A3B8"/>
      <stop offset="60%" stop-color="#64748B"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
    <linearGradient id="floorLeadIn" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#CBD5E1"/>
      <stop offset="100%" stop-color="#F1F5F9"/>
    </linearGradient>
  </defs>

  <!-- Upper Wall Face -->
  <rect width="160" height="96" fill="url(#plinthGrad)"/>
  <path d="M 80 0 L 80 96" stroke="#334155" stroke-width="2"/>

  <!-- Base Plinth Bevel Footing -->
  <polygon points="0,96 160,96 160,118 0,118" fill="#475569"/>
  <polygon points="0,96 160,96 160,102 0,102" fill="#64748B"/>
  <polygon points="0,118 160,118 160,126 0,126" fill="#334155"/>

  <!-- Transition Into Sanctuary Floor Flagstone -->
  <rect x="0" y="126" width="160" height="34" fill="url(#floorLeadIn)"/>
  <!-- Mortar Seam Line -->
  <path d="M 0 126 L 160 126" stroke="#94A3B8" stroke-width="2"/>
</svg>"""
    elif variant == "corner":
        svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Wall Cap - Chamfered Corner Bastion">
  <defs>
    <linearGradient id="cornerLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#CBD5E1"/>
    </linearGradient>
    <linearGradient id="cornerShadow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#64748B"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>
  </defs>

  <!-- Outside Abyss Void -->
  <rect width="160" height="160" fill="#1E293B"/>

  <!-- Corner Bastion Quoins -->
  <!-- Illuminated North-West Facet -->
  <polygon points="20,20 140,20 80,80 20,80" fill="url(#cornerLight)"/>
  <!-- West Bevel Facet -->
  <polygon points="20,20 80,80 20,140 20,20" fill="#E2E8F0"/>
  <!-- Shaded South-East Facet -->
  <polygon points="80,80 140,20 140,140 20,140" fill="url(#cornerShadow)"/>

  <!-- Center Keystone Diamond Cap -->
  <polygon points="80,50 110,80 80,110 50,80" fill="#F8FAFC"/>
  <polygon points="80,56 104,80 80,104 56,80" fill="#94A3B8"/>
  <circle cx="80" cy="80" r="8" fill="#475569"/>
  <circle cx="80" cy="80" r="4" fill="#FFFFFF"/>

  <!-- Mitred Joint Carvings -->
  <line x1="20" y1="20" x2="80" y2="80" stroke="#FFFFFF" stroke-width="2.5"/>
  <line x1="140" y1="20" x2="80" y2="80" stroke="#94A3B8" stroke-width="2"/>
  <line x1="80" y1="80" x2="140" y2="140" stroke="#1E293B" stroke-width="3"/>
  <line x1="80" y1="80" x2="20" y2="140" stroke="#475569" stroke-width="2"/>
</svg>"""
    elif variant == "moss":
        svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Wall Cap - Weathered Mossy Coping">
  <defs>
    <linearGradient id="mossyCoping" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F1F5F9"/>
      <stop offset="60%" stop-color="#CBD5E1"/>
      <stop offset="100%" stop-color="#94A3B8"/>
    </linearGradient>
  </defs>

  <!-- Outside Void -->
  <rect width="160" height="160" fill="#334155"/>

  <!-- Coping Slab -->
  <rect x="0" y="8" width="160" height="64" fill="url(#mossyCoping)"/>
  <rect x="0" y="0" width="160" height="14" fill="#FFFFFF" opacity="0.8"/>
  <rect x="0" y="68" width="160" height="12" fill="#1E293B" opacity="0.7"/>

  <!-- Weathered Stone Fissure / Relief -->
  <path d="M 44 8 L 48 32 L 40 48 L 44 68" stroke="#64748B" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M 124 16 L 118 38 L 122 58" stroke="#64748B" stroke-width="1.5" stroke-linecap="round" fill="none"/>

  <!-- Cascading Storybook Moss & Vines Drooping Over Wall -->
  <g>
    <!-- Deep Green Moss Mantle (#047857, #059669) -->
    <path d="M 0 12 Q 22 24 38 14 Q 54 6 70 18 Q 88 28 106 12 Q 130 8 160 20 L 160 38 
             Q 146 54 136 42 Q 124 32 110 52 Q 94 68 82 46 Q 70 34 56 58 Q 42 66 30 48 Q 16 36 0 50 Z" 
          fill="#047857"/>
    <path d="M 0 14 Q 24 22 36 16 Q 52 10 68 20 Q 86 26 104 14 Q 128 10 160 22 L 160 34 
             Q 148 48 138 38 Q 122 30 112 46 Q 96 60 84 42 Q 72 32 58 52 Q 44 60 32 44 Q 18 32 0 44 Z" 
          fill="#059669"/>
    <!-- Lush Hanging Tendrils (#10B981) -->
    <path d="M 32 44 Q 34 68 30 84 Q 28 72 26 46 Z" fill="#10B981"/>
    <path d="M 82 42 Q 86 74 80 92 Q 76 76 78 44 Z" fill="#10B981"/>
    <path d="M 112 44 Q 116 66 114 80 Q 110 68 108 46 Z" fill="#34D399"/>
    <!-- Tiny Blue Bellflowers (#38BDF8) -->
    <circle cx="30" cy="85" r="2.8" fill="#38BDF8"/>
    <circle cx="80" cy="93" r="3.2" fill="#38BDF8"/>
    <circle cx="114" cy="81" r="2.5" fill="#38BDF8"/>
  </g>
</svg>"""
    return svg.strip()


# ==============================================================================
# 5. GLOWING ENERGY CONDUIT TRACKS & PORTAL (160x160 canvas)
# ==============================================================================

def build_conduit_svg(variant: str) -> str:
    """
    Constructs 160x160 master vector SVG for bioluminescent floor conduits and unsealed portal:
    - straight: Vertical channel top to bottom
    - corner: 90 degree elbow top to right
    - t_junction: T-channel bottom, left, right
    - cross: 4-way intersection
    - switch_i, switch_ii, switch_iii: Roman numeral floor switches
    - portal_archway: Ancient unsealed starlight portal
    """
    # Common limestone base definition
    base_limestone = """
  <!-- Base Limestone Paver Bed -->
  <rect width="160" height="160" fill="#94A3B8"/>
  <rect x="4" y="4" width="152" height="152" rx="6" fill="#CBD5E1"/>
  <!-- Paver Inset Bevel -->
  <path d="M 4 4 L 156 4 L 150 10 L 10 10 L 10 150 L 4 156 Z" fill="#FFFFFF" opacity="0.6"/>
  <path d="M 156 4 L 156 156 L 4 156 L 10 150 L 150 150 L 150 10 Z" fill="#475569" opacity="0.3"/>
    """

    conduit_defs = """
  <defs>
    <!-- Radiant Starlight Conduit Glow Gradients -->
    <linearGradient id="cyanConduitGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0891B2" stop-opacity="0.2"/>
      <stop offset="35%" stop-color="#06B6D4" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#E0F2FE"/>
      <stop offset="65%" stop-color="#06B6D4" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#0891B2" stop-opacity="0.2"/>
    </linearGradient>
    <radialGradient id="portalCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="25%" stop-color="#E0F2FE"/>
      <stop offset="50%" stop-color="#38BDF8"/>
      <stop offset="75%" stop-color="#818CF8"/>
      <stop offset="100%" stop-color="#1E1B4B"/>
    </radialGradient>
  </defs>
    """

    if variant == "straight":
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Energy Conduit - Straight Track">
{conduit_defs}
{base_limestone}
  <!-- Recessed Chiseled Conduit Channel (Width 28px, X: 66 to 94) -->
  <rect x="66" y="0" width="28" height="160" fill="#334155"/>
  <line x1="66" y1="0" x2="66" y2="160" stroke="#1E293B" stroke-width="2"/>
  <line x1="94" y1="0" x2="94" y2="160" stroke="#64748B" stroke-width="2"/>

  <!-- Ambient Bioluminescent Bloom Halo -->
  <rect x="62" y="0" width="36" height="160" fill="#06B6D4" opacity="0.25"/>

  <!-- Glowing Cyan Liquid Light Stream -->
  <rect x="72" y="0" width="16" height="160" fill="#06B6D4"/>
  <!-- Ultra-Bright White Energy Core Pulse -->
  <line x1="80" y1="0" x2="80" y2="160" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>
  <line x1="80" y1="0" x2="80" y2="160" stroke="#E0F2FE" stroke-width="9" stroke-linecap="round" opacity="0.6"/>

  <!-- Ancient Inscribed Circuit Glyphs Along Flanks -->
  <circle cx="56" cy="40" r="3" fill="#06B6D4" opacity="0.8"/>
  <path d="M 56 40 L 66 40" stroke="#06B6D4" stroke-width="1.8"/>
  <circle cx="104" cy="120" r="3" fill="#06B6D4" opacity="0.8"/>
  <path d="M 104 120 L 94 120" stroke="#06B6D4" stroke-width="1.8"/>
</svg>"""
    elif variant == "corner":
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Energy Conduit - Elbow Corner Track">
{conduit_defs}
{base_limestone}
  <!-- Recessed Curved Conduit Channel (Top to Right) -->
  <path d="M 66 0 L 94 0 A 14 14 0 0 1 160 66 L 160 94 A 94 94 0 0 0 66 0 Z" fill="#334155"/>

  <!-- Ambient Cyan Bloom -->
  <path d="M 80 0 A 80 80 0 0 1 160 80" stroke="#06B6D4" stroke-width="36" fill="none" opacity="0.2"/>

  <!-- Glowing Conduit Stream -->
  <path d="M 80 0 A 80 80 0 0 1 160 80" stroke="#06B6D4" stroke-width="16" fill="none"/>
  <!-- White-Hot Energy Pulse Core -->
  <path d="M 80 0 A 80 80 0 0 1 160 80" stroke="#FFFFFF" stroke-width="5" fill="none"/>
  <path d="M 80 0 A 80 80 0 0 1 160 80" stroke="#E0F2FE" stroke-width="9" fill="none" opacity="0.7"/>

  <!-- Corner Focusing Node Prisms -->
  <circle cx="70" cy="90" r="4" fill="#06B6D4"/>
  <line x1="70" y1="90" x2="80" y2="80" stroke="#22D3EE" stroke-width="2"/>
</svg>"""
    elif variant == "t_junction":
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Energy Conduit - T-Junction Track">
{conduit_defs}
{base_limestone}
  <!-- Recessed T-Channel (Left, Right, Bottom) -->
  <path d="M 0 66 L 66 66 L 66 160 L 94 160 L 94 66 L 160 66 L 160 94 L 94 94 L 94 94 L 66 94 L 0 94 Z" fill="#334155"/>

  <!-- Glowing Conduit T-Tracks -->
  <path d="M 0 80 L 160 80 M 80 80 L 80 160" stroke="#06B6D4" stroke-width="16" fill="none"/>
  <path d="M 0 80 L 160 80 M 80 80 L 80 160" stroke="#E0F2FE" stroke-width="9" fill="none" opacity="0.7"/>
  <path d="M 0 80 L 160 80 M 80 80 L 80 160" stroke="#FFFFFF" stroke-width="5" fill="none"/>

  <!-- Central T-Junction Focus Crystal -->
  <circle cx="80" cy="80" r="14" fill="#0E7490"/>
  <circle cx="80" cy="80" r="10" fill="#06B6D4"/>
  <circle cx="80" cy="80" r="6" fill="#FFFFFF"/>
</svg>"""
    elif variant == "cross":
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Energy Conduit - 4-Way Cross Junction">
{conduit_defs}
{base_limestone}
  <!-- Recessed 4-Way Cross Channel -->
  <rect x="66" y="0" width="28" height="160" fill="#334155"/>
  <rect x="0" y="66" width="160" height="28" fill="#334155"/>

  <!-- Glowing Conduit Cross Tracks -->
  <path d="M 80 0 L 80 160 M 0 80 L 160 80" stroke="#06B6D4" stroke-width="16" fill="none"/>
  <path d="M 80 0 L 80 160 M 0 80 L 160 80" stroke="#E0F2FE" stroke-width="9" fill="none" opacity="0.7"/>
  <path d="M 80 0 L 80 160 M 0 80 L 160 80" stroke="#FFFFFF" stroke-width="5" fill="none"/>

  <!-- Radiant Central Ring Junction -->
  <circle cx="80" cy="80" r="18" fill="#0891B2" opacity="0.8"/>
  <circle cx="80" cy="80" r="12" fill="#22D3EE"/>
  <circle cx="80" cy="80" r="6" fill="#FFFFFF"/>
</svg>"""
    elif variant in ("switch_i", "switch_ii", "switch_iii"):
        roman_map = {
            "switch_i": "I",
            "switch_ii": "II",
            "switch_iii": "III"
        }
        roman = roman_map[variant]
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Energy Conduit - Floor Switch {roman}">
{conduit_defs}
{base_limestone}
  <!-- Octagonal Raised Switch Pedestal Plate -->
  <polygon points="46,20 114,20 140,46 140,114 114,140 46,140 20,114 20,46" fill="#334155"/>
  <polygon points="48,24 112,24 136,48 136,112 112,136 48,136 24,112 24,48" fill="#475569"/>

  <!-- Concentric Glowing Resonance Ring -->
  <circle cx="80" cy="80" r="44" stroke="#06B6D4" stroke-width="4" fill="#1E293B"/>
  <circle cx="80" cy="80" r="38" stroke="#38BDF8" stroke-width="2" fill="#0F172A" opacity="0.8"/>

  <!-- Energy Feed Traces Inflow from Edges -->
  <line x1="80" y1="0" x2="80" y2="36" stroke="#06B6D4" stroke-width="6"/>
  <line x1="80" y1="0" x2="80" y2="36" stroke="#FFFFFF" stroke-width="2"/>
  <line x1="80" y1="124" x2="80" y2="160" stroke="#06B6D4" stroke-width="6"/>
  <line x1="80" y1="124" x2="80" y2="160" stroke="#FFFFFF" stroke-width="2"/>

  <!-- Roman Numeral Rune ({roman}) Carved into Stone with Starlight Cyan Glow -->
  <text x="80" y="93" 
        font-family="Georgia, serif" 
        font-weight="bold" 
        font-size="36" 
        text-anchor="middle" 
        fill="#FFFFFF" 
        stroke="#38BDF8" 
        stroke-width="1.5" 
        letter-spacing="2">{roman}</text>

  <!-- 4 Corner Alignment Resonators -->
  <circle cx="52" cy="52" r="3.5" fill="#FBBF24"/>
  <circle cx="108" cy="52" r="3.5" fill="#FBBF24"/>
  <circle cx="52" cy="108" r="3.5" fill="#FBBF24"/>
  <circle cx="108" cy="108" r="3.5" fill="#FBBF24"/>
</svg>"""
    elif variant == "portal_archway":
        # Ancient sanctuary unsealed starlight portal archway with swirling starry vortex
        svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="Ancient Sanctuary - Unsealed Starlight Portal Archway">
  <defs>
    <!-- Celestial Portal Swirl Gradient -->
    <radialGradient id="portalVoid" cx="50%" cy="58%" r="52%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="20%" stop-color="#E0F2FE"/>
      <stop offset="45%" stop-color="#38BDF8"/>
      <stop offset="70%" stop-color="#6366F1"/>
      <stop offset="90%" stop-color="#312E81"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </radialGradient>
    <linearGradient id="portalPillar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#CBD5E1"/>
      <stop offset="50%" stop-color="#F1F5F9"/>
      <stop offset="100%" stop-color="#94A3B8"/>
    </linearGradient>
  </defs>

  <!-- Sanctuary Chamber Background -->
  <rect width="160" height="160" fill="#1E293B"/>

  <!-- Portal Threshold Aperture (Unsealed Arch Opening) -->
  <path d="M 28 152 L 28 68 C 28 32 50 18 80 18 C 110 18 132 32 132 68 L 132 152 Z" 
        fill="url(#portalVoid)"/>

  <!-- Swirling Stardust Spiral Nebula inside Portal -->
  <g opacity="0.85">
    <ellipse cx="80" cy="80" rx="34" ry="26" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-dasharray="8 6" transform="rotate(-25 80 80)"/>
    <ellipse cx="80" cy="80" rx="24" ry="18" fill="none" stroke="#E0F2FE" stroke-width="2.2" stroke-dasharray="10 8" transform="rotate(35 80 80)"/>
    <ellipse cx="80" cy="80" rx="14" ry="10" fill="none" stroke="#FDE047" stroke-width="1.5" stroke-dasharray="6 4" transform="rotate(-60 80 80)"/>
    <circle cx="80" cy="80" r="6" fill="#FFFFFF"/>
    <!-- Floating Distant Stars in the Aperture -->
    <circle cx="62" cy="56" r="1.5" fill="#FFFFFF"/>
    <circle cx="98" cy="52" r="1.8" fill="#FEF08A"/>
    <circle cx="58" cy="98" r="1.2" fill="#FFFFFF"/>
    <circle cx="104" cy="94" r="1.5" fill="#38BDF8"/>
    <circle cx="80" cy="42" r="2.2" fill="#FFFFFF"/>
  </g>

  <!-- Carved Limestone Portal Pillars & Keystone Lintels -->
  <!-- Left Pillar -->
  <rect x="18" y="58" width="18" height="96" fill="url(#portalPillar)"/>
  <rect x="14" y="54" width="26" height="8" fill="#E2E8F0"/>
  <rect x="14" y="146" width="26" height="8" fill="#64748B"/>
  <path d="M 27 62 L 27 146" stroke="#06B6D4" stroke-width="2.5" opacity="0.8"/>

  <!-- Right Pillar -->
  <rect x="124" y="58" width="18" height="96" fill="url(#portalPillar)"/>
  <rect x="120" y="54" width="26" height="8" fill="#E2E8F0"/>
  <rect x="120" y="146" width="26" height="8" fill="#64748B"/>
  <path d="M 133 62 L 133 146" stroke="#06B6D4" stroke-width="2.5" opacity="0.8"/>

  <!-- Arch Lintel Stones (Monument Valley clean geometry) -->
  <path d="M 22 56 C 22 24 46 10 80 10 C 114 10 138 24 138 56 L 126 56 C 126 30 106 20 80 20 C 54 20 34 30 34 56 Z" 
        fill="#CBD5E1"/>
  <path d="M 22 56 C 22 24 46 10 80 10 C 114 10 138 24 138 56 L 132 56 C 132 28 110 16 80 16 C 50 16 28 28 28 56 Z" 
        fill="#F8FAFC"/>

  <!-- Arch Apex Keystone with Ancient Sun Emblem -->
  <polygon points="70,6 90,6 94,26 66,26" fill="#F1F5F9"/>
  <polygon points="72,8 88,8 92,24 68,24" fill="#E2E8F0"/>
  <circle cx="80" cy="16" r="4.5" fill="#F59E0B"/>
  <circle cx="80" cy="16" r="2.5" fill="#FEF08A"/>

  <!-- Portal Threshold Step -->
  <rect x="20" y="152" width="120" height="8" fill="#94A3B8"/>
  <line x1="20" y1="152" x2="140" y2="152" stroke="#FFFFFF" stroke-width="1.5"/>
</svg>"""
    return svg.strip()


# ==============================================================================
# 6. MASTER ASSET BATCH GENERATION
# ==============================================================================

def generate_all_assets():
    assets_created = []

    print(f"Generating Storybook Vector Assets into: {OUTPUT_DIR}\n")

    # --------------------------------------------------------------------------
    # A. ZYRA SPRITES (160x160)
    # --------------------------------------------------------------------------
    
    # 1. Idle (6 frames @ 8 FPS)
    idle_bobs = [0.0, -1.2, -2.5, -2.0, -0.8, 0.0]
    idle_tilts = [0.0, 0.8, 1.5, 1.2, 0.5, 0.0]
    idle_scarfs = [-1.0, 0.5, 2.5, 3.5, 1.5, -0.5]
    idle_blinks = ["open", "open", "open", "half", "closed", "open"]

    for i in range(6):
        fn = f"zyra_idle_{i+1:02d}.svg"
        svg = build_zyra_svg(
            frame_name=f"Idle {i+1}/6",
            action="idle",
            frame_idx=i,
            total_frames=6,
            y_bob=idle_bobs[i],
            cloak_tilt=idle_tilts[i],
            scarf_flutter=idle_scarfs[i],
            blink_state=idle_blinks[i],
            arms_pose="idle"
        )
        fp = os.path.join(OUTPUT_DIR, fn)
        with open(fp, "w", encoding="utf-8") as f:
            f.write(svg)
        assets_created.append(fp)
        print(f"  [Zyra Idle]       -> {fn}")

    # 2. Walk (8 frames @ 12 FPS)
    walk_bobs = [0.0, 2.8, -1.2, -3.8, 0.0, 2.8, -1.2, -3.8]
    walk_leg_l = [24.0, 12.0, -8.0, -22.0, -24.0, -12.0, 8.0, 22.0]
    walk_leg_r = [-24.0, -12.0, 8.0, 22.0, 24.0, 12.0, -8.0, -22.0]
    walk_tilts = [2.5, 1.0, -1.8, -3.5, -2.5, -1.0, 1.8, 3.5]
    walk_scarfs = [4.0, 7.0, 9.0, 5.0, 4.0, 7.0, 9.0, 5.0]

    for i in range(8):
        fn = f"zyra_walk_{i+1:02d}.svg"
        svg = build_zyra_svg(
            frame_name=f"Walk {i+1}/8",
            action="walk",
            frame_idx=i,
            total_frames=8,
            y_bob=walk_bobs[i],
            leg_l_angle=walk_leg_l[i],
            leg_r_angle=walk_leg_r[i],
            cloak_tilt=walk_tilts[i],
            scarf_flutter=walk_scarfs[i],
            blink_state="open",
            arms_pose="walk",
            torso_lean=3.5
        )
        fp = os.path.join(OUTPUT_DIR, fn)
        with open(fp, "w", encoding="utf-8") as f:
            f.write(svg)
        assets_created.append(fp)
        print(f"  [Zyra Walk]       -> {fn}")

    # 3. Push (6 frames @ 12 FPS)
    push_bobs = [0.0, 1.5, 2.8, 2.0, 0.8, 0.0]
    push_leans = [14.0, 16.5, 19.0, 18.0, 15.5, 14.0]
    push_scarfs = [6.0, 9.0, 12.0, 10.0, 7.5, 6.0]

    for i in range(6):
        fn = f"zyra_push_{i+1:02d}.svg"
        svg = build_zyra_svg(
            frame_name=f"Push {i+1}/6",
            action="push",
            frame_idx=i,
            total_frames=6,
            y_bob=push_bobs[i],
            leg_l_angle=18.0,
            leg_r_angle=-24.0,
            cloak_tilt=4.5,
            scarf_flutter=push_scarfs[i],
            blink_state="focused",
            arms_pose="push",
            torso_lean=push_leans[i],
            effort_sweat=(i in (2, 3))
        )
        fp = os.path.join(OUTPUT_DIR, fn)
        with open(fp, "w", encoding="utf-8") as f:
            f.write(svg)
        assets_created.append(fp)
        print(f"  [Zyra Push]       -> {fn}")

    # 4. Celebrate (8 frames @ 12 FPS)
    celeb_bobs = [3.5, 6.0, -10.0, -22.0, -20.0, -8.0, 2.5, 0.0]
    celeb_poses = [
        "idle", "idle", "celebrate_up", "celebrate_up", 
        "celebrate_up", "celebrate_land", "celebrate_land", "idle"
    ]
    celeb_blinks = [
        "open", "open", "joyful", "joyful", 
        "joyful", "joyful", "open", "open"
    ]

    for i in range(8):
        fn = f"zyra_celebrate_{i+1:02d}.svg"
        svg = build_zyra_svg(
            frame_name=f"Celebrate {i+1}/8",
            action="celebrate",
            frame_idx=i,
            total_frames=8,
            y_bob=celeb_bobs[i],
            leg_l_angle=-12.0 if i in (2,3,4) else 0.0,
            leg_r_angle=12.0 if i in (2,3,4) else 0.0,
            cloak_tilt=-3.0 if i in (2,3) else 0.0,
            scarf_flutter=12.0 if i in (2,3,4) else 2.0,
            blink_state=celeb_blinks[i],
            arms_pose=celeb_poses[i],
            sparkle=(i in (3, 4, 5))
        )
        fp = os.path.join(OUTPUT_DIR, fn)
        with open(fp, "w", encoding="utf-8") as f:
            f.write(svg)
        assets_created.append(fp)
        print(f"  [Zyra Celebrate]  -> {fn}")

    # 5. Sleep (4 frames @ bedtime off-ramp, completing Issue #49)
    sleep_bobs = [0.0, 1.2, 2.0, 1.0]
    for i in range(4):
        fn = f"zyra_sleep_{i+1:02d}.svg"
        svg = build_zyra_svg(
            frame_name=f"Sleep {i+1}/4",
            action="sleep",
            frame_idx=i,
            total_frames=4,
            y_bob=sleep_bobs[i],
            leg_l_angle=0.0,
            leg_r_angle=0.0,
            cloak_tilt=0.0,
            scarf_flutter=-2.0,
            blink_state="closed",
            arms_pose="idle"
        )
        fp = os.path.join(OUTPUT_DIR, fn)
        with open(fp, "w", encoding="utf-8") as f:
            f.write(svg)
        assets_created.append(fp)
        print(f"  [Zyra Sleep]      -> {fn}")

    # --------------------------------------------------------------------------
    # B. LIGHT ORB COMPANION FACES (96x96)
    # --------------------------------------------------------------------------
    orb_faces = [
        ("happy", "orb_face_happy.svg", "Light Orb Face - Happy"),
        ("curious", "orb_face_curious.svg", "Light Orb Face - Curious"),
        ("thinking", "orb_face_thinking.svg", "Light Orb Face - Thinking"),
        ("sleepy", "orb_face_sleepy.svg", "Light Orb Face - Sleepy"),
    ]

    for f_type, fn, title in orb_faces:
        svg = build_orb_face_svg(f_type, title)
        fp = os.path.join(OUTPUT_DIR, fn)
        with open(fp, "w", encoding="utf-8") as f:
            f.write(svg)
        assets_created.append(fp)
        print(f"  [Light Orb Face]  -> {fn}")

    # --------------------------------------------------------------------------
    # C. ENVIRONMENT LIMESTONE TILES (160x160)
    # --------------------------------------------------------------------------
    tiles = [
        ("light_01", "tile_light_01.svg"),
        ("light_02", "tile_light_02.svg"),
        ("dark_01", "tile_dark_01.svg"),
        ("dark_02", "tile_dark_02.svg"),
    ]

    for var, fn in tiles:
        svg = build_limestone_floor_tile(var)
        fp = os.path.join(OUTPUT_DIR, fn)
        with open(fp, "w", encoding="utf-8") as f:
            f.write(svg)
        assets_created.append(fp)
        print(f"  [Floor Tile]      -> {fn}")

    # --------------------------------------------------------------------------
    # D. WALL CAPS (160x160)
    # --------------------------------------------------------------------------
    wall_caps = [
        ("top", "wall_cap_top.svg"),
        ("bottom", "wall_cap_bottom.svg"),
        ("corner", "wall_cap_corner.svg"),
        ("moss", "wall_cap_moss.svg"),
    ]

    for var, fn in wall_caps:
        svg = build_wall_cap_svg(var)
        fp = os.path.join(OUTPUT_DIR, fn)
        with open(fp, "w", encoding="utf-8") as f:
            f.write(svg)
        assets_created.append(fp)
        print(f"  [Wall Cap]        -> {fn}")

    # --------------------------------------------------------------------------
    # E. GLOWING ENERGY CONDUIT TRACKS & PORTAL (160x160)
    # --------------------------------------------------------------------------
    conduits = [
        ("straight", "conduit_straight.svg"),
        ("corner", "conduit_corner.svg"),
        ("t_junction", "conduit_t_junction.svg"),
        ("cross", "conduit_cross.svg"),
        ("switch_i", "conduit_switch_i.svg"),
        ("switch_ii", "conduit_switch_ii.svg"),
        ("switch_iii", "conduit_switch_iii.svg"),
        ("portal_archway", "portal_archway_unsealed.svg"),
    ]

    for var, fn in conduits:
        svg = build_conduit_svg(var)
        fp = os.path.join(OUTPUT_DIR, fn)
        with open(fp, "w", encoding="utf-8") as f:
            f.write(svg)
        assets_created.append(fp)
        print(f"  [Energy Conduit]  -> {fn}")

    print(f"\nSuccessfully generated {len(assets_created)} SVG assets.")
    return assets_created


# ==============================================================================
# 7. VALIDATION SUITE: XML INTEGRITY & ATTRIBUTE ASSERTIONS
# ==============================================================================

def validate_all_svgs(asset_paths):
    print("\nRunning Automated SVG Quality & XML Validation Gate...")
    failures = 0

    for path in asset_paths:
        fname = os.path.basename(path)
        try:
            tree = ET.parse(path)
            root = tree.getroot()

            # 1. Assert XML tag is svg with valid SVG namespace
            if root.tag != "{http://www.w3.org/2000/svg}svg" and root.tag != "svg":
                print(f"  [FAIL] {fname}: Root tag is not svg (found {root.tag})")
                failures += 1
                continue

            # 2. Assert raw file contains valid xmlns
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
                if 'xmlns="http://www.w3.org/2000/svg"' not in content:
                    print(f"  [FAIL] {fname}: Missing xmlns attribute in root")
                    failures += 1
                    continue

            # 3. Assert viewBox exists
            viewbox = root.attrib.get("viewBox")
            if not viewbox:
                print(f"  [FAIL] {fname}: Missing viewBox")
                failures += 1
                continue

            # 4. Check dimension sanity
            if "orb_face" in fname:
                expected_vb = "0 0 96 96"
            else:
                expected_vb = "0 0 160 160"

            if viewbox != expected_vb:
                print(f"  [FAIL] {fname}: Expected viewBox '{expected_vb}', got '{viewbox}'")
                failures += 1
                continue

            # 5. File size sanity check (< 15KB per SVG)
            sz = os.path.getsize(path)
            if sz > 15360:
                print(f"  [WARN] {fname}: File size {sz} bytes exceeds 15KB lightweight target")
            elif sz < 200:
                print(f"  [FAIL] {fname}: File size {sz} bytes is suspiciously small")
                failures += 1
                continue

        except Exception as e:
            print(f"  [FAIL] {fname}: XML Parse Exception: {e}")
            failures += 1

    if failures == 0:
        print(f"  [PASS] All {len(asset_paths)} SVGs passed XML validation, viewBox, and size gates flawlessly!\n")
    else:
        print(f"  [FATAL] {failures} SVGs failed validation gate!\n")
        exit(1)


if __name__ == "__main__":
    generated = generate_all_assets()
    validate_all_svgs(generated)
