import { Component, lazy, Suspense, useMemo, type ReactNode } from 'react';
import { getAction } from '../data';
import { registerLabel } from '../scene/labels';
import { STATIONS } from '../scene/layout';
import { detectQuality, hasWebGL, resolveQuality } from '../scene/quality';
import { useGame } from '../store/gameStore';
import { WorldView } from './WorldView';

const WorldScene = lazy(() => import('../scene/Scene'));

/** If WebGL blows up at runtime, fall back to the 2D world instead of a blank screen. */
class SceneBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.error('3D-Szene abgestürzt, wechsle auf 2D', err);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function SceneLabels() {
  const active = useGame((s) =>
    s.game.combat ? 'combat' : s.game.active ? getAction(s.game.active.actionId).skill : null,
  );
  return (
    <div className="scene-labels" aria-hidden>
      {STATIONS.map((st) => (
        <span
          key={st.skill}
          ref={(el) => registerLabel(st.skill, el)}
          className={`scene-label ${active === st.skill ? 'active' : ''}`}
        >
          {st.label}
        </span>
      ))}
    </div>
  );
}

/** Chooses between the 3D island and the 2D diorama (battery mode / no WebGL). */
export function World() {
  const batteryMode = useGame((s) => s.game.settings.batteryMode);
  const graphics = useGame((s) => s.game.settings.graphics);
  const webgl = useMemo(() => hasWebGL(), []);
  const quality = useMemo(
    () =>
      resolveQuality(
        graphics,
        detectQuality(navigator as Navigator & { deviceMemory?: number }, window.innerWidth),
      ),
    [graphics],
  );

  if (batteryMode || !webgl) return <WorldView />;
  return (
    <div className="world world-3d">
      <SceneBoundary fallback={<WorldView />}>
        <Suspense fallback={<WorldView />}>
          <WorldScene quality={quality} />
          <SceneLabels />
        </Suspense>
      </SceneBoundary>
    </div>
  );
}
