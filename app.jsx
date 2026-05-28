/* global React, ReactDOM, TweaksPanel, useTweaks, TweakSection, TweakColor, TweakRadio, TweakToggle, TweakSlider */
const { useState, useEffect, useRef, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#b3121a",
  "headlineVariant": "global",
  "telemetry": true,
  "leaderboardSpeed": 2200
} /*EDITMODE-END*/;

// ============ DATA ============
const HEADLINE_VARIANTS = {
  global: { line1: "THE GLOBAL RANKING", line2: "SYSTEM FOR RACING", tag: "MOTORSPORT × SIM × KARTING" },
  proving: { line1: "WHERE LAP TIMES", line2: "BECOME CAREERS", tag: "DRIVER RATING INDEX · EST. 2026" },
  metric: { line1: "EVERY APEX.", line2: "EVERY SECTOR. RANKED.", tag: "ONE RATING ACROSS EVERY SURFACE" }
};

const DRIVERS = [
{ rank: 1, tag: "VRT-001", name: "M. KOVALAINEN", country: "FIN", flag: "🇫🇮", rating: 2847, delta: "+12", trend: "up", plat: "AC·KART" },
{ rank: 2, tag: "VRT-014", name: "L. ANDREOTTI", country: "ITA", flag: "🇮🇹", rating: 2812, delta: "+04", trend: "up", plat: "AC" },
{ rank: 3, tag: "VRT-007", name: "K. NAKAMURA", country: "JPN", flag: "🇯🇵", rating: 2790, delta: "−02", trend: "down", plat: "AC·EVO" },
{ rank: 4, tag: "VRT-022", name: "S. DAVIS", country: "GBR", flag: "🇬🇧", rating: 2761, delta: "+09", trend: "up", plat: "AC·KART" },
{ rank: 5, tag: "VRT-003", name: "R. FERREIRA", country: "BRA", flag: "🇧🇷", rating: 2748, delta: "+01", trend: "up", plat: "AC" },
{ rank: 6, tag: "VRT-031", name: "A. WEBER", country: "DEU", flag: "🇩🇪", rating: 2722, delta: "−05", trend: "down", plat: "AC·EVO" },
{ rank: 7, tag: "VRT-019", name: "C. VAN DER MEER", country: "NLD", flag: "🇳🇱", rating: 2705, delta: "+07", trend: "up", plat: "KART" },
{ rank: 8, tag: "VRT-045", name: "J. MARTÍNEZ", country: "ESP", flag: "🇪🇸", rating: 2683, delta: "+03", trend: "up", plat: "AC" },
{ rank: 9, tag: "VRT-012", name: "T. OLSEN", country: "DNK", flag: "🇩🇰", rating: 2670, delta: "00", trend: "flat", plat: "AC·KART" },
{ rank: 10, tag: "VRT-028", name: "H. CHEN", country: "AUS", flag: "🇦🇺", rating: 2654, delta: "−01", trend: "down", plat: "AC" }];


const STEPS = [
{ n: "01", title: "RACE", blurb: "Compete in sanctioned events, leagues, or open lobbies. Every stint logged with full telemetry — sectors, deltas, incidents, fuel." },
{ n: "02", title: "EARN POINTS", blurb: "Pace, cleanliness, and consistency feed the A54 rating. The system rewards drivers who finish — not just those who push the limit." },
{ n: "03", title: "IMPROVE RANKING", blurb: "Climb regional, national, and global boards. Your A54 number follows you across every game and karting venue you race at." },
{ n: "04", title: "GET NOTICED", blurb: "Teams, league owners, and event scouts pull from the index. A high-trust rating is a portfolio piece — not a screenshot." }];


const PLATFORMS = [
{ tag: "PC · LIVE", name: "ASSETTO CORSA COMPETIZIONE", sub: "Sim", status: "INTEGRATED", note: "Telemetry · ESL · LFM", bg: "tarmac" },
{ tag: "PC · 2026 Q3", name: "ASSETTO CORSA EVO", sub: "Sim", status: "PARTNER", note: "Direct API integration", bg: "evo" },
{ tag: "REAL WORLD", name: "KARTING", sub: "Outdoor", status: "VERIFIED", note: "Transponder + steward log", bg: "kart" },
{ tag: "MULTI-TITLE", name: "iRACING", sub: "Sim", status: "BETA", note: "Result import", bg: "iracing" }];


