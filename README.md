# Æ AETHERIUM – Von der Steinaxt zum Teilchenbeschleuniger

Ein augenzwinkerndes **Incremental-/Idle-RPG** im Browser, **mobile first** und auf Deutsch. Du beginnst als
Bauer mit einer Steinaxt auf einer kleinen 3D-Insel. Später baust du ein Dorf im Travian-Stil, schickst einen
Helden auf Abenteuer und kämpfst dich als Survivor-Roguelike durch den Ätherriss. Alles hängt zusammen und
greift ineinander.

**Jetzt spielen:** https://oe7set.github.io/aetherium/ (installierbar als App, läuft offline)

## Was dich erwartet (v1.25)

**🏝️ Die Insel**

- 18 Skills im Old-School-Stil (Level 99 bzw. 120 mit Prestige) und über 250 Aktionen.
- Sammeln: Holzfällen (20 Baumarten), Bergbau, Angeln, Landwirtschaft (Echtzeit-Beete, Mutationen), Jagen,
  Archäologie.
- Handwerk: Feuermachen, Kochen, Schmieden, Handwerk, Alchemie, Verzauberung, Arkanes.
- Kampf: Nahkampf, Fernkampf, Magie, Verteidigung, Lebenspunkte gegen 21 Monster in Dungeons mit Phasen-Bossen.
- 3D-Low-Poly-Insel (React Three Fiber) mit antippbaren Stationen, Pfaden, Strand, Fluss und Tag/Nacht.
  Sie wächst mit dem Fortschritt bis zum Teilchenbeschleuniger-Ring.
- Forschung mit Tech-Baum, Periodensystem-Codex (118 Elemente) und Helfern.
- Dynamischer Markt, Krämer und Werkzeuge.

**🏘️ Das Dorf (wie Travian)**

- 18 Rohstofffelder, 20 Gebäude, 7 Truppentypen, Bauschleifen.
- Raubzüge mit echter Kampfformel, Oasen annektieren, Invasionen abwehren.
- Kulturpunkte und bis zu 5 Dörfer.
- Weltkarte als Raster mit Lagern, Oasen, Ruinen, freien Tälern und Abenteuern, auch im Vollbild.
- Das Dorf stärkt die Insel (Tempo, XP, Gold), die Insel versorgt das Dorf über den Hafen.

**🦸 Der Held, einer für alles**

- Level, 4 Attribute, 6 Ausrüstungsplätze mit 18 Gegenständen in 3 Seltenheitsstufen, Gesundheit.
- Er wohnt im Dorf, verteidigt es, plündert mit und erobert Oasen.
- Abenteuer auf der Karte: automatisch erkunden oder **live als Echtzeit-Dungeon** spielen.

**🌀 Der Ätherriss (Survivor-Roguelike)**

- 15-Minuten-Läufe gegen Horden, 20 Waffen mit Evolutionen, 6 Biome, 6 Kampfstile, 19 Meta-Talente.
- **Wochenboss**: jede Woche eine neue Prüfung mit eigener Wochenregel und großer Belohnung.

**🎁 Belohnungen und Motivation**

- Tägliche Belohnung mit 7-Tage-Serie.
- Ruhmesleiter mit 50 Stufen, Chronik als Zielkette durch alle Systeme.
- **Sammelbuch** mit 14 Sets und Dauer-Boni, fast 300 Erfolge, Quests, Aufträge, Haustiere.
- Prestige in drei Ebenen: Wiedergeburt, Paradigmenwechsel, Urknall. Dorf, Held und Riss bleiben dabei erhalten.

**🎵 Atmosphäre**

- Prozedurale Musik ohne Audiodateien: je Bereich ein eigenes Thema (Insel, Dorf, Held, Riss).
- Soundeffekte, Konfetti, Belohnungs-Enthüllungen, Vibration.
- Über 200 humorvolle Texte.

**📱 Komfort**

- Offline-Fortschritt (24 h und mehr), Autosave, Export/Import.
- Akku-Modus mit Eco-Leistungsprofil (das Handy bleibt kühl) und 2D-Ansicht ohne 3D.
- **„Was jetzt?" 📌**: alles, was gerade auf dich wartet – über alle Systeme, mit Direktsprung.
- Schnellzugriff 🧭 zu jedem Bereich, Zurück-Taste schließt Fenster.

## Steuerung

| Aktion               | Handy                                                | Desktop                    |
| -------------------- | ---------------------------------------------------- | -------------------------- |
| Aktion starten       | Station auf der Insel antippen oder Skills → Starten | Klick / Skills-Liste links |
| Aktion beschleunigen | Aktionsleiste unten antippen                         | Klick oder **Leertaste**   |
| Aktion stoppen       | ■                                                    | **S**                      |
| Bereiche wechseln    | Tab-Leiste unten                                     | **1–6**                    |
| Überall hinspringen  | 🧭 oben links                                        | **K** oder **/**           |
| Fenster schließen    | ✕ oder Griff nach unten ziehen                       | **Esc**                    |
| Riss: laufen         | Daumen-Joystick                                      | **WASD** / Pfeiltasten     |

## Entwicklung

```bash
npm install
npm run dev        # Dev-Server (mit Debug-Panel im Menü)
npm test           # Vitest (Engine, Daten, Balancing-Bots)
npm run lint       # ESLint
npm run typecheck  # TypeScript strict
npm run build      # Produktions-Build nach dist/
```

Stack: TypeScript (strict), Vite, React, Zustand, React Three Fiber, break_eternity.js, vite-plugin-pwa.
Die Spiel-Engine ist reines TypeScript ohne React und DOM. Sie ist deterministisch testbar und rechnet auch
Offline-Fortschritt.

**Dokumentation:**

- [`docs/SYSTEME.md`](./docs/SYSTEME.md): wie alle Systeme zusammenhängen und was noch offen ist.
- [`CLAUDE.md`](./CLAUDE.md): Architektur und Konventionen.
- [`docs/CHANGELOG.md`](./docs/CHANGELOG.md): Änderungen.
- [`docs/BALANCING.md`](./docs/BALANCING.md): Balancing.
- [`docs/PLAN.md`](./docs/PLAN.md) und [`docs/PLAN-2.md`](./docs/PLAN-2.md): Pläne.

### Deployment

Jeder Push auf `main` baut und deployt automatisch auf GitHub Pages (`.github/workflows/deploy.yml`).
Einmalig nötig: **Settings → Pages → Source: „GitHub Actions"**.

## Lizenz

MIT, siehe [LICENSE](./LICENSE). Alle Inhalte sind selbst erstellt. Icons sind System-Emoji, Musik und Klänge
werden live im Browser erzeugt.
