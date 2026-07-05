# Asset Generation Specs V1

## Purpose

This document turns the v2 Phaser spike into concrete AI image-generation requests. It is written for the art / AI asset track, not for final product copy.

The current playable prototype is:

```text
demo-phaser-iso/index.html
design viewport: 390x844
render backing: 1560x3376
world scale target: small / pulled-back isometric
interaction grammar: tap target -> protagonist moves -> arrival feedback -> state/reveal
```

The goal is to get closer to the small, delicate, illustrated feeling of the Love Lights reference while keeping the assets original to this project. Do not prompt "copy Love Lights style". Use these concrete traits instead:

- small isometric world
- pulled-back camera
- clean vector-like illustration
- soft hand-painted detail
- readable silhouettes at mobile size
- quiet inner-world mood
- modular transparent sprites for interactive objects

## Global Art Contract

Use this shared contract for every generated asset in this batch.

```yaml
global_style:
  projection: isometric, pulled-back, small-world
  camera: fixed three-quarter isometric, no perspective distortion
  line_quality: clean vector-like edges, slightly organic, not pixel art
  detail_level: delicate but readable when displayed at 24-180 px
  lighting: soft upper-left key light, subtle warm rim light, no hard realism
  material: illustrated paper / soft gouache / vector hybrid
  palette_base:
    background: deep plum night, muted indigo, soft ink blue
    warm: cream, peach, muted coral
    cool: pale blue, mint green, soft lavender
    accent: four dimension colors from the prototype
  text_inside_image: false
  forbidden:
    - Chinese or English text
    - UI chrome, buttons, cards, speech bubbles
    - watermarks, logos, signatures
    - medical symbols such as red crosses, hospital icons, syringes
    - fortune-telling fatalism symbols that feel threatening
    - oversized character close-ups
    - cropped objects or dark unreadable silhouettes
```

## Output Rules

- Use transparent PNG or WebP for interactive sprites.
- Use full rectangular PNG/WebP only for background plates.
- Leave safe padding around transparent sprites so glow and shadows are not clipped.
- Generate at 3x-4x the display size, then downsample in the asset pipeline.
- Do not bake labels into images. Phaser will render all text.
- Keep all interaction hit areas in code; do not rely on transparent alpha.

## Batch Priority

| Priority | Asset group | Why first |
|---|---|---|
| P0 | Protagonist orb / child / shadow | The through-line makes the demo feel like a game. |
| P0 | MBTI landing gate and light effects | First 5 seconds establish the metaphor. |
| P1 | Profile room plate and dimension orbs | This is the product proof: four-dimensional output. |
| P1 | Wellness island base and four houses | This is the post-result action hub. |
| P2 | Personality islands and sea plate | Important, but can reuse more shapes initially. |
| P2 | Body / Ba Zi / psychology collection objects | Useful after the core loop feels polished. |

## P0: Protagonist

### `protagonist_orb`

```yaml
asset_id: protagonist_orb
scene: shared / MBTI light descent
product_role: pre-birth controllable light that becomes the protagonist
interactive: true
asset_type: character_sprite
camera:
  projection: isometric
  angle: pulled-back small-world
  target_display_size_px: 34x34
output:
  file_format: png
  canvas_px: 256x256
  transparent_background: true
  safe_padding_px: 48
style:
  mood: gentle arrival, curious, alive
  palette: cream core, pale blue aura, very soft pink secondary aura
  line_quality: clean glow edge, no jagged pixels
  material_detail: layered translucent light, tiny inner spark
  lighting: self-lit, soft halo, no harsh bloom
content:
  required_objects:
    - one small luminous orb
    - subtle elliptical contact glow below it
    - 2-4 tiny companion spark dots orbiting close to the orb
  forbidden_objects:
    - face, hands, wings, text, symbol, zodiac glyph
  text_inside_image: false
layers_needed:
  - transparent sprite
animation_use: breathing / hover
phaser_notes: Anchor at center. Display around 34 px wide before birth. Tween y by 3-5 px for idle.
negative_prompt: text, logo, watermark, photorealistic lens flare, giant starburst, cropped glow
```

