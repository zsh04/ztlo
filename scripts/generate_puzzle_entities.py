#!/usr/bin/env python3
"""
Project ZTLO: Master Interactive Puzzle Entity Sprite Generator (Issue #53)
Generates production-ready, standalone, valid XML SVG assets for Shrines 00–06:
- StoneBlock (dormant & active rune cube)
- IceBlock (sapphire cube & sliding motion wake)
- Lotus PressurePlate (inlaid bronze/emerald dais & sunken active circuit)
- Optics: Sun Emitter Pedestal (4 orientations), Prism Mirror (4 angles), Solar Receptor (dormant & active)
- Logic Gate: Diamond Circuit Nexus (dormant & satisfied)
- Sprout NPC: 8 anxious frames, 8 co-breathing frames (0.125 Hz), 6 serene joy frames

Conforms strictly to:
- Studio Ghibli / Monument Valley storybook art direction
- Retina @2x resolution (160x160 viewBox)
- Lightweight budget: <= 8KB per file
- Standalone, valid XML with proper xmlns attributes
"""

import os
import math
import xml.etree.ElementTree as ET

OUTPUT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "public", "assets", "svg")
)
os.makedirs(OUTPUT_DIR, exist_ok=True)


# ==============================================================================
# 1. STONE BLOCK GENERATOR (160x160)
# ==============================================================================

def build_stone_block_svg(active: bool) -> str:
    """
    Carved limestone rune cube with soft rounded edges, carved geometric petroglyphs,
    and glowing cyan/amber glyph state when energized.
    """
    if active:
        defs = """
    <linearGradient id="sbBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E2E8F0" />
      <stop offset="40%" stop-color="#CBD5E1" />
      <stop offset="100%" stop-color="#94A3B8" />
    </linearGradient>
    <linearGradient id="sbBevelTop" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#E2E8F0" stop-opacity="0.2" />
    </linearGradient>
    <radialGradient id="sbGlowAura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FEF08A" stop-opacity="0.6" />
      <stop offset="40%" stop-color="#F59E0B" stop-opacity="0.35" />
      <stop offset="75%" stop-color="#F97316" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#EA580C" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="sbRuneGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FEF08A" />
      <stop offset="30%" stop-color="#FBBF24" />
      <stop offset="70%" stop-color="#F97316" />
      <stop offset="100%" stop-color="#EA580C" />
    </linearGradient>
    <linearGradient id="sbCyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E0F2FE" />
      <stop offset="50%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>"""
        
        aura_markup = """
    <!-- Luminous Energy Halo & Pulse Ring -->
    <circle cx="80" cy="80" r="54" fill="url(#sbGlowAura)" />
    <circle cx="80" cy="80" r="46" stroke="#F97316" stroke-width="2.5" stroke-dasharray="6 4" fill="none" opacity="0.85" />
    <circle cx="80" cy="80" r="42" stroke="#38BDF8" stroke-width="1.5" stroke-dasharray="3 3" fill="none" opacity="0.7" />
    <!-- Radiant Spark Motes -->
    <circle cx="48" cy="48" r="2.2" fill="#FEF08A" />
    <circle cx="112" cy="48" r="2.2" fill="#FEF08A" />
    <circle cx="48" cy="112" r="2.2" fill="#FEF08A" />
    <circle cx="112" cy="112" r="2.2" fill="#FEF08A" />"""

        glyphs_markup = """
    <!-- Energized Petroglyphs: Concentric Sacred Geometry -->
    <circle cx="80" cy="80" r="30" stroke="url(#sbRuneGlow)" stroke-width="4.5" fill="#FEF08A" fill-opacity="0.25" />
    <polygon points="80,56 104,80 80,104 56,80" stroke="url(#sbCyanGlow)" stroke-width="3" fill="#38BDF8" fill-opacity="0.2" />
    <circle cx="80" cy="80" r="14" stroke="url(#sbRuneGlow)" stroke-width="3.5" fill="#F97316" fill-opacity="0.4" />
    <!-- Stellar Cross Inscription -->
    <path d="M 80 64 L 80 96 M 64 80 L 96 80" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" />
    <circle cx="80" cy="80" r="4" fill="#FFFFFF" />
    <!-- Cardinal Petroglyph Notches -->
    <path d="M 80 46 L 80 52 M 80 108 L 80 114 M 46 80 L 52 80 M 108 80 L 114 80" stroke="#F97316" stroke-width="3" stroke-linecap="round" />"""
    else:
        defs = """
    <linearGradient id="sbBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#CBD5E1" />
      <stop offset="50%" stop-color="#94A3B8" />
      <stop offset="100%" stop-color="#64748B" />
    </linearGradient>
    <linearGradient id="sbBevelTop" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#CBD5E1" stop-opacity="0.1" />
    </linearGradient>"""
        aura_markup = ""
        glyphs_markup = """
    <!-- Dormant Carved Petroglyphs (Chiseled Grooves with Depth Shadow) -->
    <circle cx="80" cy="81.5" r="30" stroke="#334155" stroke-width="3.5" fill="none" opacity="0.4" />
    <circle cx="80" cy="80" r="30" stroke="#475569" stroke-width="3.5" fill="#334155" fill-opacity="0.12" />
    <polygon points="80,56 104,80 80,104 56,80" stroke="#475569" stroke-width="2.5" fill="none" />
    <circle cx="80" cy="80" r="14" stroke="#475569" stroke-width="2.5" fill="#334155" fill-opacity="0.2" />
    <!-- Central Cross & Cardinal Marks -->
    <path d="M 80 65 L 80 95 M 65 80 L 95 80" stroke="#475569" stroke-width="2.5" stroke-linecap="round" />
    <circle cx="80" cy="80" r="3.5" fill="#475569" />
    <path d="M 80 47 L 80 52 M 80 108 L 80 113 M 47 80 L 52 80 M 108 80 L 113 80" stroke="#64748B" stroke-width="2.5" stroke-linecap="round" />"""

    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <defs>{defs}
  </defs>

  <!-- Ambient Ground Occlusion Shadow -->
  <ellipse cx="80" cy="142" rx="54" ry="12" fill="#0F172A" fill-opacity="0.18" />
{aura_markup}

  <!-- Main Carved Limestone Cube Body -->
  <rect x="26" y="26" width="108" height="108" rx="20" fill="url(#sbBaseGrad)" stroke="#475569" stroke-width="3" />

  <!-- Tactile Top Bevel Highlight -->
  <path d="M 44 28 L 116 28 Q 132 28 132 44 L 132 50 Q 116 38 80 38 Q 44 38 28 50 L 28 44 Q 28 28 44 28 Z" fill="url(#sbBevelTop)" />

  <!-- Bottom Chamfer Shadow Rim -->
  <path d="M 28 116 L 28 118 Q 28 134 44 134 L 116 134 Q 132 134 132 118 L 132 116 Q 116 126 80 126 Q 44 126 28 116 Z" fill="#334155" fill-opacity="0.3" />

  <!-- Fine Stone Texture Striations -->
  <line x1="38" y1="44" x2="48" y2="44" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity="0.4" />
  <line x1="112" y1="116" x2="122" y2="116" stroke="#334155" stroke-width="1.5" stroke-linecap="round" opacity="0.3" />
  <circle cx="42" cy="114" r="1.5" fill="#475569" opacity="0.4" />
  <circle cx="118" cy="46" r="1.5" fill="#FFFFFF" opacity="0.5" />
{glyphs_markup}
</svg>"""


# ==============================================================================
# 2. ICE BLOCK GENERATOR (160x160)
# ==============================================================================

def build_ice_block_svg(sliding: bool) -> str:
    """
    Crystalline sapphire ice block with crisp refraction facets and white specular glints.
    Sliding variant features streamlined glacial motion streaks, wake particles, and pressure gleam.
    """
    sliding_markup = ""
    if sliding:
        sliding_markup = """
  <!-- Trailing Glacial Motion Streaks & Wake -->
  <g opacity="0.85">
    <path d="M 26 48 Q 12 50 4 56" stroke="#7DD3FC" stroke-width="3" stroke-linecap="round" fill="none" />
    <path d="M 26 78 Q 8 80 2 88" stroke="#BAE6FD" stroke-width="3.5" stroke-linecap="round" fill="none" />
    <path d="M 26 108 Q 10 112 4 120" stroke="#7DD3FC" stroke-width="3" stroke-linecap="round" fill="none" />
    <path d="M 32 134 Q 14 136 0 142" stroke="#38BDF8" stroke-width="3.5" stroke-linecap="round" fill="none" />
  </g>
  <!-- Frost Glitter Particles Kicking off Wake -->
  <circle cx="14" cy="42" r="2.2" fill="#BAE6FD" />
  <circle cx="8" cy="74" r="1.8" fill="#FFFFFF" />
  <circle cx="12" cy="104" r="2" fill="#BAE6FD" />
  <circle cx="6" cy="130" r="1.5" fill="#FFFFFF" />
  <!-- Dynamic Pressure Gleam on Leading Edge -->
  <path d="M 126 34 Q 134 80 126 126" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" opacity="0.9" fill="none" />"""

    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="iceBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E0F2FE" />
      <stop offset="25%" stop-color="#7DD3FC" />
      <stop offset="70%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>
    <linearGradient id="iceFacetMain" x1="0%" y1="0%" x2="100%" y2="80%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.65" />
      <stop offset="50%" stop-color="#BAE6FD" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#0284C7" stop-opacity="0.1" />
    </linearGradient>
    <linearGradient id="icePrismFacet" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.15" />
    </linearGradient>
  </defs>

  <!-- Cool Azure Ground Shadow -->
  <ellipse cx="80" cy="142" rx="54" ry="12" fill="#0284C7" fill-opacity="0.22" />
{sliding_markup}

  <!-- Translucent Sapphire Ice Cube -->
  <rect x="26" y="26" width="108" height="108" rx="20" fill="url(#iceBodyGrad)" fill-opacity="0.92" stroke="#BAE6FD" stroke-width="3" />

  <!-- Internal Diagonal Cleavage Facet (Geometric Refraction Plane) -->
  <polygon points="34,46 96,30 128,78 74,126 34,96" fill="url(#iceFacetMain)" />
  <!-- Upper Prismatic Refraction Shard -->
  <polygon points="56,30 126,30 126,84 84,58" fill="url(#icePrismFacet)" />

  <!-- Crystalline Starlight Lattice Core -->
  <g stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity="0.75">
    <line x1="80" y1="52" x2="80" y2="108" />
    <line x1="52" y1="80" x2="108" y2="80" />
    <line x1="60" y1="60" x2="100" y2="100" />
    <line x1="60" y1="100" x2="100" y2="60" />
  </g>
  <circle cx="80" cy="80" r="16" stroke="#FFFFFF" stroke-width="1.8" stroke-dasharray="3 3" fill="none" opacity="0.6" />
  <circle cx="80" cy="80" r="5" fill="#FFFFFF" opacity="0.9" />

  <!-- Top-Left Crest Specular Highlight -->
  <path d="M 40 30 L 112 30 Q 124 30 124 38 L 124 42 Q 112 34 80 34 Q 46 34 36 42 L 36 38 Q 36 30 40 30 Z" fill="#FFFFFF" fill-opacity="0.75" />

  <!-- Diamond Specular Glints -->
  <g fill="#FFFFFF">
    <!-- Glint 1 (Top Left) -->
    <polygon points="42,32 44,40 52,42 44,44 42,52 40,44 32,42 40,40" />
    <circle cx="42" cy="42" r="2.2" fill="#BAE6FD" />
    <!-- Glint 2 (Top Right) -->
    <polygon points="116,38 117.5,43 122.5,44.5 117.5,46 116,51 114.5,46 109.5,44.5 114.5,43" opacity="0.9" />
    <circle cx="116" cy="44.5" r="1.8" fill="#BAE6FD" />
    <!-- Glint 3 (Center Lower) -->
    <circle cx="94" cy="112" r="2" opacity="0.8" />
  </g>
