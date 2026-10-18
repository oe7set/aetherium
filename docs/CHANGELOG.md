# Changelog

## [0.1.0] – Phase 1 „Fundament"

### Hinzugefügt

- Projekt-Setup: Vite, React 19, TypeScript strict, Zustand, break_eternity.js, ESLint, Prettier, Vitest.
- GitHub Actions: CI (Lint, Format, Typecheck, Tests, Build) und Pages-Deploy bei Push auf `main`.
- Engine (`src/engine`, pure TS): OSRS-XP-Kurve bis 120, ereignisgesteuertes `advance()` für Live-Tick,
  Offline-Fortschritt und Debug-Vorspulen, Klick-Beschleunigung, Inventar mit Plätzen, Krämer,
  Werkzeuge, benutzbare Items, versionierte Spielstände mit Migrationen, Base64-Export/Import,
  deutsche Zahlenformate bis weit über 1e308.
- Inhalte: Holzfällen (8 Bäume), Bergbau (11 Erze + Edelsteine), Feuermachen (9 Brennstoffe, Lagerfeuer-Buff),
  Kochen (10 Rezepte mit Anbrennen), 18 Werkzeuge, ~45 Items, >150 Flavor-Texte.
- UI: Header (Gold, Gesamtlevel, Lagerfeuer, Intelligenz), Ereignis-Feed, 2D-Insel mit antippbaren Stationen
  und Tag/Nacht, Aktionsleiste mit rAF-Fortschritt und Zahlen-Popups, Level-Up-Banner, Offline-Modal,
  Skills/Inventar/Krämer/Werkzeuge/Forschung-Vorschau/Menü (Einstellungen, Statistiken, Spielstand, Debug).
- 52 Engine-Tests.
