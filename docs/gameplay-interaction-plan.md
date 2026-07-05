# Gameplay Interaction Plan

## Status

This plan has a second local implementation in `demo-phaser-iso/index.html`. The current prototype keeps code-drawn assets, but the interaction grammar is now state-driven and protagonist-driven: a light orb descends, becomes a small character after the MBTI commit, and then walks to clicked targets across intake, profile, wellness, and social scenes.

## Goal

Make the experience feel like a small isometric inner-world game while preserving the product logic:

```text
player action -> ProfileSignal -> collection coverage -> ProfileOutput -> visual feedback -> next small action
```

The interaction layer should not be a decorative animation sitting on top of a questionnaire. Every meaningful tap, drag, hold, skip, or choice should either:

- create or update a structured signal;
- reveal why one dimension is confident or uncertain;
- unlock a minimal follow-up question;
- route the user into one wellness or social action.

## Product Rules To Preserve

- First-session collection order: `MBTI -> Body -> Ba Zi -> Psychology`.
- First-session target: about 30 seconds.
- Generate a full profile only after at least two information categories are submitted.
- The user can explicitly skip at most two categories.
- Missing Ba Zi is not the same as skipped Ba Zi.
- Psychology comes last and can use 3-5 short Adler-style questions; the first demo pass should show 3 core questions.
- User-facing copy should use `画像`, `倾向`, `参考`, `调理`, `练习`, `照护`, `探索`; avoid absolute diagnosis, treatment, fate, or official assessment language.

## Core Interaction Grammar

Each scene should use the same small state machine:

```text
idle -> focus -> commit -> reveal -> next
```

The main interaction through-line is:

```text
tap target or open ground -> protagonist moves -> arrival feedback -> state mutation/reveal
```

Clicking remains the primary input. The important change is that clicks are embodied as character movement, not direct UI mutation. The protagonist state is stored in the demo as `gameplay.hero` and exposed through `document.body.dataset.heroBorn`, `heroScene`, `heroPosition`, and `heroMoving` for quick checks. The same structured state is mirrored into the DOM as `<script id="gameplay-state" type="application/json">` so browser smoke tests can read it even when custom `window.*` globals are isolated.

| State | Player feeling | Visual behavior | Data behavior |
|---|---|---|---|
| `idle` | The scene is alive and waiting | subtle breathing, drifting lights, large invisible hit areas | no mutation |
| `focus` | The player is inspecting or aiming | object brightens, cursor/drag affordance appears | prepare draft signal |
| `commit` | The player has chosen or submitted | object lands, snaps, rings, or opens | create `ProfileSignal` or explicit skip |
| `reveal` | The system explains what changed | card unfolds, room weather shifts, progress lights update | update coverage/profile preview |
| `next` | The product gently moves forward | path/door/next light opens | route to next stage or result room |

Use larger invisible hit areas than the visible tiny objects. The world can stay visually small while still feeling easy on mobile.

## Scene 1: MBTI Light Descent

### Purpose

Collect the first personality/interaction signal without making the user feel like they are filling a form.

### Interaction

- A small cluster of lights descends toward a landing gate.
- The player taps one light; the light-orb protagonist flies to it, returns to the gate, and becomes the small character.
- Each caught light represents either a known MBTI value or a preference clue.
- If the user knows their type, a small text/input overlay can be opened; otherwise the scene uses quick preference choices.

### Signal Output

```json
{
  "type": "mbti_known | preference_clue",
  "dimension_hint": ["mbti"],
  "confidence": "user_reported | medium"
}
```

### Demo Implementation

- Add 4 catchable lights around the landing gate.
- Tap/catch one light at a time; the protagonist flies to the light, returns to the gate, then increments MBTI progress.
- Show one compact prompt at the bottom: known type, or preference clue.
- After one valid signal, open the path to Body.

### Asset Implications

- `light_orb_cluster` must be a separate sprite, not baked into the sky.
- `landing_gate` should be a separate clickable/landing object.
- Use effect sprites for sparks and trails.

## Scene 2: Body Courtyard

### Proposed Metaphor

Use a small body courtyard / body weather station. Four tiny objects represent common body signals:

- moon pool: sleep;
- warm stove / cool basin: cold-heat tendency;
- rice bowl / digestion table: appetite and digestion;
- small stone bench: fatigue and body heaviness.

This keeps the body scene concrete without becoming clinical.

### Interaction

- The player taps one body object; the protagonist walks to it and commits one body clue.
- A later version can add dragging a small "today's feeling" light toward one object.
- The object reacts: moon ripples, stove brightens, bowl steams, bench sinks slightly.

### Signal Output

```json
{
  "type": "sleep | digestion | temperature_sense | body_state",
  "dimension_hint": ["tcm_body"],
  "confidence": "high | medium | user_reported"
}
```

### Demo Implementation