const PILLARS = [
{ k: "01", t: "OFFICIAL DRIVER INDEX", b: "A54 is a single, portable rating that follows a driver across every game, league, and physical venue they compete in. One number. Cross-disciplined." },
{ k: "02", t: "MEASURED, NOT MARKETED", b: "Pace, racecraft, and incident weight feed an open scoring model. No pay-to-rank, no curated highlight reel — just verified results." },
{ k: "03", t: "USED BY LEAGUES & EVENTS", b: "Tournament organisers gate entries by A54 rating, seed brackets, and pull receipts on driver history before signing." }];


// ============ SCROLL REVEAL ============
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ============ ATOMS ============
const Diamond = ({ children, size = 56, color }) =>
<div className="diamond" style={{ width: size, height: size, borderColor: color }}>
    <span style={{ color }}>{children}</span>
  </div>;


const Tick = ({ value, width = 4 }) => {
  // Renders a digit-like value as a fixed-width string
  const s = String(value).padStart(width, "0");
  return <span className="tick">{s}</span>;
};

const SectorBar = ({ sectors }) =>
<div className="sectors">
    {sectors.map((s, i) =>
  <span key={i} className={`sector s-${s}`} title={`S${i + 1}`} />
  )}
  </div>;


// ============ HERO ============
function Hero({ tw }) {
  const v = HEADLINE_VARIANTS[tw.headlineVariant] || HEADLINE_VARIANTS.global;
  const [time, setTime] = useState(0);
  useEffect(() => {
    if (!tw.telemetry) return;
    let raf,t0 = performance.now();
    const loop = (t) => {setTime((t - t0) / 1000);raf = requestAnimationFrame(loop);};
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tw.telemetry]);

  // Synthetic telemetry values
  const speed = Math.round(248 + Math.sin(time * 1.2) * 32 + Math.sin(time * 5) * 6);
  const rpm = Math.round(7800 + Math.sin(time * 2.4) * 1200);
  const gear = Math.max(1, Math.min(8, Math.round(4 + Math.sin(time * 0.5) * 3)));
  const lap = "1:32." + String(Math.floor(time * 100 % 1000)).padStart(3, "0").slice(0, 3);
  const delta = (Math.sin(time * 0.7) * 0.42).toFixed(3);
  const deltaSign = parseFloat(delta) >= 0 ? "+" : "";

  return (
    <section className="hero" data-screen-label="01 Hero">
      <div className="hero-grid" />
      <div className="hero-scanline" />
      <div className="hero-inner">
        <div className="hero-meta reveal">
          <span className="pill"><span className="pill-dot" /> A54 / DRIVER RATING INDEX</span>
          <span className="meta-dim">{v.tag}</span>
        </div>

        <h1 className="hero-h1 reveal">
          <span className="line">{v.line1}</span>
          <span className="line accented">{v.line2}</span>
        </h1>

        <p className="hero-sub reveal">
          Track your performance. Build your racing career. Compete globally —
          across sims, leagues, and real-world karting circuits.
        </p>

        <div className="hero-cta reveal">
          <a className="btn btn-primary" href="auth.html">
            <span>CREATE DRIVER PROFILE</span>
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 7h9M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" /></svg>
          </a>
          <a className="btn btn-ghost" href="#leaderboard">
            <span>VIEW RANKINGS</span>
          </a>
        </div>

        <div className="hero-stats stagger">
          <div className="hs reveal"><div className="hs-k">DRIVERS INDEXED</div><div className="hs-v"><Tick value={28412} width={5} /></div></div>
          <div className="hs reveal"><div className="hs-k">SANCTIONED EVENTS</div><div className="hs-v"><Tick value={1847} width={4} /></div></div>
          <div className="hs reveal"><div className="hs-k">COUNTRIES</div><div className="hs-v"><Tick value={94} width={2} /></div></div>
          <div className="hs reveal"><div className="hs-k">LAPS LOGGED · 24H</div><div className="hs-v"><Tick value={91204} width={5} /></div></div>
        </div>
      </div>

      {tw.telemetry &&
      <aside className="hero-tm reveal reveal-right">
          <div className="tm-head">
            <span className="tm-id">CAR · 47 / SECTOR · {Math.floor(time * 0.4 % 3) + 1}</span>
            <span className="tm-live"><span className="tm-live-dot" /> LIVE</span>
          </div>
          <div className="tm-row">
            <div className="tm-col tm-col-big">
              <div className="tm-k">SPEED · KPH</div>
              <div className="tm-v tm-v-xl">{speed}</div>
            </div>
            <div className="tm-col">
              <div className="tm-k">GEAR</div>
              <div className="tm-v tm-v-l">{gear}</div>
            </div>
          </div>
          <div className="tm-rpm">
            <div className="tm-rpm-bar" style={{ "--p": `${Math.min(100, rpm / 95)}%` }} />
            <div className="tm-rpm-ticks">
              {Array.from({ length: 16 }).map((_, i) => <span key={i} />)}
            </div>
            <div className="tm-rpm-num">{rpm} RPM</div>
          </div>
          <div className="tm-row">
            <div className="tm-col"><div className="tm-k">LAP</div><div className="tm-v">{lap}</div></div>
            <div className="tm-col"><div className="tm-k">DELTA</div><div className={"tm-v " + (parseFloat(delta) >= 0 ? "tm-up" : "tm-down")}>{deltaSign}{delta}</div></div>
            <div className="tm-col"><div className="tm-k">SECTORS</div><SectorBar sectors={["g", "g", "p"]} /></div>
          </div>
          <div className="tm-foot">
            <span>RATING DELTA · END OF STINT</span>
            <span className="tm-rating">+18 → 2,847</span>
          </div>
        </aside>
      }

      <div className="hero-foot">
        <span>↓ SCROLL · INDEX OVERVIEW</span>
        <span className="dim">A54 / v3.2 · BUILD 2026.05</span>
      </div>
    </section>);

}

