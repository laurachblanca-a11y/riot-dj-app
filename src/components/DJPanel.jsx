import { useState } from "react";

const STYLES = `
body, html, #root {
  background: radial-gradient(
    circle at top,
    #ff2a8a 0%,
    #6d28d9 45%,
    #001018 100%
  );
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dj-app {
  width: 90%;
  max-width: 420px;
  height: 88dvh;
  max-height: 780px;
  margin: auto;

  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 28px;

  display: flex;
  flex-direction: column;
  overflow: hidden;

  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.4),
    inset 0 0 0 1px rgba(255,255,255,0.05);

  color: #fff;
  font-family: 'Outfit', sans-serif;
}

@media (max-width: 480px) {
  .dj-app {
    width: 94%;
    height: 92dvh;
    border-radius: 22px;
  }
}

/* HEADER */
.dj-header {
  padding: 20px 20px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.dj-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dj-logo {
  width: 42px;
  height: auto;
  filter:
    drop-shadow(0 0 8px rgba(255, 0, 127, 0.5))
    drop-shadow(0 0 16px rgba(0, 223, 216, 0.3));
}

.dj-title {
  font-size: 1rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.1;
}

.dj-subtitle {
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.55);
}

.dj-badge {
  font-size: 0.6rem;
  font-weight: 700;
  color: #00dfd8;
  padding: 4px 10px;
  border: 1px solid rgba(0, 223, 216, 0.4);
  border-radius: 20px;
  letter-spacing: 1px;
  text-transform: uppercase;
  background: rgba(0, 223, 216, 0.08);
}

/* SCROLLABLE BODY */
.dj-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.2) transparent;
}

.dj-body::-webkit-scrollbar { width: 5px; }
.dj-body::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.2);
  border-radius: 10px;
}

/* SECTION CARD */
.dj-card {
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 16px;
}

.dj-card-label {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.5);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dj-card-label-count {
  background: rgba(255,255,255,0.12);
  border-radius: 20px;
  padding: 2px 10px;
  font-size: 0.65rem;
  color: rgba(255,255,255,0.7);
}

/* NOW PLAYING */
.np-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0 12px;
}

.np-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #00dfd8;
  box-shadow: 0 0 10px #00dfd8;
  flex-shrink: 0;
  animation: pulseDot 1.4s ease-in-out infinite;
}

.np-dot.off {
  background: rgba(255,255,255,0.2);
  box-shadow: none;
  animation: none;
}

@keyframes pulseDot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.75); }
}

.np-info { flex: 1; min-width: 0; }

.np-song {
  font-size: 0.95rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.np-who {
  font-size: 0.72rem;
  color: rgba(255,255,255,0.6);
  margin-top: 2px;
}

/* BUTTONS */
.dj-btn {
  width: 100%;
  padding: 13px;
  border-radius: 14px;
  border: none;
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
}

.dj-btn:active { transform: scale(0.97); }

.dj-btn-primary {
  background: linear-gradient(135deg, #ff007f, #7928ca);
  color: #fff;
  box-shadow: 0 6px 18px rgba(255, 0, 127, 0.3);
}

.dj-btn-primary:hover:not(:disabled) {
  box-shadow: 0 10px 24px rgba(255, 0, 127, 0.45);
  transform: translateY(-1px);
}

.dj-btn-primary:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.dj-btn-danger {
  background: rgba(255, 50, 50, 0.1);
  border: 1px solid rgba(255, 70, 70, 0.4);
  color: #ff6b6b;
}

.dj-btn-danger:hover:not(:disabled) {
  background: rgba(255, 50, 50, 0.2);
}

.dj-btn-danger:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
}

.dj-btn-warn {
  background: rgba(255, 165, 0, 0.1);
  border: 1px solid rgba(255, 165, 0, 0.4);
  color: #ffb347;
  animation: fadeInBtn 0.3s ease forwards;
}

.dj-btn-warn:hover {
  background: rgba(255, 165, 0, 0.2);
}

@keyframes fadeInBtn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.dj-btn-ghost {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.6);
  font-size: 0.75rem;
  padding: 8px;
}

.dj-btn-ghost:hover { background: rgba(255,255,255,0.1); color: #fff; }

/* QUEUE LIST */
.dj-queue-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dj-queue-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 10px 12px;
  opacity: 0;
  animation: slideIn 0.3s ease forwards;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(12px); }
  to { opacity: 1; transform: translateX(0); }
}

.dj-queue-num {
  font-size: 0.75rem;
  font-weight: 800;
  color: rgba(255,255,255,0.35);
  min-width: 22px;
}

.dj-queue-info { flex: 1; min-width: 0; }

.dj-queue-song {
  font-size: 0.88rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dj-queue-name {
  font-size: 0.7rem;
  color: rgba(255,255,255,0.55);
  margin-top: 2px;
}

.dj-del-btn {
  background: none;
  border: none;
  color: rgba(255,255,255,0.3);
  cursor: pointer;
  font-size: 1rem;
  padding: 4px 6px;
  border-radius: 8px;
  transition: all 0.15s;
  flex-shrink: 0;
}

.dj-del-btn:hover { color: #ff6b6b; background: rgba(255,70,70,0.12); }

/* HISTORY */
.dj-history-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dj-history-item {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.45);
  padding: 6px 8px;
  border-left: 2px solid rgba(255,255,255,0.1);
}

.dj-history-song { font-weight: 600; color: rgba(255,255,255,0.65); }

/* EMPTY */
.dj-empty {
  text-align: center;
  padding: 16px 10px;
  color: rgba(255,255,255,0.3);
  font-size: 0.8rem;
}
`;

