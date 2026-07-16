#!/usr/bin/env bun
// Query schedule via Oracle HTTP API (backed by Drizzle DB)
// Usage: bun query.ts [filter]
// Filters: today, tomorrow, week, month, march, <keyword>
export {};

const filter = process.argv[2] || "upcoming";
const API = process.env.ORACLE_API || "http://localhost:47778";

const MONTHS: Record<string, string> = {
  jan: "01", january: "01", feb: "02", february: "02",
  mar: "03", march: "03", apr: "04", april: "04",
  may: "05", jun: "06", june: "06", jul: "07", july: "07",
  aug: "08", august: "08", sep: "09", september: "09",
  oct: "10", october: "10", nov: "11", november: "11",
  dec: "12", december: "12",
};

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Build query params based on filter
const params = new URLSearchParams();

switch (filter.toLowerCase()) {
  case "today":
    params.set("date", todayStr());
    params.set("status", "all");
    break;
  case "tomorrow":
    params.set("date", addDays(todayStr(), 1));
    params.set("status", "all");
    break;
  case "week":
    params.set("from", todayStr());
    params.set("to", addDays(todayStr(), 7));
    break;
  case "upcoming":
    params.set("from", todayStr());
    params.set("to", addDays(todayStr(), 60));
    break;
  case "month":
    {
      const now = new Date();
      params.set("from", `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`);
      params.set("to", `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`);
    }
    break;
  case "all":
    params.set("from", "2020-01-01");
    params.set("to", "2030-12-31");
    params.set("status", "all");
    break;
  default: {
    // Check if it's a month name
    const monthNum = MONTHS[filter.toLowerCase()];
    if (monthNum) {
      const year = new Date().getFullYear();
      params.set("from", `${year}-${monthNum}-01`);
      params.set("to", `${year}-${monthNum}-31`);
    } else {
      // Keyword search
      params.set("filter", filter);
      params.set("from", "2020-01-01");
      params.set("to", "2030-12-31");
    }
  }
}

try {
  const res = await fetch(`${API}/api/schedule?${params}`);
  if (!res.ok) {
    console.error(`API error: ${res.status} ${res.statusText}`);
    console.error("Is the Oracle server running? Start with: bun src/server.ts");
    process.exit(1);
  }

  const data = await res.json() as {
    total: number;
    events: Array<{
      id: number;
      date: string;
      dateRaw: string;
      time: string;
      event: string;
      notes: string | null;
      recurring: string | null;
      status: string;
    }>;
    byDate: Record<string, any[]>;
  };

  if (data.total === 0) {
    console.log(`No events found for: ${filter}`);
    process.exit(0);
  }

  // Format as markdown table
  console.log(`## Schedule — ${filter} (${data.total} events)\n`);
  console.log("| Date | Time | Event | Notes | Status |");
  console.log("|------|------|-------|-------|--------|");

  for (const ev of data.events) {
    const status = ev.status === "done" ? "done" : ev.status === "cancelled" ? "cancelled" : "pending";
    const recur = ev.recurring ? ` (${ev.recurring})` : "";
    const notes = ev.notes || "";
    console.log(`| ${ev.dateRaw || ev.date} | ${ev.time} | ${ev.event}${recur} | ${notes} | ${status} |`);
  }

  // Show ground truth reference
  console.log(`\n📄 \`ψ/inbox/schedule.md\``);
} catch (e: any) {
  if (e.code === "ConnectionRefused" || e.message?.includes("fetch")) {
    console.error("Cannot connect to Oracle API at " + API);
    console.error("Start the server: cd arra-oracle-v3 && bun src/server.ts");
  } else {
    console.error("Error:", e.message);
  }
  process.exit(1);
}
