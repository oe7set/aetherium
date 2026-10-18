# Balancing-Notizen

Alle Zahlen stehen in `src/data/balance.ts` (globale Knöpfe) bzw. in den Datendateien (pro Aktion/Item).

## XP-Kurve

OSRS-Formel: `xp(L) = ⌊¼ · Σ_{l=1}^{L-1} ⌊l + 300 · 2^(l/7)⌋⌋`. Level 92 ≈ halbe XP von 99 (13.034.431).
Tabelle bis 120 für spätere Prestige-Inhalte.

## Aktionsgeschwindigkeit

`t = basisZeit ÷ (Werkzeug × (1 + min(50 %, 0,5 % × Level über Anforderung)))`, mindestens 0,6 s.

- Werkzeugstufen: ×1 → ×1,15 → ×1,3 → ×1,5 → ×1,75 → ×2,05 → ×2,4 → ×2,85 → ×3,4 (Quanten).
- Werkzeugpreise wachsen ~×5 pro Stufe; jede Stufe soll sich nach ~10–30 min aktivem Spiel „verdienen".

## Erste Minuten (Ziel: Freischaltungen in Sekunden → Minuten → Stunden)

- Holzfällen Lvl 2 nach 9 Eichen (~27 s, mit Tippen ~15 s).
- Bronzeaxt (60 Gold) nach ~60 verkauften Eichen oder ein paar Erzen + Nest-Glück.
- Feuermachen: 40 XP/Scheit → Level 10 nach ~30 Scheiten. Absichtlich schnell: der erste große Aha-Moment.
- Kochen braucht Feuer: 1 Eiche = 60 s Brenndauer ≈ 20 Kochvorgänge.

## Wirtschaft

- Verkaufspreise ∝ Zeitaufwand. Kochrezepte mit Krämer-Zutaten sind etwa kostendeckend
  (Test: Ertrag ≤ 2× Einkauf) – Kochen lohnt sich über XP, nicht über Gold-Arbitrage.
- Inventarplätze: `100 · 1,35^(gekauft)` Gold, Start 20, Max 120.

## Lagerfeuer

- Brenndauer max. 1 h. Solange es brennt: +5 % XP auf alles; über 5 min Restzeit sinkt die Anbrenn-Chance um 15 %.
- Kohle (Bergbau 30) brennt 300 s → Bergbau speist Feuermachen/Kochen.

## Zufallsfunde

| Fund                        | Chance                         | Wofür                                |
| --------------------------- | ------------------------------ | ------------------------------------ |
| Vogelnest                   | 1/200 (höhere Bäume öfter)     | Eier, Äpfel, Goldring, Edelsteine    |
| Newton-Apfel                | 1/1000 → 1/400                 | +1 Intelligenz = +0,2 % XP dauerhaft |
| Edelsteine                  | 0,04–0,4 % × Erz-Multiplikator | Gold, später Verzauberung            |
| Versteinertes Mitochondrium | 1/5000                         | Meme-Trophäe, später Alchemie        |

## Offline

Gedeckelt auf 24 h, identische Simulation wie live (getestet).

## Kampf

- Spieler-Treffsicherheit `(Lvl + 8) · (Angriffsbonus + 64) · (1 + mods)`, Monster-Verteidigung `(Def + 9) · 64`,
  Trefferchance nach OSRS-Formel. Max. Treffer `⌊0,5 + (Lvl + 8)(Stärke + 64)/640 · (1 + mods)⌋`.
- XP: 4 pro Schadenspunkt auf Waffenstil (oder Verteidigung), 1,33 auf Lebenspunkte.
- LP-Skala wie OSRS (Start 10, Max 99); Essen heilt 2–30 LP. Auto-Essen standardmäßig bei 50 %.
- Tod: Kampf stoppt, volle LP, kein Itemverlust (keine Frust-Mechanik, Spec §8).

## Progressionskurve (Balancing-Pass Phase 6)

Analytisch berechnet in `tests/balance.test.ts` (beste Aktion + bestes Werkzeug je Level, ohne Klicks/Buffs/Prestige):