Prompt:

```text
Create a tiny isometric game character sprite: a luminous orb before it becomes a character. It will be displayed at about 34x34 px inside a 390x844 mobile Phaser scene. Camera is pulled back; the orb should feel tiny, delicate, and readable. Required: cream glowing core, pale blue soft aura, faint pink secondary aura, 2-4 tiny orbiting sparks, small contact glow below. Style is clean vector-like illustrated, soft gouache texture, original inner-world fantasy. Output transparent PNG, 256x256, safe padding, no text, no watermark, no UI, no face, no wings, no zodiac symbols.
```

### `protagonist_child_idle`

```yaml
asset_id: protagonist_child_idle
scene: shared
product_role: main character after the light descends
interactive: true
asset_type: character_sprite
camera:
  projection: isometric
  angle: 3/4 front, tiny mobile game character
  target_display_size_px: 34x52
output:
  file_format: png
  canvas_px: 256x256
  transparent_background: true
  safe_padding_px: 48
style:
  mood: gentle, curious, non-clinical, inner-world traveler
  palette: deep plum hair/cloak, muted rose body, cream face, small blue-pink chest light
  line_quality: simple readable silhouette, delicate edge highlights
  material_detail: soft cloth, tiny glowing chest mark, no busy costume
  lighting: upper-left soft light with subtle under-shadow
content:
  required_objects:
    - small childlike protagonist
    - rounded head and simple hair/hood silhouette
    - compact body suitable for isometric walking
    - one tiny chest glow that can inherit scene accent color later
  forbidden_objects:
    - realistic face, adult body proportions, weapons, medical outfit, text
  text_inside_image: false
layers_needed:
  - transparent sprite
animation_use: idle breathing
phaser_notes: Anchor near feet center. Keep facial detail minimal; eyes can be two tiny dark dots only.
negative_prompt: anime close-up, large eyes, detailed portrait, weapon, doctor, nurse, text, logo, watermark
```

Prompt:

```text
Create a tiny isometric mobile game protagonist sprite after a light has become a small person. It will display at about 34x52 px inside a 390x844 Phaser scene, so the silhouette must be readable when very small. The character is gentle and curious, childlike but not childish, with deep plum hair or hood, muted rose clothing, cream face, and a tiny blue-pink glowing chest mark. Use clean vector-like illustrated edges with soft hand-painted texture. Output transparent PNG, 256x256, centered with feet near lower center, no text, no watermark, no UI, no weapons, no medical clothing, no oversized portrait face.
```

### `protagonist_child_walk_sheet`

```yaml
asset_id: protagonist_child_walk_sheet
scene: shared
product_role: optional walk cycle for click-to-move
interactive: true
asset_type: character_sprite
camera:
  projection: isometric
  angle: side-biased 3/4 walk, usable mirrored left/right
  target_display_size_px: each frame 34x52
output:
  file_format: png
  canvas_px: 1024x256
  transparent_background: true
  safe_padding_px: 32 per frame
style:
  mood: quiet walking, soft bounce
  palette: same as protagonist_child_idle
  line_quality: consistent frame-to-frame silhouette
  material_detail: minimal, no fluttering noise
  lighting: consistent upper-left
content:
  required_objects:
    - 4 equally spaced frames in a horizontal sprite sheet
    - same character proportions as idle
    - clear foot contact shifts
    - no background
  forbidden_objects:
    - frame numbers, grid lines, text, shadows baked too wide
  text_inside_image: false
layers_needed:
  - transparent sprite sheet
animation_use: sprite_sheet
phaser_notes: 4 frames, frame size 256x256. Phaser can mirror horizontally for left movement.
negative_prompt: inconsistent character, different costume per frame, text, frame labels, cropped limbs
```

Prompt:

