#!/usr/bin/env python3
"""Traceability check for ConsentLoop DC.

Makes sure every figure the app shows can be traced to a source, following the
data contracts in docs/EXECUTION_PLAN.md section 4.

Usage:
    python3 scripts/check_traceability.py            # offline checks
    python3 scripts/check_traceability.py --live     # also re-fetch each URL and confirm the quote is on the page
    python3 scripts/check_traceability.py --dir data/fixtures   # check sample files instead of data/out

Exit code 0 means no errors. Warnings are printed but do not fail the run.
Standard library only, no installs needed.
"""
import argparse, glob, html, json, os, re, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EVIDENCE_FILES = ["P1", "P2", "C1", "C2", "C3", "S1", "S2"]
STATUS = {"found", "not_found", "assumption"}
FIXES = {"move generators away from homes", "add acoustic screen", "move site access",
         "lower hall height", "add tree belt", "move substation"}
# Round metrics that are calculated by our engine rather than quoted from a source.
# Each must be explained in metric_sources (method or citation_ids) so a judge can trace it.
CALCULATED = {"predicted_receptor_dba", "objection_risk_score", "approval_probability_pct",
              "bs4142_compliant", "risk_adjusted_land_value_gbp_m", "gross_powered_land_gbp_m"}

errors, warnings = [], []
def err(m): errors.append(m)
def warn(m): warnings.append(m)

def load(path):
    try:
        with open(path) as f:
            return json.load(f)
    except FileNotFoundError:
        return None
    except json.JSONDecodeError as e:
        err(f"{os.path.relpath(path, ROOT)}: not valid JSON ({e})")
        return None

def norm(s):
    s = html.unescape(re.sub(r"<[^>]+>", " ", s))
    s = s.replace("\u2019", "'").replace("\u2018", "'").replace("\u201c", '"').replace("\u201d", '"')
    return re.sub(r"\s+", " ", s).strip().lower()

def check_live(row):
    try:
        req = urllib.request.Request(row["url"], headers={"User-Agent": "Mozilla/5.0 traceability-check"})
        with urllib.request.urlopen(req, timeout=15) as r:
            body = r.read(5_000_000).decode("utf-8", "ignore")
    except Exception as e:
        warn(f"{row['id']}: could not load {row['url']} ({e.__class__.__name__}); check it by hand")
        return
    if norm(row["quote"]) not in norm(body):
        err(f"{row['id']}: quote not found word for word at {row['url']}")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default="data/out")
    ap.add_argument("--live", action="store_true")
    a = ap.parse_args()
    d = os.path.join(ROOT, a.dir)

    # 1. Evidence rows
    rows = {}
    for name in EVIDENCE_FILES:
        data = load(os.path.join(d, f"{name}.json"))
        if data is None:
            warn(f"{a.dir}/{name}.json missing")
            continue
        for r in data:
            rid = r.get("id", "?")
            if rid in rows:
                err(f"{rid}: duplicate id")
            rows[rid] = r
            st = r.get("status")
            if st not in STATUS:
                err(f"{rid}: status '{st}' must be one of {sorted(STATUS)}")
            if not r.get("claim"):
                err(f"{rid}: missing claim")
            if st == "found":
                for k in ("url", "quote", "source_org", "retrieved"):
                    if not r.get(k):
                        err(f"{rid}: found row is missing {k}")
                if r.get("url") and not str(r["url"]).startswith("http"):
                    err(f"{rid}: url is not a web link")
                if "..." in str(r.get("url", "")):
                    err(f"{rid}: url is a placeholder")
                if r.get("check") != "pass":
                    (warn if r.get("check") == "fail" else err)(
                        f"{rid}: Red Team check is '{r.get('check')}' (fail rows are hidden; missing check is an error)")
                if a.live and r.get("url") and r.get("quote"):
                    check_live(r)
            if st == "assumption" and not r.get("quote") and not r.get("basis"):
                warn(f"{rid}: assumption has no basis or quote explaining it")
    usable = {k for k, r in rows.items() if r.get("check") == "pass" or r.get("status") == "assumption"}

    # 2. MSCI receipts
    receipts = load(os.path.join(ROOT, "data/receipts/msci_receipts.json")) or []
    rec_ids = set()
    for r in receipts:
        rid = r.get("id", "?"); rec_ids.add(rid)
        for k in ("tool", "query_summary", "retrieved", "sha256"):
            if not r.get(k):
                err(f"{rid}: MSCI receipt missing {k}")
        if r.get("sha256") and not re.fullmatch(r"[0-9a-f]{64}", r["sha256"]):
            err(f"{rid}: sha256 is not a 64-character hex hash")
        if r.get("sha256") == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855":
            err(f"{rid}: sha256 is the hash of an empty string (the example value)")
    usable |= rec_ids

    def resolve(where, ids):
        for cid in ids or []:
            if cid not in usable:
                why = "failed Red Team" if cid in rows else "does not exist"
                err(f"{where}: citation {cid} {why}")

    # 3. Objection cards
    for o in load(os.path.join(d, "objections.json")) or []:
        oid = o.get("id", "?")
        if not o.get("citation_ids"):
            err(f"{oid}: objection has no citation_ids")
        resolve(oid, o.get("citation_ids"))
        resolve(oid, [o["precedent_id"]] if o.get("precedent_id") else [])
        resolve(oid, o.get("receptor_ids"))
        for k in ("fix", "secondary_fix"):
            if o.get(k) and o[k] not in FIXES:
                err(f"{oid}: {k} '{o[k]}' is not an allowed fix")

    # 4. Layout rounds
    for p in sorted(glob.glob(os.path.join(ROOT, "data/rounds/round*.json"))):
        rd = load(p) or {}
        tag = os.path.basename(p)
        uw = rd.get("underwrite", {})
        if uw and not uw.get("citation_ids"):
            err(f"{tag}: underwrite has no citation_ids")
        resolve(f"{tag} underwrite", uw.get("citation_ids"))
        srcs = rd.get("metric_sources", {})
        for k in list(rd.get("metrics", {})) + [k for k in uw if k != "citation_ids"]:
            s = srcs.get(k)
            if not s:
                msg = f"{tag}: '{k}' has no metric_sources entry"
                (err if k in CALCULATED else warn)(msg + (" (calculated figure: add a method)" if k in CALCULATED else ""))
                continue
            if not s.get("method") and not s.get("citation_ids"):
                err(f"{tag}: metric_sources['{k}'] needs a method or citation_ids")
            resolve(f"{tag} {k}", s.get("citation_ids"))

    # 5. Hard-coded figures in the UI
    for p in glob.glob(os.path.join(ROOT, "src/**/*.[jt]sx"), recursive=True):
        for i, line in enumerate(open(p, errors="ignore"), 1):
            if re.search(r">[^<{]*\b\d[\d,.]*\s?(MW|MVA|kV|km|m|dB|dBA|acres|%)\b[^<]*<|£\s?\d", line):
                warn(f"{os.path.relpath(p, ROOT)}:{i}: figure typed straight into the UI; read it from data with a Source Chip")

    for m in warnings: print("WARN ", m)
    for m in errors: print("ERROR", m)
    print(f"\n{len(rows)} evidence rows, {len(rec_ids)} MSCI receipts, {len(errors)} errors, {len(warnings)} warnings")
    sys.exit(1 if errors else 0)

if __name__ == "__main__":
    main()
