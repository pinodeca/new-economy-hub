#!/usr/bin/env node
// Validates everything under `content/` against the contract in
// `src/lib/content-types.ts`, `content/README.md`, and `content/RESEARCH.md`.
//
// Why this exists: content here is written by agents and reviewed by a human in
// a PR. content/README.md says "nothing validates this" in four separate
// places — slug/filename agreement, organizationSlugs resolution, tag
// spelling, JSON-vs-Markdown. Every one of those fails silently: a typo
// orphans a reference or drops a record off the site with no error anywhere.
// Checking them mechanically is what lets PR review spend its attention on
// whether the research is any good.
//
// Run: npm run validate:content  (also runs automatically via `prebuild`,
// so bad content can't reach a deploy, not just a PR check.)

import fs from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "content");

const SOURCE_TYPES = ["AI_GENERATED", "AI_ASSISTED", "HUMAN"];
const GEO_SCOPES = ["US", "INTERNATIONAL", "COUNTRY"];
const BARRIERS = ["LOW", "MEDIUM", "HIGH"];
const PLATFORMS = ["SLACK", "DISCORD", "FORUM", "MAILING_LIST", "OTHER"];
const FINDINGS = ["ADDED", "NONE_FOUND", "FOUND_NOT_REPRESENTABLE"];
const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"]; // getUTCDay() order
const WEEKS_OF_MONTH = [1, 2, 3, 4, -1];
// A recurring event with no end date stays listed until someone removes it,
// so how long ago its cadence was confirmed is the only staleness signal.
const RECURRENCE_STALE_DAYS = 90;
const OUTCOME_STATUSES = ["HAPPENED", "CANCELLED", "UNCONFIRMED"];
const OUTCOME_LINK_KINDS = ["RECORDING", "RECAP", "PHOTOS", "NEWS", "OTHER"];
// Recaps and recordings typically surface weeks after an event, not days, so
// checking sooner mostly finds nothing. Past this, an unchecked event is a gap.
const OUTCOME_DUE_DAYS = 30;

const errors = [];
const warnings = [];
const error = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

const isPlainObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
const isStringArray = (v) => Array.isArray(v) && v.every(isNonEmptyString);

/** Date-only ISO string, and a real calendar date (rejects 2026-02-31). */
function isIsoDate(v) {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

function isHttpUrl(v) {
  if (typeof v !== "string") return false;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function loadDir(subdir) {
  const dir = path.join(CONTENT_DIR, subdir);
  if (!fs.existsSync(dir)) return [];

  // content/README.md: only *.json is read by the build. A stray .md here
  // wouldn't error at build time, it would just never render — so flag it.
  for (const file of fs.readdirSync(dir)) {
    if (file.endsWith(".md") && file !== "README.md") {
      error(
        `content/${subdir}/${file}`,
        "Markdown file in a content directory — the build only reads *.json, so this would never render",
      );
    }
  }

  const records = [];
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const rel = `content/${subdir}/${file}`;
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      error(rel, `invalid JSON — ${e.message}`);
      continue;
    }
    if (!isPlainObject(data)) {
      error(rel, "top level must be a JSON object");
      continue;
    }
    records.push({ file: rel, expectedSlug: file.replace(/\.json$/, ""), data });
  }
  return records;
}