```text
Create a 4-frame horizontal sprite sheet for the tiny isometric protagonist walking. Canvas 1024x256, transparent background, each frame exactly 256x256. The character matches the idle sprite: deep plum hair or hood, muted rose clothing, cream face, tiny blue-pink chest glow. Show a subtle walk cycle with readable foot contact changes, suitable to display each frame at about 34x52 px. Keep proportions consistent across frames. No background, no text, no frame labels, no grid lines, no watermark.
```

## P0: MBTI Light Descent

### `mbti_sky_plate`

```yaml
asset_id: mbti_sky_plate
scene: MbtiLightDescentScene
product_role: background plate for first arrival scene
interactive: false
asset_type: background_plate
camera:
  projection: isometric world implied, not a flat space wallpaper
  angle: pulled-back, vertical mobile composition
  target_display_size_px: 390x390 playable upper-middle area
output:
  file_format: png
  canvas_px: 1560x1560
  transparent_background: false
  safe_padding_px: 0
style:
  mood: quiet night, inner-space, soft descent
  palette: deep plum, ink blue, muted lavender, small cream stars
  line_quality: soft illustrated plate, no hard grid
  material_detail: subtle mist, faint constellation lines, tiny dust motes
  lighting: central soft glow near landing area
content:
  required_objects:
    - abstract inner-sky field
    - faint constellation arcs
    - empty central landing area reserved for gate sprite
    - darker lower area so the protagonist can read clearly
  forbidden_objects:
    - UI cards, text, planets with zodiac labels, realistic galaxy photo
  text_inside_image: false
layers_needed:
  - background
animation_use: static / slow parallax
phaser_notes: Place behind MBTI scene objects. Do not include gate or clickable lights.
negative_prompt: photorealistic galaxy, text, UI, horoscope wheel, tarot, crowded stars, high contrast noise
```

Prompt:

```text
Create a vertical square background plate for a tiny isometric inner-world MBTI light descent scene. It will sit in the upper-middle of a 390x844 mobile Phaser screen and be rendered from a 1560x1560 source. Mood is quiet night and inner-space, with deep plum, ink blue, muted lavender, faint constellation arcs, tiny cream dust motes, and a soft central landing glow. Leave the center readable and mostly empty for a separate landing gate sprite. No UI, no text, no zodiac labels, no tarot, no photorealistic galaxy. Output full rectangular PNG, 1560x1560.
```

### `landing_gate`

```yaml
asset_id: landing_gate
scene: MbtiLightDescentScene
product_role: target where the light returns and becomes protagonist
interactive: true
asset_type: object_sprite
camera:
  projection: isometric
  angle: small platform, top visible
  target_display_size_px: 90x58
output:
  file_format: png
  canvas_px: 512x384
  transparent_background: true
  safe_padding_px: 64
style:
  mood: safe arrival, ceremonial but simple
  palette: muted violet stone, pale blue inner glow, cream edge highlights
  line_quality: clean thin outline, soft bevels
  material_detail: stone / paper-cut platform, faint inset light
  lighting: inner blue glow, upper-left key light
content:
  required_objects:
    - small isometric diamond platform
    - subtle portal line or landing mark in the center
    - no doors or large architecture
  forbidden_objects:
    - text, runes, zodiac symbols, religious symbols, UI labels
  text_inside_image: false
layers_needed:
  - transparent sprite
animation_use: click_reveal / glow pulse
phaser_notes: Hit area should be larger than visible sprite. Anchor center.
negative_prompt: text, rune letters, horoscope signs, giant portal, stone arch, watermark
```

Prompt:

```text
Create a small isometric landing gate sprite for a mobile Phaser game. It is a tiny diamond-shaped platform where a light orb lands and becomes a character. Display size about 90x58 px. Required: muted violet stone or paper-cut platform, pale blue inner glow, cream edge highlights, simple central landing mark. It should feel safe and ceremonial but not religious or mystical-fatalistic. Output transparent PNG, 512x384, with safe padding. No text, no runes, no zodiac signs, no UI, no watermark.
```

