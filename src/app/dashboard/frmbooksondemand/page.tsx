"use client";

import React, { useState, useEffect, useMemo, ChangeEvent, FormEvent } from "react";
import { reduxApiClient } from "@/services/apiClient";
import { useAppSelector } from "@/store/hooks";

interface DemandBook {
  SerialNo: string | number;
  IDNo: string | null;
  Date: string | null;
  Title: string;
  Author: string | null;
  Edition: string | null;
  Publisher: string | null;
  Price: string | number | null;
  Category: string | null;
  DemandType: string | null;
  Name: string | null;
  CollegeName: string;
}

interface PublisherItem {
  Publisher: string;
  Address?: string | null;
  Contact?: string | null;
}

export default function FrmBooksOnDemand() {
  const { user } = useAppSelector((state) => state.auth);

  // Colleges & Selection
  const [colleges, setColleges] = useState<string[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>("Select");

  // Form Fields
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [srNo, setSrNo] = useState<number | string>(1);
  const [title, setTitle] = useState<string>("");
  const [author, setAuthor] = useState<string>("");
  const [edition, setEdition] = useState<string>("");
  const [selectedPublisher, setSelectedPublisher] = useState<string>("Select");
  const [publishersList, setPublishersList] = useState<PublisherItem[]>([]);
  const [pricePerCopy, setPricePerCopy] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [quantity, setQuantity] = useState<number | string>(1);
  const [demandType, setDemandType] = useState<string>("Staff");
  const [idNo, setIdNo] = useState<string>("");
  const [name, setName] = useState<string>("");

  // Grid list of books on demand
  const [demandBooks, setDemandBooks] = useState<DemandBook[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [tableSearch, setTableSearch] = useState<string>("");

  // Status message
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" | "info" | "" }>({
    text: "",
    type: "",
  });

  // Publisher Modal State (frmaddpublisher)
  const [isPublisherModalOpen, setIsPublisherModalOpen] = useState<boolean>(false);
  const [pubModalMsg, setPubModalMsg] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });
  const [newPublisherName, setNewPublisherName] = useState<string>("");
  const [newPublisherAddress, setNewPublisherAddress] = useState<string>("");
  const [newPublisherContact, setNewPublisherContact] = useState<string>("");
  const [findPublisher, setFindPublisher] = useState<string>("");
  const [replaceWithPublisher, setReplaceWithPublisher] = useState<string>("");
  const [publisherSearchTerm, setPublisherSearchTerm] = useState<string>("");

  // 1. Fetch Colleges on load (defaults to "Select")
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

  // 2. Whenever College changes, load MaxSrNo, Publishers, and Books List
  useEffect(() => {
    if (!selectedCollege || selectedCollege === "Select") {
      setDemandBooks([]);
      setPublishersList([]);
      setSrNo(1);
      return;
    }

    loadMaxSrNo(selectedCollege);
    loadPublishers(selectedCollege);
    loadDemandBooks(selectedCollege);
  }, [selectedCollege]);

  const loadMaxSrNo = async (college: string) => {
    try {
      const res = await reduxApiClient.get(`demand-books/max-srno?collegeName=${encodeURIComponent(college)}`);
      if (res.success && res.data?.data?.maxSrNo != null) {
        setSrNo(res.data.data.maxSrNo);
      } else {
        setSrNo(1);
      }
    } catch {
      setSrNo(1);
    }
  };

  const loadPublishers = async (college: string) => {
    try {
      const res = await reduxApiClient.get(`demand-books/publishers?collegeName=${encodeURIComponent(college)}`);
      if (res.success && Array.isArray(res.data?.data)) {
        setPublishersList(res.data.data);
      } else {
        setPublishersList([]);
      }
    } catch {
      setPublishersList([]);
    }
  };

  const loadDemandBooks = async (college: string) => {
    setLoading(true);
    try {
      const res = await reduxApiClient.get(`demand-books/list?collegeName=${encodeURIComponent(college)}`);
      if (res.success && Array.isArray(res.data?.data)) {
        setDemandBooks(res.data.data);
      } else {
        setDemandBooks([]);
      }
    } catch (err) {
      console.error("Failed to load demand books:", err);
      setDemandBooks([]);
    } finally {
      setLoading(false);
    }
  };

  // Add Demand Book Handler
  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();

    if (selectedCollege === "Select" || !selectedCollege) {
      setMsg({ text: "Select College Name", type: "error" });
      return;
    }

    if (!srNo || String(srNo).trim() === "") {
      setMsg({ text: "Invalid Serial No.", type: "error" });
      return;
    }

    if (!title || String(title).trim() === "") {
      setMsg({ text: "Enter Title", type: "error" });
      return;
    }

    if (title.includes("'")) {
      setMsg({ text: "Invalid title", type: "error" });
      return;
    }

    if (author.includes("'")) {
      setMsg({ text: "Invalid Author Name", type: "error" });
      return;
    }

    if (edition.includes("'")) {
      setMsg({ text: "Invalid Edition", type: "error" });
      return;
    }

    if (category.includes("'")) {
      setMsg({ text: "Invalid Category", type: "error" });
      return;
    }

    if (name.includes("'")) {
      setMsg({ text: "Invalid Name", type: "error" });
      return;
    }

    try {
      const payload = {
        collegeName: selectedCollege,
        srNo: srNo,
        date: date,
        title: title.trim(),
        author: author.trim() || null,
        edition: edition.trim() || null,
        publisher: selectedPublisher !== "Select" ? selectedPublisher : null,
        price: pricePerCopy.trim() || null,
        category: category.trim() || null,
        demandType: demandType,
        idNo: idNo.trim() || null,
        name: name.trim() || null,
      };

      const res = await reduxApiClient.post("demand-books", payload);

      if (res.success) {
        setMsg({ text: "Added to Demand Books Successfully", type: "success" });

        // Reset form inputs
        setTitle("");
        setAuthor("");
        setEdition("");
        setSelectedPublisher("Select");
        setPricePerCopy("");
        setCategory("");
        setQuantity(1);
        setIdNo("");
        setName("");

        // Refresh list and next Sr No
        loadDemandBooks(selectedCollege);
        loadMaxSrNo(selectedCollege);
      } else {
        setMsg({ text: res.error?.message || "Failed to add Demand Book", type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err.message || "An unexpected error occurred", type: "error" });
    }
  };

  // Open Publisher Modal
  const handleOpenPublisherModal = () => {
    if (selectedCollege === "Select" || !selectedCollege) {
      setMsg({ text: "Select College Name", type: "error" });
      return;
    }
    setPubModalMsg({ text: "", type: "" });
    setNewPublisherName("");
    setNewPublisherAddress("");
    setNewPublisherContact("");
    setFindPublisher("");
    setReplaceWithPublisher("");
    setIsPublisherModalOpen(true);
  };

  // Add Publisher (frmaddpublisher)
  const handleAddPublisher = async () => {
    if (!newPublisherName || !newPublisherName.trim()) {
      setPubModalMsg({ text: "Please Enter Publisher", type: "error" });
      return;
    }
    if (!newPublisherAddress || !newPublisherAddress.trim()) {
      setPubModalMsg({ text: "Please Enter Address", type: "error" });
      return;
    }
    if (newPublisherName.includes("'")) {
      setPubModalMsg({ text: "' is not allowed in Publisher", type: "error" });
      return;
    }
    if (newPublisherAddress.includes("'")) {
      setPubModalMsg({ text: "' is not allowed in Address", type: "error" });
      return;
    }
    if (newPublisherContact.includes("'")) {
      setPubModalMsg({ text: "' is not allowed in Contact", type: "error" });
      return;
    }

    try {
      const res = await reduxApiClient.post("demand-books/publishers", {
        collegeName: selectedCollege,
        publisher: newPublisherName.trim(),
        address: newPublisherAddress.trim(),
        contact: newPublisherContact.trim(),
      });

      if (res.success) {
        setPubModalMsg({ text: "Added Successfully", type: "success" });
        setNewPublisherName("");
        setNewPublisherAddress("");
        setNewPublisherContact("");
        loadPublishers(selectedCollege);
      } else {
        setPubModalMsg({ text: res.error?.message || "Failed to add publisher", type: "error" });
      }
    } catch (err: any) {
      setPubModalMsg({ text: err.message || "Error adding publisher", type: "error" });
    }
  };

  // Delete Publisher (frmaddpublisher)
  const handleDeletePublisher = async (publisherName: string) => {
    if (!window.confirm(`Are you sure you want to delete publisher "${publisherName}"?`)) {
      return;
    }

    try {
      const res = await reduxApiClient.request("DELETE", "demand-books/publishers", {
        collegeName: selectedCollege,
        publisher: publisherName,
      });

      if (res.success) {
        setPubModalMsg({ text: "Deleted Successfully", type: "success" });
        loadPublishers(selectedCollege);
      } else {
        setPubModalMsg({
          text: res.error?.message || "This Publisher is already being used in another books. Therefore it can't Delete.",
          type: "error",
        });
      }
    } catch (err: any) {
      setPubModalMsg({ text: err.message || "Error deleting publisher", type: "error" });
    }
  };

  // Replace Publisher (frmaddpublisher)
  const handleReplacePublisher = async () => {
    if (!findPublisher || !findPublisher.trim()) {
      setPubModalMsg({ text: "Please enter publisher to find", type: "error" });
      return;
    }
    if (!replaceWithPublisher || !replaceWithPublisher.trim()) {
      setPubModalMsg({ text: "Please enter replacement publisher", type: "error" });
      return;
    }

    try {
      const res = await reduxApiClient.put("demand-books/publishers/replace", {
        collegeName: selectedCollege,
        find: findPublisher.trim(),
        replaceWith: replaceWithPublisher.trim(),
      });

      if (res.success) {
        setPubModalMsg({ text: "Replace Successfully", type: "success" });
        setFindPublisher("");
        setReplaceWithPublisher("");
        loadPublishers(selectedCollege);
      } else {
        setPubModalMsg({ text: res.error?.message || "Error replacing publisher", type: "error" });
      }
    } catch (err: any) {
      setPubModalMsg({ text: err.message || "Error replacing publisher", type: "error" });
    }
  };

  // Reset Form Function - Reloads the page
  const handleReset = () => {
    window.location.reload();
  };

  // Export to Excel / CSV
  const handleExportToExcel = () => {
    if (demandBooks.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = [
      "Serial No",
      "ID No",
      "Date",
      "Title",
      "Author",
      "Edition",
      "Publisher",
      "Price",
      "Category",
      "Demand Type",
      "Name",
      "College Name",
    ];

    const rows = demandBooks.map((b) => [
      b.SerialNo,
      b.IDNo || "",
      b.Date ? new Date(b.Date).toLocaleDateString("en-GB") : "",
      `"${(b.Title || "").replace(/"/g, '""')}"`,
      `"${(b.Author || "").replace(/"/g, '""')}"`,
      `"${(b.Edition || "").replace(/"/g, '""')}"`,
      `"${(b.Publisher || "").replace(/"/g, '""')}"`,
      b.Price || "",
      `"${(b.Category || "").replace(/"/g, '""')}"`,
      b.DemandType || "",
      `"${(b.Name || "").replace(/"/g, '""')}"`,
      `"${(b.CollegeName || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Books_On_Demand_${selectedCollege.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print / PDF Function matching Crystal Reports layout
  const handlePrint = () => {
    if (selectedCollege === "Select" || !selectedCollege) {
      setMsg({ text: "Select College Name to print", type: "error" });
      return;
    }

    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const printDate = `${month}/${day}/${year}`;

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const printTime = `${String(hours).padStart(2, "0")}:${minutes}:${seconds}${ampm}`;

    const reportRows = demandBooks.map((b) => {
      const bookDate = b.Date ? new Date(b.Date) : null;
      const formattedBookDate = bookDate
        ? `${String(bookDate.getMonth() + 1).padStart(2, "0")}/${String(bookDate.getDate()).padStart(2, "0")}/${bookDate.getFullYear()}`
        : "-";

      return `
        <tr>
          <td style="padding: 6px 4px; vertical-align: top; width: 12%; font-size: 12px;">${formattedBookDate}</td>
          <td style="padding: 6px 4px; vertical-align: top; width: 25%; font-size: 12px; font-weight: 500;">${b.Title || ""}</td>
          <td style="padding: 6px 4px; vertical-align: top; width: 22%; font-size: 12px;">${b.Author || ""}</td>
          <td style="padding: 6px 4px; vertical-align: top; width: 10%; font-size: 12px;">${b.Edition || ""}</td>
          <td style="padding: 6px 4px; vertical-align: top; width: 15%; font-size: 12px;">${b.Publisher || ""}</td>
          <td style="padding: 6px 4px; vertical-align: top; width: 8%; font-size: 12px;">${b.Price != null ? b.Price : ""}</td>
          <td style="padding: 6px 4px; vertical-align: top; width: 8%; font-size: 12px;">${b.Category || ""}</td>
        </tr>
      `;
    }).join("");

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Library - [Print Books On Demand]</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 24px;
            font-size: 12px;
          }
          .report-header-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            font-family: Arial, sans-serif;
            margin-bottom: 8px;
          }
          .college-section {
            text-align: center;
            margin-bottom: 4px;
          }
          .college-name {
            font-size: 15px;
            font-weight: bold;
            margin-bottom: 3px;
          }
          .college-sub {
            font-size: 12px;
            line-height: 1.4;
          }
          .rule-line {
            border-top: 1.5px solid #000;
            margin: 8px 0;
          }
          .report-title {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 0.02em;
            margin: 6px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
          }
          th {
            text-align: left;
            font-size: 12px;
            font-weight: bold;
            padding: 6px 4px;
            border-bottom: 1.5px solid #000;
          }
          td {
            border-bottom: none;
          }
          .no-records {
            text-align: center;
            padding: 20px;
            color: #666;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="report-header-top">
          <span>${printDate}</span>
          <span>${printTime}</span>
        </div>

        <div class="college-section">
          <div class="college-name">${selectedCollege}</div>
          <div class="college-sub">Patiala Road Sangrur, Ph.:- 01672-278528</div>
          <div class="college-sub">Approved by AICTE (Govt of India) ,Govt of Punjab and affilia</div>
        </div>

        <div class="rule-line"></div>
        <div class="report-title">Books On Demand</div>
        <div class="rule-line"></div>

        <table>
          <thead>
            <tr>
              <th style="width: 12%;">Date</th>
              <th style="width: 25%;">Title</th>
              <th style="width: 22%;">Author</th>
              <th style="width: 10%;">Edition</th>
              <th style="width: 15%;">Publisher</th>
              <th style="width: 8%;">Price</th>
              <th style="width: 8%;">Category</th>
            </tr>
          </thead>
          <tbody>
            ${reportRows.length > 0 ? reportRows : '<tr><td colspan="7" class="no-records">No Demand Books records available for this college</td></tr>'}
          </tbody>
        </table>

        <script>
          window.onload = function() {
            window.focus();
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=880,height=750");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(printHtml);
      printWindow.document.close();
    } else {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(printHtml);
        doc.close();
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }
    }
  };

  // Filtered list for table
  const filteredDemandBooks = useMemo(() => {
    if (!tableSearch.trim()) return demandBooks;
    const q = tableSearch.toLowerCase();
    return demandBooks.filter(
      (b) =>
        String(b.SerialNo).toLowerCase().includes(q) ||
        (b.Title && b.Title.toLowerCase().includes(q)) ||
        (b.Author && b.Author.toLowerCase().includes(q)) ||
        (b.Publisher && b.Publisher.toLowerCase().includes(q)) ||
        (b.IDNo && b.IDNo.toLowerCase().includes(q)) ||
        (b.Name && b.Name.toLowerCase().includes(q)) ||
        (b.Category && b.Category.toLowerCase().includes(q))
    );
  }, [demandBooks, tableSearch]);

  // Filtered publishers in modal
  const filteredPublishersInModal = useMemo(() => {
    if (!publisherSearchTerm.trim()) return publishersList;
    const q = publisherSearchTerm.toLowerCase();
    return publishersList.filter(
      (p) =>
        p.Publisher.toLowerCase().includes(q) ||
        (p.Address && p.Address.toLowerCase().includes(q)) ||
        (p.Contact && p.Contact.toLowerCase().includes(q))
    );
  }, [publishersList, publisherSearchTerm]);

  return (
    <div className="w-full space-y-6">
      {/* Top Banner / Breadcrumb & Status */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-[#111c38] p-4 sm:p-6 rounded-2xl border border-[#dfe6f2] dark:border-[#1f2f55] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <span>Books Management</span>
            <span>/</span>
            <span>Demand Register</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mt-1">
            Books On Demand
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage, record, and track purchase demands and requirements for library titles.
          </p>
        </div>

        {/* Live Message Banner */}
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

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Form Section (lg:col-span-9) */}
        <div className="lg:col-span-9 bg-white dark:bg-[#111c38] rounded-2xl border border-[#dfe6f2] dark:border-[#1f2f55] p-5 sm:p-7 shadow-sm">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-4 mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg text-sm">
                📝
              </span>
              Entry Details
            </h2>
            <span className="text-xs text-gray-400">All * fields are mandatory</span>
          </div>

          <form onSubmit={handleAdd} className="space-y-4">
            {/* Row 1: College Name */}
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

            {/* Row 2: Date & Sr No. */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <label className="sm:col-span-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="sm:col-span-4">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-11 px-3.5 bg-gray-50 dark:bg-[#0a1226] border border-gray-300 dark:border-[#1f2f55] rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              <label className="sm:col-span-2 text-sm font-semibold text-gray-700 dark:text-gray-300 sm:text-right">
                Sr No.
              </label>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  readOnly
                  value={srNo}
                  className="w-full h-11 px-3.5 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-[#1f2f55] rounded-xl text-sm font-bold text-blue-600 dark:text-blue-400 outline-none cursor-not-allowed"
                />
              </div>
            </div>

            {/* Row 3: Title */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <label className="sm:col-span-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Title <span className="text-red-500">*</span>
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

            {/* Row 4: Author & Edition */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <label className="sm:col-span-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Author
              </label>
              <div className="sm:col-span-4">
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Enter author name"
                  className="w-full h-11 px-3.5 bg-gray-50 dark:bg-[#0a1226] border border-gray-300 dark:border-[#1f2f55] rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400"
                />
              </div>

              <label className="sm:col-span-2 text-sm font-semibold text-gray-700 dark:text-gray-300 sm:text-right">
                Edition
              </label>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={edition}
                  onChange={(e) => setEdition(e.target.value)}
                  placeholder="e.g. 1st, 2nd"
                  className="w-full h-11 px-3.5 bg-gray-50 dark:bg-[#0a1226] border border-gray-300 dark:border-[#1f2f55] rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Row 5: Publisher with [...] button */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <label className="sm:col-span-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Publisher
              </label>
              <div className="sm:col-span-9 flex items-center gap-2">
                <select
                  value={selectedPublisher}
                  onChange={(e) => setSelectedPublisher(e.target.value)}
                  className="flex-1 h-11 px-3.5 bg-gray-50 dark:bg-[#0a1226] border border-gray-300 dark:border-[#1f2f55] rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                >
                  <option value="Select">Select Publisher</option>
                  {publishersList.map((p) => (
                    <option key={p.Publisher} value={p.Publisher}>
                      {p.Publisher}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleOpenPublisherModal}
                  title="Add / Manage Publishers"
                  className="h-11 px-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl font-bold text-sm tracking-wider flex items-center justify-center transition shadow-xs"
                >
                  ...
                </button>
              </div>
            </div>

            {/* Row 6: Price Per Copy & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <label className="sm:col-span-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Price Per Copy
              </label>
              <div className="sm:col-span-4">
                <input
                  type="number"
                  step="0.01"
                  value={pricePerCopy}
                  onChange={(e) => setPricePerCopy(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-11 px-3.5 bg-gray-50 dark:bg-[#0a1226] border border-gray-300 dark:border-[#1f2f55] rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400"
                />
              </div>

              <label className="sm:col-span-2 text-sm font-semibold text-gray-700 dark:text-gray-300 sm:text-right">
                Category
              </label>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full h-11 px-3.5 bg-gray-50 dark:bg-[#0a1226] border border-gray-300 dark:border-[#1f2f55] rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Row 7: Quantity & Demand Type */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <label className="sm:col-span-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Quantity
              </label>
              <div className="sm:col-span-4">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full h-11 px-3.5 bg-gray-50 dark:bg-[#0a1226] border border-gray-300 dark:border-[#1f2f55] rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              <label className="sm:col-span-2 text-sm font-semibold text-gray-700 dark:text-gray-300 sm:text-right">
                Demand Type
              </label>
              <div className="sm:col-span-3">
                <select
                  value={demandType}
                  onChange={(e) => setDemandType(e.target.value)}
                  className="w-full h-11 px-3.5 bg-gray-50 dark:bg-[#0a1226] border border-gray-300 dark:border-[#1f2f55] rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                >
                  <option value="Staff">Staff</option>
                  <option value="Student">Student</option>
                  <option value="Department">Department</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>

            {/* Row 8: ID No. & Name */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <label className="sm:col-span-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                ID No.
              </label>
              <div className="sm:col-span-4">
                <input
                  type="text"
                  value={idNo}
                  onChange={(e) => setIdNo(e.target.value)}
                  placeholder="Member ID / Roll No"
                  className="w-full h-11 px-3.5 bg-gray-50 dark:bg-[#0a1226] border border-gray-300 dark:border-[#1f2f55] rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400"
                />
              </div>

              <label className="sm:col-span-2 text-sm font-semibold text-gray-700 dark:text-gray-300 sm:text-right">
                Name
              </label>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Person Name"
                  className="w-full h-11 px-3.5 bg-gray-50 dark:bg-[#0a1226] border border-gray-300 dark:border-[#1f2f55] rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Hidden submit trigger */}
            <button type="submit" className="hidden" />
          </form>
        </div>

        {/* Right / Actions Section (lg:col-span-3) */}
        <div className="lg:col-span-3 flex flex-col gap-3.5">
          <div className="bg-white dark:bg-[#111c38] p-5 rounded-2xl border border-[#dfe6f2] dark:border-[#1f2f55] shadow-sm flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
              Actions
            </h3>

            {/* Add Button */}
            <button
              type="button"
              onClick={handleAdd}
              className="w-full h-12 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>➕</span>
              <span>Add</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="w-full h-11 bg-gray-50 hover:bg-gray-100 dark:bg-[#0a1226] dark:hover:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-[#1f2f55] font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>🖨️</span>
              <span>Print</span>
            </button>

            {/* Export To Excel */}
            <button
              type="button"
              onClick={handleExportToExcel}
              className="w-full h-11 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>📊</span>
              <span>Export To Excel</span>
            </button>

            {/* Reset / Close */}
            <button
              type="button"
              onClick={handleReset}
              className="w-full h-11 bg-gray-50 hover:bg-gray-100 dark:bg-[#0a1226] dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#1f2f55] font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>🔄</span>
              <span>Reset Form</span>
            </button>
          </div>

          {/* Quick Stats Widget */}
          <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                Total Demanded
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                {demandBooks.length}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Showing total demand records registered for{" "}
              <strong className="text-gray-700 dark:text-gray-200">{selectedCollege}</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Previous Details Data Grid */}
      <div className="bg-white dark:bg-[#111c38] rounded-2xl border border-[#dfe6f2] dark:border-[#1f2f55] shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Records List
            </span>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              College Name : <span className="text-blue-600 dark:text-blue-400">{selectedCollege}</span>
            </h3>
          </div>

          {/* Filter / Search input */}
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search serial, title, author..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full h-10 px-3.5 bg-gray-50 dark:bg-[#0a1226] border border-gray-300 dark:border-[#1f2f55] rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50/80 dark:bg-[#0a1226] text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-[#1f2f55] uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Serial No</th>
                <th className="py-3.5 px-4">ID No</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Title</th>
                <th className="py-3.5 px-4">Author</th>
                <th className="py-3.5 px-4">Edition</th>
                <th className="py-3.5 px-4">Publisher</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Demand Type</th>
                <th className="py-3.5 px-4">Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-200 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-400 dark:text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading demand books records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDemandBooks.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-400 dark:text-gray-500">
                    No books on demand records found for this college.
                  </td>
                </tr>
              ) : (
                filteredDemandBooks.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                      {item.SerialNo}
                    </td>
                    <td className="py-3 px-4">{item.IDNo || "-"}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.Date ? new Date(item.Date).toLocaleDateString("en-GB") : "-"}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      {item.Title}
                    </td>
                    <td className="py-3 px-4">{item.Author || "-"}</td>
                    <td className="py-3 px-4">{item.Edition || "-"}</td>
                    <td className="py-3 px-4">{item.Publisher || "-"}</td>
                    <td className="py-3 px-4">{item.Price ? `₹${item.Price}` : "-"}</td>
                    <td className="py-3 px-4">
                      {item.Category ? (
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs">
                          {item.Category}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.DemandType === "Staff"
                            ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            : item.DemandType === "Student"
                            ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        }`}
                      >
                        {item.DemandType || "Staff"}
                      </span>
                    </td>
                    <td className="py-3 px-4">{item.Name || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Publisher Management Modal (frmaddpublisher) */}
      {isPublisherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#111c38] rounded-2xl border border-[#dfe6f2] dark:border-[#1f2f55] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-blue-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base sm:text-lg">Publishers Management (frmaddpublisher)</h3>
                <p className="text-xs text-blue-100 mt-0.5">College: {selectedCollege}</p>
              </div>
              <button
                onClick={() => setIsPublisherModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition text-base"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Modal Alert Message */}
              {pubModalMsg.text && (
                <div
                  className={`p-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 ${
                    pubModalMsg.type === "success"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                  }`}
                >
                  <span>{pubModalMsg.type === "success" ? "✓" : "⚠️"}</span>
                  <span>{pubModalMsg.text}</span>
                </div>
              )}

              {/* 1. Add Publisher Section */}
              <div className="bg-gray-50 dark:bg-[#0a1226] p-4 rounded-xl border border-gray-200 dark:border-[#1f2f55] space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Add New Publisher
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Publisher *"
                    value={newPublisherName}
                    onChange={(e) => setNewPublisherName(e.target.value)}
                    className="h-10 px-3 bg-white dark:bg-[#111c38] border border-gray-300 dark:border-[#1f2f55] rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Address *"
                    value={newPublisherAddress}
                    onChange={(e) => setNewPublisherAddress(e.target.value)}
                    className="h-10 px-3 bg-white dark:bg-[#111c38] border border-gray-300 dark:border-[#1f2f55] rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Contact"
                    value={newPublisherContact}
                    onChange={(e) => setNewPublisherContact(e.target.value)}
                    className="h-10 px-3 bg-white dark:bg-[#111c38] border border-gray-300 dark:border-[#1f2f55] rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddPublisher}
                    className="px-5 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition"
                  >
                    Add Publisher
                  </button>
                </div>
              </div>

              {/* 2. Find and Replace Publisher Section */}
              <div className="bg-gray-50 dark:bg-[#0a1226] p-4 rounded-xl border border-gray-200 dark:border-[#1f2f55] space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Find & Replace Publisher
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                      Find Existing:
                    </label>
                    <input
                      type="text"
                      list="existingPublishersList"
                      placeholder="Type or select to find..."
                      value={findPublisher}
                      onChange={(e) => setFindPublisher(e.target.value)}
                      className="w-full h-10 px-3 bg-white dark:bg-[#111c38] border border-gray-300 dark:border-[#1f2f55] rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <datalist id="existingPublishersList">
                      {publishersList.map((p) => (
                        <option key={p.Publisher} value={p.Publisher} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                      Replace With:
                    </label>
                    <input
                      type="text"
                      placeholder="New publisher name..."
                      value={replaceWithPublisher}
                      onChange={(e) => setReplaceWithPublisher(e.target.value)}
                      className="w-full h-10 px-3 bg-white dark:bg-[#111c38] border border-gray-300 dark:border-[#1f2f55] rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleReplacePublisher}
                    className="px-5 h-9 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition"
                  >
                    Replace Publisher
                  </button>
                </div>
              </div>

              {/* 3. Existing Publishers List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Publishers ({publishersList.length})
                  </h4>
                  <input
                    type="text"
                    placeholder="Filter publishers..."
                    value={publisherSearchTerm}
                    onChange={(e) => setPublisherSearchTerm(e.target.value)}
                    className="h-8 px-2.5 bg-gray-50 dark:bg-[#0a1226] border border-gray-300 dark:border-[#1f2f55] rounded-lg text-xs outline-none"
                  />
                </div>

                <div className="border border-gray-200 dark:border-[#1f2f55] rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 dark:bg-[#0a1226] font-bold text-gray-600 dark:text-gray-300 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Publisher</th>
                        <th className="py-2.5 px-3">Address</th>
                        <th className="py-2.5 px-3">Contact</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredPublishersInModal.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-gray-400">
                            No publishers found for this college.
                          </td>
                        </tr>
                      ) : (
                        filteredPublishersInModal.map((p, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-[#0a1226]/50">
                            <td className="py-2 px-3 font-semibold text-gray-900 dark:text-white">
                              {p.Publisher}
                            </td>
                            <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                              {p.Address || "-"}
                            </td>
                            <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                              {p.Contact || "-"}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeletePublisher(p.Publisher)}
                                className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                                title="Delete Publisher"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50 dark:bg-[#0a1226] border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPublisherModalOpen(false)}
                className="px-5 h-9 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-xl text-xs sm:text-sm transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}