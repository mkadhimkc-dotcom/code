# Clulee Admin Workflow

## How to Edit Workouts

Clulee uses a cloud-based admin workflow via GitHub. No local server needed.

### Editing workouts.json

1. Go to [github.com/mkadhimkc-dotcom/code](https://github.com/mkadhimkc-dotcom/code)
2. Navigate to `data/workouts.json`
3. Click the **pencil ✏️ icon** (Edit this file)
4. Make your changes
5. Scroll down and click **"Commit changes"**
6. Cloudflare Pages will auto-deploy within ~1 minute

### workouts.json Schema

Each workout category is a key at the top level:

```json
{
  "glutes": [ ...exercises ],
  "back":   [ ...exercises ],
  "core":   [ ...exercises ],
  "cardio": [ ...exercises ]
}
```

Each exercise follows this structure:

```json
{
  "id": "unique-kebab-case-id",
  "name": "Exercise Name",
  "sets": "3",
  "reps": "10-12",
  "rest": "90s",
  "gif": "https://res.cloudinary.com/db1domes8/image/upload/f_auto,q_auto/filename.gif",
  "notes": "Optional coaching notes"
}
```

### Adding a New Exercise

1. Upload your GIF to Cloudinary (cloudinary.com → Media Library → Upload)
2. Copy the delivery URL
3. Edit `data/workouts.json` on GitHub
4. Add a new object to the correct category array
5. Commit — done!

### Removing an Exercise

1. Open `data/workouts.json` on GitHub
2. Delete the exercise object from the array
3. Make sure JSON stays valid (no trailing commas)
4. Commit

### Validating JSON

Before committing, paste your JSON into [jsonlint.com](https://jsonlint.com) to check for errors.

### Production Safety

- The admin workflow is GitHub only — no admin panel is deployed to production
- All changes go through git history — you can always revert
- Cloudflare Pages preview deployments let you check changes before they hit production

---

> **Note:** Never commit secrets or API keys to this repo.
> See `.env.example` for the list of required environment variables.