## P1: Profile Room

### `profile_room_plate`

```yaml
asset_id: profile_room_plate
scene: ProfileRoomScene
product_role: four-dimensional result room background, without dimension orbs
interactive: false
asset_type: background_plate
camera:
  projection: isometric
  angle: small room, two walls and floor visible
  target_display_size_px: 300x270
output:
  file_format: png
  canvas_px: 1200x1080
  transparent_background: true
  safe_padding_px: 96
style:
  mood: inner room, reflective, warm but not clinical
  palette: plum walls, muted rose floor, cream details, soft blue lamp glow
  line_quality: delicate illustrated geometry, clean edges
  material_detail: tiny books, mirror, table, plant, lamp, subtle floor lines
  lighting: warm lamp plus cool ambient glow
content:
  required_objects:
    - isometric room with floor and two walls
    - central empty walking space for protagonist
    - four reserved positions for dimension orbs
    - tiny table / lamp / mirror / shelf props
  forbidden_objects:
    - text, medical charts, diagnosis UI, large character, baked dimension labels
  text_inside_image: false
layers_needed:
  - transparent room plate
animation_use: static
phaser_notes: Dimension orbs, protagonist, beams, and cards remain separate Phaser objects.
negative_prompt: text, dashboard UI, hospital room, giant report card, people, watermark, cropped room
```

Prompt:

```text
Create a small isometric inner-room background plate for a four-dimensional profile result scene. It will display around 300x270 px in a 390x844 mobile Phaser game. The room should have two walls and a floor, plum walls, muted rose floor, cream details, a warm lamp, a tiny mirror/shelf/table/plant, and an empty central walking area. Reserve four small positions for separate dimension orb sprites, but do not include the orbs or labels. Style: clean vector-like illustrated geometry with soft hand-painted detail, reflective and warm, not clinical. Output transparent PNG, 1200x1080, safe padding. No text, no UI cards, no medical charts, no people, no watermark.
```

### Dimension Orb Family

Generate these four assets with the same geometry, changing only accent color and tiny internal motif:

| asset_id | Dimension | Accent | Internal motif |
|---|---|---|---|
| `dimension_orb_body` | 中医身体 | mint green | pulse leaf / body rhythm wave |
| `dimension_orb_mind` | 阿德勒心理 | warm amber | small lamp / path knot |
| `dimension_orb_spirit` | 玄学心灵 | soft pink | timing crescent / reflective star |
| `dimension_orb_mbti` | MBTI | pale blue | mirror facet / dialogue spark |

```yaml
asset_type: object_sprite
target_display_size_px: 34x44
output_canvas_px: 256x256
transparent_background: true
safe_padding_px: 48
animation_use: hover / selected glow
phaser_notes: Use one common anchor center. Selection ring can be drawn in Phaser or generated separately.
negative_prompt: text, letters, MBTI type labels, medical icon, astrology glyph, watermark
```

Prompt:

```text
Create one tiny isometric floating crystal orb for a mobile Phaser profile room. Display size about 34x44 px, source 256x256 transparent PNG. Use the same diamond/gem geometry for all variants. Variant: [dimension name], accent color [color], with a very subtle internal motif [motif]. The object should have a dark tiny core, colored translucent gem body, cream highlight, and soft glow. No text, no labels, no MBTI letters, no medical symbols, no astrology glyphs, no watermark.
```

## P1: Wellness Island

### `wellness_island_base`

