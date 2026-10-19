# Systeme, Zusammenhänge & offene Punkte

> **Pflege-Regel:** Diese Datei wird bei **jeder** inhaltlichen Änderung mitgepflegt (neues System, neue
> Verbindung, erledigter oder neuer offener Punkt). Sie ist die Landkarte des Spiels – `CLAUDE.md` erklärt
> den Code, `CHANGELOG.md` die Historie, `PLAN-2.md` die ursprüngliche Planung. Stand: **1.58.0**.

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

**Glaube & Brauen** (`data/devotion.ts`, `engine/devotion.ts`): Glaube verwertet Knochen (Kampf/Jagd), Asche
(Feuermachen), Kräuter (Beete) und Ektoplasma; jede Stufe gibt +0,4 % Verteidigung im Kampf, +0,3 % Riss-LP und
+0,2 % Dorfabwehr (Modifier-Quelle `faith`, Stufenaufstieg ruft `invalidateMods`). Weihwasser/Kerzen sind Buffs,
das Ritual macht „Göttlicher Funke" (+1 Intelligenz). Brauen macht aus Äpfeln, Weizen, Kartoffeln und Kräutern
Getränke: Kampfproviant (`heal`), Buffs, Handelsware und – über den Inselhafen – Getreide fürs Dorf. Stationen
Schrein/Brauerei auf der Insel; Zähler `ritesPerformed`/`drinksBrewed` für Aufträge und Ruhmesleiter.

**Kampfstile & Ausrüstung** (`engine/combat.ts`, `data/spells.ts`): 11 Plätze (neu: Umhang, Hände, Füße). Stil-Boni
über `combat.accuracy.<stil>`/`combat.damage.<stil>` (in `playerStats` per `modFor`), dazu `combat.ammoSave`,
`combat.runeSave`, `combat.energy`. Magie: Zauber in `combatSettings.spell` (Funke, Frostlanze mit Einfrieren,
Feuerball + Kohle, Lebensraub + Ektoplasma, Kettenblitz + Manakristall, Leerenstoß + Leerensplitter); `castSpell`
fällt ohne Zutaten auf den Funken zurück. Aktiv (optional): `combat.energy` 0–100 lädt pro Angriff, `specialAttack`
(Store `special`) feuert Zerschmetterer/Doppelschuss/Arkanausbruch – +50 % XP, +25 % Gold beim Kill, Zähler
`specialsUsed` (Erfolg). Nie automatisch, damit Aktivspiel minimal mehr bringt. `equipBest` füllt die Rüstungsplätze.
Ausrüstungsansicht `ui/inventory/GearPanel` (Figur, Werte, Filter, ▲/▼-Vergleich).
Zauber haben Elemente (`MONSTER_ELEMENTS`: anfällig ×1,35, resistent ×0,6, `spellAffinity`). Monster ab Stufe 10
(Bosse öfter, `heavyEvery`) holen jeden n-ten Schlag aus (`windup`): kommt 60 % später, trifft ×1,6 – Idle bleibt
im Schnitt gleich; `dodge` (💨 in Kampfansicht und Kampfleiste) vermeidet ihn und gibt +25 Spezialenergie.

**Endlos-Rangliste** (`engine/rivals.ts`, Karte im Riss-Start): ohne Server – `recordCode` packt Heldenname,
Endlos-Bestzeit, Siege, Gesamt- und Kampflevel in einen Code `AE1-…` mit Prüfsumme (gegen Tippfehler, nicht gegen
Schummeln); Codes von Freunden liegen nur lokal (localStorage `aetherium.rivals`, kein Spielstand).

**Inselschmuck** (`DECORS` in `data/progress.ts`, `decorShown`/`toggleDecor` in `engine/progress.ts`, 3D in
`scene/Decor.tsx`, Auswahl über 🎨 im `WorldHud`): 9 Deko-Teile mit Bedingungen wie bei den Porträtrahmen
(Statistik/Gesamtlevel/Erfolge). Freigeschaltetes erscheint automatisch, `progress.decorHidden` merkt Ausgeblendetes.

