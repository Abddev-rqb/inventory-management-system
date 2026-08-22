function ReturnExpensesTable({ expenses }) {
  return (
    <div className="returns-table-section">
      <div className="table-scroll-container">
        <table className="data-table return-expenses-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Laptop Details</th>
              <th>Technician</th>
              <th>Item Name</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Expense Total</th>
              <th>Created By</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td>{expense.customer_name}</td>
                <td>
                  <div className="return-laptop-details">
                    <strong>{expense.company} {expense.model_number}</strong>
                    <span>Serial: {expense.serial_number}</span>
                  </div>
                </td>
                <td>{expense.technician_name || "Unassigned"}</td>
                <td>{expense.item_name}</td>
                <td>{formatMoney(expense.unit_price)}</td>
                <td>{expense.quantity}</td>
                <td><strong>{formatMoney(expense.total_amount)}</strong></td>
                <td>{expense.created_by_name}</td>
                <td>{formatDateTime(expense.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN");
}

export default ReturnExpensesTable;
