# Æ AETHERIUM – Von der Steinaxt zum Teilchenbeschleuniger

Ein augenzwinkerndes **Incremental-/Idle-RPG** im Browser, **mobile first**. Du beginnst als Bauer mit
einer Steinaxt und arbeitest dich über Alchemie und Mittelalter-Handwerk bis zu Quantenphysik und
Teilchenbeschleunigern hoch. Vorbilder: RuneScape-Skilling, Melvor Idle, Cookie Clicker, Antimatter Dimensions.

**Spielen:** https://oe7set.github.io/aetherium/ (nach dem ersten Deploy von `main`)

## Stand: Phase 1 – Fundament

- 🪓 Holzfällen, ⛏️ Bergbau, 🔥 Feuermachen, 🍳 Kochen – jeweils mit Inhalten bis Level 99 (OSRS-XP-Kurve)
- Lagerfeuer-Mechanik: Brennstoff nachlegen → +5 % XP auf alles, Kochen braucht Feuer
- Zufallsfunde (Vogelnester, Newton-Äpfel, Edelsteine, versteinerte Mitochondrien …)
- Inventar mit Plätzen, Sortierung, Filter, Suche; Krämer mit Zutaten, Werkzeugen und Taschen
- Offline-Fortschritt (bis 24 h) mit „Während du weg warst …"-Zusammenfassung
- Autosave (30 s + beim Schließen), Export/Import als Base64-Code
- Mobiles UI mit Tab-Leiste und Bottom-Sheets, Desktop-Layout mit drei Spalten
- Die 3D-Welt (React Three Fiber) folgt in Phase 2 – bis dahin gibt es eine antippbare 2D-Insel.

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
