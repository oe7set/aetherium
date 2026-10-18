# AETHERIUM 2.0 – Masterplan „Reich, Riss & Ruhm"

> Erweiterungsplan nach v1.0. Drei große Spielschleifen greifen ineinander:
> **Skilling-Idle** (bestehend) · **Kolonie** (Siedler/Catan-artige Wirtschaftssimulation) ·
> **Ätherriss** (Roguelike-Action-Kampf mit Vampire-Survivors-Mechanik).
> Dazu ein kompletter **Look-Overhaul**, damit sich alles wie _ein_ großes, cooles Spiel anfühlt.

---

## 0. Leitidee: Ein Kreislauf, drei Bühnen

```
            ┌──────────── Rohstoffe (Holz, Erz, Getreide …) ────────────┐
            ▼                                                           │
   ┌─────────────────┐   Kolonialwaren, Gebäude-Boni   ┌──────────────────────┐
   │  SKILLING-IDLE  │ ◀──────────────────────────────▶ │       KOLONIE        │
   │ (Insel, Skills) │   Siedler-Rohstoffe, Ruhm      │ (Hex-Karte, Würfel,  │
   └─────────────────┘                                │  Bauen, Handel, KI)  │
            ▲  │ Ausrüstung, Essen, Kampf-Level        └──────────────────────┘
            │  ▼                                              ▲   │
   ┌──────────────────────────────┐   Riss-Essenz, Beute,     │   │ Verteidigung, Türme,
   │          ÄTHERRISS            │──── Artefakte ───────────┘   │ Tributzahlungen
   │ (Survivor-Arena, Roguelike)   │◀───────────────────────────────┘
   └──────────────────────────────┘   Riss-Invasionen bedrohen die Kolonie
```

**Designregeln**

1. **Jede Schleife produziert etwas, das die anderen brauchen.** Keine Insel bleibt isoliert.
2. **Jede Schleife hat eine eigene Meta-Progression** (Skill-Level, Kolonie-Ruhm, Riss-Upgrades) – alle drei zahlen auf
   den globalen Fortschritt (Gesamtlevel, Weisheit, Erfolge) ein.
3. **Idle-tauglich bleibt alles:** Kolonie läuft offline weiter (Würfelwürfe in Simulationszeit), der Riss ist aktives
   Spiel, liefert aber „Echo-Läufe" (automatische Mini-Läufe) für Spieler, die nicht aktiv spielen wollen.
4. **Mobile first** auch für Action: virtueller Joystick, Auto-Angriff, Läufe ≤ 15 Minuten, jederzeit pausierbar.
5. **Fair:** keine Echtgeld-Mechaniken, keine Strafen fürs Abwesend-Sein.

---

## Phase 8 – Look-Overhaul „Aether-Glanz" (Design-System)

Ziel: Das Spiel soll auf den ersten Blick hochwertig, magisch-wissenschaftlich und „voll" wirken.

### 8.1 Design-System

- **Farb- und Material-Tokens**: tiefes Nacht-Indigo als Basis, Aether-Cyan + Gold als Akzente, Glas-Panels
  (Backdrop-Blur, feine Lichtkanten, innere Glows), Rarity-Farben als Lichtsäume.
- **Typografie**: markante Display-Schrift für Titel (selbst gehostet bzw. Systemfallback), Ziffern tabellarisch,
  Zahlen-Animation (Hochzählen) für Gold/XP.
- **Komponenten-Bibliothek**: Panel, Card, Badge, Ribbon, Stat-Pill, Progress (mit Glanz-Sweep), Button-Varianten
  (Primary-Glow, Gold, Danger, Ghost), Tab-Bar mit aktivem Leucht-Indikator, Item-Frames mit Rarity-Glow und Shimmer.
- **Hintergründe**: animierter Aether-Nebel (CSS-Gradient-Mesh + Sterne-Parallax) hinter allen Panels.
- **Bewegung**: Panel-Übergänge (Slide/Fade), gestaffelte Listen-Einblendung, Hover/Press-Feedback, „Reduced Motion".
- **Ikonografie**: einheitliche Rahmen für Emojis (Kreis-Badge mit Verlauf), Kategorie-Farben pro Skill.

