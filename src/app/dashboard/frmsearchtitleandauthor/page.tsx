"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { reduxApiClient } from "@/services/apiClient";
import { useAppSelector } from "@/store/hooks";

interface IssuedBookRecord {
  IssueDate: string | null;
  AccessionNo: string | null;
  Title: string | null;
  IDNo: string | null;
  WhomIssued: string | null;
  Discipline: string | null;
  Author: string | null;
  LastReturnDate: string | null;
  Condition: string | null;
  Publisher: string | null;
  Edition: string | null;
  Year: string | null;
  Pages: string | null;
  Source: string | null;
  Type: string | null;
  Category: string | null;
  BillNo: string | null;
  BillDate: string | null;
  Price: string | number | null;
  ClassNo: string | null;
  BookNo: string | null;
  Location: string | null;
}

interface UnissuedBookRecord {
  AccessionNo: string | null;
  Title: string | null;
  Author: string | null;
  Location: string | null;
  Publisher: string | null;
  Edition: string | null;
  ClassNo: string | null;
  BookNo: string | null;
}

export default function FrmSearchTitleAndAuthor() {
  const { user } = useAppSelector((state) => state.auth);

  // College selection
  const [colleges, setColleges] = useState<string[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>("Select");

  // Search filter inputs
  const [title, setTitle] = useState<string>("");
  const [author, setAuthor] = useState<string>("");

  // Results
  const [issuedBooks, setIssuedBooks] = useState<IssuedBookRecord[]>([]);
  const [unissuedBooks, setUnissuedBooks] = useState<UnissuedBookRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Status message
  const [msg, setMsg] = useState<{ text: string; type: "error" | "info" | "success" | "" }>({
    text: "",
    type: "",
  });

  // 1. Fetch Colleges on load (using the same college endpoint)
  useEffect(() => {
    async function fetchColleges() {
      try {
        const res = await reduxApiClient.get("demand-books/colleges");
        let list: string[] = [];
        if (res.success && Array.isArray(res.data?.data)) {
          list = res.data.data;
        }
        if (user?.collegeName && !list.includes(user.collegeName)) {
          list = [user.collegeName, ...list];
        }
        setColleges(list);
        setSelectedCollege("Select");
      } catch (err) {
        console.error("Failed to load colleges", err);
        if (user?.collegeName) {
          setColleges([user.collegeName]);
        }
        setSelectedCollege("Select");
      }
    }
    fetchColleges();
  }, [user]);

  // 2. Search Issued and UnIssued Books
  const handleSearch = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    if (selectedCollege === "Select" || !selectedCollege) {
      setMsg({ text: "Select College Name", type: "error" });
      setIssuedBooks([]);
      setUnissuedBooks([]);
      return;
    }

    setLoading(true);
    setMsg({ text: "", type: "" });

    try {
      const res = await reduxApiClient.get(
        `search-books/title-author?title=${encodeURIComponent(title.trim())}&author=${encodeURIComponent(
          author.trim()
        )}&collegeName=${encodeURIComponent(selectedCollege)}`
      );

      if (res.success) {
        const data = res.data?.data;
        const issued: IssuedBookRecord[] = data?.issuedBooks || [];
        const unissued: UnissuedBookRecord[] = data?.unissuedBooks || [];

        setIssuedBooks(issued);
        setUnissuedBooks(unissued);

        if (issued.length === 0 && unissued.length === 0) {
          setMsg({ text: "_No Record Found_", type: "error" });
        } else {
          setMsg({ text: "", type: "" });
        }
      } else {
        setIssuedBooks([]);
        setUnissuedBooks([]);
        setMsg({ text: res.error?.message || "_No Record Found_", type: "error" });
      }
    } catch (err: any) {
      console.error("Error searching books:", err);
      setIssuedBooks([]);
      setUnissuedBooks([]);
      setMsg({ text: err.message || "An unexpected error occurred", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // 3. Export Issued Books to CSV
  const handleExportIssued = () => {
    if (issuedBooks.length === 0) return;

    const headers = [
      "Issue Date",
      "Accession No.",
      "Title",
      "ID No.",
      "Whom Issued",
      "Discipline",
      "Author",
      "Last Return Date",
      "Condition",
      "Publisher",
      "Edition",
      "Year",
      "Pages",
      "Source",
      "Type",
      "Category",
      "Bill No.",
      "Bill Date",
      "Price",
      "Class No.",
      "Book No.",
      "Location",
    ];

    const rows = issuedBooks.map((b) => [
      b.IssueDate || "",
      `"${(b.AccessionNo || "").replace(/"/g, '""')}"`,
      `"${(b.Title || "").replace(/"/g, '""')}"`,
      `"${(b.IDNo || "").replace(/"/g, '""')}"`,
      `"${(b.WhomIssued || "").replace(/"/g, '""')}"`,
      `"${(b.Discipline || "").replace(/"/g, '""')}"`,
      `"${(b.Author || "").replace(/"/g, '""')}"`,
      b.LastReturnDate || "",
      `"${(b.Condition || "").replace(/"/g, '""')}"`,
      `"${(b.Publisher || "").replace(/"/g, '""')}"`,
      `"${(b.Edition || "").replace(/"/g, '""')}"`,
      b.Year || "",
      b.Pages || "",
      `"${(b.Source || "").replace(/"/g, '""')}"`,
      `"${(b.Type || "").replace(/"/g, '""')}"`,
      `"${(b.Category || "").replace(/"/g, '""')}"`,
      `"${(b.BillNo || "").replace(/"/g, '""')}"`,
      b.BillDate || "",
      b.Price != null ? b.Price : "",
      `"${(b.ClassNo || "").replace(/"/g, '""')}"`,
      `"${(b.BookNo || "").replace(/"/g, '""')}"`,
      `"${(b.Location || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Issued_Books_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. Export UnIssued Books to CSV
  const handleExportUnissued = () => {
    if (unissuedBooks.length === 0) return;

    const headers = [
      "Accession No.",
      "Title",
      "Author",
      "Location",
      "Publisher",
      "Edition",
      "Class No.",
      "Book No.",
    ];

    const rows = unissuedBooks.map((b) => [
      `"${(b.AccessionNo || "").replace(/"/g, '""')}"`,
      `"${(b.Title || "").replace(/"/g, '""')}"`,
      `"${(b.Author || "").replace(/"/g, '""')}"`,
      `"${(b.Location || "").replace(/"/g, '""')}"`,
      `"${(b.Publisher || "").replace(/"/g, '""')}"`,
      `"${(b.Edition || "").replace(/"/g, '""')}"`,
      `"${(b.ClassNo || "").replace(/"/g, '""')}"`,
      `"${(b.BookNo || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Unissued_Books_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 5. Reset Form
  const handleReset = () => {
    setTitle("");
    setAuthor("");
    setSelectedCollege("Select");
    setIssuedBooks([]);
    setUnissuedBooks([]);
    setMsg({ text: "", type: "" });
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-[#111c38] p-4 sm:p-6 rounded-2xl border border-[#dfe6f2] dark:border-[#1f2f55] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <span>Search Management</span>
            <span>/</span>
            <span>Books Status</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mt-1">
            Search Title And Author
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Simultaneously view Issued and Unissued book copies matching title and author search criteria.
          </p>
        </div>

        {/* Live Message Alert */}
        {msg.text && (
          <div
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all duration-200 animate-fadeIn ${
              msg.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
            }`}
          >
            <span>{msg.type === "success" ? "✓" : "⚠️"}</span>
            <span>{msg.text}</span>
          </div>
        )}
      </div>

      {/* Top Search Books Panel */}
      <div className="bg-white dark:bg-[#111c38] rounded-2xl border border-[#dfe6f2] dark:border-[#1f2f55] p-5 sm:p-7 shadow-sm">
        <div className="border-b border-gray-100 dark:border-gray-800 pb-3 mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg text-sm">
              📖
            </span>
            Search Books
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Search Inputs */}
          <form onSubmit={handleSearch} className="lg:col-span-8 space-y-4">
            {/* Row 1: College Name */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <label className="sm:col-span-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                College Name <span className="text-red-500">*</span>
              </label>
              <div className="sm:col-span-9">
                <select
                  value={selectedCollege}
                  onChange={(e) => {
                    setSelectedCollege(e.target.value);
                    setIssuedBooks([]);
                    setUnissuedBooks([]);
                    setMsg({ text: "", type: "" });
                  }}
                  className="w-full h-11 px-3.5 bg-gray-50 dark:bg-[#0a1226] border border-gray-300 dark:border-[#1f2f55] rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                >
                  <option value="Select">Select</option>
                  {colleges.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Enter Title */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <label className="sm:col-span-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Enter Title :
              </label>
              <div className="sm:col-span-9">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter book title"
                  className="w-full h-11 px-3.5 bg-gray-50 dark:bg-[#0a1226] border border-gray-300 dark:border-[#1f2f55] rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Row 3: Enter Author */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <label className="sm:col-span-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Enter Author :
              </label>
              <div className="sm:col-span-9">
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Enter author name"
                  className="w-full h-11 px-3.5 bg-gray-50 dark:bg-[#0a1226] border border-gray-300 dark:border-[#1f2f55] rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400"
                />
              </div>
            </div>
          </form>

          {/* Action Buttons */}
          <div className="lg:col-span-4 flex sm:flex-row lg:flex-col gap-3 justify-end lg:justify-start">
            {/* Search Button */}
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>🔍</span>
              )}
              <span>Search</span>
            </button>

            {/* Close / Reset Button */}
            <button
              type="button"
              onClick={handleReset}
              className="w-full h-11 bg-gray-50 hover:bg-gray-100 dark:bg-[#0a1226] dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#1f2f55] font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>🔄</span>
              <span>Close / Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Side-by-Side Grid Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Left Column: Issued Books Detail */}
        <div className="bg-white dark:bg-[#111c38] rounded-2xl border border-[#dfe6f2] dark:border-[#1f2f55] shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-amber-50/40 dark:bg-amber-950/20">
            <div>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Issued Records
              </span>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Issued Books Detail
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                Total Books :{" "}
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                  {issuedBooks.length}
                </span>
              </span>
              {issuedBooks.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportIssued}
                  className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-[#0a1226] hover:bg-amber-50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg shadow-xs transition"
                  title="Export Issued Books"
                >
                  📊 Export
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto min-h-[280px] max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-gray-50/80 dark:bg-[#0a1226] text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-[#1f2f55] font-bold sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-3">Issue Date</th>
                  <th className="py-3 px-3">Accession No.</th>
                  <th className="py-3 px-3">Title</th>
                  <th className="py-3 px-3">ID No.</th>
                  <th className="py-3 px-3">Whom Issued</th>
                  <th className="py-3 px-3">Discipline</th>
                  <th className="py-3 px-3">Author</th>
                  <th className="py-3 px-3">Last Return Date</th>
                  <th className="py-3 px-3">Condition</th>
                  <th className="py-3 px-3">Publisher</th>
                  <th className="py-3 px-3">Edition</th>
                  <th className="py-3 px-3">Year</th>
                  <th className="py-3 px-3">Pages</th>
                  <th className="py-3 px-3">Source</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Bill No.</th>
                  <th className="py-3 px-3">Bill Date</th>
                  <th className="py-3 px-3">Price</th>
                  <th className="py-3 px-3">Class No.</th>
                  <th className="py-3 px-3">Book No.</th>
                  <th className="py-3 px-3">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-200 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={22} className="py-16 text-center text-gray-400">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <span>Searching issued books...</span>
                      </div>
                    </td>
                  </tr>
                ) : issuedBooks.length === 0 ? (
                  <tr>
                    <td colSpan={22} className="py-16 text-center text-gray-400">
                      No issued books found.
                    </td>
                  </tr>
                ) : (
                  issuedBooks.map((item, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/30 dark:hover:bg-amber-950/20">
                      <td className="py-2.5 px-3 font-semibold text-amber-700 dark:text-amber-300">
                        {item.IssueDate || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-blue-600 dark:text-blue-400">
                        {item.AccessionNo || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">
                        {item.Title || "-"}
                      </td>
                      <td className="py-2.5 px-3">{item.IDNo || "-"}</td>
                      <td className="py-2.5 px-3">{item.WhomIssued || "-"}</td>
                      <td className="py-2.5 px-3">{item.Discipline || "-"}</td>
                      <td className="py-2.5 px-3">{item.Author || "-"}</td>
                      <td className="py-2.5 px-3">{item.LastReturnDate || "-"}</td>
                      <td className="py-2.5 px-3">{item.Condition || "-"}</td>
                      <td className="py-2.5 px-3">{item.Publisher || "-"}</td>
                      <td className="py-2.5 px-3">{item.Edition || "-"}</td>
                      <td className="py-2.5 px-3">{item.Year || "-"}</td>
                      <td className="py-2.5 px-3">{item.Pages || "-"}</td>
                      <td className="py-2.5 px-3">{item.Source || "-"}</td>
                      <td className="py-2.5 px-3">{item.Type || "-"}</td>
                      <td className="py-2.5 px-3">{item.Category || "-"}</td>
                      <td className="py-2.5 px-3">{item.BillNo || "-"}</td>
                      <td className="py-2.5 px-3">{item.BillDate || "-"}</td>
                      <td className="py-2.5 px-3">{item.Price != null ? `₹${item.Price}` : "-"}</td>
                      <td className="py-2.5 px-3">{item.ClassNo || "-"}</td>
                      <td className="py-2.5 px-3">{item.BookNo || "-"}</td>
                      <td className="py-2.5 px-3">{item.Location || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: UnIssued Books Details */}
        <div className="bg-white dark:bg-[#111c38] rounded-2xl border border-[#dfe6f2] dark:border-[#1f2f55] shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-emerald-50/40 dark:bg-emerald-950/20">
            <div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Available In Library
              </span>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                UnIssued Books Details
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                Total Books :{" "}
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                  {unissuedBooks.length}
                </span>
              </span>
              {unissuedBooks.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportUnissued}
                  className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-[#0a1226] hover:bg-emerald-50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg shadow-xs transition"
                  title="Export Unissued Books"
                >
                  📊 Export
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto min-h-[280px] max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-gray-50/80 dark:bg-[#0a1226] text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-[#1f2f55] font-bold sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-3">Accession No.</th>
                  <th className="py-3 px-3">Title</th>
                  <th className="py-3 px-3">Author</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Publisher</th>
                  <th className="py-3 px-3">Edition</th>
                  <th className="py-3 px-3">Class No.</th>
                  <th className="py-3 px-3">Book No.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-200 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-gray-400">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span>Searching unissued books...</span>
                      </div>
                    </td>
                  </tr>
                ) : unissuedBooks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-gray-400">
                      No unissued books found.
                    </td>
                  </tr>
                ) : (
                  unissuedBooks.map((item, idx) => (
                    <tr key={idx} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20">
                      <td className="py-2.5 px-3 font-bold text-blue-600 dark:text-blue-400">
                        {item.AccessionNo || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">
                        {item.Title || "-"}
                      </td>
                      <td className="py-2.5 px-3">{item.Author || "-"}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs">
                          {item.Location || "-"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">{item.Publisher || "-"}</td>
                      <td className="py-2.5 px-3">{item.Edition || "-"}</td>
                      <td className="py-2.5 px-3">{item.ClassNo || "-"}</td>
                      <td className="py-2.5 px-3">{item.BookNo || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