- Add four body objects in a small isometric courtyard.
- Use tap for the first pass; add drag after tap flow works.
- Commit one selected body signal and unlock Ba Zi.

### Asset Implications

- Keep courtyard plate separate from four body objects.
- Do not include medical labels in images; render labels in Phaser UI.
- Each body object needs a normal and active visual state.

## Scene 3: Ba Zi Time Observatory

### Proposed Metaphor

Use a tiny time observatory: an isometric star clock, a birth-time lantern, and a skip dock.

The scene should feel reflective, not deterministic. It collects time information only when the user wants to provide it.

### Interaction

- The player taps a time action; the protagonist walks to the observatory before committing the birth-time signal, low-confidence signal, or explicit skip.
- A birth-time lantern lights up when enough information is provided.
- If the user is unsure, the lantern becomes soft/blurred and the signal confidence is lowered.
- If the user explicitly skips, the skip dock records a real skip.

### Signal Output

```json
{
  "type": "birth_info",
  "dimension_hint": ["xuanxue_spirit"],
  "confidence": "user_reported | medium | low"
}
```

### Demo Implementation

- Show three actions: provide, uncertain, skip.
- `provide` creates a mock birth signal.
- `uncertain` creates a low-confidence birth signal.
- `skip` updates `skipped_categories` and must count toward the two-skip limit.

### Asset Implications

- `star_clock` should be a separate object sprite.
- `birth_lantern` needs lit, uncertain, and skipped states.
- Do not generate fate symbols that look threatening or absolute.

## Scene 4: Psychology Echo Path

### Proposed Metaphor

Use an echo path / inner bridge with three stepping stones. It represents Adler-style pattern reading:

1. repeated pattern;
2. what the pattern protects;
3. one small alternative action.

The production version can ask 3-5 short questions. The first demo pass should show 3.

### Interaction

- Each stepping stone is tapped by sending the protagonist to that stone, then opening/committing one short prompt.
- The player answers by selecting a small option or typing a short answer.
- Completed stones glow and become evidence sparks that later fly into the result room.

### Signal Output

```json
{
  "type": "repeated_pattern | self_evaluation | relationship_pattern | emotion_state",
  "dimension_hint": ["psychology", "mbti"],
  "confidence": "high | medium"
}
```

### Demo Implementation

- Add 3 stones with sample prompts.
- Use simple options first; typed text can come after.
- After at least one psychology signal, allow the full result if coverage rules are satisfied.

### Asset Implications

- The bridge/path plate can be a background object.
- Stepping stones need independent normal, active, and completed states.
- Evidence sparks should be reusable effect sprites.

## Result Scene: Four-Dimensional Room

### Purpose

Turn `FourDimensionalProfileOutput` into a playable, inspectable result rather than a static report.

### Interaction

- Tap a dimension orb to send the protagonist to that orb, then reveal its card.
- Hold a dimension orb to inspect confidence and evidence sparks.
- Drag two dimension orbs toward the center table to compare how two frameworks read the same signal.
- Tap unresolved dim sockets to jump back into the missing collection scene.

### Output Mapping

| Engine field | Visual mapping |
|---|---|
| `dimension_values[].label` | title on the profile card |
| `dimension_values[].description` | short card summary |
| `confidence` | orb clarity and number of evidence sparks |
| `polarity` | orb aura color/temperature |
| `evidence_signal_ids` | small sparks flying from collected scenes |
| `current_state.label` | room weather, not only a badge |
| `collection.coverage.stages` | lit, dim, skipped, or locked sockets |
| `collection.next_questions` | one minimal follow-up card |

### Current State Visual Treatment

Use room weather as the primary state expression:

- `正`: warmer light, open window, upward dust motes.
- `负`: dimmer room, soft rain/shadow, slower breathing.
- `平`: calm mist, balanced lamp, slow even motion.

The label `正 / 负 / 平` can appear in text, but the room should communicate the state first.

### Demo Implementation

- Replace hardcoded selected-axis behavior with a mock `profileOutput` object.
- Add stage sockets: submitted, skipped, missing, required.
- Add hold-to-inspect on dimension nodes.
- Add a central compare action for two selected dimensions.

### Asset Implications

- Room plate, dimension orbs, state aura/weather, and foreground props must be separate layers.
- Evidence sparks and state aura should be reusable effects.

## Wellness Scene: Four-House Island

### Purpose

Route the result into a gentle action hub. This is `调理 / 练习 / 照护`, not medical treatment.

### Interaction

- Tap a house to send the protagonist to it and focus it.
- The shopkeeper steps out.
- A practice card unfolds.
- The player chooses `try`, `save`, or `not now`.
- The island reacts: path lights, plant grows, water calms, or a small object changes.

### House Mapping

