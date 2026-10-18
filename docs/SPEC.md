# Projektvorgabe: „AETHERIUM – Von der Steinaxt zum Teilchenbeschleuniger"

> Originale Projektvorgabe (Stand Session 1). Quelle der Wahrheit für Vision, Scope und Phasen.

3D-Incremental-RPG im Browser, **mobile first** (am Handy voll spielbar), entwickelt in einem GitHub-Repo,
automatisch auf GitHub Pages deployt. Vorbilder: RuneScape-Skilling, WoW-Progression, Melvor Idle,
Cookie Clicker, Antimatter Dimensions, Kittens Game. Extrem motivierend, viel Humor, große Tiefe an
Skills, Crafting und Progression. Iterativ in Phasen; nach jeder Phase lauffähig und spielbar.

## 1. Vision & Ton

- Idle/Incremental-RPG mit Skilling-Fokus (Old-School-MMO-Feeling, Singleplayer im Browser).
- Fantasy-Welt, in der Magie und Naturwissenschaft kollidieren: Bauer mit Steinaxt → Alchemie →
  Mittelalter-Handwerk → Arkane Künste → Quantenphysik, Teilchenbeschleuniger, interdimensionale Magie.
- Augenzwinkernd, nerdig, voller Wissenschafts- und Fantasy-Memes. „Nur noch ein Level …"

## 2. Tech-Stack

- TypeScript (strict) + Vite + React, Zustand für State.
- Spiel-Logik komplett getrennt in `src/engine/` (pure, testbar, ohne React).
- Fester Tick (10/s) mit Delta-Zeit; Rendering per `requestAnimationFrame`.
- Große Zahlen: `break_eternity.js` (weit über 1e308).
- Autosave in `localStorage` alle 30 s + beim Schließen, versioniertes Save-Format mit Migrationen,
  Export/Import als Base64.
- Offline-Fortschritt beim Laden simulieren (gedeckelt, z. B. 24 h, später erweiterbar) mit
  „Während du weg warst …"-Zusammenfassung.
- Daten-getrieben: Skills, Items, Rezepte, Monster, Upgrades, Achievements als typisierte Daten in `src/data/`.
- 3D: Three.js über React Three Fiber + drei. Low-Poly, stylized, Old-School-MMO-Charme, prozedurale
  Modelle oder eigene leichte glTF. Insel mit Bäumen, Felsen, Erzadern, Fluss, Lagerfeuer, Schmiede, Herd,
  Forschungsturm; Spielfigur läuft zur Aktion und animiert; Bäume fallen/wachsen nach, Erz bricht ab,
  Feuer-Partikel, Rauch, Funken, Tag/Nacht; Welt wächst mit Fortschritt (Labor, Beschleuniger-Ring);
  isometrische/Third-Person-Kamera mit Drehen/Zoomen; klickbare Objekte zusätzlich zur Menü-Bedienung.
- 2D-UI als React-HTML-Overlay über der Szene.
- Vitest für Engine (XP-Kurven, Crafting, Offline, Save-Migration).

## 2a. Mobile First

- Primär Smartphone (Chrome Android, Safari iOS), Desktop zweitrangig.
- Touch: Tippen, Ein-Finger-Drehen, Pinch-Zoom, Buttons ≥ 44 px, keine Hover-Funktionen (Long-Press-Tooltips).
- Hochformat; unten Tab-Leiste (Welt, Skills, Inventar, Forschung, Menü), Panels als Bottom-Sheets.
- 60 FPS Mittelklasse, ≥ 30 FPS alt: Instancing, wenige Draw-Calls, kaum Schatten, wenige Partikel,
  Qualitätsstufen (Niedrig/Mittel/Hoch) mit Auto-Erkennung, Pixel-Ratio ≤ 2, Render-Pause im Hintergrund,
  „Akku-Modus" (3D aus, reine 2D-UI).
- PWA (vite-plugin-pwa), Code-Splitting, 3D lazy, erster Start < 3 s auf 4G.

## 3. Kern-Loop

Aktion wählen → läuft automatisch in Zyklen → Items + XP → Weiterverarbeitung in anderen Skills →
Level-Ups schalten frei → Gold → Upgrades, Werkzeuge, Helfer → Prestige. Anfangs Klicks beschleunigen,
später Automatisierung.

## 4. Skills (Level 1–99, später 120)

OSRS-XP-Kurve (99 ≈ 13 Mio. XP).

