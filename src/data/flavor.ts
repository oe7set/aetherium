// Flavor texts: loading tips, event lines and jokes.
// Placeholders: {skill}, {level}, {item}, {qty}, {time}. Filled by `fillFlavor` in src/engine/flavor.ts.

export const LOADING_TIPS: string[] = [
  'Korrelation ist keine Kausalität. Außer bei Kohle und Schmieden.',
  'Tipp: Antippen der aktiven Aktion beschleunigt sie. Deine Daumen sind ein Produktionsfaktor.',
  'Hast du es schon aus- und wieder eingeschaltet?',
  'Das Mitochondrium ist das Kraftwerk der Zelle. Das Lagerfeuer ist das Kraftwerk der Küche.',
  'Bäume wachsen nach. Deine Geduld leider nicht.',
  'Mehr Holz benötigt.',
  'Du brauchst ein Werkzeug der Stufe ? für diese Aktion. Welche Stufe? Das ist das Geheimnis.',
  'Tipp: Ein brennendes Lagerfeuer gibt +5 % XP auf alles. Wärme motiviert.',
  'Diamanten sind nur Kohle, die mit Druck gut umgehen kann.',
  'Fun Fact: 87 % aller Statistiken in diesem Spiel sind erfunden.',
  'Tipp: Kohle brennt fünfmal so lange wie Eichenholz.',
  'Schrödingers Ladebildschirm: Er lädt und lädt nicht gleichzeitig.',
  'Ein Newton-Apfel am Tag hält die Dummheit fern.',
  'Tipp: Bessere Werkzeuge gibt es beim Krämer im Menü-Tab.',
  'Die Antwort ist 42. Die Frage ist noch in der Forschung.',
  'Wissenschaft ist, wenn es nicht klappt und man weiß warum.',
  'Magie ist, wenn es klappt und keiner weiß warum.',
  'Lade Physik-Engine … Gravitation gefunden. Leider.',
  'Kalibriere Zufallsgenerator … gewürfelte 4. Garantiert zufällig.',
  'Tipp: Vogelnester kann man im Inventar öffnen. Die Vögel haben nichts dagegen. Sagen sie.',
  'Lade Teilchenbeschleuniger … bitte in einigen Phasen erneut versuchen.',
  'Tipp: Dein Fortschritt läuft weiter, während du weg bist – bis zu 24 Stunden.',
  'Achtung: Dieses Spiel enthält Spuren von Nüssen und Thermodynamik.',
  'Die Entropie nimmt zu. Dein Inventar auch.',
  'Tipp: Höhere Kochstufen verbrennen weniger. Erfahrung ist auch nur angesammeltes Anbrennen.',
  'Entdecke: Die Welt ist eine Scheibe. Eine runde, dreidimensionale Scheibe namens Kugel.',
  'Bitte nicht den Ofen anstarren. Das Brot wird dadurch nicht schneller.',
  'Speichere regelmäßig. Oder lass es das Spiel tun, alle 30 Sekunden.',
  'Tipp: Exportiere deinen Spielstand, bevor du Browserdaten löschst.',
  'Im Weltraum hört dich niemand Holz hacken.',
  'Lade Lore … Kapitel 1: Es war einmal ein Stein. Er wurde eine Axt.',
  'Kein Baum wurde beim Programmieren dieses Spiels verletzt. Nur sehr viele beim Spielen.',
  'Tipp: Werkzeuge werden automatisch ausgerüstet, wenn du sie kaufst.',
  'Mendel hat Erbsen gezählt. Du zählst Holzscheite. Ihr seid beide Wissenschaftler.',
  'Erinnerung: Wasser trinken. Deine Spielfigur tut es auch nicht.',
  'Tipp: Pilze wachsen bei Birken und Weiden. Frag nicht, warum. Biologie.',
  'Tipp: Eier gibt es in Vogelnestern. Vogelnester gibt es beim Holzfällen. Der Kreislauf des Lebens.',
  'Ein Level-99-Skill braucht etwa 13 Mio. XP. Die Hälfte davon erst ab Level 92. Viel Spaß!',
  'Tipp: Verkohlte Masse ist wertlos. Außer als Mahnmal.',
  'Fehler sind Daten. Verbrannte Steaks auch.',
  'Tipp: Die Zahlenformate kannst du im Menü umstellen. Nerds wählen „wissenschaftlich“.',
  'Das Gesetz der Erhaltung der Masse gilt. Das Gesetz der Erhaltung der Motivation leider nicht.',
  'Wusstest du? Ein Baum ist auch nur ein sehr langsamer Kohlenstoffspeicher.',
  'Tipp: Höhere Level über der Anforderung machen Aktionen schneller (bis +50 %).',
  'Gerüchte besagen, dass im Mithril versteinerte Mitochondrien schlummern.',
];