/** Fields every organization/event/forum shares. */
function checkCommon(file, r, expectedSlug, seenSlugs) {
  if (!isNonEmptyString(r.slug)) {
    error(file, "missing `slug`");
  } else {
    if (r.slug !== expectedSlug) {
      error(file, `\`slug\` is "${r.slug}" but the filename says "${expectedSlug}" — they must match`);
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.slug)) {
      error(file, `\`slug\` "${r.slug}" must be lowercase alphanumeric words joined by single hyphens`);
    }
    if (seenSlugs.has(r.slug)) error(file, `duplicate slug "${r.slug}" — also used by ${seenSlugs.get(r.slug)}`);
    else seenSlugs.set(r.slug, file);
  }

  if (!isNonEmptyString(r.description)) error(file, "missing `description`");

  // Provenance. CLAUDE.md treats this as non-negotiable.
  if (!SOURCE_TYPES.includes(r.sourceType)) {
    error(file, `\`sourceType\` must be one of ${SOURCE_TYPES.join(", ")} (got ${JSON.stringify(r.sourceType)})`);
  }
  // Removed on purpose, so reject it rather than silently ignore it: an agent
  // working from older docs or habit would otherwise reintroduce a claim the
  // site no longer reads, and no check would notice.
  if ("verified" in r) {
    error(
      file,
      "`verified` was removed from the data model — the project runs no verification process for it to describe (see docs/DECISIONS.md)",
    );
  }

  // Geography is a filter, not a folder (CLAUDE.md / DATA_MODEL.md).
  if (!GEO_SCOPES.includes(r.geoScope)) {
    error(file, `\`geoScope\` must be one of ${GEO_SCOPES.join(", ")} (got ${JSON.stringify(r.geoScope)})`);
  }
  if (r.geoScope === "COUNTRY" && !/^[A-Z]{2}$/.test(r.countryCode ?? "")) {
    error(file, "`geoScope` is COUNTRY so `countryCode` must be a 2-letter uppercase ISO 3166-1 code");
  }
  if (r.geoScope !== "COUNTRY" && r.countryCode !== undefined) {
    error(file, `\`countryCode\` is only meaningful when geoScope is COUNTRY (geoScope is ${r.geoScope})`);
  }

  if (!isStringArray(r.tags)) {
    error(file, "`tags` must be an array of non-empty strings");
  } else {
    for (const tag of r.tags) {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(tag)) {
        error(file, `tag "${tag}" must be lowercase and hyphen-separated (content/README.md)`);
      }
    }
  }

  if (r.url !== undefined && !isHttpUrl(r.url)) error(file, `\`url\` is not a valid http(s) URL: ${JSON.stringify(r.url)}`);
}

function checkOptionalCount(file, r, field) {
  if (r[field] !== undefined && (!Number.isInteger(r[field]) || r[field] < 0)) {
    error(file, `\`${field}\` must be a non-negative integer`);
  }
}

function checkOrganizationRefs(file, r, orgSlugs) {
  if (r.organizationSlugs === undefined) return;
  if (!isStringArray(r.organizationSlugs)) {
    error(file, "`organizationSlugs` must be an array of non-empty strings");
    return;
  }
  for (const slug of r.organizationSlugs) {
    if (!orgSlugs.has(slug)) {
      error(file, `\`organizationSlugs\` references "${slug}", which is not an organization in content/organizations/`);
    }
  }
}

/**
 * `Event.recurrence` (see content-types.ts). The rule-matching half mirrors
 * matchesRule in src/lib/event-dates.ts: `startAt` has to be a real
 * occurrence, otherwise every-N-weeks counting starts from the wrong week and
 * a "second Tuesday" event dated on a Wednesday silently shows a wrong next
 * date.
 */
