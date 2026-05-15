import React, { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Pencil,
  Printer,
  Save,
  Search,
  Trash2,
  User,
  X
} from "lucide-react";
import { ArchiveIcon } from "@/components/ui/archive";
import { PlusIcon } from "@/components/ui/plus";
import { SettingsIcon } from "@/components/ui/settings";

// --- Constants & Config ---
const DB_NAME = "unitree-protocol-archive";
const DB_VERSION = 2;
const STORE_NAME = "protocols";
const CATEGORY_STORE = "deviceCategories";
const DEVICE_STORE = "devices";

const DEFAULT_CATEGORIES = [
  { id: "cat-humanoids", name: "Humanoidi", sortOrder: 1, active: true },
  { id: "cat-dogs", name: "Psi", sortOrder: 2, active: true },
  { id: "cat-exoskeletons", name: "Exoskeletony", sortOrder: 3, active: true }
];

const DEFAULT_DEVICES = ["Adam", "Božena", "Emil", "Cvrček", "Fík"].map((name, index) => ({
  id: `device-${index + 1}`,
  name,
  categoryId: "cat-humanoids",
  model: "Unitree G1",
  serialNumber: "",
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
}));

const makeId = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `protocol-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const clone = (value) => {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};

const INITIAL_STATE = {
  id: null,
  createdAt: null,
  updatedAt: null,
  mode: "issue", // 'issue' or 'return'
  issueDate: "",
  borrower: "",
  contactPerson: "",
  purpose: "",
  dateFrom: "",
  dateTo: "",
  handoverPlace: "",
  responsibleOwner: "",
  selectedRobots: [],
  selectedDevices: [],

  // Issue Specific
  issueBattery: "",
  serialNumber: "",
  firmware: "",
  issueNote: "",
  issueChecklist: {
    physical: [
      { id: "p1", label: "Robot Unitree G1 – kompletní, bez viditelného poškození", checked: false },
      { id: "p2", label: "Ovladač (controller) – funkční, čistý, včetně páček", checked: false },
      { id: "p3", label: "Nabíječka robota – včetně kabelu a adaptéru", checked: false },
      { id: "p4", label: "Baterie – plně nabitá", checked: false },
      { id: "p5", label: "Přepravní kufr", checked: false }
    ],
    condition: [
      { id: "c1", label: "Všechny klouby se pohybují volně, žádné neobvyklé zvuky", checked: false },
      { id: "c2", label: "Kamerové systémy a senzory bez prachu a nečistot", checked: false },
      { id: "c3", label: "Pořízeny fotografie", checked: false }
    ],
    software: [
      { id: "s1", label: "Robot se zapíná bez chybových hlášek", checked: false },
      { id: "s2", label: "Ovladač a telefon se připojí k\u202Frobotu", checked: false },
      { id: "s3", label: "Vzdálené ovládání funguje (základní test pohybu)", checked: false },
      { id: "s4", label: "Wi-Fi / Bluetooth připojení funkční", checked: false }
    ]
  },

  // Return Specific
  returnBattery: "",
  runtimeHours: "",
  inspector: "",
  returnNote: "",
  returnChecklist: {
    physical: [
      { id: "rp1", label: "Všechny položky vráceny: robot, ovladač, baterie, nabíječka", checked: false },
      { id: "rp2", label: "Nic nechybí ani není poškozené", checked: false },
      { id: "rp3", label: "Robot čistý, bez nečistot či prachu", checked: false },
      { id: "rp4", label: "Konektory a porty nepoškozené", checked: false }
    ],
    condition: [
      { id: "rc1", label: "Žádné nové škrábance, praskliny, nebo uvolněné díly (foto)", checked: false },
      { id: "rc2", label: "Pohyby plynulé, žádné zasekávání kloubů", checked: false },
      { id: "rc3", label: "Kamery/senzory čisté a funkční", checked: false },
      { id: "rc4", label: "Robot se vypíná / zapíná normálně", checked: false }
    ],
    software: [
      { id: "rs1", label: "Připojení robota s ovladačem a telefonem funkční", checked: false },
      { id: "rs2", label: "Žádné chybové hlášky při spuštění", checked: false },
      { id: "rs3", label: "Baterie nabitá nebo uvedena úroveň při vrácení", checked: false },
      { id: "rs4", label: "Firmware beze změn (pokud nebyl updatován se souhlasem správce)", checked: false }
    ]
  },

  generalNote: "",
  confirmations: {
    safety: false,
    responsibility: false,
    correctness: false
  },
  photos: [],
  signatures: {
    owner: "",
    borrower: ""
  }
};

const createInitialState = () => ({
  ...clone(INITIAL_STATE),
  issueDate: new Date().toISOString().split("T")[0]
});

const openArchiveDb = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(CATEGORY_STORE)) {
        db.createObjectStore(CATEGORY_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(DEVICE_STORE)) {
        db.createObjectStore(DEVICE_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const withStore = async (storeName, mode, callback) => {
  const db = await openArchiveDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = callback(store);
    tx.oncomplete = () => {
      db.close();
      resolve(result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
};

const withArchiveStore = (mode, callback) => withStore(STORE_NAME, mode, callback);

const getAllFromStore = (storeName) =>
  withStore(storeName, "readonly", (store) => {
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  });

const putIntoStore = (storeName, record) =>
  withStore(storeName, "readwrite", (store) => {
    store.put(record);
  });

const sortCategories = (categories) =>
  [...categories].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || String(a.name || "").localeCompare(String(b.name || ""), "cs"));

const sortDevices = (devices) => [...devices].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "cs"));

const ensureDeviceCatalog = async () => {
  const [categories, devices] = await Promise.all([getAllFromStore(CATEGORY_STORE), getAllFromStore(DEVICE_STORE)]);
  if (categories.length === 0) {
    await Promise.all(DEFAULT_CATEGORIES.map((category) => putIntoStore(CATEGORY_STORE, category)));
  }
  if (devices.length === 0) {
    await Promise.all(DEFAULT_DEVICES.map((device) => putIntoStore(DEVICE_STORE, device)));
  }
};

const listDeviceCategories = async () => sortCategories(await getAllFromStore(CATEGORY_STORE));
const listDevices = async () => sortDevices(await getAllFromStore(DEVICE_STORE));

const listSavedProtocols = async () => {
  const records = await withArchiveStore("readonly", (store) => {
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  });

  return records
    .map(({ id, createdAt, updatedAt, mode, borrower, contactPerson, selectedRobots, selectedDevices, dateFrom, dateTo }) => ({
      id,
      createdAt,
      updatedAt,
      mode,
      borrower,
      contactPerson,
      selectedRobots: selectedRobots || [],
      selectedDevices: selectedDevices || [],
      dateFrom,
      dateTo
    }))
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
};

const getSavedProtocol = async (id) =>
  withArchiveStore("readonly", (store) => {
    const request = store.get(id);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  });

const putSavedProtocol = async (record) =>
  withArchiveStore("readwrite", (store) => {
    store.put(record);
  });

const removeSavedProtocol = async (id) =>
  withArchiveStore("readwrite", (store) => {
    store.delete(id);
  });

const formatArchiveDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

// --- Sub-Components ---

const SignaturePad = ({ label, printName, printDate, value, onChange }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!value) return;

    const image = new Image();
    image.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = value;
  }, [value]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const persist = () => {
    const canvas = canvasRef.current;
    onChange?.(canvas.toDataURL("image/png"));
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCoordinates(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const stopDrawing = () => {
    if (isDrawing) persist();
    setIsDrawing(false);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange?.("");
  };

  return (
    <div className="flex flex-col items-center flex-1">
      <span className="text-sm font-medium mb-2 text-slate-600">{label}</span>
      <div className="border-2 border-dashed border-slate-300 rounded-lg bg-white relative w-full max-w-[350px]">
        <canvas
          ref={canvasRef}
          width={350}
          height={150}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="cursor-crosshair touch-none w-full h-auto"
        />
        <button onClick={clear} className="absolute bottom-2 right-2 p-1.5 text-xs text-slate-400 hover:text-red-500 print:hidden">
          Smazat
        </button>
      </div>
      <div className="hidden print:block w-full max-w-[350px] mt-2 text-[10px] text-slate-500">
        <div className="flex justify-between gap-4">
          <span className="truncate">Jméno: {printName || "—"}</span>
          <span className="whitespace-nowrap">Datum: {printDate || "—"}</span>
        </div>
      </div>
    </div>
  );
};

const pad2 = (n) => String(n).padStart(2, "0");

const formatISODate = (d) => {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const parseISODate = (value) => {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
};

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d, delta) => new Date(d.getFullYear(), d.getMonth() + delta, 1);
const isSameDay = (a, b) =>
  a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const getMonthLabel = (d) =>
  d.toLocaleDateString("cs-CZ", {
    month: "long",
    year: "numeric"
  });

const DatePickerPopover = ({
  label,
  value,
  onChange,
  tone = "blue",
  placeholder = "Vyberte datum",
  align = "left",
  labelClassName = ""
}) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const popoverRef = useRef(null);

  const selectedDate = parseISODate(value);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selectedDate || new Date()));

  useEffect(() => {
    if (!open) return;
    setViewMonth(startOfMonth(selectedDate || new Date()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e) => {
      const a = anchorRef.current;
      const p = popoverRef.current;
      if (!a || !p) return;
      const path = typeof e.composedPath === "function" ? e.composedPath() : [];
      if (path.includes(a) || path.includes(p)) return;
      if (a.contains(e.target) || p.contains(e.target)) return;
      setOpen(false);
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const first = startOfMonth(viewMonth);
  const month = first.getMonth();
  const year = first.getFullYear();
  const today = new Date();

  // Monday-first calendar. Convert JS day (Sun=0) to Monday index (Mon=0..Sun=6)
  const weekdayIndex = (jsDay) => (jsDay + 6) % 7;
  const gridStart = new Date(year, month, 1 - weekdayIndex(first.getDay()));

  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    const inMonth = d.getMonth() === month && d.getFullYear() === year;
    return { d, inMonth };
  });

  const ring = tone === "orange" ? "focus:ring-orange-500" : "focus:ring-blue-500";
  const activeBg = tone === "orange" ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700";
  const activeText = tone === "orange" ? "text-orange-600" : "text-blue-600";

  const setDate = (d) => {
    onChange?.(formatISODate(d));
    setOpen(false);
  };

  const clear = () => {
    onChange?.("");
    setOpen(false);
  };

  return (
    <div className="group">
      {label ? (
        <label className={["block text-[10px] font-bold text-slate-400 uppercase mb-1", labelClassName].join(" ")}>
          {label}
        </label>
      ) : null}

      <div ref={anchorRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`w-full flex items-center justify-between gap-3 px-0 py-2 bg-transparent border-b border-slate-200 outline-none font-medium transition-all print:hidden ${ring}`}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className={value ? "text-slate-900" : "text-slate-400"}>{value || placeholder}</span>
          <Calendar size={16} className={value ? activeText : "text-slate-400"} />
        </button>

        <div className="hidden print:block w-full px-0 py-2 border-b border-slate-200 font-medium text-slate-900">
          {value || "—"}
        </div>

        {open ? (
          <div
            ref={popoverRef}
            role="dialog"
            className={[
              "absolute z-50 mt-2 rounded-2xl border border-slate-200 bg-white shadow-2xl p-4",
              "w-[calc(100vw-2rem)] max-w-[320px]",
              align === "right" ? "right-0" : "left-0"
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <button
                type="button"
                onClick={() => setViewMonth((m) => addMonths(m, -1))}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                aria-label="Předchozí měsíc"
              >
                ←
              </button>
              <div className="text-sm font-black text-slate-900 capitalize">{getMonthLabel(first)}</div>
              <button
                type="button"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                aria-label="Další měsíc"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-[10px] font-black text-slate-400 uppercase mb-1">
              {["Po", "Út", "St", "Čt", "Pá", "So", "Ne"].map((w) => (
                <div key={w} className="text-center py-1">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map(({ d, inMonth }) => {
                const selected = isSameDay(d, selectedDate);
                const isToday = isSameDay(d, today);
                const disabled = !inMonth;

                const base =
                  "h-9 rounded-xl text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2";
                const disabledCls = "text-slate-300 cursor-not-allowed";
                const selectedCls = `text-white ${activeBg} shadow-sm`;
                const todayCls = "border border-slate-300";
                const normalCls = "text-slate-700 hover:bg-slate-100";

                return (
                  <button
                    key={formatISODate(d)}
                    type="button"
                    disabled={disabled}
                    onClick={() => setDate(d)}
                    className={[
                      base,
                      disabled ? disabledCls : normalCls,
                      isToday && !selected ? todayCls : "",
                      selected ? selectedCls : ""
                    ].join(" ")}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setDate(new Date())}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-black"
              >
                Dnes
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clear}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-black"
                >
                  Smazat
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-black ${activeBg}`}
                >
                  Zavřít
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const getCategoryName = (categories, categoryId) => categories.find((category) => category.id === categoryId)?.name || "Bez kategorie";

