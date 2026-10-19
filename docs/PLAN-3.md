# Masterplan 3.0 – Kampf 2.0 & sechs neue Skills

Ziel: Kampf wird ein richtig ausgefeiltes System (Nahkampf, Fernkampf, Magie, Gebete, Runen, Ausrüstungssets),
und sechs neue Skills fügen sich sinnvoll in Insel, Dorf, Held und Riss ein. Jede Phase ist ein eigenes Release
(alle Prüfungen grün, Doku in `SYSTEME.md`/`CHANGELOG.md`), damit das Spiel nach jedem Schritt spielbar bleibt.

Leitlinien:

- **Idle bleibt fair, aktiv lohnt sich ein bisschen** (wie Spezialleiste/Ausweichen): Gebete und Loadouts laufen
  auch offline, Klicken bringt Bonus, nie Pflicht.
- **Jeder Skill hat Ein- und Ausgänge** in mindestens drei andere Systeme (keine Inseln).
- **Daten zuerst**: neue Inhalte als typisierte Daten, Engine generisch, Tests für jede Mechanik.
- Save-Format nur additiv (Hydrate füllt Defaults); prestige-sicher einordnen (`resetRun`).

## Phase 11 – Kampf-Fundament 2.0

- Monster bekommen einen **Angriffsstil** (Nah/Fern/Magie) – sichtbar auf der Monsterkarte.
- **Gebete** (aus dem Skill Glaube): Gebetspunkte = Glaube-Stufe, füllen sich am Schrein/über Weihwasser.
  Schutzgebete (−50 % Schaden gegen einen Stil), Adlerauge (Treffsicherheit), Stahlhaut (Verteidigung),
  Heiliger Zorn (Schaden), Erneuerung (Heilung). Verbrauch pro Sekunde, Gebetsleiste im Kampf, offline wirksam.
- **Loadouts**: drei Ausrüstungs-Sets speichern und mit einem Tipp wechseln (Nah/Fern/Magie).
- **Kampftränke**: Auto-Trank-Slot (Alchemie-Buffs werden im Kampf automatisch nachgelegt).

## Phase 12 – Runen & Magie 2.0

- **Element-Runen** (Feuer, Frost, Sturm, Schatten, Leere) über Verzauberung aus Runenessenz + Element-Zutat.
- Zauber-Reihen je Element (Stoß → Bolzen → Explosion → Welle), Zauber kosten Element-Runen statt Katalysatoren.
- **Element-Pfeile** (Feuer-, Eis-, Sturm-Pfeile) für Fernkampf – gleiche Anfälligkeiten wie Zauber.
- Zauberstäbe mit Element-Bonus.

## Phase 13 – Juwelierkunst (neuer Skill) & Ausrüstungs-Ausbau

- **Juwelierkunst** 💎: Rohsteine schleifen (Saphir … Diamant, neu: Onyx, Ätherit), Ringe/Amulette/Talismane für
  alle Stile und Skills, Edelstein-Fassungen (Sockel) für Waffen.
- **Ausrüstungs-Sets** mit Set-Boni (2/4 Teile), neue Metall-Stufe **Ätherit**, Boss-Unikate mit Spezialeffekt.
- Verbindungen: Bergbau/Archäologie (Rohsteine), Schmieden (Fassungen), Dorf-Markt (Schmuckhandel), Held (Schmuck).

## Phase 14 – Kopfgeldjagd (neuer Skill)

- **Kopfgeldjagd** 🎯: Aufträge „Besiege N × Monster" (passend zur Kampfstufe), XP pro Kill auf Auftrag,
  Kopfgeld-Punkte → Kopfgeld-Laden (Spezialausrüstung, Auftrags-Umleitung, Sperrliste).
- Kopfgeld-Monster nur mit Auftrag (z. B. Gargoyle, Basilisk) mit starken Drops.
- Verbindungen: Kampf, Dorf (Kopfgeldbrett im Rathaus), Ruhmesleiter, Erfolge.

## Phase 15 – Beschwörung (neuer Skill)

- **Beschwörung** 🐾: Talismane (Monster-Drops) + Seelensplitter → Beschwörungs-Beutel; ein Vertrauter
  begleitet dich: Kampf-Vertraute (Zusatzschaden, Heilung, Beute-Träger) und Sammel-Vertraute (Tempo/Doppelt).
- Vertraute halten eine begrenzte Zeit, auch offline.
- Verbindungen: Kampf (Talismane), Jagd, Glaube (Seelensplitter), Riss (Vertrauter als Begleiter).

## Phase 16 – Diebeskunst (neuer Skill)

- **Diebeskunst** 🗝️: Taschendiebstahl bei NPCs, Stände plündern, Truhen knacken (Dietriche aus Schmieden).
  Erwischt werden = kurze Betäubung. Beute: Gold, Saatgut, Schlüssel, Edelsteine, seltene Karten.
- Passiv: Diebeskunst-Stufe gibt **kritische Treffer** im Kampf und Spionage im Dorf (weniger Raubverluste).

## Phase 17 – Baukunst (neuer Skill)

- **Baukunst** 🔨: Bretter (Sägewerk), Nägel (Schmieden), Steinblöcke → Insel-Bauten mit Dauer-Boni:
  Werkstatt, Trophäenhalle, Gebetsaltar (Gebetspunkte), Rüstkammer (Loadouts), Sägewerk, Observatorium.
- Bauten erscheinen in 3D auf der Insel (wie Inselschmuck), haben Stufen.

## Phase 18 – Kartografie (neuer Skill) & Expeditionen

- **Kartografie** 🧭: Expeditionen (Zeit, Proviant) in Regionen → Schatzkarten, neue Grabungsorte, Rohsteine,
  Saatgut, seltene Monster-Hinweise. Schatzkarten öffnen Schatzkisten (Archäologie).

## Phase 19 – Verweben & Feinschliff

- Alle neuen Skills in Aufträge, Quests, Ruhmesleiter, Erfolge, Meisterschaft, „Was jetzt?", Chronik, Musik,
  3D-Stationen, Sammelbuch-Sets. Balance-Bot erweitern, Balancing-Begründungen in `BALANCING.md`.
