import { collectionsClaimable } from './collections';
import { canStartAdventure } from './hero';
import { freeSlots } from './inventory';
import { canDeliver } from './guilds';
import { claimableMilestones } from './milestones';
import { canFinishStage } from './projects';
import { empireRankReached } from './empire';
import { activeIslandEvent } from './islandEvents';
import { supplyReady } from './villageSupply';
import { EMPIRE_RANKS } from '../data/empire';
import { PROJECTS } from '../data/projects';
import { QUEST_MAP, questProgress, questStatus, taskProgress, weekKey, dayKey } from './meta';
import { QUESTS } from '../data/meta';
import { SKILL_MAP, SKILLS, TOOL_MAP, toolsForSkill } from '../data';
import { skillLevel } from './skills';
import { currentChronicle, dailyAvailable, passClaimable } from './progress';
import { canStartRun } from './rift';
import { affordableTechs } from './science';
import type { GameState } from './state';
import { formatDuration } from './format';
import {
  activeVillage,
  buildingLevel,
  canUpgradeBuilding,
  canUpgradeField,
  invasionDefense,
  invasionStrength,
  invasionTarget,
} from './village';
import { V_BUILDINGS } from '../data/village';
import { ISLAND_BUILDINGS } from '../data/construction';
import { canBuildIsland } from './construction';

/**
 * "Was jetzt?": everything across island, village, hero, rift and rewards that is waiting for the
 * player right now, most important first. Pure data – the UI maps `target` to a screen.
 */
export type AgendaTarget =
  | { area: 'daily' }
  | { area: 'world' }
  | { area: 'chronicle' }
  | { area: 'skills' }
  | { area: 'skill'; skill: string }
  | { area: 'inventory'; section: 'items' | 'album' | 'tools' }
  | { area: 'village'; section: 'fields' | 'center' | 'reports' | 'military' }
  | { area: 'hero'; section: 'hero' | 'adventures' | 'start' | 'boss' }
  | {
      area: 'menu';
      section: 'home' | 'pass' | 'research' | 'quests' | 'projects';
      sub?: 'tasks' | 'guilds' | 'quests';
    };

export interface AgendaItem {
  id: string;
  icon: string;
  title: string;
  detail: string;
  /** Rewards wait (gold glow) vs. something to do. */
  kind: 'reward' | 'todo';
  target: AgendaTarget;
}

