import { useState } from "react";
import { createSkuCalculation } from "../api/skuCalculationApi";
export default function AddCalculationModal({
  open,
  onClose,
  onSuccess,
}) {
  const initialForm = {
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
};
 const handleCreate = async () => {
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

      // ✅ EXPENSE ARRAY
     expenses: form.expenses.map((expense, index) => ({
  row_order: index,

  expense_particulars: expense.particulars,

  expense_spc_percentage: Number(expense.spc),
})),
  income_tax_percentage: Number(form.incomeTaxPercentage),
    };

    console.log("PAYLOAD => ", payload);

    const response = await createSkuCalculation(payload);

    console.log("API RESPONSE => ", response);

 alert("Created successfully!");
 // ✅ clear form


// ✅ refresh dashboard data
if (onSuccess) {
  await onSuccess();
}
// ✅ clear form
resetForm();

// ✅ close modal
onClose();

  } catch (err) {
    console.error(err);

    alert(err.message);
  } finally {
    setLoading(false);
  }
};
  const [loading, setLoading] = useState(false);

const [form, setForm] = useState(initialForm);
const resetForm = () => {
  setForm(initialForm);
};
const handleExpenseChange = (index, field, value) => {
  const updated = [...form.expenses];
  updated[index][field] = value;

  setForm((prev) => ({
    ...prev,
    expenses: updated,
  }));
};

const addExpenseRow = () => {
  setForm((prev) => ({
    ...prev,
    expenses: [
      ...prev.expenses,
     { particulars: "", spc: "" }
    ],
  }));
};

const removeExpenseRow = (index) => {
  const updated = form.expenses.filter((_, i) => i !== index);

  setForm((prev) => ({
    ...prev,
    expenses: updated,
  }));
};
const handleChange = (e) => {
  const { name, value } = e.target;

  setForm((prev) => ({
    ...prev,
    [name]: value,
  }));
};
  
  if (!open) return null;

  return (
   <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 backdrop-blur-[2px] px-4 py-6">

      {/* MODAL BOX */}
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl">

        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 bg-white sticky top-0 z-10 rounded-t-3xl">
         <h2 className="text-3xl font-bold text-gray-900">
            Create New Product Calculation
          </h2>
<button
  onClick={() => {
    resetForm();
    onClose();
  }}
           className="w-10 h-10 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-500 text-gray-500 text-2xl flex items-center justify-center transition"
          >
            ×
          </button>
        </div>

        {/* BODY */}
       <div className="p-8 space-y-8 bg-gray-50">

          {/* INPUT PRICING */}
          <div className="border border-gray-200 bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-black mb-4">
              Input Pricing (Buying)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium text-gray mb-2">
                  Product Name *
                </label>

              <input
  name="inputProductName"
  value={form.inputProductName}
  onChange={handleChange}
  className="w-full bg-white border border-black/10 text-black placeholder:text-gray-500 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500"
/>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray mb-2">
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

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
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

              <div>
                <label className="block text-sm font-medium text-gray mb-2">
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

          {/* OUTPUT PRICING */}
         <div className="border border-gray-200 bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-black mb-4">
              Output Pricing (Selling)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium text-gray mb-2">
                  Product Name *
                </label>

               <input
  name="outputProductName"
  value={form.outputProductName}
  onChange={handleChange}
  className="w-full bg-white border border-black/10 text-black placeholder:text-gray-500 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500"
/>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray mb-2">
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

              <div>
                <label className="block text-sm font-medium text-gray mb-2">
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

              <div>
                <label className="block text-sm font-medium text-gray mb-2">
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
      className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium shadow"
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
        {form.expenses.length > 1 && (
          <button
            type="button"
            onClick={() => removeExpenseRow(index)}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-100 text-red-500 hover:bg-red-200"
          >
            ×
          </button>
        )}

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
    handleExpenseChange(index, "spc", e.target.value)
  }
  onWheel={(e) => e.target.blur()}   // ✅ ADD THIS
  placeholder="0"
  className="w-full bg-white border border-black/10 text-black rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
/>
          </div>

         
        </div>
      </div>
    ))}
  </div>
</div>
{/* SEPARATE INCOME TAX SECTION */}
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
</div>
        {/* FOOTER */}
        <div className="flex justify-end gap-4 px-8 py-5 border-t border-gray-200 bg-white rounded-b-3xl sticky bottom-0">
<button
  onClick={() => {
    resetForm();
    onClose();
  }}
           className="px-5 py-2 rounded-xl px-6 py-3 rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 font-medium"
          >
            Cancel
          </button>

          <button
  onClick={handleCreate}
  disabled={loading}
  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:opacity-90 shadow-lg transition"
>
  {loading ? "Creating..." : "Create"}
</button>

        </div>
      </div>
    </div>
  );
}