import Icon from "./Icon.jsx";

const groupIcons = {
  "Fyzické vybavení": "boxes",
  "Stav robota": "robot",
  "Elektronika a software": "cpu"
};

export default function Checklist({ groups, name, values, onToggle }) {
  return (
    <div className="grid gap-3">
      {groups.map((group) => (
        <fieldset key={group.title} className="rounded-lg border border-mint-200 bg-mint-50/80 p-4">
          <legend className="px-1 text-sm font-extrabold text-mint-700">
            <span className="inline-flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-full bg-white text-mint-700 shadow-sm">
                <Icon name={groupIcons[group.title]} className="size-4" />
              </span>
              {group.title}
            </span>
          </legend>
          <div className="grid gap-3 pt-1 md:grid-cols-2">
            {group.items.map((item) => (
              <label key={item} className="grid grid-cols-[18px_1fr] items-start gap-2 text-sm font-medium text-slate-700">
                <input
                  className="mt-0.5 size-[18px] accent-mint-700"
                  type="checkbox"
                  name={name}
                  checked={values.includes(item)}
                  value={item}
                  onChange={() => onToggle(name, item)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