export function agenda(s: GameState, now: number): AgendaItem[] {
  const out: AgendaItem[] = [];
  const add = (item: AgendaItem) => out.push(item);

  // --- Rewards waiting --------------------------------------------------------------------------
  if (dailyAvailable(s, now))
    add({
      id: 'daily',
      icon: '🎁',
      title: 'Tagesbelohnung abholen',
      detail: `Serie: ${s.progress.streak} ${s.progress.streak === 1 ? 'Tag' : 'Tage'}`,
      kind: 'reward',
      target: { area: 'daily' },
    });
  const chronicle = currentChronicle(s);
  if (chronicle?.done)
    add({
      id: 'chronicle',
      icon: chronicle.step.icon,
      title: 'Chronik-Ziel erreicht',
      detail: chronicle.step.title,
      kind: 'reward',
      target: { area: 'chronicle' },
    });
  const pass = passClaimable(s).length;
  if (pass > 0)
    add({
      id: 'pass',
      icon: '🏅',
      title: `Ruhmesleiter: ${pass} ${pass === 1 ? 'Stufe' : 'Stufen'} abholen`,
      detail: 'Belohnungen warten',
      kind: 'reward',
      target: { area: 'menu', section: 'pass' },
    });
  const album = collectionsClaimable(s);
  if (album.length > 0)
    add({
      id: 'album',
      icon: '📗',
      title: 'Sammelbuch-Set abschließen',
      detail: album.map((c) => c.name).join(', '),
      kind: 'reward',
      target: { area: 'inventory', section: 'album' },
    });
  const tasksDone = s.tasks.list.filter(
    (tk) => !tk.claimed && taskProgress(s, tk) >= tk.target,
  ).length;
  const questsDone = Object.keys(s.quests.active).filter((id) => {
    const q = QUEST_MAP.get(id);
    return q && questProgress(s, q).every((p) => p.done);
  }).length;
  if (questsDone > 0)
    add({
      id: 'quests',
      icon: '📜',
      title: `${questsDone} ${questsDone === 1 ? 'Quest' : 'Quests'} abgeben`,
      detail: 'Alle Ziele erfüllt',
      kind: 'reward',
      target: { area: 'menu', section: 'quests', sub: 'quests' },
    });
  const supply = supplyReady(s);
  if (supply >= 25)
    add({
      id: 'village-supply',
      icon: '🚚',
      title: 'Lieferung aus dem Dorf',
      detail: `${supply} Waren warten auf die Insel`,
      kind: 'reward',
      target: { area: 'village', section: 'center' },
    });
  const isle = activeIslandEvent(s);
  if (isle?.trader && s.islandEvent.deals.some((d) => !d.bought && s.gold.gte(d.price)))
    add({
      id: 'island-trader',
      icon: isle.icon,
      title: 'Der Wanderhändler ist da!',
      detail: `Seltene Waren – noch ${Math.ceil(s.islandEvent.left / 60)} min`,
      kind: 'todo',
      target: { area: 'world' },
    });
  else if (isle && isle.skills[0])
    add({
      id: 'island-event',
      icon: isle.icon,
      title: `${isle.name} auf der Insel!`,
      detail: `Boni für ${isle.skills.length} Skills – noch ${Math.ceil(s.islandEvent.left / 60)} min`,
      kind: 'todo',
      target: { area: 'skill', skill: isle.skills[0] },
    });
  if (empireRankReached(s) > s.empireRank)
    add({
      id: 'empire-rank',
      icon: '👑',
      title: 'Neuer Reichsrang erreicht!',
      detail: `Aufsteigen zu „${EMPIRE_RANKS[s.empireRank + 1]?.name ?? ''}"`,
      kind: 'reward',
      target: { area: 'menu', section: 'home' },
    });
  const proj = PROJECTS.find((p) => canFinishStage(s, p.id));
  if (proj)
    add({
      id: 'project',
      icon: proj.icon,
      title: `${proj.name}: Bauabschnitt fertigstellen`,
      detail: 'Alle Waren sind im Inventar',
      kind: 'reward',
      target: { area: 'menu', section: 'projects' },
    });
  const ms = claimableMilestones(s);
  if (ms.length)
    add({
      id: 'milestones',
      icon: '🎖️',
      title:
        ms.length === 1 ? 'Skill-Meilenstein abholen' : `${ms.length} Skill-Meilensteine abholen`,
      detail: `${SKILL_MAP.get(ms[0]!.skill)?.name ?? ''} Stufe ${ms[0]!.level}${ms.length > 1 ? ' und mehr' : ''}`,
      kind: 'reward',
      target: { area: 'skill', skill: ms[0]!.skill },
    });
  const ready = s.guilds.orders.filter((o) => canDeliver(s, o)).length;
  if (ready)
    add({
      id: 'guild-orders',
      icon: '📜',
      title: ready === 1 ? 'Zunftauftrag lieferbar' : `${ready} Zunftaufträge lieferbar`,
      detail: 'Gold, XP und Ruf bei den Zünften',
      kind: 'reward',
      target: { area: 'menu', section: 'quests', sub: 'guilds' },
    });
  if (tasksDone > 0)
    add({
      id: 'tasks',
      icon: '📋',
      title: `${tasksDone} ${tasksDone === 1 ? 'Auftrag' : 'Aufträge'} erledigt`,
      detail: 'Belohnung abholen',
      kind: 'reward',
      target: { area: 'menu', section: 'quests', sub: 'tasks' },
    });

  const chainQuest = QUESTS.find((q) => q.chain && questStatus(s, q.id) === 'available');
  if (chainQuest)
    add({
      id: 'chain-quest',
      icon: chainQuest.icon,
      title: `Neue Quest: ${chainQuest.name}`,
      detail: `${chainQuest.chain} – ${chainQuest.giver} wartet`,
      kind: 'todo',
      target: { area: 'menu', section: 'quests', sub: 'quests' },
    });

  // --- Hero -------------------------------------------------------------------------------------
  const h = s.hero;
  if (h.status === 'adventure')
    add({
      id: 'hero-at-adventure',
      icon: '⚔️',
      title: 'Held steht am Abenteuer',
      detail: 'Live kämpfen oder automatisch erkunden',
      kind: 'todo',
      target: { area: 'hero', section: 'adventures' },
    });
  if (h.status === 'dead' && h.revive <= 0)
    add({
      id: 'hero-revive',
      icon: '💖',
      title: 'Held wiederbeleben',
      detail: 'Er ist bereit, zurückzukehren',
      kind: 'todo',
      target: { area: 'hero', section: 'hero' },
    });
  if (h.points > 0)
    add({
      id: 'hero-points',
      icon: '⭐',
      title: `${h.points} Attributpunkte verteilen`,
      detail: 'Stärkt Dorf und Riss',
      kind: 'todo',
      target: { area: 'hero', section: 'hero' },
    });
  const startable = h.adventures.filter((a) => canStartAdventure(s, a.id).ok).length;
  if (startable > 0)
    add({
      id: 'adventures',
      icon: '❗',
      title: `${startable} ${startable === 1 ? 'Abenteuer wartet' : 'Abenteuer warten'}`,
      detail: 'Beute, Helden-XP und Rohstoffe',
      kind: 'todo',
      target: { area: 'hero', section: 'adventures' },
    });
  const w = s.rift.weekly;
  if (!(w.week === weekKey(now) && w.won) && canStartRun(s, s.rift.hero, s.rift.biome).ok)
    add({
      id: 'weekly',
      icon: '🦹',
      title: 'Wochenboss noch offen',
      detail: 'Großer Preis für den ersten Sieg der Woche',
      kind: 'todo',
      target: { area: 'hero', section: 'start' },
    });
  const wbf = s.worldBoss.fight;
  if (wbf)
    add({
      id: 'world-boss',
      icon: '👹',
      title: wbf.strikeCd > 0 ? 'Weltboss vor der Insel' : 'Weltboss: Schlag bereit!',
      detail: `${Math.round((wbf.hp / wbf.maxHp) * 100)} % Leben übrig`,
      kind: wbf.strikeCd > 0 ? 'todo' : 'reward',
      target: { area: 'hero', section: 'boss' },
    });
  const d = s.rift.daily;
  if (
    s.rift.runs > 0 &&
    !(d.day === dayKey(now) && d.claimed) &&
    canStartRun(s, s.rift.hero, s.rift.biome).ok
  )
    add({
      id: 'daily-rift',
      icon: '📅',
      title: 'Tagesriss wartet',
      detail: 'Fester Seed, Fluch des Tages, Bonus für den ersten Lauf',
      kind: 'todo',
      target: { area: 'hero', section: 'start' },
    });

  // --- Village ----------------------------------------------------------------------------------
  const v = activeVillage(s);
  if (v.queue.field.length === 0 && v.fields.some((_, i) => canUpgradeField(s, v, i).ok))
    add({
      id: 'village-fields',
      icon: '🌾',
      title: 'Baumeister frei: Felder ausbauen',
      detail: `${v.name} – mehr Rohstoffe pro Stunde`,
      kind: 'todo',
      target: { area: 'village', section: 'fields' },
    });
  if (v.queue.center.length === 0 && V_BUILDINGS.some((b) => canUpgradeBuilding(s, v, b.id).ok))
    add({
      id: 'village-center',
      icon: '🏗️',
      title: 'Baumeister frei: Gebäude bauen',
      detail: `${v.name} – neue Boni für Insel und Held`,
      kind: 'todo',
      target: { area: 'village', section: 'center' },
    });
  // The beginner protection is about to end and the village could not hold a horde yet.
  if (s.village.protection > 0 && s.village.protection < 6 * 3600) {
    const target = invasionTarget(s);
    if (invasionDefense(s, target).total < invasionStrength(s)) {
      const hasBarracks = buildingLevel(target, 'barracks') > 0;
      add({
        id: 'protection-ending',
        icon: '🕊️',
        title: 'Anfängerschutz endet bald',
        detail: `in ${formatDuration(s.village.protection)} – ${hasBarracks ? 'bilde Truppen aus' : 'baue Kaserne und Mauer'}, sonst plündert der Riss`,
        kind: 'todo',
        target: { area: 'village', section: hasBarracks ? 'military' : 'center' },
      });
    }
  }
  if (s.village.protection <= 0 && s.village.invasionIn < 1800) {
    const target = invasionTarget(s);
    const ratio = invasionDefense(s, target).total / invasionStrength(s);
    add({
      id: 'invasion',
      icon: '🌀',
      title: `Riss-Horde naht: ${target.name}`,
      detail: `in ${formatDuration(s.village.invasionIn)} – Verteidigung ${ratio >= 1.3 ? 'sicher' : ratio >= 0.9 ? 'knapp' : 'zu schwach'}`,
      kind: 'todo',
      target: { area: 'village', section: 'military' },
    });
  }
  if (s.village.unread > 0)
    add({
      id: 'reports',
      icon: '📜',
      title: `${s.village.unread} neue ${s.village.unread === 1 ? 'Bericht' : 'Berichte'}`,
      detail: 'Raubzüge, Handel, Invasionen',
      kind: 'todo',
      target: { area: 'village', section: 'reports' },
    });

  // --- Island -----------------------------------------------------------------------------------
  const techs = affordableTechs(s).length;
  if (techs > 0)
    add({
      id: 'research',
      icon: '🔬',
      title: `${techs} ${techs === 1 ? 'Forschung' : 'Forschungen'} bezahlbar`,
      detail: 'Neue Skills, Tempo und Boni',
      kind: 'todo',
      target: { area: 'menu', section: 'research' },
    });
  // A better tool the player can afford right now (any tool skill).
  const upgrade = SKILLS.filter((sk) => sk.usesTools)
    .map((sk) => {
      const tier = TOOL_MAP.get(s.equippedTools[sk.id] ?? '')?.tier ?? -1;
      return toolsForSkill(sk.id).find(
        (t) =>
          t.tier > tier &&
          !s.ownedTools.includes(t.id) &&
          skillLevel(s, sk.id) >= t.levelReq &&
          s.gold.gte(t.price),
      );
    })
    .find((t) => t);
  if (upgrade)
    add({
      id: 'tool-upgrade',
      icon: upgrade.icon,
      title: `Besseres Werkzeug: ${upgrade.name}`,
      detail: `×${upgrade.speed} Tempo – du kannst es dir leisten`,
      kind: 'todo',
      target: { area: 'inventory', section: 'tools' },
    });
  // Baukunst: an island building is ready to go up.
  const buildable = ISLAND_BUILDINGS.find((b) => canBuildIsland(s, b.id) === 'ok');
  if (buildable)
    add({
      id: 'island-build',
      icon: buildable.icon,
      title: `${buildable.name} bauen`,
      detail: 'Alle Baustoffe da – dauerhafter Inselbonus',
      kind: 'todo',
      target: { area: 'skill', skill: 'construction' },
    });
  // Kopfgeldjagd: a fighter without a contract is leaving slayer XP on the table.
  if (
    !s.slayer.task &&
    (s.combat || s.stats.monstersKilled || 0) &&
    skillLevel(s, 'hitpoints') >= 12
  )
    add({
      id: 'slayer',
      icon: '🎯',
      title: 'Kopfgeld-Auftrag holen',
      detail: `${s.slayer.points} Kopfgeldpunkte · Serie ${s.slayer.streak}`,
      kind: 'todo',
      target: { area: 'skill', skill: 'slayer' },
    });
  if (freeSlots(s) <= 0)
    add({
      id: 'bag-full',
      icon: '🎒',
      title: 'Taschen voll',
      detail: 'Verkaufen oder Platz kaufen – sonst geht Beute verloren',
      kind: 'todo',
      target: { area: 'inventory', section: 'items' },
    });
  if (!s.active && !s.combat)
    add({
      id: 'idle',
      icon: '🧍',
      title: 'Deine Figur ist untätig',
      detail: 'Starte eine Aktion – sie läuft auch offline weiter',
      kind: 'todo',
      target: { area: 'skills' },
    });
  return out;
}
