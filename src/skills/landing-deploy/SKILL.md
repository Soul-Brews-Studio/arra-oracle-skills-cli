---
name: landing-deploy
description: Build, deploy to Cloudflare, and share your landing page website URL with others via Discord (#🎉・free-for-all). Use when user says "landing deploy", "deploy website", "deploy landing".
---

# /landing-deploy — Build, Deploy, and Share Web Landing Page

Build and deploy the landing page from the current directory using wrangler and share the link on Discord.

## Usage

```bash
/landing-deploy
```

## Instructions

1. **Verify environment**: Ensure you are running this command inside an Astro / static website repository that contains `wrangler.toml` or `wrangler.jsonc` (e.g. `gemini-landing`, `agy-landing`, `sombo-landing`, `no10-landing`).
2. **Execute deploy script**:
   ```bash
   bun /root/.gemini/skills/landing-deploy/scripts/deploy.ts
   ```
3. **Verify URL**: Verify the console logs to confirm the build, deploy, and Discord notification succeeded.
4. **Log Activity**: Add a work session start and end block to `ψ/activity.log` and update the status in `ψ/focus.md` to reflect the deployment.