**Kartografie** (Phase 18, `data/cartography.ts`, `engine/cartography.ts`): Pergament (Rindsleder, Krämer) →
7 Regionskarten (Verkauf, Sammelbuch „Großer Atlas", Expeditions-Einsatz) mit Funden; Expeditionen (lange
Aktionen: Karten + Brot) → Schatzkarten (`consume: loot`, 3 Stufen). Passiv je Stufe `hero.travel`
(in `heroTravelTime`) und Archäologie-XP. Kartenzelt auf der Insel, Zähler `mapsDrawn`.

**Baukunst** (Phase 17, `data/construction.ts`, `engine/construction.ts`): Bretter (Holz), Steinblöcke (Granit),
Nägel (Schmieden), Möbel (Verkauf + Baustoff). 9 Inselbauten × 3 Stufen in `s.buildings` (bleiben über Prestige):
Werkstatt, Sägewerk, Gebetsaltar (`prayer.max` → `maxPrayer`), Rüstkammer, Trophäenhalle, Observatorium,
Gewächshaus, Vertrautenhort, Handelskontor (`village.prod`). Bauen ist sofort (`buildIsland`, XP-Batzen),
Modifier-Quelle `buildings`, 3D `IslandBuildings` wächst mit der Stufe, „Was jetzt?" meldet baubare Gebäude.
Stationsnamen weichen sich aus (`LabelProjector`: nähere zuerst, fernere rücken hoch oder blenden aus).

**Diebeskunst** (Phase 16, `data/thieving.ts`, `engine/thieving.ts`): Aktionen mit `steal` (Fehlschlag-Chance je
Stufenabstand, `stealth`-Mod senkt sie). Neuer Engine-Hook `registerActionGate` in `completeAction` (läuft nach dem
Bezahlen, kann Belohnungen abbrechen): erwischt = LP-Verlust, Betäubung (negativer Fortschritt), 10 % XP. Erfolg:
Gold über Completion-Hook, Beute über `drops`. Passiv je Stufe: `combat.crit` (×1,5 Schaden in `landHit`) und
`village.defense`. Dietriche (Schmieden), Diebesmaske/Leisetreter als seltene Beute, Marktstände auf der Insel.

**Beschwörung** (Phase 15, `data/summoning.ts`, `engine/summoning.ts`): Talismane (`charmDrops` je Monsterstufe an
jedes Nicht-Boss-Monster gehängt) + Seelensplitter (Aktion, Ektoplasma, Krämer) + Zutat = Beutel (`consume: familiar`).
`s.familiar` (ein Vertrauter, Zeiteffekt `familiar`, auch offline; gleicher Vertrauter verlängert). Modifier-Quelle
`familiar`; Kampf-Vertraute (`strike`) schlagen in `playerAttack` bei 50 % der Angriffe zu; `rift.*`-Boni wirken im
Riss (`RunConfig.companion`: Vertrauter folgt dem Helden sichtbar, Kämpfer schießen alle 1,1 s auf den nächsten
Gegner). Anzeige in der Buff-Leiste; Beschwörungskreis auf der Insel. Zähler `pouchesMade`.

**Kopfgeldjagd** (Phase 14, `data/slayer.ts`, `engine/slayer.ts`, `ui/combat/SlayerView.tsx`): Auftrag (12–35 Kills)
aus `slayerCandidates` (passend zur Kampfstufe, keine Bosse, ohne Sperren); Kill-Hook gibt Kopfgeld-XP (1,2 × LP),
Abschluss Punkte (×5 jeden 10. Auftrag in Serie) und Gold. Laden: tauschen, sperren, Beutel, Helm/Ring/Umhang mit
`combat.slayer` (wirkt nur gegen das Ziel, `slayerBonus` in Trefferchance und Schaden). Kopfgeldturm-Monster
(`MonsterDef.slayer`) mit eigenen Unikaten; `startCombat` prüft die Stufe. „Was jetzt?" (`area: 'skill'`),
Aufträge, Ruhmesleiter; Kopfgeldbrett neben der Arena.