</svg>"""


# ==============================================================================
# 3. LOTUS PRESSURE PLATE GENERATOR (160x160)
# ==============================================================================

def build_lotus_plate_svg(active: bool) -> str:
    """
    Inlaid bronze and emerald lotus dais with sunken depression state and glowing circuit ring.
    8-petal stylized geometric lotus motif with cardinal conduit coupling ports.
    """
    if active:
        defs = """
    <radialGradient id="lotusEmeraldGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#A7F3D0" stop-opacity="0.65" />
      <stop offset="45%" stop-color="#34D399" stop-opacity="0.4" />
      <stop offset="75%" stop-color="#10B981" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#059669" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="lotusActiveBronze" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#92400E" />
      <stop offset="50%" stop-color="#B45309" />
      <stop offset="100%" stop-color="#78350F" />
    </linearGradient>
    <linearGradient id="petalActiveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#D1FAE5" />
      <stop offset="40%" stop-color="#34D399" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>"""
        
        aura_markup = """
  <!-- Radiant Emerald Circuit Aura -->
  <circle cx="80" cy="80" r="74" fill="url(#lotusEmeraldGlow)" />
  <circle cx="80" cy="80" r="66" stroke="#34D399" stroke-width="4.5" stroke-dasharray="10 4" fill="none" opacity="0.95" />
  <circle cx="80" cy="80" r="60" stroke="#6EE7B7" stroke-width="2" fill="none" opacity="0.8" />
  <!-- Cardinal Conduit Energy Bursts -->
  <path d="M 80 14 L 80 2 M 146 80 L 158 80 M 80 146 L 80 158 M 14 80 L 2 80" stroke="#34D399" stroke-width="4" stroke-linecap="round" />
  <circle cx="80" cy="8" r="3" fill="#A7F3D0" />
  <circle cx="152" cy="80" r="3" fill="#A7F3D0" />
  <circle cx="80" cy="152" r="3" fill="#A7F3D0" />
  <circle cx="8" cy="80" r="3" fill="#A7F3D0" />"""

        depression_markup = """
  <!-- Mechanically Sunken Well Shadow (Depressed Dais Drop) -->
  <circle cx="80" cy="80" r="56" fill="#064E3B" fill-opacity="0.35" />
  <ellipse cx="80" cy="76" rx="54" ry="52" fill="#022C22" fill-opacity="0.25" />"""

        center_jewel = """
  <!-- Glowing Emerald Lotus Center Jewel -->
  <circle cx="80" cy="80" r="16" fill="#10B981" stroke="#ECFDF5" stroke-width="3" />
  <circle cx="80" cy="80" r="8" fill="#FFFFFF" />
  <circle cx="78" cy="78" r="2.5" fill="#ECFDF5" />"""

        petal_fill = 'fill="url(#petalActiveGrad)" stroke="#10B981" stroke-width="2"'
        petal_spine = '<path d="M 80 80 Q 80 50 80 36" stroke="#ECFDF5" stroke-width="2" stroke-linecap="round" fill="none" />'
    else:
        defs = """
    <linearGradient id="lotusDormantBronze" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D97706" />
      <stop offset="50%" stop-color="#B45309" />
      <stop offset="100%" stop-color="#78350F" />
    </linearGradient>
    <linearGradient id="petalDormantGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#A7F3D0" />
      <stop offset="60%" stop-color="#047857" />
      <stop offset="100%" stop-color="#064E3B" />
    </linearGradient>"""
        aura_markup = ""
        depression_markup = ""
        center_jewel = """
  <!-- Inlaid Peach / Amber Lotus Center Dome -->
  <circle cx="80" cy="80" r="16" fill="#FED7AA" stroke="#F97316" stroke-width="3" />
  <circle cx="80" cy="80" r="8" fill="#F97316" />
  <circle cx="78" cy="78" r="2.5" fill="#FFFFFF" opacity="0.8" />"""
        petal_fill = 'fill="url(#petalDormantGrad)" stroke="#78350F" stroke-width="2"'
        petal_spine = '<path d="M 80 80 Q 80 50 80 36" stroke="#92400E" stroke-width="1.8" stroke-linecap="round" fill="none" />'

    # Generate 8 radial petals
    petals_svg = []
    for i in range(8):
        angle = i * 45
        petals_svg.append(f"""
    <g transform="rotate({angle} 80 80)">
      <path d="M 80 80 C 70 66 64 52 80 34 C 96 52 90 66 80 80 Z" {petal_fill} />
      {petal_spine}
    </g>""")

    petals_str = "\n".join(petals_svg)

    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <defs>{defs}
  </defs>

  <!-- Limestone Recess Floor Shadow -->
  <ellipse cx="80" cy="144" rx="54" ry="12" fill="#000000" fill-opacity="0.14" />
{aura_markup}

  <!-- Inlaid Weathered Bronze Outer Ring -->
  <circle cx="80" cy="80" r="68" fill="url(#lotus{'Active' if active else 'Dormant'}Bronze)" stroke="#78350F" stroke-width="3.5" />
  <!-- Stepped Inner Bronze Bezel -->
  <circle cx="80" cy="80" r="58" fill="#1E293B" stroke="#B45309" stroke-width="2.5" />
{depression_markup}

  <!-- 4 Cardinal Bronze Energy Conduit Lugs -->
  <rect x="76" y="8" width="8" height="10" rx="2" fill="#B45309" stroke="#78350F" stroke-width="1.5" />
  <rect x="142" y="76" width="10" height="8" rx="2" fill="#B45309" stroke="#78350F" stroke-width="1.5" />
  <rect x="76" y="142" width="8" height="10" rx="2" fill="#B45309" stroke="#78350F" stroke-width="1.5" />
  <rect x="8" y="76" width="10" height="8" rx="2" fill="#B45309" stroke="#78350F" stroke-width="1.5" />

  <!-- 8-Petal Sacred Lotus Dais -->
  <g>{petals_str}
  </g>
{center_jewel}
</svg>"""


