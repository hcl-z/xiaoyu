// Build the iPhone app as an unsigned .ipa for a GitHub release:
//   production prebuild in apps/expo-app → pods → archive without signing → .ipa.
//
//   node scripts/release-ios.mjs                    writes dist/ios/daily-<version>-ios.ipa
//   BUILD_NUMBER=42 node scripts/release-ios.mjs    the same under a chosen build number
//
// No Apple account or certificate is involved: the archive is built with code signing off, so the
// .ipa installs only after a sideloading tool (AltStore, Sideloadly, or the like) signs it with the
// user's own Apple ID. The marketing version is `version` in apps/expo-app/app.json; the build
// number is the UTC time it was made (YYYYMMDDHHmm), which only grows. The Release phone app
// workflow (.github/workflows/release-mobile.yml) runs this and uploads the .ipa to the release
// mobile-v<version>.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const APP = join(ROOT, "apps", "expo-app");
const IOS = join(APP, "ios");
const BUILD_DIR = join(ROOT, "dist", "ios");
const ARCHIVE = join(BUILD_DIR, "DailyPlus.xcarchive");

function die(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error) die(`missing tool: ${command}`);
  if (result.status !== 0) die(`${command} ${args.join(" ")} failed`);
}

function output(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.status !== 0) die(`${command} ${args.join(" ")} failed`);
  return result.stdout;
}

if (process.argv.length > 2) die(`unknown argument: ${process.argv[2]}`);

for (const tool of ["xcodebuild", "pod", "plutil", "ditto", "pnpm"]) {
  if (spawnSync("which", [tool]).status !== 0) die(`missing required tool: ${tool}`);
}

// The build number is the time as YYYYMMDDHHmm: it only grows, and it names when the build was
// made. UTC, so a build from a Mac and one from the workflow's runner count on the same clock.
const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const buildNumber =
  process.env.BUILD_NUMBER ??
  `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}`;
if (!/^\d+$/.test(buildNumber)) die(`BUILD_NUMBER must be digits, got "${buildNumber}"`);

// CocoaPods dies on a non-UTF-8 locale, and the CommandLineTools SDK breaks the pod install and
// the build with "unknown architecture" from tapi.
const env = {
  ...process.env,
  LANG: "en_US.UTF-8",
  LC_ALL: "en_US.UTF-8",
  DEVELOPER_DIR: process.env.DEVELOPER_DIR ?? "/Applications/Xcode.app/Contents/Developer",
  DAILY_IOS_BUILD_NUMBER: buildNumber,
};

const version = JSON.parse(readFileSync(join(APP, "app.json"), "utf8")).expo.version;
if (!/^\d+\.\d+\.\d+$/.test(version)) die(`the version in app.json is "${version}", not X.Y.Z`);

// ---- 1. production project
console.log(`prebuild  daily+ ${version}, build ${buildNumber}`);
rmSync(IOS, { recursive: true, force: true });
run("pnpm", ["exec", "expo", "prebuild", "--platform", "ios", "--no-install"], { cwd: APP, env });
run("pod", ["install"], { cwd: IOS, env });

const workspace = readdirSync(IOS).find((name) => name.endsWith(".xcworkspace"));
if (!workspace) die("prebuild wrote no .xcworkspace");
const schemes = JSON.parse(
  output("xcodebuild", ["-list", "-workspace", workspace, "-json"], { cwd: IOS })
);
const scheme = schemes.workspace.schemes.find((s) => !s.includes("TV") && !s.includes("Extension"));
if (!scheme) die(`no app scheme in ${workspace}: ${schemes.workspace.schemes.join(", ")}`);

// ---- 2. archive
// Code signing is off for every target, the pods' included, so the archive needs no identity or
// provisioning profile.
console.log(`archiving  ${scheme} (unsigned)`);
rmSync(ARCHIVE, { recursive: true, force: true });
run(
  "xcodebuild",
  [
    "-workspace",
    workspace,
    "-scheme",
    scheme,
    "-configuration",
    "Release",
    "-destination",
    "generic/platform=iOS",
    "-archivePath",
    ARCHIVE,
    "CODE_SIGNING_ALLOWED=NO",
    "CODE_SIGNING_REQUIRED=NO",
    "CODE_SIGN_IDENTITY=",
    "archive",
    "-quiet",
  ],
  { cwd: IOS, env }
);
if (!existsSync(ARCHIVE)) die("xcodebuild produced no archive");

const apps = readdirSync(join(ARCHIVE, "Products", "Applications"));
if (apps.length !== 1) die(`the archive holds ${apps.join(", ")}, not one app`);
const archivedApp = join(ARCHIVE, "Products", "Applications", apps[0]);
const plist = join(archivedApp, "Info.plist");
const short = output("plutil", ["-extract", "CFBundleShortVersionString", "raw", plist]).trim();
const built = output("plutil", ["-extract", "CFBundleVersion", "raw", plist]).trim();
if (short !== version) die(`the app carries version ${short}, expected ${version}`);
if (built !== buildNumber) die(`the app carries build ${built}, expected ${buildNumber}`);

// ---- 3. the .ipa: a zip with the app under Payload/.
const PACKAGE = join(BUILD_DIR, "package");
const ipa = join(BUILD_DIR, `daily-${version}-ios.ipa`);
rmSync(PACKAGE, { recursive: true, force: true });
mkdirSync(join(PACKAGE, "Payload"), { recursive: true });
run("ditto", [archivedApp, join(PACKAGE, "Payload", apps[0])]);
run("ditto", ["-c", "-k", "--norsrc", PACKAGE, ipa]);
rmSync(PACKAGE, { recursive: true, force: true });

const bytes = readFileSync(ipa);
const sha256 = createHash("sha256").update(bytes).digest("hex");
console.log(`built  daily+ ${version} (${buildNumber}), unsigned`);
console.log(`  ${ipa}`);
console.log(`  ${(bytes.length / 1024 / 1024).toFixed(1)} MB, sha256 ${sha256}`);
