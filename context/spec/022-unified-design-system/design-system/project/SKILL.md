---
name: savepoint-design
description: Use this skill to generate well-branded interfaces and assets for SavePoint (a personal gaming library & journal for patient gamers), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

SavePoint is a personal gaming **library and journal** for *patient gamers* —
"a library, not a backlog." Its identity is one cohesive system in **Light**
(warm cream) and **Dark** (warm charcoal), built on a single swappable brand
accent (`data-accent="indigo|sage|clay|plum"`, default sage), geometric-sans
type (Space Grotesk + Geist), crisp 3px radii, and layered elevation.

Key files:
- `colors_and_type.css` — copy this into any artifact to get the exact color,
  type, spacing, radius, shadow, and motion tokens (Paper + Boxart in full).
- `assets/` — the memory-card logo, favicons, OG image, default avatar.
- `ui_kits/app/` — reusable JSX components + an interactive recreation of the
  core screens. Lift components from here.
- Source of truth: GitHub `NeiruBugz/play-later-v2`,
  `savepoint-tanstack/src/styles.css` and `src/widgets/*` for higher fidelity.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy
assets out and create static HTML files for the user to view. If working on
production code, copy assets and read the rules here to become an expert in
designing with this brand.

If the user invokes this skill without any other guidance, ask them what they
want to build or design, ask some questions, and act as an expert designer who
outputs HTML artifacts _or_ production code, depending on the need.