// ============ WHAT IS GRI ============
function WhatIs() {
  return (
    <section className="section pillars" id="about" data-screen-label="02 What is A54">
      <div className="sec-head reveal">
        <span className="sec-tag">§ 02 · OVERVIEW</span>
        <h2 className="sec-h2">WHAT THE A54 INDEX IS</h2>
        <p className="sec-sub">
          A54 is the Driver Rating Index — an open, audited rating that quantifies how a driver actually performs across the entire racing spectrum.
        </p>
      </div>
      <div className="pillar-row stagger">
        {PILLARS.map((p) =>
        <article key={p.k} className="pillar reveal">
            <div className="pillar-k">{p.k}</div>
            <h3 className="pillar-t">{p.t}</h3>
            <p className="pillar-b">{p.b}</p>
            <div className="pillar-foot">
              <span className="pillar-line" />
              <span className="pillar-cta">READ SPEC →</span>
            </div>
          </article>
        )}
      </div>
    </section>);

}

// ============ HOW IT WORKS ============
function HowItWorks() {
  return (
    <section className="section how" id="how" data-screen-label="03 How it works">
      <div className="sec-head sec-head-row reveal">
        <div>
          <span className="sec-tag">§ 03 · PROCESS</span>
          <h2 className="sec-h2">RACE. EARN. CLIMB. <span className="dim">GET NOTICED.</span></h2>
        </div>
        <p className="sec-sub-r">
          A simple loop, with serious accounting underneath it. Every event is verified before it touches your rating.
        </p>
      </div>
      <ol className="steps stagger">
        {STEPS.map((s, i) =>
        <li key={s.n} className="step reveal reveal-left">
            <div className="step-rail">
              <Diamond size={64}>{s.n}</Diamond>
              {i < STEPS.length - 1 && <span className="step-line" />}
            </div>
            <div className="step-body">
              <div className="step-t">{s.title}</div>
              <p className="step-b">{s.blurb}</p>
            </div>
          </li>
        )}
      </ol>
    </section>);

}

