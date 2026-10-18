# Systeme, Zusammenhänge & offene Punkte

> **Pflege-Regel:** Diese Datei wird bei **jeder** inhaltlichen Änderung mitgepflegt (neues System, neue
> Verbindung, erledigter oder neuer offener Punkt). Sie ist die Landkarte des Spiels – `CLAUDE.md` erklärt
> den Code, `CHANGELOG.md` die Historie, `PLAN-2.md` die ursprüngliche Planung. Stand: **1.19.0**.

## 1. Der große Kreislauf

```
            Gold, XP, Items                          Rohstoffe, Truppen
  ┌──────────────────────────┐            ┌──────────────────────────────┐
  │  INSEL (18 Skills)       │◀──Boni────▶│  DORF (Travian-Stil)         │
  │  Holz, Erz, Fisch, Essen │  Hafen     │  18 Felder, 20 Gebäude,      │
  │  Schmieden, Forschung …  │  Brot      │  7 Truppen, Weltkarte, 5 Dörfer│
  └────────────┬─────────────┘            └──────────────┬───────────────┘
               │ Riss-Beute (Äther,                       │ Schmiede/Mauer → Riss-Stärke
               │ Truhen, Kristalle)                       │ Held wohnt im Dorf, annektiert Oasen
               ▼                                          ▼
          ┌──────────────────────────────────────────────────────┐
          │  DER HELD (einer für alles)                          │
          │  Level, 4 Attribute, 6 Ausrüstungsplätze, Gesundheit │
          │  Abenteuer auf der Karte = Echtzeit-Dungeons          │
          └──────────────────────────┬───────────────────────────┘
                                     ▼
          ┌──────────────────────────────────────────────────────┐
          │  ÄTHERRISS (Survivor-Roguelike) – Essenz → Talente   │
          └──────────────────────────────────────────────────────┘
  Darüber: Belohnungs-Schicht (Tagesbonus, Ruhmesleiter, Chronik, Sammelbuch, Erfolge, Quests)
  Darunter: Prestige (Wiedergeburt/Paradigma/Urknall) – setzt die Insel zurück, alles andere bleibt.
```

## 2. Systeme im Einzelnen

| System                      | Daten                                                               | Engine                                       | UI                               |
| --------------------------- | ------------------------------------------------------------------- | -------------------------------------------- | -------------------------------- |
| Insel-Skills & Aktionen     | `data/skills.ts`, `actions.ts`, `expansion.ts`, je Skill eine Datei | `engine/actions.ts` (`advance`)              | `ui/skills/`, `scene/` (3D)      |
| Kampf & Dungeons (Insel)    | `data/combat.ts`                                                    | `engine/combat.ts`                           | `ui/combat/`                     |
| Forschung, Beete, Helfer    | `data/science.ts`                                                   | `engine/science.ts`                          | `ui/science/`                    |
| Markt, Krämer, Werkzeuge    | `data/tools.ts`, `data/balance.ts`                                  | `engine/shop.ts`, `market.ts`                | `ui/inventory/`                  |
| Dorf & Weltkarte            | `data/village.ts`                                                   | `engine/village.ts`, `villageWorld.ts`       | `ui/village/`                    |
| Held & Abenteuer            | `data/hero.ts`                                                      | `engine/hero.ts`                             | `ui/rift/HeroView.tsx`           |
| Ätherriss                   | `data/rift.ts`                                                      | `rift/sim.ts` (Simulation), `engine/rift.ts` | `ui/rift/`                       |
| Belohnungs-Schicht          | `data/progress.ts`                                                  | `engine/progress.ts`                         | `ui/rewards/`                    |
| Sammelbuch                  | `data/collections.ts`                                               | `engine/collections.ts`                      | `ui/inventory/CollectionPanel`   |
| Wochenboss                  | `data/weekly.ts`                                                    | `engine/weekly.ts`                           | `ui/rift/RiftPanel` (WeeklyCard) |
| Haustiere, Quests, Aufträge | `data/meta.ts`                                                      | `engine/meta.ts`                             | `ui/quests/`                     |
| Erfolge                     | `data/achievements.ts`                                              | `engine/achievements.ts`                     | `ui/menu/`                       |
| Prestige                    | `data/prestige.ts`                                                  | `engine/prestige.ts` (`resetRun`)            | `ui/menu/`                       |