function checkRecurrence(file, event) {
  const rec = event.recurrence;
  if (rec === undefined) return;
  if (!isPlainObject(rec)) {
    error(file, "`recurrence` must be an object");
    return;
  }
  if (!isNonEmptyString(rec.schedule)) {
    error(file, "`recurrence.schedule` is required — it's what readers see, e.g. \"Every Wednesday, 6pm ET\"");
  }
  if (!isIsoDate(rec.confirmedAt)) {
    error(file, "`recurrence.confirmedAt` must be a YYYY-MM-DD date");
  } else {
    const ageDays = (Date.now() - new Date(rec.confirmedAt).getTime()) / 86_400_000;
    if (ageDays < 0) error(file, `\`recurrence.confirmedAt\` is in the future (${rec.confirmedAt})`);
    else if (ageDays > RECURRENCE_STALE_DAYS && event.endAt === undefined) {
      warn(file, `recurring schedule last confirmed ${rec.confirmedAt}, over ${RECURRENCE_STALE_DAYS} days ago — re-check it's still running`);
    }
  }

  const rule = rec.rule;
  if (rule === undefined) return;
  if (!isPlainObject(rule)) {
    error(file, "`recurrence.rule` must be an object");
    return;
  }
  if (!WEEKDAYS.includes(rule.weekday)) {
    error(file, `\`recurrence.rule.weekday\` must be one of ${WEEKDAYS.join(", ")} (got ${JSON.stringify(rule.weekday)})`);
    return;
  }
  if (rule.frequency === "WEEKLY") {
    if (rule.interval !== undefined && !(Number.isInteger(rule.interval) && rule.interval >= 1)) {
      error(file, "`recurrence.rule.interval` must be a positive integer");
    }
  } else if (rule.frequency === "MONTHLY") {
    if (!WEEKS_OF_MONTH.includes(rule.weekOfMonth)) {
      error(file, "`recurrence.rule.weekOfMonth` must be 1-4, or -1 for the last one in the month");
      return;
    }
  } else {
    error(file, `\`recurrence.rule.frequency\` must be WEEKLY or MONTHLY (got ${JSON.stringify(rule.frequency)})`);
    return;
  }

  if (!isIsoDate(event.startAt)) return; // already reported
  const start = new Date(event.startAt);
  const onWeekday = WEEKDAYS[start.getUTCDay()] === rule.weekday;
  const inWeek =
    rule.frequency !== "MONTHLY" ||
    (rule.weekOfMonth === -1
      ? new Date(start.getTime() + 7 * 86_400_000).getUTCMonth() !== start.getUTCMonth()
      : Math.ceil(start.getUTCDate() / 7) === rule.weekOfMonth);
  if (!onWeekday || !inWeek) {
    error(file, `\`startAt\` (${event.startAt}) isn't a date \`recurrence.rule\` lands on — set it to a real occurrence`);
  }
}

/**
 * `Event.outcome` and `Event.archivedUrl` — the post-event check (see
 * content/RESEARCH.md). Like the research block, the point is that "checked,
 * it happened" and "nobody looked" must not look the same in content/.
 */
function checkOutcome(file, event) {
  if (event.archivedUrl !== undefined && !isHttpUrl(event.archivedUrl)) {
    error(file, `\`archivedUrl\` is not a valid http(s) URL: ${JSON.stringify(event.archivedUrl)}`);
  }

  // Open-ended recurring events never end, so there's nothing to check.
  const lastDay = event.recurrence && event.endAt === undefined ? null : (event.endAt ?? event.startAt);
  const outcome = event.outcome;

  if (outcome === undefined) {
    if (lastDay && isIsoDate(lastDay)) {
      const daysSince = (Date.now() - new Date(lastDay).getTime()) / 86_400_000;
      if (daysSince > OUTCOME_DUE_DAYS + 1) {
        warn(file, `ended ${lastDay}, over ${OUTCOME_DUE_DAYS} days ago, with no \`outcome\` — run the post-event check (content/RESEARCH.md)`);
      }
    }
    return;
  }
  if (!isPlainObject(outcome)) {
    error(file, "`outcome` must be an object");
    return;
  }
  if (lastDay === null) {
    error(file, "`outcome` on an open-ended recurring event — it never ends, so there's nothing to check; set `endAt` if the series has finished");
    return;
  }

  if (!isIsoDate(outcome.checkedAt)) {
    error(file, "`outcome.checkedAt` must be a YYYY-MM-DD date");
  } else {
    if (new Date(outcome.checkedAt) > new Date()) error(file, `\`outcome.checkedAt\` is in the future (${outcome.checkedAt})`);
    if (isIsoDate(lastDay) && outcome.checkedAt < lastDay) {
      error(file, `\`outcome.checkedAt\` (${outcome.checkedAt}) is before the event ended (${lastDay}) — an outcome can't be known yet`);
    }
  }
  if (!OUTCOME_STATUSES.includes(outcome.status)) {
    error(file, `\`outcome.status\` must be one of ${OUTCOME_STATUSES.join(", ")} (got ${JSON.stringify(outcome.status)})`);
  }
  if (outcome.status !== "HAPPENED" && !isNonEmptyString(outcome.notes)) {
    error(file, `\`outcome.status\` is ${outcome.status}, so \`outcome.notes\` must say how that was determined — otherwise it's an unauditable assertion`);
  }
  if (outcome.notes !== undefined && !isNonEmptyString(outcome.notes)) {
    error(file, "`outcome.notes` must be a non-empty string when present");
  }
  if (outcome.links !== undefined) {
    if (!Array.isArray(outcome.links)) {
      error(file, "`outcome.links` must be an array");
    } else {
      for (const link of outcome.links) {
        if (!isPlainObject(link) || !isHttpUrl(link.url)) {
          error(file, `\`outcome.links\` entry needs a valid http(s) \`url\`: ${JSON.stringify(link)}`);
        } else if (!OUTCOME_LINK_KINDS.includes(link.kind)) {
          error(file, `\`outcome.links\` kind must be one of ${OUTCOME_LINK_KINDS.join(", ")} (got ${JSON.stringify(link.kind)})`);
        }
      }
    }
  }
}

