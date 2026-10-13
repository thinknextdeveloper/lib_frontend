"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { reduxApiClient } from "../../../services/apiClient";
import {
  addBooks,
  addMaster,
  addWriteOff,
  clearLoaded,
  clearLookups,
  clearNotice,
  fetchColleges,
  fetchLookups,
  fetchNextAccession,
  loadByAccession,
  updateBook,
} from "@/store/slices/stockSlice";

const css = `
.sr-page { display:flex; gap:20px; align-items:flex-start; padding:20px; color:var(--text,#e5e7eb); }
.sr-card { flex:1; max-width:900px; background:var(--card,#111827); border:1px solid var(--border,#273244);
  border-radius:14px; padding:20px 22px; }
.sr-title { font-size:16px; font-weight:600; margin:0 0 14px; }
.sr-f { display:grid; grid-template-columns:140px 1fr; align-items:center; gap:8px; margin-bottom:9px; min-width:0; }
.sr-f > label { font-size:13px; color:var(--muted,#9ca3af); }
.sr-f .req { color:#f87171; margin-left:3px; }
.sr-inline { display:flex; gap:8px; align-items:center; min-width:0; }
.sr-inline > :first-child { flex:1; min-width:0; }
.sr-2 { display:grid; grid-template-columns:1fr 1fr; gap:0 22px; }
.sr-2.tight .sr-f { grid-template-columns:110px 1fr; }
.sr-3 { display:grid; grid-template-columns:140px 1fr 90px 1fr; gap:8px; align-items:center; margin-bottom:9px; }
.sr-3 > label { font-size:13px; color:var(--muted,#9ca3af); }
.sr-check { display:flex; align-items:center; gap:6px; font-size:13px; color:var(--muted,#9ca3af); white-space:nowrap; }
.sr-input, .sr-select { width:100%; box-sizing:border-box; background:var(--input,#0b1220); color:inherit;
  border:1px solid var(--border,#273244); border-radius:8px; padding:7px 10px; font-size:13px; outline:none; }
.sr-input:focus, .sr-select:focus { border-color:var(--accent,#6366f1); box-shadow:0 0 0 2px rgba(99,102,241,.25); }
.sr-input:disabled, .sr-select:disabled, .sr-input[readonly] { opacity:.6; cursor:not-allowed; }
.sr-group { border:1px solid var(--border,#273244); border-radius:10px; padding:10px 12px 2px; margin-bottom:10px; }
.sr-group > legend { font-size:12px; color:var(--muted,#9ca3af); padding:0 6px; }
.sr-mini { width:34px; height:34px; border-radius:8px; border:1px solid var(--border,#273244);
  background:var(--accent,#6366f1); color:#fff; cursor:pointer; font-weight:700; }
.sr-mini:disabled { opacity:.5; cursor:not-allowed; }
.sr-actions { display:flex; flex-direction:column; gap:10px; width:150px; position:sticky; top:20px; }
.sr-btn { padding:9px 12px; border-radius:9px; border:1px solid var(--border,#273244); cursor:pointer;
  background:var(--card,#111827); color:inherit; font-size:13px; font-weight:500; }
.sr-btn:hover:not(:disabled) { border-color:var(--accent,#6366f1); }
.sr-btn.primary { background:var(--accent,#6366f1); border-color:var(--accent,#6366f1); color:#fff; }
.sr-btn:disabled { opacity:.45; cursor:not-allowed; }
.sr-notice { padding:9px 12px; border-radius:9px; font-size:13px; margin-bottom:12px; display:flex;
  justify-content:space-between; gap:10px; }
.sr-notice.success { background:rgba(34,197,94,.12); border:1px solid rgba(34,197,94,.4); color:#86efac; }
.sr-notice.error { background:rgba(239,68,68,.12); border:1px solid rgba(239,68,68,.4); color:#fca5a5; }
.sr-notice button { background:none; border:none; color:inherit; cursor:pointer; }
.sr-modal-bg { position:fixed; inset:0; background:rgba(0,0,0,.6); display:grid; place-items:center; z-index:50; }
.sr-modal { background:var(--card,#111827); border:1px solid var(--border,#273244); border-radius:12px;
  padding:18px; width:340px; display:flex; flex-direction:column; gap:12px; }
.sr-modal h3 { margin:0; font-size:15px; }
.sr-modal .row { display:flex; gap:8px; justify-content:flex-end; }
@media (max-width: 900px) {
  .sr-page { flex-direction:column; }
  .sr-actions { width:100%; flex-direction:row; flex-wrap:wrap; position:static; }
  .sr-2 { grid-template-columns:1fr; }
  .sr-3 { grid-template-columns:1fr 1fr; }
}
`;

