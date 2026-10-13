"use client";

import React, { useState, useEffect, useMemo } from "react";
import { reduxApiClient } from "@/services/apiClient";
import { useAppSelector } from "@/store/hooks";

interface IssuedBookRecord {
  IssueDate: string | null;
  IDNo: string | null;
  WhomIssued: string | null;
  Discipline: string | null;
  AccessionNo: string | null;
  Title: string | null;
  Author: string | null;
  LastReturnDate: string | null;
  Condition: string | null;
  Type: string | null;
  Category: string | null;
  ReceiveDate: string | null;
  Remarks: string | null;
  CollegeName?: string | null;
  Signature?: string | null;
  UserID?: string | null;
  IssueTime?: string | null;
}

export default function FrmStatusIssueRegister() {
  const { user } = useAppSelector((state) => state.auth);

  // College selection
  const [colleges, setColleges] = useState<string[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>("Select");

  // Issued Records & Stats
  const [books, setBooks] = useState<IssuedBookRecord[]>([]);
  const [totalBooks, setTotalBooks] = useState<number | string>("");
  const [totalIssuedBooks, setTotalIssuedBooks] = useState<number | string>("");
  const [totalUnissuedBooks, setTotalUnissuedBooks] = useState<number | string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>("");

  // Status message
  const [msg, setMsg] = useState<{ text: string; type: "error" | "info" | "success" | "" }>({
    text: "",
    type: "",
  });

  // Pagination state
  const [pageSize, setPageSize] = useState<number | "All">(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 1. Fetch Colleges on load
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

  // 2. Fetch Issued Books whenever College changes
  useEffect(() => {
    if (!selectedCollege || selectedCollege === "Select") {
      setBooks([]);
      setTotalBooks("");
      setTotalIssuedBooks("");
      setTotalUnissuedBooks("");
      setMsg({ text: "", type: "" });
      setCurrentPage(1);
      return;
    }

    fetchIssuedBooks(selectedCollege);
  }, [selectedCollege]);

  const fetchIssuedBooks = async (college: string) => {
    setLoading(true);
    setMsg({ text: "", type: "" });
    setCurrentPage(1);

    try {
      const res = await reduxApiClient.get(`stock-books/issued-list?collegeName=${encodeURIComponent(college)}`);

      if (res.success) {
        const data = res.data?.data;
        const bookList: IssuedBookRecord[] = data?.books || [];
        setBooks(bookList);
        setTotalBooks(data?.totalBooks ?? "");
        setTotalIssuedBooks(data?.totalIssuedBooks ?? bookList.length);
        setTotalUnissuedBooks(data?.totalUnissuedBooks ?? "");

        if (bookList.length === 0) {
          setMsg({ text: "_No Record Found_", type: "error" });
        } else {
          setMsg({ text: "", type: "" });
        }
      } else {
        setBooks([]);
        setTotalBooks("");
        setTotalIssuedBooks("");
        setTotalUnissuedBooks("");
        setMsg({ text: res.error?.message || "_No Record Found_", type: "error" });
      }
    } catch (err: any) {
      console.error("Error fetching issued books:", err);
      setBooks([]);
      setTotalBooks("");
      setTotalIssuedBooks("");
      setTotalUnissuedBooks("");
      setMsg({ text: err.message || "An unexpected error occurred", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // 3. Export to Excel / CSV
  const handleExportToExcel = () => {
    if (books.length === 0) return;

    const headers = [
      "CollegeName",
      "IssueDate",
      "IDNo",
      "Title",
      "Author",
      "AccessionNo",
      "WhomIssued",
      "LastReturnDate",
      "Condition",
      "Discipline",
      "Type",
      "Category",
      "Remarks",
      "Signature",
      "ReceiveDate",
      "UserID",
      "IssueTime",
    ];

    const rows = books.map((b) => [
      `"${(b.CollegeName || selectedCollege || "").replace(/"/g, '""')}"`,
      b.IssueDate || "",
      `"${(b.IDNo || "").replace(/"/g, '""')}"`,
      `"${(b.Title || "").replace(/"/g, '""')}"`,
      `"${(b.Author || "").replace(/"/g, '""')}"`,
      `"${(b.AccessionNo || "").replace(/"/g, '""')}"`,
      `"${(b.WhomIssued || "").replace(/"/g, '""')}"`,
      b.LastReturnDate || "",
      `"${(b.Condition || "").replace(/"/g, '""')}"`,
      `"${(b.Discipline || "").replace(/"/g, '""')}"`,
      `"${(b.Type || "").replace(/"/g, '""')}"`,
      `"${(b.Category || "").replace(/"/g, '""')}"`,
      `"${(b.Remarks || "").replace(/"/g, '""')}"`,
      `"${(b.Signature || "").replace(/"/g, '""')}"`,
      b.ReceiveDate || "",
      `"${(b.UserID || "").replace(/"/g, '""')}"`,
      b.IssueTime || "",
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Issued_Books_${selectedCollege.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. Reset Form
  const handleReset = () => {
    setSelectedCollege("Select");
    setBooks([]);
    setTotalBooks("");
    setTotalIssuedBooks("");
    setTotalUnissuedBooks("");
    setSearchFilter("");
    setMsg({ text: "", type: "" });
    setCurrentPage(1);
  };

  // Filtered books list based on search text
  const filteredBooks = useMemo(() => {
    if (!searchFilter.trim()) return books;
    const q = searchFilter.toLowerCase();
    return books.filter(
      (b) =>
        (b.AccessionNo && b.AccessionNo.toLowerCase().includes(q)) ||
        (b.Title && b.Title.toLowerCase().includes(q)) ||
        (b.Author && b.Author.toLowerCase().includes(q)) ||
        (b.IDNo && b.IDNo.toLowerCase().includes(q)) ||
        (b.WhomIssued && b.WhomIssued.toLowerCase().includes(q)) ||
        (b.Discipline && b.Discipline.toLowerCase().includes(q)) ||
        (b.Category && b.Category.toLowerCase().includes(q))
    );
  }, [books, searchFilter]);

  // Total pages
  const totalPages = useMemo(() => {
    if (pageSize === "All" || filteredBooks.length === 0) return 1;
    const size = typeof pageSize === "number" ? pageSize : 50;
    return Math.ceil(filteredBooks.length / size);
  }, [filteredBooks.length, pageSize]);

  // Paginated books for ultra-fast DOM rendering
  const paginatedBooks = useMemo(() => {
    if (pageSize === "All") return filteredBooks;
    const size = typeof pageSize === "number" ? pageSize : 50;
    const start = (currentPage - 1) * size;
    return filteredBooks.slice(start, start + size);
  }, [filteredBooks, currentPage, pageSize]);

  const startIndex = useMemo(() => {
    if (filteredBooks.length === 0) return 0;
    if (pageSize === "All") return 1;
    const size = typeof pageSize === "number" ? pageSize : 50;
    return (currentPage - 1) * size + 1;
  }, [filteredBooks.length, currentPage, pageSize]);

  const endIndex = useMemo(() => {
    if (filteredBooks.length === 0) return 0;
    if (pageSize === "All") return filteredBooks.length;
    const size = typeof pageSize === "number" ? pageSize : 50;
    return Math.min(currentPage * size, filteredBooks.length);
  }, [filteredBooks.length, currentPage, pageSize]);

  return (
    <div className="w-full space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-[#111c38] p-4 sm:p-6 rounded-2xl border border-[#dfe6f2] dark:border-[#1f2f55] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <span>Status Management</span>
            <span>/</span>
            <span>Issued Books</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mt-1">
            Library - [Issued Books]
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Monitor complete issued book transactions, disciplines, return dates, and stock availability.
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

      {/* Top Issue Books Detail Panel */}
      <div className="bg-white dark:bg-[#111c38] rounded-2xl border border-[#dfe6f2] dark:border-[#1f2f55] p-5 sm:p-7 shadow-sm">
        <div className="border-b border-gray-100 dark:border-gray-800 pb-3 mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg text-sm">
              📖
            </span>
            Issue Books Detail
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Controls: College dropdown & Stats */}
          <div className="lg:col-span-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <label className="sm:col-span-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                College Name <span className="text-red-500">*</span>
              </label>
              <div className="sm:col-span-9">
                <select
                  value={selectedCollege}
                  onChange={(e) => setSelectedCollege(e.target.value)}
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

            {/* Stats Badges row */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <span>Total Books :</span>
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl font-bold">
                  {totalBooks !== "" ? totalBooks : "-"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <span>Total Issued Books :</span>
                <span className="px-3 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl font-bold">
                  {totalIssuedBooks !== "" ? totalIssuedBooks : "-"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <span>Total Unissued Books :</span>
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl font-bold">
                  {totalUnissuedBooks !== "" ? totalUnissuedBooks : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="lg:col-span-4 flex sm:flex-row lg:flex-col gap-3 justify-end lg:justify-start">
            {/* Export To Excel */}
            <button
              type="button"
              onClick={handleExportToExcel}
              disabled={books.length === 0}
              className={`w-full h-11 font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-xs ${
                books.length > 0
                  ? "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-60"
              }`}
            >
              <span>📊</span>
              <span>Export To Excel ({books.length})</span>
            </button>

            {/* Close / Reset */}
            <button
              type="button"
              onClick={handleReset}
              className="w-full h-11 bg-gray-50 hover:bg-gray-100 dark:bg-[#0a1226] dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#1f2f55] font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>🔄</span>
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>

      {/* Issued Books Data Table */}
      <div className="bg-white dark:bg-[#111c38] rounded-2xl border border-[#dfe6f2] dark:border-[#1f2f55] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Issue Register Records
            </span>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>Issue Register Details</span>
              {books.length > 0 && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  {filteredBooks.length} records
                </span>
              )}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Page Size Selector */}
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const val = e.target.value === "All" ? "All" : Number(e.target.value);
                  setPageSize(val);
                  setCurrentPage(1);
                }}
                className="h-9 px-2.5 bg-gray-50 dark:bg-[#0a1226] border border-gray-300 dark:border-[#1f2f55] rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
                <option value="All">All</option>
              </select>
              <span>entries</span>
            </div>

            {/* Quick table filter input */}
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search accession, title, student..."
                value={searchFilter}
                onChange={(e) => {
                  setSearchFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 px-3 bg-gray-50 dark:bg-[#0a1226] border border-gray-300 dark:border-[#1f2f55] rounded-lg text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto min-h-[300px] max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
            <thead className="bg-gray-50/90 dark:bg-[#0a1226] text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-[#1f2f55] text-xs font-bold tracking-wider sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Issue Date</th>
                <th className="py-3 px-3">ID No.</th>
                <th className="py-3 px-3">Whom Issued</th>
                <th className="py-3 px-3">Descipline</th>
                <th className="py-3 px-3">Accession No.</th>
                <th className="py-3 px-3">Title</th>
                <th className="py-3 px-3">Author</th>
                <th className="py-3 px-3">Last Return Date</th>
                <th className="py-3 px-3">Condition</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Receive Date</th>
                <th className="py-3 px-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-200 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={14} className="py-20 text-center text-gray-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading issued books inventory...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedBooks.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-20 text-center text-gray-400">
                    No issued book records to display. Select a college to view inventory.
                  </td>
                </tr>
              ) : (
                paginatedBooks.map((item, idx) => {
                  const rowNum = pageSize === "All" ? idx + 1 : (currentPage - 1) * (typeof pageSize === "number" ? pageSize : 50) + idx + 1;
                  return (
                    <tr
                      key={item.AccessionNo || idx}
                      className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-xs text-gray-400">{rowNum}</td>
                      <td className="py-2.5 px-3">{item.IssueDate || "-"}</td>
                      <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">
                        {item.IDNo || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-white">
                        {item.WhomIssued || "-"}
                      </td>
                      <td className="py-2.5 px-3">{item.Discipline || "-"}</td>
                      <td className="py-2.5 px-3 font-bold text-blue-600 dark:text-blue-400">
                        {item.AccessionNo || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white max-w-xs truncate" title={item.Title || ""}>
                        {item.Title || "-"}
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate" title={item.Author || ""}>
                        {item.Author || "-"}
                      </td>
                      <td className="py-2.5 px-3">{item.LastReturnDate || "-"}</td>
                      <td className="py-2.5 px-3">{item.Condition || "-"}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs">
                          {item.Type || "General"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">{item.Category || "-"}</td>
                      <td className="py-2.5 px-3">{item.ReceiveDate || "-"}</td>
                      <td className="py-2.5 px-3">{item.Remarks || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredBooks.length > 0 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            <div>
              Showing <span className="font-semibold text-gray-900 dark:text-white">{startIndex}</span> to{" "}
              <span className="font-semibold text-gray-900 dark:text-white">{endIndex}</span> of{" "}
              <span className="font-semibold text-gray-900 dark:text-white">{filteredBooks.length}</span> entries
            </div>

            {pageSize !== "All" && totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-[#1f2f55] bg-gray-50 dark:bg-[#0a1226] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold transition"
                >
                  « First
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-[#1f2f55] bg-gray-50 dark:bg-[#0a1226] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold transition"
                >
                  ‹ Prev
                </button>

                <span className="px-3 py-1.5 font-semibold text-xs text-gray-800 dark:text-gray-100 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-[#1f2f55] bg-gray-50 dark:bg-[#0a1226] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold transition"
                >
                  Next ›
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-[#1f2f55] bg-gray-50 dark:bg-[#0a1226] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold transition"
                >
                  Last »
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