# ==============================================================================
# 4. SUN EMITTER PEDESTAL GENERATOR (160x160)
# ==============================================================================

def build_sun_emitter_svg(direction: str = "east") -> str:
    """
    Ancient brass solar laser pedestal.
    Supports 4 orientations: 'east', 'west', 'north', 'south'.
    Features gear-notched bronze dial, gold optic housing, and directional collimator barrel.
    """
    # Compute nozzle positioning based on direction
    if direction == "east":
        rot = 0
        nx, ny = 142, 80
    elif direction == "south":
        rot = 90
        nx, ny = 80, 142
    elif direction == "west":
        rot = 180
        nx, ny = 18, 80
    else: # north
        rot = 270
        nx, ny = 80, 18

    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="emitterBrass" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FBBF24" />
      <stop offset="40%" stop-color="#D97706" />
      <stop offset="80%" stop-color="#B45309" />
      <stop offset="100%" stop-color="#78350F" />
    </linearGradient>
    <radialGradient id="emitterSolarCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="30%" stop-color="#FEF08A" />
      <stop offset="70%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#EA580C" />
    </radialGradient>
    <radialGradient id="emitterGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FDE047" stop-opacity="0.7" />
      <stop offset="50%" stop-color="#F59E0B" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#B45309" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Ambient Ground Shadow -->
  <ellipse cx="80" cy="142" rx="54" ry="12" fill="#000000" fill-opacity="0.18" />

  <!-- Stepped Circular Brass Pedestal Base -->
  <circle cx="80" cy="80" r="62" fill="url(#emitterBrass)" stroke="#78350F" stroke-width="3.5" />
  
  <!-- Inscribed Solar Ray Dial Teeth (12 Notches) -->
  <g stroke="#78350F" stroke-width="2.5" stroke-linecap="round">
    <line x1="80" y1="20" x2="80" y2="28" />
    <line x1="80" y1="132" x2="80" y2="140" />
    <line x1="20" y1="80" x2="28" y2="80" />
    <line x1="132" y1="80" x2="140" y2="80" />
    <line x1="38" y1="38" x2="44" y2="44" />
    <line x1="116" y1="116" x2="122" y2="122" />
    <line x1="122" y1="38" x2="116" y2="44" />
    <line x1="38" y1="122" x2="44" y2="116" />
  </g>

  <!-- Inner Bronze Bezel & Housing Ring -->
  <circle cx="80" cy="80" r="46" fill="#1E293B" stroke="#B45309" stroke-width="3" />
  <circle cx="80" cy="80" r="34" fill="#78350F" stroke="#F59E0B" stroke-width="2.5" />

  <!-- Directional Collimator Barrel & Nozzle -->
  <g transform="rotate({rot} 80 80)">
    <!-- Heavy Brass Barrel Casing -->
    <path d="M 80 66 L 132 68 Q 142 68 142 80 Q 142 92 132 92 L 80 94 Z" fill="url(#emitterBrass)" stroke="#78350F" stroke-width="2.5" />
    <!-- Collimator Focusing Ribs -->
    <line x1="104" y1="68" x2="104" y2="92" stroke="#78350F" stroke-width="2.5" />
    <line x1="120" y1="68" x2="120" y2="92" stroke="#78350F" stroke-width="2.5" />
    <!-- Optical Lens Aperture Ring -->
    <rect x="138" y="70" width="6" height="20" rx="3" fill="#FDE047" stroke="#92400E" stroke-width="1.5" />
  </g>

  <!-- Luminous Solar Optic Core -->
  <circle cx="80" cy="80" r="26" fill="url(#emitterGlow)" />
  <circle cx="80" cy="80" r="20" fill="url(#emitterSolarCore)" stroke="#FFFFFF" stroke-width="2" />
  <!-- Solar Star Spark Flare -->
  <path d="M 80 64 L 82 78 L 96 80 L 82 82 L 80 96 L 78 82 L 64 80 L 78 78 Z" fill="#FFFFFF" />
  <circle cx="80" cy="80" r="4" fill="#FFFFFF" />

  <!-- Active Beam Flare at Nozzle Tip -->
  <circle cx="{nx}" cy="{ny}" r="5" fill="#FEF08A" stroke="#EA580C" stroke-width="1.5" />
  <circle cx="{nx}" cy="{ny}" r="2" fill="#FFFFFF" />