## 3. Verbindungen (wer gibt wem was?)

**Insel → Dorf**

- Hafen: Insel-Items (Holzarten, Granit, Erz, Getreide) werden gegen Dorf-Rohstoffe getauscht (`HARBOR_IMPORTS`).
- Belohnungen (`applyReward.resources`) füllen das aktive Dorf.
- Rückweg: Der Hafen verkauft Dorf-Rohstoffe gegen Gold (`HARBOR_GOLD_PER_100`).

**Dorf → Insel**

- Modifikator-Quelle `'village'`: Bevölkerung über 20 bringt XP und Gold. Sägewerk, Ziegelei, Gießerei und
  Mühle geben Tempo auf Holz, Bergbau, Schmieden und Farmen. Die Bäckerei gibt Koch-XP, die Bibliothek
  Forschung, Schmiede und Mauer Kampfwerte.
- Die Dorfbäckerei liefert `village_bread` (Essen für den Inselkampf).

**Dorf ↔ Held**

- Der Held wohnt in einem Dorf (`hero.home`) und kann umziehen.
- Ist er zu Hause, verteidigt er das Dorf, läuft bei Raubzügen mit (trägt dann 200 Beute) und annektiert Oasen.
- Oasen geben +25 % auf einen Rohstoff.

**Riss → Dorf (Invasionen)**

- Alle 2–4 h greift eine Riss-Horde das bevölkerungsreichste Dorf an (`invasionDefense` in `engine/village.ts`):
  Truppen + Mauer, Held daheim, Riss-Talente (+2 %/Stufe, max. +50 %), Inselwehr (Kampfstufe × 4).
  Abwehr → Essenz, Äther, 15 % Heldenausrüstung; Vorwarnung 30 min vorher in „Was jetzt?".

**Dorf → Riss**

- `villageRiftBonus`: Die Schmiede gibt Riss-Macht, die Mauer Rüstung.
- Abenteuer bringen Tribut (Rohstoffe) ins Dorf.

**Held ↔ Riss**

- Derselbe Held kämpft im Riss.
- `runStats` rechnet ein: Level, Attribute, Ausrüstung (`heroBonus`) und die Dorf-Boni.
- Riss-Läufe geben Helden-XP und kosten Gesundheit.
- Abenteuer sind Riss-Dungeons: Boss in der Mitte, Wächter am Ende.

**Wochenboss (Riss + Belohnungs-Schicht)**

- Jede Woche eine feste Prüfung im schwersten offenen Biom mit einer Wochenregel (Mutator, verändert Startwerte und
  Gegnerstärke). Läuft als Riss-Lauf im Dungeon-Modus (`trial: true`), bucht normale Riss-Beute über `finishRun`.
- Erster Sieg der Woche: großes `applyReward` (legendäres Heldenitem, Avatar 🦹); jeder Sieg macht den nächsten
  Boss etwas stärker. Statistik `weeklyWins` → Erfolge und Ruhmesleiter.

**Riss → Insel**

- Beute aus dem Riss: Äther, Manakristalle, Leerensplitter, Dungeon-Truhen.
- Abenteuer bringen Insel-Items und Essenz.

**Alles → Belohnungs-Schicht**

- Die Ruhmesleiter zählt Statistiken aus allen Systemen (`PASS_SOURCES`).
- Die Chronik führt mit 25 Schritten quer durch alle Systeme (`go` springt hin).
- Der Tagesbonus wächst mit `rewardScale` (Gesamtlevel, Heldenlevel, Bevölkerung).

**Alles → Sammelbuch**

- Jedes erhaltene Item zählt (`addItem` → `progress.found`).
- 14 Sets reichen von Insel und Riss-Beute bis zu Relikten.
- Ein volles Set bringt eine einmalige Belohnung plus einen Dauer-Bonus (Modifikator-Quelle `'collections'`).

**Questreihe „Das Band der Welten"** (`data/meta.ts`, `chain`)

- Quest-Ziele: Statistik-Zuwachs, Abgabe, Skill-Level, Dorfgebäude-Stufe (`building`), Heldenstufe
  (`heroLevel`); Belohnung `rewards.extra` läuft über `applyReward` (Essenz, Rohstoffe, Held).

**Meisterschaft** (`engine/mastery.ts`)

