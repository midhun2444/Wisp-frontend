import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles, Shield, Globe2, Zap, Lock, Users, Ban, Smartphone,
  Send, Smile, Flag, SkipForward, X, Check, ChevronRight, Menu,
  MessageCircle, ShieldCheck, MapPin, ArrowRight,
  User, Calendar, Globe, Shuffle, Search, ChevronDown
} from "lucide-react";
/*
  socket.io-client — NOT in Claude.ai's supported artifact library list.
  This import will fail to resolve in the in-chat live preview, so this
  file will likely stop rendering here once wired up. It's written as
  real source for an actual React project (Vite/CRA/Next.js) — run
  `npm install socket.io-client` there and it works as intended.
*/
import { io } from "socket.io-client";

/*
  BACKEND_URL — placeholder. Swap this for your deployed backend's real
  URL (the wisp-backend project) once it's live, e.g.
  "https://wisp-backend.up.railway.app".
*/
const BACKEND_URL = "https://your-backend-url.example.com";

/*
  One socket connection for the whole app, created lazily so it doesn't
  try to connect until something actually needs it. autoConnect:false
  means nothing happens over the network until connectSocket() is called.
*/
let socket = null;
function getSocket() {
  if (!socket) {
    socket = io(BACKEND_URL, { autoConnect: false, transports: ["websocket"] });
  }
  return socket;
}

/* ---------------------------------------------------------
   WISP — frontend demo
   Design tokens (from brief, followed exactly):
   primary #6C63FF · secondary #8B5CF6 · accent #00E5FF
   success #22C55E · bg #050816 · glass rgba(255,255,255,.08)
   text #FFFFFF · muted #BFC7D5

   IMPORTANT — what's real vs. mocked in this build:
   - All UI, layout, animation, and flow below is fully built.
   - "Matching" is simulated client-side (no live strangers) —
     there's no persistent server in this environment to pair
     two real people, so it connects you to a scripted demo
     partner after a realistic searching sequence.
   - The age gate is a placeholder for a real ID/liveness
     verification step (e.g. Persona/Veriff) — see the comment
     above <AgeGate/> for exactly where that integration goes.
   - A real deployment needs accounts + a moderation/report
     pipeline before the matching backend goes live — noted
     inline where relevant.
--------------------------------------------------------- */

const COLORS = {
  primary: "#2563EB",
  secondary: "#4F7CFF",
  deep: "#0F2E99",
  accent: "#06B6D4",
  ice: "#7DD3FC",
  success: "#16A34A",
  bg: "#F7FAFF",
  glass: "rgba(255,255,255,0.72)",
  text: "#0A1730",
  muted: "#59698A",
};

const INTERESTS = [
  "Movies", "Music", "Gaming", "Coding", "Travel", "Sports",
  "Anime", "Food", "Technology", "Books", "Photography", "Fitness",
];

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina",
  "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados",
  "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina",
  "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia",
  "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia",
  "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini",
  "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana",
  "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras",
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo",
  "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya",
  "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives",
  "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia",
  "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
  "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea",
  "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama",
  "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania",
  "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines",
  "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia",
  "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
  "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname",
  "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste",
  "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda",
  "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

