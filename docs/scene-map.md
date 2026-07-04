# Product Scene Map

## Purpose

This document captures the current visual scene direction for the Phaser experience. It should guide scene naming, asset planning, and prototype order.

The product should feel like a small isometric inner-world journey rather than a conventional form or dashboard. Each product module maps to a distinct place or scene.

## Current Spike Status

`demo-phaser-iso/index.html` currently implements a no-build mobile Phaser demo with four switchable scenes:

- `采集`: MBTI 光团降世.
- `结果`: four-dimensional room, including selectable dimension nodes and a profile card.
- `调理`: four-house island for TCM, philosophy, meditation, and art.
- `社交`: personality islands on a sea surface with horizontal drag browsing.

The current scale target is deliberately small: `WORLD_SCALE = 0.58`, with a `390x844` mobile design viewport and `4x` backing canvas. Future scene work should preserve this small-world feeling while increasing asset detail.

The next phase is documented in `docs/interaction-asset-plan.md`: improve game-like interactions first, then generate fine assets from detailed scene/object specs.

## Scene Groups

| Product step | Scene group | Current direction | Status |
|---|---|---|---|
| Collection | Per-step intake scenes | Each collection dimension gets its own scene | Partially defined |
| Four-dimensional result and current state | Inner room | Current isometric room scene, showing at least two dimensions plus state | Defined in spike |
| Wellness / adjustment | Island with four houses | One island with TCM, philosophy, meditation, and art houses; each house has a shopkeeper | Defined direction |
| Social | Personality islands | Multiple islands on the sea; user can swipe/drag to browse islands | Defined direction |

## 1. Collection Scenes

Collection should not feel like a questionnaire. Each step should be a short scene that collects one signal and provides one minimal follow-up when needed.

Confirmed collection scenes:

| Collection step | Scene metaphor | Notes |
|---|---|---|
| MBTI | 光团降世 | The user/personality signal appears as a light cluster descending into the world. |
| Body | TBD | Should collect body signals such as sleep, digestion, cold/heat, fatigue, and physical rhythm. |
| Ba Zi / Xuanxue | TBD | Should collect birth-related or reflective timing signals only when user provides them. |
| Q&A | TBD | Should cover grill-me style minimal follow-up questions across weak dimensions. |

Implementation notes:

- Keep each scene short and visually distinct.
- Each scene should output structured signals, not final conclusions.
- The intake engine may ask at most three follow-up questions in the first session.
- Interaction should support text first, then voice/image later through the multimodal input contract.

Suggested Phaser scene names:

```text
MbtiLightDescentScene
BodyIntakeScene
XuanxueIntakeScene
QuestionIntakeScene
```

## 2. Four-Dimensional Result And State

The current `demo-phaser-iso/index.html` room scene is the first validated direction for this group.

Scene requirements:

- Show at least two profile dimensions at once.
- Show current state derived from the four dimensions, such as `正`, `负`, or `平`.
- Preserve the small isometric-world scale inspired by Love Lights.
- Keep user-facing wording in the range of `倾向`, `画像`, `参考`, and `调理方向`.

Current visual metaphor:

- A small inner room.
- Four light nodes around the room.
- A bottom profile card showing the selected dimension.
- A current-state layer can be added as a central ambient state, room lighting, weather, or symbolic object.

Suggested Phaser scene name:

```text
ProfileRoomScene
```

## 3. Wellness / Adjustment Island

The treatment or adjustment module should avoid medical "treatment" language in user-facing copy. Internally this can be called treatment for shorthand, but UI should prefer `调理`, `练习`, `照护`, `探索`, or `修复`.

Confirmed direction:

- One island.
- Four houses on the island:
  - TCM
  - Philosophy
  - Meditation
  - Art
- Each house has one shopkeeper.

Product meaning:

- The island is the user's adjustment hub after the profile result.
- Houses represent different intervention styles, not clinical treatment categories.
- Shopkeepers give prompts, rituals, exercises, explanations, or creative tasks.

Suggested Phaser scene name:

```text
WellnessIslandScene
```

Suggested entities:

```text
TcmHouse
PhilosophyHouse
MeditationHouse
ArtHouse
Shopkeeper
IslandPath
PracticeCard
```

## 4. Social Personality Islands

Confirmed direction:

- A sea surface with multiple islands.
- Users can swipe/drag horizontally to browse islands.
- Each island can represent a personality type, profile archetype, or social cluster.

Product meaning:

- Social is not a feed first. It is a map of personalities.
- Browsing islands should feel exploratory.
- Each island can reveal compatibility, conversation openings, or shared profile motifs.

Suggested Phaser scene name:

```text
PersonalityArchipelagoScene
```

Interaction notes:

- Horizontal swipe or drag for island browsing.
- Keep islands small and readable.
- The selected island can expand into a card or docked detail panel.

## Prototype Order

Recommended order:

1. Keep refining `ProfileRoomScene` because it already validates the result/state metaphor.
2. Add `MbtiLightDescentScene` as the first collection scene, because its metaphor is already confirmed.
3. Prototype `WellnessIslandScene` as a static island with four clickable houses and shopkeepers.
4. Prototype `PersonalityArchipelagoScene` with swipeable islands.
5. Return to TBD collection scenes after the interaction grammar is stable.

The first four items already exist as rough visual demos in `demo-phaser-iso/index.html`; the next pass should turn them into cleaner TypeScript Phaser scenes after the app scaffold exists.

Next priority is not more static scene count. It is interaction depth plus asset specificity:

1. Make each scene playable through tap, drag, hold, reveal, and micro-reward loops.
2. Prepare detailed AI asset specs before generating images.

## Open Questions

- Body collection scene metaphor.
- Ba Zi / Xuanxue collection scene metaphor.
- Q&A collection scene metaphor.
- Whether current state `正 / 负 / 平` appears as room weather, central object, lighting, or an explicit badge.
- House/shopkeeper art direction and naming.
