# Girly Fitness App

A browser-based workout tracker with:
- modular vanilla JavaScript structure
- persistent set tracking
- 4-week schedule profile
- per-exercise rest timers
- Supabase-ready cloud logging scaffold

## Features

- Tab-based navigation for Home, Day A, Day B, Day C, Day D, and Wrist pages
- Heart checkbox set tracking saved in localStorage
- Profile section with a generated 4-week schedule
- Rest timer on each exercise card
- Supabase helper scaffold for future cloud-based workout history, weight logs, and notes

## Project Structure

```text
girly-fitness-app/
├── index.html
├── css/
│   └── style.css
├── data/
│   └── workouts.json
├── js/
│   ├── main.js
│   ├── navigation.js
│   ├── profile.js
│   ├── render.js
│   ├── schedule.js
│   ├── storage.js
│   ├── supabase.js
│   ├── timer.js
│   └── workouts.js
└── README.md
```

## Running Locally

Open `index.html` in a modern browser.

## Supabase Setup

Edit `js/supabase.js` and replace:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

with your real project values.

Then create a `workout_logs` table in Supabase for remote persistence.