| Skill                            | Level 10 | Level 50 | Level 99 |
| -------------------------------- | -------- | -------- | -------- |
| Holzfällen                       | ~5 min   | ~1,2 h   | ~29 h    |
| Bergbau                          | ~4 min   | ~1,3 h   | ~35 h    |
| Angeln (mit Ruten)               | ~3 min   | ~1,0 h   | ~50 h    |
| Jagen (XP ×2,8, keine Werkzeuge) | ~2 min   | ~1,0 h   | ~54 h    |

Angeln bekam Angelruten als Werkzeuge, Jagen einen XP-Faktor, damit kein Sammel-Skill mehr als ~2× länger dauert.
Der Test schlägt fehl, wenn ein Skill unter 20 h oder über 400 h bis 99 rutscht.

## Prestige

- Wiedergeburt ab Gesamtlevel 250. Weisheit = ⌊√(Lauf-XP / 20.000) · (1 + Inflation)⌋.
  Beispiel: alle 22 Skills auf 40 → ~5 Weisheit; alles auf 99 → ~120 Weisheit.
- Jeder Weisheitspunkt (lebenslang, Ausgeben kostet nichts vom Bonus): +4 % XP, +2 % Forschung, +2 % Gold.
- Paradigmenwechsel ab 20 Technologien: +25 % Forschung je Wechsel, Naturgesetze mit Vor- und Nachteil.
- Urknall ab 3 Paradigmenwechseln: Splitter = 1 + ⌊Paradigmen/3⌋ + ⌊Weisheit gesamt/500⌋.

## Performance (Phase 7)

- Offline-Simulation: Extremfall 24 h bei minimaler Aktionsdauer (≈ 144.000 Abschlüsse) ≈ 0,8 s auf Desktop-CPU.
  Hot-Path-Optimierungen: Erfolgs-„Frontier" mit vorab aufgelösten Schlüsseln, Level-Bedingungen nur nach Level-Ups,
  gecachte Tech-Freischaltungen, Dauer einmal pro Schritt, Inventar-Fast-Path, internierte Modifier-Keys.
- 3D: Wald und Deko instanziert, Partikel gepoolt, Labels als DOM-Overlay, Render-Pause bei verstecktem Tab,
  Schatten nur auf „Hoch", Pixel-Ratio ≤ 2. Die Szene ist ein eigener Lazy-Chunk (~260 KB gzip).

## Riss-Leistung (gemessen 1.19)

Simulation (`stepRun`, 60 Schritte/s) mit voller Horde am Desktop-CPU: 339 Gegner ≈ 0,2 ms, 675 Gegner
≈ 0,5 ms pro Schritt – linear dank Spatial Hash (`EnemyGrid`). Selbst bei 5–8× langsameren Handys bleibt
die Simulation unter 4 ms; das Gegnerlimit von 360 lässt Reserven für das Zeichnen.

## Langzeit-Bot über alle Schleifen (1.24)

`tests/longterm.test.ts` spielt drei Tage: Insel (wechselt alle 6 h zwischen Holz, Erz, Fisch, verkauft,
kauft Werkzeuge), Dorf (Felder + Gebäude, kleine Miliz-Garnison), Held (Punkte in Kampfkraft, Abenteuer
automatisch). Ergebnis nach Tag 1 / 2 / 3: Gesamtlevel 260 / 296 / 317, Einwohner ~310 / 545 / 655,
Heldenstufe 11 / 19 / 27, Abenteuer 13 / 23 / 35, Invasionen 17 abgewehrt zu 6 verloren.

Gefundener Fehler: Abenteuer waren für frische Helden fast unschaffbar (Stufe 3 ≈ 18 % Erfolg, 16 von 20
gescheitert). Jetzt bemisst sich die Gefahr an der üblichen Stärke auf der Stufe (100 + 60 × Stufe):
gleiche Stufe ≈ 62 %, schwer ≈ 51 %; Abenteuer erscheinen rund um die Heldenstufe.
