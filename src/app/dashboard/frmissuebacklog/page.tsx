"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  IssuedRow,
  PersonType,
  clearBook,
  clearMessage,
  clearPerson,
  fetchIssueInit,
  issueBook,
  lookupBook,
  lookupPerson,
  resetIssue,
  returnBook,
  setMessage,
} from "@/store/slices/issueSlice";

// change if your Renew page lives somewhere else
const RENEW_ROUTE = "/dashboard/frmRenewBook";

const pad = (n: number) => String(n).padStart(2, "0");
const addDaysISO = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const fmtToday = () => addDaysISO(0).split("-").reverse().join("/");

const labelCls = "text-xs text-[#9db2d6]";
const legendCls = "px-2 text-xs font-medium text-[#5ba4ff]";
const panelCls = "rounded-xl border border-[#1e2d5a] bg-[#0d1731]";
const btnCls =
  "h-8 w-full cursor-pointer rounded-lg bg-[#5ba4ff] text-xs font-medium text-[#08111f] transition hover:bg-[#7db7ff] disabled:cursor-not-allowed disabled:opacity-40";
const btnGhostCls =
  "h-8 w-full cursor-pointer rounded-lg border border-[#2a3d6e] bg-transparent text-xs font-medium text-[#cfe0ff] transition hover:bg-[#1a2a52] disabled:cursor-not-allowed disabled:opacity-40";
const inputCls =
  "h-8 rounded-lg border border-[#2a3d6e] bg-[#0b1530] px-2.5 text-xs text-[#e6eeff] outline-none transition focus:border-[#5ba4ff] focus:ring-1 focus:ring-[#5ba4ff]/40 [color-scheme:dark]";
const roCls =
  "h-8 flex-1 rounded-lg border border-[#1e2d5a] bg-[#0a1226] px-2.5 text-xs text-[#cfe0ff] outline-none";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <label className={`w-[104px] shrink-0 ${labelCls}`}>{label}</label>
      <input readOnly value={value} className={roCls} />
    </div>
  );
}

