# Technical Engine Selection

## Final Choice

Use **Phaser 3 + TypeScript**, with Vite and pnpm for the app scaffold.

The main reason is not only rendering quality. The project needs agent-driven iteration: scenes, UI, interactions, and visual polish should be editable through code without relying on a GUI editor. Phaser is the strongest fit for that workflow.

## Comparison

| Engine | Visual ceiling | Simplicity | AI-agent friendliness | Decision |
|---|---:|---:|---:|---|
| Unity | Highest | Low | Low | Not worth the hackathon overhead |
| Godot 4 | High | Medium | Medium | Backup option |
| Cocos Creator | High | Medium | Low | Backup option |
| **Phaser 3 + TS** | **High** | **High** | **Highest** | **Selected** |

## Version Policy

As of the current local npm check, `phaser` defaults to a 4.x release. Do not depend on `latest`.

For the first production scaffold, pin the Phaser 3 line explicitly:

- Recommended hackathon pin: `phaser@3.88.2`, matching the reference project.
- Candidate upgrade after smoke tests: `phaser@3.90.0`, the latest 3.x version found during setup.

Use `pnpm` as the package manager. The local machine has Node `v22.22.1` and pnpm `11.7.0`.

## Reference Projects

- [leokuo0724/Balance-Ma-atters](https://github.com/leokuo0724/Balance-Ma-atters): Phaser 3 + TypeScript + Vite + pnpm. The useful structure is `src/scenes`, `src/ui`, `src/assets`, `src/constants`, `src/manager`, and `src/utils`.
- [Love Lights](https://leokuo0724.itch.io/love-lights): isometric vector illustration tone and "inner world" metaphor.
- [Agrocracy](https://phaser.io/news/2026/05/agrocracy-phaser-farming-management-game): proof that Phaser can support polished isometric management-game visuals with custom rendering work.
- [itch.io Phaser isometric games](https://itch.io/games/new-and-popular/made-with-phaser/tag-isometric): broader visual reference pool.

## Suggested App Structure

```text
src/
  main.ts
  scenes/
    boot-scene.ts
    preload-scene.ts
    intake-scene.ts
    profile-scene.ts
    wellness-island-scene.ts
    social-scene.ts
  ui/
    card/
    controls/
    overlays/
  domain/
    intake/
    profile/
    retrieval/
  assets/
  constants/
  utils/
public/
  assets/
```

Keep the knowledge-base code outside the Phaser scene layer. The scene should ask a small domain service for profile state and render the result, rather than querying SQLite directly from Phaser.

The product scene map is tracked in `docs/scene-map.md`. Use it as the source for scene splitting and asset planning.

## Existing Spike

`demo-phaser-iso/index.html` is a no-build Phaser 3 spike. It validates:

- a Love Lights-inspired small isometric-world scale
- a four-scene product-map demo: intake light descent, profile room, wellness island, and social personality islands
- mobile portrait sizing with high-resolution canvas backing
- click-to-select light interaction
- four-profile-axis visual mapping
- a compact dialogue-style profile card triggered from the scene

It intentionally uses CDN-loaded Phaser and plain JavaScript so teammates can open it immediately before the real TypeScript app scaffold exists.
