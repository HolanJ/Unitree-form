export default function Header({ mode, setMode, onPrint, onReset }) {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-mint-200/80 bg-mint-50/90 px-5 py-4 backdrop-blur md:px-7">
      <div className="mx-auto grid max-w-6xl items-center gap-4 md:grid-cols-[1fr_auto_auto]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-mint-700 font-black text-white shadow-lg shadow-mint-700/20">
            U
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-mint-700">Unitree evidence výpůjček</p>
            <h1 className="text-xl font-extrabold text-ink">Předávací protokol</h1>
          </div>
        </div>

        <fieldset className="grid grid-cols-2 rounded-lg border border-mint-200 bg-white/80 p-1">
          <legend className="sr-only">Režim editace</legend>
          {[
            ["issue", "Vydání"],
            ["return", "Vrácení"]
          ].map(([value, label]) => (
            <label key={value} className="cursor-pointer">
              <input
                className="peer sr-only"
                type="radio"
                name="editMode"
                checked={mode === value}
                onChange={() => setMode(value)}
              />
              <span className="grid min-h-10 min-w-28 place-items-center rounded-md px-4 text-sm font-bold text-slate-600 transition peer-checked:bg-mint-700 peer-checked:text-white">
                {label}
              </span>
            </label>
          ))}
        </fieldset>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <button className="btn-secondary" type="button" onClick={onReset}>
            Nový protokol
          </button>
          <button className="btn-primary" type="button" onClick={onPrint}>
            Vygenerovat PDF
          </button>
        </div>
      </div>
    </header>
  );
}