**Juwelierkunst** (Phase 13, `data/jewelcrafting.ts`): Kiesel sieben (Quarz + Funde), Geoden knacken (Geoden fallen
beim Bergbau über `gems()`), Steine veredeln (Topas, Onyx, Ätherstein ← Äther vom Arkanen), 16 Ringe/Amulette aus
Barren + Steinen für alle Kampfstile und Sammel-Skills. Zähler `jewelsCrafted` (Aufträge, Ruhmesleiter), Sammelbuch
„Schatulle des Juweliers", Station „Juwelier" (`scene/Workshops.tsx`, generische Werkstatt für neue Skills).
**Sets & Unikate** (`data/sets.ts`): Metall-Garnituren (3/6 Teile), Lederjäger, Seidenmagier, Drachenjäger –
Modifier-Quelle `sets` über `setProgress`; Boss-Unikate über `UNIQUE_DROPS` (in `data/combat.ts` an die Beute gehängt).
**Ätherit**: oberste Metallstufe (Bergbau 92, Schmieden 92+, Ätheritpfeile).

**Magie 2.0** (Phase 12, `data/spells.ts` + `data/runes.ts`): 24 Zauber = 6 Elemente × 4 Stufen (Stoß, Bolzen,
Explosion, Welle), erzeugt aus `SEEDS` (alte IDs bleiben). Kosten `cost[]`: 1 Grundrune + Element-Runen
(`ELEMENT_RUNES`) + seltene Katalysatoren. Element-Runen, Element-Pfeile (Ammo mit `equip.element`, Frost friert,
Schatten heilt) und Element-Stäbe (`combat.element.<el>`) macht die Verzauberung. `attackElement`/`elementMult`
gelten für Zauber und Pfeile gleich.

**Gebete, Loadouts, Auto-Trank** (Kampf 2.0 Phase 11, `data/prayers.ts`, `engine/prayer.ts`): Gebetspunkte
`10 + 2 × Glaube`, Zeiteffekt `prayer` zieht pro Minute im Kampf ab (bis 3 Gebete, ein Schutzgebet), füllt sich
außerhalb (+2/Min) und pro Glaube-Aktion (+2). Modifier-Quelle `prayer`; Schutz halbiert Schaden des Monster-Stils
(`MONSTER_STYLES`/`monsterStyle`). Weihtrunk (Brauen) = `consume: prayer`, automatisch bei < 25 %. `combat.regen`
beschleunigt die LP-Heilung. `loadouts` (3 Sets, `saveLoadout`/`applyLoadout`, bleiben über Prestige),
`combatSettings.potion` = Auto-Trank (Buff-Item wird nachgelegt).

**Frostgipfel** (7. Biom/Gebiet `glacier`): Kampfgebiet Stufe 100 (Frosttroll, Yeti, Eiswurm; anfällig für Feuer)
liefert `frost_shard` → Zauber Gletschersturz (Magie 85) und Frostmantel (Handwerk 80); Riss-Biom mit
Schwierigkeit 11. Riss-Gegnerverhalten `shielder` (Gegner im Umkreis nehmen 45 % Schaden, blauer Ring, nutzt das
Raster des letzten Frames) und `healer` (hält Abstand, heilt alle 3,2 s 12 % LP im Umkreis, Bosse 2 %) – auch in
Gnomlabor, Bibliothek, Vulkan und Quantenriss ab Minute 6.

**Periodensystem** (`ELEMENT_GROUPS` in `data/science.ts`, `elementGroupProgress` in `engine/science.ts`): 10 chemische
Gruppen; jede vollständige Gruppe gibt einen passenden Bonus (Alkalimetalle → Verkaufspreis, Erdalkali → Bergbau,
Übergangsmetalle → Schmieden, Metalle → Kampfschaden, Halbmetalle → Handwerk, Nichtmetalle → Landwirtschaft/Kochen,
Halogene → Alchemie, Edelgase → Forschung, Lanthanoide → Dorfproduktion, Actinoide → Riss-Schaden), das ganze System
+10 % XP. Kodex-Ansicht: Zellen in Gruppenfarben, Gruppenliste filtert, Quellen springen zur Analyse.

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

**Questreihen** (`data/meta.ts`, `chain`): „Das Band der Welten" (alle Systeme), „Wissen ist Macht"
(Forschung/Alchemie/Verzauberung ↔ Riss), „Spuren der Vorläufer" (Archäologie ↔ Abenteuer/Oasen/Dörfer), „Die Karawane des Glücks" (Dorfmarkt ↔ Insel-Handel,
Haustiere ↔ Held, Expansion)

