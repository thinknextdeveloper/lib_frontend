"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearScan, fetchGateEntries, scanAccession } from "@/store/slices/gateSlice";

const css = `
.gate-page {
  --g-card:#111827; --g-card2:#1b2538; --g-input:#0b1220; --g-border:#2a3650;
  --g-text:#e5e7eb; --g-muted:#9ca3af; --g-accent:#5b9cf5;
  width:100%; max-width:1000px; margin:0 auto; padding:24px 20px 40px;
  background:transparent; color:var(--g-text); text-align:left; box-sizing:border-box;
  font-size:13px;
}
.gate-page *, .gate-page *::before, .gate-page *::after { box-sizing:border-box; }

/* top: scan card + photo */
.gate-top { display:flex; gap:20px; align-items:flex-start; margin-bottom:16px; }
.gate-scan { flex:1; min-width:0; background:var(--g-card); border:1px solid var(--g-border);
  border-radius:14px; padding:18px 20px; }
.gate-status { min-height:36px; display:flex; align-items:center; justify-content:center; border-radius:9px;
  font-size:14px; font-weight:600; margin-bottom:14px; background:rgba(148,163,184,.1);
  border:1px solid var(--g-border); color:var(--g-muted); text-align:center; }
.gate-status.issued { background:rgba(34,197,94,.14); border-color:rgba(34,197,94,.45); color:#86efac; }
.gate-status.notissued { background:rgba(239,68,68,.14); border-color:rgba(239,68,68,.45); color:#fca5a5; }
.gate-row { display:flex; flex-direction:row; flex-wrap:wrap; gap:10px; align-items:center; }
.gate-row .gate-label { width:100px; color:var(--g-muted); }
.gate-row .gate-input { flex:1 1 200px; max-width:300px; }
.gate-msg { margin-top:12px; min-height:18px; font-size:13px; }
.gate-msg.success { color:#86efac; }
.gate-msg.error { color:#fca5a5; }
.gate-photo { width:112px; height:138px; flex-shrink:0; border-radius:12px; border:1px solid var(--g-border);
  background:var(--g-input); display:flex; align-items:center; justify-content:center; overflow:hidden; }
.gate-photo img { width:100%; height:100%; object-fit:cover; display:block; }

/* book + issue groups */
.gate-groups { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
.gate-group { margin:0; min-width:0; background:var(--g-card); border:1px solid var(--g-border);
  border-radius:12px; padding:14px 16px 6px; }
.gate-group > legend { padding:0 8px; font-size:12px; font-weight:600; color:var(--g-accent); }
.gate-f { display:grid; grid-template-columns:110px minmax(0,1fr); gap:10px; align-items:center; margin-bottom:10px; }
.gate-f .gate-label { color:var(--g-muted); }

/* shared controls */
.gate-label { display:block; margin:0; font-weight:400; text-align:left; }
.gate-page .gate-input { display:block; width:100%; height:34px; margin:0; padding:6px 10px;
  background:var(--g-input); color:var(--g-text); border:1px solid var(--g-border); border-radius:8px;
  font:inherit; font-size:13px; outline:none; box-shadow:none; }
.gate-page .gate-input:focus { border-color:var(--g-accent); box-shadow:0 0 0 2px rgba(91,156,245,.25); }
.gate-page .gate-input[readonly] { cursor:default; }
.gate-page input[type="date"].gate-input { color-scheme:dark; }
.gate-page .gate-btn { height:34px; padding:0 16px; border-radius:9px; cursor:pointer; font:inherit;
  font-size:13px; font-weight:500; color:var(--g-text); background:var(--g-card2);
  border:1px solid var(--g-border); white-space:nowrap; }
.gate-page .gate-btn:hover:not(:disabled) { border-color:var(--g-accent); }
.gate-page .gate-btn.primary { background:var(--g-accent); border-color:var(--g-accent); color:#fff; }
.gate-page .gate-btn:disabled { opacity:.55; cursor:not-allowed; }

/* search */
.gate-search { margin:0 0 16px; padding:14px 16px; background:var(--g-card); border:1px solid var(--g-border);
  border-radius:12px; display:flex; flex-direction:row; flex-wrap:wrap; gap:14px 16px; align-items:center; }
.gate-search > legend { padding:0 8px; font-size:12px; font-weight:600; color:var(--g-accent); }
.gate-field { display:flex; flex-direction:row; align-items:center; gap:8px; color:var(--g-muted); }
.gate-field .gate-input { width:150px; }

/* table */
.gate-tablewrap { background:var(--g-card); border:1px solid var(--g-border); border-radius:12px;
  max-height:340px; overflow:auto; }
.gate-table { width:100%; border-collapse:collapse; font-size:13px; }
.gate-table th { position:sticky; top:0; background:var(--g-card2); text-align:left; padding:9px 12px;
  font-weight:600; border-bottom:1px solid var(--g-border); color:var(--g-text); }
.gate-table td { padding:8px 12px; border-bottom:1px solid rgba(42,54,80,.6); color:var(--g-text); text-align:left; }
.gate-table tr:hover td { background:rgba(91,156,245,.07); }
.gate-empty { padding:28px; text-align:center; color:var(--g-muted); }

@media (max-width: 800px) {
  .gate-top { flex-direction:column-reverse; align-items:stretch; }
  .gate-photo { align-self:center; }
  .gate-groups { grid-template-columns:1fr; }
  .gate-f { grid-template-columns:1fr; gap:4px; }
}
`;

