import { useState, useEffect, useCallback } from "react";
import {
  ref,
  push,
  onValue,
  set,
  remove,
  update,
  serverTimestamp,
} from "firebase/database";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
} from "firebase/auth";
import { db, auth } from "./firebase";
import DJPanel from "./components/DJPanel";
import PublicQueue from "./components/PublicQueue";

// Expiracion del historial: 12 horas en milisegundos
const HISTORY_MAX_AGE_MS = 12 * 60 * 60 * 1000;

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body, #root {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    background: radial-gradient(circle at top, #ff2a8a 0%, #6d28d9 45%, #001018 100%) !important;
    font-family: 'Outfit', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }
`;

export default function KaraokeApp() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [queue, setQueue] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [history, setHistory] = useState([]);

  // El DJ inicio sesion con correo; los anonimos son el publico
  const isDJ = !!user && !user.isAnonymous;

  // 1. Sesion: si no hay nadie, entra como anonimo (invisible para el publico)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        signInAnonymously(auth).catch((err) => {
          console.error("No se pudo iniciar sesion anonima:", err);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Titulo de la pestana segun la vista
  useEffect(() => {
    document.title = isDJ ? "Riot DJ - Panel" : "RIOT Karaoke";
  }, [isDJ]);

  // 2. Escuchadores publicos en tiempo real (cola y ahora sonando)
  useEffect(() => {
    const unsubQueue = onValue(ref(db, "playlist"), (snap) => {
      const data = snap.val();
      const mapped = data
        ? Object.keys(data).map((k) => ({ id: k, ...data[k] }))
        : [];
      mapped.sort((a, b) => a.timestamp - b.timestamp);
      setQueue(mapped);
    });

    const unsubNow = onValue(ref(db, "nowPlaying"), (snap) => {
      setNowPlaying(snap.val());
    });

    return () => {
      unsubQueue();
      unsubNow();
    };
  }, []);

  // 3. Historial: solo escucha (y limpia registros viejos) el DJ
  useEffect(() => {
    if (!isDJ) {
      setHistory([]);
      return;
    }

    const unsubHistory = onValue(ref(db, "history"), async (snap) => {
      const data = snap.val();
      if (!data) {
        setHistory([]);
        return;
      }

      const now = Date.now();
      const mapped = [];

      for (const key of Object.keys(data)) {
        const item = data[key];
        const age = now - (item.playedAt || 0);

        if (age > HISTORY_MAX_AGE_MS) {
          try {
            await remove(ref(db, `history/${key}`));
          } catch (err) {
            console.error("No se pudo limpiar el historial:", err);
          }
        } else {
          mapped.push({ id: key, ...item });
        }
      }

      mapped.sort((a, b) => b.playedAt - a.playedAt);
      setHistory(mapped);
    });

    return () => unsubHistory();
  }, [isDJ]);

  // 4. Handlers de autenticacion
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowLogin(false);
      setEmail("");
      setPassword("");
    } catch {
      setLoginError("Correo o contraseña incorrectos.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // 5. Acciones de base de datos
  // La cancion y la marca lastRequest se escriben juntas: el servidor
  // usa esa marca para limitar una cancion cada 30s por usuario
  const addToQueue = useCallback(async (name, song) => {
    const current = auth.currentUser;
    if (!current) throw new Error("SIN_SESION");

    const key = push(ref(db, "playlist")).key;
    await update(ref(db), {
      [`playlist/${key}`]: {
        name,
        song,
        timestamp: serverTimestamp(),
      },
      [`lastRequest/${current.uid}`]: serverTimestamp(),
    });
  }, []);

  const playNext = useCallback(async () => {
    if (queue.length === 0) return;
    const next = queue[0];

    if (nowPlaying) {
      await push(ref(db, "history"), {
        ...nowPlaying,
        playedAt: Date.now(),
      });
    }

    await set(ref(db, "nowPlaying"), {
      name: next.name,
      song: next.song,
      startedAt: Date.now(),
    });

    await remove(ref(db, `playlist/${next.id}`));
  }, [queue, nowPlaying]);

  const deleteFromQueue = useCallback(async (id) => {
    await remove(ref(db, `playlist/${id}`));
  }, []);

  const clearQueue = useCallback(async () => {
    if (window.confirm("¿Seguro que quieres borrar todas las canciones en espera?")) {
      try {
        await remove(ref(db, "playlist"));
      } catch (err) {
        console.error("Error al limpiar la cola:", err);
        alert("No se pudo limpiar la cola. Asegúrate de tener sesión activa.");
      }
    }
  }, []);

  const clearHistory = useCallback(async () => {
    if (window.confirm("¿Seguro que deseas borrar todo el historial?")) {
      try {
        await remove(ref(db, "history"));
      } catch (err) {
        console.error("Error al limpiar el historial:", err);
        alert("No se pudo limpiar el historial. Asegúrate de tener sesión activa.");
      }
    }
  }, []);

  const stopNowPlaying = useCallback(async () => {
    try {
      await set(ref(db, "nowPlaying"), null);
    } catch (err) {
      console.error("Error al detener la canción:", err);
    }
  }, []);

  return (
    <>
      <style>{GLOBAL_STYLES}</style>

      {isDJ ? (
        <>
          <button
            onClick={handleLogout}
            style={{
              position: "fixed",
              top: 12,
              right: 12,
              zIndex: 9999,
              padding: "6px 12px",
              borderRadius: "20px",
              background: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(10px)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
              fontSize: "0.75rem",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Salir
          </button>
          <DJPanel
            queue={queue}
            nowPlaying={nowPlaying}
            history={history}
            onPlayNext={playNext}
            onDeleteSong={deleteFromQueue}
            onClearHistory={clearHistory}
            onClearQueue={clearQueue}
            onStopNowPlaying={stopNowPlaying}
          />
        </>
      ) : showLogin ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <form
            onSubmit={handleLogin}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              padding: "28px 24px",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "320px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              alignItems: "center",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: "800",
                textTransform: "uppercase",
              }}
            >
              Panel DJ
            </h3>

            {loginError && (
              <p
                style={{
                  color: "#ff6b6b",
                  fontSize: "0.75rem",
                  textAlign: "center",
                }}
              >
                {loginError}
              </p>
            )}

            <input
              type="email"
              placeholder="Correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(0,0,0,0.3)",
                color: "#fff",
                outline: "none",
                fontSize: "0.85rem",
              }}
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(0,0,0,0.3)",
                color: "#fff",
                outline: "none",
                fontSize: "0.85rem",
              }}
            />

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #ff007f, #7928ca)",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "0.85rem",
                cursor: "pointer",
                marginTop: "4px",
              }}
            >
              Entrar
            </button>

            <button
              type="button"
              onClick={() => setShowLogin(false)}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          </form>
        </div>
      ) : (
        <>
          <PublicQueue
            queue={queue}
            nowPlaying={nowPlaying}
            onSubmit={addToQueue}
          />
          <button
            onClick={() => setShowLogin(true)}
            style={{
              position: "fixed",
              bottom: 12,
              right: 12,
              opacity: 0.25,
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: "1rem",
              cursor: "pointer",
              zIndex: 99,
            }}
          >
            🔒
          </button>
        </>
      )}
    </>
  );
}