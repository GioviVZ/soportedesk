---
target: dashboard principal (soportedesk-frontend/src/app/features/dashboard)
total_score: 19
p0_count: 2
p1_count: 3
timestamp: 2026-07-20T01-02-10Z
slug: rc-app-features-dashboard-dashboard-component-html
---
Method: dual-agent (A: ae8b8163f950ee391 · B: aef0fc9b42caf6d1b)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loading state/updated-at/spinner present; solid |
| 2 | Match System / Real World | 2 | `sparkline()` synthesizes a fake 6-point trend from a single number ("serie sintética decorativa" per its own code comment) — misrepresents real data as a trend |
| 3 | User Control and Freedom | 2 | No dashboard-wide sede/dependencia filter; error banner isn't dismissible |
| 4 | Consistency and Standards | 1 | Two DESIGN.md Don't-rules broken (decorative `border-left`) and 10+ hardcoded module colors diverging from tokens |
| 5 | Error Prevention | 3 | Read-only view, low risk surface |
| 6 | Recognition Rather Than Recall | 3 | Color-coded per module, but three parallel/conflicting color legends to track (card color, pill dot, mix-chart bucket colors) |
| 7 | Flexibility and Efficiency | 1 | `role="tablist"` on the module selector has no arrow-key handling; no shortcuts or bulk/scoped views |
| 8 | Aesthetic and Minimalist Design | 1 | 6+ stacked sections (hero, 7-8 cards, ops-grid, 2 charts, module-explorer, 2 more charts, service-orders) on one screen |
| 9 | Error Recovery | 2 | Generic "No se pudo actualizar" with no specifics or retry guidance |
| 10 | Help and Documentation | 1 | No tooltips on metric meaning, no help affordance anywhere on the page |
| **Total** | | **19/40** | **Poor — major UX overhaul warranted** |

## Anti-Patterns Verdict

**Start here.** Yes, this reads as AI-templated at a glance.

**LLM assessment**: The dashboard opens with a decorative hero gradient (`.dash-header`, `linear-gradient(135deg, rgba(71,124,33,.12)...)`), something DESIGN.md's Don't-list explicitly bans ("gradiente de fondo grande"). Two components — `.priority-panel::before` and `.dash-notice` — use colored `border-left` as pure decoration, exactly the pattern DESIGN.md reserves solely for the sidebar's active-nav-item indicator. Uppercase `.eyebrow` micro-labels repeat three times across the page (dash-title, module-explorer, service-orders-heading). `.cards-grid` renders 7-8 near-identical icon+stat+sparkline+arrow cards — the templated-grid tell. Most concerning: the sparkline on every KPI card is fabricated from a single number, not real historical data — a trust problem on a tool whose whole pitch is replacing unreliable spreadsheets with something trustworthy.

**Deterministic scan**: `detect.mjs` returned exit code 2 (findings) on both the dashboard feature directory and the shared global stylesheet:

- Dashboard directory (`features/dashboard/**`): **48 findings** — 1 `side-tab`, 10 `design-system-color`, 33 `design-system-font-size`, 4 `design-system-radius`. Concentrated in `dashboard.component.scss` (36 hits), plus the two per-module chart components.
- Shared `styles.scss`: **58 findings** — 1 `side-tab`, 26 `design-system-color`, 27 `design-system-font-size`, 4 `design-system-radius`.

**Where they agree**: both the LLM review and the detector independently flagged the same `border-left` decoration — Assessment A caught it by reading the template/SCSS, Assessment B's detector caught it structurally at `dashboard.component.scss:151` (`.dash-notice`) and `styles.scss:415` (`.module-dash-notice`), and B confirmed both are genuine violations (not the documented sidebar exception, which is the *only* sanctioned use of that pattern per DESIGN.md).

