import { useState, useEffect } from "react";
import QRPanel from "./QRPanel";
import { containsBlocked } from "../BlockedWords";

const COOLDOWN_MS = 30000;
const COOLDOWN_KEY = "riotdj_cooldown_until";
const INVALID_CHARS = /[^\p{L}\p{N} .,'’"!?&()\-–—:;/+#@_]/gu;

function findInvalidChars(text) {
  return [...new Set(text.match(INVALID_CHARS) || [])];
}

function readStoredCooldown() {
  try {
    const raw = localStorage.getItem(COOLDOWN_KEY);
    const value = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

const STYLES = `
/* ─── Reset & Root ─────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }

body, html, #root {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #ff2a8a 0%, #6d28d9 45%, #001018 100%);
  font-family: 'Outfit', sans-serif;
  color: #fff;
}

/* ─── App Shell ─────────────────────────────────────── */
.app {
  width: 90%;
  max-width: 420px;
  height: 85dvh;
  max-height: 750px;
  margin: auto;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 28px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255,255,255,0.05);
}

@media (max-width: 480px) {
  .app { width: 94%; height: 88dvh; border-radius: 22px; }
}

.header {
  padding: 20px 20px 12px;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}

.logo {
  width: 44px;
  height: auto;
  filter: drop-shadow(0 0 10px rgba(255, 0, 127, 0.4)) drop-shadow(0 0 18px rgba(0, 223, 216, 0.2));
}

.header-text { line-height: 1.1; }

.header-title {
  font-size: 0.95rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.header-sub {
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.5);
  margin-top: 2px;
}

.header-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 0 8px rgba(0, 223, 216, 0.4));
}

/* ─── Now Playing ───────────────────────────────────── */
.now-playing {
  margin: 14px 16px 0;
  padding: 12px 14px;
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.np-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00dfd8;
  box-shadow: 0 0 8px #00dfd8;
  flex-shrink: 0;
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.75); }
}

.np-text { min-width: 0; flex: 1; }

.np-label {
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.5);
}

.np-song {
  font-size: 0.88rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

/* ─── Tabs ──────────────────────────────────────────── */
.tabs {
  display: flex;
  padding: 14px 16px 10px;
  gap: 8px;
  flex-shrink: 0;
}

.tab {
  flex: 1;
  padding: 11px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-family: 'Outfit', sans-serif;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab.active {
  background: #fff;
  border-color: #fff;
  color: #1a0040;
  font-weight: 800;
  box-shadow: 0 4px 14px rgba(255,255,255,0.2);
}

.tab.pulse-alert {
  animation: tabPulse 0.5s ease-in-out 2;
}

@keyframes tabPulse {
  0%, 100% { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.6); }
  50% { background: #00dfd8; color: #000; border-color: #00dfd8; }
}

/* ─── Content ───────────────────────────────────────── */
.content {
  flex: 1;
  padding: 4px 16px 20px;
  overflow-y: auto;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.2) transparent;
}

.content::-webkit-scrollbar { width: 4px; }
.content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }

/* ─── Request Form ──────────────────────────────────── */
.form { display: flex; flex-direction: column; gap: 12px; padding-top: 10px; }

.form-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.7);
  display: block;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 13px 14px;
  color: #fff;
  font-size: 0.92rem;
  font-family: 'Outfit', sans-serif;
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.form-input::placeholder { color: rgba(255,255,255,0.3); }

.form-input:focus {
  border-color: rgba(255,255,255,0.5);
  background: rgba(255, 255, 255, 0.15);
}

.btn-submit {
  width: 100%;
  padding: 15px;
  border-radius: 12px;
  border: none;
  background: #fff;
  color: #5b21b6;
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  margin-top: 4px;
  transition: all 0.2s ease;
  box-shadow: 0 6px 18px rgba(0,0,0,0.15);
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(255,255,255,0.15);
}

.btn-submit:active:not(:disabled) { transform: translateY(1px); }

.btn-submit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cooldown-hint {
  text-align: center;
  font-size: 0.68rem;
  color: rgba(255,255,255,0.5);
}

/* ─── Queue List ────────────────────────────────────── */
.queue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0 10px;
}

.queue-title {
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.queue-badge {
  font-size: 0.65rem;
  font-weight: 700;
  color: rgba(255,255,255,0.7);
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 20px;
  padding: 3px 10px;
}

.queue-list { display: flex; flex-direction: column; gap: 8px; }

.queue-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 0;
  animation: slideIn 0.3s ease forwards;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(16px); }
  to { opacity: 1; transform: translateX(0); }
}

.queue-num {
  font-size: 0.7rem;
  font-weight: 800;
  color: rgba(255,255,255,0.3);
  min-width: 20px;
}

.queue-info { flex: 1; min-width: 0; }

.queue-song {
  font-size: 0.88rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-name {
  font-size: 0.7rem;
  color: rgba(255,255,255,0.55);
  margin-top: 2px;
}

.empty {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255,255,255,0.4);
  font-size: 0.8rem;
}

.form-warning {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #ffd27a;
  background: rgba(255, 165, 0, 0.12);
  border: 1px solid rgba(255, 165, 0, 0.4);
  border-radius: 10px;
  padding: 8px 12px;
}

.toast {
  position: fixed;
  top: -90px;
  left: 50%;
  transform: translateX(-50%);
  width: 86%;
  max-width: 360px;
  background: rgba(20, 10, 40, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 16px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 9999;
  transition: top 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast.show { top: 20px; }

.toast-icon { font-size: 1.5rem; }

.toast-title { font-weight: 800; font-size: 0.9rem; }
.toast-sub { font-size: 0.75rem; color: rgba(255,255,255,0.65); margin-top: 2px; }
`;

export default function PublicQueue({ queue, nowPlaying, onSubmit }) {
  const [tab, setTab] = useState("request");
  const [name, setName] = useState("");
  const [song, setSong] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [pulseTab, setPulseTab] = useState(false);
  const [lastTrackName, setLastTrackName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [warning, setWarning] = useState("");

  const [cooldownUntil, setCooldownUntil] = useState(readStoredCooldown);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const cooldownRemaining = Math.max(0, Math.ceil((cooldownUntil - nowTick) / 1000));
  const inCooldown = cooldownRemaining > 0;

const handleSubmit = async () => {
  if (inCooldown || submitting) return;

  const cleanName = name.replace(/\s+/g, " ").trim().slice(0, 40);
  const cleanSong = song.replace(/\s+/g, " ").trim().slice(0, 80);


  if (cleanName.length < 2 || cleanSong.length < 2) {
    setWarning("El nombre y la canción deben tener al menos 2 caracteres.");
    return;
  }

  const invalid = [...findInvalidChars(cleanName), ...findInvalidChars(cleanSong)];
  if (containsBlocked(cleanName, true) || containsBlocked(cleanSong, false)) {
  setWarning("Contenido no permitido. Revisa tu nombre y la canción.");
  return;
}
  if (invalid.length > 0) {
    setWarning(
      `Caracteres no admitidos: ${[...new Set(invalid)].join(" ")}. Usa solo letras, números y signos básicos.`
    );
    return;
  }

  setWarning("");
  setSubmitting(true);
  try {
    await onSubmit(cleanName, cleanSong);
    setLastTrackName(cleanSong);
    setShowToast(true);
    setPulseTab(true);
    setSong("");

    const until = Date.now() + COOLDOWN_MS;
    try { localStorage.setItem(COOLDOWN_KEY, String(until)); } catch {}
    setCooldownUntil(until);
    setNowTick(Date.now());

    setTimeout(() => setShowToast(false), 3000);
    setTimeout(() => setPulseTab(false), 1200);
    } catch (err) {
    console.error(err);

    const msg = String(err?.message || "");

    if (msg.includes("PERMISSION_DENIED")) {
      setWarning("Espera un momento antes de pedir otra canción.");
    } else if (msg.includes("SIN_SESION")) {
      setWarning("Conectando, intenta de nuevo en unos segundos.");
    } else {
      setWarning(
        "No se pudo guardar la canción. Revisa tu conexión e intenta de nuevo."
      );
    }
  } finally {
    setSubmitting(false);
  }
};

  const submitDisabled = inCooldown || submitting || !name.trim() || !song.trim();

  return (
    <>
      <style>{STYLES}</style>

      {/* Toast */}
      <div className={`toast${showToast ? " show" : ""}`}>
        <div>
          <div className="toast-title">Canción añadida</div>
          <div className="toast-sub">"{lastTrackName}" está en la cola.</div>
        </div>
      </div>

      <div className="app">

        <div className="header">
          <img src="/riot-logo-v2.png" className="logo" alt="Riot" />
          <div className="header-text">
            <div className="header-title">RIOT VE</div>
            <div className="header-sub">Karaoke Edition</div>
          </div>
        </div>

        {/* Now Playing */}
        <div className="now-playing">
          <span className="np-dot" />
          <div className="np-text">
            <div className="np-label">Ahora sonando</div>
            <div className="np-song">
              {nowPlaying
                ? `${nowPlaying.song} — ${nowPlaying.name}`
                : "Esperando la primera canción..."}
            </div>
          </div>
        </div>

        <QRPanel />

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab${tab === "request" ? " active" : ""}`}
            onClick={() => setTab("request")}
          >
            Pedir canción
          </button>
          <button
            className={`tab${tab === "queue" ? " active" : ""}${pulseTab ? " pulse-alert" : ""}`}
            onClick={() => setTab("queue")}
          >
            Cola ({queue.length})
          </button>
        </div>

        {/* Content */}
        <div className="content">
          {tab === "request" && (
            <form
              className="form"
              onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            >
              <div>
                <label className="form-label">Tu nombre</label>
                <input
                  className="form-input"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setWarning(""); }}
                  placeholder="¿Cómo te llamas?"
                  maxLength={40}
                />
              </div>

              <div>
                <label className="form-label">Canción y artista</label>
                <input
                  className="form-input"
                  value={song}
                  onChange={(e) => { setSong(e.target.value); setWarning(""); }}
                  placeholder="Ej: Justin Bieber — Baby"
                  maxLength={80}
                />
              </div>

              <button type="submit" className="btn-submit" disabled={submitDisabled}>
                {inCooldown
                  ? `Espera ${cooldownRemaining}s`
                  : submitting
                  ? "Enviando..."
                  : "Pedir canción"}
              </button>

              {warning && <p className="form-warning">{warning}</p>}

              {inCooldown && (
                <p className="cooldown-hint">
                  Podrás pedir otra canción en {cooldownRemaining}s.
                </p>
              )}
            </form>
          )}

          {tab === "queue" && (
            <>
              <div className="queue-header">
                <span className="queue-title">Próximas canciones</span>
                <span className="queue-badge">{queue.length} en lista</span>
              </div>

              {queue.length === 0 ? (
                <div className="empty">
                  La cola está vacía — ¡pide la primera!
                </div>
              ) : (
                <div className="queue-list">
                  {queue.map((req, i) => (
                    <div
                      key={req.id}
                      className="queue-card"
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <div className="queue-num">#{i + 1}</div>
                      <div className="queue-info">
                        <div className="queue-song">{req.song}</div>
                        <div className="queue-name">{req.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </>
  );
}
