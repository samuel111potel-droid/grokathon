# Traceability rules for ConsentLoop DC

"Traceable data" is one of the five judging criteria. These are the rules the app must follow so that every number on screen can be traced back to where it came from. Cursor loads the same rules from `.cursor/rules/traceability.mdc`.

## The rules

1. **Every number on screen has a source.** Every MW, MVA, km, metre, dB, acre, £ and % figure, and every objection, shows a Source Chip. No figure appears without one.
2. **A source means a link plus the exact words.** A sourced figure carries the source organisation, a live URL, the word-for-word quote that contains the figure, and the date and time it was retrieved.
3. **Every source is checked.** The Red Team bot opens each link and confirms the quote is really on the page. Only rows marked `pass` reach the screen. Failed rows are hidden, never shown.
4. **Calculated figures show their working.** Anything our app works out itself (noise at the nearest home, objection risk score, approval chance, BS 4142 pass or fail, land values) is labelled as an estimate. Its Source Chip shows the method and the sourced inputs it used.
5. **Assumptions are labelled as assumptions.** If we had to assume a figure, it shows an "assumption" badge and says what it is based on. An assumption is never shown as a fact.
6. **Nothing is made up.** If a bot cannot find a figure, the row is marked `not_found` and the screen shows nothing or "not found". It never shows a guess.
7. **No numbers typed into the screen code.** The screens read every figure from the data files, so the source always travels with the number.
8. **Licensed data is receipted, not copied.** MSCI figures show as aggregated ranges with a receipt (what was asked, when, and a SHA-256 hash). Raw MSCI records never go into the repo.
9. **Sample data is labelled.** If any sample or placeholder data is still on screen, it says "sample data".
10. **One click to the proof.** Clicking any figure opens a drawer with the quote, the link, the time retrieved and the Red Team result. This is the moment we show in the video.

## How we check it

Run `python3 scripts/check_traceability.py` before recording, and run it again with `--live` to re-open every link. It must finish with 0 errors.