export const LEVEL_UP_LINES: string[] = [
  '{skill} ist jetzt Level {level}! Deine Mutter wäre stolz.',
  'Level {level} in {skill}! Die Gilde der Übertreiber gratuliert.',
  '{skill} Level {level}. Ding! Wie in den guten alten Zeiten.',
  'Glückwunsch! {skill} {level}. Du bist jetzt offiziell überqualifiziert für Level {level} minus 1.',
  '{skill} auf {level}. Irgendwo applaudiert ein Barde.',
  '{skill}: Level {level}. Die Peer-Reviewer akzeptieren dies widerwillig.',
  'Level {level} {skill}! Dein Lebenslauf wird länger.',
  '{skill} steigt auf {level}. Die Dopamin-Fabrik läuft auf Hochtouren.',
  'Neues Level: {skill} {level}. Das Universum nimmt Notiz. Kurz.',
  '{skill} Level {level}! Es ist nicht viel, aber es ist ehrliche Arbeit.',
  'Level {level} in {skill}. Mehr Holz, mehr Erz, mehr Ruhm.',
  '{skill} {level}! Du spürst, wie dein Bizeps (oder dein Intellekt) wächst.',
];

export const RARE_DROP_LINES: string[] = [
  'Seltener Fund: {item}! Die Wahrscheinlichkeitsrechnung ist beleidigt.',
  'WOW! {item}! Screenshot oder es ist nicht passiert.',
  '{item} gefunden! Dein Glück hat heute einen Bonus.',
  'Ein {item}! Das RNG mag dich. Vorerst.',
  'Glückstreffer: {item}! Statistisch gesehen solltest du jetzt Lotto spielen. Mach es nicht.',
  '{item}! Irgendwo schreibt ein Statistiker eine Fußnote über dich.',
  'Ding-ding-ding! {item}! Gauß dreht sich in seiner Glockenkurve um.',
];

export const NEWTON_LINES: string[] = [
  'Ein Apfel fällt dir auf den Kopf. Plötzlich verstehst du Gravitation. Und Zinseszins.',
  'Bonk! Ein Newton-Apfel. Deine Gedanken werden klarer und etwas klebriger.',
  'Der Apfel fiel nicht weit vom Stamm. Genau auf dich.',
];

export const INTELLIGENCE_LINES: string[] = [
  'Du isst den Newton-Apfel. Intelligenz +{qty}. Du verstehst jetzt fast die Steuererklärung.',
  'Knack! Intelligenz +{qty}. Du fühlst dich bereit für Differentialgleichungen. Fast.',
  'Intelligenz +{qty}. Ein kurzer Moment der Erleuchtung, gefolgt von Apfelgeschmack.',
];

export const BURNT_LINES: string[] = [
  'Du hast {item} verbrannt. Kohlenstoff-Recycling ist auch eine Kunst.',
  '{item} verkohlt. Die Maillard-Reaktion ist etwas eskaliert.',
  'Upps. {item} ist jetzt eher ein Brennstoff als ein Essen.',
  'Angebrannt! {item} hat den Garpunkt um mehrere Kelvin verpasst.',
  '{item} verbrannt. Das Rauchmelder-Achievement ist nicht mehr weit.',
  'Schwarz ist das neue Medium. Sagt niemand. Über {item}.',
  '{item} ist jetzt ein archäologischer Fund aus der Zukunft.',
];

export const INVENTORY_FULL_LINES: string[] = [
  'Dein Inventar ist voll. Mehr Taschen benötigt!',
  'Kein Platz mehr! Selbst ein Tesseract hätte Probleme mit deinem Kram.',
  'Inventar voll. Marie Kondo würde jetzt fragen, ob das Holz Freude bereitet.',
  'Die Taschen platzen. Verkaufen oder neue Plätze kaufen.',
];

export const NO_INPUT_LINES: string[] = [
  'Dir fehlen Zutaten. Alchemie aus dem Nichts ist erst in Phase 5 vorgesehen.',
  'Materialien aufgebraucht. Mehr {item} benötigt.',
  'Ohne {item} geht hier gar nichts. Masseerhaltung, leider.',
  'Kein {item} mehr. Die Erhaltungssätze sind gnadenlos.',
];

