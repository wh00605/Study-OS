# Study OS

A one-page study dashboard for University of Surrey modules. It lists deadlines and readings, and plans each day's work around them.

Live site: https://wh00605.github.io/Study-OS/

## How it works

- `data.js` holds the deadlines imported from the SurreyLearn calendar feed. Edit it, or re-import, to add new modules.
- `index.html` is the whole app. There is no build step.
- Ticks, hour changes, deleted items and items added in the page are saved in the browser's local storage. Use **Study hours → Export progress / Import progress** to move them between devices.

## Planner

Work is placed earliest deadline first. Each task can start a fixed number of days before it is due (a week for problem sets and readings, six weeks for an assessment) and goes on the earliest days that still have free study hours. Anything that will not fit is flagged.

## Notes on the data

ECO1014's weekly checklist (lectures, readings, quizzes, midterm) is dated 2027 in SurreyLearn. Those items were moved back 52 weeks to the same week of the 2026/27 term and are tagged "date estimated". Lecture and seminar times come from the checklist, not the timetable.

## Number Ten

`pm/` holds a separate game: a prime minister simulation set in Westminster. Open `pm/index.html`, or https://wh00605.github.io/Study-OS/pm/ once this is on the published branch.

- Play with the real parties and MPs from the July 2024 election, or with fictional parties. Picking a party other than Labour gives a what-if result.
- One turn is one week. You get a five-year term, a 650-seat Commons and an Autumn Budget each November.
- Each week brings one issue. You write your own announcement on the This week page, and the civil service, a focus group, the regions, the opposition, your party, the markets and the press react. Big changes become bills. Claude plays those roles when the game runs inside Claude; otherwise built-in models in `pm/week.js` and `pm/game.js` do.
- Letters against you build up when approval and unity fall. Pass your party's threshold and you face a leadership challenge.
- `pm/content.js` holds the bills, events, voter groups and pledges. `pm/real.js` holds the real parties, MPs and policy keywords. `pm/week.js` runs the weekly issue, announcements and reactions. `pm/game.js` holds the economy, voting and interface.
- The game saves in the browser's local storage.
