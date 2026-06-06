import { useState, useEffect } from "react";
import AddCalculationModal from "./AddCalculationModal";
import {
  getSkuCalculations,
  deleteSkuCalculation,
} from "../api/skuCalculationApi";
import { updateProfile } from "../api/authApi";
import EditCalculationModal from "./EditCalculationModal";
import MultiProductSKUCalculation from "./MulticalculationModal";
import XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  FileDown,
  Edit,
  Trash2,
  LogOut,
  FileSpreadsheet,
  UserCircle2,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import ExpenseViewModal from "./ExpenseViewModal";

const downloadSingleExcel = (item) => {
  const rows = [];

  if (item.expenses && item.expenses.length > 0) {
    item.expenses.forEach((exp, index) => {
      rows.push({
        "BUY PRODUCT": index === 0 ? item.product_name_buy : "",
        "BUY PRICE": index === 0 ? item.buy_amount : "",
        "BUY GST %": index === 0 ? item.buy_gst_percentage : "",
        "BUY UNIT PRICE": index === 0 ? item.buy_unit_price : "",
        "BUY QTY": index === 0 ? item.buy_quantity : "",
        "BUY TOTAL": index === 0 ? item.buy_total : "",

        "SELL PRODUCT": index === 0 ? item.product_name_sell : "",
        "SELL PRICE": index === 0 ? item.sell_amount : "",
        "SELL GST %": index === 0 ? item.sell_gst_percentage : "",
        "SELL UNIT PRICE": index === 0 ? item.sell_unit_price : "",
        "SELL QTY": index === 0 ? item.sell_quantity : "",
        "SELL TOTAL": index === 0 ? item.sell_total : "",

        PROFIT: index === 0 ? item.profit : "",
        "GST PAYABLE": index === 0 ? item.gst_payable : "",
        "NET PROFIT": index === 0 ? item.net_profit : "",

        PARTICULARS: exp.expense_particulars,
        "SPC %": exp.expense_spc_percentage,
       "NET PAY": exp.expenses_amount || exp.expense_amount || 0,
        "TOTAL NET PAY":
  index === 0 ? item.total_expense_amount : "",

        "INCOME TAX %":
          index === 0 ? item.income_tax_percentage : "",

        "INCOME TAX":
          index === 0 ? item.income_tax : "",

        "FINAL PROFIT":
          index === 0 ? item.final_profit : "",
      });
    });
  } else {
    rows.push({
      "BUY PRODUCT": item.product_name_buy,
      "BUY PRICE": item.buy_amount,
      "BUY GST %": item.buy_gst_percentage,
      "BUY UNIT PRICE": item.buy_unit_price,
      "BUY QTY": item.buy_quantity,
      "BUY TOTAL": item.buy_total,

      "SELL PRODUCT": item.product_name_sell,
      "SELL PRICE": item.sell_amount,
      "SELL GST %": item.sell_gst_percentage,
      "SELL UNIT PRICE": item.sell_unit_price,
      "SELL QTY": item.sell_quantity,
      "SELL TOTAL": item.sell_total,

      PROFIT: item.profit,
      "GST PAYABLE": item.gst_payable,
      "NET PROFIT": item.net_profit,

      PARTICULARS: "-",
      "SPC %": "-",
    "NET PAY": "-",

"TOTAL NET PAY":
  item.total_expense_amount || 0,

      "INCOME TAX %": item.income_tax_percentage,

      "INCOME TAX": item.income_tax,

      "FINAL PROFIT": item.final_profit,
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // COLUMN WIDTH
  worksheet["!cols"] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 12 },
    { wch: 18 },
    { wch: 10 },
    { wch: 15 },

    { wch: 25 },
    { wch: 15 },
    { wch: 12 },
    { wch: 18 },
    { wch: 10 },
    { wch: 15 },

    { wch: 15 },
    { wch: 15 },
    { wch: 15 },

    { wch: 25 },
    { wch: 10 },
    { wch: 15 },
    { wch: 18 }, // TOTAL NET PAY

    { wch: 15 }, // INCOME TAX %
    { wch: 15 }, // INCOME TAX
    { wch: 15 }, // FINAL PROFIT
  ];

  const range = XLSX.utils.decode_range(worksheet["!ref"]);

  // COLORS
  const headerColor = "1E293B";
  const orangeColor = "FDE68A";
  const redColor = "FECACA";
  const greenColor = "BBF7D0";
  const grayColor = "E5E7EB";
  const blueColor = "DBEAFE";

  // HEADER STYLE
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });

    if (!worksheet[cellAddress]) continue;

    worksheet[cellAddress].s = {
      font: {
        bold: true,
        color: { rgb: "FFFFFF" },
        sz: 12,
      },
      fill: {
        fgColor: { rgb: headerColor },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };
  }

  // BODY STYLE
  for (let R = 1; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });

      if (!worksheet[cellAddress]) continue;

      let bgColor = "FFFFFF";

      // BUY TOTAL
      if (C === 5) bgColor = orangeColor;

      // SELL TOTAL
      if (C === 11) bgColor = orangeColor;

      // PROFIT
      if (C === 12) bgColor = orangeColor;

      // GST PAYABLE
      if (C === 13) bgColor = redColor;

      // NET PROFIT
      if (C === 14) bgColor = greenColor;

     // NET PAY
if (C === 17) bgColor = grayColor;

// TOTAL NET PAY
if (C === 18) bgColor = grayColor;

// INCOME TAX %
if (C === 19) bgColor = grayColor;

// INCOME TAX
if (C === 20) bgColor = redColor;