const TYPES = ["Select", "General", "Reference", "Text Book"];
const BINDINGS = ["Select", "Hard Bound", "Paper Back", "Spiral"]; // adjust to your legacy list

const today = () => new Date().toISOString().slice(0, 10);

const initialForm = {
  collegeName: "Select",
  dateEntry: today(),
  accessionNo: "",
  title: "",
  titleCase: false,
  firstForename: "",
  firstSurname: "",
  secondForename: "",
  secondSurname: "",
  thirdForename: "",
  thirdSurname: "",
  andOthers: false,
  publisher: "Select",
  source: "Select",
  edition: "",
  year: "",
  quantity: "1",
  pages: "",
  volume: "",
  price: "0",
  discount: "0",
  billNo: "",
  billDate: today(),
  classNo: "",
  bookNo: "",
  type: "Select",
  category: "Select",
  isbn: "",
  subtitle: "",
  place: "",
  size: "",
  subject2: "",
  subject1: "",
  remarks: "",
  series: "",
  binding: "Select",
  location: "",
  attachment: "",
};
type Form = typeof initialForm;

const toProper = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const onlyDigits = (s: string) => s.replace(/\D/g, "");
const onlyDecimal = (s: string) => s.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
const isoDate = (v: unknown) => {
  const d = v ? new Date(v as string) : null;
  return d && !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : today();
};

function recordToForm(r: Record<string, any>, college: string): Form {
  const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  return {
    ...initialForm,
    collegeName: college,
    dateEntry: isoDate(r.DateEntry),
    accessionNo: s(r.AccessionNo),
    title: s(r.Title),
    firstForename: s(r.FirstAuthorForeName),
    firstSurname: s(r.FirstAuthorSirName),
    secondForename: s(r.SecondAuthorForeName),
    secondSurname: s(r.SecondAuthorSirName),
    thirdForename: s(r.ThirdAuthorForeName),
    thirdSurname: s(r.ThirdAuthorSirName),
    andOthers: String(r.MoreThanThreeAuthors).toLowerCase() === "true",
    publisher: s(r.Publisher) || "Select",
    source: s(r.Source) || "Select",
    edition: s(r.Edition),
    year: s(r.Year),
    quantity: "1",
    pages: s(r.Pages),
    volume: s(r.Volume),
    price: s(r.Price) || "0",
    discount: s(r.Discount) || "0",
    billNo: s(r.BillNo),
    billDate: isoDate(r.BillDate),
    classNo: s(r.ClassNo),
    bookNo: s(r.BookNo),
    type: s(r.Type) || "Select",
    category: s(r.Category) || "Select",
    isbn: s(r.ISBN),
    subtitle: s(r.SubTitle),
    place: s(r.Place),
    size: s(r.BookSize),
    subject2: s(r.Subject2),
    subject1: s(r.Subject1),
    remarks: s(r.Remarks),
    series: s(r.Series),
    binding: s(r.BindingBook) || "Select",
    location: s(r.Location),
    attachment: s(r.Attachment),
  };
}

function F({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div className="sr-f">
      <label>
        {label}
        {req && <span className="req">*</span>}
      </label>
      {children}
    </div>
  );
}

