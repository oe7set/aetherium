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

## Masterplan 3.0: neue Skills (1.57)

Vergleich der rohen XP/h (beste Aktion je Stufe, ohne Materialkosten) gegen Holzfällen/Bergbau/Schmieden:

- **Diebeskunst**: Fehlschläge geben nur 10 % XP, an der Stufengrenze scheitern ~45 %. Deshalb ×1,6 auf alle
  Diebstahl-XP (`THIEVING_XP_MULT`) – effektiv landet sie zwischen Holzfällen und Bergbau, dazu kommt Gold.
- **Kartografie**: Kartieren ×1,8 (`SURVEY_XP_MULT`, Bot: Stufe ~45 in 6 h statt 41; Holzfällen 65 – Kartieren ist der Nebenskill mit Pergamentkosten); Expeditionen verbrauchen Karten und Brot und zahlen jetzt
  das 2–3-Fache (Ruinen 900, Gipfel 1800, Schlund 4200 XP) – sonst wären sie schlechter als Kartieren.
- **Baukunst**: Eichenbretter 6 → 8 XP für einen weniger zähen Start; die großen Sprünge kommen über Möbel und
  die XP-Batzen der Inselbauten.
- **Beschwörung** liegt roh am höchsten, ist aber durch Talismane (Kampf-Drops) gedrosselt – wie das Vorbild.
- Helden-Abenteuer: vier Heldenstufen pro Biom, der Frostgipfel (Schwierigkeit 11) erst ab Stufe 25.

Langzeit-Bot „neue Skills, je 6 Stunden" (`tests/longterm.test.ts`, ab Stufe 1, ohne Werkzeuge/Boni):

| Skill                  | Stufe nach 6 h | Gold/h  | Bemerkung                                                             |
| ---------------------- | -------------- | ------- | --------------------------------------------------------------------- |
| Holzfällen (Vergleich) | 65             | –       | Holz unverkauft                                                       |
| Diebeskunst            | 60             | ~32 000 | etwa wie verkauftes Holz derselben Stufe                              |
| Juwelierkunst          | 35             | –       | nur Kiesel/Funde, ohne Geoden aus dem Bergbau                         |
| Kartografie            | 44             | −3 600  | Pergament gekauft; Karten unverkauft (Küstenkarte 14 vs. Pergament 6) |
| Kopfgeldjagd           | 25             | ~12 000 | Kampfstufe 30, Bronzeschwert                                          |
| Bogenbau (1.66)        | 44             | –       | Leder, Holz, Barren, Federn gestellt; Bögen/Bolzen unverkauft         |
| Viehzucht (1.66)       | 49             | –       | Feldfrüchte gestellt, Stall Stufe 1; Produkte unverkauft              |
| Seefahrt (1.76)        | 52             | –       | Brot gestellt, Floß/Startschiff; Fracht unverkauft                    |
| Sternkunde (1.76)      | 64             | –       | ohne Zutaten, inkl. Nachtbonus (etwa ein Drittel der Zeit)            |
| Gewandtheit (1.76)     | 53             | –       | mit Stürzen; der Skill gibt dafür globales Tempo                      |
| Erfinden (1.76)        | 43             | –       | nur Schrott-Zerlegen; Erfindungen geben große XP-Batzen               |

Masterplan 5.0 (1.67–1.76): Weltboss-HP = 30 000 × (1 + Kampfstufe/50) × (1 + 0,25 je Sieg); typische
Schadensraten zur Kampfstufe 40: Insel ~4/s, Dorf ~3/s, Held ~5/s (zusammen ~45 000/h) plus Schläge – ein
aktiver Spieler schafft den Boss in 30–45 Minuten, ein passiver meist knapp oder gar nicht. Verstärkung:
+5 %/Stufe auf Ausrüstungswerte, Kosten verdoppeln sich, ab +6 Risiko – bewusst ein Gold-Abfluss im Endgame.

Masterplan 4.0 (1.61–1.66): Bogenbau und Viehzucht liegen im Bot zwischen Kartografie und Diebeskunst – sie
kosten Rohstoffe aus anderen Skills und sollen sich deshalb nicht langsamer anfühlen. Zunftaufträge zahlen das
Dreifache des Verkaufswerts (+10 % je Rang) und halbe Rezept-XP: lohnender als Verkaufen, aber kein XP-Ersatz.
Flüche geben +15–30 % Essenz je Fluch; Rissläufer-Meilensteine sind bewusst flach (+0,2 % Schaden je Stufe), die
großen Sprünge kommen über Relikte und Meilenstein-Perks.

