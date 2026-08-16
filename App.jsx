import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles, Shield, Globe2, Zap, Lock, Users, Ban, Smartphone,
  Send, Smile, Flag, SkipForward, X, Check, ChevronRight, Menu,
  MessageCircle, ShieldCheck, MapPin, ArrowRight,
  User, Calendar, Globe, Shuffle, Search, ChevronDown, Camera, Sun, Moon,
  Video, Phone, MoreVertical, Mic, Bell, Heart
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
  BACKEND_URL — read from the VITE_BACKEND_URL environment variable, set in
  Vercel's Project Settings → Environment Variables. Vite only exposes env
  vars prefixed with VITE_ to client code, and only bakes them in at BUILD
  time — so after adding/changing it in Vercel, a redeploy is required.
  The fallback below is your last known-working Railway URL, so the app
  still functions even before VITE_BACKEND_URL is set — but you should set
  it explicitly rather than relying on this fallback long-term.
*/
const BACKEND_URL =
  (import.meta.env && import.meta.env.VITE_BACKEND_URL) ||
  "https://web-production-b0d998.up.railway.app";

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

/*
  DEVICE_ID — a random ID generated once and stored in this browser, not
  tied to any login/password. It's how the close-friends feature
  recognizes "the same person" across visits: WISP still has no accounts,
  this is just enough persistence for friend requests to mean something
  over time, on this device.
*/
function getDeviceId() {
  try {
    let id = localStorage.getItem("wisp-device-id");
    if (!id) {
      id = "dev_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("wisp-device-id", id);
    }
    return id;
  } catch (e) {
    // Private browsing etc. — fall back to a per-session ID; friends just
    // won't persist across visits in that case, nothing else breaks.
    return "dev_session_" + Math.random().toString(36).slice(2);
  }
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
  purple: "#7C5CFC",
  ice: "#7DD3FC",
  success: "#16A34A",
  bg: "#F7FAFF",
  glass: "color-mix(in srgb, var(--surface) 72%, transparent)",
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


function Nav({ onStart, page, setPage, theme, toggleTheme, onboarded, onEditProfile, onOpenNotifications, onOpenFriends, incomingCount }) {
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
          {onboarded && (
            <>
              <button
                className="theme-toggle-btn"
                onClick={onOpenNotifications}
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell size={16} />
                {incomingCount > 0 && <span className="nav-badge">{incomingCount}</span>}
              </button>
              <button
                className="theme-toggle-btn"
                onClick={onOpenFriends}
                aria-label="Close Friends"
                title="Close Friends"
              >
                <Heart size={16} />
              </button>
              <button
                className="theme-toggle-btn"
                onClick={onEditProfile}
                aria-label="Edit my profile"
                title="Edit my profile"
              >
                <User size={16} />
              </button>
            </>
          )}
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
          </button>
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
    // The socket is created with autoConnect:false so idle visitors never
    // register or enter the queue just by loading the page. But that also
    // means "online-count" broadcasts were never received here, since
    // there was no live connection to receive them on — that's the actual
    // reason this showed 0. Connecting (without registering) is enough to
    // be counted by the backend's io.engine.clientsCount and to receive
    // the broadcast; it does not put anyone in the matching queue.
    if (!s.connected) s.connect();
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
// Real inbox this form hands off to. Swap for your actual support address.
const CONTACT_EMAIL = "support@wisp-app.example.com";

function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`WISP contact form — ${form.name}`);
    const body = encodeURIComponent(
      `From: ${form.name} (${form.email})\n\n${form.message}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <section className="section section-narrow">
      <span className="eyebrow">Contact Us</span>
      <h2 className="section-title">Get in touch</h2>
      {sent ? (
        <div className="glass-card success-card">
          <Check size={22} />
          <p>Your email app should have opened with your message ready to send.</p>
        </div>
      ) : (
        <form className="glass-card form-card" onSubmit={handleSubmit}>
          <label>
            Name
            <input
              required
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            Message
            <textarea
              required
              rows={4}
              placeholder="How can we help?"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
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

/**
 * Resizes/compresses an image file client-side before it's ever sent
 * anywhere, so a normal phone photo (often several MB) becomes a small
 * data URL that comfortably fits the backend's payload cap. Max 200x200,
 * JPEG quality 0.6 — plenty for a chat avatar.
 */
function compressPhotoFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read that image."));
      img.onload = () => {
        const MAX = 200;
        let { width, height } = img;
        if (width > height && width > MAX) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else if (height > MAX) {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function ProfilePhotoPicker({ photoUrl, onChange }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file) return;
    try {
      setError("");
      const dataUrl = await compressPhotoFile(file);
      onChange(dataUrl);
    } catch (err) {
      setError(err.message || "Couldn't use that photo.");
    }
  };
  return (
    <div className="photo-picker">
      <button
        type="button"
        className="profile-hero-badge photo-picker-btn"
        onClick={() => inputRef.current && inputRef.current.click()}
        aria-label="Add profile photo"
      >
        {photoUrl ? (
          <img src={photoUrl} alt="Your profile" className="photo-picker-img" />
        ) : (
          <User size={22} />
        )}
        <span className="photo-picker-edit"><Camera size={12} /></span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFile}
        style={{ display: "none" }}
      />
      {photoUrl && (
        <button type="button" className="photo-picker-remove" onClick={() => onChange("")}>
          Remove photo
        </button>
      )}
      {error && <p className="photo-picker-error">{error}</p>}
    </div>
  );
}

function StepProfile({ data, setData, onNext, onClose, editMode }) {
  const ageNum = Number(data.age);
  const ageEntered = data.age !== "" && data.age != null;
  // Number("07362") is 7362 — a plain numeric check alone lets garbage
  // like that through. Also reject leading zeros (e.g. "018") and cap to
  // a realistic human age range, not just ">= 18".
  const ageWellFormed = ageEntered && /^([1-9][0-9]{0,2})$/.test(String(data.age));
  const ageValid = ageWellFormed && Number.isFinite(ageNum) && ageNum >= 18 && ageNum <= 100;
  const underage = ageWellFormed && Number.isFinite(ageNum) && ageNum < 18;
  // Covers every invalid case, not just "underage" — a leading zero like
  // "018" or an out-of-range value like "999" is well-formed enough to
  // fail silently otherwise, leaving the button disabled with zero
  // explanation of why.
  const ageError = !ageEntered
    ? ""
    : underage
      ? "WISP is for adults 18 and older only."
      : !ageWellFormed
        ? "Enter a valid age — no leading zeros."
        : !ageValid
          ? "Enter a realistic age (18–100)."
          : "";
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
      key: "age", label: "Age", icon: Calendar, error: ageError,
      node: (
        <input
          type="text" inputMode="numeric" pattern="[0-9]*" maxLength={3}
          value={data.age}
          onChange={(e) => {
            const digitsOnly = e.target.value.replace(/[^0-9]/g, "").slice(0, 3);
            setData({ ...data, age: digitsOnly });
          }}
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
        <ProfilePhotoPicker
          photoUrl={data.photoUrl}
          onChange={(url) => setData({ ...data, photoUrl: url })}
        />
      </div>
      <ProgressDots step={0} total={editMode ? 2 : 5} />
      <h2 className="modal-title">Tell us a bit about you</h2>
      <p className="modal-sub">This stays between you and WISP.</p>
      <div className="onboard-grid">
        {fields.map((f, i) => (
          <label
            key={f.key}
            className={`field-pop ${f.error ? "field-has-error" : ""}`}
            style={{ animationDelay: `${i * 70}ms` }}
          >
            {f.label}
            <div className="field-icon-wrap">
              <span className="field-icon-badge"><f.icon size={13} /></span>
              {f.node}
              <span className="field-underline" />
            </div>
          </label>
        ))}
      </div>
      {ageError && (
        <div className="age-warning">
          <Shield size={14} /> {ageError}
        </div>
      )}
      <button className="btn btn-primary btn-shine btn-full" disabled={!valid} onClick={onNext}>
        {editMode ? "Save" : "Continue"} <ChevronRight size={16} />
      </button>
    </div>
  );
}

function StepInterests({ selected, setSelected, onNext, onBack, onClose, editMode }) {
  const toggle = (i) =>
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  return (
    <div className="modal-card">
      <button className="modal-close" onClick={onClose}><X size={18} /></button>
      <ProgressDots step={1} total={editMode ? 2 : 5} />
      <h2 className="modal-title">What are you into?</h2>
      <p className="modal-sub">Pick as many as you like — better matches, guaranteed.</p>
      <div className="interest-grid">
        {INTERESTS.map((i, idx) => (
          <button
            key={i}
            className={`interest-chip field-pop ${selected.includes(i) ? "on" : ""}`}
            style={{ animationDelay: `${idx * 35}ms` }}
            onClick={() => toggle(i)}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onBack}>Back</button>
        <button className="btn btn-primary btn-shine btn-full" onClick={onNext}>
          {editMode ? "Save" : "Continue"} <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function StepMatchType({ value, setValue, onNext, onBack, onClose, editMode }) {
  const options = [
    { key: "boy", label: "Match with Boy", desc: "Chat with a guy", icon: User, tint: "boy" },
    { key: "girl", label: "Match with Girl", desc: "Chat with a girl", icon: User, tint: "girl" },
    { key: "random", label: "Random Match", desc: "Let WISP surprise you", icon: Shuffle, tint: "random" },
  ];
  return (
    <div className="modal-card">
      <button className="modal-close" onClick={onClose}><X size={18} /></button>
      <ProgressDots step={2} total={5} />
      <h2 className="modal-title">Who do you want to meet?</h2>
      <p className="modal-sub">You can change this anytime.</p>
      <div className="match-type-grid">
        {options.map((o, i) => (
          <button
            key={o.key}
            className={`match-type-card field-pop ${value === o.key ? "on" : ""}`}
            style={{ animationDelay: `${i * 90}ms` }}
            onClick={(e) => { ripple(e); setValue(o.key); }}
          >
            <span className={`match-type-icon tint-${o.tint}`}>
              <o.icon size={18} />
            </span>
            <span className="match-type-text">
              <span className="match-type-label">{o.label}</span>
              <span className="match-type-desc">{o.desc}</span>
            </span>
            <span className="match-type-check">
              <Check size={13} />
            </span>
          </button>
        ))}
      </div>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onBack}>Back</button>
        <button className="btn btn-primary btn-shine btn-full" disabled={!value} onClick={onNext}>
          {editMode ? "Save" : "Continue"} <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/*
  Age gate — REAL INTEGRATION POINT
  ----------------------------------
  In production this checkbox is replaced by a call to a
  third-party ID/liveness verification provider (e.g. Persona,
  Veriff, Yoti). The flow: user taps "Verify my age" → redirect
  or SDK modal from the provider → provider returns a signed
  verified=true/false result to your backend → backend marks the
  account verified → only then can matching begin. Nothing in this
  demo should be mistaken for that step actually happening.
*/
function StepAgeGate({ confirmed, setConfirmed, onNext, onBack, onClose, editMode }) {
  return (
    <div className="modal-card">
      <button className="modal-close" onClick={onClose}><X size={18} /></button>
      <ProgressDots step={3} total={5} />
      <h2 className="modal-title">Age verification</h2>
      <p className="modal-sub">
        WISP is for adults only. In production this step requires real
        ID verification, not a checkbox — this demo stops short of that.
      </p>
      <label className="age-check">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        <span>I confirm that I am 18 years of age or older.</span>
      </label>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onBack}>Back</button>
        <button className="btn btn-primary btn-shine btn-full" disabled={!confirmed} onClick={onNext}>
          {editMode ? "Save" : "Continue"} <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function StepSearching({ onMatched, onNoMatch, onCancel, skipEmit }) {
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setLineIdx((i) => (i + 1) % SEARCH_LINES.length), 1400);

    // Real matching: ask the backend to find a compatible, currently-
    // connected user. It resolves with "matched" the moment one is
    // found, or "no-match" once the server-side timeout elapses.
    // No AI is ever placed here — see matchmaking.js on the backend.
    const s = getSocket();

    const handleMatched = ({ roomId, partner }) => onMatched(roomId, partner);
    const handleNoMatch = () => onNoMatch();

    s.once("matched", handleMatched);
    s.once("no-match", handleNoMatch);

    // skipEmit is now effectively always false — Next Match routes through
    // the "chat ended" / edit-details prompt instead of auto-requeueing, so
    // every arrival here (fresh registration or "Find New Chat") needs its
    // own find-match call. Left in place in case a future auto-requeue path
    // is reintroduced.
    if (!skipEmit) {
      s.emit("find-match", (res) => {
        if (!res || !res.ok) {
          // Registration/verification problem, or already in a chat —
          // treat it the same as "no one available" rather than hanging.
          onNoMatch();
        }
      });
    }

    return () => {
      clearInterval(t);
      s.off("matched", handleMatched);
      s.off("no-match", handleNoMatch);
      // Always cancel on unmount — by this point we ARE in the server's
      // queue either way (whether this component put us there via
      // find-match, or next-match already had). Leaving the search
      // screen should always drop out of the queue, regardless of which
      // path queued us.
      s.emit("cancel-find-match");
    };
  }, [onMatched, onNoMatch, skipEmit]);

  return (
    <div className="searching-fullscreen">
      <button className="modal-close modal-close-light" onClick={onCancel}><X size={18} /></button>
      <div className="globe-wrap">
        <div className="globe-ring globe-ring-1" />
        <div className="globe-ring globe-ring-2" />
        <div className="globe-orbit" />
        <div className="globe-orbit globe-orbit-2" />
        <div className="globe-core">
          <Globe2 size={30} />
        </div>
        <span className="globe-pulse" />
      </div>
      <h2 className="modal-title" style={{ textAlign: "center" }}>
        {SEARCH_LINES[lineIdx]}
      </h2>
      <p className="modal-sub" style={{ textAlign: "center" }}>
        Connecting you with a real person worldwide
      </p>
    </div>
  );
}

function NoMatchAvailable({ onRetry, onHome, matchType, setMatchType }) {
  return (
    <div className="chat-ended-fullscreen">
      <div className="no-match-logo">
        <img src={LOGO_ICON} alt="WISP" />
      </div>
      <h2 className="modal-title">No one's available right now</h2>
      <p className="modal-sub">
        Every real match slot is taken at the moment — WISP never fills in with a bot.
        Try again in a bit, or check back later.
      </p>

      <GenderFilterPicker matchType={matchType} setMatchType={setMatchType} />

      <div className="chat-ended-actions">
        <button className="btn btn-primary btn-shine btn-lg" onClick={(e) => { ripple(e); onRetry(); }}>
          Try Again <ArrowRight size={18} />
        </button>
        <button className="btn btn-ghost" onClick={onHome}>
          Back to Home
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   CHAT
   ============================================================ */

/*
  A genuinely large, categorized emoji set — not literally all ~3,700
  unicode emojis (that's impractical for a small popover picker and would
  bloat the bundle for little real benefit), but several hundred of the
  most-used ones across every major category, organized into tabs so
  they're actually browsable instead of one giant unsorted grid.
*/
const EMOJI_CATEGORIES = [
  {
    key: "smileys", label: "Smileys", icon: "😀",
    items: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","😎","🤓","🧐","😕","😟","🙁","☹️","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖","😺","😸","😹","😻","😼","😽","🙀","😿","😾"],
  },
  {
    key: "gestures", label: "Gestures", icon: "👋",
    items: ["👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","🧠","🦷","🦴","👀","👁️","👅","👄","💋","🩸"],
  },
  {
    key: "people", label: "People", icon: "🧑",
    items: ["👶","🧒","👦","👧","🧑","👱","👨","🧔","👩","🧓","👴","👵","🙍","🙎","🙅","🙆","💁","🙋","🧏","🙇","🤦","🤷","👮","🕵️","💂","👷","🤴","👸","👳","👲","🧕","🤵","👰","🤰","🤱","👼","🎅","🤶","🦸","🦹","🧙","🧚","🧛","🧜","🧝","🧞","🧟","💆","💇","🚶","🧍","🧎","🏃","💃","🕺","👯","🧖","🧗","🤺","🏇","⛷️","🏂","🏌️","🏄","🚣","🏊","⛹️","🏋️","🚴","🚵","🤸","🤼","🤽","🤾","🤹","🧘","🛀","🛌"],
  },
  {
    key: "hearts", label: "Hearts", icon: "❤️",
    items: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","♥️","💌","💋","😻","🥰"],
  },
  {
    key: "animals", label: "Animals", icon: "🐶",
    items: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐽","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪰","🪲","🪳","🦟","🦗","🕷️","🕸️","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐈","🐈‍⬛","🐓","🦃","🦤","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿️","🦔"],
  },
  {
    key: "food", label: "Food", icon: "🍔",
    items: ["🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🫑","🌽","🥕","🧄","🧅","🥔","🍠","🥐","🥯","🍞","🥖","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🌭","🍔","🍟","🍕","🫓","🥪","🥙","🧆","🌮","🌯","🥗","🥘","🫕","🥫","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚","🍘","🍥","🥠","🥮","🍢","🍡","🍧","🍨","🍦","🥧","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🍯","🥛","🍼","☕","🍵","🧃","🥤","🧋","🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧉","🍾"],
  },
  {
    key: "activities", label: "Activities", icon: "⚽",
    items: ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","⛸️","🥌","🎿","⛷️","🏂","🏋️","🤼","🤸","⛹️","🤺","🤾","🏌️","🏇","🧘","🏄","🏊","🤽","🚣","🧗","🚵","🚴","🏆","🥇","🥈","🥉","🏅","🎖️","🏵️","🎗️","🎫","🎟️","🎪","🤹","🎭","🩰","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🪘","🎷","🎺","🎸","🪕","🎻","🎲","♟️","🎯","🎳","🎮","🎰","🧩"],
  },
  {
    key: "travel", label: "Travel", icon: "✈️",
    items: ["🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🦽","🦼","🛴","🚲","🛵","🏍️","🛺","🚨","🚔","🚍","🚘","🚖","🚡","🚠","🚟","🚃","🚋","🚞","🚝","🚄","🚅","🚈","🚂","🚆","🚇","🚊","🚉","✈️","🛫","🛬","🛩️","💺","🛰️","🚀","🛸","🚁","🛶","⛵","🚤","🛥️","🛳️","⛴️","🚢","⚓","🪝","⛽","🚧","🚦","🚥","🗺️","🗿","🗽","🗼","🏰","🏯","🏟️","🎡","🎢","🎠","⛲","⛱️","🏖️","🏝️","🏜️","🌋","⛰️","🏔️","🗻","🏕️","⛺","🛖","🏠","🏡","🏘️","🏚️","🏗️","🏭","🏢","🏬","🏣","🏤","🏥","🏦","🏨","🏪","🏫","🏩","💒","🏛️","⛪","🕌","🕍","🛕","🕋","⛩️"],
  },
  {
    key: "objects", label: "Objects", icon: "💡",
    items: ["⌚","📱","💻","⌨️","🖥️","🖨️","🖱️","🖲️","🕹️","🗜️","💽","💾","💿","📀","📼","📷","📸","📹","🎥","📞","☎️","📟","📠","📺","📻","🎙️","🎚️","🎛️","🧭","⏱️","⏲️","⏰","🕰️","⌛","⏳","📡","🔋","🔌","💡","🔦","🕯️","🪔","🧯","🛢️","💸","💵","💴","💶","💷","🪙","💰","💳","🧾","💎","⚖️","🪜","🧰","🪛","🔧","🔨","⚒️","🛠️","⛏️","🪚","🔩","⚙️","🪤","🧱","⛓️","🧲","🔫","💣","🧨","🪓","🔪","🗡️","⚔️","🛡️","🚬","⚰️","🪦","⚱️","🏺","🔮","📿","🧿","💈","⚗️","🔭","🔬","🕳️","🩹","🩺","💊","💉","🩸","🧬","🦠","🧫","🧪","🌡️","🧹","🪠","🧺","🧻","🚽","🚰","🚿","🛁","🛀","🧼","🪥","🪒","🧽","🪣","🧴","🛎️","🔑","🗝️","🚪","🪑","🛋️","🛏️","🛌","🖼️","🪞","🪟","🛍️","🛒","🎁","🎈","🎏","🎀","🪄","🪅","🎊","🎉","🎎","🏮","🎐","🧧","✉️","📩","📨","📧","💌","📥","📤","📦","🏷️","📪","📫","📬","📭","📮","📯","📜","📃","📄","📑","🧾","📊","📈","📉","🗒️","🗓️","📆","📅","🗑️","📇","🗃️","🗳️","🗄️","📋","📁","📂","🗂️","🗞️","📰","📓","📔","📒","📕","📗","📘","📙","📚","📖","🔖","🧷","🔗","📎","🖇️","📐","📏","🧮","📌","📍","✂️","🖊️","🖋️","✒️","🖌️","🖍️","📝","✏️","🔍","🔎","🔏","🔐","🔒","🔓"],
  },
  {
    key: "symbols", label: "Symbols", icon: "✨",
    items: ["✨","🔥","🌟","⭐","🌈","☀️","🌤️","⛅","🌥️","☁️","🌦️","🌧️","⛈️","🌩️","🌨️","❄️","☃️","⛄","🌬️","💨","💧","💦","☔","☂️","🌊","🌫️","♻️","✅","❌","❎","➕","➖","➗","✖️","♾️","‼️","⁉️","❓","❔","❕","❗","〰️","💱","💲","⚕️","♻️","⚜️","🔱","📛","🔰","⭕","✅","☑️","✔️","❌","❎","➰","➿","〽️","✳️","✴️","❇️","©️","®️","™️","🔟","🔢","#️⃣","*️⃣","⏸️","⏯️","⏹️","⏺️","⏭️","⏮️","⏩","⏪","⏫","⏬","◀️","▶️","🔼","🔽","➡️","⬅️","⬆️","⬇️","↗️","↘️","↙️","↖️","↕️","↔️","↩️","↪️","⤴️","⤵️","🔀","🔁","🔂","🔄","🔃","🎵","🎶","➰","✅","💯","🔞","📵","🚭","❗","❕","❓","❔","‼️","⁉️","🔅","🔆","〽️","⚠️","🚸","🔱","⚜️","🔰","♻️","✅","🈯","💹","❇️","✳️","❎","🌐","💠","Ⓜ️","🌀","💤","🏧","🚾","♿","🅿️","🈳","🈂️","🛂","🛃","🛄","🛅"],
  },
  {
    key: "flags", label: "Flags", icon: "🏳️",
    items: ["🏳️","🏴","🏁","🚩","🏳️‍🌈","🇺🇸","🇬🇧","🇨🇦","🇦🇺","🇮🇳","🇮🇪","🇩🇪","🇫🇷","🇮🇹","🇪🇸","🇵🇹","🇳🇱","🇧🇪","🇨🇭","🇦🇹","🇸🇪","🇳🇴","🇩🇰","🇫🇮","🇮🇸","🇵🇱","🇬🇷","🇹🇷","🇷🇺","🇺🇦","🇨🇳","🇯🇵","🇰🇷","🇹🇼","🇭🇰","🇸🇬","🇹🇭","🇻🇳","🇵🇭","🇮🇩","🇲🇾","🇵🇰","🇧🇩","🇱🇰","🇳🇵","🇦🇪","🇸🇦","🇮🇱","🇪🇬","🇿🇦","🇳🇬","🇰🇪","🇬🇭","🇲🇽","🇧🇷","🇦🇷","🇨🇱","🇨🇴","🇵🇪","🇳🇿"],
  },
];

function EmojiPicker({ onPick, onClose }) {
  const ref = useRef(null);
  const [cat, setCat] = useState(EMOJI_CATEGORIES[0].key);
  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [onClose]);

  const active = EMOJI_CATEGORIES.find((c) => c.key === cat) || EMOJI_CATEGORIES[0];

  return (
    <div className="emoji-picker emoji-picker-tabbed" ref={ref}>
      <div className="emoji-picker-tabs">
        {EMOJI_CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`emoji-picker-tab ${c.key === cat ? "on" : ""}`}
            onClick={() => setCat(c.key)}
            title={c.label}
            aria-label={c.label}
          >
            {c.icon}
          </button>
        ))}
      </div>
      <div className="emoji-picker-grid">
        {active.items.map((e, i) => (
          <button key={`${e}-${i}`} className="emoji-picker-btn" onClick={() => onPick(e)}>
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

/*
  ChatInterface — real-user-to-real-user only.
  ------------------------------------------------
  No scripted fake partner, no auto-generated replies — the "them"
  bubbles below are populated purely by the matched user's real
  messages arriving over the socket. If nothing's connected on the
  other end, nothing appears here, which is the honest behavior.
*/
function ChatInterface({ partner, onStop, onNext, onPartnerLeft, onEditProfile, friendsList, onFriendRequestSent, onOpenNotifications, onOpenFriends, incomingCount }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(true); // matched already implies connected
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [reported, setReported] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [confirmSkipOpen, setConfirmSkipOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState(false);
  const [callNotice, setCallNotice] = useState(null); // "video" | "audio" | null
  const [friendReqStatus, setFriendReqStatus] = useState("idle"); // idle | sending | sent | error
  const isAcceptedFriend = !!(partner?.deviceId && friendsList?.some((f) => f.deviceId === partner.deviceId));

  const sendFriendRequest = () => {
    if (!partner?.deviceId || friendReqStatus !== "idle") return;
    setFriendReqStatus("sending");
    getSocket().emit("friend-request", { toDeviceId: partner.deviceId }, (res) => {
      if (res && res.ok) {
        setFriendReqStatus("sent");
        if (res.status === "accepted") onFriendRequestSent && onFriendRequestSent();
      } else {
        setFriendReqStatus("error");
      }
    });
  };
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeout = useRef(null);
  const wasNearBottom = useRef(true);

  useEffect(() => {
    const s = getSocket();

    const handleMessage = ({ text, at }) => {
      setPartnerTyping(false);
      setMessages((m) => [...m, { id: at + Math.random(), from: "them", text, at }]);
    };
    const handleTyping = (isTyping) => setPartnerTyping(!!isTyping);
    const handlePartnerLeft = ({ reason }) => {
      setConnected(false);
      onPartnerLeft(reason);
    };

    s.on("message", handleMessage);
    s.on("partner-typing", handleTyping);
    s.on("partner-left", handlePartnerLeft);

    return () => {
      s.off("message", handleMessage);
      s.off("partner-typing", handleTyping);
      s.off("partner-left", handlePartnerLeft);
    };
  }, [onPartnerLeft]);

  // Auto-scroll only if the person was already near the bottom before this
  // update — if they've scrolled up to read earlier messages, a new
  // message shouldn't yank them back down. Instead we show a small
  // "New messages" button they can tap when ready.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (wasNearBottom.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      setShowJumpToLatest(false);
    } else {
      setShowJumpToLatest(true);
    }
  }, [messages, partnerTyping]);

  useEffect(() => {
    if (!voiceNotice) return;
    const t = setTimeout(() => setVoiceNotice(false), 3000);
    return () => clearTimeout(t);
  }, [voiceNotice]);

  useEffect(() => {
    if (!callNotice) return;
    const t = setTimeout(() => setCallNotice(null), 3000);
    return () => clearTimeout(t);
  }, [callNotice]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    wasNearBottom.current = nearBottom;
    if (nearBottom) setShowJumpToLatest(false);
  };

  const jumpToLatest = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    wasNearBottom.current = true;
    setShowJumpToLatest(false);
  };

  const send = () => {
    if (!input.trim()) return;
    const text = input.trim();
    wasNearBottom.current = true;
    setMessages((m) => [...m, { id: Date.now(), from: "me", text, at: Date.now() }]);
    setInput("");
    getSocket().emit("send-message", { text });
    getSocket().emit("typing", false);
  };

  const onInputChange = (e) => {
    setInput(e.target.value);
    const s = getSocket();
    s.emit("typing", true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => s.emit("typing", false), 1200);
  };

  const pickEmoji = (emoji) => {
    setInput((v) => v + emoji);
    setEmojiOpen(false);
    inputRef.current?.focus();
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const dateLabel = (ts) => {
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a, b) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (sameDay(d, today)) return "Today";
    if (sameDay(d, yesterday)) return "Yesterday";
    return d.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
  };

  const report = () => {
    setReported(true);
    getSocket().emit("report-user", { reason: "unspecified" });
  };

  // One combined line: Gender • Country • State • Place — each field only
  // appears if present, and the whole line is skipped if everything's empty.
  const partnerMetaLine = [
    partner?.gender || null,
    partner?.country || null,
    partner?.state || null,
    partner?.place || null,
  ].filter(Boolean).join("  •  ");

  return (
    <div className="chat-shell chat-shell-full">
      <div className="chat-topbar">
        <div className="chat-topbar-left chat-topbar-left-top">
          <span className={`status-dot ${connected ? "on" : ""}`} />
          <div className="chat-partner-avatar">
            {partner?.photoUrl ? (
              <img src={partner.photoUrl} alt="" />
            ) : (
              <span>{(partner?.name || "A").charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="chat-partner-info">
            <div className="chat-partner-name">
              {partner?.name || "Anonymous"}
              {partner?.age ? ` (${partner.age})` : ""}
              {isAcceptedFriend && <span className="close-friend-heart" title="Close friend">💞</span>}
            </div>
            {partnerMetaLine && <div className="chat-partner-meta">{partnerMetaLine}</div>}
            <div className="chat-partner-status">
              {connected ? (partnerTyping ? "Typing…" : "Connected") : "Disconnected"}
            </div>
            {partner?.interests && partner.interests.length > 0 && (
              <div className="chat-partner-interests">
                {partner.interests.slice(0, 4).map((i) => (
                  <span key={i} className="chat-partner-chip">{i}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="chat-topbar-right">
          <button
            className="icon-btn"
            aria-label="Audio call — not available yet"
            title="Audio call (coming soon)"
            onClick={() => setCallNotice("audio")}
          >
            <Phone size={16} />
          </button>
          <button
            className="icon-btn"
            aria-label="Video call — not available yet"
            title="Video call (coming soon)"
            onClick={() => setCallNotice("video")}
          >
            <Video size={16} />
          </button>
          <div className="chat-menu-anchor">
            <button
              className={`icon-btn ${menuOpen ? "reported" : ""}`}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="More options"
              title="More"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <>
                <div className="chat-menu-backdrop" onClick={() => setMenuOpen(false)} />
                <div className="chat-menu-sheet">
                  <button
                    className="chat-menu-item"
                    onClick={() => { setMenuOpen(false); onOpenNotifications(); }}
                  >
                    <Bell size={15} /> Notifications
                    {incomingCount > 0 && <span className="chat-menu-badge">{incomingCount}</span>}
                  </button>
                  <button
                    className="chat-menu-item"
                    onClick={() => { setMenuOpen(false); onOpenFriends(); }}
                  >
                    <Heart size={15} /> Close Friends
                  </button>
                  <button
                    className="chat-menu-item"
                    onClick={() => { setMenuOpen(false); onEditProfile(); }}
                  >
                    <User size={15} /> Edit Profile / Settings
                  </button>
                  <button
                    className={`chat-menu-item ${reported ? "reported" : ""}`}
                    onClick={() => { setMenuOpen(false); report(); }}
                    disabled={reported}
                  >
                    <Flag size={15} /> {reported ? "Reported" : "Report User"}
                  </button>
                  <button
                    className="chat-menu-item"
                    onClick={() => { setMenuOpen(false); setConfirmSkipOpen(true); }}
                  >
                    <SkipForward size={15} /> Next Match
                  </button>
                  <button
                    className="chat-menu-item chat-menu-item-danger"
                    onClick={() => { setMenuOpen(false); onStop(); }}
                  >
                    <X size={15} /> End Chat
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {!isAcceptedFriend && partner?.deviceId && (
        <div className="close-friend-bar">
          <button
            className={`close-friend-btn ${friendReqStatus === "sent" ? "sent" : ""}`}
            onClick={sendFriendRequest}
            disabled={friendReqStatus === "sending" || friendReqStatus === "sent"}
          >
            <Heart size={13} />
            {friendReqStatus === "sent"
              ? "Friend request sent"
              : friendReqStatus === "sending"
                ? "Sending…"
                : friendReqStatus === "error"
                  ? "Couldn't send — try again"
                  : "Add to Close Friends"}
          </button>
        </div>
      )}

      {confirmSkipOpen && (
        <div className="modal-overlay skip-confirm-overlay">
          <div className="modal-card skip-confirm-card">
            <h2 className="modal-title">Skip this chat?</h2>
            <p className="modal-sub">
              Are you sure you want to skip this conversation?
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmSkipOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-shine btn-full"
                onClick={(e) => {
                  ripple(e);
                  setConfirmSkipOpen(false);
                  onNext();
                }}
              >
                Skip <SkipForward size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {reported && (
        <div className="report-banner">
          <ShieldCheck size={14} /> Report submitted — thanks for helping keep WISP safe.
        </div>
      )}

      <div className="chat-body" ref={scrollRef} onScroll={handleScroll}>
        <div className="chat-system-msg">
          You're matched with a real person, not a bot. Be kind — you can report or stop anytime.
        </div>
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const showDate = !prev || dateLabel(prev.at) !== dateLabel(m.at);
          return (
            <div key={m.id}>
              {showDate && <div className="chat-date-sep"><span>{dateLabel(m.at)}</span></div>}
              <div className={`bubble-row ${m.from === "me" ? "mine" : ""}`}>
                <div className={`bubble ${m.from === "me" ? "bubble-mine" : "bubble-theirs"}`}>
                  <span className="bubble-text">{m.text}</span>
                  <span className="bubble-time">{formatTime(m.at)}</span>
                </div>
              </div>
            </div>
          );
        })}
        {partnerTyping && (
          <div className="bubble-row">
            <div className="bubble bubble-theirs typing-bubble">
              <span className="typing-label">{(partner?.name || "Partner")} is typing</span>
              <span className="typing-dots">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </span>
            </div>
          </div>
        )}
      </div>

      {showJumpToLatest && (
        <button className="jump-to-latest-btn" onClick={jumpToLatest}>
          <ChevronDown size={14} /> New messages
        </button>
      )}

      <div className="chat-input-bar">
        <div className="emoji-anchor">
          <button
            className={`icon-btn ${emojiOpen ? "reported" : ""}`}
            onClick={() => setEmojiOpen((v) => !v)}
            aria-label="Open stickers"
            title="Stickers"
          >
            <Smile size={18} />
          </button>
          {emojiOpen && <EmojiPicker onPick={pickEmoji} onClose={() => setEmojiOpen(false)} />}
        </div>
        <input
          ref={inputRef}
          value={input}
          onChange={onInputChange}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message…"
          aria-label="Message"
        />
        {input.trim() ? (
          <button className="icon-btn icon-btn-send" onClick={send} aria-label="Send message" title="Send">
            <Send size={16} />
          </button>
        ) : (
          <button
            className="icon-btn"
            onClick={() => setVoiceNotice(true)}
            aria-label="Voice message"
            title="Voice message"
          >
            <Mic size={17} />
          </button>
        )}
      </div>
      {voiceNotice && (
        <div className="voice-notice-toast" onAnimationEnd={() => {}}>
          Voice chat isn't available yet — coming soon.
          <button aria-label="Dismiss" onClick={() => setVoiceNotice(false)}><X size={13} /></button>
        </div>
      )}
      {callNotice && (
        <div className="voice-notice-toast call-notice-toast" onAnimationEnd={() => {}}>
          {callNotice === "video" ? "Video" : "Audio"} calling isn't available yet — coming soon.
          <button aria-label="Dismiss" onClick={() => setCallNotice(null)}><X size={13} /></button>
        </div>
      )}
    </div>
  );
}

/* ---------------------------- Chat ended / edit-details prompt ---------------------------- */
function endMessage(endInfo) {
  if (!endInfo) return "The chat ended. You're still signed in — start a new one whenever you're ready.";
  const { by, action } = endInfo;
  if (by === "partner") {
    if (action === "next") return "Partner skipped the chat.";
    if (action === "disconnected") return "Your partner disconnected.";
    return "Your partner ended the chat.";
  }
  if (action === "skip") return "You skipped the chat.";
  return "You ended the chat.";
}

/**
 * Small, self-dismissing toast announcing who ended/skipped the chat.
 * Purely a notification — the ChatEnded card below carries the same
 * information persistently, so nothing is lost if the toast is missed.
 */
function EndToast({ endInfo }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, [endInfo]);
  if (!endInfo) return null;
  return (
    <div className={`end-toast ${visible ? "end-toast-in" : "end-toast-out"}`}>
      <div className="end-toast-icon">
        {endInfo.by === "partner" ? <Users size={15} /> : <SkipForward size={15} />}
      </div>
      <span>{endMessage(endInfo)}</span>
    </div>
  );
}

const MATCH_TYPE_OPTIONS = [
  { key: "boy", label: "Match with Boy", icon: User, tint: "boy" },
  { key: "girl", label: "Match with Girl", icon: User, tint: "girl" },
  { key: "random", label: "Match Random", icon: Shuffle, tint: "random" },
];

/**
 * Shared "currently matching X — want to change?" widget, used on both the
 * post-chat screen and the no-match screen so the behavior/design stays
 * identical in both places rather than duplicated.
 */
function GenderFilterPicker({ matchType, setMatchType }) {
  const [changingFilter, setChangingFilter] = useState(false);
  const current = MATCH_TYPE_OPTIONS.find((o) => o.key === matchType);
  const CurrentIcon = current?.icon || Shuffle;
  return !changingFilter ? (
    <div className="current-filter-card">
      <span className={`match-type-icon tint-${current?.tint || "random"}`}>
        <CurrentIcon size={18} />
      </span>
      <div className="current-filter-text">
        <span className="current-filter-label">Currently matching</span>
        <span className="current-filter-value">{current?.label || "Match Random"}</span>
      </div>
      <button className="current-filter-change-btn" onClick={() => setChangingFilter(true)}>
        <Shuffle size={13} /> Change
      </button>
    </div>
  ) : (
    <div className="match-type-grid chat-ended-match-grid">
      {MATCH_TYPE_OPTIONS.map((o, i) => (
        <button
          key={o.key}
          className={`match-type-card field-pop ${matchType === o.key ? "on" : ""}`}
          style={{ animationDelay: `${i * 90}ms` }}
          onClick={(e) => { ripple(e); setMatchType(o.key); setChangingFilter(false); }}
        >
          <span className={`match-type-icon tint-${o.tint}`}>
            <o.icon size={18} />
          </span>
          <span className="match-type-text">
            <span className="match-type-label">{o.label}</span>
          </span>
          <span className="match-type-check"><Check size={13} /></span>
        </button>
      ))}
    </div>
  );
}

/* ---------------------------- Close friends: Notifications + Friends list ---------------------------- */
function NotificationsModal({ incoming, onAccept, onDecline, onClose }) {
  return (
    <div className="modal-overlay skip-confirm-overlay" onClick={onClose}>
      <div className="modal-card friends-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <h2 className="modal-title">Notifications</h2>
        <p className="modal-sub">Close friend requests waiting for your response.</p>
        {incoming.length === 0 ? (
          <p className="friends-empty">No new requests right now.</p>
        ) : (
          <div className="friend-request-list">
            {incoming.map((r) => (
              <div className="friend-request-row" key={r.fromDeviceId}>
                <div className="friend-avatar-sm">
                  {r.photoUrl ? <img src={r.photoUrl} alt="" /> : <span>{(r.name || "?").charAt(0).toUpperCase()}</span>}
                </div>
                <span className="friend-request-name">{r.name}</span>
                <div className="friend-request-actions">
                  <button className="friend-accept-btn" onClick={() => onAccept(r.fromDeviceId)}>
                    <Check size={13} />
                  </button>
                  <button className="friend-decline-btn" onClick={() => onDecline(r.fromDeviceId)}>
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FriendsModal({ friends, onClose, onChat, error }) {
  return (
    <div className="modal-overlay skip-confirm-overlay" onClick={onClose}>
      <div className="modal-card friends-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <h2 className="modal-title">Close Friends 💞</h2>
        <p className="modal-sub">Tap someone to chat with them anytime.</p>
        {error && <p className="admin-error">{error}</p>}
        {friends.length === 0 ? (
          <p className="friends-empty">
            No close friends yet — send a request from within a chat to add someone.
          </p>
        ) : (
          <div className="friend-request-list">
            {friends.map((f) => (
              <button className="friend-list-row" key={f.deviceId} onClick={() => onChat(f.deviceId)}>
                <div className="friend-avatar-sm">
                  {f.photoUrl ? <img src={f.photoUrl} alt="" /> : <span>{(f.name || "?").charAt(0).toUpperCase()}</span>}
                  <span className={`friend-presence-dot ${f.online ? "on" : ""}`} />
                </div>
                <span className="friend-request-name">
                  {f.name} <span className="friend-online-label">{f.online ? "Online" : "Offline"}</span>
                </span>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatEnded({ endInfo, matchType, setMatchType, onFindMatch, onHome }) {
  return (
    <div className="chat-ended-fullscreen">
      <EndToast endInfo={endInfo} />
      <div className="chat-ended-icon">
        <MessageCircle size={26} />
      </div>
      <h2 className="modal-title">Chat ended</h2>
      <p className="modal-sub">{endMessage(endInfo)}</p>

      <GenderFilterPicker matchType={matchType} setMatchType={setMatchType} />

      <div className="chat-ended-actions">
        <button className="btn btn-primary btn-shine btn-lg" onClick={(e) => { ripple(e); onFindMatch(); }}>
          Find Another Match <ArrowRight size={18} />
        </button>
        <button className="btn btn-ghost btn-text-sm" onClick={onHome}>
          Back to Home
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   ROOT APP
   ============================================================ */

/* ============================================================
   DEV-ONLY STATIC PREVIEW PAGE
   ------------------------------------------------------------
   Visit the site with ?preview=1 in the URL to see this. It uses only
   hard-coded sample data — no real socket connection, no real users,
   no real online count. Exists purely so the chat UI can be reviewed
   without needing an actual live match. Clearly labeled as a preview
   so it's never mistaken for real activity.
   ============================================================ */
function WispChatPreviewPage() {
  const samplePartner = {
    name: "Alex", age: 21, gender: "Male", country: "India", state: "Kerala", place: "Varkala",
    interests: ["Music", "Travel"], photoUrl: "",
  };
  const sampleMessages = [
    { id: 1, from: "partner", text: "Hey! How's it going?", at: Date.now() - 1000 * 60 * 6 },
    { id: 2, from: "me", text: "Pretty good! Just exploring WISP 👋", at: Date.now() - 1000 * 60 * 5 },
    { id: 3, from: "partner", text: "Nice, welcome! Where are you from?", at: Date.now() - 1000 * 60 * 4 },
  ];
  return (
    <div className="chat-ended-fullscreen preview-page">
      <div className="preview-banner">
        <ShieldCheck size={14} /> WISP Chat Preview — sample data only, not a real conversation
      </div>
      <div className="chat-shell chat-shell-full">
        <div className="chat-topbar">
          <div className="chat-topbar-left chat-topbar-left-top">
            <span className="status-dot on" />
            <div className="chat-partner-avatar"><span>A</span></div>
            <div className="chat-partner-info">
              <div className="chat-partner-name">{samplePartner.name} ({samplePartner.age})</div>
              <div className="chat-partner-meta">
                {[samplePartner.gender, samplePartner.country, samplePartner.state, samplePartner.place]
                  .filter(Boolean).join("  •  ")}
              </div>
            </div>
          </div>
          <div className="chat-topbar-right">
            <button className="icon-btn" aria-label="Video call — coming soon" title="Video call (coming soon)" disabled>
              <Video size={16} />
            </button>
            <button className="icon-btn" aria-label="Audio call — coming soon" title="Audio call (coming soon)" disabled>
              <Phone size={16} />
            </button>
            <button className="icon-btn" aria-label="More options" title="More">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
        <div className="chat-body">
          {sampleMessages.map((m) => (
            <div key={m.id} className={`bubble-row ${m.from === "me" ? "mine" : ""}`}>
              <div className={`bubble ${m.from === "me" ? "bubble-mine" : "bubble-theirs"}`}>
                <span className="bubble-text">{m.text}</span>
                <span className="bubble-time">
                  {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
          <div className="bubble-row">
            <div className="bubble bubble-theirs typing-bubble">
              <span className="typing-label">Alex is typing</span>
              <span className="typing-dots">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </span>
            </div>
          </div>
        </div>
        <div className="chat-input-bar">
          <button className="icon-btn" aria-label="Open stickers" title="Stickers"><Smile size={18} /></button>
          <input value="" onChange={() => {}} placeholder="Type a message…" aria-label="Message" readOnly />
          <button className="icon-btn" aria-label="Voice message" title="Voice message"><Mic size={17} /></button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ADMIN REPORTS PAGE
   ------------------------------------------------------------
   Visit the site with ?admin=1 in the URL. Prompts for the ADMIN_TOKEN
   you set in Railway's environment variables, then fetches real report
   data from the backend's /admin/reports endpoint — nothing here is
   fake or local; it's a UI on top of the same protected route. The
   token is kept only in this component's state for the session, never
   written to localStorage/cookies/anywhere persistent.
   ============================================================ */
function AdminReportsPage() {
  const [token, setToken] = useState("");
  const [submittedToken, setSubmittedToken] = useState("");
  const [reports, setReports] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchReports = async (tok) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/admin/reports`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.status === 401) {
        setError("That token was rejected — check ADMIN_TOKEN in Railway matches exactly.");
        setReports(null);
      } else if (res.status === 404) {
        setError("Reports admin isn't enabled — set ADMIN_TOKEN in Railway's environment variables first.");
        setReports(null);
      } else if (!res.ok) {
        setError(`Server returned an unexpected error (${res.status}).`);
        setReports(null);
      } else {
        setReports(await res.json());
        setSubmittedToken(tok);
      }
    } catch (e) {
      setError("Couldn't reach the backend — check BACKEND_URL/network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <ShieldCheck size={18} /> <h1>WISP — Reports Admin</h1>
      </div>

      {!submittedToken ? (
        <form
          className="admin-token-form"
          onSubmit={(e) => { e.preventDefault(); fetchReports(token); }}
        >
          <label>
            Admin token
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your ADMIN_TOKEN"
              autoFocus
            />
          </label>
          <button className="btn btn-primary btn-shine" disabled={!token || loading} type="submit">
            {loading ? "Checking…" : "View Reports"}
          </button>
          {error && <p className="admin-error">{error}</p>}
        </form>
      ) : (
        <>
          <div className="admin-toolbar">
            <button className="btn btn-ghost btn-text-sm" onClick={() => fetchReports(submittedToken)}>
              Refresh
            </button>
            <span className="admin-count">{reports ? reports.length : 0} report(s)</span>
          </div>
          {error && <p className="admin-error">{error}</p>}
          {reports && reports.length === 0 && <p className="admin-empty">No reports filed yet.</p>}
          <div className="admin-report-list">
            {reports && reports.slice().reverse().map((r) => (
              <div className="admin-report-card" key={r.id}>
                <div className="admin-report-top">
                  <span className={`admin-report-status status-${r.status}`}>{r.status}</span>
                  <span className="admin-report-time">{new Date(r.createdAt).toLocaleString()}</span>
                </div>
                <div className="admin-report-body">
                  <div><strong>Reported user:</strong> {r.reportedId}</div>
                  <div><strong>Reported by:</strong> {r.reporterId}</div>
                  <div><strong>Room:</strong> {r.roomId}</div>
                  <div><strong>Reason:</strong> {r.reason || "unspecified"}</div>
                  {r.details && <div><strong>Details:</strong> {r.details}</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  if (typeof window !== "undefined" && window.location.search.includes("preview")) {
    return <WispChatPreviewPage />;
  }
  if (typeof window !== "undefined" && window.location.search.includes("admin")) {
    return <AdminReportsPage />;
  }
  const [page, setPage] = useState("home");
  // screen: 'browse' | 'onboarding' | 'searching' | 'no-match' | 'chat' | 'ended'
  const [screen, setScreen] = useState("browse");
  const [step, setStep] = useState(0);
  const [onboarded, setOnboarded] = useState(false);
  const [endInfo, setEndInfo] = useState(null);
  // editMode: true when onboarding is being re-run to edit an existing
  // profile rather than complete one for the first time. returnScreen is
  // where to go back to once that edit is saved.
  const [editMode, setEditMode] = useState(false);
  const [returnScreen, setReturnScreen] = useState("browse");

  // Theme: 'light' | 'dark'. Persisted across visits; falls back to the
  // browser/OS preference the very first time, then to light.
  const [theme, setTheme] = useState(() => {
    // Always opens in light mode on a first visit. The only thing that
    // can change that is the person explicitly toggling it themselves —
    // that choice is then remembered via localStorage. OS/browser dark
    // mode preference is deliberately NOT auto-applied here.
    try {
      const saved = localStorage.getItem("wisp-theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch (e) {
      // localStorage can throw in some private-browsing modes — fall
      // through to the default below rather than breaking the app.
    }
    return "light";
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("wisp-theme", theme);
    } catch (e) {
      // Ignore — theme just won't persist this session.
    }
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const [profile, setProfile] = useState({
    name: "", age: "", gender: "", country: "", state: "", place: "", photoUrl: "",
  });
  const [interests, setInterests] = useState([]);
  const [matchType, setMatchType] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [partner, setPartner] = useState(null);
  const [registerError, setRegisterError] = useState("");

  // --- Close friends -------------------------------------------------
  // deviceId is stable for this browser regardless of onboarding state,
  // so identify can run immediately on connect — friend requests can
  // arrive before the person has even finished registering.
  const deviceId = useRef(getDeviceId()).current;
  const [friendsList, setFriendsList] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [friendToast, setFriendToast] = useState(null);

  const refreshFriends = () => {
    const s = getSocket();
    if (!s.connected) return;
    s.emit("friend-list", {}, (res) => {
      if (res && res.ok) {
        setFriendsList(res.friends || []);
        setIncomingRequests(res.incoming || []);
      }
    });
  };

  useEffect(() => {
    const s = getSocket();
    const doIdentify = () => {
      s.emit("identify", { deviceId, name: profile.name, photoUrl: profile.photoUrl }, () => {
        refreshFriends();
      });
    };
    if (s.connected) doIdentify();
    s.on("connect", doIdentify);

    const onReceived = ({ fromDeviceId, name }) => {
      setFriendToast({ type: "received", name });
      refreshFriends();
    };
    const onAnswered = ({ byDeviceId, accepted }) => {
      if (accepted) setFriendToast({ type: "accepted" });
      refreshFriends();
    };
    s.on("friend-request-received", onReceived);
    s.on("friend-request-answered", onAnswered);

    return () => {
      s.off("connect", doIdentify);
      s.off("friend-request-received", onReceived);
      s.off("friend-request-answered", onAnswered);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!friendToast) return;
    const t = setTimeout(() => setFriendToast(null), 3500);
    return () => clearTimeout(t);
  }, [friendToast]);

  // true only when we just came from Next Match, where the server has
  // already re-queued us as part of handling "next-match" — StepSearching
  // should just listen for the outcome, not emit find-match again.
  const [skipNextEmit, setSkipNextEmit] = useState(false);

  // "Start Chat" — first time asks the full onboarding; every time
  // after that (still signed in, nothing was reset) it skips
  // straight to matching with the details already on file.
  const startChat = () => {
    setSkipNextEmit(false);
    if (onboarded) {
      setScreen("searching");
    } else {
      setStep(0);
      setScreen("onboarding");
    }
  };

  const cancelToHome = () => {
    if (editMode) {
      setEditMode(false);
      setScreen(returnScreen);
    } else {
      setScreen("browse");
    }
  };

  // Called when the age gate is confirmed (first-time onboarding) OR when
  // saving a profile edit — both send the same register payload. What
  // differs is only what happens after a successful save: first-time
  // onboarding moves into matching; an edit returns to wherever the
  // person was before they chose to edit (see editMode/returnScreen).
  const connectAndRegister = () => {
    const s = getSocket();
    if (!s.connected) s.connect();
    s.emit(
      "register",
      {
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        country: profile.country,
        state: profile.state,
        place: profile.place,
        photoUrl: profile.photoUrl,
        interests,
        matchType,
      },
      (res) => {
        if (!res || !res.ok) {
          setRegisterError((res && res.errors && res.errors.join(", ")) || "Could not register");
          setEditMode(false);
          setScreen("browse");
          return;
        }
        setOnboarded(true);
        setEditMode(false);
        setSkipNextEmit(false);
        setScreen("searching");
      }
    );
  };

  // Stop Chat — ends the current chat but keeps the person signed
  // in with their profile/preferences intact. No logout, no
  // re-asking name/age/gender/etc unless they choose to edit.
  const stopChat = () => {
    getSocket().emit("stop-chat");
    setPartner(null);
    setEndInfo({ by: "me", action: "stop" });
    setScreen("ended");
  };

  // Skip (Next Match) — user already confirmed via the in-chat modal.
  // Uses the real "next-match" event (backend now just ends the room with
  // reason "next" and does NOT auto-requeue — see server.js) so the
  // partner's side can accurately show "Partner skipped" rather than a
  // generic "ended", while we still control exactly when the new search
  // starts via the edit-profile prompt.
  // Skip (Next Match) — user already confirmed via the in-chat modal.
  // Goes straight back into searching with whatever gender filter they
  // already had selected — no "Find Another Match" screen in between.
  // Still emits "next-match" (not "stop-chat") so the partner's side
  // accurately shows "Partner skipped the chat" rather than a generic
  // "ended". matchType hasn't changed here, so a plain find-match is
  // enough — no need to re-register like the no-match/edit-profile paths.
  const nextMatch = () => {
    getSocket().emit("next-match");
    setPartner(null);
    setSkipNextEmit(false);
    setScreen("searching");
  };

  // "Try Again" from the no-match screen. Re-registers (not just re-emits
  // find-match) so that if the person changed their gender filter via the
  // picker on this screen, that change actually reaches the backend —
  // otherwise the server would still be matching on the old preference.
  const startNewChat = () => {
    setPartner(null);
    connectAndRegister();
  };

  // Lets the person re-run onboarding (prefilled with their current
  // answers, since profile/interests/matchType state is untouched) to
  // edit their profile. Marks this as an edit so the final step saves and
  // returns to where they were, instead of launching into matching.
  const onEditDetails = () => {
    setEditMode(true);
    setReturnScreen("browse");
    setStep(0);
    setScreen("onboarding");
  };

  // Reached from the in-chat "Edit Profile / Settings" menu item. Editing
  // profile fields necessarily means leaving the current room (matching
  // is tied to the profile you registered with), so this ends the chat
  // the same way Stop Chat does — but skips the "chat ended" toast/prompt
  // screen, since the person already made a deliberate choice here rather
  // than skipping or stopping. The partner's side still correctly sees
  // the room end (they'll see "your partner ended the chat"). Since the
  // chat itself can't be returned to, saving here goes back to the home
  // page, same as editing from Settings.
  const editProfileFromChat = () => {
    getSocket().emit("stop-chat");
    setPartner(null);
    setEditMode(true);
    setReturnScreen("browse");
    setStep(0);
    setScreen("onboarding");
  };

  const goHomeSignedIn = () => setScreen("browse");

  // --- Close friends UI wiring -----------------------------------------
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [friendChatError, setFriendChatError] = useState("");

  const respondToFriendRequest = (fromDeviceId, accept) => {
    getSocket().emit("friend-respond", { fromDeviceId, accept }, () => {
      refreshFriends();
    });
  };

  const startFriendChat = (friendDeviceId) => {
    const s = getSocket();
    setFriendChatError("");
    // The backend emits "matched" BEFORE it calls the ack — so this
    // listener must already be attached before we emit, or the event
    // could arrive with nothing listening for it yet.
    const handleMatched = (data) => {
      setPartner(data.partner);
      setScreen("chat");
      setFriendsOpen(false);
    };
    s.once("matched", handleMatched);
    s.emit("friend-chat-start", { friendDeviceId }, (res) => {
      if (!res || !res.ok) {
        s.off("matched", handleMatched);
        setFriendChatError((res && res.error) || "Couldn't start that chat.");
      }
    });
  };

  const handlePartnerLeft = (reason) => {
    setPartner(null);
    setEndInfo({ by: "partner", action: reason || "stop" });
    setScreen("ended");
  };

  return (
    <div className="wisp-root">
      <style>{CSS}</style>
      <ScrollProgress />
      <AuroraField />

      {registerError && screen === "browse" && (
        <div className="report-banner" style={{ position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", zIndex: 60 }}>
          {registerError}
        </div>
      )}

      {screen === "browse" && (
        <>
          <Nav
            onStart={startChat}
            page={page}
            setPage={setPage}
            theme={theme}
            toggleTheme={toggleTheme}
            onboarded={onboarded}
            onEditProfile={onEditDetails}
            onOpenNotifications={() => setNotificationsOpen(true)}
            onOpenFriends={() => setFriendsOpen(true)}
            incomingCount={incomingRequests.length}
          />
          <main>
            {page === "home" && (
              <>
                <Hero onStart={startChat} />
                <WaveDivider />
                <Features />
                <WaveDivider />
                <HowItWorks />
              </>
            )}
            {page === "about" && <About />}
            {page === "contact" && <Contact />}
            {page === "privacy" && <Privacy />}
            {page === "report" && <ReportAbuse />}
          </main>
          <WaveDivider />
          <Footer setPage={setPage} />
        </>
      )}

      {screen === "onboarding" && (
        <div className="modal-overlay">
          {step === 0 && (
            <StepProfile
              data={profile}
              setData={setProfile}
              onNext={() => setStep(1)}
              onClose={cancelToHome}
              editMode={editMode}
            />
          )}
          {step === 1 && (
            <StepInterests
              selected={interests}
              setSelected={setInterests}
              onNext={editMode ? connectAndRegister : () => setStep(2)}
              onBack={() => setStep(0)}
              onClose={cancelToHome}
              editMode={editMode}
            />
          )}
          {step === 2 && !editMode && (
            <StepMatchType
              value={matchType}
              setValue={setMatchType}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
              onClose={cancelToHome}
              editMode={editMode}
            />
          )}
          {step === 3 && !editMode && (
            <StepAgeGate
              confirmed={ageConfirmed}
              setConfirmed={setAgeConfirmed}
              onNext={connectAndRegister}
              onBack={() => setStep(2)}
              onClose={cancelToHome}
              editMode={editMode}
            />
          )}
        </div>
      )}

      {screen === "searching" && (
        <StepSearching
          skipEmit={skipNextEmit}
          onMatched={(roomId, matchedPartner) => {
            setPartner(matchedPartner);
            setScreen("chat");
          }}
          onNoMatch={() => setScreen("no-match")}
          onCancel={cancelToHome}
        />
      )}

      {screen === "no-match" && (
        <NoMatchAvailable
          onRetry={startNewChat}
          onHome={goHomeSignedIn}
          matchType={matchType}
          setMatchType={setMatchType}
        />
      )}

      {screen === "chat" && (
        <div className="chat-page chat-page-full">
          <ChatInterface
            partner={partner}
            onStop={stopChat}
            onNext={nextMatch}
            onPartnerLeft={handlePartnerLeft}
            onEditProfile={editProfileFromChat}
            friendsList={friendsList}
            onFriendRequestSent={refreshFriends}
            onOpenNotifications={() => setNotificationsOpen(true)}
            onOpenFriends={() => setFriendsOpen(true)}
            incomingCount={incomingRequests.length}
          />
        </div>
      )}

      {notificationsOpen && (
        <NotificationsModal
          incoming={incomingRequests}
          onAccept={(id) => respondToFriendRequest(id, true)}
          onDecline={(id) => respondToFriendRequest(id, false)}
          onClose={() => setNotificationsOpen(false)}
        />
      )}
      {friendsOpen && (
        <FriendsModal
          friends={friendsList}
          onClose={() => { setFriendsOpen(false); setFriendChatError(""); }}
          onChat={startFriendChat}
          error={friendChatError}
        />
      )}
      {friendToast && (
        <div className="end-toast friend-toast">
          <div className="end-toast-icon"><Heart size={13} /></div>
          <span>
            {friendToast.type === "received"
              ? `${friendToast.name} sent you a close friend request.`
              : "Your close friend request was accepted! 💞"}
          </span>
        </div>
      )}

      {screen === "ended" && (
        <ChatEnded
          endInfo={endInfo}
          matchType={matchType}
          setMatchType={setMatchType}
          onFindMatch={connectAndRegister}
          onHome={goHomeSignedIn}
        />
      )}
    </div>
  );
}

/* ============================================================
   STYLES
   ============================================================ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

:root {
  --primary: ${COLORS.primary};
  --secondary: ${COLORS.secondary};
  --deep: ${COLORS.deep};
  --accent: ${COLORS.accent};
  --purple: ${COLORS.purple};
  --ice: ${COLORS.ice};
  --success: ${COLORS.success};
  --bg: ${COLORS.bg};
  --glass: ${COLORS.glass};
  --text: ${COLORS.text};
  --muted: ${COLORS.muted};
  --ease: cubic-bezier(0.19, 1, 0.22, 1);

  /* Theme-aware surfaces — light values (default) */
  --surface: #FFFFFF;
  --surface-2: #F0F6FF;
  --surface-3: #EFF5FF;
  --page-glow-1: #E4EEFF;
  --page-glow-2: #DFF6FF;
  --page-glow-3: #EAF1FF;
  --page-grad-mid: #F7FAFF;
  --page-grad-end: #F2F7FF;
  --card-border: rgba(37,99,235,0.16);
}

[data-theme="dark"] {
  --bg: #0B1220;
  --text: #EEF3FF;
  --muted: #94A3C4;
  --glass: color-mix(in srgb, var(--surface) 6%, transparent);

  --surface: #131C2E;
  --surface-2: #101827;
  --surface-3: #101827;
  --page-glow-1: rgba(37,99,235,0.16);
  --page-glow-2: rgba(6,182,212,0.10);
  --page-glow-3: rgba(37,99,235,0.10);
  --page-grad-mid: #0E1626;
  --page-grad-end: #0B1220;
  --card-border: rgba(148,163,196,0.18);
}

[data-theme="dark"] .modal-card,
[data-theme="dark"] .profile-card {
  border-color: var(--card-border);
}

* { box-sizing: border-box; }

.wisp-root {
  position: relative;
  min-height: 100vh;
  background:
    radial-gradient(ellipse 80% 60% at 15% 0%, var(--page-glow-1) 0%, transparent 55%),
    radial-gradient(ellipse 70% 55% at 100% 20%, var(--page-glow-2) 0%, transparent 55%),
    radial-gradient(ellipse 65% 60% at 30% 100%, var(--page-glow-3) 0%, transparent 55%),
    linear-gradient(180deg, var(--surface) 0%, var(--page-grad-mid) 50%, var(--page-grad-end) 100%);
  color: var(--text);
  font-family: 'Inter', -apple-system, sans-serif;
  overflow-x: hidden;
  transition: background 0.3s ease, color 0.3s ease;
}

/* ---------- scroll progress ---------- */
.scroll-progress {
  position: fixed; top: 0; left: 0; height: 3px; z-index: 100;
  background: linear-gradient(90deg, var(--deep), var(--primary), var(--accent), var(--ice));
  box-shadow: 0 0 12px rgba(37,99,235,0.5); transition: width 0.15s ease-out;
}

/* ---------- reveal-on-scroll ---------- */
.reveal {
  opacity: 0; filter: blur(6px); transform: translateY(30px) scale(0.98);
  transition: opacity 0.9s var(--ease), transform 0.9s var(--ease), filter 0.9s var(--ease);
}
.reveal-on { opacity: 1; filter: blur(0); transform: translateY(0) scale(1); }

/* ---------- background ---------- */
.wisp-bg {
  position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none;
}
.aurora {
  position: absolute; border-radius: 42% 58% 63% 37% / 41% 44% 56% 59%;
  filter: blur(50px); opacity: 0.38; will-change: transform;
  animation: drift 24s ease-in-out infinite;
}
.aurora-a { width: 460px; height: 460px; background: #BFDBFE; top: -160px; left: -120px; }
.aurora-b { width: 420px; height: 420px; background: #A5F3FC; top: 12%; right: -160px; animation-delay: -8s; opacity: 0.38; }
.aurora-c { width: 500px; height: 500px; background: #DBEAFE; bottom: -220px; left: 10%; animation-delay: -14s; opacity: 0.45; }
@keyframes drift {
  0%, 100% { transform: translate3d(0,0,0) scale(1); }
  50% { transform: translate3d(30px,-25px,0) scale(1.05); }
}
.cursor-glow {
  position: absolute; width: 420px; height: 420px; border-radius: 50%;
  background: radial-gradient(circle, rgba(37,99,235,0.09), rgba(6,182,212,0.03) 55%, transparent 72%);
  transform: translate(-50%,-50%);
}
@media (hover: none), (pointer: coarse) {
  .cursor-glow { display: none; }
}
.particle {
  position: absolute; border-radius: 50%;
  background: radial-gradient(circle, rgba(37,99,235,0.5), rgba(37,99,235,0.1));
  animation-name: floaty; animation-timing-function: ease-in-out; animation-iteration-count: infinite;
  will-change: transform;
}
@keyframes floaty {
  0%, 100% { transform: translate3d(0,0,0); opacity: 0.12; }
  50% { transform: translate3d(var(--drift, 10px), -50px, 0); opacity: 0.7; }
}
.grain { position: absolute; inset: 0; background: radial-gradient(circle at 50% 0%, rgba(37,99,235,0.03), transparent 60%); }

@media (max-width: 640px) {
  .aurora-c { display: none; }
  .aurora { filter: blur(34px); }
  .particle:nth-child(n+13) { display: none; }
  .feature-card { animation: none; }
  .wave-svg-3 { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .aurora, .particle, .cursor-glow, .feature-card, .hero-badge::after,
  .wave-svg, .globe-core, .globe-orbit, .globe-ring, .dot-pulse, .status-dot.on {
    animation: none !important;
  }
  .reveal { transition: opacity 0.3s ease; filter: none; transform: none; }
}

/* ---------- typography ---------- */
h1, h2, h3, .wisp-logo, .modal-title, .match-type-label {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
}

/* ---------- ripple ---------- */
.ripple-el {
  position: absolute; border-radius: 50%; transform: scale(0);
  background: color-mix(in srgb, var(--surface) 55%, transparent); animation: rippleAnim 0.65s var(--ease); pointer-events: none;
}
.btn-ghost .ripple-el { background: rgba(37,99,235,0.18); }
@keyframes rippleAnim { to { transform: scale(2.6); opacity: 0; } }

/* ---------- magnetic ---------- */
.magnetic-wrap { display: inline-flex; transition: transform 0.3s var(--ease); }

/* ---------- flowing wave divider ---------- */
.wave-divider { position: relative; width: 100%; height: 56px; overflow: hidden; z-index: 1; margin-top: -14px; }
.wave-svg { position: absolute; top: 0; left: 0; width: 200%; height: 100%; }
.wave-svg-1 { fill: rgba(37,99,235,0.07); animation: waveFlow 16s linear infinite; }
.wave-svg-2 { fill: rgba(6,182,212,0.06); animation: waveFlow 24s linear infinite reverse; opacity: 0.85; }
.wave-svg-3 { fill: rgba(79,124,255,0.04); animation: waveFlow 32s linear infinite; opacity: 0.7; }
@keyframes waveFlow { from { transform: translateX(0); } to { transform: translateX(-50%); } }

/* ---------- glass sheen (hover sweep) ---------- */
.sheen { position: relative; overflow: hidden; }
.sheen::before {
  content: ''; position: absolute; top: -50%; left: -60%; width: 40%; height: 200%;
  background: linear-gradient(120deg, transparent, color-mix(in srgb, var(--surface) 50%, transparent), transparent);
  transform: rotate(20deg); transition: left 0.7s var(--ease);
}
.sheen:hover::before { left: 130%; }

/* ---------- nav ---------- */
.wisp-nav {
  position: sticky; top: 0; z-index: 40; padding: 18px 0;
  transition: all 0.35s var(--ease);
}
.wisp-nav--scrolled {
  position: relative;
  background: color-mix(in srgb, var(--surface) 82%, transparent); backdrop-filter: blur(10px); border-bottom: 1px solid var(--card-border);
  box-shadow: 0 8px 30px rgba(37,99,235,0.07);
}
.wisp-nav--scrolled::after {
  content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px;
  background: linear-gradient(90deg, var(--deep), var(--primary), var(--accent), var(--secondary), var(--deep));
  background-size: 300% auto; animation: gradientMove 6s linear infinite; opacity: 0.7;
}
.wisp-nav-inner {
  max-width: 1200px; margin: 0 auto; padding: 0 24px;
  display: flex; align-items: center; justify-content: space-between;
}
.wisp-logo {
  display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 20px;
  background: none; border: none; color: var(--text); cursor: pointer; letter-spacing: 0.5px;
}
.wisp-logo-mark {
  width: 34px; height: 34px; display: grid; place-items: center;
  filter: drop-shadow(0 4px 10px rgba(37,99,235,0.35));
  animation: iconFloat 4s ease-in-out infinite;
}
.wisp-logo-mark img { width: 100%; height: 100%; object-fit: contain; }
@keyframes iconFloat { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-3px) rotate(-6deg); } }
.wisp-nav-links { display: flex; gap: 4px; }
.wisp-nav-link {
  position: relative; background: none; border: none; color: var(--muted); font-size: 14.5px; font-weight: 500;
  padding: 8px 14px; border-radius: 100px; cursor: pointer; transition: all 0.25s var(--ease);
}
.wisp-nav-link::after {
  content: ''; position: absolute; left: 14px; right: 14px; bottom: 3px; height: 2px; border-radius: 2px;
  background: linear-gradient(90deg, var(--primary), var(--accent)); transform: scaleX(0); transform-origin: left;
  transition: transform 0.3s var(--ease);
}
.wisp-nav-link:hover, .wisp-nav-link.active { color: var(--primary); }
.wisp-nav-link:hover::after, .wisp-nav-link.active::after { transform: scaleX(1); }
.wisp-nav-right { display: flex; align-items: center; gap: 10px; }
.theme-toggle-btn {
  display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%;
  background: var(--glass); border: 1px solid var(--card-border); color: var(--text);
  cursor: pointer; transition: background 0.2s ease, transform 0.2s ease;
}
.theme-toggle-btn:hover { transform: scale(1.06); background: rgba(37,99,235,0.12); }
.wisp-menu-btn { display: none; background: none; border: none; color: var(--text); cursor: pointer; }
.wisp-nav-mobile { display: none; }

@media (max-width: 860px) {
  .wisp-nav-links { display: none; }
  .wisp-menu-btn { display: block; }
  .wisp-nav-mobile {
    display: flex; flex-direction: column; gap: 4px; padding: 12px 24px 4px; animation: fadeIn 0.25s ease;
  }
  .wisp-nav-mobile-link {
    text-align: left; background: none; border: none; color: var(--muted); padding: 10px 4px; font-size: 15px;
    border-bottom: 1px solid rgba(37,99,235,0.1);
  }
}

/* ---------- buttons ---------- */
.btn {
  position: relative; overflow: hidden;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  font-family: inherit; font-weight: 600; font-size: 14.5px; border-radius: 100px;
  padding: 11px 22px; cursor: pointer; border: none; transition: transform 0.2s var(--ease), box-shadow 0.3s var(--ease), opacity 0.2s;
  text-decoration: none;
}
.btn:active { transform: scale(0.96); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-primary {
  background: linear-gradient(115deg, var(--deep), var(--primary) 45%, var(--secondary) 70%, var(--accent));
  background-size: 180% auto; background-position: 0% 50%;
  color: white;
  box-shadow: 0 8px 24px rgba(37,99,235,0.32);
  transition: transform 0.2s var(--ease), box-shadow 0.3s var(--ease), background-position 0.5s var(--ease);
}
.btn-primary:hover:not(:disabled) { box-shadow: 0 14px 36px rgba(37,99,235,0.45); transform: translateY(-2px); background-position: 100% 50%; }
.btn-ghost { background: rgba(37,99,235,0.06); color: var(--primary); border: 1px solid rgba(37,99,235,0.18); }
.btn-ghost:hover { background: rgba(37,99,235,0.12); transform: translateY(-1px); }
.btn-lg { padding: 15px 30px; font-size: 15.5px; }
.btn-sm { padding: 8px 16px; font-size: 13px; }
.btn-full { width: 100%; }
.btn-shine::after {
  content: ''; position: absolute; top: 0; left: -60%; width: 40%; height: 100%;
  background: linear-gradient(120deg, transparent, color-mix(in srgb, var(--surface) 65%, transparent), transparent);
  transform: skewX(-20deg); transition: left 0.6s var(--ease);
}
.btn-shine:hover::after { left: 130%; }

/* ---------- hero ---------- */
.hero {
  position: relative; z-index: 1; max-width: 900px; margin: 0 auto; padding: 100px 24px 76px;
  text-align: center; display: flex; flex-direction: column; align-items: center;
}
.hero-badge {
  position: relative; overflow: hidden;
  display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--primary);
  background: color-mix(in srgb, var(--surface) 90%, transparent); border: 1px solid rgba(37,99,235,0.16); padding: 7px 16px; border-radius: 100px;
  margin-bottom: 28px; box-shadow: 0 6px 18px rgba(37,99,235,0.08);
}
.hero-badge::after {
  content: ''; position: absolute; top: 0; left: 0; width: 40%; height: 100%;
  background: linear-gradient(120deg, transparent, rgba(37,99,235,0.16), transparent);
  transform: skewX(-20deg) translateX(-250%); animation: badgeShine 3.4s ease-in-out infinite;
  will-change: transform;
}
@keyframes badgeShine { 0% { transform: skewX(-20deg) translateX(-250%); } 60%, 100% { transform: skewX(-20deg) translateX(350%); } }
.dot-pulse { width: 7px; height: 7px; border-radius: 50%; background: var(--success); box-shadow: 0 0 0 0 rgba(22,163,74,0.6); animation: pulse 1.8s infinite; }
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(22,163,74,0.5); }
  70% { box-shadow: 0 0 0 8px rgba(22,163,74,0); }
  100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); }
}
.hero-title { font-size: clamp(40px, 7.4vw, 72px); line-height: 1.04; font-weight: 700; letter-spacing: -1.8px; margin: 0 0 22px; color: var(--text); }
.hero-title-gradient {
  background: linear-gradient(100deg, var(--deep), var(--primary) 35%, var(--accent) 65%, var(--secondary));
  -webkit-background-clip: text; background-clip: text; color: transparent;
  background-size: 250% auto; animation: gradientMove 7s ease infinite;
}
@keyframes gradientMove { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
.hero-sub { font-size: 17.5px; color: var(--muted); line-height: 1.65; max-width: 470px; margin-bottom: 38px; }
.hero-actions { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }
.hero-orb {
  position: absolute; width: 340px; height: 340px; border-radius: 50%; top: 4%; left: 50%;
  --py: 0px;
  transform: translate3d(-50%, var(--py), 0); background: radial-gradient(circle, rgba(6,182,212,0.18), transparent 70%);
  filter: blur(44px); z-index: -1; animation: breatheOrb 5.5s ease-in-out infinite;
}
@keyframes breatheOrb {
  0%,100% { opacity: 0.5; transform: translate3d(-50%, var(--py), 0) scale(1); }
  50% { opacity: 1; transform: translate3d(-50%, var(--py), 0) scale(1.2); }
}
@keyframes breathe { 0%,100% { opacity: 0.5; transform: translateX(-50%) scale(1); } 50% { opacity: 1; transform: translateX(-50%) scale(1.2); } }

/* ---------- sections ---------- */
.section { position: relative; z-index: 1; max-width: 1140px; margin: 0 auto; padding: 76px 24px; }
.section-narrow { max-width: 720px; }
.section-head { text-align: center; margin-bottom: 48px; position: relative; }
.section-head::after {
  content: ''; display: block; width: 46px; height: 3px; border-radius: 3px; margin: 16px auto 0;
  background: linear-gradient(90deg, var(--primary), var(--accent), var(--secondary), var(--primary));
  background-size: 300% auto; animation: gradientMove 5s linear infinite;
}
.eyebrow {
  display: inline-block; font-size: 12.5px; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  -webkit-background-clip: text; background-clip: text; color: transparent;
  margin-bottom: 12px;
}
.section-title { font-size: clamp(27px, 4vw, 38px); font-weight: 700; letter-spacing: -0.6px; margin: 0; color: var(--text); }
.body-text { color: var(--muted); line-height: 1.75; font-size: 15.5px; margin-bottom: 18px; }

/* ---------- feature grid ---------- */
.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 18px; }
.feature-card-outer { position: relative; border-radius: 22px; }
.feature-card-outer::after {
  content: ''; position: absolute; inset: -2px; border-radius: 24px; z-index: 0;
  background: conic-gradient(from 0deg, var(--primary), var(--accent), var(--secondary), var(--primary));
  opacity: 0; transition: opacity 0.35s var(--ease);
}
.feature-card-outer:hover::after { opacity: 0.55; animation: spinRing 2.5s linear infinite; }
@keyframes spinRing { to { transform: rotate(360deg); } }
.feature-card {
  position: relative; z-index: 1; overflow: hidden;
  background: color-mix(in srgb, var(--surface) 90%, transparent); border: 1px solid rgba(37,99,235,0.1); border-radius: 22px; padding: 26px;
  transition: box-shadow 0.3s var(--ease), border-color 0.3s var(--ease);
  box-shadow: 0 4px 18px rgba(37,99,235,0.06);
  will-change: transform;
  animation: cardFloat 5.5s ease-in-out infinite;
}
@keyframes cardFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.feature-card::before {
  content: ''; position: absolute; top: -60%; left: -80%; width: 50%; height: 240%;
  background: linear-gradient(120deg, transparent, color-mix(in srgb, var(--surface) 55%, transparent), transparent);
  transform: rotate(20deg); transition: left 0.8s var(--ease);
}
.feature-card:hover::before { left: 140%; }
.feature-card:hover {
  border-color: rgba(37,99,235,0.35); box-shadow: 0 20px 44px rgba(37,99,235,0.18);
  animation-play-state: paused;
}
.feature-icon {
  width: 42px; height: 42px; border-radius: 13px; display: grid; place-items: center; margin-bottom: 14px;
  background: linear-gradient(135deg, rgba(37,99,235,0.16), rgba(6,182,212,0.16)); color: var(--primary);
  transition: transform 0.35s var(--ease);
}
.feature-card:hover .feature-icon { transform: scale(1.12) rotate(-8deg); }
.feature-card h3 { font-size: 16px; margin: 0 0 6px; color: var(--text); }
.feature-card p { font-size: 13.5px; color: var(--muted); margin: 0; line-height: 1.5; }

/* ---------- timeline ---------- */
.timeline { display: flex; flex-direction: column; gap: 6px; max-width: 640px; margin: 0 auto; }
.timeline-step {
  display: flex; gap: 22px; align-items: flex-start; padding: 20px 22px; border-radius: 18px;
  transition: background 0.25s var(--ease), transform 0.25s var(--ease);
}
.timeline-step:hover { background: rgba(37,99,235,0.05); transform: translateX(6px); }
.timeline-num {
  font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 700; color: white;
  width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
  display: grid; place-items: center; background: linear-gradient(135deg, var(--deep), var(--primary), var(--accent));
  background-size: 200% auto;
  box-shadow: 0 6px 16px rgba(37,99,235,0.32);
  transition: background-position 0.4s;
}
.timeline-step:hover .timeline-num { background-position: 100% 50%; }
.timeline-step h3 { margin: 0 0 4px; font-size: 16px; color: var(--text); }
.timeline-step p { margin: 0; color: var(--muted); font-size: 14px; }

/* ---------- glass card / forms ---------- */
.glass-card {
  background: color-mix(in srgb, var(--surface) 92%, transparent); border: 1px solid rgba(37,99,235,0.12); border-radius: 22px; padding: 28px;
  margin-top: 24px; box-shadow: 0 10px 34px rgba(37,99,235,0.09);
}
.form-card { display: flex; flex-direction: column; gap: 16px; }
.form-card label { display: flex; flex-direction: column; gap: 6px; font-size: 13.5px; color: var(--muted); }
.form-card input, .form-card textarea, .form-card select {
  background: rgba(37,99,235,0.045); border: 1.5px solid rgba(37,99,235,0.16); border-radius: 13px;
  padding: 12px 14px; color: var(--text); font-family: inherit; font-size: 14.5px; outline: none;
  transition: border-color 0.25s var(--ease), box-shadow 0.3s var(--ease), transform 0.25s var(--ease), background 0.25s var(--ease);
}
.form-card input:hover, .form-card textarea:hover, .form-card select:hover { border-color: rgba(37,99,235,0.3); }
.form-card input:focus, .form-card textarea:focus, .form-card select:focus {
  border-color: var(--primary); background: color-mix(in srgb, var(--surface) 90%, transparent);
  box-shadow: 0 0 0 4px rgba(37,99,235,0.14), 0 8px 20px rgba(37,99,235,0.12);
  transform: translateY(-1px);
}
.success-card { display: flex; align-items: center; gap: 12px; color: var(--success); animation: modalIn 0.4s var(--ease); }

/* ---------- policy list ---------- */
.policy-list { display: flex; flex-direction: column; gap: 4px; margin-top: 10px; }
.policy-item {
  display: flex; gap: 16px; padding: 18px; border-radius: 16px; align-items: flex-start; color: var(--primary);
  transition: background 0.25s var(--ease);
}
.policy-item:hover { background: rgba(37,99,235,0.05); }
.policy-item h4 { margin: 0 0 4px; color: var(--text); font-size: 15px; }
.policy-item p { margin: 0; color: var(--muted); font-size: 13.5px; }

/* ---------- footer ---------- */
.footer { position: relative; z-index: 1; border-top: 1px solid rgba(37,99,235,0.1); padding: 40px 24px 28px; margin-top: 40px; }
.footer-top { max-width: 1140px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
.footer-links { display: flex; gap: 22px; }
.footer-links button { background: none; border: none; color: var(--muted); font-size: 13.5px; cursor: pointer; transition: color 0.2s; }
.footer-links button:hover { color: var(--primary); }
.footer-bottom { max-width: 1140px; margin: 24px auto 0; padding-top: 20px; border-top: 1px solid rgba(37,99,235,0.08); color: var(--muted); font-size: 12.5px; }

/* ---------- modal / onboarding ---------- */
.modal-overlay {
  position: fixed; inset: 0; z-index: 50; background: rgba(226,238,255,0.85); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.3s var(--ease);
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal-card {
  position: relative; width: 100%; max-width: 480px; background: color-mix(in srgb, var(--surface) 98%, transparent);
  border: 1px solid var(--card-border); border-radius: 26px; padding: 34px 30px;
  box-shadow: 0 30px 80px rgba(37,99,235,0.2);
  animation: modalIn 0.45s var(--ease);
}
@keyframes modalIn { from { opacity: 0; transform: translateY(28px) scale(0.96); filter: blur(4px); } to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }
.modal-close { position: absolute; top: 20px; right: 20px; background: rgba(37,99,235,0.08); border: none; color: var(--primary); width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: grid; place-items: center; transition: background 0.25s, transform 0.3s var(--ease); }
.modal-close:hover { background: rgba(37,99,235,0.16); transform: rotate(90deg); }
.modal-close-light { background: color-mix(in srgb, var(--surface) 90%, transparent); box-shadow: 0 4px 14px rgba(37,99,235,0.15); }
.modal-title { font-size: 22px; margin: 4px 0 6px; color: var(--text); }
.modal-sub { color: var(--muted); font-size: 13.5px; margin: 0 0 22px; }
.modal-actions { display: flex; gap: 12px; margin-top: 22px; }
.modal-actions .btn-ghost { flex-shrink: 0; }
.skip-confirm-overlay { z-index: 70; }
.skip-confirm-card { max-width: 400px; text-align: center; }
.skip-confirm-card .modal-actions { flex-direction: column-reverse; }
.edit-prompt-question { margin-top: -10px; }
.btn-text-sm { font-size: 13px; padding: 8px 14px; }

.end-toast {
  position: fixed; top: 18px; left: 50%; z-index: 90;
  display: flex; align-items: center; gap: 9px;
  background: rgba(15,23,42,0.92); color: #fff; border-radius: 999px;
  padding: 10px 18px 10px 14px; font-size: 13.5px; font-weight: 500;
  box-shadow: 0 12px 28px rgba(15,23,42,0.28);
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.end-toast-icon {
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: 50%;
  background: rgba(37,99,235,0.35); color: #fff; flex-shrink: 0;
}
.end-toast-in { opacity: 1; transform: translate(-50%, 0); }
.end-toast-out { opacity: 0; transform: translate(-50%, -14px); pointer-events: none; }

.progress-dots { display: flex; gap: 6px; margin-bottom: 18px; }
.progress-dot { width: 26px; height: 4px; border-radius: 4px; background: rgba(37,99,235,0.12); transition: background 0.4s var(--ease); }
.progress-dot.on { background: linear-gradient(90deg, var(--primary), var(--accent)); }

.profile-hero {
  position: relative; height: 84px; margin: -34px -30px 20px; overflow: hidden;
  border-radius: 26px 26px 0 0;
  background: linear-gradient(120deg, var(--deep), var(--primary) 55%, var(--accent));
  background-size: 220% auto; animation: gradientMove 8s ease infinite;
  display: flex; align-items: flex-end; justify-content: center;
}
.profile-hero-blob {
  position: absolute; width: 160px; height: 160px; border-radius: 50%;
  background: color-mix(in srgb, var(--surface) 18%, transparent); filter: blur(30px); top: -60px; left: 20%;
  animation: drift 10s ease-in-out infinite;
}
.profile-hero-badge {
  position: relative; z-index: 1; margin-bottom: -26px;
  width: 52px; height: 52px; border-radius: 16px; display: grid; place-items: center;
  background: color-mix(in srgb, var(--surface) 95%, transparent); color: var(--primary);
  box-shadow: 0 10px 24px rgba(37,99,235,0.35);
  animation: iconFloat 4s ease-in-out infinite;
}
.photo-picker { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.photo-picker-btn {
  border: none; cursor: pointer; padding: 0; overflow: hidden;
  border-radius: 16px; width: 52px; height: 52px; position: relative;
}
.photo-picker-img { width: 100%; height: 100%; object-fit: cover; border-radius: 16px; display: block; }
.photo-picker-edit {
  position: absolute; bottom: -4px; right: -4px; width: 20px; height: 20px; border-radius: 50%;
  background: var(--primary); color: #fff; display: grid; place-items: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.25);
}
.photo-picker-remove { background: none; border: none; color: var(--muted); font-size: 12px; text-decoration: underline; cursor: pointer; margin-top: 6px; }
.photo-picker-error { color: #dc2626; font-size: 12px; margin-top: 4px; text-align: center; }
.chat-partner-avatar {
  width: 36px; height: 36px; border-radius: 50%; overflow: hidden; flex-shrink: 0;
  background: linear-gradient(135deg, var(--primary), var(--purple)); color: #fff; display: grid; place-items: center;
  font-weight: 600; font-size: 14px; box-shadow: 0 0 0 2px color-mix(in srgb, var(--purple) 25%, transparent);
}
.chat-partner-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }

.chat-back-btn { flex-shrink: 0; }
.chat-partner-meta { font-size: 11.5px; color: var(--muted); line-height: 1.35; }
.chat-partner-meta-2 { margin-top: -1px; }
.icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.icon-btn:disabled:hover { transform: none; }

.chat-menu-anchor { position: relative; }
.chat-menu-backdrop { position: fixed; inset: 0; z-index: 55; background: transparent; }
.chat-menu-sheet {
  position: absolute; top: calc(100% + 8px); right: 0; z-index: 56; min-width: 210px;
  background: color-mix(in srgb, var(--surface) 98%, transparent); border: 1px solid var(--card-border);
  border-radius: 16px; padding: 6px; box-shadow: 0 20px 48px rgba(15,23,42,0.22);
  animation: modalIn 0.2s var(--ease);
}
.chat-menu-item {
  width: 100%; display: flex; align-items: center; gap: 10px; padding: 11px 12px; border-radius: 11px;
  background: none; border: none; color: var(--text); font-size: 13.5px; font-weight: 500;
  cursor: pointer; text-align: left; transition: background 0.15s ease;
}
.chat-menu-item:hover { background: rgba(37,99,235,0.08); }
.chat-menu-item:disabled { opacity: 0.55; cursor: default; }
.chat-menu-item.reported { color: var(--success); }
.chat-menu-item-danger { color: #DC2626; }
.chat-menu-item-danger:hover { background: rgba(220,38,38,0.08); }

.chat-date-sep { display: flex; justify-content: center; margin: 14px 0 6px; }
.chat-date-sep span {
  font-size: 11px; font-weight: 600; color: var(--muted); background: var(--glass);
  border: 1px solid var(--card-border); padding: 4px 12px; border-radius: 100px;
}
.jump-to-latest-btn {
  position: absolute; left: 50%; bottom: 92px; transform: translateX(-50%); z-index: 15;
  display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 100px;
  background: var(--primary); color: #fff; border: none; font-size: 12.5px; font-weight: 600;
  box-shadow: 0 10px 24px rgba(37,99,235,0.35); cursor: pointer; animation: fadeIn 0.25s ease;
}
.voice-notice-toast {
  position: absolute; left: 50%; bottom: 78px; transform: translateX(-50%); z-index: 20;
  display: flex; align-items: center; gap: 10px; padding: 9px 14px; border-radius: 100px;
  background: rgba(15,23,42,0.92); color: #fff; font-size: 12.5px; font-weight: 500;
  box-shadow: 0 12px 28px rgba(15,23,42,0.28); animation: fadeIn 0.25s ease; white-space: nowrap;
}
.call-notice-toast { top: 70px; bottom: auto; }
.voice-notice-toast button { background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; display: grid; place-items: center; }
.chat-ended-match-grid { margin: 18px 0 6px; width: 100%; max-width: 380px; }
.close-friend-heart { margin-left: 4px; font-size: 13px; }
.close-friend-bar {
  display: flex; justify-content: center; padding: 8px 16px 0;
  max-width: 720px; width: 100%; margin: 0 auto;
}
.close-friend-btn {
  display: flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 100px;
  background: linear-gradient(135deg, var(--primary), var(--purple)); color: #fff; border: none;
  font-size: 12px; font-weight: 600; cursor: pointer; box-shadow: 0 6px 16px rgba(124,92,252,0.28);
  transition: transform 0.15s ease, opacity 0.2s ease;
}
.close-friend-btn:hover:not(:disabled) { transform: scale(1.03); }
.close-friend-btn:disabled { opacity: 0.7; cursor: default; }
.close-friend-btn.sent { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.75); box-shadow: none; }

.chat-menu-badge, .nav-badge {
  display: inline-flex; align-items: center; justify-content: center; min-width: 16px; height: 16px;
  border-radius: 100px; background: #DC2626; color: #fff; font-size: 10px; font-weight: 700; padding: 0 4px;
  margin-left: 6px;
}
.nav-badge { position: absolute; top: 2px; right: 2px; margin-left: 0; }
.theme-toggle-btn { position: relative; }

.friends-modal-card { max-width: 420px; text-align: left; }
.friends-empty { color: var(--muted); font-size: 13.5px; text-align: center; padding: 20px 0; }
.friend-request-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; max-height: 340px; overflow-y: auto; }
.friend-request-row, .friend-list-row {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 14px;
  background: var(--glass); border: 1px solid var(--card-border);
}
.friend-list-row { width: 100%; cursor: pointer; text-align: left; color: var(--text); font-family: inherit; transition: background 0.15s ease; }
.friend-list-row:hover { background: rgba(37,99,235,0.08); }
.friend-avatar-sm {
  position: relative; width: 34px; height: 34px; border-radius: 50%; overflow: hidden; flex-shrink: 0;
  background: linear-gradient(135deg, var(--primary), var(--purple)); color: #fff; display: grid; place-items: center;
  font-weight: 600; font-size: 13px;
}
.friend-avatar-sm img { width: 100%; height: 100%; object-fit: cover; display: block; }
.friend-presence-dot {
  position: absolute; bottom: -1px; right: -1px; width: 9px; height: 9px; border-radius: 50%;
  background: #C6D2E3; border: 2px solid var(--surface);
}
.friend-presence-dot.on { background: var(--success); }
.friend-request-name { flex: 1; font-size: 13.5px; font-weight: 600; }
.friend-online-label { font-size: 11px; font-weight: 500; color: var(--muted); margin-left: 4px; }
.friend-request-actions { display: flex; gap: 6px; }
.friend-accept-btn, .friend-decline-btn {
  width: 30px; height: 30px; border-radius: 50%; border: none; display: grid; place-items: center; cursor: pointer;
}
.friend-accept-btn { background: rgba(22,163,74,0.14); color: var(--success); }
.friend-decline-btn { background: rgba(220,38,38,0.1); color: #DC2626; }
.friend-toast { top: 18px; }

.current-filter-card {
  display: flex; align-items: center; gap: 12px; width: 100%; max-width: 380px;
  margin: 18px 0 6px; padding: 12px 14px; border-radius: 18px;
  background: color-mix(in srgb, var(--surface) 90%, transparent);
  border: 1px solid var(--card-border); box-shadow: 0 8px 24px rgba(37,99,235,0.08);
  animation: fadeIn 0.3s ease;
}
.current-filter-text { flex: 1; display: flex; flex-direction: column; gap: 1px; text-align: left; }
.current-filter-label { font-size: 10.5px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.4px; font-weight: 600; }
.current-filter-value { font-size: 14px; font-weight: 700; color: var(--text); }
.current-filter-change-btn {
  display: flex; align-items: center; gap: 5px; padding: 7px 13px; border-radius: 100px;
  background: linear-gradient(135deg, var(--primary), var(--purple)); color: #fff; border: none;
  font-size: 12px; font-weight: 600; cursor: pointer; flex-shrink: 0;
  box-shadow: 0 6px 16px rgba(124,92,252,0.3); transition: transform 0.15s ease;
}
.current-filter-change-btn:hover { transform: scale(1.05); }
.preview-page { padding: 0; justify-content: flex-start; }
.preview-banner {
  width: 100%; text-align: center; padding: 8px 12px; font-size: 12px; font-weight: 600;
  background: #F59E0B; color: #1A1200; display: flex; align-items: center; justify-content: center; gap: 6px;
}
.admin-page {
  min-height: 100vh; background: var(--bg); padding: 32px 20px; max-width: 640px; margin: 0 auto;
  font-family: 'Inter', -apple-system, sans-serif; color: var(--text);
}
.admin-header { display: flex; align-items: center; gap: 10px; margin-bottom: 26px; color: var(--primary); }
.admin-header h1 { font-size: 19px; font-weight: 700; margin: 0; }
.admin-token-form {
  display: flex; flex-direction: column; gap: 14px; background: var(--surface); border: 1px solid var(--card-border);
  border-radius: 18px; padding: 22px; max-width: 380px;
}
.admin-token-form label { display: flex; flex-direction: column; gap: 6px; font-size: 12.5px; font-weight: 600; color: var(--muted); }
.admin-token-form input {
  padding: 11px 14px; border-radius: 10px; border: 1.5px solid var(--card-border); font-size: 14px;
  background: var(--surface); color: var(--text);
}
.admin-error { color: #DC2626; font-size: 12.5px; margin: 0; }
.admin-empty { color: var(--muted); font-size: 13.5px; }
.admin-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.admin-count { font-size: 12.5px; color: var(--muted); font-weight: 600; }
.admin-report-list { display: flex; flex-direction: column; gap: 12px; }
.admin-report-card {
  background: var(--surface); border: 1px solid var(--card-border); border-radius: 14px; padding: 14px 16px;
}
.admin-report-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.admin-report-status {
  font-size: 10.5px; font-weight: 700; text-transform: uppercase; padding: 3px 9px; border-radius: 100px;
  background: rgba(220,38,38,0.12); color: #DC2626;
}
.admin-report-status.status-reviewed { background: rgba(37,99,235,0.12); color: var(--primary); }
.admin-report-status.status-actioned,
.admin-report-status.status-dismissed { background: rgba(22,163,74,0.12); color: var(--success); }
.admin-report-time { font-size: 11px; color: var(--muted); }
.admin-report-body { font-size: 13px; line-height: 1.7; color: var(--text); }
.admin-report-body strong { color: var(--muted); font-weight: 600; }
.profile-card .progress-dots { margin-top: 22px; justify-content: center; }
.field-pop { opacity: 0; animation: fieldIn 0.45s var(--ease) forwards; }
@keyframes fieldIn { from { opacity: 0; } to { opacity: 1; } }
.onboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
.onboard-grid label { display: flex; flex-direction: column; gap: 7px; font-size: 12.5px; font-weight: 600; color: var(--muted); letter-spacing: 0.2px; }
.onboard-grid label:has(.country-select.open) { position: relative; z-index: 40; }
.onboard-grid input, .onboard-grid select {
  width: 100%; background: linear-gradient(180deg, rgba(37,99,235,0.05), rgba(37,99,235,0.02));
  border: 1.5px solid rgba(37,99,235,0.14); border-radius: 16px;
  padding: 13px 14px; color: var(--text); font-family: inherit; font-size: 14.5px; outline: none;
  box-shadow: inset 0 1px 2px rgba(10,23,48,0.03);
  transition: border-color 0.25s var(--ease), box-shadow 0.3s var(--ease), transform 0.25s var(--ease), background 0.25s var(--ease);
}
.onboard-grid input:hover, .onboard-grid select:hover { border-color: rgba(37,99,235,0.32); }
.onboard-grid input:focus, .onboard-grid select:focus {
  border-color: var(--primary); background: color-mix(in srgb, var(--surface) 96%, transparent);
  box-shadow: 0 0 0 4px rgba(37,99,235,0.13), 0 10px 22px rgba(37,99,235,0.14);
  transform: translateY(-2px);
}
.field-icon-wrap { position: relative; display: flex; align-items: center; }
.field-has-error .field-icon-wrap input,
.field-has-error .field-icon-wrap select {
  border-color: #DC2626 !important; background: rgba(220,38,38,0.04) !important;
}
.field-has-error .field-icon-badge { background: rgba(220,38,38,0.14); color: #DC2626; }
.field-icon-badge {
  position: absolute; left: 6px; width: 26px; height: 26px; border-radius: 9px; z-index: 1;
  display: grid; place-items: center; pointer-events: none;
  background: linear-gradient(135deg, rgba(37,99,235,0.16), rgba(6,182,212,0.16)); color: var(--primary);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.25s var(--ease);
}
.field-icon-wrap:focus-within .field-icon-badge {
  transform: scale(1.1) rotate(-6deg);
  background: linear-gradient(135deg, var(--primary), var(--accent)); color: white;
}
.field-icon-wrap input, .field-icon-wrap select { padding-left: 42px; }
.field-underline {
  position: absolute; left: 14px; right: 14px; bottom: 5px; height: 2px; border-radius: 2px; z-index: 1;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  transform: scaleX(0); transform-origin: left; transition: transform 0.35s var(--ease); pointer-events: none;
}
.field-icon-wrap:focus-within .field-underline { transform: scaleX(1); }

/* ---------- searchable country select ---------- */
.country-select { position: relative; width: 100%; }
.country-select-trigger {
  width: 100%; text-align: left; display: flex; align-items: center; justify-content: space-between;
  background: linear-gradient(180deg, rgba(37,99,235,0.05), rgba(37,99,235,0.02));
  border: 1.5px solid rgba(37,99,235,0.14); border-radius: 16px;
  padding: 13px 14px 13px 42px; color: var(--text); font-family: inherit; font-size: 14.5px; cursor: pointer;
  box-shadow: inset 0 1px 2px rgba(10,23,48,0.03);
  transition: border-color 0.25s var(--ease), box-shadow 0.3s var(--ease), transform 0.25s var(--ease), background 0.25s var(--ease);
}
.country-select-trigger:hover { border-color: rgba(37,99,235,0.32); }
.country-select.open .country-select-trigger {
  border-color: var(--primary); background: color-mix(in srgb, var(--surface) 96%, transparent);
  box-shadow: 0 0 0 4px rgba(37,99,235,0.13), 0 10px 22px rgba(37,99,235,0.14);
}
.country-placeholder { color: var(--muted); }
.country-select-chevron { color: var(--muted); transition: transform 0.3s var(--ease); flex-shrink: 0; }
.country-select.open .country-select-chevron { transform: rotate(180deg); color: var(--primary); }
.country-select-panel {
  z-index: 300;
  background: var(--surface); border: 1px solid var(--card-border); border-radius: 16px;
  box-shadow: 0 20px 48px rgba(37,99,235,0.28); overflow: hidden;
  animation: modalIn 0.22s var(--ease);
}
.country-search-wrap {
  display: flex; align-items: center; gap: 8px; padding: 10px 12px;
  border-bottom: 1px solid rgba(37,99,235,0.1); color: var(--primary);
}
.country-search-wrap input {
  flex: 1; border: none; outline: none; background: transparent; font-family: inherit;
  font-size: 13.5px; color: var(--text);
}
.country-list { max-height: 200px; overflow-y: auto; padding: 6px; }
.country-item {
  width: 100%; display: flex; align-items: center; justify-content: space-between; text-align: left;
  background: none; border: none; border-radius: 10px; padding: 9px 10px; font-size: 13.5px;
  color: var(--text); cursor: pointer; transition: background 0.15s var(--ease);
}
.country-item:hover { background: rgba(37,99,235,0.08); }
.country-item.on { color: var(--primary); font-weight: 600; background: rgba(37,99,235,0.06); }
.country-empty { padding: 14px 10px; text-align: center; color: var(--muted); font-size: 13px; }

.interest-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 26px; }
.interest-chip {
  padding: 9px 16px; border-radius: 100px; border: 1.5px solid rgba(37,99,235,0.18); background: rgba(37,99,235,0.04);
  color: var(--muted); font-size: 13.5px; cursor: pointer; transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.interest-chip:hover { border-color: rgba(37,99,235,0.4); transform: translateY(-2px); }
.interest-chip:active { transform: scale(0.92); }
.interest-chip.on { background: linear-gradient(135deg, var(--primary), var(--accent)); color: white; border-color: transparent; box-shadow: 0 6px 16px rgba(37,99,235,0.3); transform: scale(1.04); }

.match-type-grid { display: flex; flex-direction: column; gap: 10px; margin-bottom: 8px; }
.match-type-card {
  position: relative; overflow: hidden;
  display: flex; align-items: center; gap: 14px; text-align: left; padding: 14px 18px; border-radius: 16px;
  border: 1.5px solid rgba(37,99,235,0.16); background: rgba(37,99,235,0.03); cursor: pointer; transition: all 0.25s var(--ease);
}
.match-type-card:hover { border-color: rgba(37,99,235,0.35); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37,99,235,0.1); }
.match-type-card.on { border-color: var(--primary); background: linear-gradient(135deg, rgba(37,99,235,0.1), rgba(6,182,212,0.08)); box-shadow: 0 8px 22px rgba(37,99,235,0.15); }
.match-type-icon {
  width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; flex-shrink: 0;
  background: linear-gradient(135deg, rgba(37,99,235,0.14), rgba(6,182,212,0.14)); color: var(--primary);
  transition: transform 0.3s var(--ease);
}
.match-type-card:hover .match-type-icon { transform: scale(1.08) rotate(-4deg); }
.tint-boy { background: linear-gradient(135deg, rgba(37,99,235,0.18), rgba(59,130,246,0.14)); color: #1D4ED8; }
.tint-girl { background: linear-gradient(135deg, rgba(219,39,119,0.16), rgba(236,72,153,0.12)); color: #DB2777; }
.tint-random { background: linear-gradient(135deg, rgba(6,182,212,0.18), rgba(37,99,235,0.12)); color: #0891B2; }
.match-type-text { display: flex; flex-direction: column; gap: 3px; }
.match-type-label { font-weight: 600; font-size: 15px; color: var(--text); }
.match-type-desc { color: var(--muted); font-size: 12.5px; }
.match-type-check {
  position: absolute; top: 10px; right: 10px; width: 20px; height: 20px; border-radius: 50%;
  display: grid; place-items: center; color: white;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  transform: scale(0); transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.match-type-card.on .match-type-check { transform: scale(1); }

.age-check { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: var(--text); margin-bottom: 6px; cursor: pointer; line-height: 1.5; }
.age-check input {
  appearance: none; -webkit-appearance: none; position: relative;
  margin-top: 2px; width: 21px; height: 21px; flex-shrink: 0; cursor: pointer;
  border-radius: 7px; border: 1.75px solid rgba(37,99,235,0.35); background: rgba(37,99,235,0.04);
  transition: background 0.25s var(--ease), border-color 0.25s var(--ease), transform 0.15s var(--ease), box-shadow 0.25s var(--ease);
}
.age-check input:hover { border-color: rgba(37,99,235,0.6); }
.age-check input:checked {
  background: linear-gradient(135deg, var(--primary), var(--accent)); border-color: transparent;
  box-shadow: 0 4px 14px rgba(37,99,235,0.35);
}
.age-check input:active { transform: scale(0.88); }
.age-check input::after {
  content: ''; position: absolute; left: 6.5px; top: 2px; width: 5px; height: 10px;
  border: solid white; border-width: 0 2.5px 2.5px 0; transform: rotate(45deg) scale(0);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.age-check input:checked::after { transform: rotate(45deg) scale(1); }

.age-warning {
  display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600;
  color: #DC2626; background: rgba(220,38,38,0.07); border: 1px solid rgba(220,38,38,0.18);
  border-radius: 12px; padding: 10px 14px; margin-bottom: 16px; animation: fadeIn 0.3s ease;
}

/* ---------- searching (full screen) ---------- */
.searching-fullscreen {
  position: relative; z-index: 5; min-height: 100vh; width: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: 24px;
}
.modal-close-light { position: fixed; top: 24px; right: 24px; }
.globe-wrap { position: relative; width: 140px; height: 140px; margin: 0 auto 30px; display: grid; place-items: center; }
.globe-core {
  width: 64px; height: 64px; border-radius: 50%; display: grid; place-items: center; z-index: 2;
  background: linear-gradient(135deg, var(--deep), var(--primary), var(--accent)); background-size: 200% auto;
  color: white; box-shadow: 0 0 40px rgba(37,99,235,0.55); animation: coreSpin 5s linear infinite;
}
@keyframes coreSpin { from { background-position: 0% 50%; } to { background-position: 200% 50%; } }
.globe-ring { position: absolute; border-radius: 50%; border: 1.5px solid rgba(37,99,235,0.35); animation: ringExpand 2.4s ease-out infinite; }
.globe-ring-1 { width: 90px; height: 90px; }
.globe-ring-2 { width: 90px; height: 90px; animation-delay: 1.2s; }
.globe-orbit { position: absolute; width: 130px; height: 130px; border-radius: 50%; animation: orbitSpin 4s linear infinite; }
.globe-orbit::before {
  content: ''; position: absolute; top: -3px; left: 50%; width: 7px; height: 7px; border-radius: 50%;
  background: var(--accent); box-shadow: 0 0 10px rgba(6,182,212,0.8); transform: translateX(-50%);
}
.globe-orbit-2 { width: 158px; height: 158px; animation: orbitSpin 6.5s linear infinite reverse; }
.globe-orbit-2::before { width: 5px; height: 5px; background: var(--primary); box-shadow: 0 0 8px rgba(37,99,235,0.8); }
@keyframes orbitSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes ringExpand { 0% { width: 70px; height: 70px; opacity: 0.9; } 100% { width: 155px; height: 155px; opacity: 0; } }
.globe-pulse { position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(circle, rgba(37,99,235,0.22), transparent 70%); animation: breatheGlow 2.5s ease-in-out infinite; }

/* ---------- chat (full screen) ---------- */
.chat-page-full { position: fixed; inset: 0; z-index: 10; display: flex; padding: 0; }
.chat-shell {
  width: 100%; max-width: 480px; height: 82vh; max-height: 720px; display: flex; flex-direction: column;
  background: color-mix(in srgb, var(--surface) 97%, transparent); border: 1px solid var(--card-border); border-radius: 26px;
  overflow: hidden; box-shadow: 0 30px 80px rgba(37,99,235,0.2); position: relative;
}
.chat-shell-full {
  width: 100%; height: 100vh; max-width: none; max-height: none; border-radius: 0; border: none;
  margin: 0 auto;
  /* Always black, independent of the light/dark theme toggle — this is a
     deliberate choice for the chat page specifically, not a dark-mode
     side effect. */
  background:
    radial-gradient(ellipse 60% 40% at 90% 0%, rgba(124,92,252,0.14) 0%, transparent 60%),
    radial-gradient(circle, rgba(124,92,252,0.22) 1.4px, transparent 1.4px),
    linear-gradient(180deg, #060A14, #000000);
  background-size: auto, 26px 26px, auto;
  background-position: 0 0, 0 0, 0 0;
}
.chat-shell-full .chat-partner-name,
.chat-shell-full .chat-partner-meta,
.chat-shell-full .chat-partner-status { color: rgba(255,255,255,0.92); }
.chat-shell-full .chat-partner-meta { color: rgba(255,255,255,0.65); }
.chat-shell-full .chat-system-msg { color: rgba(255,255,255,0.55); }
.chat-shell-full .icon-btn {
  color: rgba(255,255,255,0.85); border-color: rgba(255,255,255,0.16); background: rgba(255,255,255,0.06);
}
.chat-shell-full .icon-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
.chat-shell-full .icon-btn:disabled { color: rgba(255,255,255,0.35); }
.chat-shell-full .chat-input-bar input {
  background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.16); color: #fff;
}
.chat-shell-full .chat-input-bar input::placeholder { color: rgba(255,255,255,0.4); }
.chat-shell-full .status-dot { background: rgba(255,255,255,0.3); }
.chat-shell-full .chat-body { max-width: 720px; width: 100%; margin: 0 auto; }
.chat-shell-full .chat-topbar, .chat-shell-full .chat-input-bar { max-width: 720px; width: 100%; margin: 0 auto; }
.chat-system-msg-muted { color: rgba(89,105,138,0.8); font-size: 11px; margin-top: -4px; margin-bottom: 10px; }

/* ---------- chat ended (full screen) ---------- */
.chat-ended-fullscreen {
  position: fixed; inset: 0; z-index: 10; display: flex; flex-direction: column; align-items: center;
  justify-content: center; text-align: center; padding: 24px;
  background: linear-gradient(180deg, var(--surface), var(--surface-3));
}
.chat-ended-icon {
  width: 60px; height: 60px; border-radius: 50%; display: grid; place-items: center; margin-bottom: 20px;
  background: rgba(37,99,235,0.08); border: 1px solid rgba(37,99,235,0.16); color: var(--primary);
  animation: breatheIcon 3s ease-in-out infinite;
}
@keyframes breatheIcon { 0%, 100% { opacity: 0.85; transform: scale(1); } 50% { opacity: 1; transform: scale(1.06); } }
.chat-ended-actions { display: flex; flex-direction: column; gap: 12px; margin-top: 26px; align-items: center; }
.no-match-logo {
  position: relative; width: 110px; height: 110px; margin: 0 auto 24px;
  display: flex; align-items: center; justify-content: center;
  animation: breatheLogo 3.2s ease-in-out infinite;
}
@keyframes breatheLogo { 0%, 100% { opacity: 0.9; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
.no-match-logo::before {
  content: ''; position: absolute; inset: -22px; border-radius: 50%;
  background: radial-gradient(circle, rgba(37,99,235,0.18), transparent 70%);
  animation: breatheGlow 3.2s ease-in-out infinite;
}
@keyframes breatheGlow { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
.no-match-logo img {
  width: 100%; height: 100%; object-fit: contain; display: block; margin: 0 auto;
  filter: drop-shadow(0 10px 24px rgba(37,99,235,0.32)); position: relative; z-index: 1;
}

.chat-topbar {
  display: flex; align-items: center; justify-content: space-between; padding: 16px 18px;
  border-bottom: 1px solid var(--card-border);
  background: linear-gradient(120deg, color-mix(in srgb, var(--primary) 6%, transparent), color-mix(in srgb, var(--purple) 6%, transparent));
}
.chat-topbar-left { display: flex; align-items: center; gap: 10px; }
.chat-topbar-left-top { align-items: flex-start; }
.chat-partner-info { padding-top: 7px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; background: #C6D2E3; margin-top: 14px; flex-shrink: 0; }
.status-dot.on { background: var(--success); box-shadow: 0 0 8px rgba(22,163,74,0.6); animation: pulse 1.8s infinite; }
.chat-partner-flag { font-size: 18px; }
.chat-partner-name { font-weight: 600; font-size: 14.5px; color: var(--text); }
.chat-partner-status { font-size: 11.5px; color: var(--muted); }
.chat-partner-meta { font-weight: 500; color: var(--muted); font-size: 13px; }
.chat-partner-interests { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; max-width: 220px; }
.chat-partner-chip {
  font-size: 10.5px; font-weight: 600; padding: 2px 8px; border-radius: 100px;
  background: rgba(37,99,235,0.09); color: var(--primary); border: 1px solid rgba(37,99,235,0.14);
}
.chat-topbar-right { display: flex; align-items: center; gap: 8px; }
.icon-btn {
  width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(37,99,235,0.14); background: rgba(37,99,235,0.05);
  color: var(--muted); display: grid; place-items: center; cursor: pointer; transition: all 0.25s var(--ease);
}
.icon-btn:hover { background: rgba(37,99,235,0.12); color: var(--primary); transform: translateY(-2px); }
.icon-btn.reported { color: #DC2626; border-color: rgba(220,38,38,0.3); background: rgba(220,38,38,0.06); }
.icon-btn-send { background: linear-gradient(135deg, var(--primary), var(--accent)); color: white; border: none; }
.icon-btn-send:hover { color: white; }
.report-banner { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--success); padding: 8px 18px; background: rgba(22,163,74,0.08); animation: fadeIn 0.3s ease; }

.chat-body { flex: 1; overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 11px; }
.chat-system-msg { text-align: center; font-size: 11.5px; color: var(--muted); margin-bottom: 8px; }
.bubble-row { display: flex; }
.bubble-row.mine { justify-content: flex-end; }
.bubble {
  max-width: 76%; padding: 10px 14px; border-radius: 18px; font-size: 14.5px; line-height: 1.5;
  letter-spacing: 0.1px; display: flex; flex-direction: column; gap: 3px;
  animation: bubbleIn 0.35s var(--ease);
}
@keyframes bubbleIn { from { opacity: 0; transform: translateY(10px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
.bubble-text { word-break: break-word; }
.bubble-time { font-size: 10.5px; opacity: 0.6; align-self: flex-end; }
.bubble-theirs {
  background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white;
  border: 1px solid rgba(37,99,235,0.3); border-bottom-left-radius: 5px;
  box-shadow: 0 6px 18px rgba(37,99,235,0.22);
}
.bubble-mine {
  background: linear-gradient(135deg, var(--purple), #5B3FE0); color: white;
  border: 1px solid rgba(124,92,252,0.35); border-bottom-right-radius: 5px;
  box-shadow: 0 6px 18px rgba(124,92,252,0.3);
}
.bubble-mine .bubble-time { color: color-mix(in srgb, var(--surface) 80%, transparent); }
.typing-bubble { display: flex; align-items: center; gap: 7px; padding: 10px 15px; }
.typing-label { font-size: 12px; color: rgba(255,255,255,0.85); font-style: italic; white-space: nowrap; }
.typing-dots { display: flex; align-items: center; gap: 3px; }
.typing-dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.85); animation: typingBounce 1.2s infinite; }
.typing-dot:nth-child(2) { animation-delay: 0.15s; }
.typing-dot:nth-child(3) { animation-delay: 0.3s; }
@keyframes typingBounce { 0%,60%,100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-3px); opacity: 1; } }

.chat-input-bar { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-top: 1px solid rgba(37,99,235,0.1); }
.chat-input-bar input {
  flex: 1; background: rgba(37,99,235,0.05); border: 1.5px solid rgba(37,99,235,0.16); border-radius: 100px;
  padding: 12px 18px; color: var(--text); font-family: inherit; font-size: 14.5px; outline: none;
  transition: border-color 0.25s var(--ease), box-shadow 0.3s var(--ease), transform 0.2s var(--ease);
}
.chat-input-bar input:focus {
  border-color: var(--primary); box-shadow: 0 0 0 4px rgba(37,99,235,0.13), 0 6px 16px rgba(37,99,235,0.12);
  transform: translateY(-1px);
}
.emoji-anchor { position: relative; }
.emoji-picker {
  position: absolute; bottom: 46px; left: 0; z-index: 20;
  background: color-mix(in srgb, var(--surface) 98%, transparent); border: 1px solid var(--card-border); border-radius: 16px;
  box-shadow: 0 16px 40px rgba(37,99,235,0.2);
  animation: modalIn 0.25s var(--ease);
  overflow: hidden;
}
.emoji-picker-tabbed { width: 280px; max-width: 84vw; }
.emoji-picker-tabs {
  display: flex; gap: 2px; padding: 8px 8px 0; overflow-x: auto; border-bottom: 1px solid var(--card-border);
  scrollbar-width: none;
}
.emoji-picker-tabs::-webkit-scrollbar { display: none; }
.emoji-picker-tab {
  flex-shrink: 0; width: 30px; height: 30px; border-radius: 8px; border: none; background: transparent;
  font-size: 15px; cursor: pointer; display: grid; place-items: center; opacity: 0.55;
  transition: background 0.2s ease, opacity 0.2s ease;
}
.emoji-picker-tab:hover { background: rgba(37,99,235,0.08); opacity: 0.85; }
.emoji-picker-tab.on { background: rgba(37,99,235,0.12); opacity: 1; }
.emoji-picker-grid {
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 2px;
  padding: 8px; max-height: 220px; overflow-y: auto;
}
.emoji-picker-btn {
  width: 38px; height: 38px; border-radius: 10px; border: none; background: transparent;
  font-size: 19px; cursor: pointer; transition: background 0.2s var(--ease), transform 0.15s var(--ease);
  display: grid; place-items: center;
}
.emoji-picker-btn:hover { background: rgba(37,99,235,0.1); transform: scale(1.15); }

@media (max-width: 560px) {
  .onboard-grid { grid-template-columns: 1fr; }
  .chat-shell { height: 90vh; border-radius: 18px; }
}
`;
