# AETHERIUM – Projektplan

> Von der Steinaxt zum Teilchenbeschleuniger. 3D-Incremental-RPG im Browser, mobile first.
> Die vollständige Projektvorgabe steht in [`SPEC.md`](./SPEC.md).

## Architektur in einem Satz

`src/engine` ist pure TypeScript-Logik ohne React/WebGL, `src/data` beschreibt alle Inhalte als
typisierte Daten, `src/store` (Zustand) verbindet Engine und UI, `src/ui` ist das HTML-Overlay,
`src/scene` (ab Phase 2) liest nur den State und sendet Aktionen.

```
UI / Szene ──dispatch(action)──▶ store ──▶ engine (pure) ──▶ neuer GameState + GameEvents
     ▲                                                                │
     └──────────────────────────── subscribe ◀────────────────────────┘
```

### Kernentscheidungen

| Thema         | Entscheidung                                                                                                                                                                                     | Begründung                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Simulation    | **Ereignisgesteuertes `advance(state, dt, rng)`**: springt von Aktions-Abschluss zu Aktions-Abschluss statt fester Mini-Schritte                                                                 | Live-Tick (10/s), Offline-Fortschritt (bis 24 h) und Debug-Zeitvorspulen nutzen exakt denselben Code → keine Abweichungen zwischen online und offline |
| Tick          | `setInterval` 100 ms im Store-Loop, Delta-Zeit über `performance.now()`                                                                                                                          | Spec: 10 Ticks/s. Fortschrittsbalken werden per `requestAnimationFrame` interpoliert, ohne React-Re-Render                                            |
| Zufall        | Seedbarer PRNG (mulberry32) als Parameter                                                                                                                                                        | Tests sind deterministisch                                                                                                                            |
| Große Zahlen  | `break_eternity.js` (`Decimal`) für **Gold** (und später Prestige-Währungen)                                                                                                                     | Gold wird exponentiell wachsen. XP bleibt `number` (OSRS-Kurve endet bei ~200 Mio., weit unter 2^53), Item-Mengen ebenfalls `number`                  |
| State-Updates | Engine mutiert eine Kopie (`cloneState`) und gibt Events zurück                                                                                                                                  | Einfach, schnell genug (State ist klein), Store bleibt immutabel                                                                                      |
| Speichern     | `localStorage`, Autosave 30 s + `visibilitychange`/`pagehide`; Envelope `{ v, savedAt, data }`, Migrationskette `migrations[v] : (old) => new`                                                   | Spec 2                                                                                                                                                |
| Export        | Base64 von UTF-8-JSON mit Präfix `AETH1:`                                                                                                                                                        | Copy/Paste-fähig, robust gegen Umlaute                                                                                                                |
| Offline       | Beim Laden `advance(state, min(Δt, offlineCap))`, Zusammenfassung (XP, Items, Level-Ups) als Modal ab 60 s                                                                                       | Spec 2                                                                                                                                                |
| i18n          | UI-Texte via `t('key', params)` aus `src/i18n/de.ts`; Inhaltsnamen stehen als deutsche Defaults in den Daten und können später per ID-Overlay übersetzt werden (`tContent(id, field, fallback)`) | Deutsch zuerst, Englisch später ohne Datenumbau                                                                                                       |
| Icons         | Emoji (Phase 1), ab Phase 2/3 eigene SVG/Low-Poly                                                                                                                                                | Keine Copyright-Assets, null Bytes                                                                                                                    |

## Annahmen (dokumentiert, weil die Spec sie offen lässt)

1. **Eine aktive Aktion gleichzeitig** (wie Melvor). Mehr Parallelität kommt später über Helfer (Phase 5).
2. **Kochen braucht ein brennendes Lagerfeuer.** Feuermachen legt Brennstoff nach (Holz/Kohle → Brenndauer).
   Solange das Feuer brennt, gibt es den Buff „Lagerfeuer-Wärme" (+5 % XP auf alles) und Kochen verbrennt
   seltener. So sind Holzfällen → Feuermachen → Kochen sinnvoll verflochten. Bergbau liefert Kohle (lange
   Brenndauer) und Verkaufsware/Edelsteine, bis in Phase 3 Schmelzen dazukommt.
3. **Zutaten fürs Kochen in Phase 1:** Zufallsfunde beim Holzfällen (Äpfel, Pilze, Vogelnester mit Eiern)
   plus ein einfacher **Krämer** (feste Preise), der Rohzutaten, Werkzeuge und Inventarplätze verkauft und
   alles ankauft. Der „echte" Markt mit schwankenden Preisen folgt in Phase 3.
