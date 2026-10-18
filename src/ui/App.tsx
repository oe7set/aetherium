import { lazy, Suspense, useEffect } from 'react';
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
import { SkillList } from './skills/SkillList';
import { SkillView } from './skills/SkillView';
import { TabBar } from './TabBar';
import { TitleScreen } from './TitleScreen';
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
        if (store.offlineSummary) store.dismissOffline();
        else store.setUi({ tab: 'world', skillDetail: false });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
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
  const label = t(`tab.${tab}` as MessageKey);
  return (
    <div className="layout-mobile">
      <Header />
      <div className="stage">
        <World />
        <Feed limit={2} compact />
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
  return (
    <>
      {desktop ? <DesktopLayout /> : <MobileLayout />}
      <LevelUpBanner />
      <AchievementToast />
      <Confetti />
      <OfflineModal />
      <TitleScreen />
      <DailyModal />
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
