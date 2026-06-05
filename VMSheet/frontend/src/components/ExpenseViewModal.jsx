import { X } from "lucide-react";

export default function ExpenseViewModal({
  open,
  onClose,
  expenses = [],
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
     <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-slate-900 to-[#14213d] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">
              All Expenses
            </h2>

            <p className="text-gray-300 text-sm mt-1">
              View all additional expense details
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-red-500 transition flex items-center justify-center"
          >
            <X className="text-white" size={22} />
          </button>
        </div>

        {/* BODY */}
      <div className="p-6 bg-gray-50 flex-1">
          {expenses.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-3">📭</div>

              <h3 className="text-xl font-bold text-gray-700">
                No Additional Expenses
              </h3>

              <p className="text-gray-500 mt-2">
                Only one expense available in this product.
              </p>
            </div>
          ) : (
          <div className="overflow-y-auto max-h-[450px] rounded-2xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="p-4 text-left font-semibold border-b">
                      PARTICULARS
                    </th>

                    <th className="p-4 text-center font-semibold border-b">
                      SPC %
                    </th>

                    <th className="p-4 text-center font-semibold border-b">
                      NET PAY
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {expenses.map((expense, index) => (
                    <tr
                      key={index}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="p-4 font-medium text-gray-800">
                        {expense.particulars ||
                          expense.expense_particulars ||
                          "-"}
                      </td>

                      <td className="p-4 text-center">
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                          {expense.spc_percentage ||
                            expense.expense_spc_percentage ||
                            0}
                          
                        </span>
                      </td>

                      <td className="p-4 text-center font-bold text-green-700">
                        
                        {expense.amount ||
                          expense.expense_amount ||
                          0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* FOOTER */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}