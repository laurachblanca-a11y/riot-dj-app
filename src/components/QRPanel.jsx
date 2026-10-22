import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const STYLES = `
  .qr-panel {
    display: flex;
    align-items: center;
    gap: 14px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 18px;
    padding: 12px 16px;
    margin: 0 20px 14px;
  }

  .qr-panel-code {
    flex-shrink: 0;
    background: #ffffff;
    border-radius: 10px;
    padding: 6px;
    display: flex;
    line-height: 0;
  }

  .qr-panel-info {
    flex: 1;
    min-width: 0;
  }

  .qr-panel-title {
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #ffffff;
  }

  .qr-panel-url {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.75);
    margin-top: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .qr-panel-copy {
    margin-top: 8px;
    border: 1px solid rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    font-family: 'Outfit', sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 6px 12px;
    border-radius: 20px;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .qr-panel-copy:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  .qr-panel-copy.copied {
    background: #00dfd8;
    border-color: #00dfd8;
    color: #052b2a;
  }
`;

/**
 * Tarjeta de QR visible al público para que los invitados se unan
 * escaneando con su teléfono. No depende de tabs ni modales: siempre
 * está visible en la pantalla pública (proyector o celular del invitado).
 *
 * Props opcionales:
 *  - url: enlace a codificar (por defecto, la URL actual sin query ni hash)
 *  - size: tamaño en px del QR (por defecto 84)
 */
export default function QRPanel({ url, size = 84 }) {
  const [copied, setCopied] = useState(false);

  const targetUrl = useMemo(() => {
    if (url) return url;
    if (typeof window === "undefined") return "";
    // Se omiten query/hash para que nadie escanee con ?dj=... por error
    return `${window.location.origin}${window.location.pathname}`;
  }, [url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Si el navegador bloquea el clipboard, no rompemos la UI
    }
  };

  if (!targetUrl) return null;

  return (
    <>
      <style>{STYLES}</style>

      <div className="qr-panel">
        <div className="qr-panel-code">
          <QRCodeSVG
            value={targetUrl}
            size={size}
            level="M"
            bgColor="#ffffff"
            fgColor="#1a0b2e"
            title="Escanea para pedir tu canción"
          />
        </div>

        <div className="qr-panel-info">
          <div className="qr-panel-title"> Escanea y pide tu canción</div>
          <div className="qr-panel-url">{targetUrl}</div>
          <button className={`qr-panel-copy${copied ? " copied" : ""}`} onClick={handleCopy}>
            {copied ? "¡Copiado!" : "Copiar enlace"}
          </button>
        </div>
      </div>
    </>
  );
}
