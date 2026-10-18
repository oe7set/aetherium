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
