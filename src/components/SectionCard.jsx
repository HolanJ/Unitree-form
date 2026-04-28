export default function SectionCard({ children, className = "", accent = false }) {
  return (
    <section className={`paper-card ${accent ? "paper-accent" : ""} ${className}`}>
      {children}
    </section>
  );
}
