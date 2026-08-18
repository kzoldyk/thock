import {
  type UserGripProfile,
  getLetterMasteryStatus,
} from "./letter-grip"

export const commonWords = [
  "a", "abandon", "ability", "able", "aboard", "about", "above", "absence", "absorb", "abstract",
  "absurd", "abundance", "abuse", "academy", "accent", "accept", "access", "accident", "accompany", "accomplish",
  "according", "account", "accurate", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act",
  "action", "active", "activist", "activity", "actor", "actress", "actual", "actually", "adapt", "add",
  "added", "address", "adequate", "adjacent", "adjoin", "adjourn", "adjust", "admit", "adopt", "adult",
  "advance", "advanced", "advantage", "adventure", "adverb", "advertising", "advice", "advise", "advocate", "affair",
  "affect", "afford", "afraid", "after", "afternoon", "again", "against", "age", "agency", "agenda",
  "agent", "aggressive", "ago", "agree", "agreement", "agricultural", "ahead", "aid", "aim", "air",
  "aircraft", "airline", "airport", "alarm", "album", "alcohol", "alike", "alive", "all", "alliance",
  "allow", "almost", "alone", "along", "aloud", "already", "also", "alternative", "although", "always",
  "am", "amaze", "amazing", "ambition", "among", "amount", "an", "analysis", "analyst", "analyze",
  "ancient", "and", "anger", "angle", "angry", "animal", "ankle", "anniversary", "announce", "annual",
  "another", "answer", "ant", "anticipate", "antique", "anxiety", "any", "anybody", "anymore", "anyone",
  "anything", "anyway", "anywhere", "apartment", "ape", "apex", "apologize", "apparent", "apparently", "appeal",
  "appear", "appearance", "apple", "application", "apply", "appoint", "appointment", "appreciate", "approach", "appropriate",
  "approval", "approve", "approximate", "arc", "architect", "area", "arena", "argue", "argument", "arise",
  "arm", "armor", "army", "around", "arrange", "arrangement", "arrest", "arrival", "arrive", "arrow",
  "art", "article", "artist", "artistic", "as", "ash", "aside", "ask", "asking", "asleep",
  "aspect", "assault", "assert", "assess", "assessment", "asset", "assign", "assignment", "assist", "assistance",
  "assistant", "associate", "association", "assume", "assumption", "assure", "at", "athlete", "athletic", "atmosphere",
  "attach", "attack", "attempt", "attend", "attention", "attitude", "attorney", "attract", "attractive", "attribute",
  "audience", "author", "authority", "authorize", "auto", "automatic", "automatically", "automobile", "autumn", "available",
  "avenue", "average", "avoid", "avoidance", "awake", "awaken", "award", "aware", "awareness", "away",
  "awful", "axe", "axis", "axon", "baby", "bachelor", "back", "background", "backup", "backward",
  "bacteria", "bad", "bag", "bake", "baker", "bakery", "baking", "balance", "balcony", "ball",
  "ballet", "balloon", "ballot", "ban", "banana", "band", "banjo", "bank", "banker", "banking",
  "banner", "banquet", "bar", "bark", "barking", "barrier", "base", "baseball", "basic", "basically",
  "basis", "basket", "basketball", "bat", "battery", "battle", "bay", "be", "beach", "beak",
  "beam", "bean", "bear", "beard", "beast", "beat", "beautiful", "beauty", "because", "become",
  "bed", "bedroom", "bee", "before", "beg", "begin", "beginning", "behave", "behavior", "behind",
  "being", "belief", "believe", "belong", "beloved", "below", "belt", "bench", "benchmark", "bend",
  "beneath", "benefit", "beside", "besides", "best", "bet", "better", "between", "beyond", "bicycle",
  "bid", "big", "bill", "billion", "bin", "binary", "bind", "biography", "biological", "biology",
  "bird", "birds", "birth", "birthday", "bishop", "bit", "bite", "bitter", "black", "blade",
  "blame", "blank", "blanket", "blast", "blaze", "blazer", "bleak", "bleed", "blend", "bless",
  "blind", "blink", "blizzard", "block", "blockage", "blocking", "blood", "bloody", "bloom", "blossom",
  "blow", "blue", "board", "boast", "boat", "bob", "body", "bog", "boil", "bold",
  "bolt", "bomb", "bond", "bone", "bonus", "book", "booking", "bookmark", "bookstore", "boom",
  "boost", "boot", "border", "bore", "bored", "boring", "born", "borrow", "boss", "both",
  "bother", "bottle", "bottom", "bounce", "bound", "boundary", "bouquet", "bow", "bowl", "box",
  "boxer", "boxing", "boy", "bracket", "brain", "braking", "branch", "brand", "brass", "brave",
  "bravery", "bravo", "bread", "break", "breakdown", "breakfast", "breaking", "breast", "breath", "breathe",
  "breathing", "breed", "breeze", "breezy", "brick", "bridge", "brief", "briefly", "bright", "brilliant",
  "bring", "brisk", "broad", "broadcast", "broke", "broken", "bronze", "brook", "brother", "brown",
  "brush", "bubble", "buck", "bucket", "bud", "budget", "bug", "build", "builder", "building",
  "built", "bulb", "bulk", "bulky", "bullet", "bunch", "bundle", "bunk", "bunker", "burden",
  "bureau", "burn", "burst", "bury", "bus", "bush", "business", "busy", "but", "butter",
  "button", "buy", "buyer", "buzz", "buzzer", "buzzing", "by", "bye", "cab", "cabin",
  "cabinet", "cable", "cactus", "cage", "cajole", "cake", "calculate", "calendar", "call", "calm",
  "camera", "camp", "campaign", "campus", "can", "canal", "cancel", "cancer", "candidate", "candle",
  "candy", "canvas", "cap", "capability", "capable", "capacity", "capital", "captain", "caption", "capture",
  "car", "carbon", "card", "cardiac", "care", "career", "careful", "carefully", "cargo", "carpet",
  "carrier", "carry", "cart", "carve", "case", "cash", "casino", "cast", "castle", "casual",
  "cat", "catalog", "catch", "categorize", "category", "cater", "cattle", "cause", "caution", "cave",
  "cavern", "cease", "ceiling", "celebrate", "celebration", "celebrity", "cell", "cellular", "cement", "cemetery",
  "censor", "census", "center", "central", "century", "ceremony", "certain", "certainly", "chain", "chair",
  "chairman", "chalk", "challenge", "chamber", "champion", "championship", "chance", "change", "channel", "chaos",
  "chapter", "character", "characteristic", "characterize", "charge", "charity", "charm", "chart", "charter", "chase",
  "cheap", "cheat", "check", "checkout", "checkpoint", "cheek", "cheer", "cheese", "chef", "chemical",
  "chemistry", "chest", "chew", "chicken", "chief", "child", "childhood", "children", "chill", "chimney",
  "chip", "chocolate", "choice", "choke", "cholesterol", "choose", "chop", "chord", "chronic", "chunk",
  "chunky", "church", "cider", "cigar", "cigarette", "cinema", "circle", "circuit", "circular", "circulate",
  "circumstance", "circus", "citizen", "citizenship", "city", "civic", "civil", "civilian", "civilization", "claim",
  "clan", "clarify", "clarity", "clash", "class", "classic", "classical", "classify", "classroom", "clay",
  "clean", "cleaner", "clear", "clearly", "clerk", "clever", "click", "client", "cliff", "climate",
  "climb", "cling", "clinic", "clinical", "clip", "clique", "cloak", "clock", "clone", "close",
  "closely", "closer", "closest", "closet", "cloth", "clothes", "clothing", "cloud", "cloudy", "clove",
  "clover", "club", "clue", "cluster", "coach", "coal", "coalition", "coast", "coastal", "coat",
  "coax", "code", "coffee", "cognitive", "cohesion", "cohort", "coin", "coincide", "cold", "collaborate",
  "collaboration", "collapse", "collar", "colleague", "collect", "collection", "collective", "collector", "college", "colonial",
  "colony", "color", "column", "columnist", "combat", "combination", "combine", "come", "comedy", "comfort",
  "comfortable", "command", "commander", "comment", "commentary", "commerce", "commercial", "commission", "commissioner", "commit",
  "commitment", "committee", "commodity", "common", "commonly", "communicate", "communication", "community", "company", "compare",
  "comparison", "compel", "compensate", "compensation", "compete", "competition", "competitive", "competitor", "compile", "complain",
  "complaint", "complement", "complete", "completely", "complex", "complexity", "compliance", "complicated", "component", "compose",
  "composition", "compound", "comprehensive", "compromise", "compute", "computer", "computing", "concentrate", "concentration", "concept",
  "conception", "concern", "concerned", "concert", "conclude", "conclusion", "concrete", "condition", "conduct", "conference",
  "confidence", "confident", "confirm", "conflict", "conform", "confront", "confusion", "congress", "connect", "connection",
  "conquer", "conscious", "consciousness", "consensus", "consent", "consequence", "conservation", "conservative", "consider", "considerable",
  "consideration", "consist", "consistent", "constant", "constantly", "constitute", "constitutional", "constraint", "construct", "construction",
  "consult", "consultant", "consume", "consumer", "consumption", "contact", "contain", "container", "contemporary", "content",
  "contest", "context", "continent", "continue", "continued", "continuing", "continuous", "contract", "contractor", "contrast",
  "contribute", "contribution", "control", "controversial", "controversy", "convenience", "convention", "conventional", "conversation", "convert",
  "conviction", "convince", "cook", "cookie", "cooking", "cool", "cooperate", "cooperation", "cooperative", "coordinate",
  "coordinator", "copper", "copy", "cord", "core", "cork", "corn", "corner", "corporate", "corporation",
  "correct", "correctly", "correlation", "correspond", "correspondence", "correspondent", "corridor", "corrupt", "corruption", "cost",
  "costly", "costume", "cottage", "cotton", "couch", "cough", "could", "council", "counsel", "counseling",
  "counselor", "count", "counter", "counterpart", "countless", "country", "countryside", "county", "couple", "courage",
  "courier", "course", "court", "courtroom", "cousin", "cove", "cover", "coverage", "cow", "cozy",
  "crack", "cradle", "craft", "crank", "crash", "crater", "crave", "craving", "crawl", "craze",
  "crazy", "creak", "cream", "create", "creation", "creative", "creativity", "creator", "creature", "credit",
  "creek", "crew", "cricket", "crime", "criminal", "crisis", "criteria", "criterion", "critic", "critical",
  "criticism", "criticize", "critique", "crook", "crop", "cross", "crowd", "crowded", "crown", "crucial",
  "crude", "cruel", "cruise", "crush", "crust", "crux", "cry", "crystal", "cube", "cubic",
  "cultural", "culture", "cup", "cupboard", "cure", "curiosity", "curious", "curl", "current", "currently",
  "curriculum", "curtain", "curve", "curved", "cushion", "custody", "custom", "customer", "cut", "cute",
  "cycle", "cynical", "dad", "daily", "dam", "damage", "dance", "danger", "dark", "darken",
  "darkness", "dawn", "day", "daze", "dazzle", "deal", "dear", "death", "deceive", "decide",
  "deck", "declare", "deejay", "deep", "degree", "delay", "delight", "deliver", "delivery", "demand",
  "den", "dense", "depend", "depth", "derive", "desert", "deserve", "design", "desire", "desk",
  "detail", "device", "devil", "devoid", "devote", "devotion", "dew", "dexter", "did", "die",
  "differ", "dig", "dim", "dinner", "dip", "direct", "dirt", "dish", "disjoint", "disk",
  "dive", "diver", "diverse", "divide", "division", "divorce", "dna", "do", "doc", "dock",
  "doctor", "dog", "dollar", "domain", "done", "donkey", "door", "dot", "double", "doubt",
  "dove", "dozen", "draft", "dragon", "drain", "drake", "drawer", "dreadlocks", "dream", "dress",
  "drift", "drill", "drink", "drinking", "drive", "driver", "driveway", "drizzle", "drop", "drove",
  "drown", "drum", "dry", "duck", "due", "dug", "duke", "dusk", "dust", "duty",
  "dye", "eager", "eagle", "ear", "early", "earth", "easily", "east", "easy", "eat",
  "echo", "edge", "editor", "effort", "egg", "ego", "eight", "either", "eject", "elbow",
  "elder", "elect", "element", "elevation", "eleven", "elk", "elm", "embark", "emphasize", "empire",
  "empty", "end", "enemy", "energy", "engine", "enjoy", "enjoyable", "enjoyment", "enough", "enter",
  "entire", "entry", "envelope", "envy", "equal", "equalize", "equate", "equip", "equity", "era",
  "escape", "estate", "eve", "even", "evening", "event", "ever", "every", "everyone", "everything",
  "evidence", "evil", "evolution", "evolve", "exact", "exalt", "exam", "exceed", "excel", "except",
  "excess", "excite", "excuse", "exempt", "exert", "exhale", "exhaust", "exhibit", "exile", "exist",
  "exit", "exotic", "expand", "expect", "expend", "expert", "expire", "explain", "explicit", "explode",
  "exploit", "explore", "export", "expose", "express", "extend", "extent", "extra", "extract", "extreme",
  "eye", "fabric", "face", "fact", "factor", "factory", "faint", "fair", "faith", "fake",
  "fall", "famous", "fan", "far", "farmer", "fast", "faster", "fat", "father", "fault",
  "favor", "favorite", "faze", "fear", "feast", "feather", "feature", "fed", "fee", "feet",
  "fellow", "felt", "female", "fence", "fever", "few", "fiber", "field", "fierce", "fig",
  "figure", "fill", "filter", "final", "find", "fine", "finger", "finish", "firm", "first",
  "fish", "fist", "fit", "five", "fix", "fixed", "fixture", "fizz", "fizzy", "flake",
  "flame", "flank", "flash", "flask", "flavor", "flesh", "flex", "flexible", "flight", "float",
  "flock", "flood", "floor", "flour", "flow", "flower", "flux", "fly", "focus", "fog",
  "folder", "folk", "follow", "food", "for", "forest", "forget", "forgive", "forgiven", "fork",
  "form", "formal", "former", "forty", "fossil", "foster", "found", "four", "fox", "foxes",
  "frame", "frank", "freak", "free", "freeze", "freezer", "frequent", "fresh", "friend", "from",
  "front", "frost", "frozen", "fruit", "fry", "full", "fun", "fur", "future", "fuzz",
  "fuzzy", "gain", "galaxy", "game", "gap", "garage", "garden", "garlic", "gas", "gather",
  "gauge", "gave", "gaze", "geek", "gel", "gem", "gender", "general", "genius", "gentle",
  "get", "giant", "gift", "gin", "girl", "give", "glance", "glass", "glaze", "globe",
  "glory", "glove", "glow", "go", "goat", "god", "gold", "good", "got", "govern",
  "government", "governor", "grace", "grade", "grain", "grand", "grape", "graph", "grass", "grave",
  "gravel", "gravity", "gray", "graze", "great", "green", "grid", "grief", "grizzly", "gross",
  "ground", "group", "grove", "grow", "guard", "guess", "guest", "guide", "guilt", "guitar",
  "gum", "gun", "gut", "guy", "gym", "habit", "had", "ham", "hand", "handle",
  "happen", "harbor", "hard", "hardly", "harvest", "has", "hat", "have", "haven", "hawk",
  "hay", "hazard", "hazardous", "haze", "hazy", "he", "head", "health", "hear", "heart",
  "heat", "heavily", "heavy", "hedge", "height", "helmet", "help", "hem", "hen", "her",
  "here", "hero", "hi", "hid", "hidden", "high", "hike", "hiker", "hiking", "hill",
  "him", "hip", "his", "history", "hit", "hive", "hoax", "hobby", "hold", "home",
  "honey", "honor", "hook", "hop", "hope", "horizon", "horizontal", "horror", "horse", "hot",
  "hotel", "hound", "hourly", "house", "hover", "how", "hub", "hue", "hug", "huge",
  "hum", "human", "humor", "hunger", "hurry", "hurt", "husk", "hut", "ice", "icon",
  "icy", "idea", "if", "ignore", "ill", "image", "impact", "import", "impose", "improve",
  "improvement", "in", "income", "indeed", "index", "infant", "inform", "initialize", "inject", "injection",
  "injure", "injury", "ink", "inn", "inner", "input", "inquire", "insect", "inside", "insist",
  "intend", "intent", "into", "invent", "invention", "invest", "investment", "invitation", "invite", "invoke",
  "involve", "involvement", "ion", "irksome", "is", "island", "issue", "it", "item", "its",
  "ivy", "jacket", "jail", "jailer", "jam", "jar", "jargon", "jasper", "java", "javelin",
  "jaw", "jay", "jazz", "jazzy", "jealous", "jealousy", "jeans", "jeep", "jelly", "jellyfish",
  "jeopardy", "jerk", "jersey", "jest", "jester", "jet", "jew", "jewel", "jewelry", "jiffy",
  "jig", "jigsaw", "jilt", "jingle", "jinx", "job", "jockey", "jocular", "jog", "jogger",
  "jogging", "join", "joiner", "joint", "joke", "joker", "joking", "jolly", "jolt", "journal",
  "journalist", "journey", "jovial", "joy", "joyful", "joyous", "jubilee", "judge", "judgment", "judicial",
  "judiciary", "jug", "juggle", "juggler", "juice", "juicy", "juke", "jukebox", "jumble", "jumbo",
  "jump", "jumper", "jumpy", "junction", "juncture", "jungle", "junior", "junk", "junker", "junkie",
  "junta", "jupiter", "juror", "jury", "just", "justice", "justify", "jut", "juvenile", "keen",
  "keep", "keeper", "keeping", "keg", "kennel", "kept", "kettle", "key", "keyboard", "keynote",
  "kick", "kicker", "kicking", "kid", "kidnap", "kidney", "kill", "killer", "killing", "kiln",
  "kilo", "kilogram", "kilometer", "kin", "kind", "kindle", "kindly", "kindness", "king", "kingdom",
  "kink", "kinky", "kiss", "kissing", "kit", "kitchen", "kite", "kitten", "kitty", "kiwi",
  "knack", "knee", "kneel", "knelt", "knew", "knife", "knight", "knit", "knob", "knock",
  "knot", "know", "knowing", "knowledge", "known", "knuckle", "lab", "label", "labor", "lad",
  "ladder", "lake", "lamp", "land", "lap", "laptop", "large", "laser", "last", "latex",
  "latter", "laugh", "launch", "lava", "law", "lawyer", "lax", "lay", "lead", "leader",
  "league", "leak", "lean", "learn", "leather", "leave", "led", "leg", "lemon", "length",
  "lesson", "let", "letter", "level", "lever", "leverage", "lid", "lie", "life", "light",
  "like", "likely", "liking", "line", "link", "linking", "lip", "liquid", "liquor", "list",
  "listen", "lit", "little", "live", "lively", "liver", "living", "lizard", "load", "local",
  "locate", "lock", "locker", "locking", "lodge", "log", "logic", "lonely", "long", "look",
  "looking", "lookup", "loose", "lord", "loser", "lot", "loud", "love", "lover", "loving",
  "low", "lower", "loyal", "luck", "lucky", "lunch", "luxury", "mad", "magic", "magnet",
  "major", "majority", "make", "maker", "making", "man", "manage", "manner", "map", "marble",
  "margin", "marine", "mark", "marker", "market", "marketing", "marking", "marry", "marvel", "marvelous",
  "mask", "master", "mat", "match", "matrix", "matter", "mature", "max", "maximize", "maximum",
  "may", "maze", "me", "meadow", "meal", "mean", "measure", "medal", "media", "medium",
  "meek", "meet", "melody", "melon", "member", "memory", "men", "mental", "menu", "mercy",
  "merit", "mesh", "met", "metal", "meteor", "method", "mid", "middle", "might", "mile",
  "milk", "milky", "mind", "mineral", "minimize", "mirror", "misery", "miss", "mist", "mix",
  "mixer", "mixture", "mob", "modern", "modest", "modify", "module", "mom", "money", "monk",
  "monkey", "month", "moon", "mop", "moral", "morning", "mortar", "mosque", "most", "mother",
  "motion", "motivate", "motive", "mount", "mouse", "mouth", "move", "movement", "movie", "mud",
  "mug", "mule", "mum", "muscle", "museum", "music", "mutton", "mutual", "muzzle", "my",
  "myself", "naked", "nap", "narrow", "native", "nature", "naval", "nave", "navigate", "navy",
  "neat", "neck", "necklace", "need", "needle", "neglect", "nephew", "nerve", "nervous", "nest",
  "net", "network", "neutral", "never", "new", "next", "nexus", "niece", "night", "nil",
  "ninja", "no", "noble", "nod", "noise", "nomad", "nor", "normal", "north", "not",
  "note", "noun", "novel", "novelist", "novelty", "now", "nozzle", "nurse", "nut", "nylon",
  "oak", "oar", "oasis", "oat", "object", "objection", "objective", "oblige", "oblique", "obtain",
  "occupy", "occur", "ocean", "odd", "odor", "of", "off", "offer", "often", "oil",
  "old", "olive", "on", "once", "one", "onion", "online", "only", "onyx", "opaque",
  "open", "opera", "opt", "optics", "optimize", "option", "or", "orange", "orb", "orbit",
  "orchard", "order", "ore", "organ", "organize", "origin", "orphan", "other", "otter", "ounce",
  "our", "out", "outlet", "output", "outset", "oval", "oven", "over", "overall", "overcome",
  "owl", "own", "ox", "oxen", "oxide", "oxygen", "oyster", "ozone", "pack", "package",
  "packaging", "packet", "packing", "pad", "paint", "pair", "pajama", "pal", "palace", "palm",
  "pan", "panel", "panic", "paper", "parade", "parcel", "pardon", "parent", "parish", "park",
  "parking", "parrot", "parson", "past", "pastel", "pastor", "pat", "patent", "path", "patrol",
  "patron", "pause", "pave", "pavement", "paw", "pay", "pea", "peace", "peach", "peak",
  "peanut", "pearl", "peasant", "pebble", "pedal", "peek", "peg", "pen", "pencil", "people",
  "pepper", "period", "permit", "person", "pet", "petrol", "phase", "phrase", "piazza", "pick",
  "picker", "picking", "pickle", "picnic", "pie", "piece", "pig", "pigeon", "pillow", "pilot",
  "pin", "pinch", "pink", "pique", "pirate", "pistol", "piston", "pit", "pitch", "pity",
  "pivot", "pixel", "pizza", "place", "plan", "plane", "planet", "plank", "plant", "plaque",
  "plasma", "plaster", "plate", "play", "plaza", "plenty", "plow", "pluck", "ply", "pocket",
  "pod", "poem", "poet", "poetry", "point", "poison", "pole", "police", "policy", "polish",
  "polite", "pollen", "pond", "poodle", "pop", "pork", "portal", "porter", "pose", "post",
  "poster", "pot", "potato", "potter", "pound", "powder", "power", "praise", "prank", "prayer",
  "prefer", "prefix", "preserve", "press", "prevail", "prevent", "priest", "prime", "prince", "prison",
  "private", "privilege", "prize", "pro", "profit", "project", "projection", "projector", "prompt", "proper",
  "prose", "proud", "prove", "proven", "proverb", "provide", "province", "proximity", "proxy", "pub",
  "public", "puddle", "puke", "pull", "pulse", "pump", "pun", "punch", "punish", "pup",
  "pupil", "puppet", "puppy", "purple", "put", "puzzle", "quack", "quad", "quail", "quaint",
  "quake", "qualify", "quality", "qualm", "quantity", "quantum", "quark", "quarrel", "quarry", "quart",
  "quarter", "quartz", "quasar", "quay", "queen", "quell", "quench", "query", "quest", "queue",
  "quiche", "quick", "quickly", "quiet", "quill", "quilt", "quip", "quirk", "quit", "quite",
  "quiver", "quiz", "quizzes", "quota", "quote", "quoth", "rabbit", "race", "radar", "radiant",
  "radius", "radix", "raft", "rag", "rage", "raid", "rail", "rainbow", "rally", "ram",
  "rampart", "ran", "ranch", "random", "range", "rank", "ranking", "rap", "rapid", "rare",
  "rascal", "rash", "rat", "ratio", "rattle", "rave", "ravine", "raw", "ray", "razor",
  "reach", "read", "real", "realize", "rebel", "receipt", "receive", "receiver", "recent", "recipe",
  "reckon", "recognize", "record", "recover", "recovery", "rectory", "red", "reduce", "reed", "reef",
  "reflect", "reflex", "reform", "refuge", "refund", "refuse", "regard", "region", "regret", "reign",
  "reject", "rejection", "rejoice", "relate", "relative", "relax", "relay", "relief", "relieve", "rely",
  "remain", "remark", "remedy", "remind", "remix", "remote", "removal", "remove", "render", "renew",
  "rental", "repair", "repeat", "replace", "reply", "report", "request", "require", "rescue", "resemble",
  "reservation", "reserve", "reside", "resist", "resolve", "resort", "resource", "respect", "respond", "rest",
  "restore", "result", "resume", "retail", "retain", "retire", "retreat", "retrieve", "return", "reveal",
  "revelation", "revenge", "revenue", "reverse", "review", "revise", "revival", "revive", "reward", "rhythm",
  "rib", "ribbon", "rid", "ride", "rider", "ridge", "rifle", "right", "rigid", "rim",
  "ring", "riot", "rip", "ripen", "ripple", "risen", "risk", "risky", "rival", "rivalry",
  "river", "road", "roam", "roar", "roast", "rob", "robber", "robin", "robot", "robust",
  "rock", "rocket", "rocky", "rod", "rogue", "roller", "romance", "roof", "room", "roost",
  "root", "rope", "rose", "rot", "rotate", "rotor", "rough", "round", "route", "routine",
  "rover", "row", "royal", "rub", "rubber", "rubble", "ruby", "rudder", "rude", "rug",
  "ruin", "rule", "ruler", "rumor", "run", "runner", "rupee", "rural", "rush", "rust",
  "rustic", "rut", "rye", "sack", "sacred", "sad", "saddle", "safari", "safe", "safety",
  "sag", "sail", "sailor", "saint", "sake", "salad", "salary", "salmon", "salon", "saloon",
  "salt", "salute", "salvation", "same", "sample", "sandal", "sandals", "sandy", "sap", "sat",
  "sauce", "saucer", "savage", "save", "saver", "saving", "savings", "savior", "savvy", "saw",
  "sax", "say", "scale", "scalp", "scan", "scar", "scarce", "scarf", "scary", "scatter",
  "scene", "scent", "schema", "scholar", "school", "science", "scissors", "scold", "scoop", "scope",
  "scorch", "score", "scorn", "scout", "scrape", "scratch", "scream", "screen", "screw", "script",
  "scroll", "scrub", "sculpt", "scythe", "sea", "sealed", "seaman", "search", "season", "seat",
  "second", "secret", "sector", "secure", "sedan", "sediment", "see", "seek", "seeker", "seeking",
  "segment", "seize", "seizure", "seldom", "select", "self", "seller", "semicolon", "senate", "sender",
  "senior", "sensation", "sensor", "sentence", "separate", "sequel", "sequence", "sergeant", "serial", "series",
  "sermon", "serpent", "servant", "serve", "service", "session", "set", "settle", "seven", "seventeen",
  "seventh", "seventy", "several", "severe", "sew", "sewer", "shadow", "shaft", "shaggy", "shake",
  "shaking", "shallow", "shame", "shape", "share", "shark", "sharp", "shatter", "shave", "shawl",
  "she", "sheaf", "shear", "sheath", "shed", "sheep", "sheet", "shelf", "shell", "shelter",
  "sheriff", "shield", "shift", "shine", "ship", "shiver", "shock", "shocking", "shook", "shore",
  "short", "shove", "shovel", "show", "shower", "shrink", "shrub", "shrug", "shy", "side",
  "sign", "signal", "silence", "silent", "silk", "silky", "silver", "simple", "sin", "since",
  "sincere", "single", "sink", "sinking", "sip", "sir", "sister", "sit", "six", "sixth",
  "sixty", "size", "sizzle", "sketch", "ski", "skill", "skilled", "skillful", "skin", "skinny",
  "skip", "skirt", "skull", "sky", "slack", "slate", "slave", "slavery", "sleek", "sleep",
  "sleeve", "slice", "slick", "slide", "slight", "slope", "sly", "small", "smart", "smell",
  "smile", "smoke", "smoking", "smooth", "snack", "snake", "snatch", "sneak", "sneeze", "snow",
  "so", "soak", "sob", "sock", "socket", "sod", "soft", "sojourn", "soldier", "solid",
  "solve", "solvent", "some", "son", "song", "soon", "sop", "sound", "source", "sow",
  "soy", "spa", "space", "spark", "sparkle", "speak", "speaker", "speaking", "special", "species",
  "speck", "speech", "sphere", "spice", "spider", "spike", "spill", "spin", "spine", "spirit",
  "splash", "spoke", "spoken", "sponge", "spoon", "sport", "spot", "spray", "spread", "spring",
  "spy", "squad", "square", "squash", "squat", "squeeze", "squid", "squint", "squirm", "stable",
  "staff", "stage", "stain", "stair", "stake", "stalk", "stamp", "stand", "stanza", "star",
  "starch", "stare", "start", "starvation", "starve", "state", "station", "statue", "status", "stay",
  "steak", "steam", "steel", "steep", "steer", "stem", "step", "stick", "sticky", "stiff",
  "still", "stitch", "stock", "stocking", "stomach", "stone", "stool", "stop", "store", "storm",
  "story", "stove", "strain", "strand", "strap", "straw", "streak", "stream", "street", "stress",
  "stretch", "strike", "striking", "string", "strip", "strive", "stroke", "structure", "struggle", "stuck",
  "student", "studio", "study", "stuff", "stumble", "stump", "sub", "subject", "subjection", "subtle",
  "subway", "succeed", "success", "sue", "suffix", "sugar", "suggest", "suit", "suite", "sulfur",
  "sum", "summarize", "summer", "summit", "summon", "sun", "super", "supply", "support", "sure",
  "surface", "surgeon", "surprise", "surround", "survey", "survival", "survive", "survivor", "suspect", "swallow",
  "swamp", "swan", "swarm", "swear", "sweat", "sweep", "sweet", "swell", "swift", "swim",
  "swing", "switch", "sword", "symbol", "symbolize", "syntax", "system", "tab", "table", "tackle",
  "tact", "tag", "tail", "tailor", "take", "taken", "taking", "talent", "talk", "talking",
  "tan", "tank", "tap", "tar", "target", "tariff", "task", "taste", "tavern", "tax",
  "taxi", "taxing", "tea", "teach", "teacher", "team", "teaspoon", "tee", "tell", "temper",
  "temple", "ten", "tenant", "tender", "tennis", "tenor", "tense", "tension", "tent", "term",
  "terminal", "terrace", "terrible", "territory", "terror", "test", "text", "textile", "texture", "than",
  "thank", "thanks", "that", "the", "their", "them", "then", "theory", "there", "thermometer",
  "these", "they", "thick", "thickness", "thief", "thigh", "thimble", "thing", "think", "thinking",
  "thirsty", "this", "thistle", "thorn", "thorough", "thread", "threat", "threshold", "thrift", "throat",
  "throne", "throng", "thrust", "thumb", "thunder", "thy", "ticket", "tide", "tidy", "tie",
  "tiger", "tight", "tile", "timber", "time", "tin", "tip", "tissue", "title", "to",
  "toast", "tobacco", "today", "toe", "token", "told", "tomb", "ton", "tongue", "tonic",
  "too", "took", "tool", "tooth", "top", "topic", "torch", "torque", "torrent", "tortoise",
  "total", "touch", "tow", "towel", "tower", "town", "toxic", "toxin", "toy", "trace",
  "track", "tracking", "tractor", "trade", "traffic", "tragedy", "trail", "train", "traitor", "trajectory",
  "tramp", "trance", "trap", "trapeze", "trash", "travel", "traveler", "tray", "tread", "treason",
  "treasure", "treat", "treaty", "treble", "trench", "trend", "trial", "triangle", "tribe", "tribute",
  "trick", "tricky", "trigger", "triumph", "troop", "trophy", "tropical", "trouble", "trout", "trowel",
  "truce", "truck", "true", "trumpet", "trunk", "trust", "truth", "try", "tub", "tube",
  "tug", "tulip", "tumble", "tumor", "tune", "tunnel", "turban", "turf", "turkey", "turn",
  "turnip", "turtle", "tusk", "tutor", "twilight", "twin", "twinkle", "twist", "two", "type",
  "typewriter", "tyrant", "ugly", "umbrella", "umpire", "uncle", "under", "undergo", "understand", "uniform",
  "union", "unique", "unit", "universe", "unix", "unknown", "unless", "until", "unusual", "up",
  "upright", "uproar", "upset", "upward", "urban", "urge", "urgent", "urn", "us", "usage",
  "use", "useful", "useless", "user", "usher", "usual", "utensil", "utility", "utilize", "utter",
  "vacant", "vacuum", "vagrant", "vague", "vain", "valiant", "valid", "valley", "valor", "valuable",
  "valve", "van", "vanish", "vanity", "vapor", "variable", "variety", "various", "varnish", "vary",
  "vase", "vassal", "vast", "vat", "vault", "vector", "vegetable", "vehicle", "veil", "vein",
  "velocity", "velvet", "vendor", "venom", "venture", "venue", "verdict", "verge", "verify", "verse",
  "version", "versus", "vertical", "very", "vessel", "vest", "vet", "veteran", "veto", "vex",
  "via", "viable", "vial", "vibe", "vibrant", "vibrate", "vibration", "vicar", "vice", "victim",
  "victor", "victory", "video", "view", "viewer", "vigil", "vigor", "vigorous", "villa", "village",
  "villager", "villain", "vim", "vine", "vinegar", "vintage", "viola", "violate", "violation", "violence",
  "violent", "violet", "violin", "viper", "viral", "virgin", "virtual", "virtue", "virus", "visa",
  "visage", "viscount", "visible", "vision", "visit", "visitor", "visor", "visual", "visualize", "vital",
  "vitality", "vitamin", "vivid", "vividly", "vixen", "vocal", "vocation", "vogue", "voice", "voiced",
  "void", "volatile", "volcano", "volleyball", "volt", "voltage", "volume", "volunteer", "vomit", "vortex",
  "vote", "voter", "voting", "vouch", "voucher", "vow", "vowel", "voyage", "voyager", "vulgar",
  "vulnerable", "vulture", "wafer", "waffle", "wager", "waggon", "waist", "wait", "waive", "waiver",
  "wake", "waking", "walk", "walker", "walking", "wall", "walnut", "wander", "want", "war",
  "wardrobe", "warfare", "warm", "warning", "warrant", "warrior", "was", "waste", "watch", "watchman",
  "water", "waterfall", "waterproof", "wave", "waver", "wavy", "wax", "waxy", "way", "we",
  "weak", "weaken", "weakness", "weapon", "weary", "weather", "weaver", "web", "wed", "wedding",
  "wedge", "wee", "week", "weekday", "weekend", "weekly", "weep", "weight", "welcome", "welfare",
  "well", "western", "wet", "what", "wheat", "wheel", "when", "which", "whiskey", "whisper",
  "whistle", "white", "whiz", "who", "why", "wick", "wicked", "wide", "widow", "width",
  "wig", "wild", "wilderness", "will", "willing", "willow", "win", "wind", "window", "winter",
  "wisdom", "wish", "wit", "with", "wizard", "woe", "wolf", "woman", "won", "wonder",
  "woo", "wooden", "wool", "work", "worker", "working", "workout", "workshop", "world", "worm",
  "worship", "would", "wound", "wow", "wreck", "wrist", "write", "writer", "wrong", "yacht",
  "yak", "yam", "yap", "yard", "yarn", "yaw", "yea", "year", "yearn", "yeast",
  "yellow", "yes", "yet", "yew", "yield", "yin", "yip", "yoke", "yolk", "you",
  "young", "your", "youth", "zap", "zeal", "zealous", "zebra", "zen", "zenith", "zephyr",
  "zero", "zest", "zig", "zigzag", "zinc", "zip", "zipper", "zircon", "zodiac", "zombie",
  "zone", "zoning", "zoo", "zoom",
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

function pickRandom<T>(arr: T[], count: number, seed: number): T[] {
  if (arr.length === 0) return []
  const rng = mulberry32(seed)

  // If array is large enough, do standard Fisher-Yates shuffle
  if (arr.length >= count) {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy.slice(0, count)
  }

  // If pool is smaller than count, sample with replacement
  const result: T[] = []
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * arr.length)
    result.push(arr[idx])
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
  const words = pickRandom(commonWords, count, seed ?? 42)
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
 *    - 100% of words are strictly composed of letters the user is comfortable with.
 *    - No uncomfortable or unfamiliar letters are used, maintaining high WPM, high accuracy, and confidence.
 * 2. After 10 typings (testCount >= 10):
 *    - Identifies exactly ONE targeted uncomfortable letter from the user's weaknesses.
 *    - Smoothly injects 1-2 targeted drill words containing that single uncomfortable letter (and only comfortable letters for the rest of the word).
 *    - The remaining >=90% of words are 100% comfortable words.
 *    - Once the user achieves proficiency (>=90% accuracy) on that target letter, it graduates and the next letter is queued.
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

  // 1. Find all pure comfortable words (words containing ONLY comfortable letters)
  const comfortableWords: string[] = []
  for (let i = 0; i < commonWords.length; i++) {
    const word = commonWords[i]
    const mask = WORD_BITMASKS.get(word) || wordToBitmask(word)
    if ((mask & ~comfortableMask) === 0) {
      comfortableWords.push(word)
    }
  }

  // Resilient fallback pool if filter is too narrow
  const basePool = comfortableWords.length >= 10 ? comfortableWords : commonWords.slice(0, 50)

  // Phase 1: First 10 typings or no target letter -> 100% comfortable words
  if (isInitialComfortPhase || !targetLetter) {
    const picked = pickRandom(basePool, count, seed)
    if (!complex) return picked
    return applyComplexity(picked, seed)
  }

  // Phase 2: After 10 typings -> inject ONE targeted uncomfortable letter
  const targetCode = targetLetter.toLowerCase().charCodeAt(0) - 97
  const targetBit = 1 << targetCode
  const allowedWithTargetMask = comfortableMask | targetBit

  // Find targeted words that contain targetLetter AND where all other letters are in comfortableLetters
  const targetedWords: string[] = []
  for (let i = 0; i < commonWords.length; i++) {
    const word = commonWords[i]
    const mask = WORD_BITMASKS.get(word) || wordToBitmask(word)
    if ((mask & targetBit) !== 0 && (mask & ~allowedWithTargetMask) === 0) {
      targetedWords.push(word)
    }
  }

  // Fallback targeted pool if strict subset is empty
  const targetPool = targetedWords.length > 0
    ? targetedWords
    : commonWords.filter((w) => w.toLowerCase().includes(targetLetter))

  if (targetPool.length === 0) {
    const picked = pickRandom(basePool, count, seed)
    if (!complex) return picked
    return applyComplexity(picked, seed)
  }

  // Calculate target drill word count: 1-2 words for small sessions (<=30), 3-5 words for long sessions (150)
  const targetDrillCount = Math.max(1, Math.min(6, Math.round(count * 0.05)))
  const comfortableCount = Math.max(1, count - targetDrillCount)

  const pickedComfortable = pickRandom(basePool, comfortableCount, seed)
  const pickedTarget = pickRandom(targetPool, targetDrillCount, seed + 101)

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

