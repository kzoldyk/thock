import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const sourcePath =
  process.env.SOUND_SOURCE ||
  "/Users/hiteshbhai.prajapati/Downloads/638035__simeonradivoev__mechanical-keyboard-typing-cherry-blue-switches.wav";

const outputDir = path.resolve("public/sounds/default");
const targetDownCount = 16;
const targetUpCount = 16;
const minSegmentDuration = 0.03;
const maxSegmentDuration = 0.35;

function ffprobeDuration(file) {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`,
    { encoding: "utf8" }
  );
  return parseFloat(out.trim());
}

function detectSegments(file) {
  const stderr = execSync(
    `ffmpeg -hide_banner -nostats -i "${file}" -af silencedetect=noise=-35dB:d=0.03 -f null - 2>&1`,
    { encoding: "utf8" }
  );
  const starts = [];
  const ends = [];
  const startRe = /silence_start:\s*([\d.]+)/g;
  const endRe = /silence_end:\s*([\d.]+)/g;
  let m;
  while ((m = startRe.exec(stderr)) !== null) starts.push(parseFloat(m[1]));
  while ((m = endRe.exec(stderr)) !== null) ends.push(parseFloat(m[1]));

  const duration = ffprobeDuration(file);
  const segments = [];

  // If the first silence starts after the minimum segment duration, the file starts with sound
  if (starts.length > 0 && starts[0] > minSegmentDuration) {
    segments.push({ start: 0, end: starts[0] });
  }

  for (let i = 0; i < ends.length; i++) {
    const s = ends[i];
    const nextStart = starts.find((t) => t > s);
    const e = nextStart ?? duration;
    segments.push({ start: s, end: e });
  }

  let filtered = segments
    .map((s) => ({ ...s, duration: s.end - s.start }))
    .filter((s) => s.duration >= minSegmentDuration && s.duration <= maxSegmentDuration);

  // Fallback: if the recording is too dense for silence detection, split evenly.
  if (filtered.length === 0) {
    const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
    const gap = 0.25;
    const sampleDur = 0.12;
    const total = duration - gap * 2;
    const count = Math.floor(total / (sampleDur + gap));
    for (let i = 0; i < count; i++) {
      const start = gap + i * (sampleDur + gap);
      const end = clamp(start + sampleDur, start, duration - gap);
      if (end - start >= minSegmentDuration) {
        filtered.push({ start, end, duration: end - start });
      }
    }
  }

  return filtered
    .sort((a, b) => b.duration - a.duration)
    .slice(0, Math.max(targetDownCount, targetUpCount));
}

function pickEvenly(items, count) {
  if (items.length <= count) return items;
  const result = [];
  const step = items.length / count;
  for (let i = 0; i < count; i++) {
    result.push(items[Math.floor(i * step + step / 2)]);
  }
  return result;
}

function extractSegment(input, outFile, start, duration, fadeOutDuration) {
  const fade = fadeOutDuration > 0
    ? `,afade=t=out:st=${Math.max(0, duration - fadeOutDuration)}:d=${fadeOutDuration}`
    : "";
  // Reset timestamps by putting -ss and -t before -i so that audio filters like afade align correctly
  const cmd = `ffmpeg -y -ss ${start.toFixed(5)} -t ${duration.toFixed(5)} -i "${input}" -ac 1 -ar 44100 -af "volume=1.0${fade}" "${outFile}"`;
  execSync(cmd);
}

function main() {
  if (!fs.existsSync(sourcePath)) {
    console.error(`Sound source not found: ${sourcePath}`);
    console.error("Set SOUND_SOURCE env var or place the WAV file at the default path.");
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`Analyzing ${sourcePath}...`);
  const segments = detectSegments(sourcePath);
  console.log(`Found ${segments.length} non-silent segments.`);

  if (segments.length === 0) {
    console.error("Could not find any usable keystroke segments.");
    process.exit(1);
  }

  const selected = pickEvenly(segments, Math.max(targetDownCount, targetUpCount));
  const downSegments = selected.slice(0, Math.min(selected.length, targetDownCount));
  const upSegments = selected.slice(0, Math.min(selected.length, targetUpCount));

  const downFiles = [];
  const upFiles = [];

  function makeSample(segment, index, type) {
    const downDur = Math.min(0.12, segment.duration);
    const upDur = Math.min(0.06, segment.duration);
    const fileName = `${type}-${(index + 1).toString().padStart(2, "0")}.wav`;
    const outFile = path.join(outputDir, fileName);

    if (type === "down") {
      extractSegment(sourcePath, outFile, segment.start, downDur, 0.015);
    } else {
      const upStart = Math.max(segment.start, segment.end - upDur);
      extractSegment(sourcePath, outFile, upStart, upDur, 0.03);
    }

    return `sounds/default/${fileName}`;
  }

  console.log(`Generating ${downSegments.length} key-down samples...`);
  downSegments.forEach((seg, i) => downFiles.push(makeSample(seg, i, "down")));

  console.log(`Generating ${upSegments.length} key-up samples...`);
  upSegments.forEach((seg, i) => upFiles.push(makeSample(seg, i, "up")));

  const pack = {
    id: "default",
    name: "Studio Default",
    description: "Processed from a single mechanical keyboard recording into distinct key-down and key-up samples.",
    version: "1.0.0",
    switchType: "mechanical",
    down: downFiles,
    up: upFiles,
    options: {
      pitchVariation: 0.04,
      releaseTone: "bright",
    },
  };

  fs.writeFileSync(path.join(outputDir, "pack.json"), JSON.stringify(pack, null, 2));

  const manifest = [
    {
      id: "default",
      name: "Studio Default",
      description: pack.description,
      path: "/sounds/default/pack.json",
    },
  ];

  fs.writeFileSync(
    path.resolve("public/sounds/sounds.json"),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`Wrote default sound pack to ${outputDir}`);
  console.log(`Wrote manifest to public/sounds/sounds.json`);
}

main();
