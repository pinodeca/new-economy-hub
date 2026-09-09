#!/usr/bin/env node
// Tests for scripts/validate-content.mjs.
//
// A validator nobody has ever seen fail is not a guardrail, it's decoration —
// especially here, where it's the thing standing between an agent-authored PR
// and the live site. Each case below breaks the content in one specific way
// and asserts the validator both fails and says something useful about why.
//
// Runs against a throwaway copy of content/ in the OS temp directory; the real
// content/ is never modified. No test framework, no dependencies — this repo
// has neither, and this doesn't need them.
//
// Run: npm run test:content

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const REPO = path.resolve(import.meta.dirname, "..");
const VALIDATOR = path.join(REPO, "scripts/validate-content.mjs");
const SANDBOX = fs.mkdtempSync(path.join(os.tmpdir(), "neh-content-test-"));

const read = (dir, f) => JSON.parse(fs.readFileSync(path.join(SANDBOX, "content", dir, f), "utf8"));
const write = (dir, f, data) =>
  fs.writeFileSync(path.join(SANDBOX, "content", dir, f), JSON.stringify(data, null, 2));
const writeRaw = (rel, body) => {
  fs.mkdirSync(path.dirname(path.join(SANDBOX, rel)), { recursive: true });
  fs.writeFileSync(path.join(SANDBOX, rel), body);
};

const ORG = ["organizations", "agrarian-trust.json"];
const EVENT = ["events", "worker-coop-conference-2026.json"];
const FORUM = ["forums", "usfwc-worker-coop-slack.json"];

const withResearch = (extra) => ({
  checkedAt: "2026-09-08",
  events: "NONE_FOUND",
  forums: "NONE_FOUND",
  sourcesChecked: ["https://www.agrariantrust.org/"],
  ...extra,
});

function reset() {
  fs.rmSync(path.join(SANDBOX, "content"), { recursive: true, force: true });
  fs.cpSync(path.join(REPO, "content"), path.join(SANDBOX, "content"), { recursive: true });
}

function run() {
  try {
    return { code: 0, out: execFileSync("node", [VALIDATOR], { cwd: SANDBOX, encoding: "utf8", stdio: "pipe" }) };
  } catch (e) {
    return { code: e.status, out: (e.stdout ?? "") + (e.stderr ?? "") };
  }
}

const mutate = (target, change) => () => {
  const record = read(...target);
  change(record);
  write(...target, record);
};

/** [name, mutation, expected exit code, expected text in output] */
const cases = [
  ["baseline: untouched content passes", () => {}, 0, null],

  // Provenance — CLAUDE.md's hard rules.
  ["agent self-verifies", mutate(ORG, (o) => { o.verified = true; }), 1, "verification step"],
  ["invalid sourceType", mutate(ORG, (o) => { o.sourceType = "SCRAPED"; }), 1, "sourceType"],

  // The four "nothing validates this" gaps named in content/README.md.
  ["slug disagrees with filename", mutate(ORG, (o) => { o.slug = "agrarian-trust-typo"; }), 1, "filename says"],
  ["orphaned organizationSlugs reference", mutate(EVENT, (e) => { e.organizationSlugs = ["does-not-exist"]; }), 1, "not an organization"],
  ["shouty tag", mutate(ORG, (o) => { o.tags = ["Land Access"]; }), 1, "hyphen-separated"],
  ["markdown file that would never render", () => writeRaw("content/organizations/ghost-org.md", "# nope"), 1, "never render"],

  // Geography is a filter, not a folder.
  ["COUNTRY without countryCode", mutate(ORG, (o) => { o.geoScope = "COUNTRY"; }), 1, "countryCode"],
  ["countryCode on a US record", mutate(ORG, (o) => { o.countryCode = "US"; }), 1, "only meaningful"],

  // Shape.
  ["malformed JSON", () => writeRaw("content/organizations/agrarian-trust.json", "{ not json"), 1, "invalid JSON"],
  ["endAt before startAt", mutate(EVENT, (e) => { e.endAt = "2026-09-01"; }), 1, "before `startAt`"],
  ["impossible calendar date", mutate(EVENT, (e) => { e.startAt = "2026-02-31"; }), 1, "startAt"],
  ["invalid forum platform", mutate(FORUM, (f) => { f.platform = "TELEGRAM"; }), 1, "platform"],

  // The research block — the checked-vs-never-checked distinction itself.
  ["research claims ADDED with nothing referencing the org", mutate(ORG, (o) => { o.research = withResearch({ events: "ADDED" }); }), 1, "says ADDED but no event"],
  ["research claims NONE_FOUND while a forum exists", () => {
    const o = read("organizations", "us-federation-of-worker-cooperatives.json");
    o.research = withResearch({ events: "ADDED", sourcesChecked: ["https://www.usworker.coop/"] });
    write("organizations", "us-federation-of-worker-cooperatives.json", o);
  }, 1, "says NONE_FOUND but"],
  ["FOUND_NOT_REPRESENTABLE without saying what", mutate(ORG, (o) => { o.research = withResearch({ events: "FOUND_NOT_REPRESENTABLE" }); }), 1, "silently lost"],
  ["research with no sources", mutate(ORG, (o) => { o.research = withResearch({ sourcesChecked: [] }); }), 1, "auditable"],
  ["research dated in the future", mutate(ORG, (o) => { o.research = withResearch({ checkedAt: "2099-01-01" }); }), 1, "in the future"],
  ["valid research block passes", mutate(ORG, (o) => { o.research = withResearch({}); }), 0, null],

  // DATA_MODEL.md: an AI episode must never ship without a disclosure.
  ["AI podcast episode with no disclosure", () => writeRaw("content/podcast/ep1.json", JSON.stringify({
    slug: "ep1", title: "Ep 1", description: "d", audioUrl: "https://example.com/1.mp3", aiGenerated: true,
  })), 1, "aiDisclosure"],
  ["AI podcast episode with a disclosure passes", () => writeRaw("content/podcast/ep1.json", JSON.stringify({
    slug: "ep1", title: "Ep 1", description: "d", audioUrl: "https://example.com/1.mp3", aiGenerated: true,
    aiDisclosure: "This episode was generated by AI.",
  })), 0, null],
];

let pass = 0;
const failures = [];
for (const [name, apply, expectedCode, expectedText] of cases) {
  reset();
  apply();
  const { code, out } = run();
  if (code === expectedCode && (expectedText === null || out.includes(expectedText))) {
    console.log(`  PASS  ${name}`);
    pass++;
  } else {
    console.log(`  FAIL  ${name}`);
    console.log(`        expected exit ${expectedCode}${expectedText ? ` containing "${expectedText}"` : ""}, got exit ${code}`);
    console.log(`        ${out.trim().split("\n").join("\n        ")}`);
    failures.push(name);
  }
}

fs.rmSync(SANDBOX, { recursive: true, force: true });
console.log(`\n${pass} passed, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
