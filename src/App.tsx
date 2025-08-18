import { useState, type ChangeEvent, type FormEvent } from "react";

type Expense = {
  date: string;
  category: string;
  description: string;
  amount: number;
};

export default function App() {
  const [form, setForm] = useState<Expense>({
    date: "",
    category: "",
    description: "",
    amount: 0,
  });


  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value,
    }));
  };

  const handleSubmit = async(e: FormEvent) => {
    e.preventDefault();
     await fetch("https://add-expense-back-end.onrender.com/add-expense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).then(resp=>{
      setForm({ date: "", category: "", description: "", amount: 0 });
      console.log('resss',resp)
    }).catch(e=>{
      console.log('sdfsdf',e)
    });
    // if (!form.date || !form.description || !form.amount) return;
    // setExpenses((prev) => [...prev, form]);
    // setForm({ date: "", category: "", description: "", amount: 0 });
  };

  return (
    <div className="min-h-screen bg-red-100 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">💰 Expense Tracker</h1>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md w-full max-w-md mb-6"
      >
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Description</label>
          <input
            type="text"
            name="description"
            placeholder="What was this for?"
            value={form.description}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            type="number"
            name="amount"
            placeholder="₹0"
            value={form.amount || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
        >
          Add Expense
        </button>
      </form>

    </div>
  );
}
