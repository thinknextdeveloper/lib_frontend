"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { reduxApiClient } from "@/services/apiClient";
import { useAppSelector } from "@/store/hooks";

interface FacultyRecord {
  IDNo: string | null;
  Name: string | null;
  Designation: string | null;
  FatherName: string | null;
  MobileNo: string | null;
  PermanentAddress: string | null;
}

export default function FrmSearchFacultyName() {
  const { user } = useAppSelector((state) => state.auth);

  // College list & selection
  const [colleges, setColleges] = useState<string[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>("Select");

  // Faculty name input, staff type option & results
  const [facultyName, setFacultyName] = useState<string>("");
  const [isLeftEmployee, setIsLeftEmployee] = useState<boolean>(false);
  const [facultyList, setFacultyList] = useState<FacultyRecord[]>([]);
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

  // 2. Search Faculty / Staff Name
  const handleSearch = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    if (selectedCollege === "Select" || !selectedCollege) {
      setMsg({ text: "Select College Name", type: "error" });
      setFacultyList([]);
      return;
    }

    setLoading(true);
    setMsg({ text: "", type: "" });

    try {
      const res = await reduxApiClient.get(
        `faculty/search?facultyName=${encodeURIComponent(facultyName.trim())}&collegeName=${encodeURIComponent(
          selectedCollege
        )}&isLeft=${isLeftEmployee}`
      );

      if (res.success) {
        const data: FacultyRecord[] = res.data?.data || [];
        setFacultyList(data);
        if (data.length === 0) {
          setMsg({
            text:
              res.data?.message ||
              (isLeftEmployee
                ? "No left employee records found matching the search criteria."
                : "No faculty/staff records found matching the search criteria."),
            type: "error",
          });
        } else {
          setMsg({ text: "", type: "" });
        }
      } else {
        setFacultyList([]);
        setMsg({ text: res.error?.message || "Error searching faculty records", type: "error" });
      }
    } catch (err: any) {
      console.error("Error searching faculty:", err);
      setFacultyList([]);
      setMsg({ text: err.message || "An unexpected error occurred", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // 3. Export to Excel / CSV
  const handleExportToExcel = () => {
    if (facultyList.length === 0) return;

    const headers = [
      "IDNo",
      "Name",
      "Designation",
      "Father Name",
      "Mobile No.",
      "Permanent Address",
    ];

    const rows = facultyList.map((f) => [
      `"${(f.IDNo || "").replace(/"/g, '""')}"`,
      `"${(f.Name || "").replace(/"/g, '""')}"`,
      `"${(f.Designation || "").replace(/"/g, '""')}"`,
      `"${(f.FatherName || "").replace(/"/g, '""')}"`,
      `"${(f.MobileNo || "").replace(/"/g, '""')}"`,
      `"${(f.PermanentAddress || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Faculty_Search_${(facultyName.trim() || "all").replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. Reset Form
  const handleReset = () => {
    setFacultyName("");
    setIsLeftEmployee(false);
    setSelectedCollege("Select");
    setFacultyList([]);
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
            <span>Faculty & Staff Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mt-1">
            Search Faculty Name
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Search and view active faculty, staff, and left employee records with designation and contact details.
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

      {/* Enter Staff Name Top Panel */}
      <div className="bg-white dark:bg-[#111c38] rounded-2xl border border-[#dfe6f2] dark:border-[#1f2f55] p-5 sm:p-7 shadow-sm">
        <div className="border-b border-gray-100 dark:border-gray-800 pb-3 mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg text-sm">
              👥
            </span>
            Enter Staff Name :
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
                    setFacultyList([]);
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

            {/* Row 2: Radio Options - Current Employees vs Left Employees */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-3"></div>
              <div className="sm:col-span-9 flex items-center gap-6 py-1">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="employeeType"
                    checked={!isLeftEmployee}
                    onChange={() => {
                      setIsLeftEmployee(false);
                      setFacultyList([]);
                      setMsg({ text: "", type: "" });
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Current Employees
                  </span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="employeeType"
                    checked={isLeftEmployee}
                    onChange={() => {
                      setIsLeftEmployee(true);
                      setFacultyList([]);
                      setMsg({ text: "", type: "" });
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Left Employees
                  </span>
                </label>
              </div>
            </div>

            {/* Row 3: Enter Name + Search Button */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <label className="sm:col-span-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Enter Name :
              </label>
              <div className="sm:col-span-9 flex items-center gap-3">
                <input
                  type="text"
                  value={facultyName}
                  onChange={(e) => setFacultyName(e.target.value)}
                  placeholder="Enter name (or leave blank to list all)"
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

          {/* Action Buttons Section */}
          <div className="lg:col-span-4 flex sm:flex-row lg:flex-col gap-3 justify-end lg:justify-start">
            {/* Export To Excel Button */}
            <button
              type="button"
              onClick={handleExportToExcel}
              disabled={facultyList.length === 0}
              className={`w-full h-11 font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-xs ${
                facultyList.length > 0
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

      {/* Faculty Details Bottom Grid */}
      <div className="bg-white dark:bg-[#111c38] rounded-2xl border border-[#dfe6f2] dark:border-[#1f2f55] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Faculty & Staff Records {isLeftEmployee && "(Left Employees)"}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Faculty Details
            </h3>
          </div>
          {facultyList.length > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {facultyList.length} Records Found
            </span>
          )}
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto min-h-[250px]">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50/80 dark:bg-[#0a1226] text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-[#1f2f55] text-xs font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-bold">IDNo</th>
                <th className="py-3.5 px-4 font-bold">Name</th>
                <th className="py-3.5 px-4 font-bold">Designation</th>
                <th className="py-3.5 px-4 font-bold">Father Name</th>
                <th className="py-3.5 px-4 font-bold">Mobile No.</th>
                <th className="py-3.5 px-4 font-bold">Permanent Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-200 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400 dark:text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span>Searching faculty records...</span>
                    </div>
                  </td>
                </tr>
              ) : facultyList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400 dark:text-gray-500">
                    No faculty records to display. Select a college, enter faculty name, and click Search.
                  </td>
                </tr>
              ) : (
                facultyList.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                      {item.IDNo || "-"}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      {item.Name || "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs">
                        {item.Designation || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4">{item.FatherName || "-"}</td>
                    <td className="py-3 px-4">{item.MobileNo || "-"}</td>
                    <td className="py-3 px-4">{item.PermanentAddress || "-"}</td>
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
