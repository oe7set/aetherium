# CLAUDE.md – Aetherium

Browser-Incremental-RPG (Deutsch, mobile first). Vorgabe: `docs/SPEC.md`, Plan & Annahmen: `docs/PLAN.md`.

## Aktueller Stand

**Phase 4 „Kampf" fertig** (v0.4.0). Nächstes: **Phase 5 – Wissenschaft & Magie**. Siehe `docs/CHANGELOG.md`.

## Befehle

`npm run dev` · `npm test` · `npm run lint` · `npm run typecheck` · `npm run format` · `npm run build`
Vor jedem Commit: lint, format:check, typecheck, test, build müssen grün sein (CI prüft dasselbe).

## Architektur

- `src/engine/` – **pure TS**, kein React/DOM. Zentrale Funktion `advance(state, dt, rng, emit)` in
  `actions.ts`: springt ereignisgesteuert von Abschluss zu Abschluss; Live-Tick, Offline und Debug nutzen sie.
  Engine-Funktionen **mutieren** den übergebenen State; der Store ruft sie auf einer `cloneState`-Kopie auf.
  Ereignisse (`GameEvent`) gehen über `emit` raus; UI übersetzt sie in Feed/Popups (`src/store/feed.ts`).
  Erweiterung über Registries in `actions.ts`: `registerRunnerFactory` (parallele Prozesse: Aktion, Kampf,
  Helfer), `registerTimeEffect` (Feuer, Buffs, Markt – `next()` liefert Zeit bis zum nächsten Ereignis),
  `registerAfterComplete`/`registerAfterAdvance` (Erfolge). Module registrieren sich beim Import über
  `engine/index.ts` – Tests daher aus `../src/engine` importieren.
- Boni: `registerModifierSource` + `mod(s, key)`/`modFor(s, key, skill)` (Keys siehe `data/types.ts`
  `ModifierSet`). Nach Änderung einer Quelle `invalidateMods(s)` aufrufen.
- `src/data/` – alle Inhalte typisiert (`types.ts`), IDs sind Strings; `tests/data.test.ts` prüft Referenzen.
  Neue Inhalte = nur Daten ergänzen. Balancing-Knöpfe in `balance.ts`, Begründungen in `docs/BALANCING.md`.
- `src/store/` – Zustand-Store (`gameStore.ts`), Loop (`loop.ts`, 10 Ticks/s, Autosave 30 s,
  visibilitychange/pagehide), `persistence.ts` (localStorage-Key `aetherium.save`).
- `src/ui/` – React-Overlay. Mobile: Tab-Leiste + `BottomSheet`; Desktop (≥1024 px): 3 Spalten.
  Fortschrittsbalken der aktiven Aktion laufen per rAF (`LiveProgressBar`), nicht über React-Renders.
- `src/scene/` – R3F-Insel, lazy über `src/ui/World.tsx` (fällt auf 2D-`WorldView` zurück: Akku-Modus,
  kein WebGL, Fehler). Liest State nur in `useFrame` via `useGame.getState()`; Animationen reagieren auf
  Zähler-Änderungen (`useCounterPulse`). Positionen in `layout.ts`; Labels sind DOM-Overlay (`labels.ts`).
- `src/i18n/` – UI-Texte via `t('key')` aus `de.ts`; Inhaltsnamen als deutsche Defaults in den Daten.

## Konventionen

- TypeScript strict, `noUncheckedIndexedAccess`, kein `any`. Prettier (single quotes, 100 Zeichen).
- Gold & künftige Prestige-Währungen sind `Decimal` (break_eternity.js); XP/Item-Mengen `number`.
- Save-Format ändern ⇒ `SAVE_VERSION` erhöhen + Migration in `engine/save.ts` + Test.
  `hydrate()` füllt fehlende Felder und entfernt unbekannte IDs.
- Zufall immer als `Rng`-Parameter (Tests nutzen `createRng(seed)`).
- Zustand-Selektoren geben Primitive oder stabile Referenzen zurück (keine neuen Objekte pro Render).
- Spieltexte deutsch, humorvoll; neue Sprüche in `src/data/flavor.ts` (Test verlangt ≥150).
- Engine-Funktionen nicht `use…` nennen (ESLint hält sie sonst für Hooks).
- Debug-Panel nur hinter `import.meta.env.DEV`.

## Deployment

CI: `.github/workflows/ci.yml`. Pages: `.github/workflows/deploy.yml` bei Push auf `main`
(Base `/<repo>/` via `VITE_BASE`; `vite preview` nutzt dieselbe Base). Pages-Source muss „GitHub Actions" sein.
