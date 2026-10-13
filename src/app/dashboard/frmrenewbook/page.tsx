"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearDetail,
  fetchRenewInit,
  lookupBook,
  renewBook,
  resetRenew,
  setMessage,
} from "@/store/slices/renewSlice";

// change this to the real URL of your Issue Book page
const ISSUE_ROUTE = "/dashboard/frmIssueBook";

const pad = (n: number) => String(n).padStart(2, "0");

const addDaysISO = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// 2026-10-08 -> 08/10/2026
const fmt = (iso: string | null) => (iso ? iso.split("-").reverse().join("/") : "");

const labelCls = "text-xs text-[#9db2d6]";

const btnCls =
  "h-8 w-full cursor-pointer rounded-lg bg-[#5ba4ff] text-xs font-medium text-[#08111f] transition hover:bg-[#7db7ff] disabled:cursor-not-allowed disabled:opacity-40";

const btnGhostCls =
  "h-8 w-full cursor-pointer rounded-lg border border-[#2a3d6e] bg-transparent text-xs font-medium text-[#cfe0ff] transition hover:bg-[#1a2a52] disabled:cursor-not-allowed disabled:opacity-40";

const inputCls =
  "h-8 rounded-lg border border-[#2a3d6e] bg-[#0b1530] px-2.5 text-xs text-[#e6eeff] outline-none transition placeholder:text-[#5f7399] focus:border-[#5ba4ff] focus:ring-1 focus:ring-[#5ba4ff]/40 [color-scheme:dark]";

const roCls =
  "w-[275px] rounded-lg border border-[#1e2d5a] bg-[#0a1226] px-2.5 text-xs text-[#cfe0ff] outline-none";

function Field({ label, value, tall = false }: { label: string; value: string; tall?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <label className={`w-[96px] shrink-0 pt-2 ${labelCls}`}>{label}</label>
      {tall ? (
        <textarea readOnly value={value} className={`${roCls} h-[56px] resize-none py-1.5`} />
      ) : (
        <input readOnly value={value} className={`${roCls} h-8`} />
      )}
    </div>
  );
}