</svg>"""


# ==============================================================================
# 5. ROTATABLE PRISM MIRROR GENERATOR (160x160)
# ==============================================================================

def build_prism_mirror_svg(angle_deg: int) -> str:
    """
    Rotatable bronze and crystal prism mirror.
    Turntable base with 8 azimuth notches and rotated optical prism slab (0, 45, 90, 135 deg).
    """
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="mirrorBronzeBase" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D97706" />
      <stop offset="40%" stop-color="#B45309" />
      <stop offset="80%" stop-color="#78350F" />
      <stop offset="100%" stop-color="#451A03" />
    </linearGradient>
    <linearGradient id="prismGlass" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="30%" stop-color="#E0F2FE" />
      <stop offset="60%" stop-color="#7DD3FC" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>
    <linearGradient id="mirrorBracket" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="50%" stop-color="#B45309" />
      <stop offset="100%" stop-color="#78350F" />
    </linearGradient>
  </defs>

  <!-- Ambient Ground Shadow -->
  <ellipse cx="80" cy="142" rx="54" ry="12" fill="#000000" fill-opacity="0.18" />

  <!-- Stepped Circular Bronze Turntable Base -->
  <circle cx="80" cy="80" r="60" fill="url(#mirrorBronzeBase)" stroke="#78350F" stroke-width="3.5" />
  
  <!-- 8 Radial Azimuth Alignment Notches (0°, 45°, 90°, 135°, ...) -->
  <g stroke="#FEF08A" stroke-width="2.5" stroke-linecap="round" opacity="0.85">
    <line x1="80" y1="22" x2="80" y2="28" />
    <line x1="80" y1="132" x2="80" y2="138" />
    <line x1="22" y1="80" x2="28" y2="80" />
    <line x1="132" y1="80" x2="138" y2="80" />
    <line x1="39" y1="39" x2="43" y2="43" />
    <line x1="117" y1="117" x2="121" y2="121" />
    <line x1="121" y1="39" x2="117" y2="43" />
    <line x1="39" y1="121" x2="43" y2="117" />
  </g>

  <!-- Turntable Inner Well -->
  <circle cx="80" cy="80" r="46" fill="#1E293B" stroke="#B45309" stroke-width="2.5" />

  <!-- Rotatable Gimbal Assembly (Rotated by angle_deg) -->
  <g transform="rotate({angle_deg} 80 80)">
    <!-- Bronze Gimbal Support Arms -->
    <rect x="74" y="24" width="12" height="112" rx="6" fill="url(#mirrorBracket)" stroke="#78350F" stroke-width="2" />
    <circle cx="80" cy="30" r="4" fill="#FEF08A" />
    <circle cx="80" cy="130" r="4" fill="#FEF08A" />

    <!-- Optical Crystal Prism Mirror Slab -->
    <rect x="42" y="66" width="76" height="28" rx="6" fill="url(#prismGlass)" stroke="#38BDF8" stroke-width="2.5" />

    <!-- Crisp Specular Diagonal Split Reflection -->
    <polygon points="44,68 116,68 84,92 44,92" fill="#FFFFFF" fill-opacity="0.65" />
    <line x1="44" y1="68" x2="116" y2="68" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />

    <!-- Central Pivot Hub & Celestial Alignment Rune -->
    <circle cx="80" cy="80" r="12" fill="#F59E0B" stroke="#78350F" stroke-width="2.5" />
    <circle cx="80" cy="80" r="5" fill="#FFFFFF" />
    <!-- Reticle Line Across Mirror -->
    <line x1="80" y1="68" x2="80" y2="92" stroke="#0284C7" stroke-width="1.8" stroke-dasharray="2 2" />
  </g>
</svg>"""


# ==============================================================================
# 6. SOLAR RECEPTOR CRYSTAL GENERATOR (160x160)
# ==============================================================================

def build_solar_receptor_svg(active: bool) -> str:
    """
    Irradiated solar receptor crystal.
    Dormant: Mystical deep twilight amethyst.
    Active: Dazzling solar gold and prismatic amber with radiant corona aura.
    """
    if active:
        defs = """
    <radialGradient id="recpAura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FEF08A" stop-opacity="0.75" />
      <stop offset="40%" stop-color="#F59E0B" stop-opacity="0.4" />
      <stop offset="75%" stop-color="#F97316" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#EA580C" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="recpCrystalMain" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="30%" stop-color="#FEF08A" />
      <stop offset="70%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#EA580C" />
    </linearGradient>
    <linearGradient id="recpFacetL" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FEF08A" />
      <stop offset="100%" stop-color="#F97316" />
    </linearGradient>
    <linearGradient id="recpFacetR" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#D97706" />
    </linearGradient>"""
        
        aura_markup = """
  <!-- Radiant Solar Coronet Aura & Flare Bursts -->
  <circle cx="80" cy="74" r="58" fill="url(#recpAura)" />
  <circle cx="80" cy="74" r="48" stroke="#F59E0B" stroke-width="2.5" stroke-dasharray="6 4" fill="none" opacity="0.85" />
  <!-- Starlight Glint Flares -->
  <polygon points="80,16 83,28 94,30 83,32 80,44 77,32 66,30 77,28" fill="#FFFFFF" />
  <circle cx="48" cy="60" r="2.5" fill="#FEF08A" />
  <circle cx="112" cy="60" r="2.5" fill="#FEF08A" />
  <circle cx="80" cy="74" r="3" fill="#FFFFFF" />"""

        conduit_markup = """
  <!-- Energized Gold Power Channels into Dais -->
  <path d="M 80 114 L 80 142 M 56 120 L 36 138 M 104 120 L 124 138" stroke="#FEF08A" stroke-width="3" stroke-linecap="round" />"""
    else:
        defs = """
    <linearGradient id="recpCrystalMain" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C084FC" />
      <stop offset="40%" stop-color="#9333EA" />
      <stop offset="80%" stop-color="#6B21A8" />
      <stop offset="100%" stop-color="#3B0764" />
    </linearGradient>
    <linearGradient id="recpFacetL" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#A855F7" />
      <stop offset="100%" stop-color="#581C87" />
    </linearGradient>
    <linearGradient id="recpFacetR" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#E9D5FF" />
      <stop offset="100%" stop-color="#7E22CE" />
    </linearGradient>"""
        aura_markup = ""
        conduit_markup = """
  <!-- Dormant Unlit Channels -->
  <path d="M 80 114 L 80 142 M 56 120 L 36 138 M 104 120 L 124 138" stroke="#475569" stroke-width="2.5" stroke-linecap="round" />"""

    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <defs>{defs}
  </defs>

  <!-- Ambient Ground Shadow -->
  <ellipse cx="80" cy="144" rx="54" ry="12" fill="#000000" fill-opacity="0.18" />
{aura_markup}

  <!-- Heavy Carved Octagonal Stone Pedestal Base -->
  <polygon points="52,106 108,106 134,136 26,136" fill="#334155" stroke="#1E293B" stroke-width="3" />
  <polygon points="58,110 102,110 124,132 36,132" fill="#475569" fill-opacity="0.6" />
{conduit_markup}

  <!-- Bronze Mounting Brackets Gripping Crystal -->
  <path d="M 50 110 Q 56 94 62 90" stroke="#B45309" stroke-width="4.5" stroke-linecap="round" fill="none" />
  <path d="M 110 110 Q 104 94 98 90" stroke="#B45309" stroke-width="4.5" stroke-linecap="round" fill="none" />
  <circle cx="50" cy="110" r="3.5" fill="#F59E0B" />
  <circle cx="110" cy="110" r="3.5" fill="#F59E0B" />

  <!-- Central Faceted Receptor Crystal Obelisk -->
  <!-- Left Wing Facet -->
  <polygon points="56,92 80,72 80,114 50,110" fill="url(#recpFacetL)" stroke="{'#FEF08A' if active else '#A855F7'}" stroke-width="1.5" />
  <!-- Right Wing Facet -->
  <polygon points="104,92 80,72 80,114 110,110" fill="url(#recpFacetR)" stroke="{'#FEF08A' if active else '#A855F7'}" stroke-width="1.5" />
  <!-- Main Tall Center Crystal Spire -->
  <polygon points="80,26 100,68 80,114 60,68" fill="url(#recpCrystalMain)" stroke="{'#FFFFFF' if active else '#C084FC'}" stroke-width="2.5" />
  <!-- Center Ridge Highlight Line -->
  <line x1="80" y1="28" x2="80" y2="112" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" opacity="{'0.95' if active else '0.6'}" />
  <!-- Specular Apex Flare -->
  <circle cx="80" cy="30" r="3" fill="#FFFFFF" />
