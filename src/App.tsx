import { useState, type ChangeEvent, type FormEvent } from "react";

type Expense = {
  date: string;
  category: string;
  description: string;
  amount: number;
};

export default function App() {
  const [form, setForm] = useState<Expense>({
    date: new Date().toISOString().split('T')[0], // Default to today's date
    category: "",
    description: "",
    amount: 0,
  });


  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log({ name, value })
    setForm((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.description || form.amount <= 0) {
      alert("Please fill all fields correctly");
      return;
    }
    const apiUrl = import.meta.env.VITE_API_URL;
    console.log("API URL:", apiUrl);

    await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).then(resp => {
      setForm({ date: new Date().toISOString().split('T')[0], category: "", description: "", amount: 0 });
      console.log('resss', resp)
      if(resp.status !== 200) {
        throw new Error("Failed to add expense");
      }else{
        alert("Expense added successfully!");
      }
     
    }).catch(e => {
      alert(e)
      console.log('sdfsdf', e)
    });

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
            value={form.date ? form.date : new Date().toDateString()}
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
