# Changelog

## [1.0.0] – Phase 7 „Feinschliff"

### Hinzugefügt

- **Haustiere**: 15 extrem seltene Begleiter (Biber Bernd 1/5.000 … Peer-Review-Papagei vom Boss) mit Boni;
  **Schrödingers Katze** kollabiert beim ersten Hinsehen zu „lebendig“ oder „Geisterkatze“.
- **Quests**: 13 Story-Quests mit Questgebern, Ketten, Zielen (Statistik, Abgabe, Level) und Belohnungen.
- **Tages- und Wochenaufträge**: deterministisch pro Tag/Woche gewürfelt, skaliert mit dem Gesamtlevel.
- Neuer Tab **Quests** (Aufträge, Quests, Haustiere); Badges an Tabs für einlösbare Aufträge und bezahlbare Forschung.
- **Sounds**: WebAudio-Synth ohne Dateien (Level-Up-Arpeggio, seltene Funde, Treffer, Münzen …), abschaltbar.
- **Benachrichtigungen** im Hintergrund (Level-Up, Inventar voll), optional.
- **Juice**: Konfetti bei Level-Ups und Erfolgen, Long-Press-Tooltips (kein Hover nötig).
- **PWA**: installierbar, Offline-Start (Service Worker cacht auch die 3D-Szene), Vollbild, Icons.
- **Die Welt wächst**: Dorf mit bis zu 8 Häusern (Gesamtlevel), Windmühle, Laternen, Solarfeld, Wurmloch-Portal.
- Erweiterte Statistiken, neue Erfolge (Quests, Aufträge, Haustiere, Prestige). Spielstand v6.

## [0.6.0] – Phase 6 „Prestige"

### Hinzugefügt

- **Wiedergeburt**: Skills/Inventar/Gold zurück, dafür **Weisheit** (+4 % XP, +2 % Forschung, +2 % Gold pro Punkt).
  **Ahnen-Talente**: Vorwissen (Start-Level), Erbstücke (Werkzeuge behalten), Startkapital, Tascheninflation,
  Treue Helfer, Tiefschlaf (+Offline), Flinke Finger, Glücksstern und **Transzendenz (Level-Cap 120)**.
- **Paradigmenwechsel** (Thomas Kuhn): setzt den Tech-Baum zurück, +25 % Forschung je Wechsel, wählbare
  **Naturgesetze** mit Vor- und Nachteilen (Schwache Gravitation, Schnelles Licht, Exotherme Welt …).
- **Urknall**: Multiversum-Splitter für Meta-Upgrades (zweites Naturgesetz, kosmische Inflation,
  kosmisches Gedächtnis, Dunkle Energie, Ewiger Codex).
- Prestige-Ansicht im Menü mit Bestätigung per Doppeltipp; Weisheit im Header; Ahnen-Obelisk in 3D wächst mit.
- **Balancing-Pass**: analytischer Progressionstest, Angelruten als Werkzeuge, Jagd-XP angepasst
  (alle Sammel-Skills ~30–55 h bis 99). Spielstand v5.

## [0.5.0] – Phase 5 „Wissenschaft & Magie"

### Hinzugefügt

- **Forschung**: Forschungspunkte aus jeder Aktion, jedem Kill, aus Ernten und Forschungsnotizen.
  **Tech-Baum** mit 39 Technologien in 9 Epochen (Feuer beherrschen … Multiversums-Theorie), Boni und Freischaltungen.
- **Periodensystem-Codex**: alle 118 Elemente, entdeckt durch Alchemie-Analysen (bis zur Teilchenbeschleuniger-Synthese);
  jedes Element gibt dauerhaft Forschung/XP.
- **Alchemie**: 10 Tränke als Buffs (Eile, Weisheit, Glück, Goldrausch, Superposition …), Heiltrank heilt im Kampf.
- **Verzauberung**: Runen binden, verzauberte Ringe/Amulette, Ätherstab.
- **Landwirtschaft**: Echtzeit-Beete (wachsen auch offline), 9 Pflanzen, Saatrückgabe, Mendel-Mutationen,
  Auto-Ernte per Forschung, zusätzliche Beete.
- **Jagen** und **Arkanes Schürfen** als neue Sammel-Skills; Wild-Rezepte, Mühle.
- **Helfer** (Praktikant, Gnom, Golem, Roboter, KI-Assistent) arbeiten parallel an eigenen Aufgaben, teilen das Inventar;
  Praktikanten lernen dazu. Helferplätze über Forschung.
- Offline-Grenze per Forschung erweiterbar (Telegraf, Relativitätstheorie, Wurmlöcher).
- 3D: Forschungsturm (Gerüst verschwindet, Fenster leuchtet), Felder mit wachsenden Pflanzen, Werkbank, Jagdgrund,
  Helfer-Figuren an ihren Stationen, Teilchenbeschleuniger-Ring um die Insel.
- Spielstand v4.

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
