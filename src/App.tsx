import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import { Header } from './components/Header';
import { LeftPanel } from './components/LeftPanel';
import { ValueLadder } from './components/ValueLadder';
import { SourceDrawer } from './components/Source';
import { dropRedLine, getState, hooks, replan, setLayer, setRound, setState, VIEW_ORDER } from './components/store';
import { MapView } from './map/MapView';

function App() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.key === 'Escape') {
        setState({ drawer: null, selection: null });
        el?.blur?.();
        return;
      }
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === '1' || k === '2' || k === '3') setRound(Number(k) - 1);
      else if (k === 'r') replan();
      else if (k === 'b') setLayer('ring', !getState().layers.ring);
      else if (k === 'l') dropRedLine();
      else if (k === 'v') {
        const i = VIEW_ORDER.indexOf(getState().view);
        setState({ view: VIEW_ORDER[(i + 1) % VIEW_ORDER.length] });
      } else if (k === 'g') {
        e.preventDefault();
        document.getElementById('grok-input')?.focus();
      } else if (k === ' ') {
        e.preventDefault();
        hooks.next?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0">
        <LeftPanel />
        <main className="relative flex-1 min-w-0">
          <MapView />
          <ValueLadder />
        </main>
      </div>
      <SourceDrawer />
    </div>
  );
}

const w = window as any;
w.__root = w.__root ?? createRoot(document.getElementById('root')!);
w.__root.render(<App />);
