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

| Thema | Entscheidung | Begründung |
| --- | --- | --- |
| Simulation | **Ereignisgesteuertes `advance(state, dt, rng)`**: springt von Aktions-Abschluss zu Aktions-Abschluss statt fester Mini-Schritte | Live-Tick (10/s), Offline-Fortschritt (bis 24 h) und Debug-Zeitvorspulen nutzen exakt denselben Code → keine Abweichungen zwischen online und offline |
| Tick | `setInterval` 100 ms im Store-Loop, Delta-Zeit über `performance.now()` | Spec: 10 Ticks/s. Fortschrittsbalken werden per `requestAnimationFrame` interpoliert, ohne React-Re-Render |
| Zufall | Seedbarer PRNG (mulberry32) als Parameter | Tests sind deterministisch |
| Große Zahlen | `break_eternity.js` (`Decimal`) für **Gold** (und später Prestige-Währungen) | Gold wird exponentiell wachsen. XP bleibt `number` (OSRS-Kurve endet bei ~200 Mio., weit unter 2^53), Item-Mengen ebenfalls `number` |
| State-Updates | Engine mutiert eine Kopie (`cloneState`) und gibt Events zurück | Einfach, schnell genug (State ist klein), Store bleibt immutabel |
| Speichern | `localStorage`, Autosave 30 s + `visibilitychange`/`pagehide`; Envelope `{ v, savedAt, data }`, Migrationskette `migrations[v] : (old) => new` | Spec 2 |
| Export | Base64 von UTF-8-JSON mit Präfix `AETH1:` | Copy/Paste-fähig, robust gegen Umlaute |
| Offline | Beim Laden `advance(state, min(Δt, offlineCap))`, Zusammenfassung (XP, Items, Level-Ups) als Modal ab 60 s | Spec 2 |
| i18n | UI-Texte via `t('key', params)` aus `src/i18n/de.ts`; Inhaltsnamen stehen als deutsche Defaults in den Daten und können später per ID-Overlay übersetzt werden (`tContent(id, field, fallback)`) | Deutsch zuerst, Englisch später ohne Datenumbau |
| Icons | Emoji (Phase 1), ab Phase 2/3 eigene SVG/Low-Poly | Keine Copyright-Assets, null Bytes |

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

### Phase 2 – 3D-Welt
R3F + drei lazy geladen, Low-Poly-Insel mit Instancing, Spielfigur mit Lauf-/Arbeitsanimation,
klickbare Bäume/Felsen/Feuer, Touch-Kamera (Drehen/Pinch), Qualitätsstufen mit Auto-Erkennung,
Akku-Modus (3D aus), Render-Pause bei verstecktem Tab, Tag/Nacht.

### Phase 3 – Handwerk
Schmelzen, Schmieden (Werkzeuge ersetzen Krämer-Käufe), Angeln (Schrödingers Fisch), Markt mit
Angebot/Nachfrage, Achievements, `flavor.ts` auf ≥150 Einträge.

### Phase 4 – Kampf
Gebiete, Monster, Ausrüstungsslots + Seltenheiten, Food heilt, Loot-Tabellen, erster Boss in 3D.

### Phase 5 – Wissenschaft & Magie
Forschungspunkte + Tech-Tree, Alchemie (Periodensystem-Codex), Verzauberung, Helfer/Automatisierung.

### Phase 6 – Prestige
Wiedergeburt (Weisheit), Paradigmenwechsel (Naturgesetze), Balancing-Pass.

### Phase 7 – Feinschliff
Juice, Sounds (WebAudio), Quests, Pets, Statistiken, PWA, wachsende Welt, Performance-Pass.
