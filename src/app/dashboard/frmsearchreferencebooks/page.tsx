"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { reduxApiClient } from "@/services/apiClient";
import { useAppSelector } from "@/store/hooks";

interface ReferenceBookRecord {
  Title: string | null;
  AccessionNo: string | null;
  Author: string | null;
  Publisher: string | null;
  Edition: string | null;
  BookNo: string | null;
  Year: string | null;
  Type: string | null;
  Pages: string | null;
  Price: string | number | null;
  NetPrice: string | number | null;
  Location: string | null;
}

export default function FrmSearchReferenceBooks() {
  const { user } = useAppSelector((state) => state.auth);

  // College selection
  const [colleges, setColleges] = useState<string[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>("Select");

  // Search by Category & Keyword
  const [category, setCategory] = useState<string>("Title");
  const [keyword, setKeyword] = useState<string>("" );

  // Results
  const [referenceBooks, setReferenceBooks] = useState<ReferenceBookRecord[]>([]);
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

  // 2. Search Reference Books Detail
  const handleSearch = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    if (selectedCollege === "Select" || !selectedCollege) {
      setMsg({ text: "Select College Name", type: "error" });
      setReferenceBooks([]);
      return;
    }

    if (category === "Select" || !category) {
      setMsg({ text: "Select Category", type: "error" });
      setReferenceBooks([]);
      return;
    }

    setLoading(true);
    setMsg({ text: "", type: "" });

    try {
      const res = await reduxApiClient.get(
        `search-books/reference-books?category=${encodeURIComponent(category)}&keyword=${encodeURIComponent(
          keyword.trim()
        )}&collegeName=${encodeURIComponent(selectedCollege)}`
      );

      if (res.success) {
        const data: ReferenceBookRecord[] = res.data?.data || [];
        setReferenceBooks(data);
        if (data.length === 0) {
          setMsg({ text: "_No Record Found_", type: "error" });
        } else {
          setMsg({ text: "", type: "" });
        }
      } else {
        setReferenceBooks([]);
        setMsg({ text: res.error?.message || "_No Record Found_", type: "error" });
      }
    } catch (err: any) {
      console.error("Error searching reference books:", err);
      setReferenceBooks([]);
      setMsg({ text: err.message || "An unexpected error occurred", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // 3. Export to Excel / CSV
  const handleExportToExcel = () => {
    if (referenceBooks.length === 0) return;

    const headers = [
      "Title",
      "AccessionNo",
      "Author",
      "Publisher",
      "Edition",
      "BookNo",
      "Year",
      "Type",
      "Pages",
      "Price",
      "NetPrice",
      "Location",
    ];

    const rows = referenceBooks.map((b) => [
      `"${(b.Title || "").replace(/"/g, '""')}"`,
      `"${(b.AccessionNo || "").replace(/"/g, '""')}"`,
      `"${(b.Author || "").replace(/"/g, '""')}"`,
      `"${(b.Publisher || "").replace(/"/g, '""')}"`,
      `"${(b.Edition || "").replace(/"/g, '""')}"`,
      `"${(b.BookNo || "").replace(/"/g, '""')}"`,
      b.Year || "",
      `"${(b.Type || "").replace(/"/g, '""')}"`,
      b.Pages || "",
      b.Price != null ? b.Price : "",
      b.NetPrice != null ? b.NetPrice : "",
      `"${(b.Location || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Reference_Books_${(keyword.trim() || "all").replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. Reset Form
  const handleReset = () => {
    setSelectedCollege("Select");
    setCategory("Title");
    setKeyword("");
    setReferenceBooks([]);
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
            <span>Reference Books</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mt-1">
            Search Reference Books
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Search and view stock reference collection books by Title, Author, Publisher, or Edition.
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

      {/* Top Search Reference Books Panel */}
      <div className="bg-white dark:bg-[#111c38] rounded-2xl border border-[#dfe6f2] dark:border-[#1f2f55] p-5 sm:p-7 shadow-sm">
        <div className="border-b border-gray-100 dark:border-gray-800 pb-3 mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg text-sm">
              📚
            </span>
            Search Filters
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Inputs Section */}
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
                    setReferenceBooks([]);
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

            {/* Row 2: Select Category */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <label className="sm:col-span-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="sm:col-span-9">
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setReferenceBooks([]);
                    setMsg({ text: "", type: "" });
                  }}
                  className="w-full h-11 px-3.5 bg-gray-50 dark:bg-[#0a1226] border border-gray-300 dark:border-[#1f2f55] rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                >
                  <option value="Select">Select</option>
                  <option value="Title">Title</option>
                  <option value="Author">Author</option>
                  <option value="Publisher">Publisher</option>
                  <option value="Edition">Edition</option>
                </select>
              </div>
            </div>

            {/* Row 3: Enter Search Text */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <label className="sm:col-span-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Enter {category !== "Select" ? category : "Keyword"} :
              </label>
              <div className="sm:col-span-9 flex items-center gap-3">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={`Enter ${category !== "Select" ? category.toLowerCase() : "search keyword"} (or leave blank to list all)`}
                  className="flex-1 h-11 px-3.5 bg-gray-50 dark:bg-[#0a1226] border border-gray-300 dark:border-[#1f2f55] rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 px-6 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>🔍</span>
                  )}
                  <span>Search</span>
                </button>
              </div>
            </div>
          </form>

          {/* Actions Section */}
          <div className="lg:col-span-4 flex sm:flex-row lg:flex-col gap-3 justify-end lg:justify-start">
            {/* Export To Excel Button */}
            <button
              type="button"
              onClick={handleExportToExcel}
              disabled={referenceBooks.length === 0}
              className={`w-full h-11 font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-xs ${
                referenceBooks.length > 0
                  ? "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-60"
              }`}
            >
              <span>📊</span>
              <span>Export To Excel</span>
            </button>

            {/* Close / Reset Button */}
            <button
              type="button"
              onClick={handleReset}
              className="w-full h-11 bg-gray-50 hover:bg-gray-100 dark:bg-[#0a1226] dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#1f2f55] font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>🔄</span>
              <span>Reset / Close</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reference Books Details Bottom Grid */}
      <div className="bg-white dark:bg-[#111c38] rounded-2xl border border-[#dfe6f2] dark:border-[#1f2f55] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Stock Collection (Type = Reference)
            </span>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Reference Books Details
            </h3>
          </div>
          {referenceBooks.length > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Total Records : {referenceBooks.length}
            </span>
          )}
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto min-h-[250px]">
          <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
            <thead className="bg-gray-50/80 dark:bg-[#0a1226] text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-[#1f2f55] text-xs font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-bold">Title</th>
                <th className="py-3.5 px-4 font-bold">AccessionNo</th>
                <th className="py-3.5 px-4 font-bold">Author</th>
                <th className="py-3.5 px-4 font-bold">Publisher</th>
                <th className="py-3.5 px-4 font-bold">Edition</th>
                <th className="py-3.5 px-4 font-bold">BookNo</th>
                <th className="py-3.5 px-4 font-bold">Year</th>
                <th className="py-3.5 px-4 font-bold">Type</th>
                <th className="py-3.5 px-4 font-bold">Pages</th>
                <th className="py-3.5 px-4 font-bold">Price</th>
                <th className="py-3.5 px-4 font-bold">NetPrice</th>
                <th className="py-3.5 px-4 font-bold">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-200 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-gray-400 dark:text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span>Searching reference books...</span>
                    </div>
                  </td>
                </tr>
              ) : referenceBooks.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-gray-400 dark:text-gray-500">
                    No reference books records found.
                  </td>
                </tr>
              ) : (
                referenceBooks.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      {item.Title || "-"}
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                      {item.AccessionNo || "-"}
                    </td>
                    <td className="py-3 px-4">{item.Author || "-"}</td>
                    <td className="py-3 px-4">{item.Publisher || "-"}</td>
                    <td className="py-3 px-4">{item.Edition || "-"}</td>
                    <td className="py-3 px-4">{item.BookNo || "-"}</td>
                    <td className="py-3 px-4">{item.Year || "-"}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs">
                        {item.Type || "Reference"}
                      </span>
                    </td>
                    <td className="py-3 px-4">{item.Pages || "-"}</td>
                    <td className="py-3 px-4">{item.Price != null ? `₹${item.Price}` : "-"}</td>
                    <td className="py-3 px-4">{item.NetPrice != null ? `₹${item.NetPrice}` : "-"}</td>
                    <td className="py-3 px-4">{item.Location || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