export default function IssueBookPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { studentDays, staffDays, person, book, issued, totalFine, loading, message } =
    useAppSelector((s) => s.issue);

  const [type, setType] = useState<PersonType>("Student");
  const [idNo, setIdNo] = useState("");
  const [accessionNo, setAccessionNo] = useState("");
  const [lastReturn, setLastReturn] = useState(addDaysISO(15));
  const [remarks, setRemarks] = useState("");
  const [signature, setSignature] = useState("");
  const [selected, setSelected] = useState<IssuedRow | null>(null);

  const lastPerson = useRef("");
  const lastBook = useRef("");

  useEffect(() => {
    dispatch(resetIssue());
    dispatch(fetchIssueInit());
  }, [dispatch]);

  // default last return date = today + issue days for the chosen category
  useEffect(() => {
    setLastReturn(addDaysISO(type === "Staff" ? staffDays : studentDays));
  }, [type, studentDays, staffDays]);

  const isStaff = type === "Staff";

  const onIdChange = (v: string) => {
    const digits = v.replace(/\D/g, "");
    setIdNo(digits);
    if (digits.length === 6) setType("Staff");
    if (digits.length === 10) setType("Student");
    setAccessionNo("");
    setSelected(null);
    lastPerson.current = "";
    lastBook.current = "";
    dispatch(clearPerson());
  };

  const lookupId = () => {
    if (!idNo) return;
    const t: PersonType = idNo.length === 6 ? "Staff" : idNo.length === 10 ? "Student" : type;
    const key = `${t}|${idNo}`;
    if (lastPerson.current === key && person) return; // already loaded (Enter then blur)
    lastPerson.current = key;
    dispatch(lookupPerson({ type: t, idNo })).then((r) => {
      if (lookupPerson.rejected.match(r)) lastPerson.current = "";
    });
  };

  const onAccessionChange = (v: string) => {
    setAccessionNo(v.replace(/\D/g, ""));
    lastBook.current = "";
    dispatch(clearBook());
  };

  const lookupAcc = () => {
    if (!accessionNo) return;
    if (!idNo || !person) {
      dispatch(setMessage({ text: "Enter ID No. First.", ok: false }));
      return;
    }
    if (lastBook.current === accessionNo && book) return;
    lastBook.current = accessionNo;
    dispatch(lookupBook({ accessionNo })).then((r) => {
      if (lookupBook.rejected.match(r)) {
        lastBook.current = "";
        setAccessionNo("");
      }
    });
  };

  const onIssue = async () => {
    if (!idNo) return void dispatch(setMessage({ text: "Enter ID No.", ok: false }));
    if (!person) return void dispatch(setMessage({ text: "Invalid ID No.", ok: false }));
    if (!accessionNo) return void dispatch(setMessage({ text: "Enter Accession No.", ok: false }));
    if (!book) return void dispatch(setMessage({ text: "Invalid Accession No.", ok: false }));
    if (!signature.trim()) return void dispatch(setMessage({ text: "Enter Signature", ok: false }));

    const body = { type: person.type, idNo, accessionNo, lastReturnDate: lastReturn, remarks, signature };
    let r = await dispatch(issueBook(body));

    // over the issue limit -> ask, then resend with force
    if (issueBook.rejected.match(r) && r.payload?.code === "LIMIT_REACHED") {
      if (window.confirm(r.payload.message)) r = await dispatch(issueBook({ ...body, force: true }));
    }

    if (issueBook.fulfilled.match(r)) {
      setAccessionNo("");
      setRemarks("");
      lastBook.current = "";
      dispatch(clearBook());
    }
  };

  const onReturn = async () => {
    if (!selected) {
      dispatch(setMessage({ text: "Select a book from the list to return", ok: false }));
      return;
    }
    if (!window.confirm("Do you want to return this Book?")) return;
    const r = await dispatch(
      returnBook({
        idNo: selected.idNo,
        accessionNo: selected.accessionNo,
        collegeName: selected.collegeName,
      })
    );
    if (returnBook.fulfilled.match(r)) setSelected(null);
  };

  const onReset = () => {
    dispatch(resetIssue());
    setType("Student");
    setIdNo("");
    setAccessionNo("");
    setRemarks("");
    setSignature("");
    setSelected(null);
    setLastReturn(addDaysISO(studentDays));
    lastPerson.current = "";
    lastBook.current = "";
  };

  return (
    <div className="mx-auto w-full max-w-[1120px] rounded-2xl border border-[#1e2d5a] bg-[#101b3a] p-6 text-xs text-[#e6eeff] shadow-[0_20px_50px_rgba(0,0,0,0.35)] [color-scheme:dark]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-white">Issue Book</h2>
        {message.text && (
          <div
            className={`max-w-[420px] truncate rounded-lg border px-3 py-1 ${
              message.ok
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      <div className="flex gap-5">
        {/* left: person type + register */}
        <div className="flex w-[290px] shrink-0 flex-col gap-4">
          <fieldset className={`${panelCls} px-4 pt-1 pb-3`}>
            <legend className={legendCls}>Person Type</legend>
            <div className="flex items-center gap-6">
              {(["Student", "Staff"] as PersonType[]).map((t) => (
                <label key={t} className="flex cursor-pointer items-center gap-2 text-[#cfe0ff]">
                  <input
                    type="radio"
                    name="personType"
                    checked={type === t}
                    onChange={() => setType(t)}
                    className="accent-[#5ba4ff]"
                  />
                  {t}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={`${panelCls} flex flex-col gap-3 px-4 pt-2 pb-4`}>
            <legend className={legendCls}>{type} Issue Register</legend>

            <div className="flex items-center gap-2">
              <label className={`w-[90px] ${labelCls}`}>ID No.</label>
              <input
                value={idNo}
                inputMode="numeric"
                autoFocus
                onChange={(e) => onIdChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    lookupId();
                  }
                }}
                onBlur={lookupId}
                className={`${inputCls} w-[150px]`}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className={`w-[90px] ${labelCls}`}>Accession No.</label>
              <input
                value={accessionNo}
                inputMode="numeric"
                onFocus={() => {
                  if (!idNo) dispatch(setMessage({ text: "Enter ID No. First.", ok: false }));
                }}
                onChange={(e) => onAccessionChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    lookupAcc();
                  }
                }}
                onBlur={lookupAcc}
                className={`${inputCls} w-[150px]`}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className={`w-[90px] ${labelCls}`}>Date of Issue</label>
              <input readOnly value={fmtToday()} className={`${roCls} !flex-none w-[150px]`} />
            </div>

            <div className="flex items-center gap-2">
              <label className={`w-[90px] ${labelCls}`}>Last Return Date</label>
              <input
                type="date"
                value={lastReturn}
                min={addDaysISO(0)}
                onChange={(e) => setLastReturn(e.target.value)}
                className={`${inputCls} w-[150px]`}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className={`w-[90px] ${labelCls}`}>Remarks</label>
              <input
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className={`${inputCls} w-[150px]`}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className={`w-[90px] ${labelCls}`}>Signature</label>
              <input
                type="password"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onIssue()}
                className={`${inputCls} w-[150px]`}
              />
            </div>
          </fieldset>
        </div>

        {/* middle: detail */}
        <fieldset className={`${panelCls} min-w-0 flex-1 px-4 pt-2 pb-4`}>
          <legend className={legendCls}>Detail</legend>
          <div className="flex flex-col gap-2">
            <Field label="College Name" value={person?.collegeName ?? ""} />
            <Field label="Whom Issued" value={person?.name ?? ""} />
            <Field label={isStaff ? "Designation" : "Course"} value={person?.course ?? ""} />
            <Field label={isStaff ? "Department" : "Batch"} value={person?.batch ?? ""} />
            <Field label="Univ. Roll No." value={person?.univRollNo ?? ""} />
            <Field label="Accession No." value={book?.accessionNo ?? ""} />
            <Field label="Title" value={book?.title ?? ""} />
            <Field label="Author" value={book?.author ?? ""} />
            <Field label="Category" value={book?.category ?? ""} />
          </div>
        </fieldset>

        {/* right: photo + actions */}
        <div className="flex w-[116px] shrink-0 flex-col gap-3">
          <div className="h-[116px] w-[88px] self-center overflow-hidden rounded-lg border border-[#2a3d6e] bg-[#0a1226]">
            {person?.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={person.photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <svg viewBox="0 0 80 110" className="h-full w-full">
                <rect width="80" height="110" fill="#0a1226" />
                <circle cx="40" cy="42" r="20" fill="#2a3d6e" />
                <path d="M6 110c2-30 16-40 34-40s32 10 34 40z" fill="#1e2d5a" />
              </svg>
            )}
          </div>

          <button type="button" className={btnCls} disabled={loading} onClick={onIssue}>
            {loading ? "Please wait…" : "Issue"}
          </button>
          <button type="button" className={btnGhostCls} disabled={!selected || loading} onClick={onReturn}>
            Return Book
          </button>
          <button type="button" className={btnGhostCls} onClick={() => router.push(RENEW_ROUTE)}>
            Renew Book
          </button>
          <button type="button" className={btnGhostCls} onClick={onReset}>
            Reset
          </button>
          <button type="button" className={btnGhostCls} onClick={() => dispatch(clearMessage())}>
            Reset Message
          </button>
          <button type="button" className={btnGhostCls} onClick={() => router.back()}>
            Close
          </button>
        </div>
      </div>

      {/* issued books */}
      <div className="mt-5 flex items-center gap-8 text-[#cfe0ff]">
        <span className="font-semibold text-white">Already Book Issued: {issued.length}</span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-8 rounded-sm bg-red-500/70" />
          Book Over Due
        </span>
        <span>
          Total Fine: <span className="font-semibold text-red-300">{totalFine}</span>
        </span>
      </div>

      <div className="mt-2 h-[250px] overflow-auto rounded-xl border border-[#1e2d5a] bg-[#0a1226]">
        <table className="w-full min-w-[900px] border-collapse text-xs">
          <thead className="sticky top-0 bg-[#13224a] text-left text-[#9db2d6]">
            <tr>
              {["Issue Date", "ID No.", "Title", "Author", "Accession No.", "Return Date", "Course", "Remarks", "Days", "Fine"].map(
                (h) => (
                  <th key={h} className="px-3 py-2 font-medium">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {issued.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-[#5f7399]">
                  Enter an ID No. to see the books issued to that person.
                </td>
              </tr>
            )}
            {issued.map((r) => {
              const overdue = r.days > 0;
              const isSel = selected?.accessionNo === r.accessionNo && selected?.collegeName === r.collegeName;
              return (
                <tr
                  key={`${r.collegeName}-${r.accessionNo}`}
                  onClick={() => setSelected(isSel ? null : r)}
                  className={`cursor-pointer border-t border-[#1e2d5a] ${
                    isSel
                      ? "bg-[#5ba4ff]/25"
                      : overdue
                        ? "bg-red-500/20 hover:bg-red-500/30"
                        : "hover:bg-[#13224a]"
                  }`}
                >
                  <td className="px-3 py-1.5">{r.issueDate}</td>
                  <td className="px-3 py-1.5">{r.idNo}</td>
                  <td className="px-3 py-1.5">{r.title}</td>
                  <td className="px-3 py-1.5">{r.author}</td>
                  <td className="px-3 py-1.5">{r.accessionNo}</td>
                  <td className="px-3 py-1.5">{r.lastReturnDate}</td>
                  <td className="px-3 py-1.5">{r.course}</td>
                  <td className="px-3 py-1.5">{r.remarks}</td>
                  <td className="px-3 py-1.5">{overdue ? r.days : ""}</td>
                  <td className="px-3 py-1.5">{overdue ? r.fine : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}