const toDeviceSnapshot = (device, categories) => ({
  id: device.id,
  name: device.name,
  categoryName: getCategoryName(categories, device.categoryId),
  model: device.model || "",
  serialNumber: device.serialNumber || ""
});

const getProtocolDevices = (record) => {
  if (Array.isArray(record.selectedDevices) && record.selectedDevices.length > 0) {
    return record.selectedDevices.map((device) => ({
      id: device.id || "",
      name: device.name || "",
      categoryName: device.categoryName || "",
      model: device.model || "",
      serialNumber: device.serialNumber || ""
    }));
  }
  if (Array.isArray(record.selectedRobots) && record.selectedRobots.length > 0) {
    return record.selectedRobots.map((name) => ({ id: "", name, categoryName: "", model: "", serialNumber: "" }));
  }
  return [];
};

const DeviceCombobox = ({ devices, categories, selectedDevices, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const selectedIds = new Set(selectedDevices.map((device) => device.id).filter(Boolean));
  const selectedNames = new Set(selectedDevices.map((device) => device.name).filter(Boolean));

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const normalizedQuery = query.trim().toLocaleLowerCase("cs-CZ");
  const activeCategories = sortCategories(categories.filter((category) => category.active));
  const activeCategoryIds = new Set(activeCategories.map((category) => category.id));
  const activeDevices = sortDevices(
    devices.filter((device) => {
      if (!device.active) return false;
      if (!activeCategoryIds.has(device.categoryId)) return false;
      const categoryName = getCategoryName(categories, device.categoryId);
      if (!normalizedQuery) return true;
      return [device.name, device.model, device.serialNumber, categoryName]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("cs-CZ").includes(normalizedQuery));
    })
  );

  const addDevice = (device) => {
    if (selectedIds.has(device.id) || selectedNames.has(device.name)) return;
    onChange([...selectedDevices, toDeviceSnapshot(device, categories)]);
    setQuery("");
    setOpen(false);
  };

  const removeDevice = (device) => {
    onChange(selectedDevices.filter((selected) => selected.id !== device.id && selected.name !== device.name));
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="min-h-[52px] rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
        <div className="flex flex-wrap items-center gap-2">
          {selectedDevices.map((device) => (
            <span key={device.id || device.name} className="inline-flex max-w-full items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">
              <span className="truncate">{device.name}</span>
              <button
                type="button"
                onClick={() => removeDevice(device)}
                className="rounded p-0.5 text-white/70 hover:bg-white/10 hover:text-white"
                aria-label={`Odebrat zařízení ${device.name}`}
              >
                <X size={13} />
              </button>
            </span>
          ))}
          <div className="flex min-w-[220px] flex-1 items-center gap-2">
            <Search size={16} className="text-slate-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder={selectedDevices.length === 0 ? "Vyberte zařízení" : "Přidat další zařízení"}
              className="min-w-0 flex-1 border-0 bg-transparent py-1 text-sm font-medium outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Otevřít výběr zařízení"
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div className="absolute z-40 mt-2 max-h-[360px] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {activeDevices.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm font-medium text-slate-500">Žádné aktivní zařízení neodpovídá hledání.</div>
          ) : (
            activeCategories.map((category) => {
              const categoryDevices = activeDevices.filter((device) => device.categoryId === category.id);
              if (categoryDevices.length === 0) return null;
              return (
                <div key={category.id} className="border-b border-slate-100 last:border-b-0">
                  <div className="sticky top-0 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {category.name}
                  </div>
                  {categoryDevices.map((device) => {
                    const selected = selectedIds.has(device.id) || selectedNames.has(device.name);
                    return (
                      <button
                        key={device.id}
                        type="button"
                        disabled={selected}
                        onClick={() => addDevice(device)}
                        className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors ${
                          selected ? "cursor-not-allowed bg-slate-50 text-slate-300" : "hover:bg-blue-50"
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black text-slate-900">{device.name}</span>
                          <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">
                            {[device.model, device.serialNumber].filter(Boolean).join(" · ") || "Bez doplňujících údajů"}
                          </span>
                        </span>
                        <span className={`rounded-md px-2 py-1 text-[10px] font-black ${selected ? "bg-slate-200 text-slate-400" : "bg-slate-900 text-white"}`}>
                          {selected ? "Vybráno" : "Přidat"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
};

const AdminPanel = ({ open, categories, devices, onClose, onSaveCategory, onSaveDevice }) => {
  const emptyCategory = { id: "", name: "", sortOrder: categories.length + 1, active: true };
  const emptyDevice = { id: "", name: "", categoryId: categories[0]?.id || "", model: "", serialNumber: "", active: true };
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [deviceForm, setDeviceForm] = useState(emptyDevice);

  useEffect(() => {
    if (!open) return;
    setCategoryForm({ id: "", name: "", sortOrder: categories.length + 1, active: true });
    setDeviceForm({ id: "", name: "", categoryId: categories[0]?.id || "", model: "", serialNumber: "", active: true });
  }, [open, categories]);

  if (!open) return null;

  const submitCategory = (e) => {
    e.preventDefault();
    const name = categoryForm.name.trim();
    if (!name) return;
    onSaveCategory({ ...categoryForm, name, sortOrder: Number(categoryForm.sortOrder) || categories.length + 1 });
    setCategoryForm({ id: "", name: "", sortOrder: categories.length + 1, active: true });
  };

  const submitDevice = (e) => {
    e.preventDefault();
    const name = deviceForm.name.trim();
    if (!name || !deviceForm.categoryId) return;
    onSaveDevice({
      ...deviceForm,
      name,
      model: deviceForm.model.trim(),
      serialNumber: deviceForm.serialNumber.trim()
    });
    setDeviceForm({ id: "", name: "", categoryId: categories[0]?.id || "", model: "", serialNumber: "", active: true });
  };

  const activeCategories = sortCategories(categories.filter((category) => category.active));

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/40 p-4 print:hidden">
      <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-sm font-black uppercase tracking-widest text-slate-900">Správa katalogu</div>
            <div className="text-xs font-medium text-slate-500">Zařízení a kategorie jsou uložené lokálně v tomto prohlížeči.</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Zavřít správu">
            <X size={18} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r">
            <form onSubmit={submitCategory} className="space-y-4">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">Kategorie</div>
              <input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Název kategorie"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                <input
                  type="number"
                  min="1"
                  value={categoryForm.sortOrder}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Pořadí kategorie"
                />
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <input
                    type="checkbox"
                    checked={categoryForm.active}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, active: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  Aktivní
                </label>
              </div>
              <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-slate-800">
                {categoryForm.id ? "Uložit kategorii" : "Přidat kategorii"}
              </button>
            </form>

            <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200">
              {sortCategories(categories).map((category) => (
                <div key={category.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="min-w-0">
                    <div className={`truncate text-sm font-bold ${category.active ? "text-slate-900" : "text-slate-400"}`}>{category.name}</div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Pořadí {category.sortOrder || 0}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCategoryForm({ ...category })}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                    aria-label={`Upravit kategorii ${category.name}`}
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5">
            <form onSubmit={submitDevice} className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
              <div className="md:col-span-2 text-xs font-black uppercase tracking-widest text-slate-400">Zařízení</div>
              <input
                value={deviceForm.name}
                onChange={(e) => setDeviceForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Název zařízení"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={deviceForm.categoryId}
                onChange={(e) => setDeviceForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
              >
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                value={deviceForm.model}
                onChange={(e) => setDeviceForm((prev) => ({ ...prev, model: e.target.value }))}
                placeholder="Model / typ"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={deviceForm.serialNumber}
                onChange={(e) => setDeviceForm((prev) => ({ ...prev, serialNumber: e.target.value }))}
                placeholder="Sériové číslo"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <input
                  type="checkbox"
                  checked={deviceForm.active}
                  onChange={(e) => setDeviceForm((prev) => ({ ...prev, active: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                Aktivní ve výběru
              </label>
              <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-slate-800">
                {deviceForm.id ? "Uložit zařízení" : "Přidat zařízení"}
              </button>
            </form>

            <div className="mt-5 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
              {sortDevices(devices).map((device) => (
                <div key={device.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <div className={`truncate text-sm font-black ${device.active ? "text-slate-900" : "text-slate-400"}`}>{device.name}</div>
                    <div className="mt-0.5 truncate text-xs font-medium text-slate-500">
                      {[getCategoryName(categories, device.categoryId), device.model, device.serialNumber].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeviceForm({ ...device })}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                    aria-label={`Upravit zařízení ${device.name}`}
                  >
                    <Pencil size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [data, setData] = useState(() => createInitialState());
  const [savedProtocols, setSavedProtocols] = useState([]);
  const [deviceCategories, setDeviceCategories] = useState([]);
  const [devices, setDevices] = useState([]);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [catalogError, setCatalogError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const settingsIconRef = useRef(null);
  const archiveIconRef = useRef(null);
  const plusIconRef = useRef(null);

  const getIconAnimationHandlers = (iconRef) => ({
    onMouseEnter: () => iconRef.current?.startAnimation(),
    onMouseLeave: () => iconRef.current?.stopAnimation(),
    onFocus: () => iconRef.current?.startAnimation(),
    onBlur: () => iconRef.current?.stopAnimation()
  });

  const refreshArchive = async () => {
    try {
      setStorageError("");
      setSavedProtocols(await listSavedProtocols());
    } catch (error) {
      console.error(error);
      setStorageError("Archiv se nepodařilo načíst. Zkontrolujte oprávnění úložiště v prohlížeči.");
    }
  };

  const refreshCatalog = async () => {
    try {
      setCatalogError("");
      await ensureDeviceCatalog();
      const [categories, catalogDevices] = await Promise.all([listDeviceCategories(), listDevices()]);
      setDeviceCategories(categories);
      setDevices(catalogDevices);
    } catch (error) {
      console.error(error);
      setCatalogError("Katalog zařízení se nepodařilo načíst.");
    }
  };

  useEffect(() => {
    refreshArchive();
    refreshCatalog();
  }, []);

  const handleReset = () => {
    if (window.confirm("Opravdu chcete vytvořit nový protokol? Všechna zadaná data budou smazána.")) {
      setData(createInitialState());
      setSaveStatus("");
      window.scrollTo(0, 0);
    }
  };

  const persistCurrentProtocol = async () => {
    const now = new Date().toISOString();
    const protocolDevices = getProtocolDevices(data);
    const record = {
      ...data,
      id: data.id || makeId(),
      createdAt: data.createdAt || now,
      updatedAt: now,
      selectedDevices: protocolDevices,
      selectedRobots: protocolDevices.map((device) => device.name).filter(Boolean),
      signatures: data.signatures || { owner: "", borrower: "" }
    };

    await putSavedProtocol(record);
    setData(record);
    await refreshArchive();
    setSaveStatus(`Uloženo ${formatArchiveDate(now)}`);
    return record;
  };

  const handleSave = async () => {
    try {
      setStorageError("");
      await persistCurrentProtocol();
    } catch (error) {
      console.error(error);
      setStorageError("Protokol se nepodařilo uložit. Pravděpodobně došlo místo v úložišti prohlížeče.");
    }
  };

  const handleLoadProtocol = async (id) => {
    try {
      setStorageError("");
      const record = await getSavedProtocol(id);
      if (!record) {
        setStorageError("Vybraný protokol už v archivu není.");
        await refreshArchive();
        return;
      }
      setData({
        ...createInitialState(),
        ...record,
        selectedDevices: getProtocolDevices(record),
        selectedRobots: getProtocolDevices(record).map((device) => device.name).filter(Boolean),
        signatures: record.signatures || { owner: "", borrower: "" }
      });
      setArchiveOpen(false);
      setSaveStatus(`Načteno ${formatArchiveDate(record.updatedAt)}`);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error(error);
      setStorageError("Protokol se nepodařilo načíst.");
    }
  };

  const handleDeleteProtocol = async (id) => {
    if (!window.confirm("Opravdu chcete tento uložený protokol odstranit z archivu?")) return;

    try {
      setStorageError("");
      await removeSavedProtocol(id);
      if (data.id === id) {
        setData(createInitialState());
        setSaveStatus("");
      }
      await refreshArchive();
    } catch (error) {
      console.error(error);
      setStorageError("Protokol se nepodařilo odstranit.");
    }
  };

  const handlePrint = async () => {
    try {
      await persistCurrentProtocol();
    } catch (error) {
      console.error(error);
      setStorageError("Před tiskem se protokol nepodařilo uložit do archivu.");
    }
    window.print();
  };

  const updateData = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const updateSelectedDevices = (selectedDevices) => {
    setData((prev) => ({
      ...prev,
      selectedDevices,
      selectedRobots: selectedDevices.map((device) => device.name).filter(Boolean)
    }));
  };

  const saveCategory = async (category) => {
    try {
      setCatalogError("");
      const record = {
        ...category,
        id: category.id || makeId(),
        active: Boolean(category.active),
        sortOrder: Number(category.sortOrder) || deviceCategories.length + 1
      };
      await putIntoStore(CATEGORY_STORE, record);
      await refreshCatalog();
    } catch (error) {
      console.error(error);
      setCatalogError("Kategorii se nepodařilo uložit.");
    }
  };

  const saveDevice = async (device) => {
    try {
      setCatalogError("");
      const now = new Date().toISOString();
      const record = {
        ...device,
        id: device.id || makeId(),
        active: Boolean(device.active),
        createdAt: device.createdAt || now,
        updatedAt: now
      };
      await putIntoStore(DEVICE_STORE, record);
      await refreshCatalog();
    } catch (error) {
      console.error(error);
      setCatalogError("Zařízení se nepodařilo uložit.");
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (data.photos.length + files.length > 12) {
      alert("Maximální počet fotografií je 12.");
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData((prev) => ({
          ...prev,
          photos: [...prev.photos, reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const toggleCheck = (section, index, modeType) => {
    const key = modeType === "issue" ? "issueChecklist" : "returnChecklist";
    const newList = [...data[key][section]];
    newList[index].checked = !newList[index].checked;
    setData((prev) => ({
      ...prev,
      [key]: { ...prev[key], [section]: newList }
    }));
  };

  const updateSignature = (key, value) => {
    setData((prev) => ({
      ...prev,
      signatures: {
        ...(prev.signatures || { owner: "", borrower: "" }),
        [key]: value
      }
    }));
  };

  const selectedProtocolDevices = getProtocolDevices(data);
  const protocolPrintDevices = selectedProtocolDevices.length > 0 ? selectedProtocolDevices : [{ name: "" }];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 print:bg-white print:p-0">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm print:hidden">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white p-2 rounded-lg">
              <Cpu size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Předávací protokol</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Unitree Fleet Management</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => updateData("mode", "issue")}
              className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                data.mode === "issue" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Vydání
            </button>
            <button
              onClick={() => updateData("mode", "return")}
              className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                data.mode === "return" ? "bg-white shadow-sm text-orange-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Vrácení
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAdminOpen(true)}
              {...getIconAnimationHandlers(settingsIconRef)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <SettingsIcon ref={settingsIconRef} size={18} />
              <span className="hidden sm:inline">Správa</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setArchiveOpen((open) => !open)}
                {...getIconAnimationHandlers(archiveIconRef)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArchiveIcon ref={archiveIconRef} size={18} />
                <span className="hidden sm:inline">Archiv</span>
                {savedProtocols.length > 0 ? (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">
                    {savedProtocols.length}
                  </span>
                ) : null}
              </button>

              {archiveOpen ? (
                <div className="absolute right-0 top-full mt-2 w-[min(92vw,420px)] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
                    <div>
                      <div className="text-sm font-black text-slate-900">Uložené protokoly</div>
                      <div className="text-[11px] text-slate-500">Uloženo lokálně v tomto prohlížeči</div>
                    </div>
                    <button
                      onClick={() => setArchiveOpen(false)}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                      aria-label="Zavřít archiv"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {storageError ? <div className="px-4 py-3 text-xs font-semibold text-red-600 bg-red-50">{storageError}</div> : null}

                  <div className="max-h-[360px] overflow-y-auto">
                    {savedProtocols.length === 0 ? (
                      <div className="px-4 py-8 text-sm text-slate-500 text-center">Zatím není uložený žádný protokol.</div>
                    ) : (
                      savedProtocols.map((protocol) => {
                        const protocolDevices = getProtocolDevices(protocol);
                        const title = [
                          protocolDevices.map((device) => device.name).filter(Boolean).join(", "),
                          protocol.borrower || protocol.contactPerson || "Bez názvu"
                        ]
                          .filter(Boolean)
                          .join(" - ");
                        const dates = [protocol.dateFrom, protocol.dateTo].filter(Boolean).join(" až ");

                        return (
                          <div key={protocol.id} className="flex items-start gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0">
                            <button onClick={() => handleLoadProtocol(protocol.id)} className="min-w-0 flex-1 text-left group">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                    protocol.mode === "return" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                                  }`}
                                >
                                  {protocol.mode === "return" ? "Vrácení" : "Vydání"}
                                </span>
                                <span className="text-[11px] text-slate-400">{formatArchiveDate(protocol.updatedAt)}</span>
                              </div>
                              <div className="mt-1 font-bold text-sm text-slate-900 truncate group-hover:text-blue-600">{title}</div>
                              {dates ? <div className="mt-0.5 text-xs text-slate-500 truncate">{dates}</div> : null}
                            </button>
                            <button
                              onClick={() => handleDeleteProtocol(protocol.id)}
                              className="p-2 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50"
                              aria-label="Smazat uložený protokol"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Save size={18} />
              <span className="hidden sm:inline">Uložit</span>
            </button>
            <button
              onClick={handleReset}
              {...getIconAnimationHandlers(plusIconRef)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <PlusIcon ref={plusIconRef} size={18} />
              <span className="hidden sm:inline">Nový</span>
            </button>
            <button
              onClick={handlePrint}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-lg shadow-lg transition-all active:scale-95 ${
                data.mode === "issue" ? "bg-blue-600 hover:bg-blue-700" : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              <Printer size={18} />
              <span>PDF / Tisk</span>
            </button>
          </div>
        </div>
        {(saveStatus || storageError) && !archiveOpen ? (
          <div className="max-w-6xl mx-auto mt-2 text-right text-[11px] font-semibold">
            {storageError ? <span className="text-red-600">{storageError}</span> : <span className="text-slate-500">{saveStatus}</span>}
          </div>
        ) : null}
        {catalogError ? <div className="max-w-6xl mx-auto mt-2 text-right text-[11px] font-semibold text-red-600">{catalogError}</div> : null}
      </header>

      <AdminPanel
        open={adminOpen}
        categories={deviceCategories}
        devices={devices}
        onClose={() => setAdminOpen(false)}
        onSaveCategory={saveCategory}
        onSaveDevice={saveDevice}
      />

      {/* Protocol Canvas */}
      {protocolPrintDevices.map((protocolDevice, protocolIndex) => (
        <main
          key={protocolDevice.id || protocolDevice.name || "single-protocol"}
          className={`max-w-4xl mx-auto mt-8 mb-12 bg-white shadow-2xl border border-slate-200 rounded-2xl overflow-hidden print:shadow-none print:border-0 print:mt-0 print:max-w-full ${
            protocolIndex > 0 ? "screen-only-hidden print-page-break-before" : ""
          }`}
        >
        {/* Dynamic Header for Printing */}
        <div className="hidden print:flex justify-between items-start border-b-4 border-slate-900 pb-6 p-10">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-1">Protokol o předání</h1>
            <div className="mt-6 flex flex-wrap gap-2">
              {protocolDevice.name ? (
                <span className="bg-slate-900 text-white px-4 py-1.5 rounded-md font-mono text-sm font-bold">
                  ZAŘÍZENÍ: {protocolDevice.name}
                </span>
              ) : null}
              {protocolDevice.categoryName ? (
                <span className="bg-slate-100 text-slate-900 px-4 py-1.5 rounded-md font-mono text-sm font-bold">
                  {protocolDevice.categoryName}
                </span>
              ) : null}
              {[protocolDevice.model, protocolDevice.serialNumber].filter(Boolean).map((value) => (
                <span key={value} className="bg-slate-100 text-slate-900 px-4 py-1.5 rounded-md font-mono text-sm font-bold">
                  {value}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12 space-y-12">
          {/* Section: Robot Selector (UI only) */}
          <section className="print:hidden">
            <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-[0.2em]">Výběr zařízení k protokolu</label>
            <DeviceCombobox
              devices={devices}
              categories={deviceCategories}
              selectedDevices={getProtocolDevices(data)}
              onChange={updateSelectedDevices}
            />
          </section>

          {/* Section: Identification */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-100">
                <User size={16} className="text-blue-500" /> Smluvní strany
              </h3>
              <div className="space-y-4">
                <div className="group">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 transition-colors group-focus-within:text-blue-500">
                    Vypůjčitel (Firma/Subjekt)
                  </label>
                  <input
                    type="text"
                    value={data.borrower}
                    onChange={(e) => updateData("borrower", e.target.value)}
                    placeholder="ČVUT v Praze"
                    className="w-full px-0 py-2 bg-transparent border-b border-slate-200 focus:border-blue-500 outline-none font-medium transition-all"
                  />
                </div>
                <div className="group">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 transition-colors group-focus-within:text-blue-500">
                    Kontaktní osoba
                  </label>
                  <input
                    type="text"
                    value={data.contactPerson}
                    onChange={(e) => updateData("contactPerson", e.target.value)}
                    className="w-full px-0 py-2 bg-transparent border-b border-slate-200 focus:border-blue-500 outline-none font-medium transition-all"
                  />
                </div>
                <div className="group">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 transition-colors group-focus-within:text-blue-500">
                    Předávající (za zapůjčitele)
                  </label>
                  <input
                    type="text"
                    value={data.responsibleOwner}
                    onChange={(e) => updateData("responsibleOwner", e.target.value)}
                    className="w-full px-0 py-2 bg-transparent border-b border-slate-200 focus:border-blue-500 outline-none font-medium transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-100">
                <Calendar size={16} className="text-blue-500" /> Podrobnosti výpůjčky
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <DatePickerPopover
                    label="Datum od"
                    value={data.dateFrom}
                    onChange={(v) => updateData("dateFrom", v)}
                    tone="blue"
                    placeholder="YYYY-MM-DD"
                    align="left"
                  />
                  <DatePickerPopover
                    label="Datum do (předpoklad)"
                    value={data.dateTo}
                    onChange={(v) => updateData("dateTo", v)}
                    tone="blue"
                    placeholder="YYYY-MM-DD"
                    align="right"
                    labelClassName="print-nowrap"
                  />
                </div>
                <div className="group">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Lokalita / Místo předání</label>
                  <input
                    type="text"
                    value={data.handoverPlace}
                    onChange={(e) => updateData("handoverPlace", e.target.value)}
                    className="w-full px-0 py-2 bg-transparent border-b border-slate-200 focus:border-blue-500 outline-none font-medium transition-all"
                  />
                </div>
                <div className="group">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Účel využití</label>
                  <input
                    type="text"
                    value={data.purpose}
                    onChange={(e) => updateData("purpose", e.target.value)}
                    className="w-full px-0 py-2 bg-transparent border-b border-slate-200 focus:border-blue-500 outline-none font-medium transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Mode-Specific: ISSUE SECTION */}
          {data.mode === "issue" && (
            <section className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-blue-500 pl-3">
                    Kontrolní body (Vydání)
                  </h4>
                  {Object.entries(data.issueChecklist).map(([key, items]) => (
                    <div key={key} className="space-y-2 print-avoid-break">
                      <span className="text-[9px] font-black text-slate-300 uppercase block mb-2">
                        {key === "physical" ? "Fyzické vybavení" : key === "condition" ? "Stav robota" : "Elektronika a software"}
                      </span>
                      {items.map((item, idx) => (
                        <label
                          key={item.id}
                          className="flex items-center gap-3 py-1.5 cursor-pointer group hover:bg-slate-50 rounded-lg px-2 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => toggleCheck(key, idx, "issue")}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <label className="block text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-blue-500 pl-3">
                    Doplňující poznámky
                  </label>
                  <textarea
                    rows={10}
                    value={data.issueNote}
                    onChange={(e) => updateData("issueNote", e.target.value)}
                    placeholder="Popište stav zařízení, případné vady nebo specifika..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm font-medium leading-relaxed"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Mode-Specific: RETURN SECTION */}
          {data.mode === "return" && (
            <section className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-orange-500 pl-3">
                    Kontrolní body (Vrácení)
                  </h4>
                  {Object.entries(data.returnChecklist).map(([key, items]) => (
                    <div key={key} className="space-y-2 print-avoid-break">
                      <span className="text-[9px] font-black text-slate-300 uppercase block mb-2">
                        {key === "physical" ? "Fyzické vybavení" : key === "condition" ? "Stav robota" : "Elektronika a software"}
                      </span>
                      {items.map((item, idx) => (
                        <label
                          key={item.id}
                          className="flex items-center gap-3 py-1.5 cursor-pointer group hover:bg-slate-50 rounded-lg px-2 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => toggleCheck(key, idx, "return")}
                            className="w-5 h-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <label className="block text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-orange-500 pl-3">
                    Nález při převzetí
                  </label>
                  <textarea
                    rows={10}
                    value={data.returnNote}
                    onChange={(e) => updateData("returnNote", e.target.value)}
                    placeholder="Popište stav po ukončení výpůjčky, zjištěné závady nebo chybějící položky..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none text-sm font-medium leading-relaxed"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Section: Photos */}
          <section className={`space-y-6 ${data.photos.length === 0 ? "print:hidden" : ""}`}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Camera size={16} className="text-blue-500" /> Fotodokumentace ({data.photos.length}/12)
              </h3>
              <label className="cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95 print:hidden">
                <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                Nahrát fotografie
              </label>
            </div>

            {data.photos.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300 print:hidden">
                <Camera size={40} strokeWidth={1} />
                <p className="text-sm font-medium mt-3">Nahrajte aktuální fotky robota pro archivaci</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 print:grid-cols-3">
                {data.photos.map((photo, i) => (
                  <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm group">
                    <img src={photo} alt="Doc" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-700 print:hidden"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section: Consents */}
          <section className="bg-slate-900 text-white p-8 rounded-3xl space-y-6 print:bg-white print:text-slate-900 print:p-0 print:border-t-2 print:border-slate-900 print:rounded-none print:pt-6 print-avoid-break">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-blue-400 print:text-slate-900">
              <CheckCircle2 size={16} /> Čestné prohlášení
            </h3>

            <div className="space-y-4">
              {Object.entries({
                safety: "Vypůjčitel stvrzuje, že byl proškolen v ovládání zařízení a seznámen s bezpečnostními riziky.",
                responsibility: "Vypůjčitel bere na vědomí odpovědnost za případné škody způsobené neodborným zacházením.",
                correctness: "Smluvní strany prohlašují, že údaje v protokolu odpovídají skutečnému stavu věci."
              }).map(([key, label]) => (
                <label key={key} className="flex items-start gap-4 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={data.confirmations[key]}
                    onChange={(e) => setData({ ...data, confirmations: { ...data.confirmations, [key]: e.target.checked } })}
                    className="mt-1 w-5 h-5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-offset-slate-900 print:border-slate-300"
                  />
                  <span className="text-sm font-medium opacity-80 group-hover:opacity-100 transition-opacity leading-snug">{label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Section: Signatures */}
          <section className="pt-6 print-avoid-break">
            <div className="flex flex-col md:flex-row gap-12 justify-center items-center">
              <SignaturePad
                label="Za zapůjčitele (Podpis)"
                printName={data.responsibleOwner}
                printDate={data.issueDate}
                value={data.signatures?.owner || ""}
                onChange={(value) => updateSignature("owner", value)}
              />
              <SignaturePad
                label="Za vypůjčitele (Podpis)"
                printName={[data.borrower, data.contactPerson].filter(Boolean).join(" / ")}
                printDate={data.issueDate}
                value={data.signatures?.borrower || ""}
                onChange={(value) => updateSignature("borrower", value)}
              />
            </div>
          </section>
        </div>
        </main>
      ))}
    </div>
  );
}
