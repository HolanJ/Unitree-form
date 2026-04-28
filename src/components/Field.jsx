export default function Field({ label, name, value, onChange, type = "text", placeholder, as = "input", rows = 4 }) {
  const common = {
    className: "form-input",
    name,
    value,
    placeholder,
    onChange: (event) => onChange(name, event.target.value)
  };

  return (
    <label className="grid gap-2">
      <span className="form-label">{label}</span>
      {as === "textarea" ? <textarea {...common} rows={rows} /> : <input {...common} type={type} />}
    </label>
  );
}
