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
