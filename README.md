🎀 Girly Shape & Core Definition

This simple browser‑based workout diary has been rebuilt from a single HTML/CSS/JS file into a modular, maintainable project. Instead of generic “Day A/B/C” workouts the program now organises your training by body part: Glutes, Back, Core and an optional Cardio day. A separate Wrist‑care block rounds out the program. Users can tick off sets, save their progress in localStorage, record their name and start date, and view a four‑week schedule that highlights the current week and the deload at the end.
Features

•	✨ Navigation Tabs – quickly jump between Home, Glutes, Back, Core, Cardio and the Wrist‑care block. The active tab is highlighted so you always know where you are.

•	💖 Set Tracking – heart‑shaped checkboxes let you mark each set as complete. Your progress persists across page reloads via localStorage.

•	🌸 Profile & Schedule – enter your name and program start date to generate a personalised four‑week timeline. The current week is automatically highlighted and the final week is labelled as a deload.

•	🔄 Reset Button – clear the entire diary when you begin a new training week.

•	⏱ Rest Timer – every exercise card includes a rest timer button. The app parses the “Rest” value from the card’s description and appends a small button labelled Start Xs. Tap the button to count down your rest period; the remaining time updates every second and lets you know when to start your next set.

•	🎞 Multi‑GIF Sliders – some exercises (such as Squats and Glute Bridges) contain multiple variations. A miniature slider lets you cycle through different demonstration GIFs without leaving the card.

•	🎀 Custom App Icon – the project includes a Hello Kitty favicon (images/hello-kitty-icon.png) referenced in index.html. You can swap this for your own PNG by replacing the file and updating the <link rel="icon" …> tag.

•	🔧 Optional Supabase Integration – a lightweight wrapper around the Supabase JavaScript client is included if you want to add cloud persistence (e.g. saving weights, notes or workout history). To use it, supply your project URL and anon key in js/supabase.js. For local/offline use this integration is not required; all functionality works with just localStorage.

Project Structure

The app lives in the girly-fitness-app folder and is organised as follows:

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
│   ├── timer.js     # rest timer implementation
│   └── slider.js    # simple slider for multi‑GIF exercise cards
├── data/
│   └── workouts.json# placeholder for future exercise definitions
├── images/
│   └── hello-kitty-icon.png # favicon used by the app
├── .env.example     # template for environment variables (Cloudinary and Supabase)
└── README.md        # this file
Running Locally
Simply open index.html in a modern web browser. No build step or server is required. Because the application uses localStorage to persist state it will remember your progress as long as you return to the page from the same origin. To start a new week click the “Reset my Diary” button on the home page.
Optional Supabase setup
All features in this app work offline using localStorage. If you want to sync data across devices or add user accounts you can connect Supabase:
1.	Create a free project on supabase.com. In the project settings copy the Project URL and Anon Key.
2.	Edit js/supabase.js to set SUPABASE_URL and SUPABASE_ANON_KEY to your own values. Do not commit your real keys to a public repository.
3.	Create a table called workout_logs in your Supabase project (with columns like id, created_at, user_name, exercise, sets_completed, etc.). The helper functions expect this table name but you can customise them in supabase.js.
4.	Call window.supabaseHelper.saveWorkoutLog() to insert rows and window.supabaseHelper.getWorkoutLogs() to retrieve them.
Configuring Cloudinary
All of the animated GIFs and images in this app are served from Cloudinary. If you’d like to use your own Cloudinary account to manage your media, create a .env file (or set environment variables on your hosting platform) with
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
where <api_key>, <api_secret> and <cloud_name> come from your Cloudinary dashboard. When deploying to Vercel or a similar platform you can define the CLOUDINARY_URL environment variable in their dashboard. Avoid committing real API credentials to public repositories.
Environment variables
A file called .env.example is included as a template for configuring environment variables. Copy it to .env (which is ignored by Git) and supply your own credentials for Cloudinary and Supabase if you enable those services. Never commit your real secrets to the repository.
Extending the App
At the moment exercises and cards are hardcoded into index.html. Future improvements might include:
•	Moving exercise definitions into data/workouts.json or workouts.js and generating cards dynamically in render.js.
•	Further consolidating the CSS (we currently import the original stylesheet) into separate files such as base.css, layout.css and components.css for better separation of concerns.
•	Adding charts or summaries of completed workouts.
Pull requests and suggestions are welcome! 💪
________________________________________
