"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchColleges } from "@/store/slices/stockSlice";
import { clearReport, fetchStaffIssue } from "@/store/slices/studentIssueSlice";

const css = `
.sir-page { padding:40px 20px; color:var(--text,#e5e7eb); }
.sir-top { display:flex; gap:16px; align-items:flex-start; justify-content:center; }
.sir-card { width:100%; max-width:560px; background:var(--card,#111827); border:1px solid var(--border,#273244);
  border-radius:14px; padding:20px 22px; }
.sir-card legend { font-size:13px; color:var(--accent,#6366f1); padding:0 8px; font-weight:600; }
.sir-group { border:1px solid var(--border,#273244); border-radius:12px; padding:18px 20px 8px; margin:0; }
.sir-f { display:grid; grid-template-columns:110px 1fr; align-items:center; gap:10px; margin-bottom:14px; }
.sir-f label { font-size:13px; color:var(--muted,#9ca3af); }
.sir-select { width:100%; box-sizing:border-box; background:var(--input,#0b1220); color:inherit;
  border:1px solid var(--border,#273244); border-radius:8px; padding:8px 10px; font-size:13px; outline:none; }
.sir-select:focus { border-color:var(--accent,#6366f1); box-shadow:0 0 0 2px rgba(99,102,241,.25); }
.sir-select:disabled { opacity:.55; cursor:not-allowed; }
.sir-actions { display:flex; flex-direction:column; gap:10px; width:120px; }
.sir-btn { padding:9px 12px; border-radius:9px; border:1px solid var(--border,#273244); cursor:pointer;
  background:var(--card,#111827); color:inherit; font-size:13px; font-weight:500; }
.sir-btn:hover:not(:disabled) { border-color:var(--accent,#6366f1); }
.sir-btn.primary { background:var(--accent,#6366f1); border-color:var(--accent,#6366f1); color:#fff; }
.sir-btn:disabled { opacity:.45; cursor:not-allowed; }
.sir-notice { max-width:560px; margin:16px auto 0; padding:9px 12px; border-radius:9px; font-size:13px; }
.sir-notice.error { background:rgba(239,68,68,.12); border:1px solid rgba(239,68,68,.4); color:#fca5a5; }
.sir-notice.info { background:rgba(99,102,241,.12); border:1px solid rgba(99,102,241,.4); color:#c7d2fe; }

/* ---- report (paper look, also what gets printed) ---- */
.sir-report { background:#fff; color:#111; max-width:900px; margin:28px auto 0; padding:24px 28px; border-radius:8px;
  font-family: Arial, Helvetica, sans-serif; }
.sir-report .head { text-align:center; margin-bottom:12px; }
.sir-report .head h2 { margin:0 0 4px; font-size:18px; }
.sir-report .head p { margin:0; font-size:12px; color:#444; }
.sir-report .sub { display:flex; justify-content:space-between; font-size:13px; font-weight:600; margin:10px 0 8px; }
.sir-report table { width:100%; border-collapse:collapse; font-size:12px; }
.sir-report th, .sir-report td { border:1px solid #999; padding:5px 6px; text-align:left; vertical-align:top; }
.sir-report th { background:#eee; }

@media print {
  @page { size: A4 portrait; margin: 12mm; }
  body * { visibility:hidden !important; }
  .sir-report, .sir-report * { visibility:visible !important; }
  .sir-report { position:absolute; left:0; top:0; width:100%; max-width:none; margin:0; padding:0; border-radius:0; }
  .sir-report thead { display:table-header-group; }
  .sir-report tr { page-break-inside:avoid; }
}
@media (max-width: 700px) {
  .sir-top { flex-direction:column; align-items:stretch; }
  .sir-actions { width:100%; flex-direction:row; }
  .sir-f { grid-template-columns:1fr; gap:4px; }
}
`;

const fmt = (v: string) => {
  const d = new Date(v);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB"); // dd/mm/yyyy
};

export default function FacultyIssueReportPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const colleges = useAppSelector((s) => s.stock.colleges);
  const { loading, report, error } = useAppSelector((s) => s.studentIssue);

  const [college, setCollege] = useState("Select");
  const [type, setType] = useState<"Book" | "CD">("Book");
  const [empty, setEmpty] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchColleges());
    return () => {
      dispatch(clearReport());
    };
  }, [dispatch]);

  const onCollege = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCollege(e.target.value);
    setType("Book");
    setEmpty(null);
    dispatch(clearReport());
  };

  const handlePrint = async () => {
    setEmpty(null);
    if (college === "Select") return;
    const res = await dispatch(fetchStaffIssue({ college, type }));
    if (fetchStaffIssue.fulfilled.match(res)) {
      if (res.payload.rows.length > 0) {
        setTimeout(() => window.print(), 300); // let the report render first
      } else {
        setEmpty(
          type === "CD"
            ? "No CD has been issued to any Staff Member"
            : "No book has been issued to any Staff Member"
        );
      }
    }
  };

  const hasCollege = college !== "Select";
  const showReport = report && report.rows.length > 0;

  return (
    <div className="sir-page">
      <style>{css}</style>

      <div className="sir-top">
        <div className="sir-card">
          <fieldset className="sir-group">
            <legend>Faculty Issue Report</legend>

            <div className="sir-f">
              <label>College Name</label>
              <select className="sir-select" value={college} onChange={onCollege}>
                <option>Select</option>
                {colleges.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="sir-f">
              <label>Search</label>
              <select
                className="sir-select"
                value={type}
                disabled={!hasCollege}
                onChange={(e) => {
                  setType(e.target.value as "Book" | "CD");
                  setEmpty(null);
                  dispatch(clearReport());
                }}
              >
                <option value="Book">Book</option>
                <option value="CD">CD</option>
              </select>
            </div>
          </fieldset>
        </div>

        <div className="sir-actions">
          <button className="sir-btn primary" onClick={handlePrint} disabled={!hasCollege || loading}>
            {loading ? "Loading..." : "Print"}
          </button>
          <button className="sir-btn" onClick={() => router.push("/dashboard")}>
            Close
          </button>
        </div>
      </div>

      {error && <div className="sir-notice error">{error}</div>}
      {empty && <div className="sir-notice info">{empty}</div>}

      {showReport && report && (
        <div className="sir-report">
          <div className="head">
            <h2>{report.college}</h2>
            {report.address1 && <p>{report.address1}</p>}
            {report.address2 && <p>{report.address2}</p>}
          </div>

          <div className="sub">
            <span>Faculty Issue Report ({report.type})</span>
            <span>Total Records : {report.rows.length}</span>
          </div>

          <table>
            <thead>
              <tr>
                <th>ID No.</th>
                <th>Name</th>
                <th>Title</th>
                <th>{report.type === "CD" ? "Sr. No." : "Acc. No."}</th>
                <th>Issue Date</th>
                <th>Last Return Date</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.IDNo}</td>
                  <td>{r.WhomIssued}</td>
                  <td>{r.Title}</td>
                  <td>{r.AccessionNo}</td>
                  <td>{fmt(r.IssueDate)}</td>
                  <td>{fmt(r.LastReturnDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}