### 8.2 3D-Aufwertung

- Wasser mit animiertem Wellen-Shader und Schaumrand, weichere Himmelsverläufe, Wolken.
- Post-Processing (nur „Hoch"): Bloom für Feuer, Kristalle, Portal, Beschleuniger.
- Ambient-Partikel (Glühwürmchen nachts, Pollen tagsüber), Vogelschwärme.
- Kamera-Fahrten: sanftes Heranzoomen an die aktive Station (abschaltbar).

### 8.3 Startbildschirm & Onboarding

- Titelbildschirm mit Logo-Animation, „Weiterspielen", Spielstand-Info.
- Geführtes Onboarding (5 Schritte) mit Zeigern auf UI-Elemente.

### 8.4 Reich-Übersicht („Reichsbuch")

- Neue Startseite im Menü: alle Schleifen auf einen Blick (aktive Aktion, Kolonie-Status, Riss-Bestwerte, nächste
  Ziele, einlösbare Belohnungen).

---

## Phase 9 – Kolonie „Neu-Aetherium" (Siedler/Catan-System)

### 9.1 Kernmechanik (Catan-Kern)

- **Hex-Karte** (19 Felder, prozedural pro Partie): Wald (Holz), Lehmgrube (Lehm), Weide (Wolle), Acker (Getreide),
  Gebirge (Erz), Aetherquelle (Aether, Sonderressource), Wüste (Räuber-Start).
- **Zahlenchips 2–12**, **Würfelwurf** alle _N_ Sekunden (Echtzeit/Simulationszeit, auch offline).
- **Siedlungen** an Ecken (Abstandsregel), **Städte** als Ausbau, **Straßen** an Kanten.
- **Klassische Kosten**: Straße = Holz + Lehm; Siedlung = Holz + Lehm + Wolle + Getreide; Stadt = 2 Getreide + 3 Erz;
  Entwicklungskarte = Wolle + Getreide + Erz.
- **Räuber** bei der 7: blockiert ein Feld, Ressourcen über 7 Karten werden halbiert. Thematisch: „Reviewer #2" oder
  „Steuereintreiber". Ritterkarten versetzen ihn.
- **Handel**: Bank 4:1, Häfen 3:1 bzw. 2:1 (spezifisch), Spielerhandel mit KI-Gegnern (Angebote kommen rein).
- **Entwicklungskarten**: Ritter, Straßenbau, Erfindung, Monopol, Siegpunkt – mit eigenem Humor.
- **Siegpunkte**: Siedlung 1, Stadt 2, Längste Straße 2, Größte Rittermacht 2, Siegpunktkarten. Sieg bei 10.

### 9.2 KI-Gegner („Online-Gefühl")

- 3 Gegner-Kolonien mit Persönlichkeiten (z. B. _Baronin von Bürokratia_, _Gnom-Konsortium_, _Prof. Dr. Expansion_),
  eigene Bau-Strategien, Handelsangebote, Chat-Sprüche im Feed, Rangliste der Partie.
- Gleicher Würfel für alle; sie bauen in ihren Zügen (gleiche Regeln, deterministisch per Seed).

### 9.3 Siedler-Wirtschaft (Produktionsketten)

- Zusätzlich zum Catan-Kern: **Gebäude auf eigenen Siedlungsplätzen** mit Produktionsketten
  (Sägewerk: Holz → Bretter, Mühle: Getreide → Mehl, Bäckerei: Mehl → Brot, Schmelze: Erz → Barren,
  Weberei: Wolle → Tuch, Aether-Raffinerie: Aether → Essenz, Werkstatt, Akademie).
- **Siedler-Bevölkerung**: Häuser erzeugen Siedler, Gebäude brauchen Arbeiter; Versorgung mit Brot/Fisch steigert
  Produktivität (Siedler-Zufriedenheit).
- **Lagerhaus** begrenzt Bestände (Upgrade-Stufen).

### 9.4 Partien & Meta

- **Partie** endet bei 10 Siegpunkten (oder Aufgabe). Belohnung: **Ruhm** (Meta-Währung), Truhen, Titel.
- **Ruhm-Talente** (permanent): Startbonus-Ressourcen, bessere Häfen, zusätzlicher Startsiedler, schnellere Würfel,
  Räuber-Immunität für 1 Feld, bessere KI-Handelskurse.
- **Kartenvarianten** (freischaltbar): Inselwelt, Vulkanland, Quantenfeld (Felder wechseln Ressource).
- **Saisons** (später): wöchentliche Seed-Karte mit Zusatzregel.

### 9.5 Verflechtung

- **Import**: Holz/Erz/Getreide aus dem Skilling-Inventar können in Kolonie-Ressourcen umgewandelt werden
  (Hafen-Lieferung, Kurs abhängig von Tech/Ruhm).
- **Export**: Kolonialwaren (Bretter, Tuch, Brot, Aether-Essenz) gehen ins Hauptinventar und werden für Alchemie,
  Verzauberung und Handwerk gebraucht.
- **Gebäude-Boni**: z. B. Sägewerk Stufe 3 → +5 % Holzfällen; Akademie → +Forschung; Kaserne → Riss-Startwaffen-Level.
- **Riss-Invasionen**: gelegentlich greifen Riss-Kreaturen die Kolonie an – Türme/Mauern verteidigen, sonst geht
  ein Gebäude in den „beschädigt"-Zustand (reparierbar). Ein Riss-Lauf „Gegenschlag" beendet die Invasion sofort.

---

## Phase 10 – Ätherriss (Roguelike-Action, Vampire-Survivors-Mechanik)

### 10.1 Kern

- **Top-Down-Arena** in Echtzeit (Canvas 2D mit eigener Render-Schleife, 60 FPS-Ziel), Kamera folgt dem Helden.
- **Steuerung**: virtueller Joystick (Touch, überall auf dem Bildschirm), WASD/Pfeiltasten am Desktop.
- **Auto-Angriff**: Waffen feuern selbstständig; der Spieler positioniert sich.
- **Gegnerwellen** skalieren mit der Zeit (Spawn-Kurven, Elite-Gegner, Schwärme, Minuten-Bosse).
- **XP-Kristalle** → Level-Up → **Wahl aus 3–4 Upgrades** (neue Waffe, Waffen-Level, Passiv), Rerolls/Banish/Skip.
- **Waffen-Evolutionen**: Waffe auf Max-Level + passendes Passiv → Truhe von Elite/Boss liefert die Evolution.
- **Laufzeit** 15 Minuten; bei 15:00 erscheint der „Prüfer" (Endgegner). Pause jederzeit.

### 10.2 Inhalte (Startumfang)

- **Waffen** (12+): Axtwurf, Spitzhacken-Bumerang, Feuerkreis, Runen-Orbit, Pfeilhagel, Blitzkette, Säureflasche,
  Kraftfeld-Aura, Mana-Laser, Pendelklinge, Gravitationsbrunnen, Teilchenstrahl.
- **Passive** (10+): Kraft, Tempo, Bereich, Dauer, Abklingzeit, Projektilanzahl, Magnet, Rüstung, Regeneration, Glück.
- **Evolutionen** (6+): z. B. Feuerkreis + Dauer → _Kontrollierte Kernfusion_; Runen-Orbit + Abklingzeit → _Runen-Ring
  der Ewigkeit_; Blitzkette + Bereich → _Teslaspule_; Pfeilhagel + Projektile → _Federsturm_.
- **Gegner** (15+) je Biom (Wiese, Finsterwald, Labor, Bibliothek, Vulkan, Quantenriss) mit Verhalten
  (Verfolger, Schwärmer, Schütze, Teiler, Tank, Teleporter).
- **Helden** (6): Bauer (Axtwurf), Schmiedin (Bumerang, +Rüstung), Alchemist (Säure, +Bereich), Waldläuferin (Pfeile,
  +Tempo), Magier (Runen-Orbit, +Abklingzeit), Physikerin (Teilchenstrahl, +Magnet).

### 10.3 Meta-Progression

- **Riss-Essenz** (pro Lauf) → **Riss-Talente** (permanente Stat-Boni wie in Vampire Survivors „Power-Ups").
- **Freischaltungen** über das Hauptspiel: Helden über Skill-Level (Schmiedin ab Schmieden 30 …), Waffen über
  Erfolge/Techs (Teilchenstrahl braucht „Teilchenbeschleuniger"), Biome über Kampf-Gebiete.
- **Arkana/Mutatoren** für Fortgeschrittene, **Endlos-Modus**, Bestenlisten (lokal, Seed-Codes teilen).

### 10.4 Verflechtung

- **Startwerte** aus dem Hauptspiel: Kampf-Skills (Nahkampf/Fernkampf/Magie) geben kleine Grundboni, Lebenspunkte →
  Max-HP, ausgerüstete Waffe → Startwaffen-Level.
- **Proviant**: Essen aus dem Inventar = einmalige Wiederbelebung bzw. Heilung im Lauf.
- **Beute**: Riss-Essenz, Ätherkerne (Verzauberung), seltene Artefakte, Kolonie-Tribut (Ressourcenkisten).
- **Echo-Läufe** (Idle): Helfer können „Echo-Läufe" laufen, die eine Teilbelohnung bringen.

---

## Phase 11 – Großes Zusammenspiel

- **Reichsbuch** (zentrale Übersicht) mit „Nächste Ziele über alle Systeme".
- **Querschnitts-Quests** (Ketten über alle drei Schleifen).
- **Gemeinsame Erfolge** (≥ 100 neue).
- **Prestige-Integration**: Wiedergeburt behält Ruhm & Riss-Talente; Paradigmen-Naturgesetze wirken auch in Kolonie
  (z. B. „Schwache Gravitation": Erz-Felder +1) und Riss (Projektilgeschwindigkeit).
- **Ökonomie-Balancing** über alle Schleifen (analytische Tests wie in Phase 6).

## Phase 12 – Content-Explosion & Juice

- 30+ Riss-Waffen/Passive, 10 Evolutionen, 40 Gegner, 6 Biome, 8 Helden, Arkana.
- 25 Kolonie-Gebäude, 6 Kartenvarianten, 8 KI-Persönlichkeiten, Ereigniskarten.
- Prozedurale Musik (WebAudio-Sequenzer, je Schleife eigenes Thema), Hit-Stop, Screen-Shake, Schadenszahlen,
  Partikel-Explosionen, Lichtblitze.

## Phase 13 – Endgame

- Meisterschaft pro Aktion, Endlos-Riss, Kolonie-Saisons, Sammelalbum der Kuriositäten, Titel & Kosmetik.

## Phase 14 – Qualität

- Performance-Budgets für Riss (≥ 500 Gegner bei 60 FPS auf Mittelklasse via Spatial Hash + Pooling),
  Barrierefreiheit (Farbenblind-Modi, Reduced Motion, Schriftgröße), Englisch, Telemetrie-frei.

---

## Umsetzungsreihenfolge & Definition of Done

Jede Phase: Engine pur + Tests, Daten getrieben, Spielstand-Migration, UI mobil + Desktop, Feed/Erfolge/Quests,
Doku (CHANGELOG, CLAUDE.md), CI grün, Browser-Test (Playwright-Screenshots).

| Phase | Schwerpunkt                                               | Status    |
| ----- | --------------------------------------------------------- | --------- |
| 8     | Look-Overhaul, Design-System, Startbildschirm, Reichsbuch | fertig    |
| 9     | Kolonie (Catan-Kern, KI, Siedler-Ketten, Ruhm)            | fertig    |
| 10    | Ätherriss (Survivor-Arena, Waffen, Evolutionen, Meta)     | fertig    |
| 11    | Zusammenspiel & Querschnitts-Quests                       | in Arbeit |
| 12    | Content & Juice                                           | geplant   |
| 13    | Endgame                                                   | geplant   |
| 14    | Qualität & Barrierefreiheit                               | geplant   |
