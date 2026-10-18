# Changelog

## [0.4.0] – Phase 4 „Kampf"

### Hinzugefügt

- Kampf-Skills: Nahkampf, Fernkampf, Magie, Verteidigung, Lebenspunkte (Start mit 10 LP wie in alten MMOs).
- Auto-Kampf als Runner in der Engine (live = offline): OSRS-artige Treffer-/Schadensformeln, Angriffstempo,
  Schwächen (+25 % Treffsicherheit), Auto-Essen mit Schwelle, Essenswahl, LP-Regeneration, Tod ohne Itemverlust.
- 6 Gebiete mit 18 Monstern (Huhn bis Schwarzes-Loch-Imp), Loot-Tabellen, Gold.
- 3 Dungeons mit Phasen-Bossen: **Der Peer Reviewer #2** („Major Revisions“: lehnt 40 % deiner Angriffe ab,
  „Reject!“: schneller und härter), Thermodynamos, Das Standardmodell. Einzigartige Beute bis Seltenheit _Peer-Reviewed_.
- **Handwerk** (Skill): Pfeilschäfte, Bögen, Pfeile, Zauberstäbe, Leder-/Fell-/Seidenrüstung.
- Ausrüstung mit 8 Slots (Kopf, Amulett, Waffe, Brust, Schild, Beine, Ring, Munition), Level-Anforderungen,
  Boni über das Modifikator-System; Munition (Pfeile) und Runen werden pro Angriff verbraucht.
- Kampf-Ansicht mit Trefferchance, Schaden/s und Zeit pro Kill; Kampfleiste mit Monster- und Spieler-LP.
- 3D-Arena mit Monster (Trefferblitz, Wackeln, Todes-Puff, Krone für Bosse); Figur mit Schwert/Bogen/Stab.
- Kampf-Erfolge, Kampf in der Offline-Zusammenfassung. Spielstand v3.

## [0.3.0] – Phase 3 „Handwerk"

### Hinzugefügt

- **Schmieden** (Skill): 8 Barrensorten (Bronze bis Runit, Silber, Gold), Werkzeuge, Waffen, Rüstungen,
  Pfeilspitzen und Schmuck (Ringe/Amulette mit Boni). Geschmiedete Äxte/Spitzhacken werden per „Benutzen" zum Werkzeug.
- **Angeln** (Skill): 11 Fische von Garnelen bis Quantenaal mit Köder/Federn, Schätze (Flaschenpost),
  alter Stiefel, **Schrödingers Fisch** (kollabiert beim Öffnen). Alle Fische kochbar.
- **Dynamischer Markt**: Verkaufen drückt den Preis (exakt integriert), Erholung über ~15 min,
  zufällige Nachfrage-Trends und Crashs. Markt-Tab mit Kursen.
- **Erfolge**: 130+ (generierte Meilensteine + Meme-Erfolge, teils geheim), jeder mit dauerhaftem Bonus.
- **Modifikator-System** (`engine/modifiers.ts`): Boni aus Erfolgen, Buffs, Lagerfeuer, Intelligenz.
- **Glücks-Events** (Meteoritenschauer, Heureka!, Fischschwarm …) als zeitlich begrenzte Buffs.
- Engine-Umbau: `advance()` steppt beliebig viele „Runner" (Aktion, später Kampf/Helfer) und Zeit-Effekte
  (Feuer, Buffs, Markt) ereignisgenau – live und offline identisch.
- 3D: Schmiede mit glühender Esse und Funken, Angelsteg mit Pose und Spritzern.
- Spielstand v2 mit Migration.

## [0.2.0] – Phase 2 „3D-Welt"

### Hinzugefügt

- Low-Poly-Insel mit React Three Fiber (lazy geladen, eigener Chunk): Fluss, Ozean, instanzierter Wald
  (2 Draw-Calls), Felsen, Mine mit Erzkristallen in der Farbe des aktuellen Erzes, Lagerfeuer mit
  Flammen, Licht-Flackern, Rauch und Funken, Kochstelle mit Dampf, eingerüsteter Forschungsturm.
- Spielfigur aus Low-Poly-Blöcken läuft zur aktiven Station, Lauf- und Arbeitsanimationen, Werkzeug in der Hand.
- Feedback: Baum fällt und wächst nach, Fels wackelt und Brocken fliegen bei jedem Abbau.
- Tag/Nacht-Zyklus (20 min) mit Sonne, Mondlicht, Sternen und Himmelsfarbe.
- Antippbare Stationen in 3D, Touch-Kamera (Ein-Finger-Drehen, Pinch-Zoom), Abstand passt sich dem Hochformat an.
- Grafik-Qualitätsstufen (Auto/Niedrig/Mittel/Hoch) mit Geräteerkennung, Pixel-Ratio ≤ 2, Schatten nur auf Hoch.
- Akku-Modus (3D aus), Render-Pause bei verstecktem Tab, 2D-Fallback ohne WebGL oder bei Fehlern.

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