export default function DJPanel({
  queue,
  nowPlaying,
  history,
  onPlayNext,
  onDeleteSong,
  onClearQueue,
  onStopNowPlaying,
}) {
  const [advancing, setAdvancing] = useState(false);

  const handleNext = async () => {
    if (advancing) return;
    setAdvancing(true);
    try {
      await onPlayNext();
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>

      <div className="dj-app">

        {/* HEADER */}
        <div className="dj-header">
          <div className="dj-header-left">
            <img src="/riot-logo-v2.png" className="dj-logo" alt="Riot" />
            <div>
              <div className="dj-title">Riot DJ</div>
              <div className="dj-subtitle">Panel de control</div>
            </div>
          </div>
          <span className="dj-badge">Live</span>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="dj-body">

          {/* NOW PLAYING */}
          <div className="dj-card">
            <div className="dj-card-label">Now Playing</div>

            <div className="np-row">
              <span className={`np-dot${nowPlaying ? "" : " off"}`} />
              <div className="np-info">
                {nowPlaying ? (
                  <>
                    <div className="np-song">{nowPlaying.song}</div>
                    <div className="np-who">{nowPlaying.name}</div>
                  </>
                ) : (
                  <div className="np-song" style={{ opacity: 0.4 }}>Nada sonando</div>
                )}
              </div>
            </div>

            <button
              className="dj-btn dj-btn-primary"
              onClick={handleNext}
              disabled={queue.length === 0 || advancing}
            >
              {advancing ? "Cargando..." : "Siguiente canción"}
            </button>

            <button
              className="dj-btn dj-btn-danger"
              onClick={onStopNowPlaying}
              disabled={!nowPlaying}
            >
              Detener ahora
            </button>

            {/* Solo aparece cuando hay algo en now playing y la cola está vacía */}
            {nowPlaying && queue.length === 0 && (
              <button
                className="dj-btn dj-btn-warn"
                onClick={onStopNowPlaying}
              >
                Limpiar (cola vacía)
              </button>
            )}
          </div>

          {/* QUEUE */}
          <div className="dj-card">
            <div className="dj-card-label">
              <span>Cola</span>
              <span className="dj-card-label-count">{queue.length} en lista</span>
            </div>

            {queue.length === 0 ? (
              <div className="dj-empty">Sin canciones en espera</div>
            ) : (
              <div className="dj-queue-list">
                {queue.map((q, i) => (
                  <div
                    key={q.id}
                    className="dj-queue-item"
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    <div className="dj-queue-num">#{i + 1}</div>
                    <div className="dj-queue-info">
                      <div className="dj-queue-song">{q.song}</div>
                      <div className="dj-queue-name">{q.name}</div>
                    </div>
                    <button
                      className="dj-del-btn"
                      onClick={() => onDeleteSong(q.id)}
                      title="Eliminar"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            {queue.length > 0 && (
              <button
                className="dj-btn dj-btn-ghost"
                style={{ marginTop: 12 }}
                onClick={onClearQueue}
              >
                Limpiar toda la cola
              </button>
            )}
          </div>

          {/* HISTORY */}
          {history.length > 0 && (
            <div className="dj-card">
              <div className="dj-card-label">Historial</div>
              <div className="dj-history-list">
                {history.map((h) => (
                  <div key={h.id} className="dj-history-item">
                    <span className="dj-history-song">{h.song}</span>
                    {" — "}{h.name}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