## Einstieg & Wirtschaft (Phase 46–47, v1.84)

**Einstiegs-Bot** (`tests/onboarding.test.ts`): neuer Spielstand, 2 h, alle 5 min ein Blick – rotiert Holzfällen,
Feuermachen, Fischen, Kochen, Bergbau, Schmieden, holt fehlende Zutaten selbst (wie der Rezept-Sprung), kauft
Werkzeuge, baut Felder und claimt Chronik/Meilensteine/Reichsränge.

| Minute | Skills ≥ 10 (von 6) | Gold verdient | Werkzeuge | Reichsrang |
| ------ | ------------------- | ------------- | --------- | ---------- |
| 15     | 3                   | ~3 k          | 9         | 0          |
| 60     | 5                   | ~18 k         | 13        | 1          |
| 120    | 6                   | ~60 k         | 17        | 2          |

Befund: Schmieden blieb ohne Zinn auf Stufe 1 – Bronze braucht zwei Erze. Das Spiel löst das über den Rezept-Sprung
und „Was jetzt?"; der Bot macht es jetzt genauso.

**Dorf ↔ Insel im 3-Tage-Bot**: Mit Inselwaren-Pflicht ab Stufe 10 blieb das Hauptgebäude bei 9 stehen, solange der
Bot alles verkaufte. Holt er die Waren (Steinblöcke über Granit → Baukunst 10, Bretter, Nägel), erreicht er nach 3
Tagen Hauptgebäude 14, 567 statt 497 Einwohner und Gesamtlevel 368 statt 336 – die Verzahnung zahlt sich aus.
„Was jetzt?" meldet daher „… wartet auf Inselwaren" mit Sprung zum passenden Skill.

**Gold**: Nach 3 Tagen ~3 Mio. Gold beim Bot, der nur Werkzeuge kauft. Echte Senken danach: Werkzeugstufen
(1,5 Mio. / 25 Mio.), Verstärkung (250 · 2^Stufe Gold je Versuch, ab +6 mit Runenbarren), Sofortbau im Dorf,
Inventarplätze, Wanderhändler (Preise liegen 2–4× über dem Verkaufswert – kein Weiterverkaufs-Trick).

## Wochen-Bot (Phase 50, v1.86)

`tests/week.test.ts`: 7 Tage, stündlicher Blick. Spielt reihum den niedrigsten von 20 Skills, holt Inselwaren fürs
Dorf, liefert an Großprojekte nur, wenn ein Abschnitt fertig wird, claimt Meilensteine, Reichsränge und Chronik,
kauft beim Wanderhändler und holt Dorflieferungen.

| Tag | Gesamtlevel | Einwohner | Held | Reichspunkte | Reichsrang | Meilensteine | Erfolge |
| --- | ----------- | --------- | ---- | ------------ | ---------- | ------------ | ------- |
| 1   | 520         | 169       | 18   | 989          | 4          | 26           | 95      |
| 3   | 692         | 495       | 37   | 1510         | 5          | 36           | 119     |
| 5   | 795         | 721       | 50   | 1747         | 6          | 38           | 125     |
| 7   | 842         | 817       | 58   | 1883         | 6          | 40           | 134     |

Gefundene und behobene Engpässe:

- **Lager blockierte das Dorf**: Stufe 10 aller Gebäude verlangte Inselwaren; ohne Lager 10 kosteten höhere Felder
  mehr, als das Lager fasst → Stillstand bei ~500 Einwohnern. Lager, Kornspeicher und Versteck brauchen Inselwaren
  jetzt erst ab ¾ der Höchststufe.
- **Reichsränge 4 → 5 dauerten 4+ Tage**: Schwellen der mittleren Ränge gesenkt (600/900/1200/1600/2200/3000/
  4000/5200/7000), damit etwa alle 1–2 Tage ein Aufstieg kommt.
- **Volles Inventar stoppt jedes Handwerk** (beim Bot: Diebesbeute) – „Was jetzt?" meldet das; der Bot räumt
  jetzt auf wie ein Spieler.
- **Großprojekte vs. Dorf**: „Alles Vorhandene liefern" kann Waren verbrauchen, die das Dorf braucht – bewusste
  Entscheidung des Spielers, der Bot liefert nur, wenn ein Abschnitt fertig wird.
