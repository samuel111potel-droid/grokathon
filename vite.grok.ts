// Live Grok proxy for local hosting (Lane 5).
// Runs inside the Vite dev server only (`npm run dev`). The xAI key is read from .env on the
// host laptop and never reaches the browser. Static builds have no proxy and stay on replay.
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

const XAI_URL = 'https://api.x.ai/v1/chat/completions';
const TIMEOUT_MS = 12_000;

const target = { description: '"site", "row:<id>", "feature:<id>", "auto:generators", "auto:nearest_home", "auto:nearest_substation", or {lon,lat}' };
const fn = (name: string, description: string, properties: Record<string, unknown>, required: string[]) => ({
  type: 'function',
  function: { name, description, parameters: { type: 'object', properties, required } },
});

/** The map action API (src/agent/actions.ts). The browser validates every call before running it. */
export const TOOLS = [
  fn('fly_to', 'Fly the camera to a target.', { target }, ['target']),
  fn('set_view', 'Switch the map view.', { view: { type: 'string', enum: ['satellite3d', 'dark', 'flows', 'columns'] } }, ['view']),
  fn('toggle_layer', 'Show or hide a map layer.', { id: { type: 'string' }, on: { type: 'boolean' } }, ['id', 'on']),
  fn('draw_ring', 'Draw a ring; the app counts homes inside it in code.', { center: target, radius_m: { type: 'number' }, label: { type: 'string' } }, ['center', 'radius_m']),
  fn('measure', 'Measure between two targets; the app computes the distance in code.', { from: target, to: target }, ['from', 'to']),
  fn('add_callout', 'Pin a sourced label on the map. citation_ids must be ids from the row index.', {
    at: target, title: { type: 'string' }, text: { type: 'string' }, citation_ids: { type: 'array', items: { type: 'string' } },
  }, ['at', 'title', 'text', 'citation_ids']),
  fn('highlight', 'Pulse features or rows by id.', { ids: { type: 'array', items: { type: 'string' } } }, ['ids']),
  fn('set_round', 'Show test-fit round 0 (naive), 1 or 2 (consent-ready).', { round: { type: 'integer', enum: [0, 1, 2] } }, ['round']),
  fn('apply_fix', 'Apply a mitigation; jumps to the round that contains it.', {
    fix: { type: 'string', enum: ['move generators away from homes', 'add acoustic screen', 'move site access', 'lower hall height', 'add tree belt', 'move substation'] },
  }, ['fix']),
  fn('open_source', 'Open the source drawer for a row or receipt id.', { id: { type: 'string' } }, ['id']),
];

export interface GrokRequest {
  prompt: string;
  round?: number;
  view?: string;
  layers?: string[];
  selection?: { id: string; label: string; citation_ids?: string[] } | null;
  rows?: string[]; // compact "id | claim | value unit | status" lines
}

export function systemPrompt(req: GrokRequest): string {
  return [
    'You are Grok, the co-pilot inside ConsentLoop DC, a map tool for siting a data centre at the former Ratcliffe-on-Soar Power Station (Rushcliffe, Nottinghamshire).',
    'Answer in at most two short sentences, then act on the map with tool calls (usually 1 to 4).',
    'Rules: only state facts that appear in the ROW INDEX below and cite their ids in square brackets, e.g. [C2-04].',
    'Never compute, estimate or invent numbers: distances, counts, dB and money come from the app\'s code (draw_ring, measure) or from cited rows.',
    'If something is not in the index, say "not in our data". Never name private individuals; councils, companies and public office holders only.',
    `Current view: ${req.view ?? 'unknown'}. Current test-fit round: ${req.round ?? 0}. Layer ids: ${(req.layers ?? []).join(', ')}.`,
    req.selection ? `The user selected: ${req.selection.label} (id ${req.selection.id}; sources ${(req.selection.citation_ids ?? []).join(', ') || 'none'}).` : '',
    'ROW INDEX (id | claim | value unit | status):',
    ...(req.rows ?? []).slice(0, 300),
  ].filter(Boolean).join('\n');
}

/** Turn OpenAI-style tool calls into the app's Action objects. Bad JSON is dropped. */
export function toActions(toolCalls: any[] | undefined): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const c of toolCalls ?? []) {
    const name = c?.function?.name;
    if (!name) continue;
    try {
      const args = typeof c.function.arguments === 'string' ? JSON.parse(c.function.arguments || '{}') : c.function.arguments ?? {};
      out.push({ ...args, type: name });
    } catch {
      /* skip malformed call */
    }
  }
  return out;
}

export async function callGrok(req: GrokRequest, key: string, model: string, fetchImpl: typeof fetch = fetch) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetchImpl(XAI_URL, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        tool_choice: 'auto',
        tools: TOOLS,
        messages: [
          { role: 'system', content: systemPrompt(req) },
          { role: 'user', content: req.prompt },
        ],
      }),
    });
    if (!r.ok) throw new Error(`xAI HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const j: any = await r.json();
    const msg = j?.choices?.[0]?.message ?? {};
    const actions = toActions(msg.tool_calls);
    const reply = (typeof msg.content === 'string' && msg.content.trim()) || (actions.length ? 'On it.' : 'Not in our data.');
    return { reply, actions };
  } finally {
    clearTimeout(timer);
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 1_000_000) reject(new Error('body too large'));
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export function grokProxy(env: Record<string, string>): Plugin {
  const key = env.XAI_API_KEY ?? '';
  const model = env.XAI_MODEL || 'grok-4';
  return {
    name: 'grok-proxy',
    configureServer(server) {
      server.middlewares.use('/api/grok', async (req, res) => {
        if (req.method === 'GET') return send(res, 200, { live: Boolean(key), model }); // status probe; never returns the key
        if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
        if (!key) return send(res, 503, { error: 'XAI_API_KEY is not set in .env on the host laptop' });
        try {
          const body = JSON.parse((await readBody(req)) || '{}') as GrokRequest;
          if (!body.prompt) return send(res, 400, { error: 'prompt required' });
          send(res, 200, await callGrok(body, key, model));
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error('[grok-proxy]', msg.replace(key, '***'));
          send(res, 502, { error: msg.replace(key, '***') });
        }
      });
    },
  };
}