</svg>"""


# ==============================================================================
# 7. LOGIC GATE NEXUS GENERATOR (160x160)
# ==============================================================================

def build_logic_gate_svg(satisfied: bool) -> str:
    """
    Diamond circuit nexus with satisfied emerald glow.
    Monument Valley elevated diamond dais with 4 input/output circuit channels.
    """
    if satisfied:
        defs = """
    <radialGradient id="nexusEmeraldGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#A7F3D0" stop-opacity="0.8" />
      <stop offset="40%" stop-color="#34D399" stop-opacity="0.45" />
      <stop offset="75%" stop-color="#06B6D4" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#0891B2" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="nexusCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ECFDF5" />
      <stop offset="30%" stop-color="#6EE7B7" />
      <stop offset="70%" stop-color="#06B6D4" />
      <stop offset="100%" stop-color="#0891B2" />
    </linearGradient>"""
        
        aura_markup = """
  <!-- Radiant Satisfied Energy Waves -->
  <circle cx="80" cy="80" r="68" fill="url(#nexusEmeraldGlow)" />
  <polygon points="80,24 136,80 80,136 24,80" stroke="#34D399" stroke-width="3" stroke-dasharray="8 4" fill="none" opacity="0.9" />
  <polygon points="80,34 126,80 80,126 34,80" stroke="#67E8F9" stroke-width="2" fill="none" opacity="0.75" />"""

        conduit_lines = """
  <!-- Flaring Circuit Conduits (Satisfied Current) -->
  <path d="M 80 18 L 80 50 M 142 80 L 110 80 M 80 142 L 80 110 M 18 80 L 50 80" stroke="#34D399" stroke-width="5" stroke-linecap="round" />
  <path d="M 80 18 L 80 50 M 142 80 L 110 80 M 80 142 L 80 110 M 18 80 L 50 80" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
  <circle cx="80" cy="22" r="3.5" fill="#FFFFFF" />
  <circle cx="138" cy="80" r="3.5" fill="#FFFFFF" />
  <circle cx="80" cy="138" r="3.5" fill="#FFFFFF" />
  <circle cx="22" cy="80" r="3.5" fill="#FFFFFF" />"""

        core_markup = """
  <!-- Luminous Resonator Prism -->
  <polygon points="80,50 110,80 80,110 50,80" fill="url(#nexusCoreGrad)" stroke="#FFFFFF" stroke-width="3" />
  <polygon points="80,62 98,80 80,98 62,80" fill="#FFFFFF" />
  <circle cx="80" cy="80" r="4.5" fill="#047857" />"""
    else:
        defs = """
    <linearGradient id="nexusDormantGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#475569" />
      <stop offset="100%" stop-color="#1E293B" />
    </linearGradient>"""
        aura_markup = ""
        conduit_lines = """
  <!-- Unlit Slate Conduits -->
  <path d="M 80 18 L 80 50 M 142 80 L 110 80 M 80 142 L 80 110 M 18 80 L 50 80" stroke="#475569" stroke-width="4" stroke-linecap="round" />
  <circle cx="80" cy="22" r="2.5" fill="#64748B" />
  <circle cx="138" cy="80" r="2.5" fill="#64748B" />
  <circle cx="80" cy="138" r="2.5" fill="#64748B" />
  <circle cx="22" cy="80" r="2.5" fill="#64748B" />"""

        core_markup = """
  <!-- Dormant Central Matrix -->
  <polygon points="80,50 110,80 80,110 50,80" fill="url(#nexusDormantGrad)" stroke="#64748B" stroke-width="2.5" />
  <polygon points="80,64 96,80 80,96 64,80" stroke="#64748B" stroke-width="2" fill="none" />
  <circle cx="80" cy="80" r="3.5" fill="#334155" />"""

    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <defs>{defs}
  </defs>

  <!-- Ambient Ground Shadow -->
  <ellipse cx="80" cy="142" rx="54" ry="12" fill="#000000" fill-opacity="0.18" />
{aura_markup}

  <!-- Elevated Diamond Foundation Dais (Monument Valley 45° Plinth) -->
  <polygon points="80,18 142,80 80,142 18,80" fill="#334155" stroke="#1E293B" stroke-width="3.5" />
  <polygon points="80,24 136,80 80,136 24,80" fill="#1E293B" stroke="#475569" stroke-width="2" />
{conduit_lines}
{core_markup}
</svg>"""


# ==============================================================================
# 8. SPROUT FOREST SPIRIT NPC GENERATOR (160x160)
# ==============================================================================