- Quest-Ziele: Statistik-Zuwachs, Abgabe, Skill-Level, Dorfgebäude-Stufe (`building`), Heldenstufe
  (`heroLevel`); Belohnung `rewards.extra` läuft über `applyReward` (Essenz, Rohstoffe, Held).

**Meisterschaft** (`engine/mastery.ts`)

- Abgeleitet aus der Statistik `action.<id>` (keine eigenen Spielstand-Felder, überlebt Prestige); wirkt in
  `actionDuration` (Tempo) und `doubleChance`. Aufstiege → Statistik `masteryLevels` (Erfolge, Ruhmesleiter).

**Prestige**

- Naturgesetze (Paradigma) wirken über die Bonus-Schlüssel `village.*`/`rift.*` auch auf Dorf und Riss.

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
- **Meisterschafts-Pool** (`engine/mastery.ts`): Durchschnitt der Meisterschaft aller Aktionen eines Skills; bei
  10/25/50/95 % gibt es skillweite Boni (Modifier-Quelle `masteryPool`, `POOL_TIERS`). Anzeige im Skill (`MasteryPool`).
- **Porträt-Rahmen** (`FRAMES` in `data/progress.ts`, `frameUnlocked`/`setFrame` in `engine/progress.ts`, Wahl in
  `progress.frame`): Kosmetik aus allen Systemen (Dorf, Riss, Wochenboss, Sammelbuch, Meisterschaft, Prestige).
- Skill-Liste: je Skill eine Zeile „läuft gerade / Freischalt-Grund / nächste Freischaltung"; Gesamtlevel,
  gemeisterte Skills und nächstes Gesamtlevel-Ziel bleiben oben stehen (`SkillSummary`), im Skill bleibt der Kopf
  mit Level/XP oben (`.skill-sticky`).
- **Kontext-Kopfzeile** (`ui/HeaderStats.tsx`): im Dorf Holz/Lehm/Eisen/Getreide/Einwohner (Füllbalken = Lager),
  beim Held Stufe/Gesundheit/Essenz, sonst Gold/Forschung/Gesamtlevel/Feuer. Antippen öffnet ein Detail
  (Produktion/h, Verbrauch, Netto, Zeit bis voll/leer). Am Handy ersetzt sie die Rohstoffleiste im Dorf.
- **Antipp-Karten** (`ui/TouchCard.tsx`): Details und Aktionen schweben unten über der Tab-Leiste statt unter dem
  Inhalt – Dorf-Felder/Gebäude (mit „Genug Rohstoffe in …" über `affordIn`), Inventar-Items (Verwendet für /
  Entsteht durch, Benutzen, **Alle benutzen** = `consumeAll` mit zusammengefassten Meldungen, Kampfproviant,
  Verkaufen). Antippbare Ziele tragen `data-touch-keep`, damit ein Tipp die Karte wechselt statt schließt.
- Insel-Stationen: **ein Tipp** startet sofort die zuletzt gemachte Aktion dieses Skills (pro Gerät gemerkt in
  `store/lastActions.ts`, `aetherium.lastActions`), sonst die beste machbare; **Doppeltipp** öffnet den Skill mit
  allen Aktionen zur Auswahl (`tapStation`). Kampf/Forschung/Beete öffnen direkt ihr Fenster.
- Ruhmesleiter scrollt beim Öffnen zur aktuellen Stufe (erste offene Belohnung, sonst die nächste Stufe; `.current`).
- Komfort: „Bestes Feld ausbauen" (`bestFieldToUpgrade`: niedrigste Stufe, bei Gleichstand der schwächste
  Rohstoff, Getreide netto), „Plunder verkaufen" im Inventar (`sellStacks`, eine Meldung).
- „Was jetzt?" hat ab 2 wartenden Belohnungen „Alle abholen" (`claimAllRewards`: Ruhmesleiter, Sammelbuch-Sets,
  fertige Aufträge – eine Enthüllung).
- Skill-Ansicht am Handy kompakt: Zurück-Pfeil neben dem festen Skill-Kopf, Beschreibungen gekürzt, Funde nur als
  Symbol + Chance (Name im Tooltip).
