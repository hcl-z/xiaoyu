// Build the Android app for a GitHub release:
//   production prebuild in apps/expo-app → Gradle release build → signed APK.
//
//   node scripts/release-android.mjs    writes dist/android/daily-<version>-android.apk
//
// The APK is signed with the release key, a PKCS12 keystore with the alias `dailyplus`:
// ANDROID_KEYSTORE (a path) and ANDROID_KEYSTORE_PASSWORD name it, else the maintainer's copy in
// ~/Library/Application Support/dailyplus/android-keys (release.keystore, and its password in
// release.keystore.password). Android installs an update only when it is signed with the same key
// as the installed app, so the build refuses any other certificate than CERTIFICATE_SHA256.
// The version is `version` in apps/expo-app/app.json, and the versionCode comes from it
// (apps/expo-app/app.config.ts computes the same number for Expo). The Release phone app workflow
// (.github/workflows/release-mobile.yml) runs this and uploads the APK to the release
// mobile-v<version>.
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const APP = join(ROOT, "apps", "expo-app");
const ANDROID = join(APP, "android");
const BUILD_DIR = join(ROOT, "dist", "android");

const PACKAGE = "com.hclz.dailyplus";
// SHA-256 of the release key's certificate, as apksigner prints it.
const CERTIFICATE_SHA256 = "6d751a0bd6cea032329587a81f8b0dcdff0850854b8d8e9508b88dcd9f5c4b34";
// Phones, and x86_64 for the emulator and Chromebooks; native libraries go in compressed
// (useLegacyPackaging), so the APK one downloads for an update stays small.
const ABIS = "arm64-v8a,x86_64";

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

for (const tool of ["pnpm"]) {
  if (!spawnSync(tool, ["--version"]).stdout) die(`missing required tool: ${tool}`);
}

const keysDir = join(homedir(), "Library", "Application Support", "dailyplus", "android-keys");
const keystore = process.env.ANDROID_KEYSTORE ?? join(keysDir, "release.keystore");
if (!existsSync(keystore)) die(`no release keystore at ${keystore}: docs in CHANGELOG / repo README`);
const passwordFile = `${keystore}.password`;
const password =
  process.env.ANDROID_KEYSTORE_PASSWORD ??
  (existsSync(passwordFile) ? readFileSync(passwordFile, "utf8").trim() : "");
if (!password) die(`set ANDROID_KEYSTORE_PASSWORD, or put the keystore's password in ${passwordFile}`);

const sdk = process.env.ANDROID_HOME ?? join(homedir(), "Library", "Android", "sdk");
if (!existsSync(sdk)) die(`no Android SDK at ${sdk}: set ANDROID_HOME`);
const buildTools = readdirSync(join(sdk, "build-tools"))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .at(-1);
if (!buildTools) die("no build-tools in the Android SDK");
const apksigner = join(sdk, "build-tools", buildTools, "apksigner");
const aapt2 = join(sdk, "build-tools", buildTools, "aapt2");
// Android Studio's runtime when no JDK is named, as on a Mac that builds from Android Studio.
const studioJava = "/Applications/Android Studio.app/Contents/jbr/Contents/Home";
const javaHome = process.env.JAVA_HOME ?? (existsSync(studioJava) ? studioJava : undefined);
if (!javaHome) die("set JAVA_HOME to a JDK 17 or later");

const env = { ...process.env, ANDROID_HOME: sdk, JAVA_HOME: javaHome };

const app = JSON.parse(readFileSync(join(APP, "app.json"), "utf8")).expo;
const version = app.version;
const [major, minor, patch] = version.split(".").map(Number);
const versionCode = major * 1_000_000 + minor * 1_000 + patch;
if (!/^\d+\.\d+\.\d+$/.test(version)) die(`the version in app.json is "${version}", not X.Y.Z`);

// ---- 1. production project
console.log(`prebuild  daily+ ${version} (${versionCode}), ${PACKAGE}`);
rmSync(ANDROID, { recursive: true, force: true });
run("pnpm", ["exec", "expo", "prebuild", "--platform", "android", "--no-install"], { cwd: APP, env });

// ---- 2. release build
// The signing goes in the generated project's gradle.properties for the build: the properties
// Android Studio's signed builds use, which sign every variant. On the command line the password
// would show in ps, and as ORG_GRADLE_PROJECT_ variables their names hold dots, which dash, the
// /bin/sh that runs gradlew on Ubuntu, drops: the APK came out with the debug key.
console.log(`building  ${ABIS}, signed with ${keystore}`);
const properties = join(ANDROID, "gradle.properties");
const unsigned = readFileSync(properties, "utf8");
// A .properties value takes a backslash as an escape.
const value = (text) => text.replaceAll("\\", "\\\\");
const signed = `${unsigned}
org.gradle.jvmargs=-Xmx6g -XX:MaxMetaspaceSize=1g
android.injected.signing.store.file=${value(keystore)}
android.injected.signing.store.password=${value(password)}
android.injected.signing.key.alias=dailyplus
android.injected.signing.key.password=${value(password)}
`;
try {
  writeFileSync(properties, signed);
  run(
    "./gradlew",
    [
      ":app:assembleRelease",
      `-PreactNativeArchitectures=${ABIS}`,
      "-Pexpo.useLegacyPackaging=true",
    ],
    { cwd: ANDROID, env }
  );
} finally {
  writeFileSync(properties, unsigned);
}

const built = join(ANDROID, "app", "build", "outputs", "apk", "release", "app-release.apk");
if (!existsSync(built)) die("Gradle produced no APK");

// ---- 3. check what was built
const badging = output(aapt2, ["dump", "badging", built]);
const pkg = badging.match(/^package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'/m);
if (!pkg) die("aapt2 printed no package line");
if (pkg[1] !== PACKAGE) die(`the APK is ${pkg[1]}, not ${PACKAGE}`);
if (Number(pkg[2]) !== versionCode || pkg[3] !== version)
  die(`the APK is ${pkg[3]} (${pkg[2]}), expected ${version} (${versionCode})`);
// One "… certificate SHA-256 digest:" line per signer and signature scheme.
const certs = output(apksigner, ["verify", "--print-certs", built]);
const signers = [...new Set([...certs.matchAll(/certificate SHA-256 digest: ([0-9a-f]+)$/gm)].map((m) => m[1]))];
if (signers.length !== 1 || signers[0] !== CERTIFICATE_SHA256)
  die(
    `the APK is signed by ${signers.join(", ") || "no certificate"}, not the release key ${CERTIFICATE_SHA256}: installed apps would refuse it`
  );

mkdirSync(BUILD_DIR, { recursive: true });
const apk = join(BUILD_DIR, `daily-${version}-android.apk`);
copyFileSync(built, apk);
const bytes = readFileSync(apk);
const sha256 = createHash("sha256").update(bytes).digest("hex");
console.log(`built  daily+ ${version} (${versionCode})`);
console.log(`  ${apk}`);
console.log(`  ${(bytes.length / 1024 / 1024).toFixed(1)} MB, sha256 ${sha256}`);
