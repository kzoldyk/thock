import {
  type UserGripProfile,
  getLetterMasteryStatus,
} from "./letter-grip"

export const commonWords = [
  "mist", "rim", "who", "shell", "stock", "proven", "kink", "hot", "circuit", "blade",
  "soldier", "tax", "projection", "snack", "master", "dinner", "we", "creativity", "jubilee", "shark",
  "better", "wheel", "hound", "building", "toe", "medium", "pose", "crazy", "jaw", "cooking",
  "swell", "exhale", "voyage", "rock", "die", "cancel", "student", "committee", "salmon", "improve",
  "maker", "verse", "receiver", "route", "eager", "now", "quote", "judge", "direct", "knob",
  "tension", "bird", "affect", "cold", "thief", "warrant", "policy", "diver", "scope", "keg",
  "storm", "kin", "week", "radix", "oar", "cry", "civil", "plaque", "pod", "torch",
  "twin", "height", "pity", "squat", "zoning", "globe", "balcony", "boot", "knuckle", "consumption",
  "blink", "severe", "remix", "toast", "warm", "jargon", "rally", "drink", "turkey", "vase",
  "sentence", "special", "yip", "tow", "spill", "authority", "enjoyment", "pub", "scroll", "prefix",
  "snow", "starch", "born", "challenge", "trajectory", "quantity", "celebrate", "dozen", "breathing", "aspect",
  "pixel", "everyone", "bookstore", "killer", "qualm", "plasma", "shrink", "yearn", "recognize", "timber",
  "muscle", "pack", "five", "leader", "chill", "clean", "reside", "blaze", "score", "rap",
  "his", "junk", "seat", "vision", "compound", "galaxy", "want", "hedge", "go", "sum",
  "nod", "had", "token", "invent", "robot", "resemble", "swear", "jealousy", "conduct", "reveal",
  "frost", "scorn", "assignment", "robust", "packing", "rude", "pull", "voter", "max", "four",
  "jog", "misery", "lawyer", "collector", "visage", "fuzzy", "concrete", "afternoon", "copy", "puppet",
  "vanity", "lizard", "capability", "mum", "refuse", "clothes", "modern", "coordinator", "salon", "lot",
  "assistance", "formal", "east", "making", "kettle", "history", "solid", "chest", "retain", "flock",
  "both", "invoke", "bonus", "watchman", "echo", "usage", "union", "favor", "suit", "soft",
  "content", "weaver", "hazy", "quickly", "crater", "killing", "brook", "mile", "lip", "jilt",
  "curved", "horizon", "equate", "control", "sauce", "chalk", "culture", "bread", "summarize", "several",
  "rut", "sharp", "see", "devote", "vital", "meek", "fur", "plane", "bless", "jelly",
  "teacher", "extent", "injury", "connection", "kiln", "ozone", "apartment", "cavern", "carbon", "evolve",
  "hum", "acquire", "constraint", "armor", "sewer", "gentle", "complex", "shower", "choose", "item",
  "rebel", "sixth", "streak", "onyx", "grace", "completely", "slate", "poem", "injection", "elect",
  "element", "write", "neglect", "recover", "rot", "good", "pastel", "vintage", "or", "worker",
  "java", "stove", "major", "pillow", "owl", "creak", "quarry", "rocket", "commission", "pal",
  "hug", "square", "taste", "proverb", "seeker", "brisk", "conference", "rhythm", "pistol", "thickness",
  "scan", "box", "congress", "villa", "invite", "seventeen", "vibe", "extract", "guard", "church",
  "eleven", "seaman", "kept", "pound", "then", "hiker", "topic", "coast", "coin", "eject",
  "contract", "confident", "banker", "width", "vagrant", "amaze", "below", "use", "mouth", "self",
  "duck", "scream", "attractive", "domain", "kiss", "juicy", "kissing", "species", "front", "peek",
  "tariff", "sun", "purple", "mouse", "habit", "smoking", "reply", "chart", "bunker", "not",
  "thistle", "sender", "status", "man", "same", "voucher", "grove", "length", "speaker", "safe",
  "round", "pinch", "retail", "anybody", "criminal", "beyond", "ore", "truck", "banana", "basis",
  "youth", "secure", "flow", "tower", "abuse", "user", "call", "quake", "walking", "prose",
  "ripen", "noble", "aboard", "basic", "coverage", "bay", "behave", "crux", "marker", "grizzly",
  "doubt", "magnet", "elk", "school", "thread", "weaken", "dna", "quark", "except", "walker",
  "torque", "wed", "charge", "violation", "room", "peach", "scratch", "potter", "vest", "closely",
  "quill", "quart", "classroom", "exhaust", "ring", "juror", "feature", "just", "asset", "vividly",
  "waiver", "tag", "lap", "intent", "relate", "fizzy", "pond", "viola", "nap", "recovery",
  "cool", "strap", "law", "volleyball", "envelope", "bone", "thigh", "floor", "citizenship", "inside",
  "spread", "park", "relief", "squash", "club", "automobile", "jerk", "kilogram", "kneel", "anything",
  "writer", "sinking", "shake", "into", "stem", "catch", "gray", "appoint", "report", "start",
  "sugar", "bark", "wedge", "active", "projector", "flank", "extra", "sneeze", "know", "health",
  "food", "fork", "zodiac", "keyboard", "twist", "trapeze", "prize", "rely", "fuzz", "love",
  "cement", "wake", "vixen", "roof", "palm", "governor", "sew", "logic", "contrast", "him",
  "sacred", "stuck", "waterproof", "glaze", "road", "order", "waxy", "glove", "elbow", "ninja",
  "music", "before", "famous", "runner", "approve", "virtual", "calm", "frozen", "cricket", "caution",
  "trouble", "scarf", "exist", "horse", "modest", "did", "correspondent", "record", "pollen", "load",
  "freezer", "conservation", "flour", "comparison", "anymore", "cinema", "census", "consensus", "creature", "cross",
  "favorite", "advance", "network", "dragon", "certainly", "shy", "restore", "dazzle", "risen", "weak",
  "annual", "flood", "permit", "classify", "retrieve", "yea", "comprehensive", "darkness", "crush", "quay",
  "closet", "branch", "check", "closest", "virgin", "ignore", "living", "senate", "woe", "beside",
  "added", "truth", "cushion", "weep", "cake", "uncle", "power", "age", "expend", "rover",
  "injure", "green", "believe", "tidy", "automatic", "diverse", "triangle", "counseling", "reflex", "shift",
  "skin", "joking", "cat", "dreadlocks", "sod", "behavior", "feet", "media", "surface", "travel",
  "advise", "dove", "pop", "packet", "pro", "rascal", "spy", "my", "sneak", "derive",
  "factor", "vat", "revenue", "sky", "dirt", "compete", "excess", "sculpt", "pajama", "goat",
  "slide", "quiche", "cup", "boil", "quirk", "click", "human", "future", "spa", "sphere",
  "cream", "yoke", "climate", "might", "twilight", "straw", "calculate", "jumper", "wedding", "estate",
  "punish", "empire", "spring", "create", "already", "parking", "conversation", "grape", "crack", "bold",
  "trash", "insect", "demand", "government", "judicial", "point", "bloom", "tennis", "bind", "year",
  "cooperate", "steep", "villain", "pair", "academy", "top", "jumbo", "zealous", "exit", "visitor",
  "able", "bedroom", "jewelry", "its", "class", "whistle", "accompany", "log", "squint", "sip",
  "welfare", "concentrate", "juggle", "depend", "sample", "drain", "fellow", "look", "sack", "peg",
  "lucky", "sector", "donkey", "time", "classical", "forgiven", "appointment", "differ", "metal", "variety",
  "blind", "tab", "reckon", "appeal", "keeping", "animal", "censor", "declare", "tide", "juggler",
  "campaign", "swim", "alone", "mature", "kid", "nozzle", "resolve", "clique", "profit", "competitive",
  "ask", "stare", "devotion", "axe", "salad", "apply", "jiffy", "civilization", "concerned", "base",
  "removal", "line", "rider", "listen", "credit", "bomb", "fact", "black", "rival", "atmosphere",
  "origin", "humor", "draft", "grid", "clash", "sleep", "excel", "sly", "vowel", "oxygen",
  "buy", "customer", "remind", "idea", "odd", "silver", "comfort", "picker", "spike", "risky",
  "assign", "riot", "fair", "vim", "blend", "benchmark", "rotate", "rage", "stair", "flux",
  "advocate", "cove", "buzz", "terrible", "song", "drive", "against", "costume", "remote", "street",
  "bolt", "bow", "exalt", "sister", "triumph", "suffix", "hope", "qualify", "assault", "cab",
  "buyer", "petrol", "note", "son", "cloud", "scar", "stitch", "egg", "queue", "assist",
  "critical", "oblige", "indeed", "competitor", "between", "consent", "north", "binary", "vicar", "coal",
  "slack", "stump", "cloth", "movie", "junction", "miss", "ego", "latex", "saddle", "join",
  "tender", "optimize", "either", "wide", "and", "verdict", "option", "mixer", "native", "fever",
  "circulate", "way", "varnish", "bravo", "tragedy", "vibrant", "wave", "cable", "sparkle", "broadcast",
  "gross", "tailor", "liquor", "contest", "border", "ripple", "sue", "pick", "panel", "wax",
  "ice", "bureau", "brother", "gum", "sag", "shrub", "avoidance", "wrong", "curl", "rub",
  "desire", "upright", "trial", "quick", "circus", "cognitive", "seizure", "unique", "angle", "via",
  "general", "told", "jar", "tent", "cohort", "yin", "chunky", "lamp", "craze", "servant",
  "attack", "adjust", "sheet", "address", "threat", "cater", "polish", "noun", "tonic", "tooth",
  "accurate", "guest", "benefit", "flesh", "bean", "duke", "pupil", "brave", "upward", "brief",
  "rag", "weary", "shawl", "can", "absorb", "locker", "bounce", "spoken", "jazz", "airline",
  "mom", "peasant", "add", "text", "scene", "snake", "tusk", "bulk", "axon", "knelt",
  "circumstance", "poetry", "afraid", "liking", "account", "normal", "mosque", "equalize", "jellyfish", "terror",
  "adapt", "cousin", "clothing", "commercial", "spoon", "surgeon", "viscount", "tin", "seeking", "oxide",
  "query", "suspect", "polite", "scarce", "plank", "consume", "recipe", "optics", "division", "mental",
  "arm", "screen", "variable", "vortex", "wafer", "mercy", "mask", "nervous", "wait", "jumble",
  "zombie", "artistic", "ball", "jury", "lookup", "sketch", "safety", "speck", "sensor", "market",
  "joke", "texture", "robin", "prevail", "silence", "cruel", "moon", "chain", "baker", "agreement",
  "guide", "very", "thinking", "shield", "curve", "rectory", "visual", "shadow", "row", "am",
  "tact", "daily", "post", "coax", "hear", "zeal", "aim", "camp", "adventure", "inform",
  "slavery", "connect", "venue", "resort", "emphasize", "myself", "lord", "review", "majority", "hover",
  "bakery", "wit", "squad", "robber", "linking", "jingle", "gather", "hold", "detail", "concert",
  "impose", "vouch", "chunk", "zone", "warrior", "beach", "splash", "ran", "puddle", "patent",
  "pilot", "region", "have", "socket", "children", "curious", "opt", "confidence", "hurry", "arrival",
  "squirm", "naked", "bravery", "narrow", "peace", "loose", "obtain", "sediment", "shaft", "courier",
  "marvel", "cook", "job", "checkpoint", "puzzle", "contribute", "alarm", "proxy", "train", "comedy",
  "workshop", "alike", "over", "vapor", "commonly", "pole", "article", "jersey", "charter", "odor",
  "swallow", "separate", "puppy", "task", "mortar", "concentration", "fierce", "slight", "kitten", "analyst",
  "communication", "pearl", "province", "inner", "vet", "parent", "middle", "jailer", "evil", "bottle",
  "jig", "trend", "income", "lesson", "sleek", "ugly", "sergeant", "coffee", "random", "roam",
  "volt", "land", "turban", "blow", "tramp", "convention", "revive", "phrase", "real", "silky",
  "winter", "jovial", "fabric", "almost", "waterfall", "stalk", "prove", "yet", "anyone", "yolk",
  "tool", "tread", "marble", "naval", "resource", "counsel", "accent", "shore", "sulfur", "ladder",
  "improvement", "lad", "argument", "access", "window", "thorough", "celebration", "besides", "custom", "sailor",
  "starve", "victim", "butter", "surround", "glory", "exploit", "marketing", "little", "spray", "scholar",
  "kicking", "test", "contribution", "swing", "copper", "gap", "ratio", "gel", "energy", "consist",
  "summer", "haze", "flame", "devil", "jealous", "net", "gain", "shock", "equity", "capture",
  "letter", "yes", "wall", "spirit", "revival", "champion", "remain", "creative", "picnic", "also",
  "grain", "cooperative", "journal", "necklace", "meal", "zig", "javelin", "too", "chop", "cattle",
  "consumer", "bloody", "bucket", "gold", "thank", "garlic", "wish", "body", "day", "consultant",
  "driver", "unknown", "junker", "compel", "request", "toxin", "fresh", "breast", "since", "engine",
  "moral", "slave", "ski", "rye", "rubble", "pulse", "chief", "steak", "bleak", "bulb",
  "strike", "although", "drake", "shelter", "cozy", "track", "carefully", "rubber", "issue", "deliver",
  "exact", "summon", "muzzle", "conform", "freak", "novelty", "attorney", "privilege", "phase", "boundary",
  "reflect", "no", "horizontal", "counterpart", "undergo", "trust", "vigor", "yeast", "make", "rupee",
  "driveway", "eat", "count", "trace", "pat", "teaspoon", "helmet", "dance", "jolt", "island",
  "bishop", "back", "hunger", "vessel", "category", "valuable", "finger", "repeat", "continent", "firm",
  "tell", "navy", "jogging", "trance", "pickle", "treasure", "rare", "bowl", "mirror", "jew",
  "type", "banking", "veteran", "parson", "turtle", "zigzag", "fear", "minimize", "broken", "cleaner",
  "war", "eight", "cardiac", "velocity", "container", "equip", "deep", "vibrate", "survivor", "mutton",
  "builder", "delivery", "attribute", "chew", "zipper", "right", "background", "tea", "intend", "ballet",
  "relative", "gun", "bachelor", "typewriter", "but", "violet", "savings", "strain", "grass", "accomplish",
  "elm", "attach", "mixture", "dawn", "beautiful", "expose", "vague", "trigger", "van", "resist",
  "blood", "reserve", "tight", "joy", "umbrella", "help", "rash", "guess", "bore", "correct",
  "fist", "term", "two", "fox", "boss", "broke", "kidney", "thy", "hub", "alliance",
  "heavily", "envy", "regret", "authorize", "city", "oil", "outlet", "mark", "burden", "group",
  "commander", "consult", "across", "kit", "oasis", "adequate", "sheriff", "mother", "board", "advantage",
  "quoth", "pit", "lava", "thumb", "trumpet", "first", "stable", "shaking", "criticism", "beginning",
  "joyful", "clan", "kinky", "change", "here", "shatter", "expire", "alternative", "knife", "correctly",
  "consideration", "viper", "thrift", "quip", "shed", "journalist", "package", "gift", "award", "turf",
  "kilo", "royal", "milk", "rest", "corporation", "basically", "aggressive", "tribute", "volume", "cabin",
  "mix", "dollar", "weekday", "skillful", "jail", "press", "saucer", "raid", "locate", "tip",
  "begin", "sport", "reverse", "fault", "mean", "channel", "movement", "council", "skilled", "menu",
  "ram", "it", "study", "casino", "cargo", "clever", "crime", "voice", "depth", "checkout",
  "tobacco", "axis", "sealed", "pup", "ape", "maximum", "do", "apparently", "won", "forest",
  "drove", "double", "vine", "icon", "snatch", "mat", "arena", "piece", "magic", "crust",
  "device", "breed", "stumble", "roost", "beast", "behind", "rat", "proper", "milky", "ceiling",
  "pizza", "lean", "chemistry", "feather", "past", "waking", "curiosity", "jut", "cling", "attitude",
  "quality", "wrist", "smile", "trade", "lemon", "commitment", "characterize", "vitamin", "knight", "proximity",
  "index", "seek", "puke", "their", "stroke", "night", "scorch", "super", "bin", "version",
  "valid", "crucial", "fit", "average", "ahead", "tavern", "leg", "powder", "thick", "pastor",
  "cynical", "terminal", "agree", "be", "collapse", "kidnap", "stamp", "fizz", "journey", "jungle",
  "tank", "welcome", "clue", "drawer", "when", "cactus", "desert", "jumpy", "stake", "complain",
  "bookmark", "joint", "candy", "spin", "aloud", "capital", "yacht", "read", "pan", "banjo",
  "cheese", "company", "quizzes", "kindness", "any", "assume", "dip", "until", "waste", "rocky",
  "leather", "jolly", "deceive", "blanket", "spoke", "tube", "laugh", "success", "gaze", "dye",
  "torrent", "pun", "yap", "chocolate", "liver", "achieve", "solve", "voyager", "tub", "deejay",
  "people", "sake", "conservative", "sap", "to", "championship", "steam", "apologize", "built", "scary",
  "weekend", "salt", "victory", "coincide", "pea", "wizard", "strip", "classic", "semicolon", "boxing",
  "constantly", "packaging", "villager", "set", "relay", "face", "voting", "regard", "chair", "visualize",
  "adjourn", "chapter", "title", "kill", "crop", "output", "exotic", "tackle", "senior", "maximize",
  "lay", "beg", "eye", "core", "courtroom", "online", "boom", "escape", "child", "lake",
  "onion", "wolf", "sink", "willow", "concern", "rail", "method", "continue", "jukebox", "foster",
  "bad", "cohesion", "raw", "taxing", "virus", "devoid", "broad", "video", "cottage", "conclusion",
  "counter", "mad", "jockey", "explore", "columnist", "oval", "stiff", "author", "small", "clay",
  "tracking", "capacity", "corn", "gut", "switch", "mud", "arrangement", "side", "lab", "junta",
  "dive", "rust", "maze", "knack", "vegetable", "member", "step", "modify", "bag", "chemical",
  "avoid", "nylon", "rudder", "money", "knowing", "large", "dam", "new", "agency", "steer",
  "ply", "vendor", "whiz", "utensil", "traffic", "melody", "subway", "found", "rogue", "oven",
  "shiver", "realize", "drum", "talk", "occur", "kiwi", "respond", "boring", "scissors", "screw",
  "rampart", "sincere", "palace", "path", "widow", "orange", "short", "blizzard", "pavement", "enjoyable",
  "nomad", "visible", "scale", "hi", "all", "effort", "considerable", "fence", "quilt", "viral",
  "angry", "objection", "compensate", "her", "universe", "rough", "true", "cellular", "characteristic", "wisdom",
  "sheep", "lever", "picking", "unless", "western", "soon", "kitty", "segment", "month", "cost",
  "trench", "web", "tissue", "useless", "carry", "rotor", "stretch", "fall", "jewel", "army",
  "graph", "gender", "agenda", "sail", "client", "match", "attract", "conflict", "awaken", "hue",
  "next", "jazzy", "shine", "bit", "link", "beauty", "us", "of", "soak", "baking",
  "verge", "last", "icy", "stain", "excite", "neat", "danger", "combat", "junior", "radar",
  "stocking", "bouquet", "follow", "canal", "excuse", "jam", "bob", "biology", "autumn", "nurse",
  "death", "clinical", "commentary", "some", "judiciary", "pink", "ambition", "cookie", "fixture", "belt",
  "quack", "taxi", "ship", "enemy", "woman", "complaint", "actual", "ban", "poet", "thorn",
  "forgive", "friend", "chance", "sad", "attention", "sob", "wee", "fly", "divorce", "shear",
  "revise", "gas", "vain", "throat", "basket", "looking", "hazard", "renew", "map", "grand",
  "vassal", "saver", "live", "awareness", "vivid", "pause", "chairman", "ability", "textile", "collar",
  "list", "sojourn", "statue", "reward", "fry", "extend", "survival", "threshold", "village", "weakness",
  "remedy", "ride", "oblique", "a", "elder", "scythe", "casual", "explode", "compute", "tar",
  "hero", "drift", "touch", "move", "band", "birds", "leave", "cease", "outset", "bubble",
  "root", "disjoint", "vocation", "crew", "braking", "beak", "leverage", "rescue", "whisper", "will",
  "pique", "bring", "swan", "opaque", "invest", "briefly", "tongue", "overcome", "cell", "belief",
  "joyous", "remark", "speak", "accident", "along", "about", "private", "burst", "bulky", "subject",
  "boat", "equal", "continued", "close", "walk", "exile", "pedal", "quarrel", "motivate", "reservation",
  "bet", "graze", "symbol", "folder", "computer", "prince", "barrier", "run", "cliff", "dust",
  "sedan", "circular", "knot", "god", "put", "caption", "hook", "venture", "cover", "stool",
  "cooperation", "chronic", "bleed", "bed", "cow", "fat", "crash", "bunk", "edge", "laser",
  "life", "utility", "correspondence", "jug", "matrix", "anyway", "talking", "prefer", "camera", "boy",
  "apple", "comment", "white", "girl", "degree", "current", "other", "vomit", "colleague", "target",
  "string", "belong", "contemporary", "arrive", "due", "accept", "athlete", "airport", "meadow", "margin",
  "contain", "mob", "waive", "vice", "analyze", "few", "knew", "brush", "praise", "announce",
  "bacteria", "confront", "tiger", "pad", "associate", "basketball", "every", "police", "common", "salute",
  "open", "clear", "orchard", "starvation", "vacuum", "king", "clove", "consciousness", "six", "cluster",
  "arc", "ocean", "clip", "piston", "abandon", "deserve", "form", "jinx", "got", "lover",
  "involvement", "being", "junkie", "dew", "vow", "upset", "adjacent", "antique", "label", "wind",
  "grow", "cord", "assistant", "tray", "usual", "treble", "crank", "sop", "oat", "kennel",
  "complement", "certain", "orbit", "territory", "castle", "most", "town", "enough", "clinic", "flask",
  "carrier", "saloon", "hiking", "hen", "conclude", "cultural", "drill", "succeed", "nil", "well",
  "visit", "swamp", "secret", "ancient", "sea", "center", "vial", "bored", "colonial", "abstract",
  "wager", "risk", "them", "suite", "alive", "bitter", "stand", "jogger", "ten", "tie",
  "criteria", "around", "according", "gem", "sequel", "range", "science", "sermon", "velvet", "repair",
  "appear", "expand", "breathe", "battle", "savage", "focus", "yaw", "convince", "figure", "tutor",
  "quartz", "stone", "combine", "yew", "artist", "quota", "quiver", "still", "away", "light",
  "abundance", "pet", "dim", "farmer", "deal", "commerce", "lower", "motive", "fed", "stomach",
  "compliance", "organ", "cage", "jacket", "acid", "module", "carpet", "daze", "these", "curtain",
  "cute", "reduce", "chamber", "cheek", "symbolize", "irksome", "potato", "pie", "controversial", "surprise",
  "require", "valor", "rid", "build", "button", "venom", "quest", "ivy", "fix", "shape",
  "safari", "sound", "he", "in", "tricky", "hobby", "hit", "fee", "otter", "memory",
  "invention", "final", "bronze", "dark", "prime", "loyal", "slice", "empty", "panic", "drop",
  "dad", "hike", "asking", "sat", "romance", "court", "bicycle", "guy", "code", "zoom",
  "swift", "care", "wool", "contractor", "cigarette", "baby", "pay", "get", "jest", "bush",
  "seize", "cajole", "approximate", "afford", "captain", "tenant", "strive", "recent", "zest", "assess",
  "character", "wheat", "only", "knit", "red", "rave", "loser", "sheaf", "vogue", "objective",
  "feast", "quit", "fixed", "pin", "search", "tune", "staff", "met", "heavy", "head",
  "cough", "parish", "cholesterol", "ham", "door", "rainbow", "bullet", "survive", "cubic", "combination",
  "tumor", "smart", "become", "visor", "valley", "crude", "trap", "aircraft", "visa", "ink",
  "smooth", "beam", "aware", "vector", "exhibit", "yard", "coordinate", "early", "pluck", "attend",
  "lit", "anxiety", "forty", "sandal", "rivalry", "criterion", "razor", "embark", "inquire", "cabinet",
  "bus", "latter", "warning", "kick", "signal", "admit", "construct", "fog", "bend", "garden",
  "investment", "hut", "try", "commissioner", "cemetery", "fish", "choke", "respect", "towel", "burn",
  "hid", "worm", "climb", "veil", "urn", "hip", "expert", "clearly", "hurt", "event",
  "sign", "wardrobe", "creek", "single", "rejoice", "than", "bid", "marine", "prevent", "cheat",
  "tumble", "bank", "tap", "awful", "forget", "accuse", "cradle", "violence", "like", "scoop",
  "advice", "known", "crowd", "loud", "bury", "blank", "teach", "pot", "father", "pitch",
  "crisis", "sponge", "faze", "volatile", "striking", "today", "refuge", "candle", "ranking", "communicate",
  "backup", "voiced", "theory", "porter", "brilliant", "apex", "civic", "seldom", "survey", "void",
  "shove", "collect", "dug", "ever", "nephew", "den", "resume", "cloudy", "grief", "coach",
  "stay", "pork", "clock", "eagle", "shrug", "pig", "there", "best", "vote", "noise",
  "yam", "float", "wavy", "at", "trick", "conventional", "bar", "constant", "ill", "cure",
  "service", "activity", "area", "structure", "blazer", "bill", "boxer", "act", "roar", "let",
  "easy", "skull", "clerk", "carve", "tile", "buck", "adverb", "courage", "skirt", "anticipate",
  "handle", "long", "wicked", "activist", "traveler", "sticky", "thirsty", "art", "silent", "what",
  "cruise", "craft", "brown", "rush", "reject", "corrupt", "terrace", "stanza", "preserve", "support",
  "merit", "rabbit", "lax", "versus", "the", "our", "appearance", "knowledge", "cloak", "from",
  "level", "saw", "valve", "mount", "occupy", "zap", "bake", "lively", "think", "series",
  "spot", "appropriate", "agricultural", "skill", "league", "course", "air", "treason", "breezy", "prank",
  "country", "trophy", "tense", "novel", "silk", "understand", "turn", "rumor", "blue", "quantum",
  "approval", "controversy", "beloved", "import", "shook", "vitality", "bite", "medal", "banner", "business",
  "jeopardy", "editor", "allow", "project", "delay", "thanks", "peanut", "correspond", "ruler", "space",
  "person", "shave", "subtle", "quench", "flower", "vigorous", "deck", "weapon", "faith", "gauge",
  "rod", "choice", "plow", "rope", "summit", "buzzer", "composition", "pencil", "lock", "race",
  "size", "plan", "hill", "trowel", "blockage", "felt", "sheath", "could", "confusion", "dream",
  "jester", "impact", "husk", "couple", "tropical", "juvenile", "enter", "loving", "giant", "fiber",
  "hay", "wild", "block", "honor", "action", "arrest", "catalog", "jet", "yield", "cheap",
  "kindly", "mesh", "priest", "tan", "rifle", "needle", "correlation", "bother", "fig", "rug",
  "suggest", "quell", "dock", "ruin", "fill", "place", "tribe", "violin", "stick", "input",
  "victor", "consequence", "violate", "computing", "consistent", "liquid", "vacant", "exempt", "coastal", "garage",
  "hardly", "duty", "crowded", "rip", "condition", "swarm", "brass", "juncture", "heat", "among",
  "measure", "wilderness", "export", "ash", "vex", "win", "pen", "bug", "dense", "schema",
  "remove", "whiskey", "arrange", "thunder", "tug", "high", "amount", "approach", "veto", "automatically",
  "squeeze", "assure", "wonder", "utter", "faint", "exam", "corridor", "dear", "easily", "once",
  "uproar", "jupiter", "roast", "monkey", "harvest", "drinking", "complexity", "county", "commit", "talent",
  "tomb", "compose", "treaty", "dog", "world", "reef", "sit", "struggle", "plate", "session",
  "big", "wow", "bog", "routine", "hat", "sock", "keynote", "pump", "up", "free",
  "bud", "command", "raft", "sizzle", "for", "vulnerable", "justify", "meet", "find", "mule",
  "paper", "cause", "planet", "college", "foxes", "seventh", "thimble", "which", "vast", "troop",
  "sensation", "haven", "bye", "hive", "joiner", "heart", "anniversary", "reed", "young", "yarn",
  "even", "render", "analysis", "judgment", "celebrity", "clarity", "compile", "water", "peak", "hop",
  "trail", "one", "advanced", "full", "breeze", "key", "charm", "actress", "morning", "urgent",
  "rejection", "hem", "folk", "pave", "waver", "gave", "virtue", "quail", "settle", "neck",
  "childhood", "may", "revenge", "contact", "niece", "studio", "game", "scout", "replace", "scalp",
  "olive", "leak", "critique", "plaster", "rib", "prayer", "provide", "breaking", "oxen", "play",
  "kind", "roller", "doc", "uniform", "paw", "throne", "low", "answer", "billion", "serial",
  "custody", "lid", "expect", "working", "reform", "pardon", "umpire", "attempt", "marry", "construction",
  "arise", "absence", "central", "offer", "cast", "zinc", "honey", "mutual", "convenience", "mug",
  "cash", "labor", "urban", "damage", "couch", "categorize", "audience", "campus", "aid", "men",
  "budget", "tortoise", "smoke", "yellow", "invitation", "keeper", "beneath", "thermometer", "awake", "prison",
  "hawk", "sword", "shelf", "took", "reign", "happen", "constitutional", "agent", "seven", "tenor",
  "zip", "great", "fake", "weekly", "context", "retire", "hand", "spark", "asleep", "conquer",
  "chase", "ridge", "usher", "competition", "faster", "violent", "borrow", "hourly", "absurd", "creation",
  "motion", "above", "community", "concept", "chicken", "ox", "twinkle", "birthday", "candidate", "slope",
  "saving", "extreme", "civilian", "worship", "vault", "why", "rule", "tyrant", "syntax", "balloon",
  "quiz", "conviction", "ticket", "an", "confirm", "was", "taking", "sleeve", "inn", "infant",
  "avenue", "skinny", "barking", "retreat", "gravel", "state", "calendar", "kindle", "hazardous", "cancer",
  "citizen", "scatter", "temper", "salvation", "zero", "watch", "rigid", "vulture", "zircon", "vanish",
  "crawl", "museum", "argue", "shovel", "proud", "eve", "lonely", "weight", "express", "desk",
  "plenty", "grade", "factory", "bright", "available", "paint", "slick", "script", "tunnel", "brick",
  "constitute", "patrol", "viewer", "decide", "viable", "bat", "old", "on", "launch", "ballot",
  "waffle", "ounce", "bee", "component", "likely", "with", "meteor", "because", "treat", "seller",
  "book", "if", "rental", "that", "lead", "quasar", "ruby", "criticize", "corruption", "spice",
  "century", "kicker", "apparent", "amazing", "entire", "parcel", "biological", "ground", "traitor", "sweat",
  "bottom", "luxury", "work", "unusual", "stream", "crystal", "organize", "spine", "taken", "exert",
  "end", "often", "urge", "savior", "breakfast", "me", "toxic", "cigar", "card", "knock",
  "wander", "return", "wet", "conception", "adjoin", "say", "case", "view", "manage", "ant",
  "coat", "after", "pigeon", "cheer", "brand", "object", "source", "bond", "quad", "sandals",
  "star", "shallow", "sweet", "glow", "actually", "locking", "thing", "ankle", "stress", "vary",
  "tail", "flash", "result", "receive", "consider", "countryside", "river", "zebra", "evolution", "wooden",
  "backward", "take", "nut", "blast", "season", "serpent", "pirate", "under", "frequent", "volunteer",
  "delight", "sequence", "off", "relieve", "mop", "currently", "laptop", "baseball", "tulip", "truce",
  "stage", "banquet", "overall", "kite", "acoustic", "show", "give", "melon", "dexter", "lunch",
  "waist", "pocket", "crook", "dig", "ceremony", "column", "has", "flight", "cube", "vigil",
  "system", "colony", "athletic", "dress", "alcohol", "matter", "doctor", "breakdown", "vibration", "kingdom",
  "capable", "dry", "how", "harbor", "volcano", "ranch", "come", "lie", "rustic", "plant",
  "arrow", "cave", "useful", "novelist", "table", "conscious", "flavor", "waggon", "queen", "thrust",
  "boost", "far", "trout", "female", "again", "cupboard", "adult", "divide", "vein", "seventy",
  "fine", "flex", "share", "canvas", "chaos", "keen", "wick", "insist", "solvent", "ribbon",
  "store", "sin", "earth", "huge", "govern", "wound", "vertical", "another", "sax", "collection",
  "horror", "aside", "breath", "filter", "rural", "orb", "booking", "quaint", "utilize", "compromise",
  "scold", "kilometer", "by", "drizzle", "never", "zephyr", "shame", "involve", "mid", "vulgar",
  "hard", "smell", "jigsaw", "bundle", "initialize", "guilt", "valiant", "curriculum", "subjection", "walnut",
  "gravity", "anywhere", "jocular", "parrot", "serve", "buzzing", "oak", "continuous", "costly", "crave",
  "glance", "nexus", "lodge", "affair", "biography", "beat", "enjoy", "cork", "quarter", "sandy",
  "freeze", "unix", "gin", "led", "inject", "bench", "done", "cap", "unit", "frame",
  "this", "nerve", "vehicle", "sub", "boast", "architect", "shocking", "jeans", "flexible", "patron",
  "revelation", "coalition", "toy", "everything", "flake", "supply", "pebble", "nave", "appreciate", "quite",
  "weather", "tractor", "workout", "voltage", "speaking", "dot", "compensation", "simple", "rose", "piazza",
  "various", "second", "evening", "exceed", "so", "learn", "knee", "countless", "ravine", "fun",
  "color", "wig", "jay", "skip", "drown", "commodity", "gym", "turnip", "plaza", "disk",
  "chord", "counselor", "assessment", "prompt", "evidence", "hidden", "circle", "sure", "ago", "luck",
  "explain", "vinegar", "home", "period", "assumption", "jeep", "advertising", "darken", "career", "ton",
  "stuff", "auto", "willing", "keep", "own", "radius", "shaggy", "savvy", "brain", "complete",
  "squid", "sow", "creator", "soy", "entry", "pepper", "comfortable", "collective", "birth", "station",
  "warfare", "scrape", "balance", "sir", "album", "design", "need", "beard", "juke", "poison",
  "rattle", "crown", "blocking", "kitchen", "battery", "fan", "sixty", "throng", "field", "explicit",
  "story", "former", "they", "receipt", "hoax", "collaboration", "blossom", "temple", "you", "geek",
  "continuing", "select", "is", "ray", "would", "yak", "opera", "rapid", "grave", "bound",
  "assert", "rob", "blame", "quiet", "glass", "your", "relax", "fast", "rank", "marvelous",
  "public", "juice", "always", "association", "trunk", "spider", "justice", "chef", "chimney", "parade",
  "elevation", "total", "pivot", "finish", "adopt", "era", "jump", "nor", "poodle", "wreck",
  "stop", "she", "fruit", "dish", "poster", "tee", "bunch", "sweep", "scent", "orphan",
  "oyster", "woo", "critic", "compare", "strand", "cotton", "charity", "as", "navigate", "out",
  "local", "marking", "saint", "careful", "car", "complicated", "ear", "corporate", "bridge", "break",
  "corner", "cart", "application", "refund", "vocal", "team", "joker", "image", "neutral", "cycle",
  "zen", "dusk", "convert", "busy", "actor", "craving", "frank", "house", "nature", "anger",
  "zenith", "closer", "scrub", "chip", "reach", "bracket", "claim", "salary", "save", "guitar",
  "cut", "ion", "collaborate", "clone", "bear", "portal", "verify", "nest", "speech", "clover",
  "genius", "jasper", "zoo", "radiant", "mind", "mineral", "monk", "manner", "fossil", "hotel",
  "punch", "steel", "clarify", "cider",
]