const todayStr = () => new Date().toLocaleDateString("en-CA"); // yyyy-mm-dd

// short beep for "Not Issued" (replaces legacy Beep.wav)
function beep() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = 600;
    osc.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 250);
  } catch {
    /* audio not available */
  }
}

export default function LibGateAdminPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { scanning, scan, entries, loadingEntries, entriesError } = useAppSelector((s) => s.gate);

  const inputRef = useRef<HTMLInputElement>(null);
  const [accession, setAccession] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [idSearch, setIdSearch] = useState("");
  const [accSearch, setAccSearch] = useState("");

  useEffect(() => {
    dispatch(fetchGateEntries({})); // today's entries
    inputRef.current?.focus();
    return () => {
      dispatch(clearScan());
    };
  }, [dispatch]);

  const book = scan?.found ? scan.book : null;
  const issue = scan?.found ? scan.issue : null;

  const status =
    scan?.found && scan.issue ? "issued" : scan?.found && !scan.issue ? "notissued" : "";

  const clearAll = () => {
    dispatch(clearScan());
    setMsg(null);
  };

  const doScan = async () => {
    const no = accession.trim();
    if (!no) {
      setMsg({ type: "error", text: "Enter Accession No." });
      return;
    }
    setMsg(null);

    const res = await dispatch(scanAccession(no));
    if (scanAccession.fulfilled.match(res)) {
      const r = res.payload;
      if (!r.found) {
        setMsg({ type: "error", text: "No Record Found" });
        return;
      }
      if (!r.issue) {
        beep();
      } else {
        setMsg({ type: "success", text: "Saved Successfully" });
        dispatch(fetchGateEntries({})); // legacy refreshes today's list after saving
      }
      setAccession("");
      inputRef.current?.focus();
    } else {
      setMsg({ type: "error", text: (res.payload as string) || "Request failed" });
    }
  };

  const onReset = () => {
    setAccession("");
    clearAll();
    inputRef.current?.focus();
  };

  const onSearch = () => {
    dispatch(fetchGateEntries({ from, to, idNo: idSearch, accessionNo: accSearch }));
  };

  const onlyDigits = (s: string) => s.replace(/\D/g, "");

  return (
    <div className="gate-page">
      <style>{css}</style>

      <div className="gate-top">
        <div className="gate-scan">
          <div className={`gate-status ${status}`}>
            {status === "issued"
              ? "Book Status : 'Issued'"
              : status === "notissued"
              ? "Book Status : 'Not Issued'"
              : "Scan or enter an Accession No."}
          </div>

          <div className="gate-row">
            <span className="gate-label">Accession No.</span>
            <input
              ref={inputRef}
              className="gate-input"
              value={accession}
              onChange={(e) => setAccession(onlyDigits(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter") doScan();
                if (e.key === "Backspace") clearAll(); // legacy clears the detail on backspace
              }}
            />
            <button className="gate-btn primary" onClick={doScan} disabled={scanning}>
              {scanning ? "..." : "Go"}
            </button>
            <button className="gate-btn" onClick={onReset}>
              Reset
            </button>
            <button className="gate-btn" onClick={() => router.push("/dashboard")}>
              Close
            </button>
          </div>

          <div className={`gate-msg ${msg?.type ?? ""}`}>{msg?.text}</div>
        </div>

        <div className="gate-photo">
          {scan?.image ? (
            <img src={scan.image} alt="ID photo" />
          ) : (
            <svg width="64" height="80" viewBox="0 0 64 80" fill="none" aria-hidden="true">
              <circle cx="32" cy="26" r="14" fill="#2a3a5c" />
              <path d="M4 80c0-18 12-28 28-28s28 10 28 28H4z" fill="#2a3a5c" />
            </svg>
          )}
        </div>
      </div>

      <div className="gate-groups">
        <fieldset className="gate-group">
          <legend>Book Detail</legend>
          <div className="gate-f">
            <span className="gate-label">College Name</span>
            <input className="gate-input" readOnly value={book?.CollegeName ?? ""} />
          </div>
          <div className="gate-f">
            <span className="gate-label">Accession No.</span>
            <input className="gate-input" readOnly value={book ? String(book.AccessionNo) : ""} />
          </div>
          <div className="gate-f">
            <span className="gate-label">Title</span>
            <input className="gate-input" readOnly value={book?.Title ?? ""} />
          </div>
          <div className="gate-f">
            <span className="gate-label">Author</span>
            <input className="gate-input" readOnly value={book?.Author ?? ""} />
          </div>
          <div className="gate-f">
            <span className="gate-label">Category</span>
            <input className="gate-input" readOnly value={book?.Category ?? ""} />
          </div>
          <div className="gate-f">
            <span className="gate-label">Location</span>
            <input className="gate-input" readOnly value={book?.Location ?? ""} />
          </div>
        </fieldset>

        <fieldset className="gate-group">
          <legend>Book Issue Detail</legend>
          <div className="gate-f">
            <span className="gate-label">ID No.</span>
            <input className="gate-input" readOnly value={issue ? String(issue.IDNo) : ""} />
          </div>
          <div className="gate-f">
            <span className="gate-label">Name</span>
            <input className="gate-input" readOnly value={issue?.WhomIssued ?? ""} />
          </div>
          <div className="gate-f">
            <span className="gate-label">Course</span>
            <input className="gate-input" readOnly value={issue?.Discipline ?? ""} />
          </div>
          <div className="gate-f">
            <span className="gate-label">Date of Issue</span>
            <input className="gate-input" readOnly value={issue?.IssueDate ?? ""} />
          </div>
          <div className="gate-f">
            <span className="gate-label">Last Return Date</span>
            <input className="gate-input" readOnly value={issue?.LastReturnDate ?? ""} />
          </div>
        </fieldset>
      </div>

      <fieldset className="gate-search">
        <legend>Search</legend>
        <div className="gate-field">
          <span>From</span>
          <input className="gate-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="gate-field">
          <span>To</span>
          <input className="gate-input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="gate-field">
          <span>ID No.</span>
          <input
            className="gate-input"
            value={idSearch}
            onChange={(e) => setIdSearch(onlyDigits(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
        </div>
        <div className="gate-field">
          <span>Accession No.</span>
          <input
            className="gate-input"
            value={accSearch}
            onChange={(e) => setAccSearch(onlyDigits(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
        </div>
        <button className="gate-btn primary" onClick={onSearch} disabled={loadingEntries}>
          {loadingEntries ? "Searching..." : "Search"}
        </button>
      </fieldset>

      <div className="gate-tablewrap">
        {entriesError ? (
          <div className="gate-empty" style={{ color: "#fca5a5" }}>
            {entriesError}
          </div>
        ) : entries.length === 0 ? (
          <div className="gate-empty">No gate entries found</div>
        ) : (
          <table className="gate-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>ID No.</th>
                <th>Name</th>
                <th>Accession No.</th>
                <th>Purpose</th>
                <th>Gate Entry</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((r, i) => (
                <tr key={i}>
                  <td>{r.DateEntry}</td>
                  <td>{r.Time}</td>
                  <td>{String(r.IDNo)}</td>
                  <td>{r.PersonName}</td>
                  <td>{String(r.AccessionNo)}</td>
                  <td>{r.Purpose}</td>
                  <td>{r.GateEntry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}