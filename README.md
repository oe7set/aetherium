# Æ AETHERIUM – Von der Steinaxt zum Teilchenbeschleuniger

Ein augenzwinkerndes **Incremental-/Idle-RPG** im Browser, **mobile first**. Du beginnst als Bauer mit
einer Steinaxt und arbeitest dich über Alchemie und Mittelalter-Handwerk bis zu Quantenphysik und
Teilchenbeschleunigern hoch. Vorbilder: RuneScape-Skilling, Melvor Idle, Cookie Clicker, Antimatter Dimensions.

**Spielen:** https://oe7set.github.io/aetherium/ (nach dem ersten Deploy von `main`)

## Features (v1.0 – alle 7 Phasen)

- **22 Skills** im Old-School-Stil (OSRS-XP-Kurve, Level 99 bzw. 120 mit Prestige): Holzfällen, Bergbau, Angeln,
  Landwirtschaft (Echtzeit + Mendel-Mutationen), Jagen, Arkanes Schürfen, Feuermachen, Kochen, Schmieden, Handwerk,
  Alchemie, Verzauberung, Nahkampf, Fernkampf, Magie, Verteidigung, Lebenspunkte.
- **3D-Low-Poly-Insel** (React Three Fiber) mit Spielfigur, antippbaren Stationen, Tag/Nacht und einer Welt, die mit
  dem Fortschritt wächst – bis zum Teilchenbeschleuniger-Ring. Akku-Modus mit 2D-Ansicht.
- **Kampf** mit 18 Monstern, 3 Dungeons und Phasen-Bossen wie _Der Peer Reviewer #2_; Ausrüstung bis _Peer-Reviewed_.
- **Forschung**: Tech-Baum mit 39 Technologien, **Periodensystem-Codex** mit allen 118 Elementen, **Helfer**.
- **Wirtschaft**: dynamischer Markt mit Angebot/Nachfrage, Krämer, Inventar mit Sortierung/Filter/Suche.
- **Prestige** in drei Ebenen: Wiedergeburt, Paradigmenwechsel (Naturgesetze wählen), Urknall.
- **Motivation**: 200+ Erfolge, Quests, Tages-/Wochenaufträge, Haustiere (1/5.000), Glücks-Events, Konfetti, Sounds.
- **Offline-Fortschritt** (24 h, per Forschung/Prestige erweiterbar), Autosave, Export/Import, **PWA** (installierbar).
- Deutsch, humorvoll, über 200 eigene Flavor-Texte.

## Steuerung

| Aktion               | Handy                                                | Desktop                    |
| -------------------- | ---------------------------------------------------- | -------------------------- |
| Aktion starten       | Station auf der Insel antippen oder Skills → Starten | Klick / Skills-Liste links |
| Aktion beschleunigen | Aktionsleiste unten antippen                         | Klick oder **Leertaste**   |
| Aktion stoppen       | ■                                                    | **S**                      |
| Tabs wechseln        | Tab-Leiste                                           | **1–5**                    |
| Panel schließen      | Griff antippen/runterziehen                          | **Esc**                    |

## Entwicklung

```bash
npm install
npm run dev        # Dev-Server (mit Debug-Panel im Menü)
npm test           # Vitest (Engine)
npm run lint       # ESLint
npm run typecheck  # TypeScript strict
npm run build      # Produktions-Build nach dist/
```

Architektur und Konventionen: [`CLAUDE.md`](./CLAUDE.md), Plan: [`docs/PLAN.md`](./docs/PLAN.md),
Balancing: [`docs/BALANCING.md`](./docs/BALANCING.md), Änderungen: [`docs/CHANGELOG.md`](./docs/CHANGELOG.md).

### Deployment

Jeder Push auf `main` baut und deployt automatisch auf GitHub Pages
(`.github/workflows/deploy.yml`). Einmalig nötig: **Settings → Pages → Source: „GitHub Actions"**.

## Lizenz

MIT – siehe [LICENSE](./LICENSE). Alle Inhalte sind selbst erstellt; Icons sind System-Emoji.
