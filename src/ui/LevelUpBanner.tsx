import { useEffect } from 'react';
import { getSkill } from '../data';
import { t } from '../i18n';
import { useGame } from '../store/gameStore';

/** Big celebratory banner on level-up. Auto-hides; the feed keeps the flavor line. */
export function LevelUpBanner() {
  const levelUp = useGame((s) => s.levelUp);
  const dismiss = useGame((s) => s.dismissLevelUp);

  useEffect(() => {
    if (!levelUp) return;
    const id = window.setTimeout(dismiss, 2600);
    return () => window.clearTimeout(id);
  }, [levelUp, dismiss]);

  if (!levelUp) return null;
  const skill = getSkill(levelUp.skill);
  return (
    <div
      className="levelup"
      key={levelUp.at}
      onClick={dismiss}
      style={{ ['--accent' as string]: skill.color }}
    >
      <div className="levelup-burst" aria-hidden>
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} style={{ ['--a' as string]: `${i * 30}deg` }}>
            ✦
          </span>
        ))}
      </div>
      <div className="levelup-card">
        <span className="levelup-icon">{skill.icon}</span>
        <strong>{t('levelUp.title')}</strong>
        <span>
          {skill.name} → <b>{levelUp.level}</b>
        </span>
      </div>
    </div>
  );
}
