import { useState } from 'react';
import { ERAS, TECHS } from '../../data';
import { techStatus } from '../../engine';
import { useGame } from '../../store/gameStore';
import { useFmt } from '../hooks';
import { describeMods } from '../modText';
import { CodexPanel } from './CodexPanel';
import { HelpersPanel } from './HelpersPanel';

type Segment = 'tech' | 'codex' | 'helpers';

const UNLOCK_LABELS: Record<string, string> = {
  'skill:farming': '🌾 Landwirtschaft',
  'skill:hunting': '🦌 Jagen',
  'skill:arcane': '🔮 Arkanes Schürfen',
  'skill:alchemy': '🧪 Alchemie',
  'skill:enchanting': '✨ Verzauberung',
  helpers: '🧑‍🎓 Helfer',
  helperSlot: '+1 Helferplatz',
  plot: '+1 Beet',
  autoHarvest: '🚜 Auto-Ernte',
  accelerator: '🌀 Element-Synthese',
};

function TechTree() {
  const research = useGame((s) => s.game.research);
  const techs = useGame((s) => s.game.techs);
  const game = useGame((s) => s.game);
  const doResearch = useGame((s) => s.research);
  const { num } = useFmt();
  const [showDone, setShowDone] = useState(false);

  return (
    <div className="tech-tree">
      <p>
        🔬 <b>{num(research)}</b> Forschungspunkte · {techs.length}/{TECHS.length} erforscht
      </p>
      <p className="muted small">
        Forschungspunkte entstehen bei jeder Aktion, jedem besiegten Monster und aus
        Forschungsnotizen.
      </p>
      <label className="toggle small">
        <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
        Erforschtes anzeigen
      </label>
      {ERAS.map((era) => {
        const list = TECHS.filter((tech) => tech.era === era);
        const visible = list.filter((tech) => showDone || !techs.includes(tech.id));
        const anyKnown = list.some((tech) => techStatus(game, tech.id) !== 'locked');
        if (!visible.length) return null;
        return (
          <section key={era}>
            <h4 className="group-title">{era}</h4>
            {!anyKnown ? (
              <p className="muted small">🔒 Noch im Nebel der Geschichte verborgen.</p>
            ) : (
              <div className="tech-list">
                {visible.map((tech) => {
                  const status = techStatus(game, tech.id);
                  const affordable = research >= tech.cost;
                  return (
                    <div key={tech.id} className={`tech-node ${status}`}>
                      <span className="tech-icon">{status === 'locked' ? '🔒' : tech.icon}</span>
                      <span className="tech-body">
                        <strong>{tech.name}</strong>
                        <small className="muted">{tech.desc}</small>
                        {tech.mods && (
                          <small className="reward">🎁 {describeMods(tech.mods)}</small>
                        )}
                        {tech.unlocks && (
                          <small className="reward">
                            🔓 {tech.unlocks.map((u) => UNLOCK_LABELS[u] ?? u).join(', ')}
                          </small>
                        )}
                        {status === 'locked' && (
                          <small className="muted">
                            Benötigt:{' '}
                            {tech.requires
                              .map((r) => TECHS.find((x) => x.id === r)?.name ?? r)
                              .join(', ')}
                          </small>
                        )}
                      </span>
                      {status === 'researched' ? (
                        <span className="tag">✔</span>
                      ) : (
                        <button
                          className={`btn ${affordable && status === 'available' ? 'btn-primary' : ''}`}
                          disabled={status !== 'available' || !affordable}
                          onClick={() => doResearch(tech.id)}
                        >
                          🔬 {num(tech.cost)}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function ResearchPanel() {
  const [seg, setSeg] = useState<Segment>('tech');
  const helpersUnlocked = useGame((s) => s.game.techs.includes('interns'));
  const codexUnlocked = useGame((s) => s.game.techs.includes('proto_alchemy'));
  return (
    <div className="panel research">
      <div className="segments" role="tablist">
        <button
          role="tab"
          aria-selected={seg === 'tech'}
          className={`segment ${seg === 'tech' ? 'active' : ''}`}
          onClick={() => setSeg('tech')}
        >
          Tech-Baum
        </button>
        <button
          role="tab"
          aria-selected={seg === 'codex'}
          className={`segment ${seg === 'codex' ? 'active' : ''}`}
          onClick={() => setSeg('codex')}
        >
          {codexUnlocked ? '' : '🔒 '}Elemente
        </button>
        <button
          role="tab"
          aria-selected={seg === 'helpers'}
          className={`segment ${seg === 'helpers' ? 'active' : ''}`}
          onClick={() => setSeg('helpers')}
        >
          {helpersUnlocked ? '' : '🔒 '}Helfer
        </button>
      </div>
      {seg === 'tech' && <TechTree />}
      {seg === 'codex' && <CodexPanel />}
      {seg === 'helpers' && <HelpersPanel />}
    </div>
  );
}