**Where the detector caught more than the LLM review**: the sheer scale of typography and radius drift — 33 font-size and 4 radius findings in the dashboard alone, 27 more font-size hits in the shared stylesheet — is a systemic pattern the design review didn't quantify. This suggests the "single DM Sans family, five-role type scale" rule in DESIGN.md is being ignored wholesale in favor of ad-hoc pixel values, not just occasionally bent.

**False positives flagged by B**: a cluster of `design-system-color` hits are `rgba(71,124,33,.NN)` at varying opacities — DESIGN.md's own Inputs section documents `rgba(71,124,33,.18)` as the canonical focus-halo formula, and the Cards section documents opacity-varied tone gradients (7-9%, 24%) as intentional. The detector likely only matches exact frontmatter literals, not this documented rgba formula, so this specific sub-cluster is probably noise, not real drift — the true color-drift count is likely lower than 10+26 raw hits, concentrated instead in the hardcoded hex literals below.

**Visual overlays**: unavailable. No dev server is running on `localhost:4200` and no browser-automation tool is exposed in this environment, so there is no user-visible overlay to point to. This critique is source-only for both assessments.

## Overall Impression

The dashboard has real bones — a working progressive-disclosure pattern (one open module breakdown at a time), consistent status-color coupling for service-order deadlines, and a token system that genuinely exists in `_variables.scss`. But the built page doesn't follow its own design system: decorative borders and gradients DESIGN.md was written specifically to forbid have crept back in, module colors are hardcoded instead of referencing tokens (breaking dark mode), and — most importantly for what you said matters — the one thing you called out as the priority ("ver qué tiene cada oficina") is implemented for exactly one of eight modules, and it's the last thing on the page.

## What's Working

- **Single-active breakdown panel** (`selectedModulo` / `.modulo-breakdown-panel`): a real progressive-disclosure win, avoids accordion pile-up.
- **Semantic status coupling for service orders**: `ordenEstadoClass`/`ordenSemaforo` cleanly map days-remaining to warn/bad/ok states, reused consistently across chip, flip-clock face, and footer text — this is the pattern the rest of the page should imitate.
- **Real token system underneath**: `_variables.scss` gives every module a light/dark color pair; the problem is components bypassing it, not an absent system.

## Priority Issues

**[P0] The stated success criterion is nearly invisible.** Per-sede/dependencia breakdown exists for exactly one module (usuarios-red, via `usuarios-red-por-ubicacion-chart`), and it sits in the very last content section of the page, after the hero, 7-8 KPI cards, ops-grid, and two overview charts. Equipos, impresoras, licencias, correos have zero location view. **Why it matters**: this is the literal metric you defined for success — if a support tech can't see what each office has without scrolling past six other sections, the dashboard fails its primary job. **Fix**: promote a cross-module sede/dependencia summary near the top of the page, above the generic KPI grid. **Suggested command**: `/impeccable layout dashboard`.

**[P0] Design-system Don'ts reintroduced — confirmed by both assessments.** `.priority-panel::before` and `.dash-notice` (`dashboard.component.scss:151`) plus `.module-dash-notice` (`styles.scss:415`) use colored `border-left` purely as decoration — the exact pattern DESIGN.md bans everywhere except the sidebar's active-nav indicator. The detector independently confirms these are genuine violations, not the sanctioned exception. **Why it matters**: this is the fastest way for the design system to erode back into generic-dashboard territory; if it's not enforced here it won't be anywhere. **Fix**: remove the decorative border-left, replace with the documented alternatives (full border, background tint, leading icon). **Suggested command**: `/impeccable harden dashboard`.

