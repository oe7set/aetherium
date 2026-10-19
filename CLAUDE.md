# CLAUDE.md – Aetherium

Browser-Incremental-RPG (Deutsch, mobile first). Vorgabe: `docs/SPEC.md`, Plan & Annahmen: `docs/PLAN.md`.

## Aktueller Stand

Phasen 1–7 (`docs/PLAN.md`) und 8–10 aus dem Masterplan 2.0 (`docs/PLAN-2.md`) fertig (v1.63.0, Phase 9 = Dorf + Held, plus Motivations-Schicht,
Sammelbuch, Wochenboss). Als Nächstes: offene Punkte in `docs/SYSTEME.md`. Siehe `docs/CHANGELOG.md`.

**Systemkarte & offene Punkte: `docs/SYSTEME.md` – bei jeder Änderung mitpflegen** (neue Systeme/Verbindungen
eintragen, Erledigtes streichen, Neues Offenes ergänzen).

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
- Weitere Hooks: `registerCompletionHook` (pro abgeschlossener Aktion, z. B. Forschung/Codex) und
  `registerAvailabilityCheck` (Tech-Sperren). Kampf = `engine/combat.ts` (+ Gebete `engine/prayer.ts`, Zauber `data/spells.ts`; Plan: `docs/PLAN-3.md`), Forschung/Beete/Helfer = `engine/science.ts`,
  Prestige = `engine/prestige.ts` (`resetRun` legt fest, was bei Resets erhalten bleibt – neue State-Felder dort
  bewusst einordnen!). Level-Cap: `levelCap(s)`. Haustiere/Quests/Aufträge = `engine/meta.ts`.
  Wochenboss = `engine/weekly.ts` (Riss-Lauf mit `trial: true`, Mutatoren in `data/weekly.ts`).
  „Was jetzt?" = `engine/agenda.ts` (alles Fällige über alle Systeme; neue Systeme mit Handlungsbedarf dort
  eintragen). Leere Zustände über `ui/EmptyState.tsx` mit Weg zum Ziel.
  Sammelbuch = `engine/collections.ts` (`addItem` merkt Funde in `progress.found`; Sets geben Dauer-Boni).
  Glaube/Brauen = `data/devotion.ts` + `engine/devotion.ts` (Glaube-Stufe als Modifier-Quelle).
  Masterplan 3.0 (`docs/PLAN-3.md`): Juwelierkunst `data/jewelcrafting.ts`, Sets/Unikate `data/sets.ts`,
  Kopfgeldjagd `engine/slayer.ts`, Beschwörung `engine/summoning.ts`, Diebeskunst `engine/thieving.ts`
  (`registerActionGate`), Baukunst `engine/construction.ts` (`s.buildings`), Kartografie `data/cartography.ts`.
  Neue Skill-Stationen als generische Werkstätten in `scene/Workshops.tsx`. Nächster Plan: `docs/PLAN-4.md`. Rezept-Navigation
  (welche Aktion macht/braucht ein Item) = `ui/recipes.ts`, Sprung über `jumpToAction`.
- Dorf (Travian-artig) = `engine/village.ts` (Produktion, Lager, Bauschleifen, Truppen, Raubzüge, Oasen,
  Invasionen, Kulturpunkte, Expansion; ein Zeiteffekt `village` treibt alles, auch offline), Weltgenerierung
  `engine/villageWorld.ts`, Inhalte `data/village.ts` (Tempo über `SPEED`). Mehrere Dörfer in `s.village.villages`.
  UI `ui/village/` (Felder-Ring, Dorfplatz, Militär, Markt, Berichte, Reich); Panel rendert über `villageKey`.
- Held = `engine/hero.ts` (ein Held für Dorf und Riss: Attribute, Ausrüstung `data/hero.ts`, Gesundheit, Abenteuer
  mit Reise/Auto-Erkunden, Zeiteffekt `hero`). Abenteuer live = Riss-Simulation im `mode: 'dungeon'`
  (`prepareDungeon`/`finishDungeon` in `engine/rift.ts`). `village.ts` importiert den Helden, nie umgekehrt.
  Weltkarte `ui/village/WorldMap.tsx` + `mapRender.ts` (Gelände einmal vorgerendert). Sprites: `ui/sprites.ts`.