```yaml
asset_id: wellness_island_base
scene: WellnessIslandScene
product_role: island base without houses or shopkeepers
interactive: false
asset_type: background_plate
camera:
  projection: isometric
  angle: pulled-back island, top visible
  target_display_size_px: 300x230
output:
  file_format: png
  canvas_px: 1200x920
  transparent_background: true
  safe_padding_px: 96
style:
  mood: gentle action hub, restorative, quiet island
  palette: muted green land, dark teal water edge, cream path, plum shadows
  line_quality: clean island silhouette, soft texture
  material_detail: four empty house pads, tiny path branches, plants, stones
  lighting: same upper-left light as profile room
content:
  required_objects:
    - one small isometric island
    - four empty pads for separate houses
    - path connecting house pads
    - clear landing/walking space near each pad
  forbidden_objects:
    - houses, shopkeepers, text, UI, hospital symbols
  text_inside_image: false
layers_needed:
  - transparent island base
animation_use: static / subtle water edge later
phaser_notes: Houses and keepers are separate sprites. The protagonist stands in front of each house.
negative_prompt: text, full UI, buildings baked in, giant trees covering pads, hospital, watermark
```

Prompt:

```text
Create a small isometric island base for a wellness/action hub in a mobile Phaser game. It will display about 300x230 px. The island has muted green land, dark teal water edge, cream walking paths, plum shadows, tiny plants and stones, and four empty house pads connected by paths. Do not include houses or characters; they will be separate sprites. Keep clear landing space in front of each pad for a tiny protagonist. Output transparent PNG, 1200x920, safe padding. No text, no UI, no hospital symbols, no watermark.
```

### Four House Sprites

Generate each house as a separate transparent sprite with the same footprint and lighting.

| asset_id | Role | Silhouette | Accent |
|---|---|---|---|
| `house_tcm` | 中医 | herb apothecary hut, small roof vent, plant shelf | mint green |
| `house_philosophy` | 哲学 | tiny study / observatory hut, book-window shape | warm amber |
| `house_meditation` | 冥想 | quiet round-roof pavilion, soft curtain doorway | pale blue |
| `house_art` | 艺术 | small atelier, angled roof, color panes | soft pink |

```yaml
asset_type: object_sprite
target_display_size_px: 54x58
output_canvas_px: 384x384
transparent_background: true
safe_padding_px: 56
animation_use: hover / selected bounce
phaser_notes: Keep bottom footprint consistent so all houses sit on island pads.
negative_prompt: text, signs, shop names, crosses, religious icons, huge chimney smoke, watermark
```

Prompt:

```text
Create a tiny isometric house sprite for a mobile Phaser wellness island. It will display about 54x58 px, so the silhouette must be distinct and readable. House type: [TCM herb apothecary / philosophy study / meditation pavilion / art atelier]. Use the shared style: clean vector-like illustrated, soft gouache texture, upper-left lighting, muted body color with [accent color] roof or detail. The house must have a consistent small isometric footprint and transparent background. Output 384x384 PNG with safe padding. No text, no shop sign, no medical cross, no religious symbol, no watermark.
```

### Shopkeeper Family

```yaml
asset_ids:
  - keeper_tcm
  - keeper_philosophy
  - keeper_meditation
  - keeper_art
scene: WellnessIslandScene
product_role: small house owner characters revealed on focus
asset_type: character_sprite
target_display_size_px: 24x34
output_canvas_px: 256x256
transparent_background: true
safe_padding_px: 56
style:
  mood: kind guide, not doctor, not therapist authority
  silhouette: tiny, distinct by accessory not text
phaser_notes: Keep them smaller than protagonist or equal size; reveal by stepping out / bounce.
negative_prompt: white coat, stethoscope, clipboard, text, speech bubble, boss-like authority pose
```

Prompt:

```text
Create a tiny isometric shopkeeper character sprite for a wellness island. Display size about 24x34 px, source 256x256 transparent PNG. Character role: [TCM herb keeper / philosophy keeper / meditation keeper / art keeper]. The character is a kind guide, not a doctor or therapist. Use a distinct accessory or silhouette: herb pouch, small book, soft shawl, paint apron. Keep details readable at very small size. No text, no speech bubble, no white coat, no stethoscope, no clipboard, no watermark.
```

## P2: Personality Archipelago

### `sea_plate_loopable`