4. **Werkzeuge** werden in Phase 1 beim Krämer gekauft (Gold-Sink). Ab Phase 3 kann man sie schmieden.
5. **Inventar**: unbegrenzte Stapel, aber begrenzte **Plätze** (Start 20, kaufbar). Ist das Inventar voll
   und ein neuer Item-Typ fällt an, stoppt die Aktion mit Hinweis („Mehr Taschen benötigt").
6. **Klick-Beschleunigung:** Jedes Tippen auf die aktive Aktion schiebt den Fortschritt um 12 % der
   Aktionsdauer vor (max. 8 Tipps/s zählen). Später durch Automatisierung irrelevant – klassische Kurve.
7. **Aktionsdauer** = Basiszeit ÷ (Werkzeugfaktor × (1 + 0,5 % je Level über der Anforderung)), gedeckelt.
8. **Offline-Deckel**: 24 h (Konstante in `balance.ts`, später per Upgrade erhöhbar).
9. Das Repo ist anfangs leer; der erste Phasen-Branch wird zur Basis. Deploy läuft bei Push auf `main`
   (GitHub Pages muss in den Repo-Settings auf „GitHub Actions" stehen).

## Phasen

### Phase 1 – Fundament ✅ (diese Session)

- [x] Vite + React + TS strict, ESLint + Prettier, Vitest
- [x] GitHub Actions: CI (Lint, Typecheck, Test, Build) + Pages-Deploy
- [x] Engine: XP-Kurve (OSRS), `advance`, Aktionen mit Inputs/Outputs/Zufallsdrops/Anbrennen, Buffs, Klicks
- [x] Save/Load mit Migrationen, Autosave, Export/Import, Offline-Fortschritt + Zusammenfassung
- [x] Skills: Holzfällen, Bergbau, Feuermachen, Kochen (jeweils bis Lvl 99 mit Inhalten)
- [x] Inventar (Plätze, Sortierung, Filter, Suche, Verkaufen), Krämer (Werkzeuge, Zutaten, Taschen)
- [x] Mobiles UI-Gerüst: Header, Ereignis-Feed, Tab-Leiste, Bottom-Sheets; Desktop-3-Spalten-Layout
- [x] Zahlenformate (kurz / wissenschaftlich / technisch), Einstellungen, Debug-Panel (nur Dev)
- [x] Erste Flavor-Texte (Ladetipps, Level-Up-Sprüche, Item-Beschreibungen)

### Phase 2 – 3D-Welt ✅

R3F-Insel (lazy), Instancing, Spielfigur mit Animationen, antippbare Stationen, Touch-Kamera,
Qualitätsstufen mit Auto-Erkennung, Akku-Modus, Render-Pause, Tag/Nacht.

### Phase 3 – Handwerk ✅

Schmieden (Barren, Werkzeuge, Waffen, Rüstung, Schmuck), Angeln (Schrödingers Fisch), dynamischer Markt,
130+ Erfolge mit Boni, Modifikator-System, Glücks-Events, Engine-Runner.

### Phase 4 – Kampf ✅

5 Kampf-Skills, 18 Monster in 6 Gebieten, 3 Dungeons mit Phasen-Bossen (Peer Reviewer #2), Handwerk,
8 Ausrüstungsslots, Auto-Essen, 3D-Arena.

### Phase 5 – Wissenschaft & Magie ✅

Tech-Baum (39 Techs), Periodensystem-Codex (118 Elemente), Alchemie, Verzauberung, Landwirtschaft mit
Mutationen, Jagen, Arkanes Schürfen, Helfer.

### Phase 6 – Prestige ✅

Wiedergeburt (Weisheit, Ahnen-Talente, Level 120), Paradigmenwechsel (Naturgesetze), Urknall (Multiversum),
Balancing-Pass mit analytischem Progressionstest.

### Phase 7 – Feinschliff ✅

Haustiere, Quests, Tages-/Wochenaufträge, WebAudio-Sounds, Benachrichtigungen, Konfetti, Long-Press-Tooltips,
PWA, wachsende Welt, erweiterte Statistiken.

## Weitere Annahmen ab Phase 3

10. **Ein Modifikator-System** (`engine/modifiers.ts`) bündelt alle Boni als flache Keys (`xp.mining`, `speed` …).
11. **Engine-Runner**: Aktion, Kampf und Helfer laufen als parallele Runner im selben ereignisgesteuerten Loop.
12. **Tod im Kampf** kostet keine Items (keine Frust-Mechanik).
13. **Skills hinter Forschung**: Landwirtschaft, Jagen, Alchemie, Verzauberung, Arkanes Schürfen werden über den Tech-Baum
    freigeschaltet – so bekommt die Forschung früh einen spürbaren Zweck.
14. **Aufträge** laufen in Echtzeit (Kalendertag/-woche), nicht in Simulationszeit.
15. **Prestige-Bonus** hängt an der lebenslang verdienten Weisheit; Ausgeben für Talente kostet keinen Bonus.

## Ideen für danach

- Englische Übersetzung über `tContent`-Overlays.
- Gilden-/Leaderboard-Light (Export-Codes vergleichen), saisonale Events.
- Mehr 3D-Modelle (eigene glTF), Animationen pro Monster, Wetter.
