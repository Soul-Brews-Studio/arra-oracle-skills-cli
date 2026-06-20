#!/usr/bin/env bun
import { $ } from "bun";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// 1. Setup & Environment Validation
const cwd = process.cwd();
console.log(`🚀 Starting web deployment process from: ${cwd}`);

const wranglerTomlPath = join(cwd, "wrangler.toml");
const wranglerJsoncPath = join(cwd, "wrangler.jsonc");
let tomlContent = "";
let jsoncContent = "";

if (existsSync(wranglerTomlPath)) {
  tomlContent = readFileSync(wranglerTomlPath, "utf8");
} else if (existsSync(wranglerJsoncPath)) {
  jsoncContent = readFileSync(wranglerJsoncPath, "utf8");
} else {
  console.error("❌ Error: No wrangler.toml or wrangler.jsonc found in current directory.");
  process.exit(1);
}

// 2. Parse Domain and Name
let domainName = "";
let siteName = "";

if (tomlContent) {
  // Parse name
  const nameMatch = tomlContent.match(/^name\s*=\s*"([^"]+)"/m);
  if (nameMatch) siteName = nameMatch[1];

  // Parse custom domain pattern from wrangler.toml
  const routeMatch = tomlContent.match(/pattern\s*=\s*"([^"]+)"/);
  if (routeMatch) {
    domainName = routeMatch[1].replace("/*", "");
  }
} else if (jsoncContent) {
  try {
    const config = JSON.parse(jsoncContent);
    siteName = config.name || "";
    if (config.routes && config.routes.length > 0) {
      domainName = (config.routes[0].pattern || "").replace("/*", "");
    }
  } catch (e) {
    console.error("❌ Error parsing wrangler.jsonc:", e);
  }
}

if (!siteName) siteName = "Astro Landing";
if (!domainName) {
  console.warn("⚠️ Warning: Could not detect custom domain. Defaulting to workers.dev.");
  domainName = `${siteName}.workers.dev`;
}

console.log(`📝 Detected site name: ${siteName}`);
console.log(`🌐 Detected domain: ${domainName}`);

// 3. Build Astro / Web Project
console.log("🏗️ Installing dependencies & building project...");
try {
  if (existsSync(join(cwd, "bun.lock")) || existsSync(join(cwd, "bun.lockb"))) {
    await $`bun install && bun run build`;
  } else if (existsSync(join(cwd, "pnpm-lock.yaml"))) {
    await $`pnpm install && pnpm run build`;
  } else if (existsSync(join(cwd, "package-lock.json"))) {
    await $`npm install && npm run build`;
  } else {
    await $`bun run build`;
  }
  console.log("✓ Build completed successfully!");
} catch (e) {
  console.error("❌ Error: Build failed.", e);
  process.exit(1);
}

// 4. Deploy using wrangler
console.log("🚀 Deploying to Cloudflare Workers / Pages...");
try {
  const deployOut = await $`npx wrangler deploy`.text();
  console.log(deployOut);
  console.log("✓ Deployment completed successfully!");
} catch (e) {
  console.error("❌ Error: Deployment failed.", e);
  process.exit(1);
}

// 5. Retrieve Discord Token
let discordToken = process.env.DISCORD_BOT_TOKEN || "";
if (!discordToken) {
  const tokenPaths = [
    "/root/.claude/channels/discord-no6/.env",
    "/root/.claude/channels/discord-no8/.env",
    "/root/.claude/channels/discord-no10/.env",
    "/root/.claude/channels/discord-sombo/.env"
  ];
  for (const p of tokenPaths) {
    if (existsSync(p)) {
      const content = readFileSync(p, "utf8");
      const match = content.match(/^DISCORD_BOT_TOKEN\s*=\s*(.+)$/m);
      if (match) {
        discordToken = match[1].trim().replace(/['"]/g, "");
        break;
      }
    }
  }
}

if (!discordToken) {
  console.error("⚠️ Warning: Discord token not found. Skipping Discord notification.");
  console.log(`🎉 Web live at: https://${domainName}`);
  process.exit(0);
}

// 6. Post to Discord Channel (#🎉・free-for-all)
const channelId = "1512079809021214730"; // #🎉・free-for-all ID
const msgContent = `## 🚀 Web Deployed & Live! ✨
**${siteName}** has been successfully built and deployed.

🌐 **Link**: https://${domainName}

*Deployed using /landing-deploy skill 🔮*`;

console.log("Sending Discord notification to #🎉・free-for-all...");
try {
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bot ${discordToken}`,
      "Content-Type": "application/json",
      "User-Agent": "MawPlugin-DiscordReply/1.0 (no6)"
    },
    body: JSON.stringify({ content: msgContent })
  });

  if (res.ok) {
    console.log("✓ Discord notification sent successfully!");
  } else {
    console.error(`❌ Failed to send Discord notification: ${res.status} ${await res.text()}`);
  }
} catch (e) {
  console.error("❌ Error sending Discord notification:", e);
}

console.log(`\n🎉 Success! Deployed to https://${domainName}`);