/**
 * The research block. This is the part that stops "checked and found nothing"
 * from being indistinguishable from "never checked" — see content/RESEARCH.md.
 */
function checkResearch(file, org, refs) {
  const research = org.research;
  if (research === undefined) return; // never researched; legitimate, just unchecked
  if (!isPlainObject(research)) {
    error(file, "`research` must be an object");
    return;
  }

  if (!isIsoDate(research.checkedAt)) {
    error(file, "`research.checkedAt` must be a YYYY-MM-DD date");
  } else if (new Date(research.checkedAt) > new Date()) {
    error(file, `\`research.checkedAt\` is in the future (${research.checkedAt})`);
  }

  if (!isStringArray(research.sourcesChecked) || research.sourcesChecked.length === 0) {
    error(file, "`research.sourcesChecked` must be a non-empty array — a negative result has to be auditable");
  } else {
    for (const src of research.sourcesChecked) {
      if (!isHttpUrl(src)) warn(file, `\`research.sourcesChecked\` entry is not a URL: ${JSON.stringify(src)}`);
    }
  }

  if (research.notRepresentable !== undefined && !isStringArray(research.notRepresentable)) {
    error(file, "`research.notRepresentable` must be an array of non-empty strings");
  }
  if (research.notes !== undefined && !isNonEmptyString(research.notes)) {
    error(file, "`research.notes` must be a non-empty string when present");
  }

  // Each finding has to agree with what's actually in content/. This is the
  // check that would have caught the original problem: a claim of ADDED with
  // nothing referencing the org, or NONE_FOUND next to a record that exists.
  for (const [field, kind] of [["events", "event"], ["forums", "forum"]]) {
    const finding = research[field];
    if (!FINDINGS.includes(finding)) {
      error(file, `\`research.${field}\` must be one of ${FINDINGS.join(", ")} (got ${JSON.stringify(finding)})`);
      continue;
    }
    const count = refs[field].length;
    if (finding === "ADDED" && count === 0) {
      error(file, `\`research.${field}\` says ADDED but no ${kind} in content/ references "${org.slug}"`);
    }
    if (finding === "NONE_FOUND" && count > 0) {
      error(
        file,
        `\`research.${field}\` says NONE_FOUND but ${count} ${kind}(s) reference "${org.slug}": ${refs[field].join(", ")}`,
      );
    }
    if (finding === "FOUND_NOT_REPRESENTABLE" && !(research.notRepresentable?.length > 0)) {
      error(
        file,
        `\`research.${field}\` is FOUND_NOT_REPRESENTABLE, so \`research.notRepresentable\` must say what was found — otherwise it's silently lost (content/RESEARCH.md)`,
      );
    }
  }
}

/** Tags that differ only by separator/plural defeat tag filtering as badly as
 *  a duplicate record does — flag them, but as advice, not a build failure. */
function checkTagDrift(allTags) {
  const byNormal = new Map();
  for (const tag of allTags) {
    const normal = tag.replace(/[-_]/g, "").replace(/s$/, "");
    if (!byNormal.has(normal)) byNormal.set(normal, new Set());
    byNormal.get(normal).add(tag);
  }
  for (const variants of byNormal.values()) {
    if (variants.size > 1) {
      warnings.push(`tags: near-duplicate tags in use — ${[...variants].map((t) => `"${t}"`).join(" vs ")}`);
    }
  }
}