// FINAL PROFIT
if (C === 21) bgColor = blueColor;

      worksheet[cellAddress].s = {
        font: {
          sz: 11,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        fill: {
          fgColor: { rgb: bgColor },
        },
        border: {
          top: { style: "thin", color: { rgb: "D1D5DB" } },
          bottom: { style: "thin", color: { rgb: "D1D5DB" } },
          left: { style: "thin", color: { rgb: "D1D5DB" } },
          right: { style: "thin", color: { rgb: "D1D5DB" } },
        },
      };
    }
  }

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Calculation"
  );

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const fileData = new Blob([excelBuffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  saveAs(fileData, `${item.product_name_buy || "Calculation"}.xlsx`);
};
const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const t = value.trim().replace(/\s/g, "").replace(",", ".").replace("%", "");
    if (t === "" || t === "-" || t === "." || t === "-.") return 0;
    const n = Number(t);
    return Number.isFinite(n) ? n : 0;
  }
  const direct = Number(value);
  if (Number.isFinite(direct)) return direct;
  const fromStr = Number(String(value).trim().replace(",", ".").replace("%", ""));
  return Number.isFinite(fromStr) ? fromStr : 0;
};


/** Standard PDF fonts often lack ₹; amounts match screen values in INR. */
const formatCurrencyPdf = (value) => {
  const n = toNumber(value);
  return `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const cellText = (v) => {
  if (v === null || v === undefined || v === "") return "-";
  return String(v);
};

const formatGstCellPdf = (v) => {
  if (v === null || v === undefined || v === "") return "-";
  const raw = String(v).trim();
  if (raw === "-") return "-";
  if (raw.includes("%")) return raw;
  return `${raw}%`;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState(null);

const rowsPerPage = 10;
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

const [selectedExpenses, setSelectedExpenses] = useState([]);
 const [openModal, setOpenModal] = useState(() => {
  return localStorage.getItem("openModal") === "true";
});

const [profileOpen, setProfileOpen] = useState(() => {
  return localStorage.getItem("profileOpen") === "true";
});
 const [calculations, setCalculations] = useState([]);
const [loading, setLoading] = useState(true);
const [editOpen, setEditOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);
const [activeMenu, setActiveMenu] = useState(() => {
  return localStorage.getItem("activeMenu") || "Product Calculations";
});
const [searchTerm, setSearchTerm] = useState("");
// const [profileOpen, setProfileOpen] = useState(false);
const [profileEdit, setProfileEdit] = useState(false);

const [profileForm, setProfileForm] = useState({
  name: "",
  email: "",
  phone: "",
});
const handleLogout = () => {
  localStorage.removeItem("token");

  // optional: clear all storage
  // localStorage.clear();

  navigate("/");
};

const exportToExcel = () => {
  if (!calculations || calculations.length === 0) {
    alert("No data to export");
    return;
  }

  const formattedData = [];

  calculations.forEach((item, index) => {
    if (item.expenses && item.expenses.length > 0) {
      item.expenses.forEach((exp, expIndex) => {
        formattedData.push({
          "SR NO": expIndex === 0 ? index + 1 : "",

          "BUY PRODUCT":
            expIndex === 0 ? item.product_name_buy : "",
          "BUY PRICE":
            expIndex === 0 ? item.buy_amount : "",
          "BUY GST %":
            expIndex === 0 ? item.buy_gst_percentage : "",
          "BUY UNIT PRICE":
            expIndex === 0 ? item.buy_unit_price : "",
          "BUY QTY":
            expIndex === 0 ? item.buy_quantity : "",
          "BUY TOTAL":
            expIndex === 0 ? item.buy_total : "",

          "SELL PRODUCT":
            expIndex === 0 ? item.product_name_sell : "",
          "SELL PRICE":
            expIndex === 0 ? item.sell_amount : "",
          "SELL GST %":
            expIndex === 0 ? item.sell_gst_percentage : "",
          "SELL UNIT PRICE":
            expIndex === 0 ? item.sell_unit_price : "",
          "SELL QTY":
            expIndex === 0 ? item.sell_quantity : "",
          "SELL TOTAL":
            expIndex === 0 ? item.sell_total : "",

          PROFIT:
            expIndex === 0 ? item.profit : "",
          "GST PAYABLE":
            expIndex === 0 ? item.gst_payable : "",
          "NET PROFIT":
            expIndex === 0 ? item.net_profit : "",

          PARTICULARS: exp.expense_particulars,
          "SPC %": exp.expense_spc_percentage,
         "NET PAY": exp.expenses_amount || exp.expense_amount || 0,

"TOTAL NET PAY":
  expIndex === 0
    ? item.total_expense_amount
    : "",

          "INCOME TAX %":
            expIndex === 0
              ? item.income_tax_percentage
              : "",

          "INCOME TAX":
            expIndex === 0 ? item.income_tax : "",

          "FINAL PROFIT":
            expIndex === 0 ? item.final_profit : "",
        });
      });
    } else {
      formattedData.push({
        "SR NO": index + 1,

        "BUY PRODUCT": item.product_name_buy,
        "BUY PRICE": item.buy_amount,
        "BUY GST %": item.buy_gst_percentage,
        "BUY UNIT PRICE": item.buy_unit_price,
        "BUY QTY": item.buy_quantity,
        "BUY TOTAL": item.buy_total,

        "SELL PRODUCT": item.product_name_sell,
        "SELL PRICE": item.sell_amount,
        "SELL GST %": item.sell_gst_percentage,
        "SELL UNIT PRICE": item.sell_unit_price,
        "SELL QTY": item.sell_quantity,
        "SELL TOTAL": item.sell_total,

        PROFIT: item.profit,
        "GST PAYABLE": item.gst_payable,
        "NET PROFIT": item.net_profit,

        PARTICULARS: "-",
        "SPC %": "-",
        "NET PAY": "-",

"TOTAL NET PAY": item.total_expense_amount || 0,

        "INCOME TAX %":
          item.income_tax_percentage,

        "INCOME TAX": item.income_tax,

        "FINAL PROFIT": item.final_profit,
      });
    }
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // COLUMN WIDTH
  worksheet["!cols"] = [
    { wch: 10 },
    { wch: 25 },
    { wch: 15 },
    { wch: 12 },
    { wch: 18 },
    { wch: 10 },
    { wch: 15 },

    { wch: 25 },
    { wch: 15 },
    { wch: 12 },
    { wch: 18 },
    { wch: 10 },
    { wch: 15 },

    { wch: 15 },
    { wch: 15 },
    { wch: 15 },

    { wch: 25 },
    { wch: 10 },
    { wch: 15 },
    { wch: 18 }, // TOTAL NET PAY


    { wch: 15 }, // INCOME TAX %
    { wch: 15 }, // INCOME TAX
    { wch: 15 }, // FINAL PROFIT
  ];

  const range = XLSX.utils.decode_range(worksheet["!ref"]);

  // COLORS
  const headerColor = "1E293B";
  const orangeColor = "FDE68A";
  const redColor = "FECACA";
  const greenColor = "BBF7D0";
  const grayColor = "E5E7EB";
  const blueColor = "DBEAFE";

  // HEADER STYLE
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });

    if (!worksheet[cellAddress]) continue;

    worksheet[cellAddress].s = {
      font: {
        bold: true,
        color: { rgb: "FFFFFF" },
      },
      fill: {
        fgColor: { rgb: headerColor },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };
  }

  // BODY STYLE
  for (let R = 1; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });

      if (!worksheet[cellAddress]) continue;

      let bgColor = "FFFFFF";

      // BUY TOTAL
      if (C === 6) bgColor = orangeColor;

      // SELL TOTAL
      if (C === 13) bgColor = orangeColor;

      // PROFIT
      if (C === 14) bgColor = orangeColor;

      // GST PAYABLE
      if (C === 15) bgColor = redColor;

      // NET PROFIT
      if (C === 16) bgColor = greenColor;

      // NET PAY
     // NET PAY
if (C === 19) bgColor = grayColor;

// TOTAL NET PAY
if (C === 20) bgColor = grayColor;

// INCOME TAX %
if (C === 21) bgColor = grayColor;

// INCOME TAX
if (C === 22) bgColor = redColor;

// FINAL PROFIT
if (C === 23) bgColor = blueColor;

      worksheet[cellAddress].s = {
        alignment: {
          horizontal: "center",
          vertical: "center",
        },
        fill: {
          fgColor: { rgb: bgColor },
        },
        border: {
          top: { style: "thin", color: { rgb: "D1D5DB" } },
          bottom: { style: "thin", color: { rgb: "D1D5DB" } },
          left: { style: "thin", color: { rgb: "D1D5DB" } },
          right: { style: "thin", color: { rgb: "D1D5DB" } },
        },
      };
    }
  }

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Product Calculations"
  );

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const data = new Blob([excelBuffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  saveAs(data, "Product_Calculations.xlsx");
};
  const exportToPdf = () => {
  if (!calculations || calculations.length === 0) {
    alert("No data to export");
    return;
  }

  try {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const margin = 8;
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Single Product Calculations", margin, y);

    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    doc.text(
      `${calculations.length} record${
        calculations.length !== 1 ? "s" : ""
      }`,
      margin,
      y
    );

    y += 6;

    // GROUP HEADERS
    const headRow1 = [
      {
        content: "INPUT PRICING",
        colSpan: 7,
        styles: {
          halign: "center",
          fillColor: [30, 41, 59],
        },
      },
      {
        content: "OUTPUT PRICING",
        colSpan: 7,
        styles: {
          halign: "center",
          fillColor: [30, 41, 59],
        },
      },
      {
        content: "PROFIT",
        colSpan: 3,
        styles: {
          halign: "center",
          fillColor: [30, 41, 59],
        },
      },
      {
        content: "EXPENSE",
        colSpan: 3,
        styles: {
          halign: "center",
          fillColor: [30, 41, 59],
        },
      },
      {
        content: "TAX & FINAL",
        colSpan: 5,
        styles: {
          halign: "center",
          fillColor: [30, 41, 59],
        },
      },
    ];

    // COLUMN HEADERS
    const headRow2 = [
      "SR.NO",
      "PRODUCT NAME",
      "I/P PRICE",
      "GST",
      "UNIT WITH GST",
      "QTY",
      "TOTAL I/P PRICE",

      "SR.NO",
      "PRODUCT NAME",
      "O/P PRICE",
      "GST",
      "UNIT WITH GST",
      "QTY",
      "TOTAL O/P PRICE",

      "PROFIT",
      "GST PAYABLE",
      "NET PROFIT",

      "PARTICULARS",
      "SPC %",
      "NET PAY",
      "TOTAL NET PAY",

      "INCOME TAX %",
      "FINAL INCOME TAX",
      "FINAL PROFIT",

      "ACTION",
    ];

    const body = [];

    calculations.forEach((item, index) => {
      // WITH EXPENSES
      if (item.expenses && item.expenses.length > 0) {
        item.expenses.forEach((exp, expIndex) => {
          body.push([
            // INPUT
            expIndex === 0 ? String(index + 1) : "",
            expIndex === 0
              ? cellText(item.product_name_buy)
              : "",
            expIndex === 0
              ? formatCurrencyPdf(item.buy_amount)
              : "",
            expIndex === 0
              ? formatGstCellPdf(item.buy_gst_percentage)
              : "",
            expIndex === 0
              ? formatCurrencyPdf(item.buy_unit_price)
              : "",
            expIndex === 0
              ? cellText(item.buy_quantity)
              : "",
            expIndex === 0
              ? formatCurrencyPdf(item.buy_total)
              : "",

            // OUTPUT
            expIndex === 0 ? String(index + 1) : "",
            expIndex === 0
              ? cellText(item.product_name_sell)
              : "",
            expIndex === 0
              ? formatCurrencyPdf(item.sell_amount)
              : "",
            expIndex === 0
              ? formatGstCellPdf(item.sell_gst_percentage)
              : "",
            expIndex === 0
              ? formatCurrencyPdf(item.sell_unit_price)
              : "",
            expIndex === 0
              ? cellText(item.sell_quantity)
              : "",
            expIndex === 0
              ? formatCurrencyPdf(item.sell_total)
              : "",

            // PROFIT
            expIndex === 0
              ? formatCurrencyPdf(item.profit)
              : "",

            expIndex === 0
              ? formatCurrencyPdf(item.gst_payable)
              : "",

            expIndex === 0
              ? formatCurrencyPdf(item.net_profit)
              : "",

            // EXPENSE
            cellText(exp.expense_particulars),

            cellText(exp.expense_spc_percentage),

         formatCurrencyPdf(
  exp.expenses_amount || exp.expense_amount || 0
),

expIndex === 0
  ? formatCurrencyPdf(item.total_expense_amount)
  : "",

            // TAX & FINAL
            expIndex === 0
              ? `${item.income_tax_percentage || 0}%`
              : "",

            expIndex === 0
              ? formatCurrencyPdf(item.income_tax)
              : "",

            expIndex === 0
              ? formatCurrencyPdf(item.final_profit)
              : "",

            "—",
          ]);
        });
      } else {
        // WITHOUT EXPENSES
        body.push([
          String(index + 1),

          cellText(item.product_name_buy),
          formatCurrencyPdf(item.buy_amount),
          formatGstCellPdf(item.buy_gst_percentage),
          formatCurrencyPdf(item.buy_unit_price),
          cellText(item.buy_quantity),
          formatCurrencyPdf(item.buy_total),

          String(index + 1),

          cellText(item.product_name_sell),
          formatCurrencyPdf(item.sell_amount),
          formatGstCellPdf(item.sell_gst_percentage),
          formatCurrencyPdf(item.sell_unit_price),
          cellText(item.sell_quantity),
          formatCurrencyPdf(item.sell_total),

          formatCurrencyPdf(item.profit),
          formatCurrencyPdf(item.gst_payable),
          formatCurrencyPdf(item.net_profit),

          "-",
"-",
formatCurrencyPdf(item.total_expense_amount || 0),

          `${item.income_tax_percentage || 0}%`,

          formatCurrencyPdf(item.income_tax),

          formatCurrencyPdf(item.final_profit),

          "—",
        ]);
      }
    });

    // COLORS
    const orange = [254, 215, 170];
    const red = [254, 202, 202];
    const green = [187, 247, 208];
    const gray = [229, 231, 235];
    const blue = [219, 234, 254];

    autoTable(doc, {
      startY: y,

      head: [headRow1, headRow2],

      body,

      theme: "grid",

      styles: {
        fontSize: 5.5,
        cellPadding: 0.8,
        textColor: [15, 23, 42],
        lineColor: [71, 85, 105],
        lineWidth: 0.05,
      },

      headStyles: {
        textColor: [241, 245, 249],
        fontStyle: "bold",
        fontSize: 5.5,
      },

      didParseCell: (data) => {
        if (
          data.section !== "head" &&
          data.section !== "body"
        )
          return;

        const i = data.column.index;

        // TOP HEADERS
        if (
          data.section === "head" &&
          data.row.index === 0
        ) {
          data.cell.styles.textColor = [241, 245, 249];
          return;
        }

        // COLUMN HEADERS
        if (
          data.section === "head" &&
          data.row.index === 1
        ) {
          data.cell.styles.fillColor = [17, 24, 39];
          data.cell.styles.textColor = [255, 255, 255];

          // BUY TOTAL
          if ([6, 13].includes(i))
            data.cell.styles.fillColor = [124, 45, 18];

          // PROFIT
          if (i === 14)
            data.cell.styles.fillColor = [124, 45, 18];

          // GST PAYABLE
          if (i === 15)
            data.cell.styles.fillColor = [127, 29, 29];

          // NET PROFIT
          if (i === 16)
            data.cell.styles.fillColor = [20, 83, 45];

          // NET PAY
         // NET PAY
if (i === 19)
  data.cell.styles.fillColor = [31, 41, 55];

// TOTAL NET PAY
if (i === 20)
  data.cell.styles.fillColor = [55, 65, 81];

// INCOME TAX %
if (i === 21)
  data.cell.styles.fillColor = [75, 85, 99];

// INCOME TAX
if (i === 22)
  data.cell.styles.fillColor = [127, 29, 29];

// FINAL PROFIT
if (i === 23)
  data.cell.styles.fillColor = [30, 64, 175];

          return;
        }

        // BODY
        if (data.section === "body") {
          // BUY TOTAL
          if ([6, 13].includes(i))
            data.cell.styles.fillColor = orange;

          // PROFIT
          if (i === 14)
            data.cell.styles.fillColor = orange;

          // GST PAYABLE
          if (i === 15)
            data.cell.styles.fillColor = red;

          // NET PROFIT
          if (i === 16)
            data.cell.styles.fillColor = green;

          // NET PAY
          if (i === 19)
            data.cell.styles.fillColor = gray;

          // INCOME TAX %
          if (i === 20)
            data.cell.styles.fillColor = gray;

          // INCOME TAX
          if (i === 21)
            data.cell.styles.fillColor = red;

          // FINAL PROFIT
          if (i === 22)
            data.cell.styles.fillColor = blue;
        }
      },
    });

    const date = new Date()
      .toISOString()
      .split("T")[0];

    doc.save(`Product_Calculations_${date}.pdf`);
  } catch (error) {
    console.error("Error exporting to PDF:", error);

    alert("Failed to export PDF file.");
  }
};

const fetchCalculations = async () => {
  try {
    setLoading(true);

    const response = await getSkuCalculations();

    console.log("API DATA :", response);

    // if API returns array directly
    setCalculations(response.data);

    // IF API RETURNS:
    // { data: [...] }
    // then use:
    // setCalculations(response.data);

  } catch (error) {
    console.error("Fetch Error:", error);
  } finally {
    setLoading(false);
  }
};
const handleDelete = async (skuId) => {
  if (!skuId) {
    alert("Invalid ID: cannot delete");
    console.error("Missing SKU ID");
    return;
  }

  const confirmDelete = window.confirm(
    "Are you sure you want to delete this calculation?"
  );

  if (!confirmDelete) return;

  try {
    await deleteSkuCalculation(Number(skuId)); // 👈 important if backend expects integer

    fetchCalculations();
    alert("Deleted successfully");
  } catch (error) {
    console.error("Delete Error:", error);
    alert(error.message || "Failed to delete");
  }
};
useEffect(() => {
  const loadCalculations = async () => {
    await fetchCalculations();
  };

  loadCalculations();
}, []);
useEffect(() => {
  localStorage.setItem("openModal", openModal);
}, [openModal]);

useEffect(() => {
  localStorage.setItem("profileOpen", profileOpen);
}, [profileOpen]);

useEffect(() => {
  localStorage.setItem("activeMenu", activeMenu);
}, [activeMenu]);
const filteredCalculations = calculations.filter((item) => {
  const search = searchTerm.toLowerCase();

  return Object.values(item).some((value) =>
    String(value).toLowerCase().includes(search)
  );
});
// PAGINATION
const totalPages = Math.ceil(filteredCalculations.length / rowsPerPage);

const startIndex = (currentPage - 1) * rowsPerPage;
const endIndex = startIndex + rowsPerPage;

const paginatedCalculations = filteredCalculations.slice(
  startIndex,
  endIndex
);
useEffect(() => {
  const storedUser = localStorage.getItem("user");

  if (storedUser) {
    const parsedUser = JSON.parse(storedUser);

    setUser(parsedUser);

    setProfileForm({
      name: parsedUser.name || "",
      email: parsedUser.email || "",
      phone: parsedUser.phone || "",
    });
  }
}, []);
// RESET PAGE WHEN SEARCH CHANGES
useEffect(() => {
  setCurrentPage(1);
}, [searchTerm]);
const handleProfileSave = async () => {
  try {
    const response = await updateProfile(profileForm);

    console.log("PROFILE UPDATE RESPONSE:", response);

    // API RETURNS response.data
    const updatedUser = response.data;

    // UPDATE STATE
    setUser(updatedUser);

    // UPDATE PROFILE FORM
    setProfileForm(updatedUser);

    // SAVE TO LOCAL STORAGE
    localStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );

    // CLOSE EDIT MODE
    setProfileEdit(false);

    alert("Profile updated successfully");
  } catch (error) {
    console.error("PROFILE UPDATE ERROR:", error);

    alert(error.message || "Failed to update profile");
  }
};

return (
  <div className="min-h-screen bg-[#f8fafc] flex text-gray-900 overflow-hidden">
    
    {/* SIDEBAR */}
   <aside className="fixed left-0 top-0 h-screen w-[280px] bg-gradient-to-b from-[#0f172a] via-[#111827] to-[#1e293b] border-r border-white/10 shadow-2xl flex flex-col z-50">
      
      {/* LOGO */}
      <div className="px-8 py-8 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
            VM
          </div>

          <div>
            <h2 className="text-2xl font-black tracking-wide text-white">
              SHEET
            </h2>

            <p className="text-sm text-gray-400 mt-1">
              Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* MENU */}
      <div className="flex-1 px-5 py-8">
        <div className="space-y-3">
         {["Product Calculations", "Multi Product Calculations"].map(
  (item, i) => {
    const isActive = activeMenu === item;

    return (
      <button
        key={i}
        onClick={() => setActiveMenu(item)}
        className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-300 font-semibold overflow-hidden ${
          isActive
            ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-xl scale-[1.02]"
            : "text-gray-300 hover:bg-white/10 hover:text-white"
        }`}
      >
        <span className="text-sm whitespace-nowrap">
          {item}
        </span>

        {isActive && (
          <div className="h-2 w-2 rounded-full bg-white flex-shrink-0" />
        )}
      </button>
              );
            }
          )}
        </div>
      </div>

       
    </aside>

    {/* MAIN */}
    {activeMenu === "Product Calculations" ? (
    <main className="flex-1 ml-[280px] pt-[95px] overflow-auto min-h-screen">

        {/* TOP NAVBAR */}
       {/* TOP NAVBAR */}
<div className="fixed top-0 left-[280px] right-0 z-40 backdrop-blur-xl bg-white/90 border-b border-gray-200 px-10 py-5 shadow-sm">
  
  <div className="flex items-center justify-between">

    {/* LEFT */}
    <div>
      <h1 className="text-4xl font-black text-gray-900">
        Products Calculation
      </h1>

      <p className="text-gray-500 mt-1">
        Manage all financial product calculations.
      </p>
    </div>

    {/* RIGHT PROFILE */}
    <button
      onClick={() => setProfileOpen(true)}
      className="flex items-center gap-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 shadow-sm transition-all hover:shadow-md"
    >
      <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 flex items-center justify-center shadow-lg">
        <UserCircle2 className="text-white" size={28} />
      </div>

      <div className="text-left hidden sm:block">
        <h4 className="text-sm font-bold text-gray-900 leading-none">
          {profileForm.name || "Admin User"}
        </h4>

        <p className="text-xs text-gray-500 mt-1">
          Dashboard Manager
        </p>
      </div>
    </button>

  </div>
</div>
        {/* </div> */}

        {/* CONTENT */}
<div className="p-10">

  {/* SEARCH + BUTTONS */}
  <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 mb-8">

    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">

      {/* SEARCH */}
      <div className="w-full lg:w-[420px]">
        <p className="text-sm text-gray-500 mb-3">
          Search Product
        </p>

        <input
          type="text"
          placeholder="Search product calculations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-14 rounded-2xl border border-gray-200 px-5 focus:outline-none focus:ring-4 focus:ring-orange-200 text-gray-800"
        />
      </div>

      {/* BUTTONS */}
     <div className="flex flex-wrap items-center gap-3">
      <button
    onClick={() => setOpenModal(true)}
    className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:opacity-90 text-white font-bold shadow-xl transition-all hover:scale-[1.03]"
  >
    + Add Product
  </button>

  {/* Export Dropdown */}
  <div className="relative group">
    <button
      className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold shadow-lg transition-all hover:scale-[1.03] flex items-center gap-2"
      disabled={calculations.length === 0}
    >
      Export
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>

    {/* Dropdown Menu */}
    <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-2xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
      
      <button
        onClick={exportToExcel}
        disabled={calculations.length === 0}
        className="w-full text-left px-4 py-3 hover:bg-emerald-50 text-slate-700 font-medium transition flex items-center gap-2"
      >
        📊 Export Excel
      </button>

      <button
        onClick={exportToPdf}
        disabled={calculations.length === 0}
        className="w-full text-left px-4 py-3 hover:bg-red-50 text-slate-700 font-medium transition flex items-center gap-2"
      >
        <FileDown size={16} />
        Export PDF
      </button>
    </div>
  </div>

  {/* Add Product */}
  

</div>

    </div>
  


            {/* <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-6 shadow-xl text-white">
              <p className="text-sm opacity-80">
                Total Records
              </p>

              <h2 className="text-4xl font-black mt-2">
                {filteredCalculations.length}
              </h2>
            </div>

            <div className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] rounded-3xl p-6 shadow-xl text-white">
              <p className="text-sm opacity-80">
                Current Page
              </p>

              <h2 className="text-4xl font-black mt-2">
                {currentPage}
              </h2>
            </div> */}
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-[30px] shadow-xl border border-gray-200 overflow-hidden">

            <div className="overflow-x-auto">
              <table className="min-w-[1700px] w-full">

                <thead className="sticky top-0 z-20">

                  <tr className="bg-[#0f172a] text-white text-sm">
                    <th colSpan={7} className="p-5 border border-slate-700 font-bold">
                      INPUT PRICING
                    </th>

                    <th colSpan={7} className="p-5 border border-slate-700 font-bold">
                      OUTPUT PRICING
                    </th>

                    <th colSpan={3} className="p-5 border border-slate-700 font-bold">
                      PROFIT
                    </th>

                    <th colSpan={2} className="p-5 border border-slate-700 font-bold">
                      EXPENSE
                    </th>

                    <th colSpan={4} className="p-5 border border-slate-700 font-bold">
                      TAX & FINAL
                    </th>
                  </tr>

                  <tr className="bg-slate-100 text-slate-800 text-sm">
                    {[
                      "SR.NO",
                      "PRODUCT NAME",
                      "I/P PRICE",
                      "GST",
                      "UNIT WITH GST",
                      "QTY",
                      "TOTAL I/P PRICE",

                      "SR.NO",
                      "PRODUCT NAME",
                      "O/P PRICE",
                      "GST",
                      "UNIT WITH GST",
                      "QTY",
                      "TOTAL O/P PRICE",

                      "PROFIT",
                      "GST PAYABLE",
                      "NET PROFIT",

                    
                      "TOTAL NET PAY",
                      "SHOW ALL EXPENSES",

                       "INCOME TAX %",
                      "FINAL INCOME TAX",
                      "FINAL PROFIT",
                      "ACTION",
                    ].map((head, i) => (
                      <th
                        key={i}
                        className="p-4 border border-gray-300 whitespace-nowrap font-bold"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="25"
                        className="text-center py-20 text-gray-500 text-lg"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : filteredCalculations.length === 0 ? (
                    <tr>
                      <td
                        colSpan="2"
                        className="text-center py-20 text-gray-400 text-lg"
                      >
                        No Data Found
                      </td>
                    </tr>
                  ) : (
                    paginatedCalculations.map((item, index) => (
                      <tr
                        key={item._id || index}
                        className="hover:bg-orange-50/40 transition-all duration-200"
                      >
                        <td className="p-4 border border-gray-200 font-semibold">
                          {startIndex + index + 1}
                        </td>

                        <td className="p-4 border border-gray-200 font-semibold">
                          {item.product_name_buy}
                        </td>

                        <td className="p-4 border border-gray-200">
                          {item.buy_amount}
                        </td>

                        <td className="p-4 border border-gray-200">
                          {item.buy_gst_percentage}
                        </td>

                        <td className="p-4 border border-gray-200">
                          {item.buy_unit_price}
                        </td>

                        <td className="p-4 border border-gray-200">
                          {item.buy_quantity}
                        </td>

                        <td className="p-4 border border-orange-200 bg-orange-50 font-bold text-orange-700">
                          {item.buy_total}
                        </td>

                        <td className="p-4 border border-gray-200">
                          {index + 1}
                        </td>

                        <td className="p-4 border border-gray-200 font-semibold">
                          {item.product_name_sell}
                        </td>

                        <td className="p-4 border border-gray-200">
                          {item.sell_amount}
                        </td>

                        <td className="p-4 border border-gray-200">
                          {item.sell_gst_percentage}
                        </td>

                        <td className="p-4 border border-gray-200">
                          {item.sell_unit_price}
                        </td>

                        <td className="p-4 border border-gray-200">
                          {item.sell_quantity}
                        </td>

                        <td className="p-4 border border-orange-200 bg-orange-50 font-bold text-orange-700">
                          {item.sell_total}
                        </td>

                        <td className="p-4 border border-orange-200 bg-orange-50 font-bold text-orange-700">
                          {item.profit}
                        </td>

                        <td className="p-4 border border-red-200 bg-red-50 font-bold text-red-600">
                          {item.gst_payable}
                        </td>

                        <td className="p-4 border border-green-200 bg-green-50 font-bold text-green-700">
                          {item.net_profit}
                        </td>

                       {/* <td className="p-4 border border-gray-200 align-top">
  <div className="space-y-2">
    {item.expenses?.length > 0 ? (
      item.expenses.map((exp, idx) => (
        <div
          key={idx}
          className="bg-slate-50 rounded-lg px-3 py-2"
        >
          {exp.expense_particulars || "-"}
        </div>
      ))
    ) : (
      "-"
    )}
  </div>
</td> */}

{/* <td className="p-4 border border-gray-200 align-top">
  <div className="space-y-2">
    {item.expenses?.length > 0 ? (
      item.expenses.map((exp, idx) => (
        <div
          key={idx}
          className="bg-blue-50 text-blue-700 rounded-lg px-3 py-2 font-semibold text-center"
        >
          {exp.expense_spc_percentage || 0}%
        </div>
      ))
    ) : (
      "-"
    )}
  </div>
</td> */}
<td className="p-4 border border-gray-200 bg-gray-50 font-bold text-center">
  {item.total_expense_amount || 0}
</td>
                        <td className="p-4 border border-gray-200 text-center">
                          <button
                            onClick={() => {
                             setSelectedExpenses(item.expenses || []);

                              setExpenseModalOpen(true);
                            }}
                            disabled={
                              !item.expenses ||
                              item.expenses.length <= 1
                            }
                            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                              item.expenses?.length > 1
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            View (
                            {Math.max(
                              (item.expenses?.length || 0),
                              0
                            )}
                            )
                          </button>
                        </td>
<td className="p-4 border border-gray-200">
  {item.income_tax_percentage || 0}%
</td>
                        <td className="p-4 border border-red-200 bg-red-50 font-bold text-red-600">
                          {item.income_tax}
                        </td>

                        <td className="p-4 border border-orange-200 bg-orange-50 font-bold text-orange-700">
                          {item.final_profit}
                        </td>

                       <td className="p-4 border border-gray-200">
  <div className="flex items-center justify-center gap-4">

    {/* EDIT */}
    <button
      onClick={() => {
        setSelectedItem(item);
        setEditOpen(true);
      }}
      className="text-blue-600 hover:text-blue-800 transition-all"
    >
      <Pencil size={18} strokeWidth={2} />
    </button>

    {/* DELETE */}
    <button
      onClick={() =>
        handleDelete(
          item.sku_id ||
          item.id ||
          item._id
        )
      }
      className="text-red-500 hover:text-red-700 transition-all"
    >
      <Trash2 size={18} strokeWidth={2} />
    </button>

    {/* EXCEL */}
    <button
      onClick={() => downloadSingleExcel(item)}
      className="text-green-600 hover:text-green-800 transition-all"
    >
      <FileSpreadsheet size={18} strokeWidth={2} />
    </button>

  </div>
</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="flex items-center justify-between px-8 py-5 border-t bg-slate-50">
              
              <div className="text-sm text-gray-600 font-medium">
                Showing {startIndex + 1} to{" "}
                {Math.min(
                  endIndex,
                  filteredCalculations.length
                )}{" "}
                of {filteredCalculations.length} entries
              </div>

              <div className="flex items-center gap-2">

                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.max(prev - 1, 1)
                    )
                  }
                  disabled={currentPage === 1}
                  className="px-5 py-2 rounded-xl bg-white border hover:bg-gray-100 disabled:opacity-50"
                >
                  Previous
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        setCurrentPage(i + 1)
                      }
                      className={`h-11 w-11 rounded-xl font-bold transition-all ${
                        currentPage === i + 1
                          ? "bg-orange-500 text-white shadow-lg"
                          : "bg-white border hover:bg-gray-100"
                      }`}
                    >
                      {i + 1}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, totalPages)
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="px-5 py-2 rounded-xl bg-white border hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    ) : (
     <main className="flex-1 ml-[280px] pt-[95px] overflow-auto min-h-screen">

  {/* TOP NAVBAR (same style as Product Calculations) */}
 <div className="fixed top-0 left-[280px] right-0 z-40 backdrop-blur-xl bg-white/90 border-b border-gray-200 px-10 py-5 shadow-sm">
    <div className="flex items-center justify-between">

      {/* LEFT */}
      <div>
        <h1 className="text-4xl font-black text-gray-900">
          Multi Product 
        </h1>

        <p className="text-gray-500 mt-1">
          Create and manage multi-product calculation sheets.
        </p>
      </div>

      {/* RIGHT (optional: keep profile same OR remove if not needed) */}
      <button
        onClick={() => setProfileOpen(true)}
        className="flex items-center gap-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 shadow-sm transition-all hover:shadow-md"
      >
        <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 flex items-center justify-center shadow-lg">
          <UserCircle2 className="text-white" size={28} />
        </div>

        <div className="text-left hidden sm:block">
          <h4 className="text-sm font-bold text-gray-900 leading-none">
            {profileForm.name || "Admin User"}
          </h4>

          <p className="text-xs text-gray-500 mt-1">
            Dashboard Manager
          </p>
        </div>
      </button>

    </div>
  </div>

  {/* CONTENT */}
  <div className="p-10">
    <div className="bg-white rounded-[30px] shadow-2xl border border-gray-200 p-8">
      <MultiProductSKUCalculation />
    </div>
  </div>

</main>
    )}

    {/* MODALS */}
    {activeMenu === "Product Calculations" && (
      <>
        <AddCalculationModal
  open={openModal}
  onClose={() => setOpenModal(false)}
  onSuccess={fetchCalculations}
/>

        <EditCalculationModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          initialData={selectedItem}
          onUpdated={() => {
            fetchCalculations();
          }}
        />
      </>
    )}

    <ExpenseViewModal
      open={expenseModalOpen}
      onClose={() => setExpenseModalOpen(false)}
      expenses={selectedExpenses}
    />
    {/* PROFILE SLIDER */}
<div
  className={`fixed top-0 right-0 h-full w-[380px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
    profileOpen ? "translate-x-0" : "translate-x-full"
  }`}
>
  {/* HEADER */}
 {/* <div className="flex items-center justify-end border-b border-gray-200"> */}
 <div className="w-full flex justify-end">
  <button
    onClick={() => setProfileOpen(false)}
    className="h-10 w-10 rounded-xl hover:bg-red-50 text-gray-500 hover:text-red-500 flex items-center justify-center transition-all"
  >
    <X size={20} />
  </button>
</div>


  {/* CONTENT */}
  <div className="p-6 flex flex-col items-center">

    <div className="h-28 w-28 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 flex items-center justify-center shadow-xl mb-5">
      <UserCircle2 size={70} className="text-white" />
    </div>

    {/* NAME + ACTION */}
    <div className="flex items-center gap-3 mb-2">
      <h3 className="text-2xl font-bold text-gray-900">
        {profileForm.name || "Admin User"}
      </h3>

      {!profileEdit ? (
        <button
          onClick={() => setProfileEdit(true)}
          className="p-2 rounded-xl bg-orange-100 hover:bg-orange-200 transition"
        >
          <Pencil size={16} className="text-orange-600" />
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={handleProfileSave}
            className="p-2 rounded-xl bg-green-100 hover:bg-green-200 transition"
          >
            <Save size={16} className="text-green-600" />
          </button>

          <button
            onClick={() => setProfileEdit(false)}
            className="p-2 rounded-xl bg-red-100 hover:bg-red-200 transition"
          >
            <X size={16} className="text-red-600" />
          </button>
        </div>
      )}
    </div>

    <p className="text-gray-500 mb-8">
      Dashboard Manager
    </p>

    {/* DETAILS */}
    <div className="w-full space-y-5">

      {/* NAME */}
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
        <p className="text-sm text-gray-500 mb-2">
          Full Name
        </p>

        {profileEdit ? (
          <input
            type="text"
            value={profileForm.name}
            onChange={(e) =>
              setProfileForm({
                ...profileForm,
                name: e.target.value,
              })
            }
            className="w-full h-12 rounded-xl border border-gray-300 px-4 focus:outline-none focus:ring-4 focus:ring-orange-200"
          />
        ) : (
          <h4 className="text-lg font-semibold text-gray-900">
            {profileForm.name}
          </h4>
        )}
      </div>

      {/* EMAIL */}
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
        <p className="text-sm text-gray-500 mb-2">
          Email Address
        </p>

        {profileEdit ? (
          <input
            type="email"
            value={profileForm.email}
            onChange={(e) =>
              setProfileForm({
                ...profileForm,
                email: e.target.value,
              })
            }
            className="w-full h-12 rounded-xl border border-gray-300 px-4 focus:outline-none focus:ring-4 focus:ring-orange-200"
          />
        ) : (
          <h4 className="text-lg font-semibold text-gray-900">
            {profileForm.email}
          </h4>
        )}
      </div>

      {/* PHONE */}
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
        <p className="text-sm text-gray-500 mb-2">
          Mobile Number
        </p>

        {profileEdit ? (
          <input
            type="text"
            value={profileForm.phone}
            onChange={(e) =>
              setProfileForm({
                ...profileForm,
                phone: e.target.value,
              })
            }
            className="w-full h-12 rounded-xl border border-gray-300 px-4 focus:outline-none focus:ring-4 focus:ring-orange-200"
          />
        ) : (
          <h4 className="text-lg font-semibold text-gray-900">
            {profileForm.phone}
          </h4>
        )}
      </div>
    </div>

    {/* LOGOUT */}
    <button
      onClick={handleLogout}
      className="mt-10 w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg transition-all hover:scale-[1.02]"
    >
      Logout
    </button>
  </div>
</div>

{/* OVERLAY */}
{profileOpen && (
  <div
    onClick={() => setProfileOpen(false)}
    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
  />
)}
  </div>
);
}