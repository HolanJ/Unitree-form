import Icon from "./Icon.jsx";

export default function SummaryBar({ robotCount, mode, photoCount, completion }) {
  const items = [
    ["Roboti", robotCount, "robot"],
    ["Režim", mode === "issue" ? "Vydání" : "Vrácení", "rotate"],
    ["Fotky", photoCount, "image"],
    ["Vyplněno", `${completion} %`, "check"]
  ];

  return (
    <section className="no-print grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Souhrn protokolu">
      {items.map(([label, value, icon]) => (
        <article key={label} className="rounded-lg border border-mint-200/80 bg-white/80 p-4 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
            <span className="grid size-9 place-items-center rounded-full bg-mint-100 text-mint-700">
              <Icon name={icon} className="size-5" />
            </span>
          </div>
          <strong className="mt-2 block text-3xl leading-none text-ink">{value}</strong>
        </article>
      ))}
    </section>
  );
}