/** DATA_MODEL.md asks for this to reject the build once a pipeline exists. */
function checkPodcast() {
  const episodes = loadDir("podcast");
  for (const { file, expectedSlug, data } of episodes) {
    if (data.slug !== expectedSlug) error(file, `\`slug\` must match the filename ("${expectedSlug}")`);
    if (!isNonEmptyString(data.title)) error(file, "missing `title`");
    if (!isNonEmptyString(data.audioUrl)) error(file, "missing `audioUrl`");
    if (typeof data.aiGenerated !== "boolean") error(file, "`aiGenerated` must be a boolean");
    if (data.aiGenerated === true && !isNonEmptyString(data.aiDisclosure)) {
      error(
        file,
        "`aiGenerated` is true so `aiDisclosure` is required and must be rendered visibly — never ship an AI episode without it (CLAUDE.md)",
      );
    }
  }
}

function main() {
  const organizations = loadDir("organizations");
  const events = loadDir("events");
  const forums = loadDir("forums");

  const orgSlugs = new Set(organizations.map((o) => o.data.slug).filter(isNonEmptyString));

  const orgSeen = new Map();
  for (const { file, expectedSlug, data } of organizations) {
    checkCommon(file, data, expectedSlug, orgSeen);
    if (!isNonEmptyString(data.name)) error(file, "missing `name`");
    checkOptionalCount(file, data, "memberCount");
    if (data.activityLevel !== undefined && ![1, 2, 3, 4, 5].includes(data.activityLevel)) {
      error(file, "`activityLevel` must be an integer 1-5");
    }
  }

  const eventSeen = new Map();
  for (const { file, expectedSlug, data } of events) {
    checkCommon(file, data, expectedSlug, eventSeen);
    if (!isNonEmptyString(data.title)) error(file, "missing `title`");
    if (!isIsoDate(data.startAt)) error(file, "`startAt` must be a YYYY-MM-DD date");
    if (data.endAt !== undefined) {
      if (!isIsoDate(data.endAt)) error(file, "`endAt` must be a YYYY-MM-DD date");
      else if (isIsoDate(data.startAt) && data.endAt < data.startAt) error(file, "`endAt` is before `startAt`");
    }
    if (typeof data.isVirtual !== "boolean") error(file, "`isVirtual` must be a boolean");
    if (!BARRIERS.includes(data.barrierToEntry)) {
      error(file, `\`barrierToEntry\` must be one of ${BARRIERS.join(", ")} (got ${JSON.stringify(data.barrierToEntry)})`);
    }
    checkRecurrence(file, data);
    checkOutcome(file, data);
    checkOrganizationRefs(file, data, orgSlugs);
  }

  const forumSeen = new Map();
  for (const { file, expectedSlug, data } of forums) {
    checkCommon(file, data, expectedSlug, forumSeen);
    if (!isNonEmptyString(data.name)) error(file, "missing `name`");
    if (!isHttpUrl(data.url)) error(file, "`url` is required on a forum and must be a valid http(s) URL");
    if (!PLATFORMS.includes(data.platform)) {
      error(file, `\`platform\` must be one of ${PLATFORMS.join(", ")} (got ${JSON.stringify(data.platform)})`);
    }
    checkOptionalCount(file, data, "memberCount");
    checkOrganizationRefs(file, data, orgSlugs);
  }

  for (const { file, data } of organizations) {
    checkResearch(file, data, {
      events: events.filter((e) => e.data.organizationSlugs?.includes(data.slug)).map((e) => e.data.slug),
      forums: forums.filter((f) => f.data.organizationSlugs?.includes(data.slug)).map((f) => f.data.slug),
    });
  }

  checkTagDrift([...organizations, ...events, ...forums].flatMap(({ data }) => (isStringArray(data.tags) ? data.tags : [])));
  checkPodcast();

  const counts = `${organizations.length} organizations, ${events.length} events, ${forums.length} forums`;
  const researched = organizations.filter((o) => o.data.research !== undefined).length;

  for (const w of warnings) console.warn(`  warning  ${w}`);

  if (errors.length > 0) {
    console.error(`\n${errors.length} content problem(s):\n`);
    for (const e of errors) console.error(`  error  ${e}`);
    console.error("");
    process.exit(1);
  }

  console.log(
    `content OK — ${counts} (${researched}/${organizations.length} organizations have a RESEARCH.md pass recorded)` +
      (warnings.length ? `, ${warnings.length} warning(s)` : ""),
  );
}

main();