- **Rezept-Sprung** (`ui/recipes.ts`: `USED_IN`, `MADE_BY`, `itemSource`): benötigte Zutaten in Aktionskarten und die
  Rezept-Chips im Inventar springen zur herstellenden Aktion (`jumpToAction`, `ui.focusAction` → Karte scrollt ins
  Bild und blinkt) oder zum Krämer, wenn man es nur kaufen kann.
- **Gezeichnete Item-Icons** (`ui/ItemIcon.tsx`, Feld `art` an `ItemDef`): Erze (Gesteinsbrocken mit farbigen Adern) und
  Barren (Barren in Metallfarbe) statt gleich aussehender Emojis – in Inventar, Item-Karte, Aktionskarten, Krämer,
  Markt, Offline-Bericht. Fließtext (Meldungen) nutzt weiter das Emoji.
- Unterreiter am Handy: eine wischbare Zeile; der aktive Reiter scrollt automatisch ins Bild (`BottomSheet`).
- **Tab-Leiste**: aktiven Tab nochmal tippen → zurück zum Kern des Bereichs (`TAB_HOME` in `ui/tabShortcuts.ts`,
  z. B. Inventar → Taschen, Welt → „Was jetzt?") und nach oben; lange drücken → Schnellmenü aller Unterbereiche.
- **App** (Einstellungen): Vollbild, Seite neu laden, nach Update suchen (`ui/appUpdate.ts`). Der Service Worker
  läuft im Modus `prompt`: eine neue Version wartet, `UpdateBanner` bietet „Neu laden" an (speichert vorher);
  alle 30 min wird nach einem neuen Deploy gesucht.

**Atmosphäre**

- Insel-HUD (`ui/WorldHud.tsx`): oben auf der Welt-Seite Status von Dorf (Baumeister frei / Restzeit), Held, Riss
  (Essenz, Wochenboss offen) und Tagesbonus.
- Belebte Szene (`scene/Life.tsx`): Himmelskuppel mit Verlauf, Sonne und Mond (`SkyDome`, teilt die Horizontfarbe
  `HORIZON` mit dem Meer), Berg- und Hügelring hinter der Bucht (`Mountains`: Silhouette aus Sinus-Schichten,
  Schneekappen, Dunst statt Szenen-Nebel), Vogelschwarm (tagsüber), Segelboot, springende Fische.
  Eigene Shader brauchen `#include <colorspace_fragment>`, sonst sind die Farben zu dunkel. Kamera (`CameraRig`):
  etwas flacher plus Linsenverschiebung (`setViewOffset`), damit Horizont und Berge oben im Bild sind.

- Musik `ui/music.ts` (Sequenzer, Themen je Bereich, gesteuert über `useBackgroundMusic` in `App.tsx`),
  Soundeffekte `ui/audio.ts` (gleicher AudioContext). Inselboden: vertexgefärbte Scheibe in `scene/Island.tsx`
  (Pfade folgen automatisch `STATIONS`).

## 5. Offene Punkte / was noch fehlt

Priorität grob von oben nach unten. Erledigte Punkte wandern ins CHANGELOG und werden hier gestrichen.

**Gameplay & Inhalt**

- [ ] Endgame: mehr Inselschmuck (z. B. für Dorf-Meilensteine).

**Qualität**

- [ ] Englisch (`tContent`-Overlays). Großer Brocken: ~50 TSX-Dateien mit deutschem Klartext statt `t()`, dazu
      500+ Inhaltsnamen und die Sprüche in `flavor.ts` – erst UI-Texte nach `i18n/de.ts` ziehen, dann `en.ts`.
- [ ] Riss-Rendering auf echtem Mittelklasse-Handy messen (Simulation ist geprüft: 675 Gegner ≈ 0,5 ms/Schritt
      am Desktop dank Spatial Hash in `rift/sim.ts`; Limit aktuell 360 Gegner).
- [ ] PWA-Offline-Test auf echtem Gerät.
- [ ] Langzeit-Bot erweitern: Riss-Läufe (Essenz/Talente), Prestige, 7+ Tage, Juwelierkunst mit Bergbau-Geoden; Spieler ohne Truppen werden oft
      geplündert – beobachten, ob ein Hinweis auf die Kaserne früher nötig ist.

**Bekannte Schwächen**

- `progress.found` ist eine Liste: Die Suche ist linear, bei ~300 Items unkritisch.