/**
 * Fast 26-bit letter bitmask generator for words.
 */
export function wordToBitmask(word: string): number {
  let mask = 0
  const lower = word.toLowerCase()
  for (let i = 0; i < lower.length; i++) {
    const code = lower.charCodeAt(i) - 97
    if (code >= 0 && code < 26) {
      mask |= (1 << code)
    }
  }
  return mask
}

/**
 * Fast 26-bit letter bitmask generator for character arrays.
 */
export function charsToBitmask(chars: string[]): number {
  let mask = 0
  for (const ch of chars) {
    const code = ch.toLowerCase().charCodeAt(0) - 97
    if (code >= 0 && code < 26) {
      mask |= (1 << code)
    }
  }
  return mask
}

// Pre-computed bitmasks for instant O(1) bitwise anagram/subset evaluation
const WORD_BITMASKS: Map<string, number> = new Map()
for (const w of commonWords) {
  WORD_BITMASKS.set(w, wordToBitmask(w))
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickUniqueWords(
  pool: string[],
  fallbackPool: string[],
  count: number,
  seed: number
): string[] {
  if (pool.length === 0 && fallbackPool.length === 0) return []
  const rng = mulberry32(seed)
  const result: string[] = []
  const used = new Set<string>()

  // 1. Shuffle primary pool
  const poolCopy = [...pool]
  for (let i = poolCopy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [poolCopy[i], poolCopy[j]] = [poolCopy[j], poolCopy[i]]
  }

  for (let i = 0; i < poolCopy.length; i++) {
    const word = poolCopy[i]
    if (!used.has(word)) {
      used.add(word)
      result.push(word)
      if (result.length >= count) break
    }
  }

  // 2. If pool didn't have enough unique words, fill from fallback pool
  if (result.length < count) {
    const fallbackCopy = [...fallbackPool]
    for (let i = fallbackCopy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [fallbackCopy[i], fallbackCopy[j]] = [fallbackCopy[j], fallbackCopy[i]]
    }
    for (let i = 0; i < fallbackCopy.length; i++) {
      const word = fallbackCopy[i]
      if (!used.has(word)) {
        used.add(word)
        result.push(word)
        if (result.length >= count) break
      }
    }
  }

  // 3. Final shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }

  return result
}

function applyComplexity(words: string[], seed: number): string[] {
  const rng = mulberry32(seed)

  return words.map((word) => {
    let newWord = word
    const r = rng()

    // 1. Capitalization (caps & smalls)
    if (r < 0.25) {
      newWord = newWord.charAt(0).toUpperCase() + newWord.slice(1)
    } else if (r < 0.35) {
      newWord = newWord.toUpperCase()
    } else if (r < 0.45) {
      newWord = newWord.split("").map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase())).join("")
    }

    // 2. Symbols and proper symbols
    const rSym = rng()
    if (rSym < 0.15) {
      const puncs = [".", ",", "?", "!", ";", ":"]
      const punc = puncs[Math.floor(rng() * puncs.length)]
      newWord = newWord + punc
    } else if (rSym < 0.25) {
      const wraps = [["(", ")"], ["[", "]"], ["{", "}"], ["\"", "\""], ["'", "'"]]
      const wrap = wraps[Math.floor(rng() * wraps.length)]
      newWord = wrap[0] + newWord + wrap[1]
    } else if (rSym < 0.35) {
      const symbols = ["@", "#", "$", "%", "^", "&", "*", "-", "_", "+", "=", "|", "/", "\\"]
      const sym = symbols[Math.floor(rng() * symbols.length)]
      if (rng() < 0.5) {
        newWord = sym + newWord
      } else {
        newWord = newWord + sym
      }
    }

    return newWord
  })
}

