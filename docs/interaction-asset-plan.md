# Interaction And Asset Plan

## Purpose

The next phase has two parallel tracks:

1. Game-like interaction improvement.
2. Fine visual asset production, especially AI-generated image assets with sufficiently detailed requirements.

The key principle is that interaction and art assets should be planned together. The Phaser scene should know which objects are interactive, animated, layered, and reusable before assets are generated.

## Track 1: Game-Like Interaction Improvement

The current demo proves the scene map, but most interactions are still simple tab/click state changes. The next step is to make each scene feel like a small playable moment.

### Interaction Goals

| Scene | Current demo | Next interaction target |
|---|---|---|
| Collection / MBTI | Light cluster descends visually | User guides or catches light clusters; each choice changes light color, orbit, or landing path |
| Result room | Click dimension nodes | Drag or tap dimension lights, reveal current state, and see room weather/state shift |
| Wellness island | Static four-house island | Tap houses, meet shopkeepers, choose a practice card, see island objects react |
| Social islands | Drag sea surface | Swipe island carousel, select an island, reveal relationship/social prompt |

### Interaction Patterns To Prototype

- Tap: select a node, house, island, or light.
- Drag/swipe: browse social islands or guide collection lights.
- Hold: charge, meditate, or inspect a profile node.
- Reveal: light beam, card unfold, shopkeeper dialogue, state aura.
- Micro reward: tiny particles, sound cue later, room/island color shift, object bounce.

### Phaser Implementation Notes

- Keep world objects visually small, but use larger invisible hit areas.
- Separate scene state from rendering state.
- Use lightweight state machines per scene:

```text
idle -> focus -> reveal -> resolve
```

- Reuse scene entities:

```text
LightOrb
ProfileNode
TinyHouse
Shopkeeper
PracticeCard
PersonalityIsland
SeaCarousel
```

- Avoid building the full product flow before the interaction grammar is validated. Prototype one strong interaction per scene first.

## Track 2: Fine AI Asset Requirements

The current Phaser spike uses code-drawn shapes. This is useful for layout, but it will not reach the desired Love Lights-level polish. The next visual jump should come from generated or illustrated assets.

Do not generate final art from vague prompts like "make it detailed" or "Love Lights style". Each asset request should specify camera, object scale, layer boundaries, transparent/background needs, output size, and how Phaser will use it.

## Asset Production Rules

- Generate assets for the small-world camera, not big mobile UI cards.
- Prefer modular scene assets over one giant screenshot when objects need interaction.
- Use transparent PNG/WebP for interactive objects.
- Use separate background plates when the whole scene is non-interactive.
- Do not include Chinese text inside generated images; render text in Phaser/UI.
- Keep lighting direction consistent inside a scene group.
- Maintain readable silhouettes at mobile size.
- Ask for clean edges, no watermark, no UI chrome, no speech bubbles.

## Required Asset Spec Template

Use this template before each AI generation request:

```yaml
asset_id:
scene:
product_role:
interactive: true/false
asset_type: background_plate | object_sprite | character_sprite | effect_sprite | ui_illustration
camera:
  projection: isometric
  angle: small-world / pulled-back
  target_display_size_px:
output:
  file_format: png/webp
  canvas_px:
  transparent_background: true/false
  safe_padding_px:
style:
  mood:
  palette:
  line_quality:
  material_detail:
  lighting:
content:
  required_objects:
  forbidden_objects:
  text_inside_image: false
layers_needed:
  - background
  - midground
  - foreground
animation_use:
  static | breathing | hover | click_reveal | sprite_sheet
phaser_notes:
negative_prompt:
```

## First Asset Batch

### 1. MBTI Light Descent

Purpose: collection scene for personality signal entry.

Suggested assets:

- `mbti_sky_plate`: soft night-sky / inner-space background plate.
- `light_orb_cluster`: transparent light cluster sprite.
- `landing_gate`: small isometric landing platform.
- `spark_particles`: small reusable transparent particles.

Interaction need:

- User can tap or guide light clusters.
- Light cluster must remain readable at small size.

### 2. Profile Room

Purpose: four-dimensional result and current state.

Suggested assets:

- `profile_room_plate`: small isometric room background.
- `profile_room_foreground_props`: optional foreground prop layer.
- `dimension_orb_body`, `dimension_orb_mind`, `dimension_orb_spirit`, `dimension_orb_mbti`.
- `state_aura_positive`, `state_aura_negative`, `state_aura_neutral`.

Interaction need:

- Dimension orbs remain separate Phaser objects.
- State aura can be swapped without regenerating the room.

### 3. Wellness Island

Purpose: adjustment hub.

Suggested assets:

- `wellness_island_base`: island base without houses.
- `house_tcm`, `house_philosophy`, `house_meditation`, `house_art`.
- `keeper_tcm`, `keeper_philosophy`, `keeper_meditation`, `keeper_art`.
- `practice_card_frame`: UI illustration or card texture.

Interaction need:

- Each house is clickable.
- Each shopkeeper can appear or bounce independently.
- Keep houses distinct by silhouette, not only color.

### 4. Personality Islands

Purpose: social module.

Suggested assets:

- `sea_plate_loopable`: sea background.
- `personality_island_base_a/b/c`: reusable island bases.
- `personality_house_variants`: small house variants.
- `island_selection_ring`: transparent selection effect.

Interaction need:

- Islands move horizontally in a carousel.
- Selected island expands into a docked detail card.

## Prompt Structure

When generating an asset, write prompts in this shape:

```text
Create a small isometric game asset for [scene/product role].
It will be displayed at approximately [display size] inside a 390x844 mobile Phaser scene.
Camera is pulled back; objects should feel tiny, detailed, and readable.
Required elements: [...]
Style: [...]
Output: [transparent PNG / background plate], [pixel size], no text, no watermark, clean edges.
Forbidden: [...]
```

Do not generate a full final UI screenshot unless the asset is explicitly a non-interactive background plate.

## Suggested Build Order

1. Improve current code-drawn interactions for all four scenes.
2. Write exact asset specs for `ProfileRoomScene` and `WellnessIslandScene`.
3. Generate or illustrate the first modular asset batch.
4. Replace code-drawn props with imported assets.
5. Add sprite/particle polish and sound later.

## Open Questions

- Body collection scene metaphor.
- Ba Zi collection scene metaphor.
- Q&A collection scene metaphor.
- Exact shopkeeper character direction.
- Whether assets should be generated as flat transparent PNGs, layered PSD-like exports, or sprite sheets.
