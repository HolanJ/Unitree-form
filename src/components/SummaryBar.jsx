export default function SummaryBar({ robotCount, mode, photoCount, completion }) {
  const items = [
    ["Roboti", robotCount],
    ["Režim", mode === "issue" ? "Vydání" : "Vrácení"],
    ["Fotky", photoCount],
    ["Vyplněno", `${completion} %`]
  ];

  return (
    <section className="no-print grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Souhrn protokolu">
      {items.map(([label, value]) => (
        <article key={label} className="rounded-lg border border-mint-200/80 bg-white/80 p-4 shadow-soft">
          <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
          <strong className="mt-2 block text-3xl leading-none text-ink">{value}</strong>
        </article>
      ))}
    </section>
  );
}