- Motivation = `engine/progress.ts` + `data/progress.ts`: Tagesbonus (Serie), Ruhmesleiter (aus Statistiken
  abgeleitet – neue Systeme brauchen nur einen Eintrag in `PASS_SOURCES`), Chronik (Zielkette/Tutorial).
  Belohnungen immer über `applyReward` (skaliert mit `rewardScale`); UI `ui/rewards/` (Enthüllung, Kalender, Banner).
- Ätherriss (Survivor-Roguelike): Echtzeit-Simulation `src/rift/sim.ts` (pur, deterministisch, eigene `stepRun`-
  Schleife, nicht im Spielstand), Inhalte `data/rift.ts` (Waffen-Verhalten, Passive, Evolutionen, Biome, Helden,
  Talente), Meta `engine/rift.ts` (Freischaltungen über Skills/Techs, `prepareRun`/`finishRun`, Echo-Läufe).
  UI `ui/rift/`: Hub `RiftPanel`, Lauf `RiftOverlay` (lazy, Canvas `render.ts` mit Emoji-Sprite-Cache, Joystick),
  laufender Lauf in eigenem Store `runStore.ts`.
- Leistung: `ui/perf.ts` setzt `perf-eco`/`perf-smooth` auf `<html>`; teure Effekte (backdrop-filter, Endlos-
  Animationen) im Eco per CSS abschalten, 3D läuft `frameloop="demand"` mit `FrameTicker`. Neue Dauer-Animationen
  immer in die Eco-Liste in `theme.css` aufnehmen. Navigation: `ui/QuickNav.tsx`; Unterbereiche liegen im Store (`ui`).
- Inhalte-Erweiterungen in `data/expansion.ts` (Bäume, Erze, Jagd, Arkanes, Archäologie).
- Musik: `ui/music.ts` (prozeduraler Sequenzer, Thema je Bereich via `setMusic`).
- UI-Nebenwirkungen (Sound `ui/audio.ts`, Benachrichtigungen `ui/notify.ts`) hängen in `applyEvents` im Store.
- PWA über `vite-plugin-pwa` (Konfiguration in `vite.config.ts`), Icons in `public/icons/`.
- Boni: `registerModifierSource` + `mod(s, key)`/`modFor(s, key, skill)` (Keys siehe `data/types.ts`
  `ModifierSet`). Nach Änderung einer Quelle `invalidateMods(s)` aufrufen.
- `src/data/` – alle Inhalte typisiert (`types.ts`), IDs sind Strings; `tests/data.test.ts` prüft Referenzen.
  Neue Inhalte = nur Daten ergänzen. Balancing-Knöpfe in `balance.ts`, Begründungen in `docs/BALANCING.md`.
- `src/store/` – Zustand-Store (`gameStore.ts`), Loop (`loop.ts`, 10 Ticks/s, Autosave 30 s,
  visibilitychange/pagehide), `persistence.ts` (localStorage-Key `aetherium.save`).
- `src/ui/` – React-Overlay. Mobile: Tab-Leiste + `BottomSheet` (volle Höhe, Titel + ✕; Handy-Regeln am Ende von
  `theme.css`; Feed nur als verblassender Hinweis auf der Insel, Log unter Mehr → Ereignisse); Desktop (≥1024 px): 3 Spalten.
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
- Schriftgrößen im CSS immer in `rem` (Textgrößen-Einstellung skaliert über `html`), Dauer-Animationen müssen
  `reduce-motion` respektieren (global in `theme.css`).
- Spieltexte deutsch, humorvoll; neue Sprüche in `src/data/flavor.ts` (Test verlangt ≥150).
- Engine-Funktionen nicht `use…` nennen (ESLint hält sie sonst für Hooks).
- Debug-Panel nur hinter `import.meta.env.DEV`.

## Deployment

CI: `.github/workflows/ci.yml`. Pages: `.github/workflows/deploy.yml` bei Push auf `main`
(Base `/<repo>/` via `VITE_BASE`; `vite preview` nutzt dieselbe Base). Pages-Source muss „GitHub Actions" sein.