export function generateWords(count: number = 30, seed?: number, complex: boolean = false): string[] {
  const words = pickUniqueWords(commonWords, commonWords, count, seed ?? 42)
  if (!complex) return words
  return applyComplexity(words, seed ?? 42)
}

export interface AdaptiveWordOptions {
  gripProfile?: UserGripProfile | null
  testCount?: number
  seed?: number
  complex?: boolean
}

/**
 * Generates words implementing the Progressive Letter Mastery Strategy:
 * 1. For the first 10 typings (testCount < 10):
 *    - 100% of words are composed of familiar, comfortable natural English words.
 *    - Tricky letters are excluded, maintaining high WPM, high accuracy, and natural confidence.
 *    - 100% unique words (no repeating identical words in a single test).
 * 2. After 10 typings (testCount >= 10):
 *    - Identifies exactly ONE targeted uncomfortable letter from user weaknesses.
 *    - Smoothly injects 1-2 targeted natural common words containing that letter.
 *    - The remaining >=90% of words are comfortable words.
 *    - Once the user achieves proficiency (>=90% accuracy), it graduates and the next letter is queued.
 */
export function generateAdaptiveWords(
  count: number = 30,
  options: AdaptiveWordOptions = {}
): string[] {
  const {
    gripProfile,
    testCount = 0,
    seed = Date.now(),
    complex = false,
  } = options

  const { comfortableLetters, targetLetter, isInitialComfortPhase } = getLetterMasteryStatus(
    gripProfile,
    testCount
  )

  const comfortableMask = charsToBitmask(comfortableLetters)

  // 1. Find pure comfortable words (words containing ONLY comfortable letters)
  const comfortableWords: string[] = []
  for (let i = 0; i < commonWords.length; i++) {
    const word = commonWords[i]
    const mask = WORD_BITMASKS.get(word) || wordToBitmask(word)
    if ((mask & ~comfortableMask) === 0) {
      comfortableWords.push(word)
    }
  }

  // Phase 1: First 10 typings or no target letter -> 100% comfortable unique words
  if (isInitialComfortPhase || !targetLetter) {
    const picked = pickUniqueWords(comfortableWords, commonWords, count, seed)
    if (!complex) return picked
    return applyComplexity(picked, seed)
  }

  // Phase 2: After 10 typings -> inject ONE targeted uncomfortable letter
  const targetCode = targetLetter.toLowerCase().charCodeAt(0) - 97
  const targetBit = 1 << targetCode
  const allowedWithTargetMask = comfortableMask | targetBit

  // Find targeted words that contain targetLetter AND where other letters are comfortable
  const targetedWords: string[] = []
  for (let i = 0; i < commonWords.length; i++) {
    const word = commonWords[i]
    const mask = WORD_BITMASKS.get(word) || wordToBitmask(word)
    if ((mask & targetBit) !== 0 && (mask & ~allowedWithTargetMask) === 0) {
      targetedWords.push(word)
    }
  }

  const fallbackTargetPool = commonWords.filter((w) => w.toLowerCase().includes(targetLetter))
  const targetPool = targetedWords.length > 0 ? targetedWords : fallbackTargetPool

  if (targetPool.length === 0) {
    const picked = pickUniqueWords(comfortableWords, commonWords, count, seed)
    if (!complex) return picked
    return applyComplexity(picked, seed)
  }

  // Target drill word count: 1-2 words for standard sessions, 3-5 for long sessions
  const targetDrillCount = Math.max(1, Math.min(6, Math.round(count * 0.05)))
  const comfortableCount = Math.max(1, count - targetDrillCount)

  const pickedComfortable = pickUniqueWords(comfortableWords, commonWords, comfortableCount, seed)
  const pickedTarget = pickUniqueWords(targetPool, fallbackTargetPool, targetDrillCount, seed + 101)

  // Interleave the targeted words smoothly across the test (e.g. 1 targeted word every ~15-20 words)
  const result: string[] = []
  const interval = Math.max(1, Math.floor(count / targetDrillCount))

  let targetIdx = 0
  let comfortIdx = 0

  for (let i = 0; i < count; i++) {
    const isTargetSlot = (i + 1) % interval === 0 && targetIdx < pickedTarget.length
    if (isTargetSlot || comfortIdx >= pickedComfortable.length) {
      if (targetIdx < pickedTarget.length) {
        result.push(pickedTarget[targetIdx++])
      } else if (comfortIdx < pickedComfortable.length) {
        result.push(pickedComfortable[comfortIdx++])
      }
    } else {
      result.push(pickedComfortable[comfortIdx++])
    }
  }

  if (!complex) return result
  return applyComplexity(result, seed)
}

export function generateSentence(): string {
  return generateWords(8).join(" ")
}