- Abgeleitet aus der Statistik `action.<id>` (keine eigenen Spielstand-Felder, überlebt Prestige); wirkt in
  `actionDuration` (Tempo) und `doubleChance`. Aufstiege → Statistik `masteryLevels` (Erfolge, Ruhmesleiter).

**Prestige**

- `resetRun` setzt Skills, Gold und Inventar zurück.
- Erhalten bleiben: Dorf, Held, Riss, Belohnungs-Schicht samt Sammelbuch, Erfolge.
- Neue State-Felder dort bewusst einordnen!

## 4. Bedienung (Handy)

- Tab-Leiste (6 Bereiche) → Fenster in voller Höhe mit Titel und ✕ → Unterreiter (umbrechend, alle sichtbar).
- Weitere Wege: Schnellzugriff 🧭 (Header, Taste K), antippbare Header-Chips, Chronik-„Los", Meldungs-Hinweis →
  Ereignis-Log, Untätig-Leiste → Skills.
- **„Was jetzt?" 📌** (rechts im Header, auch oben im Reichsbuch): `engine/agenda.ts` sammelt alles Fällige aus
  allen Systemen (Belohnungen, Held, Wochenboss, Baumeister, Berichte, Forschung, volle Taschen, Untätigkeit);
  `ui/agendaNav.ts` springt hin. **Neue Systeme mit Handlungsbedarf dort eintragen.**
- Leere Zustände nie als Sackgasse: `ui/EmptyState.tsx` erklärt, was fehlt, und bietet den Weg dorthin.
- Zurück-Taste/-Geste schließt Overlays, Tagesbonus und Fenster (`useBackButton` in `App.tsx`).
- Barrierefreiheit: `ui/a11y.ts` (Textgröße über `html { font-size }` – Schriftgrößen immer in `rem`!,
  `reduce-motion`, `high-contrast`).
- Skill-Liste: je Skill eine Zeile „läuft gerade / Freischalt-Grund / nächste Freischaltung".

**Atmosphäre**

- Musik `ui/music.ts` (Sequenzer, Themen je Bereich, gesteuert über `useBackgroundMusic` in `App.tsx`),
  Soundeffekte `ui/audio.ts` (gleicher AudioContext). Inselboden: vertexgefärbte Scheibe in `scene/Island.tsx`
  (Pfade folgen automatisch `STATIONS`).

## 5. Offene Punkte / was noch fehlt

Priorität grob von oben nach unten. Erledigte Punkte wandern ins CHANGELOG und werden hier gestrichen.

**Gameplay & Inhalt**

- [ ] Wochenboss: eigener Boss-Gegner mit Spezialangriffen statt des Biom-Bosses.
- [ ] Weitere Questreihen (z. B. Forschung ↔ Riss-Waffen, Archäologie ↔ Weltkarte-Ruinen).
- [ ] Endgame (Phase 13): Endlos-Riss, Titel und Kosmetik; Meisterschafts-Pool je Skill (Melvor-Stil).
- [ ] Prestige-Naturgesetze, die auch im Dorf und im Riss wirken (Phase 11).
- [ ] Mehr Riss-Inhalt (Phase 12): 30+ Waffen, 40 Gegner.
- [ ] Musik: Nachtthema auf der Insel, Bossmusik auch bei normalen Riss-Bossen.

**Qualität**

- [ ] Englisch (`tContent`-Overlays); Farbenblind-Paletten für Rarität und Ressourcenbalken.
- [ ] Riss-Performance-Budget: ≥ 500 Gegner auf Mittelklasse (Spatial Hash und Pooling prüfen).
- [ ] PWA-Offline-Test auf echtem Gerät; Desktop-Layout für Dorf-Markt, Berichte und Reich prüfen.
- [ ] Live-Dungeon im Browser durchspielen (bisher nur Simulation und Tests).
- [ ] Balancing über alle Schleifen mit Langzeit-Bot (Insel + Dorf + Held zusammen, 7 Tage).

**Bekannte Schwächen**

- Die 3D-Insel hat noch keine eigenen Stationen für Alchemie, Verzauberung und Arkanes: Sie teilen sich den
  Forschungsturm.
- `progress.found` ist eine Liste: Die Suche ist linear, bei ~300 Items unkritisch.
