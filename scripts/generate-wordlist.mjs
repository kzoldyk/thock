#!/usr/bin/env node
/**
 * Generates lib/data/en-frequency.json — a frequency-ranked English word pool.
 *
 * Sources (downloaded into scripts/.cache on first run):
 *  - first20hours/google-10000-english (no-swears variant): rank-ordered by
 *    corpus frequency, one word per line.
 *  - dwyl/english-words words_alpha.txt: dictionary validity check so no
 *    invented/non-words ever reach the generator.
 *
 * Output format:
 *  { version, generatedAt, count, words: string[] }  // index 0 == rank 1
 */
import { mkdirSync, existsSync, readFileSync, writeFileSync, createWriteStream } from "node:fs"
import { pipeline } from "node:stream/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Readable } from "node:stream"

const __dirname = dirname(fileURLToPath(import.meta.url))
const CACHE = join(__dirname, ".cache")
const OUT_FILE = join(__dirname, "..", "lib", "data", "en-frequency.json")

const G10K_URL =
  "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt"
const DICT_URL =
  "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt"

// Safety net beyond the no-swears source list.
const BLOCKLIST = new Set([
  // profanity / sexual / crude
  "fuck", "fucked", "fucking", "shit", "shits", "shitty", "bitch", "bitches",
  "asshole", "bastard", "cunt", "cunts", "dick", "dicks", "cock", "cocks",
  "pussy", "whore", "slut", "sluts", "wanker", "bollocks", "prick", "twat",
  "nigger", "nigga", "faggot", "fag", "retard", "retarded", "kike", "spic",
  "chink", "wetback", "tranny", "dyke", "gook", "rape", "rapist", "porn",
  "porno", "penis", "vagina", "boob", "boobs", "tit", "tits", "nipple",
  "horny", "horniest", "orgasm", "semen", "ejaculation", "masturbate",
  "damn", "goddamn", "douchebag", "motherfuck", "motherfucker", "blowjob",
  "handjob", "rimjob", "cumshot", "gangbang", "bukkake", "dildo", "anal",

  // Web-corpus artifacts: footer/legal/domain noise that ranks high on the
  // web but nobody types in prose
  "copyright", "sitemap", "newsletter", "subscribe", "http", "https", "www",
  "com", "net", "org", "edu", "gov", "html", "php", "rss", "url", "urls",
  "isbn", "pdf", "jpeg", "gif", "img", "login", "logout", "signup", "homepage",

  // Initialisms & abbreviations
  "ceo", "cfo", "cto", "faq", "aka", "etc", "ie", "eg", "id", "ok",
  "usa", "uk", "un", "eu", "dc", "ny", "nyc", "sf", "la", "tx", "fl",
  "inc", "llc", "corp", "ltd", "plc", "gmbh", "co", "jr", "sr", "est",
  "dept", "univ", "ave", "blvd", "hwy", "rd", "apt", "ste", "po",
  "re", "fw", "cc", "bcc", "attn", "asap", "diy", "fyi", "tbd", "tba",

  // Roman numerals & date/calendar shorthand
  "ii", "iii", "iv", "vi", "vii", "viii", "ix", "xi", "xii", "xiii", "xiv", "xv",
  "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "sept", "oct",
  "nov", "dec", "mon", "tue", "tues", "thu", "thurs", "sat",

  // Citation/Latin fragments
  "al", "ibid", "op", "cit",
])

async function downloadTo(url, dest) {
  if (existsSync(dest)) return
  console.log(`downloading ${url}`)
  const res = await fetch(url)
  if (!res.ok || !res.body) throw new Error(`failed to download ${url}: ${res.status}`)
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest))
}

function loadLines(name) {
  return readFileSync(join(CACHE, name), "utf8")
    .split("\n")
    .map((l) => l.trim().toLowerCase())
    .filter(Boolean)
}

function isValidShape(word) {
  if (!/^[a-z]+$/.test(word)) return false
  if (word.length < 2 || word.length > 12) return false
  if (!/(^|[^a-z])(a|i)([^a-z]|$)/.test(word) && word.length === 1) return false
  if (/([a-z])\1\1/.test(word)) return false // aaa-style runs
  return true
}

async function main() {
  mkdirSync(CACHE, { recursive: true })
  mkdirSync(dirname(OUT_FILE), { recursive: true })

  await downloadTo(G10K_URL, join(CACHE, "g10k.txt"))
  await downloadTo(DICT_URL, join(CACHE, "dict.txt"))

  const ranked = loadLines("g10k.txt")
  const dictionary = new Set(loadLines("dict.txt"))

  const seen = new Set()
  const out = []
  const dropped = { shape: 0, dict: 0, block: 0, dup: 0 }

  for (const word of ranked) {
    if (!isValidShape(word)) {
      dropped.shape++
      continue
    }
    if (!dictionary.has(word)) {
      dropped.dict++
      continue
    }
    if (BLOCKLIST.has(word)) {
      dropped.block++
      continue
    }
    if (seen.has(word)) {
      dropped.dup++
      continue
    }
    seen.add(word)
    out.push(word)
  }

  const payload = {
    version: 1,
    generatedAt: new Date().toISOString().slice(0, 10),
    sources: {
      ranking: "first20hours/google-10000-english (no-swears)",
      validation: "dwyl/english-words words_alpha",
    },
    count: out.length,
    words: out,
  }

  writeFileSync(OUT_FILE, JSON.stringify(payload))

  console.log(`wrote ${out.length} ranked words -> ${OUT_FILE}`)
  console.log(`dropped: ${JSON.stringify(dropped)}`)
  console.log(`top 20: ${out.slice(0, 20).join(" ")}`)
  console.log(`ranks 290-310: ${out.slice(289, 310).join(" ")}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