def build_sprout_npc_svg(cycle: str, frame_idx: int) -> str:
    """
    Forest Spirit NPC character sprite frames with animated co-breathing aura (0.125 Hz).
    Cycles:
    - 'anxious': 8 frames (nervous trembling, anxious sweat, flattened ears)
    - 'breathe': 8 frames (0.125 Hz co-breathing rhythm, 4s inhale expansion, 4s exhale calm)
    - 'joy': 6 frames (joyful bounce, blossoming head flower, serene smile)
    """
    cx = 80.0
    base_cy = 94.0

    if cycle == "anxious":
        # 8-frame nervous jitter & trembling
        tremble_x = [-2.0, 2.0, -1.6, 1.8, -1.8, 1.4, -0.8, 1.0][frame_idx % 8]
        tremble_y = [0.0, 1.0, -0.8, 0.6, -0.6, 0.8, -0.4, 0.2][frame_idx % 8]
        
        # Anxious eyes & brows
        pupil_drift = tremble_x * 0.6
        mouth_markup = f'<path d="M {cx - 6 + tremble_x:.1f} {base_cy + 16:.1f} Q {cx + tremble_x:.1f} {base_cy + 13:.1f} {cx + 6 + tremble_x:.1f} {base_cy + 16:.1f}" stroke="#14532D" stroke-width="2.2" stroke-linecap="round" fill="none" />'
        eyes_markup = f"""
      <!-- Anxious Wide Pupils Wobbling -->
      <ellipse cx="{cx - 14 + tremble_x:.1f}" cy="{base_cy - 4 + tremble_y:.1f}" rx="5" ry="6.5" fill="#14532D" />
      <ellipse cx="{cx + 14 + tremble_x:.1f}" cy="{base_cy - 4 + tremble_y:.1f}" rx="5" ry="6.5" fill="#14532D" />
      <circle cx="{cx - 15 + pupil_drift:.1f}" cy="{base_cy - 6:.1f}" r="1.8" fill="#FFFFFF" />
      <circle cx="{cx + 13 + pupil_drift:.1f}" cy="{base_cy - 6:.1f}" r="1.8" fill="#FFFFFF" />
      <!-- Worried Eyebrows -->
      <path d="M {cx - 19 + tremble_x:.1f} {base_cy - 12:.1f} L {cx - 9 + tremble_x:.1f} {base_cy - 10:.1f}" stroke="#14532D" stroke-width="2" stroke-linecap="round" />
      <path d="M {cx + 19 + tremble_x:.1f} {base_cy - 12:.1f} L {cx + 9 + tremble_x:.1f} {base_cy - 10:.1f}" stroke="#14532D" stroke-width="2" stroke-linecap="round" />
      <!-- Anxious Sweat Drop -->
      <path d="M {cx + 28 + tremble_x:.1f} {base_cy - 14:.1f} Q {cx + 31 + tremble_x:.1f} {base_cy - 18:.1f} {cx + 31 + tremble_x:.1f} {base_cy - 12:.1f} Q {cx + 31 + tremble_x:.1f} {base_cy - 8:.1f} {cx + 28 + tremble_x:.1f} {base_cy - 8:.1f} Q {cx + 25 + tremble_x:.1f} {base_cy - 8:.1f} {cx + 25 + tremble_x:.1f} {base_cy - 12:.1f} Z" fill="#38BDF8" />"""

        # Drooped, trembling leaf ears
        ears_markup = f"""
      <path d="M {cx - 16 + tremble_x:.1f} {base_cy - 34:.1f} C {cx - 36 + tremble_x:.1f} {base_cy - 44:.1f} {cx - 42 + tremble_x:.1f} {base_cy - 26:.1f} {cx - 22 + tremble_x:.1f} {base_cy - 24:.1f} Z" fill="#4ADE80" stroke="#15803D" stroke-width="2" />
      <path d="M {cx + 16 + tremble_x:.1f} {base_cy - 34:.1f} C {cx + 36 + tremble_x:.1f} {base_cy - 44:.1f} {cx + 42 + tremble_x:.1f} {base_cy - 26:.1f} {cx + 22 + tremble_x:.1f} {base_cy - 24:.1f} Z" fill="#4ADE80" stroke="#15803D" stroke-width="2" />"""

        aura_markup = f"""
  <!-- Agitated, Restless Pale Aura -->
  <ellipse cx="{cx + tremble_x:.1f}" cy="{base_cy + 2:.1f}" rx="46" ry="48" fill="#BBF7D0" fill-opacity="0.25" />
  <ellipse cx="{cx + tremble_x:.1f}" cy="{base_cy + 2:.1f}" rx="42" ry="44" stroke="#86EFAC" stroke-width="1.5" stroke-dasharray="4 3" fill="none" opacity="0.6" />"""

        body_transform = f'transform="translate({tremble_x:.1f}, {tremble_y:.1f})"'

    elif cycle == "breathe":
        # 8-frame 0.125 Hz Co-Breathing Loop (Inhale frames 0-3, Exhale frames 4-7)
        scales = [1.00, 1.05, 1.12, 1.18, 1.15, 1.08, 1.02, 0.98]
        aura_radii = [42, 48, 56, 62, 58, 52, 46, 42]
        aura_opacities = [0.25, 0.35, 0.5, 0.6, 0.5, 0.4, 0.3, 0.25]
        
        s = scales[frame_idx % 8]
        ar = aura_radii[frame_idx % 8]
        aop = aura_opacities[frame_idx % 8]

        # Serene closed crescent eyes & soothing smile
        mouth_markup = f'<path d="M {cx - 5:.1f} {base_cy + 13:.1f} Q {cx:.1f} {base_cy + 17:.1f} {cx + 5:.1f} {base_cy + 13:.1f}" stroke="#14532D" stroke-width="2.4" stroke-linecap="round" fill="none" />'
        eyes_markup = f"""
      <!-- Serene Meditative Closed Crescent Eyelashes -->
      <path d="M {cx - 18:.1f} {base_cy - 3:.1f} Q {cx - 13:.1f} {base_cy + 4:.1f} {cx - 8:.1f} {base_cy - 3:.1f}" stroke="#14532D" stroke-width="2.6" stroke-linecap="round" fill="none" />
      <path d="M {cx + 8:.1f} {base_cy - 3:.1f} Q {cx + 13:.1f} {base_cy + 4:.1f} {cx + 18:.1f} {base_cy - 3:.1f}" stroke="#14532D" stroke-width="2.6" stroke-linecap="round" fill="none" />"""

        # Graceful breathing leaf ears swaying upward
        ear_lift = (s - 1.0) * 16
        ears_markup = f"""
      <path d="M {cx - 16:.1f} {base_cy - 34:.1f} C {cx - 32:.1f} {base_cy - 52 - ear_lift:.1f} {cx - 44:.1f} {base_cy - 36 - ear_lift:.1f} {cx - 24:.1f} {base_cy - 24:.1f} Z" fill="#4ADE80" stroke="#15803D" stroke-width="2.2" />
      <path d="M {cx + 16:.1f} {base_cy - 34:.1f} C {cx + 32:.1f} {base_cy - 52 - ear_lift:.1f} {cx + 44:.1f} {base_cy - 36 - ear_lift:.1f} {cx + 24:.1f} {base_cy - 24:.1f} Z" fill="#4ADE80" stroke="#15803D" stroke-width="2.2" />"""

        aura_markup = f"""
  <!-- Soothing 0.125 Hz Co-Breathing Jade Halo Ring -->
  <circle cx="{cx}" cy="{base_cy}" r="{ar}" fill="#34D399" fill-opacity="{aop * 0.4:.2f}" />
  <circle cx="{cx}" cy="{base_cy}" r="{ar - 6}" stroke="#10B981" stroke-width="2.5" fill="none" opacity="{aop:.2f}" />
  <!-- Floating Calming Blossom Spores -->
  <circle cx="{cx - 38:.1f}" cy="{base_cy - 24:.1f}" r="2" fill="#A7F3D0" opacity="{aop:.2f}" />
  <circle cx="{cx + 36:.1f}" cy="{base_cy - 20:.1f}" r="2.2" fill="#A7F3D0" opacity="{aop:.2f}" />
  <circle cx="{cx - 24:.1f}" cy="{base_cy + 32:.1f}" r="1.6" fill="#F472B6" opacity="{aop * 0.8:.2f}" />"""

        body_transform = f'transform="translate({cx}, {base_cy}) scale({s:.3f}) translate(-{cx}, -{base_cy})"'

    else: # joy
        # 6-frame joyful bounce
        bounce_y = [0.0, -5.0, -11.0, -14.0, -8.0, -2.0][frame_idx % 6]
        star_op = [0.4, 0.7, 1.0, 0.9, 0.6, 0.3][frame_idx % 6]

        # Cheerful open smiling mouth with tongue & joyful arc eyes
        mouth_markup = f"""
      <path d="M {cx - 8:.1f} {base_cy + 10:.1f} Q {cx:.1f} {base_cy + 22:.1f} {cx + 8:.1f} {base_cy + 10:.1f} Z" fill="#DC2626" stroke="#991B1B" stroke-width="1.8" />
      <path d="M {cx - 5:.1f} {base_cy + 15:.1f} Q {cx:.1f} {base_cy + 20:.1f} {cx + 5:.1f} {base_cy + 15:.1f}" fill="#FDA4AF" />"""
        eyes_markup = f"""
      <!-- Joyful Arc Eyes (^ _ ^) -->
      <path d="M {cx - 18:.1f} {base_cy - 2:.1f} Q {cx - 13:.1f} {base_cy - 10:.1f} {cx - 8:.1f} {base_cy - 2:.1f}" stroke="#14532D" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M {cx + 8:.1f} {base_cy - 2:.1f} Q {cx + 13:.1f} {base_cy - 10:.1f} {cx + 18:.1f} {base_cy - 2:.1f}" stroke="#14532D" stroke-width="3" stroke-linecap="round" fill="none" />"""

        # Blossomed head flower & perked leaf ears
        ears_markup = f"""
      <path d="M {cx - 16:.1f} {base_cy - 34:.1f} C {cx - 36:.1f} {base_cy - 56:.1f} {cx - 48:.1f} {base_cy - 38:.1f} {cx - 24:.1f} {base_cy - 26:.1f} Z" fill="#4ADE80" stroke="#15803D" stroke-width="2.2" />
      <path d="M {cx + 16:.1f} {base_cy - 34:.1f} C {cx + 36:.1f} {base_cy - 56:.1f} {cx + 48:.1f} {base_cy - 38:.1f} {cx + 24:.1f} {base_cy - 26:.1f} Z" fill="#4ADE80" stroke="#15803D" stroke-width="2.2" />
      <!-- Blossoming Sakura Flower Crown -->
      <circle cx="{cx}" cy="{base_cy - 40:.1f}" r="7" fill="#F472B6" />
      <circle cx="{cx - 6:.1f}" cy="{base_cy - 44:.1f}" r="5.5" fill="#F472B6" />
      <circle cx="{cx + 6:.1f}" cy="{base_cy - 44:.1f}" r="5.5" fill="#F472B6" />
      <circle cx="{cx - 5:.1f}" cy="{base_cy - 36:.1f}" r="5.5" fill="#F472B6" />
      <circle cx="{cx + 5:.1f}" cy="{base_cy - 36:.1f}" r="5.5" fill="#F472B6" />
      <circle cx="{cx}" cy="{base_cy - 40:.1f}" r="4" fill="#FDE047" stroke="#F59E0B" stroke-width="1" />"""

        aura_markup = f"""
  <!-- Sunny Golden Joy Aura & Celebratory Sparkles -->
  <circle cx="{cx}" cy="{base_cy + bounce_y:.1f}" r="52" fill="#FDE047" fill-opacity="{star_op * 0.35:.2f}" />
  <g fill="#FACC15" opacity="{star_op:.2f}">
    <polygon points="{cx - 36:.1f},{base_cy - 28 + bounce_y:.1f} {cx - 34:.1f},{base_cy - 24 + bounce_y:.1f} {cx - 30:.1f},{base_cy - 22 + bounce_y:.1f} {cx - 34:.1f},{base_cy - 20 + bounce_y:.1f} {cx - 36:.1f},{base_cy - 16 + bounce_y:.1f} {cx - 38:.1f},{base_cy - 20 + bounce_y:.1f} {cx - 42:.1f},{base_cy - 22 + bounce_y:.1f} {cx - 38:.1f},{base_cy - 24 + bounce_y:.1f}" />
    <polygon points="{cx + 36:.1f},{base_cy - 32 + bounce_y:.1f} {cx + 38:.1f},{base_cy - 28 + bounce_y:.1f} {cx + 42:.1f},{base_cy - 26 + bounce_y:.1f} {cx + 38:.1f},{base_cy - 24 + bounce_y:.1f} {cx + 36:.1f},{base_cy - 20 + bounce_y:.1f} {cx + 34:.1f},{base_cy - 24 + bounce_y:.1f} {cx + 30:.1f},{base_cy - 26 + bounce_y:.1f} {cx + 34:.1f},{base_cy - 28 + bounce_y:.1f}" />
    <circle cx="{cx - 28:.1f}" cy="{base_cy + 18 + bounce_y:.1f}" r="2" fill="#F472B6" />
    <circle cx="{cx + 30:.1f}" cy="{base_cy + 14 + bounce_y:.1f}" r="2" fill="#F472B6" />
  </g>"""

        body_transform = f'transform="translate(0, {bounce_y:.1f})"'

    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="sproutBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#86EFAC" />
      <stop offset="40%" stop-color="#4ADE80" />
      <stop offset="100%" stop-color="#22C55E" />
    </linearGradient>
    <linearGradient id="sproutBellyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F0FDF4" />
      <stop offset="100%" stop-color="#BBF7D0" />
    </linearGradient>
  </defs>

  <!-- Ambient Ground Shadow -->
  <ellipse cx="80" cy="142" rx="46" ry="10" fill="#000000" fill-opacity="0.14" />
{aura_markup}

  <!-- Main Sprout Body Group -->
  <g {body_transform}>
    <!-- Tiny Stubby Woodland Feet -->
    <ellipse cx="64" cy="{base_cy + 34:.1f}" rx="8" ry="5" fill="#15803D" />
    <ellipse cx="96" cy="{base_cy + 34:.1f}" rx="8" ry="5" fill="#15803D" />

    <!-- Leaf Ears -->{ears_markup}

    <!-- Plump Pear-Shaped Moss Body -->
    <path d="M {cx - 32:.1f} {base_cy + 28:.1f} C {cx - 44:.1f} {base_cy + 22:.1f} {cx - 38:.1f} {base_cy - 16:.1f} {cx - 24:.1f} {base_cy - 30:.1f} C {cx - 14:.1f} {base_cy - 40:.1f} {cx + 14:.1f} {base_cy - 40:.1f} {cx + 24:.1f} {base_cy - 30:.1f} C {cx + 38:.1f} {base_cy - 16:.1f} {cx + 44:.1f} {base_cy + 22:.1f} {cx + 32:.1f} {base_cy + 28:.1f} C {cx + 20:.1f} {base_cy + 36:.1f} {cx - 20:.1f} {base_cy + 36:.1f} {cx - 32:.1f} {base_cy + 28:.1f} Z" fill="url(#sproutBodyGrad)" stroke="#15803D" stroke-width="2.6" />

    <!-- Soft Pastel Cream Underbelly Patch -->
    <ellipse cx="{cx}" cy="{base_cy + 14:.1f}" rx="22" ry="18" fill="url(#sproutBellyGrad)" />
    <!-- Three Subtle Belly Clover Flecks -->
    <circle cx="{cx - 6:.1f}" cy="{base_cy + 12:.1f}" r="1.4" fill="#16A34A" opacity="0.5" />
    <circle cx="{cx + 6:.1f}" cy="{base_cy + 12:.1f}" r="1.4" fill="#16A34A" opacity="0.5" />
    <circle cx="{cx}" cy="{base_cy + 18:.1f}" r="1.4" fill="#16A34A" opacity="0.5" />

    <!-- Rosy Woodland Cheeks -->
    <circle cx="{cx - 22:.1f}" cy="{base_cy + 4:.1f}" r="6.5" fill="#FCA5A5" fill-opacity="0.65" />
    <circle cx="{cx + 22:.1f}" cy="{base_cy + 4:.1f}" r="6.5" fill="#FCA5A5" fill-opacity="0.65" />
{eyes_markup}
{mouth_markup}

    <!-- Tiny Leaf Resting Hands -->
    <ellipse cx="{cx - 26:.1f}" cy="{base_cy + 18:.1f}" rx="5" ry="3.5" fill="#4ADE80" stroke="#15803D" stroke-width="1.5" />
    <ellipse cx="{cx + 26:.1f}" cy="{base_cy + 18:.1f}" rx="5" ry="3.5" fill="#4ADE80" stroke="#15803D" stroke-width="1.5" />
  </g>