const STATE_DATA = {
  "Argentina": ["Buenos Aires", "Buenos Aires City", "Catamarca", "Chaco", "Chubut", "Corrientes", "Córdoba", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"],
  "Australia": ["Australian Capital Territory", "New South Wales", "Northern Territory", "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia"],
  "Brazil": ["Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal", "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul", "Minas Gerais", "Paraná", "Paraíba", "Pará", "Pernambuco", "Piauí", "Rio Grande do Norte", "Rio Grande do Sul", "Rio de Janeiro", "Rondônia", "Roraima", "Santa Catarina", "Sergipe", "São Paulo", "Tocantins"],
  "Canada": ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon"],
  "Egypt": ["Alexandria", "Aswan", "Asyut", "Beheira", "Cairo", "Dakahlia", "Faiyum", "Gharbia", "Giza", "Luxor", "Minya", "Port Said", "Qalyubia", "Sharqia", "Sohag", "Suez"],
  "France": ["Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Brittany", "Centre-Val de Loire", "Corsica", "Grand Est", "Hauts-de-France", "Normandy", "Nouvelle-Aquitaine", "Occitanie", "Pays de la Loire", "Provence-Alpes-Côte d'Azur", "Île-de-France"],
  "Germany": ["Baden-Württemberg", "Bavaria", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hesse", "Lower Saxony", "Mecklenburg-Vorpommern", "North Rhine-Westphalia", "Rhineland-Palatinate", "Saarland", "Saxony", "Saxony-Anhalt", "Schleswig-Holstein", "Thuringia"],
  "India": ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"],
  "Indonesia": ["Aceh", "Bali", "Banten", "Bengkulu", "Central Java", "Central Kalimantan", "Central Sulawesi", "East Java", "East Kalimantan", "East Nusa Tenggara", "Gorontalo", "Jakarta", "Jambi", "Lampung", "Maluku", "North Kalimantan", "North Maluku", "North Sulawesi", "North Sumatra", "Papua", "Riau", "Riau Islands", "South Kalimantan", "South Sulawesi", "South Sumatra", "Southeast Sulawesi", "West Java", "West Kalimantan", "West Nusa Tenggara", "West Papua", "West Sulawesi", "West Sumatra", "Yogyakarta"],
  "Italy": ["Abruzzo", "Aosta Valley", "Apulia", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardy", "Marche", "Molise", "Piedmont", "Sardinia", "Sicily", "Trentino-Alto Adige", "Tuscany", "Umbria", "Veneto"],
  "Japan": ["Aichi", "Akita", "Aomori", "Chiba", "Ehime", "Fukui", "Fukuoka", "Fukushima", "Gifu", "Gunma", "Hiroshima", "Hokkaido", "Hyogo", "Ibaraki", "Ishikawa", "Iwate", "Kagawa", "Kagoshima", "Kanagawa", "Kochi", "Kumamoto", "Kyoto", "Mie", "Miyagi", "Miyazaki", "Nagano", "Nagasaki", "Nara", "Niigata", "Oita", "Okayama", "Okinawa", "Osaka", "Saga", "Saitama", "Shiga", "Shimane", "Shizuoka", "Tochigi", "Tokushima", "Tokyo", "Tottori", "Toyama", "Wakayama", "Yamagata", "Yamaguchi", "Yamanashi"],
  "Kenya": ["Bungoma", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kisii", "Kisumu", "Machakos", "Meru", "Mombasa", "Nairobi", "Nakuru", "Nyeri", "Uasin Gishu"],
  "Malaysia": ["Johor", "Kedah", "Kelantan", "Kuala Lumpur", "Labuan", "Malacca", "Negeri Sembilan", "Pahang", "Penang", "Perak", "Perlis", "Putrajaya", "Sabah", "Sarawak", "Selangor", "Terengganu"],
  "Mexico": ["Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua", "Coahuila", "Colima", "Durango", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Mexico City", "Michoacán", "Morelos", "México", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"],
  "Nigeria": ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Federal Capital Territory", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"],
  "Pakistan": ["Azad Kashmir", "Balochistan", "Gilgit-Baltistan", "Islamabad Capital Territory", "Khyber Pakhtunkhwa", "Punjab", "Sindh"],
  "Philippines": ["Bangsamoro", "Bicol Region", "Cagayan Valley", "Calabarzon", "Caraga", "Central Luzon", "Central Visayas", "Cordillera Administrative Region", "Davao Region", "Eastern Visayas", "Ilocos Region", "Mimaropa", "National Capital Region", "Northern Mindanao", "Soccsksargen", "Western Visayas", "Zamboanga Peninsula"],
  "South Africa": ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape"],
  "South Korea": ["Busan", "Daegu", "Daejeon", "Gangwon", "Gwangju", "Gyeonggi", "Incheon", "Jeju", "North Chungcheong", "North Gyeongsang", "North Jeolla", "Sejong", "Seoul", "South Chungcheong", "South Gyeongsang", "South Jeolla", "Ulsan"],
  "Spain": ["Andalusia", "Aragon", "Asturias", "Balearic Islands", "Basque Country", "Canary Islands", "Cantabria", "Castile and León", "Castilla-La Mancha", "Catalonia", "Extremadura", "Galicia", "La Rioja", "Madrid", "Murcia", "Navarre", "Valencia"],
  "United Arab Emirates": ["Abu Dhabi", "Ajman", "Dubai", "Fujairah", "Ras Al Khaimah", "Sharjah", "Umm Al Quwain"],
  "United Kingdom": ["England", "Northern Ireland", "Scotland", "Wales"],
  "United States": ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"],
};

const SEARCH_LINES = [
  "Finding someone worth talking to…",
  "Scanning the globe…",
  "Matching your interests…",
  "Almost there…",
];

/* WISP brand mark — embedded as a data URI so it renders standalone
   with no external hosting dependency. */
const LOGO_ICON = "data:image/png;base64,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";

/* ---------- animation helpers ---------- */
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`reveal ${shown ? "reveal-on" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function useTilt() {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateX(${-py * 8}deg) rotateY(${px * 8}deg) translateY(-6px)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "";
  };
  return { ref, onMouseMove: onMove, onMouseLeave: onLeave };
}

function ripple(e) {
  const btn = e.currentTarget;
  const r = btn.getBoundingClientRect();
  const circle = document.createElement("span");
  const size = Math.max(r.width, r.height);
  circle.className = "ripple-el";
  circle.style.width = circle.style.height = `${size}px`;
  circle.style.left = `${e.clientX - r.left - size / 2}px`;
  circle.style.top = `${e.clientY - r.top - size / 2}px`;
  btn.appendChild(circle);
  setTimeout(() => circle.remove(), 650);
}

function Magnetic({ children, className = "", ...props }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.25;
    const y = (e.clientY - r.top - r.height / 2) * 0.35;
    el.style.transform = `translate(${x}px, ${y}px)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };
  return (
    <span
      ref={ref}
      className={`magnetic-wrap ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      {...props}
    >
      {children}
    </span>
  );
}


function ScrollProgress() {
  const barRef = useRef(null);
  const ticking = useRef(false);
  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
        if (barRef.current) barRef.current.style.width = `${pct}%`;
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div ref={barRef} className="scroll-progress" />;
}

function AuroraField() {
  const glowRef = useRef(null);
  const ticking = useRef(false);
  const particles = useRef(
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 3 + 0.6,
      dur: Math.random() * 16 + 10,
      delay: Math.random() * 10,
      drift: Math.random() * 30 - 15,
    }))
  ).current;

  useEffect(() => {
    const onMove = (e) => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        if (glowRef.current) {
          glowRef.current.style.left = `${(e.clientX / window.innerWidth) * 100}%`;
          glowRef.current.style.top = `${(e.clientY / window.innerHeight) * 100}%`;
        }
        ticking.current = false;
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="wisp-bg" aria-hidden="true">
      <div className="aurora aurora-a" />
      <div className="aurora aurora-b" />
      <div className="aurora aurora-c" />
      <div ref={glowRef} className="cursor-glow" style={{ left: "50%", top: "50%" }} />
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            "--drift": `${p.drift}px`,
          }}
        />
      ))}
      <div className="grain" />
    </div>
  );
}

/* ---------- flowing wave divider ---------- */
function WaveDivider() {
  return (
    <div className="wave-divider" aria-hidden="true">
      <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="wave-svg wave-svg-3">
        <path d="M0,30 C300,0 600,60 900,30 C1200,0 1500,60 1800,30 L1800,60 L0,60 Z" />
      </svg>
      <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="wave-svg wave-svg-1">
        <path d="M0,30 C200,60 400,0 600,30 C800,60 1000,0 1200,30 C1400,60 1600,0 1800,30 L1800,60 L0,60 Z" />
      </svg>
      <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="wave-svg wave-svg-2">
        <path d="M0,30 C200,0 400,60 600,30 C800,0 1000,60 1200,30 C1400,0 1600,60 1800,30 L1800,60 L0,60 Z" />
      </svg>
    </div>
  );
}


function Nav({ onStart, page, setPage }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const links = [
    ["Home", "home"],
    ["About", "about"],
    ["Contact Us", "contact"],
    ["Privacy Policy", "privacy"],
    ["Report Abuse", "report"],
  ];

  return (
    <header className={`wisp-nav ${scrolled ? "wisp-nav--scrolled" : ""}`}>
      <div className="wisp-nav-inner">
        <button className="wisp-logo" onClick={() => setPage("home")}>
          <span className="wisp-logo-mark">
            <img src={LOGO_ICON} alt="WISP" />
          </span>
          WISP
        </button>

        <nav className="wisp-nav-links">
          {links.map(([label, key]) => (
            <button
              key={key}
              className={`wisp-nav-link ${page === key ? "active" : ""}`}
              onClick={() => setPage(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="wisp-nav-right">
          <Magnetic>
            <button
              className="btn btn-primary btn-shine"
              onClick={(e) => {
                ripple(e);
                onStart();
              }}
            >
              Start Chat
            </button>
          </Magnetic>
          <button className="wisp-menu-btn" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="wisp-nav-mobile">
          {links.map(([label, key]) => (
            <button
              key={key}
              className="wisp-nav-mobile-link"
              onClick={() => {
                setPage(key);
                setOpen(false);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

/* ---------------------------- Hero ---------------------------- */
/**
 * useLiveOnlineCount — the ONLY source for the "people online" number.
 * Starts at 0 (honest default before the socket connects), and updates
 * only from the backend's real "online-count" broadcast — see
 * broadcastOnlineCount() in server.js, which counts actual connected
 * sockets. Never estimated, never padded.
 */
function useLiveOnlineCount() {
  const [count, setCount] = useState(0);
  const [displayed, setDisplayed] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    const s = getSocket();
    const handle = (n) => setCount(typeof n === "number" ? n : 0);
    s.on("online-count", handle);
    return () => s.off("online-count", handle);
  }, []);

  // Smoothly animate toward the real count when it changes, rather than
  // snapping — purely cosmetic, the target value itself is always real.
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    const from = displayed;
    const to = count;
    if (from === to) return;
    const start = performance.now();
    const duration = 500;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setDisplayed(Math.round(from + (to - from) * p));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  return displayed.toLocaleString();
}

function Hero({ onStart }) {
  const onlineCount = useLiveOnlineCount();
  const orbRef = useRef(null);
  const ticking = useRef(false);
  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        if (orbRef.current) {
          const y = Math.min(window.scrollY, 400) * 0.18;
          orbRef.current.style.setProperty("--py", `${y}px`);
        }
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="hero">
      <div className="hero-badge reveal reveal-on">
        <span className="dot-pulse" />
        {onlineCount} people online right now
      </div>
      <h1 className="hero-title reveal reveal-on" style={{ transitionDelay: "80ms" }}>
        Meet New People
        <br />
        <span className="hero-title-gradient">Across the World</span>
      </h1>
      <p className="hero-sub reveal reveal-on" style={{ transitionDelay: "160ms" }}>
        Chat anonymously with real people worldwide.
        <br className="hero-sub-break" />
        No login. No payments. Just genuine conversations.
      </p>
      <div className="hero-actions reveal reveal-on" style={{ transitionDelay: "240ms" }}>
        <Magnetic>
          <button className="btn btn-primary btn-shine btn-lg" onClick={(e) => { ripple(e); onStart(); }}>
            Start Chat <ArrowRight size={18} />
          </button>
        </Magnetic>
        <Magnetic>
          <button
            className="btn btn-ghost btn-lg"
            onClick={(e) => {
              ripple(e);
              document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            Learn More
          </button>
        </Magnetic>
      </div>
      <div className="hero-orb" ref={orbRef} />
    </section>
  );
}

/* ---------------------------- Features ---------------------------- */
const FEATURES = [
  { icon: Sparkles, title: "Completely Free", desc: "No subscriptions, no hidden costs — ever." },
  { icon: Users, title: "No Login Required", desc: "Start talking in seconds, no account needed." },
  { icon: MessageCircle, title: "Anonymous Chat", desc: "Your identity stays yours, always." },
  { icon: Globe2, title: "Worldwide Users", desc: "Meet people from every corner of the globe." },
  { icon: Lock, title: "Encrypted Messages", desc: "Conversations are encrypted in transit." },
  { icon: Zap, title: "Fast Matching", desc: "Get paired with someone in moments." },
  { icon: Shield, title: "Privacy Focused", desc: "Minimal data, maximum discretion." },
  { icon: Ban, title: "Report & Block", desc: "One tap to report or block anyone." },
  { icon: ShieldCheck, title: "Safe Community", desc: "Verified accounts and active moderation." },
  { icon: Smartphone, title: "Mobile Friendly", desc: "Built beautifully for every screen." },
];

function FeatureCard({ f, i }) {
  const tilt = useTilt();
  return (
    <Reveal delay={i * 60}>
      <div className="feature-card-outer" ref={tilt.ref} onMouseMove={tilt.onMouseMove} onMouseLeave={tilt.onMouseLeave}>
        <div
          className="feature-card"
          style={{ animationDelay: `${(i % 5) * 0.4}s` }}
        >
          <div className="feature-icon">
            <f.icon size={20} strokeWidth={2} />
          </div>
          <h3>{f.title}</h3>
          <p>{f.desc}</p>
        </div>
      </div>
    </Reveal>
  );
}

function Features() {
  return (
    <section className="section" id="features">
      <Reveal>
        <div className="section-head">
          <span className="eyebrow">Why WISP</span>
          <h2 className="section-title">Everything you need, nothing you don't</h2>
        </div>
      </Reveal>
      <div className="feature-grid">
        {FEATURES.map((f, i) => (
          <FeatureCard f={f} i={i} key={f.title} />
        ))}
      </div>
    </section>
  );
}

/* ---------------------------- How it works ---------------------------- */
function HowItWorks() {
  const steps = [
    { n: "01", title: "Tell us a little about you", desc: "Name, age, gender, and where you're from." },
    { n: "02", title: "Pick your interests", desc: "Movies, gaming, travel, coding — whatever you're into." },
    { n: "03", title: "Choose who to meet", desc: "Match with a boy, a girl, or leave it to chance." },
    { n: "04", title: "We find your match", desc: "A quick search, then you're connected." },
  ];
  return (
    <section className="section" id="how-it-works">
      <Reveal>
        <div className="section-head">
          <span className="eyebrow">How it works</span>
          <h2 className="section-title">Four steps to your next conversation</h2>
        </div>
      </Reveal>
      <div className="timeline">
        {steps.map((s, i) => (
          <Reveal delay={i * 90} key={s.n}>
            <div className="timeline-step">
              <div className="timeline-num">{s.n}</div>
              <div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------- About ---------------------------- */
function About() {
  return (
    <section className="section section-narrow">
      <span className="eyebrow">About WISP</span>
      <h2 className="section-title">Strangers, until you talk to them</h2>
      <p className="body-text">
        WISP exists to help people from around the world find each other through kind,
        meaningful, anonymous conversation. No feeds to scroll, no followers to chase —
        just two people, talking. We built WISP for the moments when you want to hear
        a genuinely new perspective, practice a language, or just not feel alone at
        2am with someone who happens to be awake on the other side of the planet.
      </p>
      <p className="body-text">
        Anonymity is the point, but safety is the foundation. Every account on WISP is
        verified before it can chat, every conversation can be reported in one tap, and
        our team reviews reports quickly. Freedom to connect and responsibility to
        protect aren't in tension here — we designed WISP so both are true at once.
      </p>
    </section>
  );
}

/* ---------------------------- Contact ---------------------------- */
function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <section className="section section-narrow">
      <span className="eyebrow">Contact Us</span>
      <h2 className="section-title">Get in touch</h2>
      {sent ? (
        <div className="glass-card success-card">
          <Check size={22} />
          <p>Message sent. We'll get back to you soon.</p>
        </div>
      ) : (
        <form
          className="glass-card form-card"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <label>
            Name
            <input required placeholder="Your name" />
          </label>
          <label>
            Email
            <input required type="email" placeholder="you@example.com" />
          </label>
          <label>
            Message
            <textarea required rows={4} placeholder="How can we help?" />
          </label>
          <button className="btn btn-primary btn-shine" type="submit">
            Send Message
          </button>
        </form>
      )}
    </section>
  );
}

/* ---------------------------- Privacy ---------------------------- */
function Privacy() {
  const items = [
    ["No login required", "You can chat without creating a traditional profile-facing account."],
    ["Minimal data collection", "We collect only what's needed to verify age and keep the community safe."],
    ["Encrypted in transit", "Messages are encrypted between you and your match."],
    ["Anonymous by default", "Other users never see your real name unless you choose to share it."],
  ];
  return (
    <section className="section section-narrow">
      <span className="eyebrow">Privacy Policy</span>
      <h2 className="section-title">Your privacy, respected</h2>
      <div className="policy-list">
        {items.map(([t, d]) => (
          <div className="policy-item" key={t}>
            <ShieldCheck size={18} />
            <div>
              <h4>{t}</h4>
              <p>{d}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------- Report Abuse ---------------------------- */
function ReportAbuse() {
  const [sent, setSent] = useState(false);
  const reasons = ["Spam", "Harassment", "Hate Speech", "Scam", "Inappropriate Content", "Other"];
  return (
    <section className="section section-narrow">
      <span className="eyebrow">Report Abuse</span>
      <h2 className="section-title">Help us keep WISP safe</h2>
      {sent ? (
        <div className="glass-card success-card">
          <Check size={22} />
          <p>Report received. Our team will review it shortly.</p>
        </div>
      ) : (
        <form
          className="glass-card form-card"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <label>
            Reason
            <select required defaultValue="">
              <option value="" disabled>Select a reason</option>
              {reasons.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label>
            Details
            <textarea required rows={4} placeholder="Tell us what happened" />
          </label>
          <button className="btn btn-primary btn-shine" type="submit">
            Submit Report
          </button>
        </form>
      )}
    </section>
  );
}

/* ---------------------------- Footer ---------------------------- */
function Footer({ setPage }) {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="wisp-logo">
          <span className="wisp-logo-mark">
            <img src={LOGO_ICON} alt="WISP" />
          </span>
          WISP
        </div>
        <div className="footer-links">
          <button onClick={() => setPage("privacy")}>Privacy Policy</button>
          <button onClick={() => setPage("contact")}>Contact</button>
          <button onClick={() => setPage("about")}>About</button>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 WISP. All Rights Reserved.</span>
      </div>
    </footer>
  );
}

/* ============================================================
   ONBOARDING FLOW
   ============================================================ */

function ProgressDots({ step, total }) {
  return (
    <div className="progress-dots">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`progress-dot ${i <= step ? "on" : ""}`} />
      ))}
    </div>
  );
}

/* Searchable country picker — 196 countries is too many for a plain
   <select>, so this gives a search box to filter down to one quickly. */
function CountrySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rect, setRect] = useState(null);
  const wrapRef = useRef(null);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);

  const openPanel = () => {
    const r = triggerRef.current.getBoundingClientRect();
    setRect(r);
    setOpen(true);
  };

  useEffect(() => {
    const onDocClick = (e) => {
      const inTrigger = wrapRef.current && wrapRef.current.contains(e.target);
      const inPanel = panelRef.current && panelRef.current.contains(e.target);
      if (!inTrigger && !inPanel) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 10);
  }, [open]);

  const filtered = query
    ? COUNTRIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()))
    : COUNTRIES;

  const pick = (c) => {
    onChange(c);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className={`country-select ${open ? "open" : ""}`} ref={wrapRef}>
      <button
        type="button"
        ref={triggerRef}
        className="country-select-trigger"
        onClick={() => (open ? setOpen(false) : openPanel())}
      >
        <span className={value ? "" : "country-placeholder"}>{value || "Select"}</span>
        <ChevronDown size={15} className="country-select-chevron" />
      </button>
      {open && rect && createPortal(
        <div
          className="country-select-panel"
          ref={panelRef}
          style={{ position: "fixed", top: rect.bottom + 8, left: rect.left, width: rect.width }}
        >
          <div className="country-search-wrap">
            <Search size={14} />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search countries…"
            />
          </div>
          <div className="country-list">
            {filtered.length === 0 && <div className="country-empty">No matches</div>}
            {filtered.map((c) => (
              <button
                key={c}
                type="button"
                className={`country-item ${c === value ? "on" : ""}`}
                onClick={() => pick(c)}
              >
                {c}
                {c === value && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/*
  StateSelect — validates against a real list of states/provinces when
  we have one for the selected country (23 major countries, 482 real
  entries — see STATE_DATA above). For any other country, there's no
  reliable offline dataset to validate against, so it honestly falls
  back to free text rather than pretending to validate something it
  can't. Full city-level validation worldwide isn't feasible without a
  paid geocoding API (Google Places, etc.) — that's a separate,
  optional integration, not something that can be embedded for free.
*/
function StateSelect({ country, value, onChange }) {
  const options = STATE_DATA[country];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 10);
  }, [open]);

  if (!options) {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={country ? "Optional — type your state/region" : "Select a country first"}
      />
    );
  }

  const filtered = query
    ? options.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : options;

  const pick = (s) => {
    onChange(s);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className={`country-select ${open ? "open" : ""}`} ref={wrapRef}>
      <button type="button" className="country-select-trigger" onClick={() => setOpen((v) => !v)}>
        <span className={value ? "" : "country-placeholder"}>{value || "Optional — select"}</span>
        <ChevronDown size={15} className="country-select-chevron" />
      </button>
      {open && (
        <div className="country-select-panel">
          <div className="country-search-wrap">
            <Search size={14} />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
            />
          </div>
          <div className="country-list">
            {filtered.length === 0 && <div className="country-empty">No matches</div>}
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                className={`country-item ${s === value ? "on" : ""}`}
                onClick={() => pick(s)}
              >
                {s}
                {s === value && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StepProfile({ data, setData, onNext, onClose }) {
  const ageNum = Number(data.age);
  const ageEntered = data.age !== "" && data.age != null;
  const ageValid = ageEntered && Number.isFinite(ageNum) && ageNum >= 18;
  const underage = ageEntered && Number.isFinite(ageNum) && ageNum < 18;
  const valid = data.name && ageValid && data.gender && data.country;
  const fields = [
    {
      key: "name", label: "Name", icon: User,
      node: (
        <input
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          placeholder="First name"
        />
      ),
    },
    {
      key: "age", label: "Age", icon: Calendar,
      node: (
        <input
          type="number" min={18}
          value={data.age}
          onChange={(e) => setData({ ...data, age: e.target.value })}
          placeholder="18+"
        />
      ),
    },
    {
      key: "gender", label: "Gender", icon: Users,
      node: (
        <select value={data.gender} onChange={(e) => setData({ ...data, gender: e.target.value })}>
          <option value="">Select</option>
          <option>Male</option>
          <option>Female</option>
          <option>Non-binary</option>
          <option>Prefer not to say</option>
        </select>
      ),
    },
    {
      key: "country", label: "Country", icon: Globe,
      node: (
        <CountrySelect
          value={data.country}
          onChange={(c) => setData({ ...data, country: c, state: "" })}
        />
      ),
    },
    {
      key: "state", label: "State / Region", icon: MapPin,
      node: (
        <StateSelect
          country={data.country}
          value={data.state}
          onChange={(s) => setData({ ...data, state: s })}
        />
      ),
    },
    {
      key: "place", label: "Place / City", icon: MapPin,
      node: (
        <input
          value={data.place}
          onChange={(e) => setData({ ...data, place: e.target.value })}
          placeholder="Optional"
        />
      ),
    },
  ];

  return (
    <div className="modal-card profile-card">
      <button className="modal-close" onClick={onClose}><X size={18} /></button>
      <div className="profile-hero">
        <div className="profile-hero-blob" />
        <div className="profile-hero-badge">
          <User size={22} />
        </div>
      </div>
      <ProgressDots step={0} total={5} />
      <h2 className="modal-title">Tell us a bit about you</h2>
      <p className="modal-sub">This stays between you and WISP.</p>
      <div className="onboard-grid">
        {fields.map((f, i) => (
          <label key={f.key} className="field-pop" style={{ animationDelay: `${i * 70}ms` }}>
            {f.label}
            <div className="field-icon-wrap">
              <span className="field-icon-badge"><f.icon size={13} /></span>
              {f.node}
              <span className="field-underline" />
            </div>
          </label>
        ))}
      </div>
      {underage && (
        <div className="age-warning">
          <Shield size={14} /> WISP is for adults 18 and older only. You can't continue with this age.
        </div>
      )}
      <button className="btn btn-primary btn-shine btn-full" disabled={!valid} onClick={onNext}>
        Continue <ChevronRight size={16} />
      </button>
    </div>
  );
}

function StepInterests({ selected, setSelected, onNext, onBack, onClose }) {
  const toggle = (i) =>
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  return (
    <div className="modal-card">
      <button className="modal-close" onClick={onClose}><X size={18} /></button>
      <ProgressDots step={1} total={5} />
      <h2 className="modal-title">What are you into?</h2>
      <p className="modal-sub">Pick as many as you like — better matches, guaranteed.</p>
      <div className="interest-grid">
    
