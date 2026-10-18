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

## Phase 9 – Dorf „Neu-Aetherium" (Aufbau-Strategie im Stil von Travian)

> Ursprünglich als Catan-Brettspiel umgesetzt; auf Wunsch durch ein Travian-artiges Aufbauspiel ersetzt.

- **Rohstofffelder** rund ums Dorf: 18 Felder (Holzfäller, Lehmgrube, Eisenmine, Getreidefarm; Täler 4-4-4-6,
  3-3-3-9, 1-1-1-15, 5-4-3-6), Stufe 10 (Hauptdorf 15). Produktion pro Stunde, Spieltempo ×10.
- **Dorfzentrum** mit 20 Gebäuden: Hauptgebäude (Bautempo), Lager/Kornspeicher (Kapazität), Versteck,
  Versammlungsplatz, Kaserne, Stall, Akademie, Schmiede, Marktplatz, Stadtmauer, Rathaus (Feste), Residenz (Siedler,
  Oasen), Bonusgebäude (Sägewerk, Lehmbrennerei, Eisengießerei, Mühle, Bäckerei), Inselhafen, Bibliothek.
- **Bauschleifen** (Felder und Zentrum parallel, je 1 Platz zum Vormerken), Getreideverbrauch durch Einwohner und
  Truppen, Hungersnot bei negativem Getreide, sofort fertigstellen mit Inselgold.
- **Militär**: 7 Einheiten, Akademie-Forschung, Schmiede-Boni, Raubzüge auf Räuberlager, Oasen und Riss-Ruinen
  (Travian-Kampfformel, Beute nach Tragkraft), annektierbare Oasen (+25 %).
- **Riss-Invasionen** nach 24 h Anfängerschutz: Mauer, Truppen, Versteck; Abwehr bringt Riss-Essenz und Äther.
- **Expansion**: Kulturpunkte (Gebäude, Feste), Residenz 10/20, 3 Siedler → bis zu 5 Dörfer, Händler zwischen Dörfern.
- **Verflechtung**: Einwohner → Insel-XP/Gold, Bonusgebäude → Inselskills, Schmiede/Mauer → Riss-Held,
  Riss-Läufe → Rohstoff-Tribut, Hafen ↔ Inselwaren und Gold.

## Phase 9b – Der Held & die Weltkarte (umgesetzt in 1.5.0)

- Ein einziger Held verbindet Dorf und Riss: Attribute, Ausrüstung, Gesundheit, Abenteuer als Echtzeit-Dungeons
  oder automatisch, Raubzug-Begleitung, Verteidigung, Oasen-Annexion. Weltkarte als Travian-Raster.

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
| 9     | Dorf (Travian-Aufbau, Truppen, Raubzüge, Expansion)       | fertig    |
| 10    | Ätherriss (Survivor-Arena, Waffen, Evolutionen, Meta)     | fertig    |
| 11    | Zusammenspiel & Querschnitts-Quests                       | in Arbeit |
| 12    | Content & Juice                                           | geplant   |
| 13    | Endgame                                                   | geplant   |
| 14    | Qualität & Barrierefreiheit                               | geplant   |
