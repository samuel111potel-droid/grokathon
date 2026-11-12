// Replay runner for the Grok co-pilot: plays data/agent/script.json with typing and the cursor. No network.
import { agentScript, isCitable, resolveCitation } from '../components/data';
import { getState, hooks, pushStep, setState, type Selection } from '../components/store';
import { runAction, type Action } from './actions';

export interface ScriptStep {
  prompt: string;
  reply: string;
  actions: Action[];
  delay_ms?: number;
  chip_only?: boolean;
  recorded?: boolean;
}
export const script: ScriptStep[] = (Array.isArray(agentScript.data) ? agentScript.data : []) as ScriptStep[];
export const sequence = script.filter((s) => !s.chip_only);
export const chips = script.slice(1);
export const requestedMode = new URLSearchParams(location.search).get('mode') ?? 'replay';
/** True when the script is hand-written rather than recorded Grok output. */
export const placeholderScript = script.some((s) => s.recorded === false);

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
let busy = false;

async function type(field: 'input' | 'reply', text: string, ms: number) {
  for (let i = 2; i < text.length + 2; i += 2) {
    setState((s) => ({ grok: { ...s.grok, [field]: text.slice(0, i) } }));
    await sleep(ms);
  }
}

export async function play(step: ScriptStep) {
  if (busy) return;
  busy = true;
  setState((s) => ({ grok: { ...s.grok, busy: true, input: '', reply: '', status: '' }, tab: 'Feed', selection: null }));
  try {
    await type('input', step.prompt, 22);
    pushStep('prompt', `› ${step.prompt}`);
    await sleep(220);
    await type('reply', step.reply, 12);
    pushStep('reply', step.reply);
    for (const a of step.actions ?? []) {
      await runAction(a);
      await sleep(260);
    }
    await sleep(step.delay_ms ?? 0);
  } catch (err) {
    console.error('[grok] step failed', err);
    pushStep('fail', '✗ step stopped: see console');
  } finally {
    busy = false;
    setState((s) => ({ grok: { ...s.grok, busy: false, status: '', input: '' }, cursor: { ...s.cursor, visible: false } }));
  }
}

/** Space: run the next step of the recorded sequence. */
export function next() {
  if (busy || !sequence.length) return;
  const i = getState().grok.next % sequence.length;
  setState((s) => ({ grok: { ...s.grok, next: i + 1 } }));
  void play(sequence[i]);
}

const words = (s: string) => new Set(s.toLowerCase().match(/[a-z0-9]+/g) ?? []);
/** Typed prompt in replay mode: run the closest scripted step, or say it is not in the script. */
export function ask(prompt: string) {
  const w = words(prompt);
  let best: ScriptStep | null = null;
  let score = 0;
  for (const s of script) {
    const sw = words(s.prompt);
    const overlap = [...w].filter((x) => sw.has(x)).length / Math.max(1, sw.size);
    if (overlap > score) {
      score = overlap;
      best = s;
    }
  }
  if (best && score >= 0.5) return void play({ ...best, prompt });
  void play({ prompt, reply: 'Not in the recorded script. Replay mode only runs recorded steps; live Grok is not wired in this build.', actions: [] });
}

/** "Ask Grok about this": in replay there is no model call, so the answer is assembled by code from the cited rows. */
export function askAbout(sel: Selection) {
  const cites = sel.citation_ids.filter(isCitable);
  const claims = cites
    .map((id) => {
      const c = resolveCitation(id);
      return c.kind === 'row' ? c.row.claim : null;
    })
    .filter(Boolean) as string[];
  const actions: Action[] = [{ type: 'highlight', ids: [sel.id] }];
  if (cites.length) actions.push({ type: 'add_callout', at: { lon: sel.lon, lat: sel.lat }, title: sel.label, text: claims[0] ?? '', citation_ids: cites });
  void play({
    prompt: `Tell me about ${sel.label}`,
    reply: cites.length ? `${sel.label}: ${claims[0] ?? 'see the cited source'}. ${cites.map((c) => `[${c}]`).join(' ')}` : `${sel.label}: not in our data.`,
    actions,
  });
}

hooks.ask = askAbout;
hooks.prompt = ask;
hooks.next = next;
