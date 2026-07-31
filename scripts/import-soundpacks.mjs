import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const SOURCE_DIR = "/Users/hiteshbhai.prajapati/Downloads/mechvibes-main/src/audio";
const DEST_BASE = path.resolve("public/sounds");

function convertSinglePack(packDirName) {
  const srcPackDir = path.join(SOURCE_DIR, packDirName);
  const configPath = path.join(srcPackDir, "config.json");
  if (!fs.existsSync(configPath)) return null;

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const soundFile = path.join(srcPackDir, config.sound || "sound.ogg");
  if (!fs.existsSync(soundFile)) {
    console.warn(`Sound file missing for ${packDirName}: ${soundFile}`);
    return null;
  }

  const packId = packDirName;
  const outDir = path.join(DEST_BASE, packId);
  fs.mkdirSync(outDir, { recursive: true });

  const defines = config.defines || {};
  const downKeys = Object.keys(defines).filter((k) => !k.endsWith("-up"));
  const upKeys = Object.keys(defines).filter((k) => k.endsWith("-up"));

  // Limit to max 16 down and 16 up samples
  const selectedDown = downKeys.slice(0, 16);
  const selectedUp = upKeys.slice(0, 16);

  const downFiles = [];
  const upFiles = [];

  selectedDown.forEach((key, idx) => {
    const [startMs, durMs] = defines[key];
    const startSec = (startMs / 1000).toFixed(4);
    const durSec = Math.max(0.04, durMs / 1000).toFixed(4);
    const fileName = `down-${(idx + 1).toString().padStart(2, "0")}.wav`;
    const outFile = path.join(outDir, fileName);

    const cmd = `ffmpeg -y -ss ${startSec} -t ${durSec} -i "${soundFile}" -ac 1 -ar 44100 -af "volume=1.2,afade=t=out:st=${Math.max(0, parseFloat(durSec) - 0.015)}:d=0.015" "${outFile}"`;
    try {
      execSync(cmd, { stdio: "pipe" });
      downFiles.push(`sounds/${packId}/${fileName}`);
    } catch (e) {
      console.error(`Failed slicing down sample ${key} for ${packId}:`, e.message);
    }
  });

  selectedUp.forEach((key, idx) => {
    const [startMs, durMs] = defines[key];
    const startSec = (startMs / 1000).toFixed(4);
    const durSec = Math.max(0.03, durMs / 1000).toFixed(4);
    const fileName = `up-${(idx + 1).toString().padStart(2, "0")}.wav`;
    const outFile = path.join(outDir, fileName);

    const cmd = `ffmpeg -y -ss ${startSec} -t ${durSec} -i "${soundFile}" -ac 1 -ar 44100 -af "volume=1.0,afade=t=out:st=${Math.max(0, parseFloat(durSec) - 0.015)}:d=0.015" "${outFile}"`;
    try {
      execSync(cmd, { stdio: "pipe" });
      upFiles.push(`sounds/${packId}/${fileName}`);
    } catch (e) {
      console.error(`Failed slicing up sample ${key} for ${packId}:`, e.message);
    }
  });

  if (downFiles.length === 0) return null;

  const packData = {
    id: packId,
    name: config.name || packDirName,
    description: `Studio ${config.name} sound pack.`,
    version: "1.0.0",
    switchType: "mechanical",
    down: downFiles,
    up: upFiles,
    options: {
      pitchVariation: 0.04,
      releaseTone: "bright",
    },
  };

  fs.writeFileSync(path.join(outDir, "pack.json"), JSON.stringify(packData, null, 2));

  return {
    id: packId,
    name: config.name || packDirName,
    description: packData.description,
    path: `/sounds/${packId}/pack.json`,
  };
}

function convertMultiPack(packDirName) {
  const srcPackDir = path.join(SOURCE_DIR, packDirName);
  const configPath = path.join(srcPackDir, "config.json");
  if (!fs.existsSync(configPath)) return null;

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const packId = packDirName;
  const outDir = path.join(DEST_BASE, packId);
  fs.mkdirSync(outDir, { recursive: true });

  // Find all mp3/wav files recursively in srcPackDir
  function getAudioFiles(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getAudioFiles(filePath));
      } else if (file.endsWith(".mp3") || file.endsWith(".wav") || file.endsWith(".ogg")) {
        results.push(filePath);
      }
    });
    return results;
  }

  const allFiles = getAudioFiles(srcPackDir);
  const pressFiles = allFiles.filter((f) => !f.toLowerCase().includes("release") && !f.toLowerCase().includes("up"));
  const releaseFiles = allFiles.filter((f) => f.toLowerCase().includes("release") || f.toLowerCase().includes("up"));

  const downFiles = [];
  const upFiles = [];

  pressFiles.forEach((file, idx) => {
    const fileName = `down-${(idx + 1).toString().padStart(2, "0")}.wav`;
    const outFile = path.join(outDir, fileName);
    const cmd = `ffmpeg -y -i "${file}" -ac 1 -ar 44100 "${outFile}"`;
    try {
      execSync(cmd, { stdio: "pipe" });
      downFiles.push(`sounds/${packId}/${fileName}`);
    } catch {}
  });

  const upSourceFiles = releaseFiles.length > 0 ? releaseFiles : pressFiles.slice(0, 4);
  upSourceFiles.forEach((file, idx) => {
    const fileName = `up-${(idx + 1).toString().padStart(2, "0")}.wav`;
    const outFile = path.join(outDir, fileName);
    const cmd = `ffmpeg -y -i "${file}" -ac 1 -ar 44100 -af "volume=0.7" "${outFile}"`;
    try {
      execSync(cmd, { stdio: "pipe" });
      upFiles.push(`sounds/${packId}/${fileName}`);
    } catch {}
  });

  if (downFiles.length === 0) return null;

  const packData = {
    id: packId,
    name: config.name || packDirName,
    description: `Studio ${config.name} sound pack.`,
    version: "1.0.0",
    switchType: "mechanical",
    down: downFiles,
    up: upFiles,
    options: {
      pitchVariation: 0.04,
      releaseTone: "bright",
    },
  };

  fs.writeFileSync(path.join(outDir, "pack.json"), JSON.stringify(packData, null, 2));

  return {
    id: packId,
    name: config.name || packDirName,
    description: packData.description,
    path: `/sounds/${packId}/pack.json`,
  };
}

function main() {
  console.log("Importing Mechvibes sound packs...");
  const packDirs = fs
    .readdirSync(SOURCE_DIR)
    .filter((d) => fs.statSync(path.join(SOURCE_DIR, d)).isDirectory());

  const manifest = [
    {
      id: "default",
      name: "Cherry MX Blue (Default)",
      description: "Processed from a single mechanical keyboard recording into distinct key-down and key-up samples.",
      path: "/sounds/default/pack.json",
    },
  ];

  packDirs.forEach((dirName) => {
    const configPath = path.join(SOURCE_DIR, dirName, "config.json");
    if (!fs.existsSync(configPath)) return;
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

    console.log(`Processing ${dirName} (${config.name})...`);
    let entry = null;
    if (config.key_define_type === "multi") {
      entry = convertMultiPack(dirName);
    } else {
      entry = convertSinglePack(dirName);
    }

    if (entry) {
      manifest.push(entry);
    }
  });

  fs.writeFileSync(path.resolve("public/sounds/sounds.json"), JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${manifest.length} sound packs to public/sounds/sounds.json!`);
}

main();
