import { useMemo, useState } from "react";
import Header from "./components/Header.jsx";
import SummaryBar from "./components/SummaryBar.jsx";
import SectionCard from "./components/SectionCard.jsx";
import RobotPicker from "./components/RobotPicker.jsx";
import Field from "./components/Field.jsx";
import Checklist from "./components/Checklist.jsx";
import PhotoUpload from "./components/PhotoUpload.jsx";
import SignatureBox from "./components/SignatureBox.jsx";
import { issueChecklist, returnChecklist, robots } from "./data/checklists.js";

const initialForm = {
  issueDate: new Date().toISOString().slice(0, 10),
  borrower: "",
  contactPerson: "",
  purpose: "",
  dateFrom: "",
  dateTo: "",
  handoverPlace: "",
  owner: "",
  issueBattery: "",
  serialNumber: "",
  firmware: "",
  issueNote: "",
  returnBattery: "",
  runtimeHours: "",
  returnInspector: "",
  returnNote: "",
  generalNote: "",
  lenderSigner: "",
  borrowerSigner: ""
};

export default function App() {
  const [mode, setMode] = useState("issue");
  const [form, setForm] = useState(initialForm);
  const [selectedRobots, setSelectedRobots] = useState([robots[0]]);
  const [checks, setChecks] = useState({ issueChecks: [], returnChecks: [], confirmations: [] });
  const [photos, setPhotos] = useState([]);
  const [clearSignal, setClearSignal] = useState(0);

  const protocolTitle = form.borrower.trim() ? `Zápůjčka ${form.borrower.trim()}` : "Zápůjčka";
  const completion = useMemo(() => {
    const required = ["borrower", "contactPerson", "purpose", "dateFrom", "dateTo", "handoverPlace", "owner"];
    const filled = required.filter((name) => form[name].trim()).length;
    return Math.round((filled / required.length) * 100);
  }, [form]);

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const toggleCheck = (group, value) => {
    setChecks((current) => {
      const exists = current[group].includes(value);
      return {
        ...current,
        [group]: exists ? current[group].filter((item) => item !== value) : [...current[group], value]
      };
    });
  };

  const resetForm = () => {
    if (!confirm("Opravdu chcete založit nový prázdný protokol?")) return;
    setMode("issue");
    setForm({ ...initialForm, issueDate: new Date().toISOString().slice(0, 10) });
    setSelectedRobots([robots[0]]);
    setChecks({ issueChecks: [], returnChecks: [], confirmations: [] });
    setPhotos([]);
    setClearSignal((value) => value + 1);
  };

  return (
    <>
      <Header mode={mode} setMode={setMode} onPrint={() => window.print()} onReset={resetForm} />

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-5 md:px-7">
        <SummaryBar robotCount={selectedRobots.length} mode={mode} photoCount={photos.length} completion={completion} />

        <form className="grid gap-4">
          <SectionCard accent className="grid gap-5 md:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-mint-700">Předávací protokol</p>
              <h2 className="mt-1 text-3xl font-black leading-tight text-ink md:text-4xl">{protocolTitle}</h2>
              <p className="mt-2 text-sm text-slate-600">Roboti Unitree: {selectedRobots.join(", ")}</p>
            </div>
            <Field label="Datum vystavení" name="issueDate" type="date" value={form.issueDate} onChange={updateField} />
          </SectionCard>

          <SectionCard>
            <div className="section-heading">
              <h3>Údaje o výpůjčce</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <RobotPicker selectedRobots={selectedRobots} setSelectedRobots={setSelectedRobots} />
              <Field label="Vypůjčitel / organizace" name="borrower" value={form.borrower} placeholder="Jméno organizace nebo osoby" onChange={updateField} />
              <Field label="Kontaktní osoba" name="contactPerson" value={form.contactPerson} placeholder="Jméno, telefon, e-mail" onChange={updateField} />
              <Field label="Účel výpůjčky" name="purpose" value={form.purpose} placeholder="Demo, testování, školení..." onChange={updateField} />
              <Field label="Termín od" name="dateFrom" type="date" value={form.dateFrom} onChange={updateField} />
              <Field label="Termín do" name="dateTo" type="date" value={form.dateTo} onChange={updateField} />
              <Field label="Místo předání" name="handoverPlace" value={form.handoverPlace} placeholder="Adresa / místnost" onChange={updateField} />
              <Field label="Odpovědná osoba" name="owner" value={form.owner} placeholder="Interní garant" onChange={updateField} />
            </div>
          </SectionCard>

          <SectionCard className={mode === "issue" ? "" : "edit-hidden"} data-section="issue">
            <div className="section-heading">
              <div>
                <h3>Vydání robota před půjčením</h3>
                <p>Kontrola stavu, příslušenství a provozní připravenosti.</p>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Stav baterie při vydání" name="issueBattery" value={form.issueBattery} placeholder="např. 100 %" onChange={updateField} />
                <Field label="Sériové číslo robota" name="serialNumber" value={form.serialNumber} placeholder="SN / inventární číslo" onChange={updateField} />
                <Field label="Verze firmware" name="firmware" value={form.firmware} placeholder="volitelné" onChange={updateField} />
              </div>
              <Checklist groups={issueChecklist} name="issueChecks" values={checks.issueChecks} onToggle={toggleCheck} />
              <Field label="Poznámka k vydání" name="issueNote" value={form.issueNote} placeholder="Popis stavu, chybějící příslušenství, omezení provozu..." as="textarea" onChange={updateField} />
            </div>
          </SectionCard>

          <SectionCard className={mode === "return" ? "" : "edit-hidden"} data-section="return">
            <div className="section-heading">
              <div>
                <h3>Vrácení robota po výpůjčce</h3>
                <p>Vyplňuje se při převzetí robota zpět.</p>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Stav baterie při vrácení" name="returnBattery" value={form.returnBattery} placeholder="např. 38 %" onChange={updateField} />
                <Field label="Počet provozních hodin" name="runtimeHours" value={form.runtimeHours} placeholder="volitelné" onChange={updateField} />
                <Field label="Kontrolu provedl" name="returnInspector" value={form.returnInspector} placeholder="Jméno a příjmení" onChange={updateField} />
              </div>
              <Checklist groups={returnChecklist} name="returnChecks" values={checks.returnChecks} onToggle={toggleCheck} />
              <Field label="Poznámka k vrácení" name="returnNote" value={form.returnNote} placeholder="Popis závad, opotřebení, rozdíly oproti vydání..." as="textarea" onChange={updateField} />
            </div>
          </SectionCard>

          <PhotoUpload photos={photos} setPhotos={setPhotos} />

          <SectionCard>
            <div className="section-heading">
              <h3>Poznámky a potvrzení</h3>
            </div>
            <Field label="Obecné poznámky" name="generalNote" value={form.generalNote} placeholder="Další ujednání, upozornění, odpovědnost za škody, servisní stav..." as="textarea" rows={5} onChange={updateField} />
            <div className="mt-4 rounded-lg border border-mint-200 bg-mint-50/80 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  "Vypůjčitel byl seznámen s bezpečnostními pokyny",
                  "Vypůjčitel přebírá odpovědnost za robota a příslušenství",
                  "Obě strany potvrzují správnost uvedených údajů"
                ].map((item) => (
                  <label key={item} className="grid grid-cols-[18px_1fr] items-start gap-2 text-sm font-medium text-slate-700">
                    <input className="mt-0.5 size-[18px] accent-mint-700" type="checkbox" checked={checks.confirmations.includes(item)} onChange={() => toggleCheck("confirmations", item)} />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <SignatureBox title="Za zapůjčitele" signerName={form.lenderSigner} signerField="lenderSigner" onFieldChange={updateField} clearSignal={clearSignal} />
              <SignatureBox title="Za vypůjčitele" signerName={form.borrowerSigner} signerField="borrowerSigner" onFieldChange={updateField} clearSignal={clearSignal} />
            </div>
          </SectionCard>
        </form>
      </main>
    </>
  );
}
