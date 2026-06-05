import { useState, useEffect } from "react";
import { updateSkuCalculation } from "../api/skuCalculationApi";


export default function EditCalculationModal({
  open,
  onClose,
  initialData,
  onUpdated,
}) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    inputProductName: "",
    inputPrice: "",
    inputGST: "",
    inputQty: "",

    outputProductName: "",
    outputPrice: "",
    outputGST: "",
    outputQty: "",
  incomeTaxPercentage: "",
   expenses: [
  {
    particulars: "",
    spc: "",
  },
],
});
  // ✅ Fill form when editing row changes
  useEffect(() => {
    if (initialData) {
      setForm({
        inputProductName: initialData.product_name_buy || "",
        inputPrice: initialData.buy_amount || "",
        inputGST: initialData.buy_gst_percentage || "",
        inputQty: initialData.buy_quantity || "",

        outputProductName: initialData.product_name_sell || "",
        outputPrice: initialData.sell_amount || "",
        outputGST: initialData.sell_gst_percentage || "",
        outputQty: initialData.sell_quantity || "",
 incomeTaxPercentage: initialData.income_tax_percentage || "", // ✅ ADD
     expenses: initialData?.expenses?.length > 0
  ? initialData.expenses.map((exp) => ({
      particulars: exp.expense_particulars || "",
      spc: exp.expense_spc_percentage || "",
    }))
  : [
      {
        particulars: "",
        spc: "",
      },
    ],
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleExpenseChange = (index, field, value) => {
  const updatedExpenses = [...form.expenses];

  updatedExpenses[index][field] = value;

  setForm((prev) => ({
    ...prev,
    expenses: updatedExpenses,
  }));
};

const addExpenseRow = () => {
  setForm((prev) => ({
    ...prev,
    expenses: [
      ...prev.expenses,
      {
        particulars: "",
        spc: "",
        amount: "",
      },
    ],
  }));
};

const removeExpenseRow = (index) => {
  const updatedExpenses = form.expenses.filter((_, i) => i !== index);

  setForm((prev) => ({
    ...prev,
    expenses: updatedExpenses,
  }));
};

  const handleUpdate = async () => {
  try {
    setLoading(true);

    const payload = {
      product_name_buy: form.inputProductName,
      buy_amount: Number(form.inputPrice),
      buy_gst_percentage: Number(form.inputGST),
      buy_quantity: Number(form.inputQty),

      product_name_sell: form.outputProductName,
      sell_amount: Number(form.outputPrice),
      sell_gst_percentage: Number(form.outputGST),
      sell_quantity: Number(form.outputQty),
  income_tax_percentage: Number(form.incomeTaxPercentage),
     expenses: form.expenses.map((expense, index) => ({
  row_order: index,
  expense_particulars: expense.particulars,
  expense_spc_percentage: Number(expense.spc),
 
})),
    };

    // 🔥 FIX HERE
    await updateSkuCalculation(initialData.sku_id, payload);

   onUpdated({
  sku_id: initialData.sku_id,
  ...payload,
});

    onClose();
  } catch (err) {
    console.error(err);
    alert(err.message);
  } finally {
    setLoading(false);
  }
};

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 backdrop-blur-[2px]px-4 py-6">

      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-3xl max-h-[75vh] overflow-y-auto shadow-[0_0_40px_rgba(0,0,0,0.6)]">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10 rounded-t-3xl px-8 py-5">
          <h2 className="text-2xl font-bold text-gray-900 text-3xl font-bold">
            Edit Product Calculation
          </h2>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-500 text-gray-500 flex items-center justify-center text-3xl"
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="p-8 space-y-8 bg-gray-50">

          {/* INPUT */}
         {/* INPUT PRICING */}
<div className="border border-gray-200 bg-white rounded-2xl p-6 shadow-sm">
  <h3 className="text-lg font-semibold text-black mb-4">
    Input Pricing (Buying)
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

    {/* PRODUCT NAME */}
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">
        Product Name *
      </label>

      <input
        name="inputProductName"
        value={form.inputProductName}
        onChange={handleChange}
        className="w-full bg-white border border-black/10 text-black placeholder:text-gray-500 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>

    {/* PRICE */}
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">
        I/P Price (₹) *
      </label>

      <input
        type="number"
        name="inputPrice"
        value={form.inputPrice}
        onChange={handleChange}
        onWheel={(e) => e.target.blur()}
        className="w-full bg-white border border-black/10 text-black placeholder:text-gray-500 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>

    {/* GST */}
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">
        GST % *
      </label>

      <input
        type="number"
        name="inputGST"
        value={form.inputGST}
        onChange={handleChange}
        onWheel={(e) => e.target.blur()}
        className="w-full bg-white border border-black/10 text-black placeholder:text-gray-500 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>

    {/* QUANTITY */}
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">
        Quantity *
      </label>

      <input
        type="number"
        name="inputQty"
        value={form.inputQty}
        onChange={handleChange}
        onWheel={(e) => e.target.blur()}
        className="w-full bg-white border border-black/10 text-black placeholder:text-gray-500 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>

  </div>
</div>

          {/* OUTPUT */}
          {/* OUTPUT PRICING */}
<div className="border border-gray-200 bg-white rounded-2xl p-6 shadow-sm">
  <h3 className="text-lg font-semibold text-black mb-4">
    Output Pricing (Selling)
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

    {/* PRODUCT NAME */}
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">
        Product Name *
      </label>

      <input
        name="outputProductName"
        value={form.outputProductName}
        onChange={handleChange}
        className="w-full bg-white border border-black/10 text-black placeholder:text-gray-500 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>

    {/* PRICE */}
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">
        O/P Price (₹) *
      </label>

      <input
        type="number"
        name="outputPrice"
        value={form.outputPrice}
        onChange={handleChange}
        onWheel={(e) => e.target.blur()}
        className="w-full bg-white border border-black/10 text-black placeholder:text-gray-500 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>

    {/* GST */}
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">
        GST % *
      </label>

      <input
        type="number"
        name="outputGST"
        value={form.outputGST}
        onChange={handleChange}
        onWheel={(e) => e.target.blur()}
        className="w-full bg-white border border-black/10 text-black placeholder:text-gray-500 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>

    {/* QUANTITY */}
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">
        Quantity *
      </label>

      <input
        type="number"
        name="outputQty"
        value={form.outputQty}
        onChange={handleChange}
        onWheel={(e) => e.target.blur()}
        className="w-full bg-white border border-black/10 text-black placeholder:text-gray-500 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>

  </div>
</div>

         {/* EXPENSE */}
<div className="border border-gray-200 bg-white rounded-2xl p-6 shadow-sm">
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-xl font-bold text-gray-900">
      Expense Details
    </h3>

    <button
      type="button"
      onClick={addExpenseRow}
      className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium shadow transition"
    >
      + Add Expense
    </button>
  </div>

  <div className="space-y-4">
    {form.expenses.map((expense, index) => (
      <div
        key={index}
        className="border border-gray-200 rounded-2xl p-5 bg-gray-50 relative"
      >
        {/* REMOVE BUTTON */}
        {/* {form.expenses.length > 1 && (
          <button
            type="button"
            onClick={() => removeExpenseRow(index)}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-100 text-red-500 hover:bg-red-200"
          >
            ×
          </button>
        )} */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* PARTICULARS */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Particulars
            </label>

            <input
              value={expense.particulars}
              onChange={(e) =>
                handleExpenseChange(
                  index,
                  "particulars",
                  e.target.value
                )
              }
              placeholder="Transport / Packaging"
              className="w-full bg-white border border-black/10 text-black rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* SPC */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              SPC %
            </label>

            <input
              type="number"
              value={expense.spc}
              onChange={(e) =>
                handleExpenseChange(
                  index,
                  "spc",
                  e.target.value
                )
              }
               onWheel={(e) => e.target.blur()} 
              placeholder="0"
              className="w-full bg-white border border-black/10 text-black rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

 
         

        </div>
      </div>
    ))}
  </div>
</div>
{/* INCOME TAX SECTION */}
<div className="border border-gray-200 bg-white rounded-2xl p-6 shadow-sm">
  <h3 className="text-xl font-bold text-gray-900 mb-4">
    Income Tax
  </h3>

  <div className="max-w-md">
    <label className="block text-sm font-medium text-gray-600 mb-2">
      Income Tax %
    </label>

    <input
  type="number"
  name="incomeTaxPercentage"
  value={form.incomeTaxPercentage}
  onChange={handleChange}
  onWheel={(e) => e.target.blur()}   // ✅ ADD THIS
  placeholder="0"
  className="w-full bg-white border border-black/10 text-black rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
/>
  </div>
</div>
<div className="space-y-4">
  {form.expenses.map((expense, index) => (
    <div key={index}>
      {/* expense fields */}
    </div>
  ))}
</div>

</div>
        {/* FOOTER */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-white border-t border-gray-200 sticky bottom-0 rounded-b-3xl px-8 py-5">

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl px-6 py-3 rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 font-medium"
          >
            Cancel
          </button>

          <button
            onClick={handleUpdate}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-orange-600 text-white"
          >
            {loading ? "Updating..." : "Update"}
          </button>

        </div>
      </div>
    </div>
  );
}