export default function RenewBook() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { colleges, renewDays, accessionLength, detail, renewed, loading, message } = useAppSelector(
    (s) => s.renew
  );

  const [college, setCollege] = useState("");
  const [accessionNo, setAccessionNo] = useState("");
  const [signature, setSignature] = useState("");
  const [renewDate, setRenewDate] = useState(addDaysISO(15));

  const lastLooked = useRef("");

  useEffect(() => {
    dispatch(resetRenew());
    dispatch(fetchRenewInit());
  }, [dispatch]);

  useEffect(() => {
    if (colleges.length === 1) setCollege(colleges[0]);
  }, [colleges]);

  useEffect(() => {
    setRenewDate(addDaysISO(renewDays));
  }, [renewDays]);

  const lookup = () => {
    const acc = accessionNo.trim();
    if (!acc) return;

    if (!college) {
      dispatch(setMessage({ text: "Select College Name", ok: false }));
      return;
    }
    if (accessionLength && acc.length !== accessionLength) {
      dispatch(setMessage({ text: "Invalid Accession No. Length", ok: false }));
      return;
    }

    const key = `${college}|${acc}`;
    if (lastLooked.current === key && detail) return;
    lastLooked.current = key;

    dispatch(lookupBook({ collegeName: college, accessionNo: acc })).then((r) => {
      if (lookupBook.rejected.match(r)) lastLooked.current = "";
    });
  };

  const onAccessionChange = (v: string) => {
    setAccessionNo(v.replace(/\D/g, ""));
    lastLooked.current = "";
    dispatch(clearDetail());
  };

  const onRenew = async () => {
    if (!detail) return;
    if (!signature.trim()) {
      dispatch(setMessage({ text: "Enter Signature", ok: false }));
      return;
    }

    const result = await dispatch(
      renewBook({
        collegeName: detail.issue.collegeName,
        accessionNo: detail.issue.accessionNo,
        signature,
        renewDate,
      })
    );

    if (renewBook.fulfilled.match(result)) {
      setAccessionNo("");
      lastLooked.current = "";
    }
  };

  const onNewEntry = () => {
    dispatch(resetRenew());
    setCollege(colleges.length === 1 ? colleges[0] : "");
    setAccessionNo("");
    setSignature("");
    setRenewDate(addDaysISO(renewDays));
    lastLooked.current = "";
  };

  const i = detail?.issue;
  const isStaff = detail?.person.isStaff ?? false;

  return (
    <div className="mx-auto w-fit rounded-2xl border border-[#1e2d5a] bg-[#101b3a] p-6 text-xs text-[#e6eeff] shadow-[0_20px_50px_rgba(0,0,0,0.35)] [color-scheme:dark]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Renew Book</h2>
        {message.text && (
          <div
            className={`max-w-[340px] truncate rounded-lg border px-3 py-1 text-xs ${
              message.ok
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      <div className="flex gap-6">
        <div className="w-[560px]">
          <div className="mb-3 flex items-center gap-2">
            <label className={`w-[96px] ${labelCls}`}>College Name</label>
            <select
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              disabled={colleges.length <= 1}
              className={`${inputCls} w-[360px] disabled:opacity-60`}
            >
              <option value="">Select</option>
              {colleges.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <label className={`w-[96px] ${labelCls}`}>Accession No.</label>
            <input
              value={accessionNo}
              inputMode="numeric"
              onChange={(e) => onAccessionChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  lookup();
                }
              }}
              onBlur={lookup}
              className={`${inputCls} w-[158px]`}
              autoFocus
            />
            <label className={`ml-4 ${labelCls}`}>Signature</label>
            <input
              type="password"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className={`${inputCls} w-[116px]`}
            />
          </div>

          <fieldset className="relative rounded-xl border border-[#1e2d5a] bg-[#0d1731] px-4 pt-2 pb-4">
            <legend className="px-2 text-xs font-medium text-[#5ba4ff]">Detail</legend>

            <div className="flex flex-col gap-2">
              <Field label="College Name" value={i?.collegeName ?? ""} />
              <Field label="Name" value={i?.name ?? ""} />
              <Field label="ID No." value={i?.idNo ?? ""} />
              <Field label={isStaff ? "Designation" : "Course"} value={detail?.person.course ?? ""} />
              <Field label={isStaff ? "Department" : "Batch"} value={detail?.person.batch ?? ""} />
              <Field label="Accession No." value={i?.accessionNo ?? ""} />
              <Field label="Title" value={i?.title ?? ""} tall />
              <Field label="Date of Issue" value={fmt(i?.issueDate ?? null)} />
              <Field label="Last Return Date" value={fmt(i?.lastReturnDate ?? null)} />
              <Field label="Position" value={i?.position ?? ""} />
              <Field label="Type" value={i?.type ?? ""} />
            </div>

            <div className="absolute top-4 right-4 h-[112px] w-[84px] overflow-hidden rounded-lg border border-[#2a3d6e] bg-[#0a1226]">
              {detail?.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={detail.photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <svg viewBox="0 0 80 110" className="h-full w-full">
                  <rect width="80" height="110" fill="#0a1226" />
                  <circle cx="40" cy="42" r="20" fill="#2a3d6e" />
                  <path d="M6 110c2-30 16-40 34-40s32 10 34 40z" fill="#1e2d5a" />
                </svg>
              )}
            </div>
          </fieldset>

          <div className="mt-4 flex items-center gap-2">
            <label className={`w-[96px] ${labelCls}`}>Renew Date</label>
            <input
              type="date"
              value={renewDate}
              min={addDaysISO(0)}
              onChange={(e) => setRenewDate(e.target.value)}
              className={`${inputCls} w-[160px]`}
            />
          </div>
        </div>

        <div className="flex w-[96px] flex-col gap-3 pt-[84px]">
          <button type="button" className={btnGhostCls} onClick={() => router.push(ISSUE_ROUTE)}>
            Issue Book
          </button>
          <button type="button" className={btnCls} disabled={!detail || renewed || loading} onClick={onRenew}>
            {loading ? "Please wait…" : "Renew"}
          </button>
          <button type="button" className={btnGhostCls} onClick={onNewEntry}>
            New Entry
          </button>
          <button type="button" className={btnGhostCls} onClick={() => router.back()}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}