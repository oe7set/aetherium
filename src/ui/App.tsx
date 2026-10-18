import { useEffect } from 'react';
import { t, type MessageKey } from '../i18n';
import { useGame, type TabId } from '../store/gameStore';
import { ActiveActionBar } from './ActiveActionBar';
import { BottomSheet } from './BottomSheet';
import { Feed } from './Feed';
import { Header } from './Header';
import { useIsDesktop } from './hooks';
import { InventoryPanel } from './inventory/InventoryPanel';
import { LevelUpBanner } from './LevelUpBanner';
import { MenuPanel } from './menu/MenuPanel';
import { OfflineModal } from './OfflineModal';
import { ResearchPanel } from './ResearchPanel';
import { SkillList } from './skills/SkillList';
import { SkillView } from './skills/SkillView';
import { TabBar } from './TabBar';
import { TABS } from './tabs';
import { WorldView } from './WorldView';

function useKeyboardShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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
        <WorldView />
        <Feed limit={2} compact />
      </div>
      <BottomSheet open={tab !== 'world'} onClose={() => setUi({ tab: 'world' })} label={label}>
        {tab === 'skills' && <MobileSkills />}
        {tab === 'inventory' && <InventoryPanel />}
        {tab === 'research' && <ResearchPanel />}
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
        <div className="stage">
          <WorldView />
        </div>
        <ActiveActionBar />
        <TabBar tabs={DESKTOP_CENTER_TABS} />
        <div className="center-panel">
          {center === 'skills' && <SkillView skillId={selected} />}
          {center === 'research' && <ResearchPanel />}
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
  useKeyboardShortcuts();
  return (
    <>
      {desktop ? <DesktopLayout /> : <MobileLayout />}
      <LevelUpBanner />
      <OfflineModal />
    </>
  );
}
