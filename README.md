# 🎀 Girly Shape & Core Definition

This simple browser‑based workout diary was rebuilt from a single
HTML/CSS/JS file into a more maintainable project structure.  The
program provides three focused training days (A/B/C), an optional
active recovery day (D), and a wrist‑care block.  Users can tick off
sets, save their progress in localStorage, record their name and
start date, and view a four‑week schedule that highlights the
current week and the deload at the end.

## Features

- ✨ **Navigation Tabs** – quickly jump between Home, four training days and a wrist block.  The active tab is highlighted.
- 💖 **Set Tracking** – heart‑shaped checkboxes let you mark each set
  as complete.  Your progress persists across page reloads via
  localStorage.
- 🌸 **Profile & Schedule** – enter your name and program start date to
  generate a personalised four‑week timeline.  The current week is
  automatically highlighted and the final week is labelled as a
  deload.
- 🔄 **Reset Button** – clear the entire diary when you begin a new
  training week.

- ⏱ **Rest Timer** – every exercise card now includes a rest timer
  button.  The app parses the “Rest” value from the card’s
  description and appends a small button labelled `Start Xs`.  Tap
  the button to count down your rest period; the remaining time
  updates every second and lets you know when to start your next
  set.

- 🗃️ **Supabase Ready** – a lightweight wrapper around the Supabase
  JavaScript client is included.  To enable cloud persistence (e.g.
  saving weight used, notes or workout history) create a free
  project at [supabase.com](https://supabase.com) and provide your
  project URL and anon key in `js/supabase.js`.  A helper API
  (`window.supabaseHelper`) exposes `saveWorkoutLog()` and
  `getWorkoutLogs()` for inserting and retrieving data.

## Project Structure

The app lives in the `girly-fitness-app` folder and is organised as
follows:

```
girly-fitness-app/
├── index.html       # markup for the app pages
├── css/
│   └── style.css    # wraps the original project styles via @import
├── js/
│   ├── main.js      # application entrypoint
│   ├── navigation.js# handles tab switching
│   ├── storage.js   # localStorage helpers
│   ├── profile.js   # profile editing/display logic
│   ├── schedule.js  # four‑week schedule generator
│   ├── workouts.js  # placeholder for future workout data
│   └── render.js    # placeholder for future dynamic rendering
│   ├── supabase.js  # initialise a Supabase client and helpers
│   └── timer.js     # rest timer implementation
├── data/
│   └── workouts.json# placeholder for future exercise definitions
└── README.md        # this file
```

## Running Locally

Simply open `index.html` in a modern web browser.  No build step or
server is required.  Because the application uses localStorage to
persist state it will remember your progress as long as you return to
the page from the same origin.  To start a new week click the
“Reset my Diary” button on the home page.

### Configuring Supabase

If you wish to persist data beyond the user’s device you can hook
your app up to Supabase:

1. Create a new project on [supabase.com](https://supabase.com).  In
   the project settings copy the **Project URL** and **Anon Key**.
2. Open `js/supabase.js` and replace `SUPABASE_URL` and
   `SUPABASE_ANON_KEY` with the values from step 1.  Avoid committing
   your real keys to a public repository.
3. In your Supabase dashboard create a table called `workout_logs`
   with columns that suit your needs (for example `id`,
   `created_at`, `user_name`, `day`, `exercise_id`, `weight`,
   `notes`).  The helper functions expect a table named
   `workout_logs` but you can customise them in `supabase.js`.
4. Use `window.supabaseHelper.saveWorkoutLog()` from your code to
   insert new rows and `window.supabaseHelper.getWorkoutLogs()` to
   retrieve them.

## Extending the App

At the moment exercises and cards are hardcoded into `index.html`.
Future improvements might include:

- Moving exercise definitions into `data/workouts.json` or
  `workouts.js` and generating cards dynamically in `render.js`.
- Splitting the CSS into multiple files such as `base.css`,
  `layout.css` and `components.css` for even better separation of
  concerns.
- Adding charts or summaries of completed workouts.

Pull requests and suggestions are welcome! 💪