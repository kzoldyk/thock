import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SOUNDS_DIR = path.resolve("public/sounds");

function getPeakVolume(filePath) {
  try {
    const out = execSync(`ffmpeg -i "${filePath}" -af volumedetect -f null - 2>&1`, { encoding: "utf8" });
    const match = out.match(/max_volume:\s*([-\d.]+)\s*dB/);
    return match ? parseFloat(match[1]) : null;
  } catch {
    return null;
  }
}

function normalizeFile(filePath, targetDb) {
  const currentPeak = getPeakVolume(filePath);
  if (currentPeak === null) return;

  const adjustment = targetDb - currentPeak;
  if (Math.abs(adjustment) < 0.2) return; // already close

  const tmpPath = filePath + ".tmp.wav";
  try {
    execSync(`ffmpeg -y -i "${filePath}" -af "volume=${adjustment.toFixed(2)}dB" "${tmpPath}" 2>&1`, { stdio: "pipe" });
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    console.error(`Error normalizing ${filePath}:`, err.message);
  }
}

function main() {
  console.log("Normalizing sound samples in public/sounds...");
  const packDirs = fs.readdirSync(SOUNDS_DIR).filter((d) => fs.statSync(path.join(SOUNDS_DIR, d)).isDirectory());

  let totalNormalized = 0;

  for (const packDir of packDirs) {
    const dirPath = path.join(SOUNDS_DIR, packDir);
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".wav"));

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      // Down samples target -1.0 dB peak; Up samples target -3.0 dB peak
      const targetDb = file.startsWith("down") ? -1.0 : -3.0;
      normalizeFile(filePath, targetDb);
      totalNormalized++;
    }
  }

  console.log(`Successfully checked & normalized ${totalNormalized} audio files across ${packDirs.length} packs.`);
}

main();
