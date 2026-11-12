import { anySample, redTeam, sampleSources } from './data';
import { setState, useStore, type ViewMode } from './store';

export const VIEWS: { id: ViewMode; label: string }[] = [
  { id: 'satellite3d', label: 'Satellite 3D' },
  { id: 'dark', label: 'Dark' },
  { id: 'flows', label: 'Grid flows' },
  { id: 'columns', label: 'Columns' },
];

export function Header() {
  const view = useStore((s) => s.view);
  return (
    <header className="hdr">
      <span className="hdr-title">ConsentLoop DC</span>
      <span className="text-slate-600">/</span>
      <span className="text-slate-200">Ratcliffe-on-Soar Power Station</span>
      <span className="badge">Rushcliffe BC</span>
      <span className="badge">NGED East Midlands</span>
      <span className={redTeam.checked ? 'badge-est' : 'badge-amber'} title="Computed from the loaded evidence rows: rows passing the Red Team check / rows checked">
        Red Team {redTeam.passed}/{redTeam.checked} pass
      </span>
      <span className="flex-1" />
      <span className="text-slate-500 text-[10px] uppercase tracking-widest">View</span>
      <div className="seg">
        {VIEWS.map((v) => (
          <button key={v.id} data-view={v.id} className={view === v.id ? 'on' : ''} onClick={() => setState({ view: v.id })}>
            {v.label}
          </button>
        ))}
      </div>
      {anySample ? (
        <span className="badge-amber" title={`Sample files in use: ${sampleSources.join(', ')}`}>
          sample data
        </span>
      ) : null}
    </header>
  );
}