```yaml
asset_id: sea_plate_loopable
scene: PersonalityArchipelagoScene
product_role: draggable horizontal sea background
interactive: false
asset_type: background_plate
target_display_size_px: 390x320
output:
  file_format: png
  canvas_px: 1560x1280
  transparent_background: false
  safe_padding_px: 0
style:
  mood: calm social exploration
  palette: deep ink blue water, subtle lavender wave lines, faint warm reflections
content:
  required_objects:
    - gentle horizontal wave lines
    - low contrast texture
    - no land or UI
  forbidden_objects:
    - text, map labels, giant waves, boats, realistic ocean photo
phaser_notes: Can be moved behind islands or used as static background for carousel.
```

Prompt:

```text
Create a calm illustrated sea background plate for a tiny personality island carousel in a mobile Phaser game. Display area about 390x320 px, source 1560x1280. Use deep ink blue water, subtle lavender wave lines, faint warm reflections, low contrast texture. It should support small islands moving horizontally on top. No islands, no boats, no text, no map labels, no UI, no photorealistic ocean, no watermark.
```

### Personality Island Set

```yaml
asset_ids:
  - personality_island_base_a
  - personality_island_base_b
  - personality_island_base_c
scene: PersonalityArchipelagoScene
asset_type: object_sprite
target_display_size_px: 82x72
output_canvas_px: 512x512
transparent_background: true
safe_padding_px: 80
style:
  mood: small living place, social archetype, friendly distance
  palette: muted green land, colored roof accents, dark teal underside
content:
  required_objects:
    - tiny island base
    - one small house or dock-compatible empty spot
    - clear front landing area
  forbidden_objects:
    - text labels, MBTI letters, huge people, UI badges
phaser_notes: Phaser will place text labels separately. Keep variants similar in scale.
```

Prompt:

```text
Create a tiny isometric personality island sprite for a mobile Phaser social carousel. Display size about 82x72 px, source 512x512 transparent PNG. The island should feel like a small living place: muted green land, dark teal underside, one tiny house or house pad, a clear front landing/dock area where the protagonist can stand. Make three variants with different island silhouettes but consistent scale. No text, no MBTI letters, no UI badges, no giant character, no watermark.
```

### `island_selection_ring` And `island_dock_marker`

```yaml
asset_ids:
  - island_selection_ring
  - island_dock_marker
scene: PersonalityArchipelagoScene
asset_type: effect_sprite
target_display_size_px: ring 110x70, marker 36x18
output_canvas_px: 512x256
transparent_background: true
style:
  mood: soft selection, not a hard game target
  palette: cream line, faint accent glow
phaser_notes: Ring should sit behind selected island. Dock marker should sit below/front of island.
negative_prompt: text, arrow labels, UI button, harsh neon, watermark
```

Prompt:

```text
Create two transparent effect sprites for a tiny isometric personality island carousel: a soft cream elliptical selection ring with faint accent glow, and a small dock/landing marker where a tiny protagonist can stand. Output transparent PNG, 512x256, with both effects separated and enough padding. Style is delicate illustrated, not harsh neon. No text, no arrows, no UI button, no watermark.
```

## P2: Collection Object Sets

### Body Courtyard Objects

Generate as separate transparent sprites, each target display size around `42x42`, source `256x256`:

| asset_id | Signal | Required visual |
|---|---|---|
| `body_moon_pool` | sleep | tiny moon pool, ripple, pale blue glow |
| `body_warm_cool_basin` | cold/heat | half warm stove, half cool basin, amber/mint contrast |
| `body_rice_bowl` | digestion | small bowl, faint steam, cream/mint highlights |
| `body_stone_bench` | fatigue | small soft stone bench, lowered shadow, pink-lavender tint |

Prompt:

```text
Create a tiny transparent isometric body-courtyard object sprite for a mobile Phaser collection scene. Object: [moon pool / warm-cool basin / rice bowl / stone bench]. Display size about 42x42 px, source 256x256 PNG. It should represent [sleep / cold-heat sense / digestion / fatigue] as a gentle body signal, not a diagnosis. Use clean illustrated edges, soft texture, upper-left lighting. No text, no medical symbols, no organs, no hospital imagery, no watermark.
```

### Ba Zi Observatory Objects

Generate as separate transparent sprites:

| asset_id | Display | Purpose |
|---|---:|---|
| `bazi_star_clock` | 96x96 | main observatory object |
| `bazi_birth_lantern_lit` | 36x48 | confident provided time |
| `bazi_birth_lantern_uncertain` | 36x48 | low-confidence uncertain time |
| `bazi_skip_dock` | 48x28 | explicit skip landing |

Prompt:

```text
Create a tiny isometric time-observatory object for a mobile Phaser collection scene. Asset: [star clock / birth lantern lit / birth lantern uncertain / skip dock]. It is used for reflective timing input only, not deterministic fortune telling. Use muted violet stone, soft pink and cream light, clean vector-like illustrated edges. No text, no astrology glyphs, no ominous symbols, no tarot cards, no watermark. Transparent PNG, source size [512x512 for star clock or 256x256 for lantern/dock].
```

### Psychology Echo Path Objects

Generate as separate transparent sprites:

| asset_id | Display | Purpose |
|---|---:|---|
| `psychology_echo_path_plate` | 220x140 | small path / bridge plate |
| `psychology_stepping_stone_a` | 48x32 | repeated pattern |
| `psychology_stepping_stone_b` | 48x32 | what it protects |
| `psychology_stepping_stone_c` | 48x32 | small experiment |
| `evidence_spark` | 18x18 | reusable signal spark |

Prompt:

```text
Create a tiny isometric echo-path object for a mobile Phaser psychology collection scene. Asset: [path plate / stepping stone / evidence spark]. The mood is reflective and gentle, representing a small question or self-observation, not therapy diagnosis. Use muted violet path material, warm amber highlights, clean illustrated edges, soft shadow. No text, no brain icons, no medical or therapy symbols, no speech bubbles, no watermark. Transparent PNG, source size [as specified].
```

## Acceptance Checklist

Before importing any generated asset into Phaser:

- The asset contains no text, watermark, logo, UI chrome, or unwanted symbols.
- The asset still reads when downscaled to its target display size.
- Transparent sprites have enough safe padding for glow/shadow.
- Interactive objects are separate files, not baked into background plates.
- House and island silhouettes are distinguishable without labels.
- The protagonist is readable in front of all scene backgrounds.
- All assets use the same camera angle and upper-left lighting.
- The files can be named exactly by `asset_id`.

## Suggested File Layout

```text
public/assets/v1/
  protagonist/
    protagonist_orb.png
    protagonist_child_idle.png
    protagonist_child_walk_sheet.png
  mbti/
    mbti_sky_plate.png
    landing_gate.png
  profile/
    profile_room_plate.png
    dimension_orb_body.png
    dimension_orb_mind.png
    dimension_orb_spirit.png
    dimension_orb_mbti.png
  wellness/
    wellness_island_base.png
    house_tcm.png
    house_philosophy.png
    house_meditation.png
    house_art.png
    keeper_tcm.png
    keeper_philosophy.png
    keeper_meditation.png
    keeper_art.png
  social/
    sea_plate_loopable.png
    personality_island_base_a.png
    personality_island_base_b.png
    personality_island_base_c.png
    island_selection_ring.png
    island_dock_marker.png
  collection/
    body_moon_pool.png
    body_warm_cool_basin.png
    body_rice_bowl.png
    body_stone_bench.png
    bazi_star_clock.png
    bazi_birth_lantern_lit.png
    bazi_birth_lantern_uncertain.png
    bazi_skip_dock.png
    psychology_echo_path_plate.png
    psychology_stepping_stone_a.png
    psychology_stepping_stone_b.png
    psychology_stepping_stone_c.png
    evidence_spark.png
```