// ============ LEADERBOARD ============
function Leaderboard({ tw }) {
  const [rows, setRows] = useState(DRIVERS);
  const [region, setRegion] = useState("GLOBAL");
  const [pulse, setPulse] = useState(-1);

  // Periodic shimmer to imply live updates
  useEffect(() => {
    const id = setInterval(() => {
      const idx = Math.floor(Math.random() * rows.length);
      setPulse(idx);
      setTimeout(() => setPulse(-1), 700);
    }, tw.leaderboardSpeed);
    return () => clearInterval(id);
  }, [rows.length, tw.leaderboardSpeed]);

  const filtered = useMemo(() => {
    if (region === "GLOBAL") return rows;
    const map = { EU: ["GBR", "ITA", "DEU", "ESP", "NLD", "FIN", "DNK"], AM: ["BRA", "USA", "CAN", "ARG"], APAC: ["JPN", "AUS", "KOR", "SGP"] };
    return rows.filter((r) => (map[region] || []).includes(r.country));
  }, [rows, region]);

  return (
    <section className="section lb" id="leaderboard" data-screen-label="04 Leaderboard">
      <div className="sec-head sec-head-row reveal">
        <div>
          <span className="sec-tag"><span className="live-dot" /> § 04 · LIVE INDEX</span>
          <h2 className="sec-h2">TOP 10 · GLOBAL RANKING</h2>
        </div>
        <div className="lb-tabs">
          {["GLOBAL", "EU", "AM", "APAC"].map((r) =>
          <button key={r} className={"lb-tab " + (region === r ? "active" : "")} onClick={() => setRegion(r)}>{r}</button>
          )}
        </div>
      </div>

      <div className="lb-card reveal reveal-scale">
        <div className="lb-head">
          <span>RANK</span>
          <span>DRIVER</span>
          <span className="hide-s">PLATFORM</span>
          <span className="hide-s">FORM</span>
          <span>Δ 7d</span>
          <span className="ralign">RATING</span>
        </div>
        {filtered.map((d, i) =>
        <div key={d.tag} className={"lb-row " + (pulse === i ? "pulse " : "") + (i === 0 ? "lead" : "")}>
            <span className="lb-rank">
              <span className="lb-rank-n">{String(d.rank).padStart(2, "0")}</span>
              {i === 0 && <span className="lb-crown">P1</span>}
            </span>
            <span className="lb-driver">
              <span className="lb-flag">{d.flag}</span>
              <span className="lb-name">
                <span className="lb-name-1">{d.name}</span>
                <span className="lb-name-2">{d.tag} · {d.country}</span>
              </span>
            </span>
            <span className="lb-plat hide-s">{d.plat}</span>
            <span className="lb-form hide-s">
              {Array.from({ length: 8 }).map((_, j) => {
              const v = (i + j) % 4;
              const cl = v === 0 ? "fb fb-purple" : v === 1 ? "fb fb-green" : v === 2 ? "fb fb-yellow" : "fb fb-red";
              return <span key={j} className={cl} />;
            })}
            </span>
            <span className={"lb-delta lb-" + d.trend}>
              {d.trend === "up" ? "▲" : d.trend === "down" ? "▼" : "■"} {d.delta}
            </span>
            <span className="lb-rating ralign">{d.rating.toLocaleString()}</span>
          </div>
        )}
        {filtered.length === 0 &&
        <div className="lb-empty">No drivers in this region — yet.</div>
        }
        <div className="lb-foot">
          <span className="dim">Updated 00:00:0{Math.floor(Date.now() / 1000 % 9)} ago · ratings recalc every stint</span>
          <a className="lb-link" href="#">VIEW FULL INDEX →</a>
        </div>
      </div>
    </section>);

}

// ============ PLATFORMS ============
function Platforms() {
  return (
    <section className="section plats" id="platforms" data-screen-label="05 Platforms">
      <div className="sec-head sec-head-row reveal">
        <div>
          <span className="sec-tag">§ 05 · SUPPORTED SURFACES</span>
          <h2 className="sec-h2">WHERE A54 COUNTS</h2>
        </div>
        <p className="sec-sub-r">
          One driver number across every surface that matters — sim and tarmac alike.
        </p>
      </div>
      <div className="plat-grid stagger">
        {PLATFORMS.map((p) =>
        <article key={p.name} className={"plat reveal reveal-scale plat-" + p.bg}>
            <div className="plat-bg" />
            <div className="plat-meta">
              <span className="plat-tag">{p.tag}</span>
              <span className={"plat-status plat-" + p.status.toLowerCase()}>● {p.status}</span>
            </div>
            <div className="plat-name">
              <span className="plat-sub">{p.sub}</span>
              <h3>{p.name}</h3>
            </div>
            <div className="plat-foot">
              <span>{p.note}</span>
              <span className="plat-arrow">→</span>
            </div>
          </article>
        )}
      </div>
    </section>);

}

