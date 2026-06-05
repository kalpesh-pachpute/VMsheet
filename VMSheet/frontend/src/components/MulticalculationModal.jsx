import React, { useEffect, useMemo, useState } from "react";
import {
  createMultiSKUCalculationSheet,
  deleteMultiSKUExpense,
  deleteMultiSKUItem,
  getAllMultiSKUCalculationSheets,
  updateMultiSKUCalculationSheet,
} from "../api/multiCalculationApi";
// import { NavLink } from "react-router-dom";
import { X, Download, Edit2, Trash2, FileDown } from "lucide-react";
import XLSX from "xlsx-js-style";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const emptyProduct = () => ({ name: "", amount: "", gst: 0, quantity: "" });
const emptyDraft = () => ({
  sheet_name: "",
  buy: emptyProduct(),
  sell: emptyProduct(),
  expense_particulars: "",
  expense_spc_percentage: 0,
  income_tax_percentage: 0,
});
const emptyExpenseEntry = () => ({ particulars: "", percentage: "" });

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

/** PDF standard fonts often lack ₹; keep values aligned with on-screen INR amounts. */
const formatCurrencyPdf = (value) => {
  const n = Number(value || 0);
  return `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) return 0;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    // Remove % symbol if present
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

const formatSpcPercentPdf = (pct) => {
  const s = toNumber(pct)
    .toFixed(7)
    .replace(/0+$/, "")
    .replace(/\.$/, "");
  return `${s === "" ? "0" : s}%`;
};

const calculateUnitPrice = (amount, gst) => {
  const gstAmount = (toNumber(amount) * toNumber(gst)) / 100;
  return toNumber(amount) + gstAmount;
};

const calculateTotal = (unitPrice, quantity) => {
  return toNumber(unitPrice) * toNumber(quantity);
};

const buildSheetSaveItems = (productItems, expenseEntries, incomeTaxPercentage) => {
  const saveProducts = productItems.map((item) => ({
    ...(item.multi_sku_item_id && { multi_sku_item_id: item.multi_sku_item_id }),
    buy: {
      name: item.buy.name || "",
      amount: toNumber(item.buy.amount),
      gst: toNumber(item.buy.gst),
      quantity: toNumber(item.buy.quantity),
    },
    sell: {
      name: item.sell.name || "",
      amount: toNumber(item.sell.amount),
      gst: toNumber(item.sell.gst),
      quantity: toNumber(item.sell.quantity),
    },
    expense_particulars: item.expense_particulars || "",
    expense_spc_percentage: toNumber(item.expense_spc_percentage),
    income_tax_percentage: toNumber(item.income_tax_percentage),
  }));

  const saveExpenses = expenseEntries
    .filter((entry) => entry.particulars || entry.percentage)
    .filter(
      (entry) =>
        String(entry.particulars || "").trim().toLowerCase() !== "income tax"
    )
    .map((entry) => ({
      buy: { name: "", amount: 0, gst: 0, quantity: 0 },
      sell: { name: "", amount: 0, gst: 0, quantity: 0 },
      expense_particulars: entry.particulars || "",
      expense_spc_percentage: toNumber(entry.percentage),
      income_tax_percentage: 0,
    }));

  const taxRows = toNumber(incomeTaxPercentage) !== 0
    ? [
        {
          buy: { name: "", amount: 0, gst: 0, quantity: 0 },
          sell: { name: "", amount: 0, gst: 0, quantity: 0 },
          expense_particulars: "Income Tax",
          expense_spc_percentage: 0,
          income_tax_percentage: toNumber(incomeTaxPercentage),
        },
      ]
    : [];

  return [...saveProducts, ...saveExpenses, ...taxRows];
};

const getPreviewTotals = (preview) => {
const totals = preview?.totals || {};

return {
totalBuyTotal:
totals.totalBuyTotal ??
totals.total_buy_total ??
0,
totalSellTotal:
  totals.totalSellTotal ??
  totals.total_sell_total ??
  0,

totalProfit:
  totals.totalProfit ??
  totals.total_profit ??
  0,

totalGSTPayable:
  totals.totalGSTPayable ??
  totals.total_gst_payable ??
  0,

totalNetProfit:
  totals.totalNetProfit ??
  totals.total_net_profit ??
  0,

expense_amount:
  totals.expense_amount ??
  totals.total_expense_amount ??
  0,

income_tax:
  totals.income_tax ??
  totals.total_income_tax ??
  0,

final_profit:
  totals.final_profit ??
  totals.total_final_profit ??
  0,
  // ✅ ADD THESE (VERY IMPORTANT)
  totalBuyingAmount:
    totals.totalBuyingAmount ??
    totals.total_buying_amount ??
    0,

  totalBuyingUnitPrice:
    totals.totalBuyingUnitPrice ??
    totals.total_buying_unit_price ??
    0,

  totalSellingAmount:
    totals.totalSellingAmount ??
    totals.total_selling_amount ??
    0,

  totalSellingUnitPrice:
    totals.totalSellingUnitPrice ??
    totals.total_selling_unit_price ??
    0,
};
};


const MultiProductSKUCalculation = () => {
  const [sheets, setSheets] = useState([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [activeSheetId, setActiveSheetId] = useState(null);
  const [activeSheetName, setActiveSheetName] = useState("");
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  // const [draftLoading, setDraftLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [modalDrafts, setModalDrafts] = useState([emptyDraft()]);
  const [currentDraftIndex, setCurrentDraftIndex] = useState(0);
  // const [draftPreview, setDraftPreview] = useState(null);
  const [expenseEntries, setExpenseEntries] = useState([emptyExpenseEntry()]);
  const [globalIncomeTaxPercentage, setGlobalIncomeTaxPercentage] = useState("");
  const [activeModalTab, setActiveModalTab] = useState("product");
  const [saving, setSaving] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const buildSheetState = (sheet) => {
    const productRows = (sheet.items || [])
      .filter((item) => item.product_name_buy || item.product_name_sell)
      .map((item) => ({
        multi_sku_item_id: item.multi_sku_item_id,
        buy: {
          name: item.product_name_buy || "",
          amount: item.buy_amount || 0,
          gst: item.buy_gst_percentage || 0,
          quantity: item.buy_quantity || 0,
        },
        sell: {
          name: item.product_name_sell || "",
          amount: item.sell_amount || 0,
          gst: item.sell_gst_percentage || 0,
          quantity: item.sell_quantity || 0,
        },
      }));
const expenseEntries = (sheet.expenses || []).map((expense) => {
  return {
    
    multi_sku_expense_id:
  expense.multi_expense_id ||
  expense.multi_sku_expense_id ||
  expense.id ||
  expense._id,   // 🔥 IMPORTANT FIX

    particulars: expense.expense_particulars || "",

    percentage:
      expense.expense_spc_percentage !== null &&
      expense.expense_spc_percentage !== undefined
        ? String(expense.expense_spc_percentage).trim()
        : "",

    amount: expense.expense_amount || 0,
    
  };
});

   const taxPctRaw = sheet?.profit?.income_tax_percentage;

const globalTaxStr =
  taxPctRaw !== null &&
  taxPctRaw !== undefined &&
  taxPctRaw !== ""
    ? String(taxPctRaw).trim().replace(",", ".")
    : "";

    return {
      multi_sku_sheet_id: sheet.multi_sku_sheet_id,
      sheet_name: sheet.sheet_name || "",
      items: productRows,
      expenseEntries: expenseEntries.length ? expenseEntries : [emptyExpenseEntry()],
      globalIncomeTaxPercentage: globalTaxStr,
     preview: {
rows: sheet.items || [],

expenseRows: (sheet.expenses || []).map((expense) => ({
particulars: expense.expense_particulars || "",
percentage: expense.expense_spc_percentage || 0,
amount: expense.expense_amount || 0,
})),

totals: sheet.totals || {},
},

    };
  };

  const setActiveSheetState = (sheet) => {
    setActiveSheetId(sheet.multi_sku_sheet_id || null);
    setActiveSheetName(sheet.sheet_name || "");
    setItems(sheet.items || []);
    setExpenseEntries(sheet.expenseEntries || [emptyExpenseEntry()]);
    setGlobalIncomeTaxPercentage(
      sheet.globalIncomeTaxPercentage === null ||
        sheet.globalIncomeTaxPercentage === undefined
        ? ""
        : String(sheet.globalIncomeTaxPercentage)
    );
    setPreview(sheet.preview || null);
    setEditIndex(null);
    setShowForm(false);
    setModalDrafts([emptyDraft()]);
    setCurrentDraftIndex(0);
    setDraft(emptyDraft());
    // setDraftPreview(null);
    setActiveModalTab("product");
  };

  const resetSheetEditor = () => {
    setActiveSheetId(null);
    setActiveSheetName("New Sheet");
    setItems([]);
    setExpenseEntries([emptyExpenseEntry()]);
    setGlobalIncomeTaxPercentage("");
    setPreview(null);
    setEditIndex(null);
    setShowForm(false);
    setModalDrafts([emptyDraft()]);
    setCurrentDraftIndex(0);
    setDraft(emptyDraft());
    // setDraftPreview(null);
    setActiveModalTab("product");
  };

  const loadSavedSheets = async (selectedSheetId = null) => {
    try {
      setLoading(true);
      const response = await getAllMultiSKUCalculationSheets();
      const loadedSheets = response.data?.map(buildSheetState) || [];
      setSheets(loadedSheets);

      if (loadedSheets.length > 0) {
        const selectedIndex = selectedSheetId
          ? loadedSheets.findIndex((sheet) => sheet.multi_sku_sheet_id === selectedSheetId)
          : 0;
        const indexToUse = selectedIndex >= 0 ? selectedIndex : 0;
        setActiveSheetIndex(indexToUse);
        setActiveSheetState(loadedSheets[indexToUse]);
      } else {
        resetSheetEditor();
      }
    } catch (error) {
      console.error("Error loading multi SKU calculation sheets:", error);
      resetSheetEditor();
    } finally {
      setLoading(false);
    }
  };

  const expensePreviewRows = useMemo(() => {
    return (preview?.expenseRows || []).filter(
      (row) =>
        row.particulars &&
        row.particulars.toString().trim().toLowerCase() !== "income tax"
    );
  }, [preview]);

  const tableExpenseRows = expenseEntries.map((entry, index) => ({
  entry: {
    ...entry,
    multi_sku_expense_id:
      entry.multi_sku_expense_id || entry.id || entry.expense_id,
  },
  fullIndex: index,
}));

  const previewTotals = useMemo(() => getPreviewTotals(preview), [preview]);

  const hasExpenseOrTaxInForm = useMemo(
    () =>
      expenseEntries.some(
        (e) =>
          String(e.particulars || "").trim() !== "" ||
          e.percentage !== "" ||
          toNumber(e.percentage) !== 0
      ) || toNumber(globalIncomeTaxPercentage) !== 0,
    [expenseEntries, globalIncomeTaxPercentage]
  );

  /** Do not hide the whole sheet UI when there are no product rows but expenses / tax / saved sheet exist. */
  const showCalculationWorkspace =
    items.length > 0 || hasExpenseOrTaxInForm || Boolean(activeSheetId);

  const saveItemsCount = useMemo(
    () => buildSheetSaveItems(items, expenseEntries, globalIncomeTaxPercentage).length,
    [items, expenseEntries, globalIncomeTaxPercentage]
  );
  const [currentSheetPage, setCurrentSheetPage] = useState(1);

const sheetsPerPage = 10;

const totalSheetPages = Math.ceil(sheets.length / sheetsPerPage);

const paginatedSheets = sheets.slice(
  (currentSheetPage - 1) * sheetsPerPage,
  currentSheetPage * sheetsPerPage
);

  /** New sheet wizard: one save merges Product + Expenses + Income Tax. Updates keep per-tab saves. */
  const isCreateNewMultiSheet = !activeSheetId && editIndex === null;

  useEffect(() => {
    loadSavedSheets();
  }, []);


  const updateDraftProduct = (section, field, value) => {
    setDraft((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateDraftField = (field, value) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const closeModal = () => {
    setShowForm(false);
    setDraft(emptyDraft());
    setModalDrafts([emptyDraft()]);
    setCurrentDraftIndex(0);
    // setDraftPreview(null);
    setActiveModalTab("product");
    setEditIndex(null);
  };

  const loadDraftAtIndex = (targetIndex, draftsToUse = modalDrafts) => {
    const nextDraft = draftsToUse[targetIndex] || emptyDraft();
    setCurrentDraftIndex(targetIndex);
    setDraft(JSON.parse(JSON.stringify(nextDraft)));
    // setDraftPreview(null);
  };

  const handleNextDraft = () => {
    const updatedDrafts = [...modalDrafts];
    updatedDrafts[currentDraftIndex] = JSON.parse(JSON.stringify(draft));

    if (currentDraftIndex === updatedDrafts.length - 1) {
      updatedDrafts.push({ ...emptyDraft(), sheet_name: draft.sheet_name || activeSheetName || "" });
    }

    setModalDrafts(updatedDrafts);
    loadDraftAtIndex(currentDraftIndex + 1, updatedDrafts);
  };

  const handlePreviousDraft = () => {
    if (currentDraftIndex === 0) {
      return;
    }

    const updatedDrafts = [...modalDrafts];
    updatedDrafts[currentDraftIndex] = JSON.parse(JSON.stringify(draft));
    setModalDrafts(updatedDrafts);
    loadDraftAtIndex(currentDraftIndex - 1, updatedDrafts);
  };

  const updateExpenseEntry = (index, field, value) => {
    let finalValue = value;
    // For percentage field, remove % symbol if present
    if (field === "percentage") {
      finalValue = String(value).replace("%", "").trim();
    }
    setExpenseEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: finalValue };
      return next;
    });
  };

  const addExpenseEntry = () => {
    setExpenseEntries((prev) => [...prev, emptyExpenseEntry()]);
  };
  

 
  const handleAddItem = (e) => {
    e.preventDefault();

    const sheetName = draft.sheet_name.trim() || activeSheetName.trim();
    if (
  editIndex !== null &&
  sheetName !== originalSheetName
) {
  setActiveSheetName(sheetName);
}

if (!sheetName) {
  alert("Please enter a sheet name before saving.");
  return;
}

// Check duplicate sheet name only when creating a new sheet
if (isCreateNewMultiSheet) {
  const isDuplicateSheet = sheets.some(
    (sheet) =>
      sheet.sheet_name?.trim().toLowerCase() ===
      sheetName.trim().toLowerCase()
  );

  if (isDuplicateSheet) {
    alert(`You already have a sheet named "${sheetName}". Please use a different sheet name.`);
    return;
  }
} 
// Existing sheet
// Save current draft into modalDrafts first
const updatedDrafts = [...modalDrafts];
updatedDrafts[currentDraftIndex] = JSON.parse(JSON.stringify(draft));

// Collect ALL valid drafts
const validDrafts = updatedDrafts.filter(
  (item) =>
    item.buy?.name ||
    item.buy?.amount ||
    item.buy?.quantity ||
    item.sell?.name ||
    item.sell?.amount ||
    item.sell?.quantity
);

const cleanDrafts = validDrafts.map((item) => {
  const clone = JSON.parse(JSON.stringify(item));
  delete clone.sheet_name;
  return clone;
});

let updatedItems;

if (editIndex !== null) {
  updatedItems = items.map((item, idx) =>
    idx === editIndex ? cleanDrafts[0] : item
  );
} else {
  // ADD ALL DRAFTS, not only last draft
  updatedItems = [...items, ...cleanDrafts];
}

setItems(updatedItems);

    if (activeSheetName.trim() !== sheetName) {
      setActiveSheetName(sheetName);
    }

    if (isCreateNewMultiSheet) {
      const updatedDrafts = [...modalDrafts];
      updatedDrafts[currentDraftIndex] = JSON.parse(JSON.stringify(draft));

      const validDrafts = updatedDrafts.filter(
        (item) =>
          item.buy.name ||
          item.buy.amount ||
          item.buy.quantity ||
          item.sell.name ||
          item.sell.amount ||
          item.sell.quantity
      );

      if (validDrafts.length === 0) {
        alert("Please enter at least one product before saving.");
        return;
      }

      const cleanDrafts = validDrafts.map((item) => {
        const clone = JSON.parse(JSON.stringify(item));
        delete clone.sheet_name;
        return clone;
      });

      const nextItems = [...items, ...cleanDrafts];

      const saveItems = buildSheetSaveItems(
        nextItems,
        expenseEntries,
        globalIncomeTaxPercentage
      );
      if (saveItems.length === 0) {
        alert(
          "Please add at least one product row or expense entry (or income tax %) before saving."
        );
        return;
      }

      const previousItems = items;
      setItems(nextItems);
      persistSheetChanges(nextItems, { sheetName })
        .then(() => closeModal())
        .catch((error) => {
          console.error("Error saving new multi-product sheet:", error);
          setItems(previousItems);
          alert("Failed to save. Please try again.");
        });
      return;
    }

    /**
     * Existing sheet only: Expense / Tax tabs save without merging product drafts.
     */
    if (activeModalTab === "expense" || activeModalTab === "tax") {
      const saveItems = buildSheetSaveItems(
        items,
        expenseEntries,
        globalIncomeTaxPercentage
      );
      if (saveItems.length === 0) {
        alert(
          "Please add at least one product row or expense entry (or income tax %) before saving."
        );
        return;
      }

    persistSheetChanges(updatedItems, { sheetName })
  .then(() => {
    closeModal();
  })
  .catch((error) => {
    console.error(error);
  })
        .catch((error) => {
          console.error("Error saving expense or tax from modal:", error);
          alert("Failed to save. Please try again or use Save Sheet.");
        });
      return;
      }

   if (activeSheetId) {
  persistSheetChanges(updatedItems, {
    sheetName,
  }).catch((error) => {
    console.error(error);
  });
}

    closeModal();
  };

  const persistSheetChanges = async (nextItems, options = {}) => {
    const nameFromOptions =
      options.sheetName !== undefined && options.sheetName !== null
        ? String(options.sheetName).trim()
        : "";
    const requestBody = {
      sheet_name: nameFromOptions || activeSheetName || "Multi Product Sheet",
      items: buildSheetSaveItems(nextItems, expenseEntries, globalIncomeTaxPercentage),
    };

    try {
      if (activeSheetId) {
        const response = await updateMultiSKUCalculationSheet(activeSheetId, requestBody);
        if (response?.data?.rows && response?.data?.totals) {
          setPreview({
            rows: response.data.rows,
            expenseRows: response.data.expenseRows || [],
            totals: response.data.totals,
          });
        }
        await loadSavedSheets(activeSheetId);
        return;
      }

      const response = await createMultiSKUCalculationSheet(requestBody);
      const newSheetId = response.data?.multi_sku_sheet_id || null;
      setActiveSheetId(newSheetId);
      if (response?.data?.rows && response?.data?.totals) {
        setPreview({
          rows: response.data.rows,
          expenseRows: response.data.expenseRows || [],
          totals: response.data.totals,
        });
      }
      await loadSavedSheets(newSheetId);
    } catch (error) {
      const statusCode = error?.status || error?.response?.status;
      const rawErrorText =
        typeof error === "string"
          ? error
          : typeof error?.response?.data === "string"
          ? error.response.data
          : error?.message || error?.response?.data?.message || "";

      // If update fails because the sheet doesn't exist anymore, recreate it.
      if (
        activeSheetId &&
        (statusCode === 404 ||
          /not found/i.test(rawErrorText) ||
          /cannot put/i.test(rawErrorText) ||
          /404/i.test(rawErrorText))
      ) {
        const recreateResponse = await createMultiSKUCalculationSheet(requestBody);
        const recreatedSheetId = recreateResponse.data?.multi_sku_sheet_id || null;
        setActiveSheetId(recreatedSheetId);
        if (recreateResponse?.data?.rows && recreateResponse?.data?.totals) {
          setPreview({
            rows: recreateResponse.data.rows,
            expenseRows: recreateResponse.data.expenseRows || [],
            totals: recreateResponse.data.totals,
          });
        }
        await loadSavedSheets(recreatedSheetId);
        return;
      }

      throw error;
    }
  };

 const handleDeleteItem = async (index) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this product?"
  );

  if (!confirmDelete) return;

  try {
    const itemToDelete = items[index];

    // CALL NEW DELETE PRODUCT API
    if (itemToDelete?.multi_sku_item_id) {
      await deleteMultiSKUItem(
        itemToDelete.multi_sku_item_id
      );
    }

    // REMOVE FROM FRONTEND STATE IMMEDIATELY
    const updatedItems = items.filter(
      (_, idx) => idx !== index
    );

    setItems(updatedItems);

    // UPDATE PREVIEW ALSO
    setPreview((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        rows: (prev.rows || []).filter(
          (_, idx) => idx !== index
        ),
      };
    });

    // OPTIONAL REFRESH FROM BACKEND
    if (activeSheetId) {
      await loadSavedSheets(activeSheetId);
    }
  } catch (error) {
    console.error("Error deleting item:", error);
    alert("Failed to delete product.");
  }
};
const handleDeleteExpense = async (entry, index) => {

  const confirmDelete = window.confirm(
    "Are you sure you want to delete this expense?"
  );

  if (!confirmDelete) {
    return;
  }

  const expenseId =
    entry?.multi_expense_id ||
    entry?.multi_sku_expense_id ||
    entry?.expense_id ||
    entry?.id ||
    entry?._id;

  console.log("DELETE EXPENSE ID:", expenseId, entry);

  const updated = expenseEntries.filter((_, i) => i !== index);
  setExpenseEntries(updated);

  if (!expenseId) {
    console.warn("Expense not in DB yet, removed locally only");
    return;
  }

  try {
    const res = await deleteMultiSKUExpense(expenseId);
    console.log("Delete response:", res);

    if (activeSheetId) {
      await loadSavedSheets(activeSheetId);
    }
  } catch (error) {
    console.error("Delete expense failed:", error);

    alert("Failed to delete expense from server");

    setExpenseEntries(expenseEntries);
  }
};
const removeExpenseEntry = (index) => {
  setExpenseEntries((prev) => {
    const updated = prev.filter((_, i) => i !== index);

    // Optional: always keep at least 1 empty row
    return updated.length > 0 ? updated : [emptyExpenseEntry()];
  });
};

  
  const [originalSheetName, setOriginalSheetName] = useState("");
  
 const handleEditItem = (index) => {
  const item = items[index];

  const currentSheetName =
    sheets[activeSheetIndex]?.sheet_name ||
    activeSheetName ||
    "";

  setOriginalSheetName(currentSheetName);

  const itemWithSheetName = {
    ...JSON.parse(JSON.stringify(item)),
    sheet_name: currentSheetName,
  };

  setEditIndex(index);
  setShowForm(true);
  setActiveModalTab("product");
  setModalDrafts([itemWithSheetName]);
  setCurrentDraftIndex(0);
  setDraft(itemWithSheetName);
};

  const handleSaveSheet = async () => {
    if (!activeSheetName.trim()) {
      alert("Please enter a sheet name before saving.");
      return;
    }

    const saveItems = buildSheetSaveItems(
      items,
      expenseEntries,
      globalIncomeTaxPercentage
    );
    if (saveItems.length === 0) {
      alert(
        "Please add at least one product row or expense entry (or income tax %) before saving."
      );
      return;
    }

    try {
      setSaving(true);
      
      if (activeSheetId) {
        const response = await updateMultiSKUCalculationSheet(activeSheetId, {
          sheet_name: activeSheetName,
          items: saveItems,
        });

        if (response?.data?.rows && response?.data?.totals) {
          setPreview({
            rows: response.data.rows,
            expenseRows: response.data.expenseRows || [],
            totals: response.data.totals,
          });
        }
        await loadSavedSheets(activeSheetId);
        alert("Sheet updated successfully.");
      } else {
        const response = await createMultiSKUCalculationSheet({
          sheet_name: activeSheetName,
          items: saveItems,
        });

        const newSheetId = response.data?.multi_sku_sheet_id || null;
        setActiveSheetId(newSheetId);
        if (response.data?.rows && response.data?.totals) {
          setPreview({
            rows: response.data.rows,
            expenseRows: response.data.expenseRows || [],
            totals: response.data.totals,
          });
        }
        await loadSavedSheets(newSheetId);
        alert("Sheet saved successfully.");
      }
    } catch (error) {
      console.error("Error saving multi-product sheet:", error);
      alert("Failed to save the sheet.");
    } finally {
      setSaving(false);
    }
  };

const handleExportToExcel = () => {
  try {
    const wb = XLSX.utils.book_new();

    const data = [];

    // TITLE
    data.push([activeSheetName || "Sheet"]);
    data.push([
      `${items.length} products · ${tableExpenseRows.length} expense lines`,
    ]);
    data.push([]);

    // PRODUCT HEADER
    data.push([
      "Product",
      "Buy Amount",
      "Buy GST %",
      "Buy Qty",
      "Buy Unit Price",
      "Buy Total",

      "Sell Product",
      "Sell Amount",
      "Sell GST %",
      "Sell Qty",
      "Sell Unit Price",
      "Sell Total",

      "Profit",
      "GST Payable",
      "Net Profit",
    ]);

    // PRODUCT ROWS
    items.forEach((item, index) => {
      const row = preview?.rows?.[index];

      data.push([
        item.buy?.name || "",
        item.buy?.amount || 0,
        `${toNumber(item.buy?.gst)}%`,
        item.buy?.quantity || 0,
        row?.buy_unit_price || 0,
       row?.buy_total || 0,

        item.sell?.name || "",
        item.sell?.amount || 0,
        `${toNumber(item.sell?.gst)}%`,
        item.sell?.quantity || 0,
        row?.sell_unit_price || 0,
        row?.sell_total|| 0,

        row?.profit || 0,
        row?.gst_payable || 0,
        row?.net_profit || 0,
      ]);
    });

   
    data.push([
  "TOTAL",

  // Buy Amount (col 1)
  previewTotals?.totalBuyingAmount || 0,

  "", // Buy GST
  "", // Buy Qty

  // Buy Unit Price (col 4)
  previewTotals?.totalBuyingUnitPrice || 0,

  // Buy Total (col 5)
  previewTotals?.totalBuyTotal || 0,

  "", // Sell Product empty

  // Sell Amount (col 7)
  previewTotals?.totalSellingAmount || 0,

  "", // Sell GST
  "", // Sell Qty

  // Sell Unit Price (col 10)
  previewTotals?.totalSellingUnitPrice || 0,

  // Sell Total (col 11)
  previewTotals?.totalSellTotal || 0,

  // Profit
  previewTotals?.totalProfit || 0,

  // GST
  previewTotals?.totalGSTPayable || 0,

  // Net Profit
  previewTotals?.totalNetProfit || 0,
]);
    // SPACE
    data.push([]);
    data.push(["Expenses"]);
    data.push([]);

    // EXPENSE HEADER
    data.push([
      "Particulars",
      "SPC %",
      "Expense",
    ]);

    // EXPENSE ROWS
    tableExpenseRows.forEach(({ entry }, index) => {
    const previewRow = expensePreviewRows[index] || entry;

      data.push([
        entry?.particulars || "",
        `${toNumber(entry?.percentage)}%`,
        previewRow?.amount || 0,
      ]);
    });

    // TOTAL EXPENSE
    data.push([
      "Total Expense",
      "",
      previewTotals?.expense_amount || 0,
    ]);

    // SPACE
    data.push([]);
    data.push(["TAX / FINAL"]);
    data.push([]);

    // TAX HEADER
    data.push([
      "Income Tax %",
      "Income Tax Amount",
      "Final Profit",
    ]);

    
// TAX VALUES
data.push([
  `${toNumber(globalIncomeTaxPercentage)
    .toFixed(7)
    .replace(/0+$/, "")
    .replace(/\.$/, "")}%`,
    
  previewTotals?.income_tax || 0,

  previewTotals?.final_profit || 0,
]);
    // CREATE SHEET
    const ws = XLSX.utils.aoa_to_sheet(data);

    // COLUMN WIDTHS
    ws["!cols"] = [
      { wch: 20 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },

      { wch: 20 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },

      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];

    // RANGE
    const range = XLSX.utils.decode_range(ws["!ref"]);

    // COLORS
    const blackColor = "111827";
    const whiteColor = "FFFFFF";
    const borderColor = "D1D5DB";

    // ROW INDEXES
    const productHeaderRow = 3;
    const totalRow = 4 + items.length;

    const expensesTitleRow = totalRow + 2;
    const expenseHeaderRow = totalRow + 4;

    const expenseRowsStart = totalRow + 5;
    const expenseRowsEnd =
      expenseRowsStart + tableExpenseRows.length - 1;

    const totalExpenseRow = expenseRowsEnd + 1;

    const taxTitleRow = totalExpenseRow + 2;
    const taxHeaderRow = totalExpenseRow + 4;
    const taxValueRow = totalExpenseRow + 5;

    // COMMON BORDER
    const commonBorder = {
      top: { style: "thin", color: { rgb: borderColor } },
      bottom: { style: "thin", color: { rgb: borderColor } },
      left: { style: "thin", color: { rgb: borderColor } },
      right: { style: "thin", color: { rgb: borderColor } },
    };

    // STYLE ALL CELLS
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({
          r: R,
          c: C,
        });

        if (!ws[cellAddress]) continue;

        // DEFAULT STYLE
        ws[cellAddress].s = {
          font: {
            color: { rgb: "000000" },
          },
          fill: {
            fgColor: { rgb: whiteColor },
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
          },
          border: commonBorder,
        };

        // HEADER STYLE
        if (
          R === productHeaderRow ||
          R === expenseHeaderRow ||
          R === taxHeaderRow
        ) {
          ws[cellAddress].s = {
            font: {
              bold: true,
              color: { rgb: whiteColor },
            },
            fill: {
              fgColor: { rgb: blackColor },
            },
            alignment: {
              horizontal: "center",
              vertical: "center",
            },
            border: commonBorder,
          };
        }

        // SECTION TITLES
        if (
          R === 0 ||
          R === expensesTitleRow ||
          R === taxTitleRow
        ) {
          ws[cellAddress].s = {
            font: {
              bold: true,
              sz: 14,
              color: { rgb: blackColor },
            },
            fill: {
              fgColor: { rgb: whiteColor },
            },
            alignment: {
              horizontal: "left",
              vertical: "center",
            },
          };
        }

        // TOTAL ROW STYLE
        if (
          R === totalRow ||
          R === totalExpenseRow
        ) {
          ws[cellAddress].s = {
            font: {
              bold: true,
              color: { rgb: "000000" },
            },
            fill: {
              fgColor: { rgb: "F3F4F6" },
            },
            alignment: {
              horizontal: "center",
              vertical: "center",
            },
            border: commonBorder,
          };
        }

        // TAX VALUE ROW STYLE
        if (R === taxValueRow) {
          ws[cellAddress].s = {
            font: {
              bold: true,
              color: { rgb: "000000" },
            },
            fill: {
              fgColor: { rgb: whiteColor },
            },
            alignment: {
              horizontal: "center",
              vertical: "center",
            },
            border: commonBorder,
          };
        }
      }
    }

    // APPEND SHEET
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Calculation"
    );

    // DOWNLOAD FILE
    XLSX.writeFile(
      wb,
      `${activeSheetName || "Calculation"}.xlsx`
    );
  } catch (error) {
    console.error("Excel export error:", error);
    alert("Failed to export Excel");
  }
};
  const handleExportToPdf = () => {
  if (!preview?.rows?.length) {
    alert(
      "No calculated data to export. Add products and wait for preview, or save the sheet."
    );
    return;
  }

  if (!items?.length) {
    alert("No product rows to export.");
    return;
  }

  try {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const margin = 10;
    let y = margin;

    // TITLE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(String(activeSheetName || "Current Sheet"), margin, y);

    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const summaryParts = [
      `${items.length} product${items.length !== 1 ? "s" : ""}`,
    ];

    if (tableExpenseRows.length > 0) {
      summaryParts.push(
        `${tableExpenseRows.length} expense line${
          tableExpenseRows.length !== 1 ? "s" : ""
        }`
      );
    }

    doc.text(summaryParts.join(" · "), margin, y);

    y += 8;

    // PRODUCT TABLE HEADER
    const productHead = [
      [
        "Product",
        "Buy Amount",
        "Buy GST %",
        "Buy Qty",
        "Buy Unit Price",
        "Buy Total",

        "Sell Product",
        "Sell Amount",
        "Sell GST %",
        "Sell Qty",
        "Sell Unit Price",
        "Sell Total",

        "Profit",
        "GST Payable",
        "Net Profit",
      ],
    ];

    // CELL COLORS
    const tintCell = (data, yellow, cyan, rose, green) => {
      if (data.section !== "head" && data.section !== "body") return;

      const i = data.column.index;

      if (yellow.has(i)) {
        data.cell.styles.fillColor = [254, 252, 232];
      }

      if (cyan.has(i)) {
        data.cell.styles.fillColor = [236, 254, 255];
      }

      if (rose.has(i)) {
        data.cell.styles.fillColor = [255, 241, 242];
      }

      if (green.has(i)) {
        data.cell.styles.fillColor = [240, 253, 244];
      }
    };

    const yellowCols = new Set([5, 11]);
    const cyanCols = new Set([12]);
    const roseCols = new Set([13]);
    const greenCols = new Set([14]);

    // PRODUCT BODY
    const productBody = items.map((item, index) => {
      const row = preview?.rows?.[index];

      return [
        item.buy.name || "-",
        formatCurrencyPdf(item.buy.amount),
        `${toNumber(item.buy.gst)}%`,
        String(toNumber(item.buy.quantity)),
        formatCurrencyPdf(row?.buy_unit_price),
        formatCurrencyPdf(row?.buy_total),

        item.sell.name || "-",
        formatCurrencyPdf(item.sell.amount),
        `${toNumber(item.sell.gst)}%`,
        String(toNumber(item.sell.quantity)),
        formatCurrencyPdf(row?.sell_unit_price),
        formatCurrencyPdf(row?.sell_total),

        formatCurrencyPdf(row?.profit),
        formatCurrencyPdf(row?.gst_payable),
        formatCurrencyPdf(row?.net_profit),
      ];
    });

    // TOTAL ROW
   const totalRow = [
  {
    content: "TOTAL",
    colSpan: 1,
    styles: {
      fontStyle: "bold",
      halign: "left",
    },
  },

  // BUY AMOUNT (col 1)
  {
    content: formatCurrencyPdf(previewTotals?.totalBuyingAmount || 0),
    styles: {
      fontStyle: "bold",
      fillColor: [254, 249, 195],
    },
  },

  "", // GST
  "", // QTY

  // BUY UNIT PRICE (col 4)
  {
    content: formatCurrencyPdf(previewTotals?.totalBuyingUnitPrice || 0),
    styles: {
      fontStyle: "bold",
      fillColor: [254, 249, 195],
    },
  },

  // BUY TOTAL (col 5)
  {
    content: formatCurrencyPdf(previewTotals?.totalBuyTotal || 0),
    styles: {
      fontStyle: "bold",
      fillColor: [254, 249, 195],
    },
  },

  "", // SELL PRODUCT

  // SELL AMOUNT (col 7)
  {
    content: formatCurrencyPdf(previewTotals?.totalSellingAmount || 0),
    styles: {
      fontStyle: "bold",
      fillColor: [254, 249, 195],
    },
  },

  "", // GST
  "", // QTY

  // SELL UNIT PRICE (col 10)
  {
    content: formatCurrencyPdf(previewTotals?.totalSellingUnitPrice || 0),
    styles: {
      fontStyle: "bold",
      fillColor: [254, 249, 195],
    },
  },

  // SELL TOTAL (col 11)
  {
    content: formatCurrencyPdf(previewTotals?.totalSellTotal || 0),
    styles: {
      fontStyle: "bold",
      fillColor: [254, 249, 195],
    },
  },

  // PROFIT (col 12)
  {
    content: formatCurrencyPdf(previewTotals?.totalProfit || 0),
    styles: {
      fontStyle: "bold",
      fillColor: [207, 250, 254],
    },
  },

  // GST (col 13)
  {
    content: formatCurrencyPdf(previewTotals?.totalGSTPayable || 0),
    styles: {
      fontStyle: "bold",
      fillColor: [255, 228, 230],
    },
  },

  // NET PROFIT (col 14)
  {
    content: formatCurrencyPdf(previewTotals?.totalNetProfit || 0),
    styles: {
      fontStyle: "bold",
      fillColor: [220, 252, 231],
    },
  },
];

    // PRODUCT TABLE
    autoTable(doc, {
      startY: y,
      head: productHead,
      body: [...productBody, totalRow],
      theme: "grid",

      styles: {
        fontSize: 7,
        cellPadding: 1.2,
        valign: "middle",
      },

      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [15, 23, 42],
        fontStyle: "bold",
        fontSize: 7,
      },

      columnStyles: {
        0: { cellWidth: 22 },
      },

      didParseCell: (data) => {
        if (data.section === "head") {
          tintCell(
            data,
            yellowCols,
            cyanCols,
            roseCols,
            greenCols
          );
        }

        if (
          data.section === "body" &&
          data.row.index < items.length
        ) {
          tintCell(
            data,
            yellowCols,
            cyanCols,
            roseCols,
            greenCols
          );
        }
      },
    });

    y = doc.lastAutoTable.finalY + 8;

    // EXPENSE TITLE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Expenses", margin, y);

    y += 5;

    // EXPENSE TABLE
    const expenseHead = [["Particulars", "SPC %", "Expense"]];

    let expenseBody;

    if (tableExpenseRows.length === 0) {
      expenseBody = [
        [
          {
            content: "No expense entries added yet.",
            colSpan: 3,
            styles: {
              textColor: [100, 116, 139],
            },
          },
        ],
      ];
    } else {
      expenseBody = tableExpenseRows.map(
        ({ entry }, index) => {
        const previewRow = expensePreviewRows[index] || entry;

          return [
            entry.particulars || "-",

            formatSpcPercentPdf(entry.percentage),

            formatCurrencyPdf(previewRow?.amount || 0),
          ];
        }
      );

      expenseBody.push([
        {
          content: "Total Expense",
          colSpan: 2,
          styles: {
            fontStyle: "bold",
            fillColor: [254, 252, 232],
          },
        },

        {
          content: formatCurrencyPdf(
            previewTotals.expense_amount
          ),

          styles: {
            fontStyle: "bold",
            fillColor: [254, 252, 232],
            halign: "right",
          },
        },
      ]);
    }

    autoTable(doc, {
      startY: y,
      head: expenseHead,
      body: expenseBody,
      theme: "grid",

      styles: {
        fontSize: 9,
        cellPadding: 1.5,
      },

      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [15, 23, 42],
        fontStyle: "bold",
      },

      columnStyles: {
        0: { cellWidth: 80 },
        1: { halign: "center", cellWidth: 36 },
        2: { halign: "right", cellWidth: 40 },
      },
    });

    y = doc.lastAutoTable.finalY + 8;

    // TAX TITLE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TAX / FINAL", margin, y);

    y += 5;

    // TAX TABLE
    autoTable(doc, {
      startY: y,

      head: [[
        "Income Tax %",
        "Income Tax Amount",
        "Final Profit",
      ]],

      body: [[
        `${toNumber(globalIncomeTaxPercentage)
          .toFixed(7)
          .replace(/0+$/, "")
          .replace(/\.$/, "")}%`,

        formatCurrencyPdf(
          previewTotals?.income_tax || 0
        ),

        formatCurrencyPdf(
          previewTotals?.final_profit || 0
        ),
      ]],

      theme: "grid",

      styles: {
        fontSize: 9,
        cellPadding: 2,
      },

      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [15, 23, 42],
        fontStyle: "bold",
      },

      columnStyles: {
        0: {
          halign: "center",
          cellWidth: 60,
        },

        1: {
          halign: "right",
          cellWidth: 60,
        },

        2: {
          halign: "right",
          cellWidth: 60,
        },
      },

      bodyStyles: {
        fillColor: [254, 249, 195],
      },
    });

    // SAVE PDF
    const date = new Date()
      .toISOString()
      .split("T")[0];

    doc.save(
      `MultiProduct_Calculation_${date}.pdf`
    );
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    alert("Failed to export PDF file.");
  }
};

  return (
    <div className="w-full overflow-x-hidden bg-background">
      <div className="flex flex-col">
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-3">
              {/* <div>
                <h1 className="text-2xl font-bold">Multiple Product Calculation</h1>
                <p className="text-sm text-gray-600 mt-1">Organize multiple products by sheet name, calculate profits, and export to Excel or PDF</p>
              </div> */}

              <div className="flex justify-end gap-3 flex-wrap w-full">
  
  {/* New Sheet */}
  <button
    onClick={resetSheetEditor}
    className="px-4 py-2 rounded-md bg-slate-700 text-white hover:bg-slate-800"
  >
    + New Sheet
  </button>

  {/* Add Product */}
  <button
    onClick={() => {
      setShowForm(true);
      setActiveModalTab("product");
      setModalDrafts([
        { ...emptyDraft(), sheet_name: activeSheetName || "" },
      ]);
      setCurrentDraftIndex(0);
      setDraft({
        ...emptyDraft(),
        sheet_name: activeSheetName || "",
      });
      // setDraftPreview(null);
      setEditIndex(null);
    }}
    className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
  >
    + Add Product
  </button>

  {/* Export Dropdown */}
  <div className="relative group">
    <button
      className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
    >
      <Download size={18} />
      Export
    </button>

    {/* Dropdown Menu */}
    <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
      
      <button
        onClick={handleExportToExcel}
        disabled={!preview || preview.rows?.length === 0}
        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center gap-2 disabled:opacity-50"
      >
        📊 Export Excel
      </button>

      <button
        onClick={handleExportToPdf}
        disabled={!preview || preview.rows?.length === 0}
        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center gap-2 disabled:opacity-50"
      >
        📄 Export PDF
      </button>
    </div>
  </div>
</div>
            </div>

            <section className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-4">
                <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_auto] w-full">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Sheet Name</label>
                    <input
                      type="text"
                      value={activeSheetName}
                      onChange={(e) => setActiveSheetName(e.target.value)}
                      placeholder="Enter sheet name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-1">
                    {loading && items.length > 0 ? (
                      <span className="text-sm text-gray-500">Refreshing calculations...</span>
                    ) : activeSheetId ? (
                      <span className="text-sm text-gray-500">Saved sheet ID: {activeSheetId}</span>
                    ) : (
                      <span className="text-sm text-gray-500">Unsaved sheet — click Save Sheet</span>
                    )}
                  </div>
                </div>
              </div>

            {sheets.length > 0 ? (
 <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">

    {/* Sheet Buttons */}
   <div className="flex flex-wrap gap-2">
      {paginatedSheets.map((sheet, index) => {
        const actualIndex =
          (currentSheetPage - 1) * sheetsPerPage + index;

        return (
          <button
            key={sheet.multi_sku_sheet_id || actualIndex}
            type="button"
            onClick={() => {
              setActiveSheetIndex(actualIndex);
              setActiveSheetState(sheet);
            }}
            className={`px-4 py-2 text-sm rounded-md border transition-all ${
              activeSheetIndex === actualIndex
                ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-sm"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {sheet.sheet_name || `Sheet ${actualIndex + 1}`}
          </button>
        );
      })}
    </div>

    {/* Pagination */}
   <div className="flex items-center justify-end gap-2 flex-wrap">

      <button
        type="button"
        onClick={() =>
          setCurrentSheetPage((prev) => Math.max(prev - 1, 1))
        }
        disabled={currentSheetPage === 1}
        className="px-3 py-1.5 rounded-md border bg-white text-sm disabled:opacity-50 hover:bg-gray-100"
      >
        ← Prev
      </button>

      {Array.from({ length: totalSheetPages }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => setCurrentSheetPage(i + 1)}
          className={`px-3 py-1.5 rounded-md text-sm border transition ${
            currentSheetPage === i + 1
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
          }`}
        >
          {i + 1}
        </button>
      ))}

      <button
        type="button"
        onClick={() =>
          setCurrentSheetPage((prev) =>
            Math.min(prev + 1, totalSheetPages)
          )
        }
        disabled={currentSheetPage === totalSheetPages}
        className="px-3 py-1.5 rounded-md border bg-white text-sm disabled:opacity-50 hover:bg-gray-100"
      >
        Next →
      </button>
    </div>
  </div>
) : null}

              {!showCalculationWorkspace ? (
                <p className="text-gray-500">
                  Add at least one product, or add expense lines / income tax, or open a saved sheet to view and edit
                  calculations.
                </p>
              ) : (
                <div className="space-y-6">
                  <div className="border-2 border-blue-200 rounded-lg overflow-hidden">
                    <div className="bg-blue-100 px-4 py-3 flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-bold text-blue-900">{activeSheetName || "Current Sheet"}</h3>
                        <p className="text-sm text-blue-700">
                          {items.length} product{items.length !== 1 ? "s" : ""}
                          {tableExpenseRows.length > 0
                            ? ` · ${tableExpenseRows.length} expense line${
                                tableExpenseRows.length !== 1 ? "s" : ""
                              }`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="border p-2 text-left">Product</th>
                            <th className="border p-2 text-left">Buy Amount</th>
                            <th className="border p-2 text-left">Buy GST %</th>
                            <th className="border p-2 text-left">Buy Qty</th>
                            <th className="border p-2 text-left">Buy Unit Price</th>
                            <th className="border p-2 text-left bg-yellow-50">Buy Total</th>

                            <th className="border p-2 text-left">Sell Product</th>
                            <th className="border p-2 text-left">Sell Amount</th>
                            <th className="border p-2 text-left">Sell GST %</th>
                            <th className="border p-2 text-left">Sell Qty</th>
                            <th className="border p-2 text-left">Sell Unit Price</th>
                            <th className="border p-2 text-left bg-yellow-50">Sell Total</th>

                            <th className="border p-2 text-left bg-cyan-50">Profit</th>
                            <th className="border p-2 text-left bg-rose-50">GST Payable</th>
                            <th className="border p-2 text-left bg-green-50">Net Profit</th>
                            <th className="border p-2 text-center">ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.length === 0 ? (
                            <tr>
                              <td
                                colSpan={16}
                                className="border p-3 text-center text-gray-500 bg-gray-50"
                              >
                                No product rows. Add products with + Add Product, or edit expenses in the table
                                below.
                              </td>
                            </tr>
                          ) : null}
                          {items.map((item, index) => {
                            const row = preview?.rows?.[index];
                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border p-2">{item.buy.name || "-"}</td>
                                <td className="border p-2">{formatCurrency(item.buy.amount)}</td>
                                <td className="border p-2">{toNumber(item.buy.gst)}%</td>
                                <td className="border p-2">{toNumber(item.buy.quantity)}</td>
                                <td className="border p-2">{formatCurrency(row?.buy_unit_price)}</td>
                                <td className="border p-2 bg-yellow-50 font-semibold">
                                  {formatCurrency(row?.buy_total)}
                                </td>

                                <td className="border p-2">{item.sell.name || "-"}</td>
                                <td className="border p-2">{formatCurrency(item.sell.amount)}</td>
                                <td className="border p-2">{toNumber(item.sell.gst)}%</td>
                                <td className="border p-2">{toNumber(item.sell.quantity)}</td>
                                <td className="border p-2">{formatCurrency(row?.sell_unit_price)}</td>
                                <td className="border p-2 bg-yellow-50 font-semibold">
                                  {formatCurrency(row?.sell_total)}
                                </td>

                                <td className="border p-2 bg-cyan-50">{formatCurrency(row?.profit)}</td>
                                <td className="border p-2 bg-rose-50">
                                  {formatCurrency(row?.gst_payable)}
                                </td>
                                <td className="border p-2 bg-green-50">
                                  {formatCurrency(row?.net_profit)}
                                </td>
                                <td className="border p-2 text-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditItem(index)}
                                    className="inline-flex items-center justify-center p-2 rounded hover:bg-blue-100 text-blue-600 hover:text-blue-800"
                                    title="Edit product"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItem(index)}
                                    className="inline-flex items-center justify-center p-2 rounded hover:bg-red-100 text-red-600 hover:text-red-800"
                                    title="Delete product"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          
                          <tr className="bg-slate-100 font-semibold">
  <td className="border p-2" colSpan={1}>
    TOTAL
  </td>

  {/* BUY AMOUNT TOTAL */}
  <td className="border p-2 bg-yellow-50">
    {formatCurrency(preview?.totals?.total_buying_amount)}
  </td>

  <td className="border p-2"></td>
  <td className="border p-2"></td>

  {/* BUY UNIT PRICE TOTAL */}
  <td className="border p-2 bg-yellow-50">
    {formatCurrency(preview?.totals?.total_buying_unit_price)}
  </td>

  {/* BUY TOTAL */}
  <td className="border p-2 bg-yellow-50">
    {formatCurrency(preview?.totals?.total_buy_total)}
  </td>

  {/* SELL PRODUCT (empty column alignment) */}
  <td className="border p-2"></td>

  {/* SELL AMOUNT TOTAL */}
  <td className="border p-2 bg-yellow-50">
    {formatCurrency(preview?.totals?.total_selling_amount)}
  </td>

  <td className="border p-2"></td>
  <td className="border p-2"></td>

  {/* SELL UNIT PRICE TOTAL */}
  <td className="border p-2 bg-yellow-50">
    {formatCurrency(preview?.totals?.total_selling_unit_price)}
  </td>

  {/* SELL TOTAL */}
  <td className="border p-2 bg-yellow-50">
    {formatCurrency(preview?.totals?.total_sell_total)}
  </td>

  {/* PROFIT */}
  <td className="border p-2 bg-cyan-50">
    {formatCurrency(preview?.totals?.total_profit)}
  </td>

  {/* GST */}
  <td className="border p-2 bg-rose-50">
    {formatCurrency(preview?.totals?.total_gst_payable)}
  </td>

  {/* NET PROFIT */}
  <td className="border p-2 bg-green-50">
    {formatCurrency(preview?.totals?.total_net_profit)}
  </td>

  <td className="border p-2"></td>
</tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="overflow-x-auto mt-6">
                      <div className="border-t border-gray-300 mb-4" />
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-white border-b border-gray-300">
                            <th className="border-r border-gray-300 px-3 py-2 text-left font-semibold">Particulars</th>
                            <th className="border-r border-gray-300 px-3 py-2 text-center font-semibold">SPC %</th>
                            <th className="px-3 py-2"></th>
                            <th className="border-r border-gray-300 px-3 py-2 text-right font-semibold">Expense</th>
                            <th className="px-3 py-2 text-center font-semibold">ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableExpenseRows.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="border-t border-gray-300 px-3 py-3 text-center text-gray-500">
                                No expense entries added yet.
                              </td>
                            </tr>
                          ) : (
                            <>
                             {tableExpenseRows.map(({ entry, fullIndex }, index) => {
  console.log("Expense Row:", entry);

  const previewRow = expensePreviewRows[index];

  return (
                                    <tr key={fullIndex} className="border-b border-gray-300 hover:bg-gray-50">
                                      <td className="border-r border-gray-300 px-3 py-2">{entry.particulars || `-`}</td>
                                      <td className="border-r border-gray-300 px-3 py-2 text-center">{toNumber(entry.percentage).toFixed(7).replace(/0+$/, '').replace(/\.$/, '')}%</td>
                                      <td className="px-3 py-2"></td>
                                      <td className="border-r border-gray-300 px-3 py-2 text-right">
                                        {formatCurrency(previewRow?.amount)}
                                      </td>
                                    <td className="border p-2 text-center">
  <div className="flex items-center justify-center gap-2">

    {/* Edit */}
    <button
      type="button"
      onClick={() => {
        setDraft({ ...emptyDraft(), sheet_name: activeSheetName || "" });
        setModalDrafts([{ ...emptyDraft(), sheet_name: activeSheetName || "" }]);
        setActiveModalTab("expense");
        setShowForm(true);
      }}
      className="inline-flex items-center justify-center p-2 rounded hover:bg-blue-100 text-blue-600 hover:text-blue-800"
      title="Edit Tax"
    >
      <Edit2 size={16} />
    </button>

    {/* Delete */}
    <button
  type="button"
  onClick={() => handleDeleteExpense(entry, fullIndex)}
  className="inline-flex items-center justify-center p-2 rounded hover:bg-red-100 text-red-600 hover:text-red-800"
  title="Delete expense"
>
  <Trash2 size={16} />
</button>

  </div>
</td>
                                    </tr>
                                  );
                                })}
                              <tr className="bg-yellow-50 font-bold border-t-2 border-gray-400">
                                <td colSpan="3" className="border-r border-gray-300 px-3 py-2">Total Expense</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(previewTotals.expense_amount)}</td>
                                <td></td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>

                  {/* TAX / FINAL SECTION */}
                  <div className="mt-6 bg-white border border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 text-sm font-semibold">TAX / FINAL</div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-white border-b border-gray-300">
                             <th className="border-r border-gray-300 px-3 py-2 text-center font-semibold">
            Income Tax %
          </th>
                            <th className="border-r border-gray-300 px-3 py-2 text-right font-semibold">Income Tax</th>
                            <th className="border-r border-gray-300 px-3 py-2 text-right font-semibold">Final Profit</th>
                            <th className="px-3 py-2 text-center font-semibold">ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-yellow-100 border-b border-gray-300">
                             <td className="border-r border-gray-300 px-3 py-2 text-center">
          {toNumber(
  globalIncomeTaxPercentage ||
  preview?.profit?.income_tax_percentage
)
              .toFixed(7)
              .replace(/0+$/, "")
              .replace(/\.$/, "")}
            %
          </td>
                           <td className="border-r border-gray-300 px-3 py-2 text-right">
  {formatCurrency(previewTotals.income_tax)}
</td>

<td className="border-r border-gray-300 px-3 py-2 text-right">
  {formatCurrency(previewTotals.final_profit)}
</td>
                            <td className="px-3 py-2 text-center">
                             <button
      type="button"
     onClick={() => {
  setDraft({
    ...emptyDraft(),
    sheet_name: activeSheetName || "",
  });

 setActiveModalTab("tax");

  setShowForm(true);
}}
      className="inline-flex items-center justify-center p-2 rounded hover:bg-blue-100 text-blue-600 hover:text-blue-800"
      title="Edit"
    >
      <Edit2 size={16} />
    </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
         <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-xl font-bold">Add Products to Sheet</h2>
                <p className="text-sm text-gray-600 mt-2">
                  {draft.sheet_name && <span className="font-semibold text-blue-600">📋 {draft.sheet_name}</span>}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Adding product {currentDraftIndex + 1} of {modalDrafts.length}
                  {editIndex !== null ? " (Edit Mode)" : ""}
                </p>
              </div>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="p-6 space-y-6 max-h-96 overflow-y-auto"
            >
              {/* Sheet Name Section */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-bold text-blue-900 mb-2">📋 Sheet Name (Required)</label>
                <input
                  type="text"
                  value={draft.sheet_name}
                  onChange={(e) => updateDraftField("sheet_name", e.target.value)}
                  placeholder="e.g., Sheet 1, Electronics, Software"
                  required
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-md text-sm font-medium"
                />
                <p className="text-xs text-blue-700 mt-2">
                  {isCreateNewMultiSheet ? (
                    <>
                      Use the Product, Expenses, and Income Tax tabs, then click{" "}
                      <span className="font-semibold">Save sheet</span> once to create the sheet with
                      everything.
                    </>
                  ) : (
                    <>
                      {/* 💡 All products added in this form will be grouped under this sheet name. You can add
                      multiple products to one sheet. */}
                    </>
                  )}
                </p>
              </div>

              {/* Product/Expenses/Tax Tabs */}
              <div className="grid grid-cols-3 gap-2 border-b pb-4">
                {[
                  { key: "product", label: "Product" },
                  { key: "expense", label: "Expenses" },
                  { key: "tax", label: "Income Tax" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveModalTab(tab.key)}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                      activeModalTab === tab.key
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeModalTab === "product" ? (
                <>
                  <fieldset>
                    <legend>Input Pricing (Buying)</legend>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label>Product Name *</label>
                        <input
                          type="text"
                          value={draft.buy.name}
                          onChange={(e) => updateDraftProduct("buy", "name", e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label>Amount (₹) *</label>
                       <input
  type="number"
  value={draft.buy.amount}
  onChange={(e) =>
    updateDraftProduct("buy", "amount", e.target.value)
  }
  onWheel={(e) => e.currentTarget.blur()}
  required
  step="0.01"
  className="w-full px-3 py-2 border border-gray-300 rounded-md"
/>
                      </div>

                      <div>
                        <label>GST % *</label>
                       <input
  type="number"
  value={draft.buy.gst}
  onChange={(e) =>
    updateDraftProduct("buy", "gst", e.target.value)
  }
  onWheel={(e) => e.currentTarget.blur()}
  step="any"
  className="w-full px-3 py-2 border border-gray-300 rounded-md"
/>
                      </div>

                      <div>
                        <label>Quantity *</label>
                       <input
  type="number"
  value={draft.buy.quantity}
  onChange={(e) =>
    updateDraftProduct("buy", "quantity", e.target.value)
  }
  onWheel={(e) => e.currentTarget.blur()}
  required
  step="1"
  className="w-full px-3 py-2 border border-gray-300 rounded-md"
/>
                      </div>
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend>Output Pricing (Selling)</legend>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label>Product Name *</label>
                        <input
                          type="text"
                          value={draft.sell.name}
                          onChange={(e) => updateDraftProduct("sell", "name", e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label>Amount (₹) *</label>
                       <input
  type="number"
  value={draft.sell.amount}
  onChange={(e) =>
    updateDraftProduct("sell", "amount", e.target.value)
  }
  onWheel={(e) => e.currentTarget.blur()}
  required
  step="0.01"
  className="w-full px-3 py-2 border border-gray-300 rounded-md"
/>
                      </div>

                      <div>
                        <label>GST % *</label>
                       <input
  type="number"
  value={draft.sell.gst}
  onChange={(e) =>
    updateDraftProduct("sell", "gst", e.target.value)
  }
  onWheel={(e) => e.currentTarget.blur()}
  step="any"
  className="w-full px-3 py-2 border border-gray-300 rounded-md"
/>
                      </div>

                      <div>
                        <label>Quantity *</label>
                        <input
  type="number"
  value={draft.sell.quantity}
  onChange={(e) =>
    updateDraftProduct("sell", "quantity", e.target.value)
  }
  onWheel={(e) => e.currentTarget.blur()}
  required
  step="1"
  className="w-full px-3 py-2 border border-gray-300 rounded-md"
/>
                      </div>
                    </div>
                  </fieldset>
                </>
              ) : null}

              {activeModalTab === "expense" ? (
                <fieldset>
                  <legend>Expense</legend>

                  <div className="space-y-4">
                    {expenseEntries.map((entry, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-2">
                          <label>Particulars</label>
                          <input
                            type="text"
                            value={entry.particulars}
                            onChange={(e) => updateExpenseEntry(index, "particulars", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label>SPC %</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            placeholder="e.g. 2.5 or -0.01"
                            value={entry.percentage}
                            onChange={(e) => updateExpenseEntry(index, "percentage", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div className="flex items-center justify-end md:col-span-3">
                        <button
  type="button"
  onClick={() => removeExpenseEntry(index)}
  className="text-red-600 hover:text-red-800 text-sm"
  disabled={expenseEntries.length === 1}
>
  Remove
</button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addExpenseEntry}
                      className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      Add another expense
                    </button>
                  </div>
                </fieldset>
              ) : null}

              {activeModalTab === "tax" ? (
                <fieldset>
                  {/* <legend>Income Tax</legend> */}

                  <div>
                    <label>Income Tax %</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="e.g. 12.5"
                      value={globalIncomeTaxPercentage}
                      onChange={(e) => setGlobalIncomeTaxPercentage(String(e.target.value).replace("%", "").trim())}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </fieldset>
              ) : null}

              

              <div className="flex gap-3 justify-end border-t pt-6 flex-wrap">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                  onClick={handlePreviousDraft}
                  disabled={currentDraftIndex === 0}
                  title="Go to previous product"
                >
                  ← Previous
                </button>
                {editIndex === null ? (
                  <button
                    type="button"
                    className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                    onClick={handleNextDraft}
                    title="Add another product to this sheet"
                  >
                    Next Product
                  </button>
                ) : null}
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={closeModal}
                  title="Discard changes"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 font-medium"
                  title={
                    isCreateNewMultiSheet
                      ? "Save products, expenses, and income tax to create this sheet"
                      : activeModalTab === "expense"
                        ? "Save expense entries to the sheet"
                        : activeModalTab === "tax"
                          ? "Save income tax % to the sheet"
                          : editIndex !== null
                            ? "Update product in sheet"
                            : `Save all ${modalDrafts.length} product(s) to "${draft.sheet_name}"`
                  }
                >
                  {isCreateNewMultiSheet
                    ? "Save sheet"
                    : activeModalTab === "expense"
                      ? "✓ Save expenses"
                      : activeModalTab === "tax"
                        ? "✓ Save income tax"
                        : editIndex === null
                          ? `✓ Save Sheet`
                          : "Update Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiProductSKUCalculation;
