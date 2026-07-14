import Link from "next/link";

interface FAQItem {
  question: string;
  answer: string;
}

interface SEOData {
  h1: string;
  intro: string;
  detailsTitle: string;
  detailsContent: string;
  faqs: FAQItem[];
  schemaType: string;
}

const SEO_PAGES_DATA: Record<string, SEOData> = {
  home: {
    h1: "Thock — Premium Mechanical Keyboard Typing Experience",
    intro: "Welcome to Thock, the luxury typing test designed for mechanical keyboard lovers. Unlike generic typing speed tests, Thock combines raw WPM tracking and accuracy analysis with low-latency Web Audio API spatial synthesis. Clack, thock, and type your way into a flow state with customizable switch profiles and interactive layouts.",
    detailsTitle: "Why Choose a Premium Typing Simulator?",
    detailsContent: "Typing is more than just keypresses—it is a sensory workflow. Thock is engineered as a physical keyboard playground in your browser. Whether you are using linear, tactile, or clicky switches, our audio engine maps each stroke to simulated Cherry MX Blue clacks, dampening configurations (foam mods, tape mods, gasket mounts), and stereo panners. Measure your true performance while enjoying a satisfying, tactile-sounding typing environment.",
    faqs: [
      {
        question: "How is WPM calculated?",
        answer: "Words Per Minute (WPM) is calculated by taking the number of typed characters, dividing by 5 (the standard word length), and dividing by the elapsed time in minutes. Thock locks your stats precisely at the end of the test to prevent results drift."
      },
      {
        question: "What makes Thock different from Monkeytype or 10FastFingers?",
        answer: "While standard websites offer simple speed tests, Thock focuses on sensory depth. It includes realistic real-time 3D and 2D keyboard visualizers, an advanced audio synthesis engine that pans sounds based on key location, and premium VisionOS-inspired glassmorphic aesthetics that elevate the typing practice into a focus-driven experience."
      },
      {
        question: "How do mechanical keyboard sounds improve the typing experience?",
        answer: "Satisfying auditory feedback helps establish a rhythm. The 'clack' or 'thock' sound provides immediate verification of key registration, boosting speed, keeping your muscle memory engaged, and helping you enter a deep flow state."
      },
      {
        question: "What is Raw WPM vs Net WPM?",
        answer: "Raw WPM is your typing speed including all keystrokes, even mistakes. Net WPM only counts words typed correctly. Thock tracks both metrics alongside accuracy and consistency to give you a complete picture of your typing performance."
      }
    ],
    schemaType: "SoftwareApplication"
  },
  "typing-test": {
    h1: "Online Typing Test — Check Your WPM and Accuracy",
    intro: "Measure your typing speed (WPM) and accuracy in real-time with our online typing test. Thock provides a premium, distacted-free interface designed to help you analyze your keystrokes, track performance, and hear responsive mechanical keyboard sounds as you type.",
    detailsTitle: "Boost Your Words Per Minute (WPM) Score",
    detailsContent: "Taking regular typing speed tests is the best way to train muscle memory. Thock offers clean horizontal scrolling display modes, styled with a warm-light theme or dark finish. Each test helps identify keys where you pause or make mistakes, giving you clear insight to improve your overall typing precision.",
    faqs: [
      {
        question: "How can I check my typing speed?",
        answer: "Simply start typing the words displayed on the screen. The timer starts with your first keystroke. Once the session ends, your WPM, accuracy, and error counts are displayed instantly."
      },
      {
        question: "How often should I practice typing?",
        answer: "Practicing 10 to 15 minutes daily is much more effective than long sessions once a week. Consistency helps reinforce muscle memory and steadily increases your average WPM."
      },
      {
        question: "What is a good typing speed?",
        answer: "The average typing speed is around 40 WPM. Professional typists and programmers usually aim for 70 to 90 WPM. Speeds above 100 WPM are considered advanced."
      }
    ],
    schemaType: "WebApplication"
  },
  "wpm-test": {
    h1: "WPM Test — Calculate Your Typing Speed Online",
    intro: "Take our professional WPM test to measure your true words per minute typing speed. Analyze your performance with detailed post-test statistics, including live speed fluctuations, character consistency, and error distribution.",
    detailsTitle: "What is WPM and How is it Measured?",
    detailsContent: "WPM stands for Words Per Minute. It is the standard formula for typing speed: WPM = (Total Characters / 5) / Time (minutes). Thock goes beyond standard metrics to measure Raw WPM, accuracy percentages, and consistency scores to show how steady your rhythm is during the test.",
    faqs: [
      {
        question: "What is a good WPM speed on a keyboard?",
        answer: "An average speed is 40 WPM. Anything above 60 WPM is considered good for office productivity, while speeds over 80 WPM are excellent for developers and writers."
      },
      {
        question: "How is accuracy calculated during the WPM test?",
        answer: "Accuracy is calculated as (Correct Characters / Total Keys Pressed) * 100%. Thock helps you monitor accuracy because typing fast is only useful if it is correct."
      }
    ],
    schemaType: "WebApplication"
  },
  "mechanical-keyboard-typing-test": {
    h1: "Mechanical Keyboard Typing Test — Experience Realistic Switch Sounds",
    intro: "Test your typing speed while listening to realistic, high-fidelity mechanical keyboard sounds. Choose your sound profile, customize switch attributes, and feel the clacks and thocks of linear, tactile, and clicky switches directly in your browser.",
    detailsTitle: "Simulated Switch Acoustic Experience",
    detailsContent: "Our custom Web Audio API synthesizer cuts sound slices of Cherry Blue switches, tape mods, and foam mods. The audio panner creates stereo depth, moving the click from left to right speakers depending on which key you press on the simulated keyboard layout. It's the ultimate simulator for mechanical keyboard fans.",
    faqs: [
      {
        question: "What are 'thock' and 'clack' sounds?",
        answer: "'Clack' refers to high-pitched, crisp switch bottoms, typical of clicky and linear switches. 'Thock' refers to deep, muted, and bass-heavy acoustics, often achieved with custom case foam, tape mods, and heavy linear switches."
      },
      {
        question: "Can I use key sounds to type faster?",
        answer: "Yes! Audio feedback confirms your keystroke without needing to visually inspect the screen, allowing you to focus entirely on the next word and increase your speed."
      }
    ],
    schemaType: "WebApplication"
  },
  "typing-practice": {
    h1: "Typing Practice — Improve Precision, Speed, and Accuracy",
    intro: "Develop your muscle memory and improve your keyboard precision with Thock's daily typing practice. Our minimalist trainer uses a single-line typewriter display to maximize focus and reduce eye strain.",
    detailsTitle: "Advanced Keyboard Training and Drills",
    detailsContent: "Whether you are a software developer looking to speed up coding workflows or a professional writer, regular practice sessions build the habits needed for fast, error-free typing. Use different font settings like Inter, Geist Mono, or JetBrains Mono to match your IDE styling.",
    faqs: [
      {
        question: "How can I improve my typing accuracy?",
        answer: "Slow down and prioritize hitting the right keys first. Speed will naturally follow accuracy. Focus on eliminating repetitive errors on specific keys."
      },
      {
        question: "Should I look at the keyboard while practicing?",
        answer: "No. Touch typing relies on muscle memory. Try to keep your eyes on the screen and use Thock's 2D/3D on-screen keyboard visualizer to learn key positions."
      }
    ],
    schemaType: "WebApplication"
  },
  "typing-speed-test": {
    h1: "Typing Speed Test — Measure Keyboard Speed",
    intro: "Check your speed with our premium typing speed test. Track your words-per-minute progress over time, participate in typing challenges, and test different keyboard finishes.",
    detailsTitle: "Accurate Velocity Tracking for Typists",
    detailsContent: "Our testing engine measures every millisecond of key activity to provide highly accurate stats. With detailed graphs showing your typing velocity, mistakes, and consistency metrics, you will know exactly where your speed drops.",
    faqs: [
      {
        question: "How is my typing speed score saved?",
        answer: "Your typing test results are saved locally in your session history. You can view your speed progression, highest WPM, and average accuracy on the results panel."
      },
      {
        question: "What factors affect typing speed?",
        answer: "Key factors include hand placement, posture, keyboard layout, switch profile (linear vs. clicky), and focus mode styling."
      }
    ],
    schemaType: "WebApplication"
  },
  "typing-accuracy-test": {
    h1: "Typing Accuracy Test — Track Precision and Consistency",
    intro: "Precision is just as important as speed. Test your typing accuracy, monitor character mistakes, and review your keypress consistency to achieve clean, error-free typing.",
    detailsTitle: "The Importance of Typing Consistency",
    detailsContent: "Consistency measures how stable your typing speed is throughout the test. Extreme bursts of speed followed by long pauses due to mistakes result in low consistency. Thock tracks this variable to help you develop a smooth, fluid typing rhythm.",
    faqs: [
      {
        question: "Why does typing accuracy matter?",
        answer: "Correcting mistakes wastes valuable time. A slower, error-free pace is often faster overall than a fast pace plagued with errors that require using backspace."
      },
      {
        question: "How is consistency calculated in Thock?",
        answer: "Consistency is calculated by measuring the variance in keystroke intervals (milliseconds between key presses). Lower variance corresponds to a higher consistency score."
      }
    ],
    schemaType: "WebApplication"
  },
  "best-typing-website": {
    h1: "The Best Typing Website for Mechanical Keyboard Lovers",
    intro: "Find out why developers, gamers, and writers call Thock the best typing website on the internet. We combine typing speed metrics with customizable audio profiles and visual layout simulations.",
    detailsTitle: "A Premium Interface Inspired by Luxury Hardware",
    detailsContent: "Thock sets a new standard for online typing tools. With visionOS-inspired glass panels, custom mechanical sound synthesis, dynamic background particles, and complete keyboard finishes, Thock offers a high-fidelity environment built for professionals.",
    faqs: [
      {
        question: "Is Thock free to use?",
        answer: "Yes, Thock is 100% free to use. All sound profiles, keyboard layouts, statistics, and typing practice tests are available without subscription."
      },
      {
        question: "Can I use Thock on mobile devices?",
        answer: "Thock is optimized for physical keyboards and is best experienced on laptops or desktops. However, we provide a mobile layout with developer quotes and aesthetic details for smartphone users."
      }
    ],
    schemaType: "WebApplication"
  },
  "best-mechanical-keyboard-sounds": {
    h1: "Best Mechanical Keyboard Sounds & Audio Simulator",
    intro: "Experience the best mechanical keyboard sounds online. Listen to clicky Cherry MX Blues, creamy tape mods, deep thocks, and soft gasket setups directly from your browser.",
    detailsTitle: "Low-Latency Key Acoustic Customization",
    detailsContent: "Thock uses Web Audio API nodes to synthesize key clacks. Dial in the master volume, key stroke gain, pitch shift, ambient reverb, and stereo separation to build your perfect acoustic soundscape.",
    faqs: [
      {
        question: "How do I change key sound profiles in Thock?",
        answer: "Press the 'Settings' button or the 'Esc' key to open the glass preferences modal. Navigate to the 'Switch Sounds Pack' or 'Acoustic Dampener' options to change the sound configuration."
      },
      {
        question: "What is a tape mod or foam mod?",
        answer: "These are modifications done to physical keyboards. A tape mod applies masking tape to the back of the PCB to boost deep clacks. A foam mod places foam in the chassis to absorb high frequencies and produce a deeper thock sound."
      }
    ],
    schemaType: "SoftwareApplication"
  },
  "how-to-improve-typing-speed": {
    h1: "How to Improve Typing Speed — Pro Typing Tips",
    intro: "Looking to boost your words per minute? Read our comprehensive guide on how to improve typing speed through structured exercises, proper hand postures, and satisfying typing practice.",
    detailsTitle: "Step-by-Step Training for Keyboard Speed",
    detailsContent: "To improve typing speed, you must focus on touch typing—the ability to type without looking at the keys. Practice daily, maintain good ergonomics, use a mechanical keyboard with switch sounds that suit your style, and analyze your error metrics to break past speed plateaus.",
    faqs: [
      {
        question: "What is the best way to improve typing speed?",
        answer: "The best way is touch typing practice. Use correct finger-to-key mapping, keep your wrist straight, practice consistently, and review accuracy stats to remove weak key links."
      },
      {
        question: "How long does it take to learn how to type faster?",
        answer: "Most typists notice significant speed gains in 2 to 4 weeks of consistent 15-minute daily practice sessions."
      }
    ],
    schemaType: "WebApplication"
  },
  "how-to-type-faster": {
    h1: "How to Type Faster — Master Keyboard Layouts",
    intro: "Learn how to type faster with our professional keyboard layouts guide. Build hand dexterity, practice optimal key travel paths, and track your WPM milestones.",
    detailsTitle: "Advanced Workflows for Developers and Typists",
    detailsContent: "Typing faster is a critical skill for programmers, writers, and students. By mastering touch typing and utilizing spatial sound cues, you can type fluently and reduce cognitive friction, allowing you to focus on logic and content creation.",
    faqs: [
      {
        question: "Can different keyboard switches help me type faster?",
        answer: "Yes. Light linear or tactile switches require less force, which can reduce hand fatigue and help increase your typing velocity over time."
      },
      {
        question: "What fingers go on which keys?",
        answer: "Your fingers should rest on the home row (ASDF for the left hand, JKL; for the right hand). Each finger is responsible for a vertical column of keys."
      }
    ],
    schemaType: "WebApplication"
  }
};