// ============ FINAL CTA ============
function FinalCTA() {
  return (
    <section className="section cta" id="register" data-screen-label="06 CTA">
      <div className="cta-card reveal">
        <div className="cta-grid" />
        <div className="cta-tape">
          <div className="cta-tape-track">
            {Array.from({ length: 5 }).map((_, i) =>
            <span key={i} style={{ fontSize: "28px" }}>A54 / RACE  RANK · REPEAT </span>
            )}
          </div>
        </div>
        <div className="cta-inner">
          <span className="sec-tag">§ 06 · SIGN IN</span>
          <h2 className="cta-h">START YOUR<br />RACING JOURNEY.</h2>
          <p className="cta-p">
            Claim your driver number. Begin logging stints. Get ranked alongside the rest of the grid in under five minutes.
          </p>
          <div className="hero-cta">
            <a className="btn btn-primary btn-lg" href="auth.html">
              <span>CREATE DRIVER PROFILE</span>
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 7h9M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" /></svg>
            </a>
            <a className="btn btn-ghost btn-lg" href="#">
              <span>FOR LEAGUE ORGANISERS</span>
            </a>
          </div>
          <div className="cta-meta">
            <span>FREE TIER · NO CARD</span>
            <span>·</span>
            <span>VERIFIED IN ≤24H</span>
            <span>·</span>
            <span>YOUR DATA · EXPORTABLE</span>
          </div>
        </div>
      </div>
    </section>);

}

// ============ NAV / FOOTER ============
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={"nav " + (scrolled ? "nav-scrolled" : "")}>
      <a className="nav-brand" href="#">
        <img src="assets/a54-logo-dark.png" alt="A54" />
        <span className="nav-brand-text">
          <span className="nav-brand-2">GLOBAL RACING INDEX</span>
        </span>
      </a>
      <nav className="nav-links">
        <a href="#about">Index</a>
        <a href="#how">How it works</a>
        <a href="#leaderboard">Rankings</a>
        <a href="#platforms">Platforms</a>
        <a href="#register">Sign in</a>
      </nav>
      <div className="nav-cta">
        <a className="btn btn-mini btn-ghost" href="auth.html">LOG IN</a>
        <a className="btn btn-mini btn-primary" href="auth.html">CREATE PROFILE</a>
      </div>
    </header>);

}

function Footer() {
  return (
    <footer className="foot">
      <div className="foot-top">
        <div className="foot-brand">
          <img src="assets/a54-logo-dark.png" alt="A54" />
          <p>The Driver Rating Index. An open framework for measuring competitive driving across simulation and physical motorsport.</p>
        </div>
        <div className="foot-cols">
          <div><div className="foot-h">PLATFORM</div><a>Index spec</a><a>Methodology</a><a>API</a><a>Status</a></div>
          <div><div className="foot-h">COMPETE</div><a>Find a league</a><a>Open events</a><a>Karting circuits</a><a>Calendar</a></div>
          <div><div className="foot-h">DRIVERS</div><a>Create profile</a><a>Verification</a><a>Account</a><a>Privacy</a></div>
          <div><div className="foot-h">CONTACT</div><a>League partners</a><a>Press kit</a><a>support@a54.racing</a></div>
        </div>
      </div>
      <div className="foot-bottom">
        <span>© 2026 A54 RACING / DRIVER RATING INDEX. All rights reserved.</span>
        <span className="dim">v3.2 · BUILD 2026.05 · INDEX OPERATIONAL</span>
      </div>
    </footer>);

}

// ============ TWEAKS ============
function AppTweaks({ tw, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Brand">
        <TweakColor
          label="Accent"
          value={tw.accent}
          onChange={(v) => setTweak("accent", v)}
          options={["#b3121a", "#7a0a0a", "#ff3b00", "#e0a020", "#1a8cff"]} />
        
      </TweakSection>
      <TweakSection title="Hero">
        <TweakRadio
          label="Headline"
          value={tw.headlineVariant}
          onChange={(v) => setTweak("headlineVariant", v)}
          options={[
          { value: "global", label: "Global" },
          { value: "proving", label: "Career" },
          { value: "metric", label: "Metric" }]
          } />
        
        <TweakToggle label="Telemetry HUD" value={tw.telemetry} onChange={(v) => setTweak("telemetry", v)} />
      </TweakSection>
      <TweakSection title="Leaderboard">
        <TweakSlider label="Pulse interval (ms)" min={800} max={5000} step={100} value={tw.leaderboardSpeed} onChange={(v) => setTweak("leaderboardSpeed", v)} />
      </TweakSection>
    </TweaksPanel>);

}

// ============ APP ============
function App() {
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  // Apply accent live
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", tw.accent);
  }, [tw.accent]);
  useReveal();
  return (
    <>
      <Nav />
      <Hero tw={tw} />
      <WhatIs />
      <HowItWorks />
      <Leaderboard tw={tw} />
      <Platforms />
      <FinalCTA />
      <Footer />
      <AppTweaks tw={tw} setTweak={setTweak} />
    </>);

}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);