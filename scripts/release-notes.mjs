// Print the notes CHANGELOG.md holds for a version, for a GitHub release's body.
//   node scripts/release-notes.mjs 1.0.0
import { readFileSync } from "node:fs";
import { extractReleaseNotes } from "./changelog.mjs";

const version = process.argv[2];
const notes = version && extractReleaseNotes(readFileSync("CHANGELOG.md", "utf8"), version);
if (!notes) {
  console.error(`::error::CHANGELOG.md has no "## [${version ?? "?"}]" section`);
  process.exit(1);
}
process.stdout.write(notes + "\n");
