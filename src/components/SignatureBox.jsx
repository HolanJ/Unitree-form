import { useEffect, useRef } from "react";

export default function SignatureBox({ title, signerName, signerField, onFieldChange, clearSignal }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let drawing = false;
    let last = null;

    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#13201a";

    const position = (event) => {
      const rect = canvas.getBoundingClientRect();
      const source = event.touches ? event.touches[0] : event;
      return {
        x: (source.clientX - rect.left) * (canvas.width / rect.width),
        y: (source.clientY - rect.top) * (canvas.height / rect.height)
      };
    };

    const start = (event) => {
      drawing = true;
      last = position(event);
      event.preventDefault();
    };

    const move = (event) => {
      if (!drawing) return;
      const current = position(event);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(current.x, current.y);
      ctx.stroke();
      last = current;
      event.preventDefault();
    };

    const stop = () => {
      drawing = false;
      last = null;
    };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", stop);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", stop);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }, [clearSignal]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="rounded-lg border border-mint-200 bg-mint-50/80 p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <strong>{title}</strong>
        <button className="link-danger no-print" type="button" onClick={clearCanvas}>
          Vymazat
        </button>
      </div>
      <canvas ref={canvasRef} className="h-[150px] w-full rounded-lg border border-mint-200 bg-white" width="520" height="180" />
      <label className="mt-3 grid gap-2">
        <span className="form-label">Jméno</span>
        <input className="form-input" value={signerName} onChange={(event) => onFieldChange(signerField, event.target.value)} placeholder="Jméno a příjmení" />
      </label>
    </div>
  );
}