export const FIRE_OUT_LINES: string[] = [
  'Das Lagerfeuer ist erloschen. Die Entropie hat gewonnen. Diesmal.',
  'Das Feuer ist aus. Mehr Holz benötigt!',
  'Ohne Brennstoff keine Oxidation. Das Lagerfeuer ist aus.',
  'Das Lagerfeuer flackert ein letztes Mal und geht aus. Wie ein Montagmorgen.',
];

export const NO_FIRE_LINES: string[] = [
  'Kochen ohne Feuer ist nur Salat. Zünde zuerst das Lagerfeuer an (Feuermachen).',
  'Kein Feuer, kein Steak. Leg Holz nach!',
  'Rohkost-Diät? Nein danke. Zuerst Feuer machen.',
];

export const FIRE_LIT_LINES: string[] = [
  'Das Lagerfeuer knistert. +5 % XP, solange es brennt.',
  'Feuer! Die erste große Erfindung der Menschheit, jetzt in deinem Spielstand.',
  'Es werde Licht! Und Wärme. Und ein XP-Bonus.',
];

export const BUY_LINES: string[] = [
  'Gekauft: {item}. Der Krämer reibt sich die Hände.',
  '{item} erworben. Kapitalismus, aber mittelalterlich.',
  '{item} gehört jetzt dir. Kein Umtausch, keine Garantie, keine Fragen.',
];

export const SELL_LINES: string[] = [
  '{qty}× {item} verkauft. Der Krämer nickt anerkennend.',
  'Verkauft: {qty}× {item}. Angebot und Nachfrage sind heute auf deiner Seite.',
  '{qty}× {item} gegen Gold getauscht. Adam Smith wäre stolz.',
];

export const TOOL_LINES: string[] = [
  'Neues Werkzeug: {item}! Alles wird schneller. Außer Bürokratie.',
  '{item} ausgerüstet. Die Bäume zittern.',
  '{item} in der Hand. Die Felsen fangen an zu schwitzen.',
];

export const SLOT_LINES: string[] = [
  'Neuer Inventarplatz! Die Tasche ist innen größer als außen.',
  'Inventar erweitert. Taschenphysik ist ein faszinierendes Feld.',
];

export const WELCOME_LINES: string[] = [
  'Willkommen in Aetherium! Du hast eine Steinaxt, große Träume und keinerlei Ahnung.',
  'Willkommen zurück, Wissenschaftler*in! Die Bäume haben dich vermisst. Nicht wirklich.',
  'Guten Tag! Die Simulation läuft. Bitte nicht die Wände der Simulation berühren.',
];

export const OFFLINE_LINES: string[] = [
  'Während du weg warst, hat deine Spielfigur einfach weitergemacht. Ohne Pause. Ohne Gewerkschaft.',
  'Du warst {time} weg. Die Welt hat sich weitergedreht. Und deine Spielfigur auch.',
  'Willkommen zurück! Deine Abwesenheit wurde in Fortschritt umgewandelt.',
  'Zeitreise erfolgreich: {time} übersprungen. Ergebnisse unten.',
];

export const IDLE_LINES: string[] = [
  'Deine Spielfigur steht herum und überlegt, ob Steine Gefühle haben.',
  'Nichts zu tun? Ein Baum in der Nähe sieht fällbar aus.',
  'Untätigkeit ist der Anfang aller Philosophie. Und das Ende aller XP.',
  'Deine Spielfigur pfeift ein Lied. Es klingt verdächtig nach Level-Up-Musik.',
  'Leerlauf erkannt. Die Effizienz-Gnome sind enttäuscht.',
];

export const ACTION_START_LINES: Record<string, string[]> = {
  woodcutting: [
    'Du schwingst die Axt. Der Baum ahnt nichts.',
    'Holzfällen gestartet. Irgendwo weint ein Eichhörnchen.',
    'Ab in den Wald! Der Holzweg ist hier ausnahmsweise richtig.',
  ],
  mining: [
    'Du hackst auf den Fels ein. Der Fels hackt nicht zurück. Noch nicht.',
    'Bergbau gestartet. Glück auf!',
    'Spitzhacke bereit. Zwerge in der Gegend werden eifersüchtig.',
  ],
  firemaking: [
    'Du stapelst Holz und zündest es an. Prometheus nickt dir zu.',
    'Feuermachen gestartet. Bitte Abstand zur Augenbraue halten.',
  ],
  cooking: [
    'Du stellst die Pfanne aufs Feuer. Gordon wäre … neutral.',
    'Kochen gestartet. Es duftet nach Erfolg und leicht nach Rauch.',
  ],
};