</svg>"""


# ==============================================================================
# MAIN GENERATOR PIPELINE & VALIDATION
# ==============================================================================

def generate_interactive_entities():
    print("=========================================================")
    print("  Authoring Shrines 00–06 Interactive Puzzle Entity Sprites")
    print("=========================================================")

    generated_paths = []

    # 1. Stone Blocks
    stone_assets = [
        (False, "stone_block.svg"),
        (True, "stone_block_active.svg"),
    ]
    for active, fn in stone_assets:
        svg = build_stone_block_svg(active)
        path = os.path.join(OUTPUT_DIR, fn)
        with open(path, "w", encoding="utf-8") as f:
            f.write(svg)
        generated_paths.append(path)
        print(f"  [Stone Block]      -> {fn}")

    # 2. Ice Blocks
    ice_assets = [
        (False, "ice_block.svg"),
        (True, "ice_block_sliding.svg"),
    ]
    for sliding, fn in ice_assets:
        svg = build_ice_block_svg(sliding)
        path = os.path.join(OUTPUT_DIR, fn)
        with open(path, "w", encoding="utf-8") as f:
            f.write(svg)
        generated_paths.append(path)
        print(f"  [Ice Block]        -> {fn}")

    # 3. Lotus Pressure Plates
    plate_assets = [
        (False, "plate_lotus_dormant.svg"),
        (True, "plate_lotus_active.svg"),
    ]
    for active, fn in plate_assets:
        svg = build_lotus_plate_svg(active)
        path = os.path.join(OUTPUT_DIR, fn)
        with open(path, "w", encoding="utf-8") as f:
            f.write(svg)
        generated_paths.append(path)
        print(f"  [Lotus Plate]      -> {fn}")

    # 4. Sun Emitter Pedestal (Master + 4 Orientations)
    emitter_assets = [
        ("east", "emitter_sun_pedestal.svg"),
        ("east", "emitter_sun_pedestal_east.svg"),
        ("west", "emitter_sun_pedestal_west.svg"),
        ("north", "emitter_sun_pedestal_north.svg"),
        ("south", "emitter_sun_pedestal_south.svg"),
    ]
    for d, fn in emitter_assets:
        svg = build_sun_emitter_svg(d)
        path = os.path.join(OUTPUT_DIR, fn)
        with open(path, "w", encoding="utf-8") as f:
            f.write(svg)
        generated_paths.append(path)
        print(f"  [Sun Emitter]      -> {fn}")

    # 5. Rotatable Prism Mirrors (4 Angles)
    mirror_assets = [
        (0, "mirror_prism_000.svg"),
        (45, "mirror_prism_045.svg"),
        (90, "mirror_prism_090.svg"),
        (135, "mirror_prism_135.svg"),
    ]
    for ang, fn in mirror_assets:
        svg = build_prism_mirror_svg(ang)
        path = os.path.join(OUTPUT_DIR, fn)
        with open(path, "w", encoding="utf-8") as f:
            f.write(svg)
        generated_paths.append(path)
        print(f"  [Prism Mirror]     -> {fn}")

    # 6. Solar Receptor Crystals
    receptor_assets = [
        (False, "receptor_solar_crystal.svg"),
        (True, "receptor_solar_active.svg"),
    ]
    for active, fn in receptor_assets:
        svg = build_solar_receptor_svg(active)
        path = os.path.join(OUTPUT_DIR, fn)
        with open(path, "w", encoding="utf-8") as f:
            f.write(svg)
        generated_paths.append(path)
        print(f"  [Solar Receptor]   -> {fn}")

    # 7. Logic Gate Nexus
    logic_assets = [
        (False, "logic_gate_nexus.svg"),
        (True, "logic_gate_satisfied.svg"),
    ]
    for sat, fn in logic_assets:
        svg = build_logic_gate_svg(sat)
        path = os.path.join(OUTPUT_DIR, fn)
        with open(path, "w", encoding="utf-8") as f:
            f.write(svg)
        generated_paths.append(path)
        print(f"  [Logic Gate]       -> {fn}")

    # 8. Sprout Forest Spirit NPC Frames
    # Anxious (8 frames)
    for i in range(8):
        fn = f"sprout_anxious_{str(i + 1).padStart(2, '0') if hasattr(str, 'padStart') else f'{i+1:02d}'}.svg"
        svg = build_sprout_npc_svg("anxious", i)
        path = os.path.join(OUTPUT_DIR, fn)
        with open(path, "w", encoding="utf-8") as f:
            f.write(svg)
        generated_paths.append(path)
        print(f"  [Sprout Anxious]   -> {fn}")

    # Breathe (8 frames)
    for i in range(8):
        fn = f"sprout_breathe_{i+1:02d}.svg"
        svg = build_sprout_npc_svg("breathe", i)
        path = os.path.join(OUTPUT_DIR, fn)
        with open(path, "w", encoding="utf-8") as f:
            f.write(svg)
        generated_paths.append(path)
        print(f"  [Sprout Breathe]   -> {fn}")

    # Joy (6 frames)
    for i in range(6):
        fn = f"sprout_joy_{i+1:02d}.svg"
        svg = build_sprout_npc_svg("joy", i)
        path = os.path.join(OUTPUT_DIR, fn)
        with open(path, "w", encoding="utf-8") as f:
            f.write(svg)
        generated_paths.append(path)
        print(f"  [Sprout Joy]       -> {fn}")

    print(f"\nGenerated {len(generated_paths)} interactive entity SVG assets.")
    return generated_paths


def validate_interactive_svgs(asset_paths):
    print("\nValidating SVGs (XML syntax, viewBox, and size budget <= 8KB)...")
    failures = 0
    max_size = 8192  # 8 KB

    for path in asset_paths:
        fname = os.path.basename(path)
        sz = os.path.getsize(path)

        # 1. XML parse
        try:
            tree = ET.parse(path)
            root = tree.getroot()
            if root.tag != "{http://www.w3.org/2000/svg}svg" and root.tag != "svg":
                print(f"  [FAIL] {fname}: Root tag is not svg ({root.tag})")
                failures += 1
                continue

            # Check xmlns
            with open(path, "r", encoding="utf-8") as f:
                raw = f.read()
            if 'xmlns="http://www.w3.org/2000/svg"' not in raw:
                print(f"  [FAIL] {fname}: Missing xmlns attribute")
                failures += 1
                continue

            # Check viewBox
            vb = root.attrib.get("viewBox")
            if vb != "0 0 160 160":
                print(f"  [FAIL] {fname}: Expected viewBox '0 0 160 160', got '{vb}'")
                failures += 1
                continue

            # Check size budget <= 8KB
            if sz > max_size:
                print(f"  [FAIL] {fname}: Size {sz} bytes exceeds 8KB limit ({max_size} bytes)")
                failures += 1
                continue
            elif sz < 300:
                print(f"  [FAIL] {fname}: Suspiciously small ({sz} bytes)")
                failures += 1
                continue

            print(f"  [PASS] {fname:30s} ({sz:4d} bytes <= 8KB)")

        except Exception as e:
            print(f"  [FAIL] {fname}: XML Parse error: {e}")
            failures += 1

    if failures == 0:
        print(f"\n✓ All {len(asset_paths)} interactive entity SVGs PASSED all quality gates flawlessly!")
    else:
        print(f"\nFATAL: {failures} SVGs failed validation!")
        exit(1)


if __name__ == "__main__":
    paths = generate_interactive_entities()
    validate_interactive_svgs(paths)
