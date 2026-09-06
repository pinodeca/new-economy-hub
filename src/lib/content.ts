// Reads content files from `content/` at build time. No database, no live
// server — see docs/DECISIONS.md and docs/DATA_MODEL.md.
//
// This is deliberately simple (read JSON, return arrays) rather than the
// throwaway-SQLite build step described in DATA_MODEL.md: at today's content
// volume, plain array filter/sort is enough. Reach for the SQLite step (or
// this file gets slow/unwieldy) once join/filter/search needs grow.

import fs from "fs";
import path from "path";
import type { Event, Forum, Organization } from "./content-types";

const CONTENT_DIR = path.join(process.cwd(), "content");

function readJsonDir<T>(subdir: string): T[] {
  const dir = path.join(CONTENT_DIR, subdir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")) as T);
}

export function getOrganizations(): Organization[] {
  return readJsonDir<Organization>("organizations").sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function getEvents(): Event[] {
  return readJsonDir<Event>("events").sort(
    (a, b) => Date.parse(a.startAt) - Date.parse(b.startAt),
  );
}

export function getForums(): Forum[] {
  return readJsonDir<Forum>("forums").sort((a, b) => a.name.localeCompare(b.name));
}

export function getOrganizationBySlug(slug: string): Organization | undefined {
  return getOrganizations().find((org) => org.slug === slug);
}