export const RANDOM_CHATTER: string[] = [
  'Ein Eichhörnchen beobachtet dich vorwurfsvoll.',
  'Ein Wanderer ruft: „Kaufe Bronzeaxt, zahle gut!“ Er hat kein Gold.',
  'Ein Zauberer behauptet, Physik sei nur eine Meinung.',
  'Ein Gnom erklärt dir ungefragt Quantenverschränkung. Du verstehst nur „Bahnhof“ – und der ist auch verschränkt.',
  'Irgendwo in der Ferne explodiert ein Labor. Wahrscheinlich nichts Wichtiges.',
  'Ein Rabe krächzt etwas über Datenschutz.',
  'Ein Barde singt über einen Helden, der 99 Holzfällen erreichte. Ein Epos von 13 Mio. Strophen.',
  'Der Wind trägt den Duft von verbranntem Toast heran. Kein gutes Omen.',
  'Ein vorbeiziehender Alchemist murmelt: „Blei zu Gold … das kann doch nicht so schwer sein."',
  'Am Horizont schimmert etwas Metallisches. Ein Teilchenbeschleuniger? Nein, das kommt erst später.',
  'Ein Huhn überquert den Weg. Die Gründe bleiben unklar.',
  'Ein Doktorand schläft unter einem Baum. Lass ihn. Er hat es verdient.',
  'Ein Frosch quakt in perfektem Sinus. Fourier wäre begeistert.',
  'Eine Katze sitzt in einer Kiste. Ob sie lebt? Du traust dich nicht nachzusehen.',
  'Ein Händler bietet Schlangenöl an. „Heilt alles außer Bugs!“',
  'Ein Ritter fragt nach dem Weg zum nächsten Dungeon. Du zeigst auf Phase 4.',
  'Ein Golem stolpert vorbei und entschuldigt sich höflich. Er ist noch in Ausbildung.',
  'Ein Praktikant fragt, ob er helfen kann. „Ab Phase 5“, sagst du.',
  'Am Himmel zieht eine Wolke in Form eines Bunsenbrenners vorbei.',
  'Du hörst ein leises „Ding!“ aus einem Paralleluniversum.',
  'Ein alter Mann murmelt: „Zu meiner Zeit gab es nur Holzfällen. Und wir waren dankbar!“',
  'Ein Pilz am Wegesrand sieht dich an. Du schaust zuerst weg.',
  'Ein Zwerg zählt seine Kupfererze. Zweimal. Dreimal.',
  'Ein Elf erklärt, dass Bäume fällen unhöflich sei. Er sitzt auf einem Holzstuhl.',
  'Eine Eule fragt „Wer?“. Du weißt es auch nicht.',
  'Ein Physiker misst den Lagerfeuerrauch. Ergebnis: „rauchig“.',
  'Jemand hat „Mehr Holz!“ in einen Baum geritzt. Der Baum findet das nicht lustig.',
  'Ein fahrender Händler preist „Quantenpilze“ an. Sie sind gleichzeitig giftig und lecker.',
  'Eine Biene tanzt dir die Koordinaten der nächsten Blumenwiese. Du verstehst nur Tanz.',
  'Ein Stein liegt still da. Er hat ein gutes Leben.',
  'Ein Kobold versucht, deine Axt zu klauen. Sie ist zu schwer für ihn.',
  'Der Mond geht auf. Er sieht heute irgendwie nach Käse aus.',
  'Ein Druide flüstert: „Photosynthese ist auch nur Solarenergie mit extra Schritten.“',
  'Ein Schmied in der Ferne hämmert im Takt. Das klingt nach Phase 3.',
];

/** All flavor pools, for counting and for the debug panel. */
export const FLAVOR_POOLS: Record<string, string[]> = {
  LOADING_TIPS,
  LEVEL_UP_LINES,
  RARE_DROP_LINES,
  NEWTON_LINES,
  INTELLIGENCE_LINES,
  BURNT_LINES,
  INVENTORY_FULL_LINES,
  NO_INPUT_LINES,
  FIRE_OUT_LINES,
  NO_FIRE_LINES,
  FIRE_LIT_LINES,
  BUY_LINES,
  SELL_LINES,
  TOOL_LINES,
  SLOT_LINES,
  WELCOME_LINES,
  OFFLINE_LINES,
  IDLE_LINES,
  RANDOM_CHATTER,
  ...Object.fromEntries(
    Object.entries(ACTION_START_LINES).map(([k, v]) => [`ACTION_START_${k}`, v]),
  ),
};
