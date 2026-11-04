# Think-aloud session (ui-audit step 5)

- **Date:** 2026-11-04
- **Participant:** Nail (author; had seen the audit summary, not the findings detail)
- **Account:** `audit_full` (fresh seed), Chrome desktop
- **Format:** text think-aloud in chat, one task at a time; facilitator records, does not help.

## Notes

| Task | What Nail expected / looked for | What happened | Hesitation / surprise | Quote |
|---|---|---|---|---|
| 0. 5-second test (dashboard) | Main thing: "Jump back in", "Up next" | Recalled only those two blocks; status strip, stats card (12 counters) and "Recently played" not recalled | — | "Просмотрел что в очереди, вероятно" (first action in the evening) |
| 1. Decide what to play tonight | Default: continue the "Jump back in" game | Chose without leaving the dashboard | The default fails when mood differs from the current game: big game vs "something light, like a roguelike". Nothing on the dashboard helps pick by mood / weight | "…возможно в этом разделе условная большая игра, а я хочу что-то лайтовое типо рогалика" |
| 1b. Mood changed: find something light | Went to Library | Picked Shadow Warrior ("шутерок на вечерок") as a compromise | Wanted Balatro / Hades level; library gave no way to ask for "light / short / roguelike". Caveat: the seed has no such games (FF-heavy), so part of the miss is data | "…однако я искал что-то уровня Balatro или Hades" |
| 2. Add Balatro | ⌘K first | ⌘K found it but offered only "Add to Up Next" → clicked the result → game page → "Add to library" → picked **Playing** (~4 clicks + typing) | Detour forced because ⌘K's single fixed action didn't match intent. Intent was "add and start now", not queue. **Input for §2.6:** a Want-only default + "Put in Up Next" would still miss this; the add confirmation (or ⌘K) needs "Start playing" too | "…там предлагается добавить в Up Next - пришлось пойти на страницу игры" |
| 1b (follow-up) | — | Found Shadow Warrior by scrolling covers, no filter or search | Library has no way to browse by weight / genre / length; scanning is the only path | "через листание" |
| 3. Put FF XV first in Up Next | Set status Up Next | Became first — only because it was the most recently edited | Verified twice (library filter + dashboard): the user doesn't trust one place. Success is accidental: the next edit of any Up Next game reorders it (§2.4) | "видимо работает сортировка по updated_at" |
| 4. Start playing FF XV | Game page → status dropdown → Playing | Done in ~2 clicks after reaching the page | No hesitation. Did not consider "Log your first playthrough": playthroughs are not part of the mental model of "starting". Expected effect: order changes, Playing count +1 (counters remembered as feedback here, unlike task 0) | "Изменилось скорее всего порядок игр, увеличилось количество Playing" |
| 5. Log 2h on FF XV, no text | Dashboard Log → game + hours | **Failed (blocked).** Hours-only save → raw validation error. Game page Log → same flow, same result | Setting Playing doesn't create a playthrough, and hours-only logging requires one. Confirms quirk #8 / §2.9 as a hard block in the weekly loop, not an edge case | "…выводит необработанную ошибку валидации и это по факту блок… перевод в статус Playing не создает playthrough" |
| 6a. Mark FF VII Rebirth finished | Game page | Set Played via **Edit details** (not the status pill) | Went to a form to mark a game done (unconfirmed why; likely the pill is read-only on a game with runs: "Follows your playthroughs"). "Finished" itself is not expressible: only "Played" | "Rebirth поставил Played через Edit Details" |
| 6b. Mark RE2 dropped | Looked for a "dropped" option | **Not expressible.** Settled for Played, same as finished | Confirms §2.7 (Done + optional Let go) from the user side | "для RE2 нет варианта «бросил» - оставил Played" |
| 7. Find the "one big RPG at a time" note (~12 days old, no game attached) | Journal | Found it in the Journal list | Hard to identify the right card. Run partly on in-progress code: a parallel session was fixing U1–U5 (journal routes) in the same tree, so whether the note view opened says nothing about the baseline | "нашел заметку, но тяжело было идентифицировать ее" |
| 7 (follow-up) | — | Read it in the list, did not click | Cause: the note has no game and all notes share one timeline; no way to narrow down. Wants a filter by game, including "no game" | "Она без привязки, и было сложно, все заметки в одном таймлайне" |

Task 8 (first run) skipped: blocked by U1.

## Debrief

- **Most annoying:** finding notes with no way to filter; wants a pre-filter or filter, at least "notes without a game".
- **One change for weekly use:** "Сделать трекинг и добавление ужасно простым и понятным".

## Takeaways for spec 026

| # | Takeaway | Evidence | Where |
|---|---|---|---|
| T1 | The add confirmation (and ⌘K) must offer **Start playing**, not only "Put in Up Next": "heard of it, playing tonight" is a real path | Task 2 | §2.6 (change) |
| T2 | Time-only logging must work for any game, including one made Playing by status alone (no run). Today this blocks the loop on the second evening | Task 5 | §2.9 (raise priority) |
| T3 | The status control on the game page must work for every game; the user fell back to Edit details to mark one done | Task 6a (cause unconfirmed) | §2.2 / §2.3 |
| T4 | Journal needs a filter by game, including "no game" | Task 7, debrief | new-026 (§2.9) |
| T5 | Dashboard counters / status strip were not noticed in a 5-second look: removing them costs nothing | Task 0 | supports N14 |
| T6 | "What fits tonight's mood / weight" (light vs big) is the real decision when "Jump back in" doesn't fit; library browsing by cover is the only tool | Task 1b | separate: "what next" suggestions (length vs time) |
| T7 | North star from the participant: tracking and adding must be dead simple | Debrief | 026 overall |