- Sammeln: Holzfällen (Eiche … Yggdrasil-Splitter, Vogelnester), Bergbau (Kupfer … Uran, Dunkle Materie,
  Edelsteine), Angeln (Schrödingers Fisch), Landwirtschaft (Echtzeit, Mendel-Gag), Jagen, Arkanes Schürfen.
- Verarbeiten: Feuermachen (Lagerfeuer-Buffs, später Kernfusion), Kochen (Anbrenn-Chance, Food heilt/buffed),
  Schmelzen & Schmieden, Handwerk/Tischlerei, Alchemie/Chemie (Periodensystem-Codex), Verzauberung/Runenkunde.
- Kampf: Nahkampf, Fernkampf, Magie, Verteidigung, Lebenspunkte; Auto-Kampf, Dungeons, Raid-Bosse.
- Forschung (Meta): Tech-Tree vom Rad bis Warp-Antrieb.

## 5. Wirtschaft & Systeme

Inventar/Bank (Stapel, Sortierung, Filter, Suche), NPC-Markt mit Angebot/Nachfrage, Ausrüstungsslots mit
Seltenheiten (Gewöhnlich → … → Legendär → _Peer-Reviewed_), Helfer (Gnome, Golems, Roboter, Praktikanten),
Pets (1/5000), Gebäude/Basis, Quests, Tägliche/Wöchentliche Aufträge, hunderte Achievements, Statistiken.

## 6. Prestige

1. Wiedergeburt (Weisheit, globaler Multiplikator) 2. Paradigmenwechsel (Tech-Tree-Reset, Naturgesetze wählbar)
2. Urknall (Multiversum-Upgrades). Jede Ebene bringt neue Mechaniken.

## 7. Memes & Humor

Mitochondrium-Item, Schrödingers Katze, „Aus- und wieder eingeschaltet?", „Ich bin kein Arzt, aber …",
Ladetipps („Korrelation ist keine Kausalität. Außer bei Kohle und Schmieden."), Newton-Apfel (+1 Intelligenz),
„Kaltfusions-Paper (nicht reproduzierbar)", Boss „Der Peer Reviewer #2", „Mehr Holz benötigt".
`src/data/flavor.ts` mit mindestens 150 Sprüchen.

## 8. „Sucht"-Design (fair)

Mehrere sichtbare Ziele, Zufallsbelohnungen, Glücks-Events, Juice (Popups, Level-Up-Animation, Sounds,
Partikel), Verflechtung der Skills, balancierte Kurz-/Mittel-/Langzeitziele. Kein Echtgeld, keine Dark Patterns.

## 9. UI/UX

Handy: 3D-Hintergrund, Tab-Leiste, Bottom-Sheets, Ereignis-Feed oben. Desktop: links Skills-Sidebar, Mitte
Welt + aktive Skill-Ansicht (Aktionen, Anforderungen, Belohnungen, XP/h), rechts Inventar/Ausrüstung/Log.
Header: Gold, Forschung, Prestige, Gesamtlevel. Tooltips mit genauen Werten, „Nerd-Modus", wählbares
Zahlenformat, Tastaturkürzel, Benachrichtigungen.

## 10. Architektur

`src/{engine,data,store,ui,scene,assets}`, `tests/`, `docs/{PLAN,BALANCING,CHANGELOG}.md`, `.github/workflows/`.
Engine kennt die Szene nicht. Balancing in `src/data/balance.ts`. Debug-Panel nur in Dev. Keine `any`.

## 10a. GitHub & Deployment

README, .gitignore, LICENSE (MIT), CLAUDE.md. CI bei Push/PR (Lint, Typecheck, Tests, Build), Pages-Deploy bei
Push auf `main`. Feature-Branches pro Phase, PRs mit Zusammenfassung. CLAUDE.md + CHANGELOG nach jeder Phase.

## 11. Phasen

1. Fundament 2. 3D-Welt 3. Handwerk 4. Kampf 5. Wissenschaft & Magie 6. Prestige 7. Feinschliff
   (Details siehe [PLAN.md](./PLAN.md)). Nach jeder Phase: Tests, Zusammenfassung, 3 Vorschläge.

## 12. Arbeitsweise

Bei unklaren Design-Entscheidungen fragen, sonst Annahmen in PLAN.md dokumentieren. Commit pro Schritt.
`npm run dev` muss immer laufen. Spielsprache Deutsch, i18n-fähig.