function SuggestInput({
  college,
  field,
  value,
  onChange,
  disabled,
}: {
  college: string;
  field: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [opts, setOpts] = useState<string[]>([]);
  const id = `dl-${field}`;

  useEffect(() => {
    if (!college || college === "Select" || !value.trim()) {
      setOpts([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get("/stock/suggest", {
          params: { college, field, q: value.trim() },
        });
        setOpts(data.items || []);
      } catch {
        setOpts([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [college, field, value]);

  return (
    <>
      <input
        className="sr-input"
        list={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id={id}>
        {opts.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </>
  );
}

export default function AddStockRegisterPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { colleges, publishers, sources, categories, nextAccession, loaded, saving, notice } =
    useAppSelector((s) => s.stock);

  const [form, setForm] = useState<Form>(initialForm);
  const [editing, setEditing] = useState(false); // record loaded via Accession No. + Enter
  const [justAdded, setJustAdded] = useState(false); // Add disabled until Add New (legacy behaviour)
  const [modal, setModal] = useState<null | "publisher" | "source" | "category">(null);
  const [modalValue, setModalValue] = useState("");

  const hasCollege = form.collegeName !== "Select";

  useEffect(() => {
    dispatch(fetchColleges());
    return () => {
      dispatch(clearNotice());
      dispatch(clearLoaded());
      dispatch(clearLookups());
    };
  }, [dispatch]);

  // next accession number arrives from the server
  useEffect(() => {
    if (nextAccession !== null && !editing) {
      setForm((f) => ({ ...f, accessionNo: String(nextAccession) }));
    }
  }, [nextAccession, editing]);

  // record loaded by accession no.
  useEffect(() => {
    if (loaded) {
      setForm(recordToForm(loaded, form.collegeName));
      setEditing(true);
      setJustAdded(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const set =
    <K extends keyof Form>(k: K, transform?: (v: string) => string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: transform ? transform(e.target.value) : e.target.value }));

  const setVal = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  // derived: author + net price
  const author = useMemo(() => {
    const first = `${form.firstSurname} ${form.firstForename}`.trim();
    if (form.andOthers) return first ? `${first} and others` : "";
    const parts = [first];
    if (form.secondSurname.trim() || form.secondForename.trim())
      parts.push(`${form.secondSurname} ${form.secondForename}`.trim());
    if (form.thirdSurname.trim() || form.thirdForename.trim())
      parts.push(`${form.thirdSurname} ${form.thirdForename}`.trim());
    return parts.filter(Boolean).join(", ");
  }, [form]);

  const netPrice = useMemo(() => {
    const p = parseFloat(form.price) || 0;
    const d = parseFloat(form.discount) || 0;
    return (p - p * (d / 100)).toFixed(2);
  }, [form.price, form.discount]);

  const onCollegeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const college = e.target.value;
    setForm({ ...initialForm, collegeName: college });
    setEditing(false);
    setJustAdded(false);
    dispatch(clearLoaded());
    if (college !== "Select") {
      dispatch(fetchLookups(college));
      dispatch(fetchNextAccession(college));
    } else {
      dispatch(clearLookups());
    }
  };

  const onTitleCase = (checked: boolean) =>
    setForm((f) => ({ ...f, titleCase: checked, title: checked ? toProper(f.title.trim()) : f.title }));

  const onAccessionKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    if (!hasCollege) return notify("Select College Name");
    if (!form.accessionNo) return notify("Enter the Accession No");
    dispatch(loadByAccession({ college: form.collegeName, accessionNo: form.accessionNo }));
  };

  const notify = (text: string) => {
    // reuse the slice's notice area for client-side validation messages
    dispatch({ type: "stock/addMaster/rejected", payload: text, meta: { requestStatus: "rejected" } });
  };

  const validate = (): string | null => {
    if (!hasCollege) return "Select College Name";
    if (!form.accessionNo) return "Invalid Accession No.";
    if (!form.title.trim()) return "Enter Title";
    if (form.publisher === "Select") return "Select Publisher";
    if (form.source === "Select") return "Select Source";
    if (!form.edition.trim()) return "Enter Edition";
    if (!form.quantity) return "Enter Quantity";
    if (!form.price) return "Enter Price";
    if (form.type === "Select") return "Select Type";
    if (form.category === "Select") return "Select Category";
    return null;
  };

  const payload = () => ({
    ...form,
    author,
    binding: form.binding === "Select" ? "" : form.binding,
  });

  const handleAdd = async () => {
    const err = validate();
    if (err) return notify(err);
    const res = await dispatch(addBooks(payload()));
    if (addBooks.fulfilled.match(res)) setJustAdded(true);
  };

  const handleUpdate = async () => {
    const err = validate();
    if (err) return notify(err);
    await dispatch(updateBook(payload()));
  };

  const handleWriteOff = () => {
    if (!hasCollege) return notify("Select College Name");
    if (!form.accessionNo) return notify("Invalid Accession No.");
    if (!form.title.trim()) return notify("Enter Title");
    dispatch(
      addWriteOff({
        collegeName: form.collegeName,
        accessionNo: form.accessionNo,
        title: form.title,
      })
    );
  };

  const handleAddNew = () => {
    const college = form.collegeName;
    setForm({ ...initialForm, collegeName: college });
    setEditing(false);
    setJustAdded(false);
    dispatch(clearLoaded());
    dispatch(clearNotice());
    if (college !== "Select") dispatch(fetchNextAccession(college));
  };

  const saveMaster = async () => {
    if (!modal) return;
    const res = await dispatch(
      addMaster({ type: modal, value: modalValue, collegeName: form.collegeName })
    );
    if (addMaster.fulfilled.match(res)) {
      dispatch(fetchLookups(form.collegeName));
      setModal(null);
      setModalValue("");
    }
  };

  const openModal = (t: "publisher" | "source" | "category") => {
    if (!hasCollege) return notify("Select College Name");
    setModalValue("");
    setModal(t);
  };

  return (
    <div className="sr-page">
      <style>{css}</style>

      <div className="sr-card">
        <h2 className="sr-title">Add to Stock Register</h2>

        {notice && (
          <div className={`sr-notice ${notice.type}`}>
            <span>{notice.text}</span>
            <button onClick={() => dispatch(clearNotice())}>✕</button>
          </div>
        )}

        <F label="College Name" req>
          <select className="sr-select" value={form.collegeName} onChange={onCollegeChange}>
            <option>Select</option>
            {colleges.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </F>

        <div className="sr-2">
          <F label="Date">
            <input className="sr-input" type="date" value={form.dateEntry} onChange={set("dateEntry")} />
          </F>
          <F label="Accession No." req>
            <input
              className="sr-input"
              value={form.accessionNo}
              onChange={set("accessionNo", onlyDigits)}
              onKeyDown={onAccessionKey}
              disabled={!hasCollege}
              title="Press Enter to load an existing record"
            />
          </F>
        </div>

        <div className="sr-inline" style={{ marginBottom: 9 }}>
          <div style={{ flex: 1 }}>
            <F label="Title">
              <SuggestInput
                college={form.collegeName}
                field="title"
                value={form.title}
                onChange={(v) => setVal("title", v)}
                disabled={!hasCollege}
              />
            </F>
          </div>
          <label className="sr-check" style={{ marginBottom: 9 }}>
            <input type="checkbox" checked={form.titleCase} onChange={(e) => onTitleCase(e.target.checked)} />
            Title Case
          </label>
        </div>

        <div className="sr-3">
          <label>First Author Forename</label>
          <SuggestInput college={form.collegeName} field="firstForename" value={form.firstForename} onChange={(v) => setVal("firstForename", v)} disabled={!hasCollege} />
          <label style={{ textAlign: "right" }}>Surname</label>
          <div className="sr-inline">
            <SuggestInput college={form.collegeName} field="firstSurname" value={form.firstSurname} onChange={(v) => setVal("firstSurname", v)} disabled={!hasCollege} />
            <label className="sr-check">
              <input
                type="checkbox"
                checked={form.andOthers}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    andOthers: e.target.checked,
                    ...(e.target.checked
                      ? { secondForename: "", secondSurname: "", thirdForename: "", thirdSurname: "" }
                      : {}),
                  }))
                }
              />
              And Other
            </label>
          </div>
        </div>

        <div className="sr-3">
          <label>Second Author Forename</label>
          <SuggestInput college={form.collegeName} field="secondForename" value={form.secondForename} onChange={(v) => setVal("secondForename", v)} disabled={!hasCollege || form.andOthers} />
          <label style={{ textAlign: "right" }}>Surname</label>
          <SuggestInput college={form.collegeName} field="secondSurname" value={form.secondSurname} onChange={(v) => setVal("secondSurname", v)} disabled={!hasCollege || form.andOthers} />
        </div>

        <div className="sr-3">
          <label>Third Author Forename</label>
          <SuggestInput college={form.collegeName} field="thirdForename" value={form.thirdForename} onChange={(v) => setVal("thirdForename", v)} disabled={!hasCollege || form.andOthers} />
          <label style={{ textAlign: "right" }}>Surname</label>
          <SuggestInput college={form.collegeName} field="thirdSurname" value={form.thirdSurname} onChange={(v) => setVal("thirdSurname", v)} disabled={!hasCollege || form.andOthers} />
        </div>

        <F label="Author">
          <input className="sr-input" value={author} readOnly />
        </F>

        <F label="Publisher">
          <div className="sr-inline">
            <select className="sr-select" value={form.publisher} onChange={set("publisher")} disabled={!hasCollege}>
              <option>Select</option>
              {publishers.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <button className="sr-mini" type="button" onClick={() => openModal("publisher")} title="Add publisher">
              …
            </button>
          </div>
        </F>

        <F label="Source">
          <div className="sr-inline">
            <select className="sr-select" value={form.source} onChange={set("source")} disabled={!hasCollege}>
              <option>Select</option>
              {sources.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <button className="sr-mini" type="button" onClick={() => openModal("source")} title="Add source">
              …
            </button>
          </div>
        </F>

        <div className="sr-2">
          {/* left column */}
          <div>
            <F label="Edition">
              <input className="sr-input" value={form.edition} onChange={set("edition")} />
            </F>
            <F label="Quantity">
              <input className="sr-input" value={form.quantity} onChange={set("quantity", onlyDigits)} disabled={editing} />
            </F>
            <F label="Volume">
              <input className="sr-input" value={form.volume} onChange={set("volume")} />
            </F>
            <F label="Price Per Unit">
              <input className="sr-input" value={form.price} onChange={set("price", onlyDecimal)} />
            </F>
            <F label="Discount (%)">
              <input className="sr-input" value={form.discount} onChange={set("discount", onlyDecimal)} />
            </F>
            <F label="Net Price">
              <input className="sr-input" value={netPrice} readOnly />
            </F>
            <F label="Type">
              <select className="sr-select" value={form.type} onChange={set("type")} disabled={!hasCollege}>
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </F>
            <F label="Category">
              <div className="sr-inline">
                <select className="sr-select" value={form.category} onChange={set("category")} disabled={!hasCollege}>
                  <option>Select</option>
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <button className="sr-mini" type="button" onClick={() => openModal("category")} title="Add category">
                  …
                </button>
              </div>
            </F>
            <F label="Subtitle">
              <input className="sr-input" value={form.subtitle} onChange={set("subtitle")} />
            </F>
            <F label="Size">
              <input className="sr-input" value={form.size} onChange={set("size")} />
            </F>
            <F label="Subject1 Heading">
              <input className="sr-input" value={form.subject1} onChange={set("subject1")} />
            </F>
            <F label="Series">
              <input className="sr-input" value={form.series} onChange={set("series")} />
            </F>
            <F label="Location">
              <input className="sr-input" value={form.location} onChange={set("location")} />
            </F>
          </div>

          {/* right column */}
          <div className="tight">
            <F label="Year of Publishing">
              <input className="sr-input" value={form.year} onChange={set("year", onlyDigits)} maxLength={4} />
            </F>
            <F label="Pages">
              <input className="sr-input" value={form.pages} onChange={set("pages")} />
            </F>

            <fieldset className="sr-group">
              <legend>Bill</legend>
              <F label="Bill No.">
                <input className="sr-input" value={form.billNo} onChange={set("billNo")} />
              </F>
              <F label="Date">
                <input className="sr-input" type="date" value={form.billDate} onChange={set("billDate")} />
              </F>
            </fieldset>

            <fieldset className="sr-group">
              <legend>Call No.</legend>
              <F label="Class No.">
                <input className="sr-input" value={form.classNo} onChange={set("classNo")} />
              </F>
              <F label="Book No.">
                <input className="sr-input" value={form.bookNo} onChange={set("bookNo")} />
              </F>
            </fieldset>

            <F label="ISBN">
              <input className="sr-input" value={form.isbn} onChange={set("isbn")} />
            </F>
            <F label="Place of Publication">
              <SuggestInput college={form.collegeName} field="place" value={form.place} onChange={(v) => setVal("place", v)} disabled={!hasCollege} />
            </F>
            <F label="Subject2 Heading">
              <input
                className="sr-input"
                value={form.subject2}
                onChange={set("subject2")}
                onBlur={() => setVal("subject2", toProper(form.subject2))}
              />
            </F>
            <F label="Remarks">
              <input className="sr-input" value={form.remarks} onChange={set("remarks")} />
            </F>
            <F label="Binding">
              <select className="sr-select" value={form.binding} onChange={set("binding")}>
                {BINDINGS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </F>
            <F label="Attachment">
              <input className="sr-input" value={form.attachment} onChange={set("attachment")} />
            </F>
          </div>
        </div>
      </div>

      <div className="sr-actions">
        <button className="sr-btn" onClick={handleWriteOff} disabled={saving || !hasCollege}>
          Add in Write off
        </button>
        <button className="sr-btn" onClick={handleUpdate} disabled={saving || !editing}>
          Update
        </button>
        <button className="sr-btn primary" onClick={handleAdd} disabled={saving || justAdded}>
          {saving ? "Saving..." : "Add"}
        </button>
        <button className="sr-btn" onClick={handleAddNew} disabled={saving}>
          Add New
        </button>
        <button className="sr-btn" onClick={() => router.push("/dashboard")}>
          Close
        </button>
      </div>

      {modal && (
        <div className="sr-modal-bg" onClick={() => setModal(null)}>
          <div className="sr-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add {modal}</h3>
            <input
              className="sr-input"
              autoFocus
              value={modalValue}
              onChange={(e) => setModalValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveMaster()}
              placeholder={`New ${modal} name`}
            />
            <div className="row">
              <button className="sr-btn" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="sr-btn primary" onClick={saveMaster} disabled={saving}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}