**[P1] Hardcoded module colors diverge from tokens.** VPN card uses `#fa896b` instead of `--color-vpn` (#b55245); Usuarios de Red uses `#fab50b` (ambar-acento, which DESIGN.md reserves for logo-only use) instead of `--color-usuarios-red`; Equipos uses `#5d982d` instead of the primary `#63a431`. Confirmed independently by the detector's `design-system-color` findings at the same lines. **Why it matters**: breaks dark-mode repaint (hardcoded hex doesn't swap with the theme) and directly violates "La Regla del Módulo Silencioso" from DESIGN.md — module colors are supposed to be consistent accents, not ad-hoc picks. **Fix**: replace literals with the corresponding `--color-<modulo>` custom properties. **Suggested command**: `/impeccable harden dashboard`.

**[P1] Fabricated trend data.** `sparkline()` in `dashboard.component.ts` synthesizes a fake 6-point trend from one number via arbitrary multipliers — its own code comment admits "serie sintética decorativa." **Why it matters**: on a tool whose entire pitch is replacing unreliable spreadsheets with trustworthy tracking, a fabricated chart is a credibility risk the moment anyone notices it doesn't reflect history. **Fix**: either wire real historical data or remove the sparkline until it can be. **Suggested command**: `/impeccable clarify dashboard`.

**[P1] Nested interactive controls break keyboard/screen-reader use.** `.module-card` is an `<a [routerLink]>` wrapping a `<button class="module-card__menu-btn">` — invalid HTML with unreliable keyboard/SR activation. Separately, `role="tablist"`/`role="tab"` on `.modulo-selector` has no arrow-key handling, so screen readers announce "tab 1 of 8" but only sequential Tab works, not the arrow-key behavior that role implies. **Why it matters**: this is the accessibility baseline you asked for ("buenas prácticas estándar... soporte completo de teclado") not being met on the busiest screen in the app. **Fix**: unnest the button from the link (move it outside or use a single interactive element), wire arrow-key navigation for the tablist or drop the ARIA tab role if it's not going to behave like one. **Suggested command**: `/impeccable harden dashboard`.

**[P2] Widespread typography/radius drift the design review didn't quantify.** The detector found 33 font-size and 4 radius findings in the dashboard alone, plus 27 more font-size hits in the shared stylesheet — ad-hoc pixel values outside DESIGN.md's five-role type scale (display/headline/title/body/label), not occasional exceptions. **Why it matters**: at this scale it's not drift, it's a second, unofficial type scale living alongside the documented one. **Fix**: audit and consolidate to the five documented roles. **Suggested command**: `/impeccable typeset dashboard`.

## Persona Red Flags

**Alex (Power User / admin support tech)**: Wants to see his sede's status fast. He scrolls past the hero, 7-8 cards, ops-grid, and two overview charts before reaching `module-explorer` — which groups by estado/tipo, not ubicación, so it still doesn't answer his question. Only the very last section (`.charts-grid`) has a sede view, and only for usuarios-red. No dashboard-wide sede filter exists anywhere on the page, so Alex can't scope the view to his own office even if he wanted to.

**Sam (Accessibility-dependent, keyboard/screen-reader user)**: Tabs into `.module-card`, a link containing a button — nested interactive elements with unreliable focus and activation order. On `.modulo-selector`, the screen reader announces "tab 1 of 8" (role="tab") but Left/Right arrows do nothing since only `(click)` is bound; Sam is forced through 8 sequential Tab presses instead of the arrow-key shortcut the ARIA role promises.

## Minor Observations

- "Total registros" label is repeated verbatim in `.total-badge` and every `.module-card__total`.
- Decorative SVG icons injected via `[innerHTML]` aren't marked `aria-hidden`, so screen readers may announce meaningless icon markup.
- The mix-chart uses generic green/teal/amber bucket colors unrelated to the per-module color legend already established elsewhere on the page — a second, conflicting color code for the same data.

## Questions to Consider

- If "ver qué tiene cada oficina" is the explicit success metric, why is location-based breakdown implemented for exactly one of eight modules?
- Is a fabricated sparkline worth the trust cost on a tool whose entire pitch is replacing unreliable spreadsheets?
- Why do the two components most likely to have been copy-pasted from a generic dashboard template (the alert notice, the priority panel) reproduce the exact decoration DESIGN.md was written to forbid?