| House | Primary input | Product role |
|---|---|---|
| 中医 | `tcm_body` | sleep, digestion, rhythm, cold/heat reference |
| 哲学 | `psychology` + `xuanxue_spirit` | reframing, reflective question, meaning |
| 冥想 | `current_state` | grounding, breath, state reset |
| 艺术 | `mbti` + psychology | expression, creative task, relationship opening |

### Data Behavior

The current schema can store early wellness choices as `other` signals, but the production app should add a separate `InteractionEvent` or `PracticeAction` contract later:

```json
{
  "type": "practice_selected",
  "source": "wellness_island",
  "house": "tcm | philosophy | meditation | art",
  "profile_dimension": "tcm_body | psychology | xuanxue_spirit | mbti",
  "result": "try | save | dismiss"
}
```

### Demo Implementation

- Make all four houses clickable with large invisible hit areas.
- Add one shopkeeper reveal per house.
- Add one practice card with three actions.
- Route recommended house order from the mock current state.

### Asset Implications

- Island base without houses.
- Four distinct house silhouettes.
- Four shopkeepers as separate sprites.
- Practice card frame as UI texture, no generated text inside.

## Social Scene: Personality Archipelago

### Purpose

Make social exploration feel like browsing living places, not a feed.

### Interaction

- Swipe/drag horizontally across islands.
- When the carousel snaps, the protagonist walks to the docked island.
- The selected island opens a small social prompt: compatibility, conversation opener, shared motif, or difference.
- Optional later: invite/join/compare actions.

### Data Behavior

Social actions should eventually become ongoing preference signals, not first-session required signals.

```json
{
  "type": "relationship_pattern | preference_clue | other",
  "dimension_hint": ["mbti", "psychology"],
  "confidence": "medium"
}
```

### Demo Implementation

- Improve the existing drag carousel with snap-to-island.
- Add selected island state.
- Add docked detail card.
- Add one relationship prompt tied to the selected profile archetype.

### Asset Implications

- Loopable sea plate.
- Separate island bases and house variants.
- Selection ring and dock card should be separate effects/UI.

## Implementation Order After Confirmation

### Pass 1: Interaction Prototype, Code-Drawn

1. Add a single `demoSessionState` with collection stages, mock signals, mock skipped categories, mock profile output, and protagonist state. DONE in the local spike.
2. Add reusable helpers for scene objects: `TinyButton`, `SignalOrb`, `ProgressSocket`, `PracticeCard`, `SelectableIsland`.
3. Upgrade MBTI scene to catch/commit lights. DONE in the local spike.
4. Add Body Courtyard, Ba Zi Time Observatory, and Psychology Echo Path as collection sub-scenes or tabs. DONE as code-drawn demo metaphors.
5. Upgrade Result Room to read from mock `profileOutput`, including room weather and confidence/evidence states. DONE in the local spike.
6. Upgrade Wellness Island with clickable houses and practice card. DONE in the local spike; shopkeeper art still needs generated/illustrated assets.
7. Upgrade Social Islands with snap selection and docked detail card. DONE in the local spike.
8. Expose `window.__gameplayState` and `document.body.dataset.*` for browser verification. DONE via dataset smoke hooks.

### Pass 2: Asset Integration

1. Add an asset manifest with IDs matching `docs/interaction-asset-plan.md`.
2. Replace code-drawn plates first, then interactive objects, then effect sprites.
3. Keep all hit areas in code; do not rely on image alpha for interaction.
4. Add preload progress and fallback shapes for missing assets.

### Pass 3: Domain Integration

1. Move from mock signals to schema-shaped `ProfileSignal` objects.
2. Add a small browser-safe profile fixture for prototype validation.
3. In the TypeScript app, connect Phaser scenes to domain services rather than reading SQLite directly.
4. Add smoke tests for collection order, skip limits, minimum categories, and safe language.

## What The Art Team Can Generate In Parallel

Start with modular assets, not complete UI screenshots:

1. `profile_room_plate`, dimension orbs, and three state weather/aura layers.
2. `wellness_island_base`, four houses, four shopkeepers, practice card frame.
3. `mbti_sky_plate`, `light_orb_cluster`, `landing_gate`, spark particles.
4. `body_courtyard_plate`, moon pool, stove/cool basin, rice bowl, stone bench.
5. `bazi_time_observatory_plate`, star clock, birth lantern states.
6. `psychology_echo_path_plate`, three stepping stones, evidence sparks.
7. `sea_plate_loopable`, personality islands, selection ring.

Use the asset spec template in `docs/interaction-asset-plan.md` for each asset. Generated images should not contain Chinese text, speech bubbles, UI chrome, diagnosis words, or watermarks.

## Remaining Confirmation

Before implementation, confirm these default choices:

- Whether to keep or rename the demo metaphors: `身体庭院`, `时间观星台`, `回声小径`.
- Whether the protagonist should be one generated character sprite or a small sprite sheet with idle/walk/focus frames.
- When to move the no-build spike into the Phaser + TypeScript scaffold.
