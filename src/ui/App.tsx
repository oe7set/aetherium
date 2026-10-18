import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { t, type MessageKey } from '../i18n';
import { useGame, type TabId } from '../store/gameStore';
import { AchievementToast } from './AchievementToast';
import { ActiveActionBar } from './ActiveActionBar';
import { BuffBar } from './BuffBar';
import { Confetti } from './Confetti';
import { BottomSheet } from './BottomSheet';
import { Feed } from './Feed';
import { Header } from './Header';
import { useIsDesktop } from './hooks';
import { InventoryPanel } from './inventory/InventoryPanel';
import { LevelUpBanner } from './LevelUpBanner';
import { MenuPanel } from './menu/MenuPanel';
import { OfflineModal } from './OfflineModal';
import { VillagePanel } from './village/VillagePanel';
import { RiftPanel } from './rift/RiftPanel';
import { useRiftRun } from './rift/runStore';
import { usePerfClass } from './perf';
import { useAccessibility } from './a11y';
import { setMusic, type MusicTheme } from './music';
import { dayPhase, daylight } from '../scene/time';
import { SkillList } from './skills/SkillList';
import { SkillView } from './skills/SkillView';
import { TabBar } from './TabBar';
import { TitleScreen } from './TitleScreen';
import { QuickNav } from './QuickNav';
import { AgendaPanel } from './Agenda';
import { ChronicleBanner } from './rewards/ChronicleBanner';
import { DailyModal } from './rewards/DailyModal';
import { RewardReveal } from './rewards/RewardReveal';
import { TABS } from './tabs';
import { World } from './World';

const RiftOverlay = lazy(() => import('./rift/RiftOverlay'));

function useKeyboardShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (useRiftRun.getState().run) return; // the arena owns the keyboard
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      const store = useGame.getState();
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < TABS.length) {
        store.setUi({ tab: TABS[idx]!.id });
      } else if (e.key === ' ') {
        e.preventDefault();
        store.click();
      } else if (e.key === 's' || e.key === 'S') {
        store.stop();
      } else if (e.key === 'Escape') {
        if (store.ui.agenda) store.setUi({ agenda: false });
        else if (store.offlineSummary) store.dismissOffline();
        else store.setUi({ tab: 'world', skillDetail: false });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

/** Background music follows the area: island, village, hero menu or a running rift. */
function useBackgroundMusic() {
  const enabled = useGame((s) => s.game.settings.music);
  const volume = useGame((s) => s.game.settings.musicVolume);
  const tab = useGame((s) => s.ui.tab);
  const inRift = useRiftRun((s) => s.run !== null);
  const trial = useRiftRun((s) => s.run?.config.trial === true);
  // A living boss in a normal rift run switches to the boss theme (checked every 2 s).
  const [bossAlive, setBossAlive] = useState(false);
  useEffect(() => {
    if (!inRift) {
      setBossAlive(false);
      return;
    }
    const id = window.setInterval(() => {
      const run = useRiftRun.getState().run;
      setBossAlive(!!run?.enemies.some((e) => (e.boss || e.final) && !e.dead));
    }, 2000);
    return () => window.clearInterval(id);
  }, [inRift]);
  // Night on the island (in-game clock, 20 min per day): re-checked every 20 s.
  const [night, setNight] = useState(() => daylight(dayPhase()) < 0.25);
  useEffect(() => {
    const id = window.setInterval(() => setNight(daylight(dayPhase()) < 0.25), 20000);
    return () => window.clearInterval(id);
  }, []);
  const theme: MusicTheme =
    trial || (inRift && bossAlive)
      ? 'boss'
      : inRift
        ? 'rift'
        : tab === 'village'
          ? 'village'
          : tab === 'rift'
            ? 'hero'
            : night
              ? 'night'
              : 'island';
  useEffect(() => {
    setMusic({ enabled, volume, theme });
  }, [enabled, volume, theme]);
}

/**
 * Phone back button / gesture: closes the open overlay or panel instead of leaving the game.
 * One history entry stands for "something is open"; closing in the UI consumes it again.
 */
function useBackButton(enabled: boolean) {
  const open = useGame((s) => s.ui.tab !== 'world' || s.ui.agenda || s.ui.quickNav || s.dailyOpen);
  const pushed = useRef(false);
  useEffect(() => {
    if (!enabled) return;
    if (open && !pushed.current) {
      window.history.pushState({ aetherium: true }, '');
      pushed.current = true;
    } else if (!open && pushed.current) {
      pushed.current = false;
      window.history.back();
    }
  }, [open, enabled]);
  useEffect(() => {
    if (!enabled) return;
    const onPop = () => {
      if (!pushed.current || useRiftRun.getState().run) return;
      pushed.current = false;
      const { ui, setUi, dailyOpen, setDailyOpen } = useGame.getState();
      if (dailyOpen) setDailyOpen(false);
      else if (ui.agenda || ui.quickNav) setUi({ agenda: false, quickNav: false });
      else if (ui.tab === 'skills' && ui.skillDetail) setUi({ skillDetail: false });
      else setUi({ tab: 'world' });
      // Still something open (e.g. skill detail → list)? Keep one entry for the next back.
      const after = useGame.getState();
      if (after.ui.tab !== 'world' || after.ui.agenda || after.ui.quickNav || after.dailyOpen) {
        window.history.pushState({ aetherium: true }, '');
        pushed.current = true;
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [enabled]);
}

function MobileSkills() {
  const detail = useGame((s) => s.ui.skillDetail);
  const selected = useGame((s) => s.ui.selectedSkill);
  const setUi = useGame((s) => s.setUi);
  return detail ? (
    <SkillView skillId={selected} onBack={() => setUi({ skillDetail: false })} />
  ) : (
    <div className="panel">
      <SkillList />
    </div>
  );
}

function MobileLayout() {
  const tab = useGame((s) => s.ui.tab);
  const setUi = useGame((s) => s.setUi);
  const label = `${TABS.find((tb) => tb.id === tab)?.icon ?? ''} ${t(`tab.${tab}` as MessageKey)}`;
  const idle = useGame((s) => !s.game.active && !s.game.combat);
  return (
    <div className={`layout-mobile${idle ? ' is-idle' : ''}`}>
      <Header />
      <div className="stage">
        <World />
        {tab === 'world' && <Feed limit={1} compact />}
        <BuffBar />
        <div className="stage-goal">
          <ChronicleBanner compact />
        </div>
      </div>
      <BottomSheet open={tab !== 'world'} onClose={() => setUi({ tab: 'world' })} label={label}>
        {tab === 'skills' && <MobileSkills />}
        {tab === 'inventory' && <InventoryPanel />}
        {tab === 'village' && <VillagePanel />}
        {tab === 'rift' && <RiftPanel />}
        {tab === 'menu' && <MenuPanel />}
      </BottomSheet>
      <ActiveActionBar />
      <TabBar />
    </div>
  );
}

const DESKTOP_CENTER_TABS = TABS.filter((tb) => tb.id !== 'inventory');

function DesktopLayout() {
  const tab = useGame((s) => s.ui.tab);
  const selected = useGame((s) => s.ui.selectedSkill);
  // On desktop the inventory lives in the right column, so its tab maps to the skill view.
  const center: TabId = tab === 'inventory' || tab === 'world' ? 'skills' : tab;
  return (
    <div className="layout-desktop">
      <Header />
      <aside className="col-left">
        <SkillList />
      </aside>
      <main className="col-center">
        {/* The village needs the room: it replaces the 3D stage while open. */}
        {center !== 'village' && (
          <div className="stage">
            <World />
            <BuffBar />
          </div>
        )}
        <ChronicleBanner />
        <ActiveActionBar />
        <TabBar tabs={DESKTOP_CENTER_TABS} />
        <div className="center-panel">
          {center === 'skills' && <SkillView skillId={selected} />}
          {center === 'village' && <VillagePanel />}
          {center === 'rift' && <RiftPanel />}
          {center === 'menu' && <MenuPanel />}
        </div>
      </main>
      <aside className="col-right">
        <InventoryPanel />
        <Feed limit={30} />
      </aside>
    </div>
  );
}

export function App() {
  const desktop = useIsDesktop();
  const inRift = useRiftRun((s) => s.run !== null);
  useKeyboardShortcuts();
  usePerfClass();
  useAccessibility();
  useBackgroundMusic();
  useBackButton(!desktop);
  return (
    <>
      {desktop ? <DesktopLayout /> : <MobileLayout />}
      <LevelUpBanner />
      <AchievementToast />
      <Confetti />
      <OfflineModal />
      <TitleScreen />
      <DailyModal />
      <QuickNav />
      <AgendaPanel />
      <RewardReveal />
      {inRift && (
        <Suspense
          fallback={<div className="rift-overlay rift-loading">🌀 Der Riss öffnet sich …</div>}
        >
          <RiftOverlay />
        </Suspense>
      )}
    </>
  );
}