const LANDING_PAGES = [
  { slug: "/typing-test", label: "Typing Test" },
  { slug: "/wpm-test", label: "WPM Test" },
  { slug: "/mechanical-keyboard-typing-test", label: "Mechanical Keyboard Test" },
  { slug: "/typing-practice", label: "Typing Practice" },
  { slug: "/typing-speed-test", label: "Speed Test" },
  { slug: "/typing-accuracy-test", label: "Accuracy Test" },
  { slug: "/best-typing-website", label: "Best Typing Site" },
  { slug: "/best-mechanical-keyboard-sounds", label: "Keyboard Sounds" },
  { slug: "/how-to-improve-typing-speed", label: "Improve WPM" },
  { slug: "/how-to-type-faster", label: "Type Faster" }
];

export function SEOContent({ page }: { page: string }) {
  const data = SEO_PAGES_DATA[page] || SEO_PAGES_DATA.home;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thock.kzoldyk.workers.dev";
  const canonicalUrl = `${baseUrl}${page === "home" ? "" : `/${page}`}`;

  // Organization Schema
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    "name": "Thock",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "sameAs": [
      "https://github.com/kzoldyk/thock"
    ]
  };

  // WebSite Schema with SearchAction
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    "name": "Thock",
    "url": baseUrl,
    "publisher": { "@id": `${baseUrl}/#organization` },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/typing-test?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  // Software or Web Application Schema
  const appSchema = {
    "@context": "https://schema.org",
    "@type": data.schemaType,
    "@id": `${canonicalUrl}/#application`,
    "name": data.h1,
    "url": canonicalUrl,
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "All",
    "browserRequirements": "Requires JavaScript. Requires Web Audio API.",
    "softwareVersion": "1.0",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  // FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": data.faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  // Breadcrumb List Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      },
      ...(page !== "home" ? [{
        "@type": "ListItem",
        "position": 2,
        "name": data.h1,
        "item": canonicalUrl
      }] : [])
    ]
  };

  return (
    <section className="w-full max-w-4xl mx-auto px-6 py-12 md:py-20 border-t border-[var(--chrome-border)] mt-12 space-y-12 text-left relative z-10 select-text">
      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Main SEO Header */}
      <div className="space-y-4">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--foreground)]">
          {data.h1}
        </h1>
        <p className="text-xs md:text-sm text-[var(--muted)] leading-relaxed">
          {data.intro}
        </p>
      </div>

      {/* Feature Details section */}
      <div className="glass-panel p-6 rounded-2xl border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] space-y-3">
        <h2 className="text-sm md:text-base font-semibold text-[var(--foreground)]">
          {data.detailsTitle}
        </h2>
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          {data.detailsContent}
        </p>
      </div>

      {/* FAQ Section */}
      <div className="space-y-6">
        <h2 className="text-sm md:text-base font-semibold tracking-tight text-[var(--foreground)] border-b border-[var(--chrome-border)] pb-2 uppercase tracking-widest text-[10px]">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {data.faqs.map((faq, idx) => (
            <details
              key={idx}
              className="group glass-panel rounded-xl border border-[var(--chrome-border)] bg-[var(--chrome-surface-soft)] transition-colors duration-200 open:bg-[var(--chrome-surface)]"
            >
              <summary className="flex items-center justify-between p-4 text-xs font-semibold text-[var(--foreground)] cursor-pointer select-none focus:outline-none list-none">
                <span>{faq.question}</span>
                <span className="text-[var(--muted)] group-open:rotate-180 transition-transform duration-200 ml-2">
                  ↓
                </span>
              </summary>
              <div className="px-4 pb-4 text-xs text-[var(--muted)] leading-relaxed border-t border-[var(--chrome-border)] pt-3">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Footer Navigation & Internal Linking */}
      <div className="space-y-4 pt-4 border-t border-[var(--chrome-border)]">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
          Explore Typing Workspaces
        </h3>
        <nav className="flex flex-wrap gap-2">
          {LANDING_PAGES.map((link) => {
            const isActive = `/${page}` === link.slug || (page === "home" && link.slug === "/");
            return (
              <Link
                key={link.slug}
                href={link.slug}
                className={`px-3 py-1.5 rounded-full text-[10px] font-medium border transition-all duration-300 ${
                  isActive
                    ? "bg-[var(--foreground)] text-[var(--background)] border-transparent"
                    : "bg-[var(--chrome-surface-soft)] text-[var(--muted)] border-[var(--chrome-border)] hover:text-[var(--foreground)] hover:bg-[var(--chrome-surface)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {page !== "home" && (
            <Link
              href="/"
              className="px-3 py-1.5 rounded-full text-[10px] font-medium border bg-[var(--chrome-surface-soft)] text-[var(--muted)] border-[var(--chrome-border)] hover:text-[var(--foreground)] hover:bg-[var(--chrome-surface)]"
            >
              Home Page
            </Link>
          )}
        </nav>
      </div>
    </section>
  );
}
