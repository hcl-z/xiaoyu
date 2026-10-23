// Exit 0 when CHANGELOG.md has a section for the version, else exit 1 with a workflow error.
//   node scripts/require-release-notes.mjs 1.0.0
import { readFileSync } from "node:fs";
import { extractReleaseNotes } from "./changelog.mjs";

const version = process.argv[2];
if (!version || !extractReleaseNotes(readFileSync("CHANGELOG.md", "utf8"), version)) {
  console.error(`::error::CHANGELOG.md has no "## [${version ?? "?"}]" section`);
  process.exit(1);
}
