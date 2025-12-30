import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Loader from "./Loader"


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
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;
  console.log("API URL:", apiUrl);
  useEffect(() => {
    fetch(apiUrl || 'http://localhost:3001', {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    }).then(resp => {
      if (resp.status !== 200) {
        setConnected(false);
        throw new Error("Failed to Connect to API");
      } else {
        setConnected(true);
        console.log("Connection made successfully!");
      }

    }).catch(e => {
      alert(e)
      console.log('API Connection Error:', e)
    });

  }, [])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log({ name, value })
    setForm((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.description || form.amount <= 0 || form.category === "") {
      alert("Please fill all fields correctly");
      return;
    }
    setLoading(true);

    await fetch((apiUrl || 'http://localhost:3001') + "/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        type: 'expense',
        note: form.description
      }),
    }).then(resp => {
      setForm({ date: new Date().toISOString().split('T')[0], category: "", description: "", amount: 0 });
      console.log('Response:', resp)
      setLoading(false);
      if (resp.status !== 201) {
        throw new Error("Failed to add expense");
      } else {
        alert("Expense added successfully!");
      }

    }).catch(e => {
      alert(e)
      setLoading(false);
      console.log('API Error:', e)
    });

  };

  return (


    loading ? <Loader /> : (<div className="min-h-screen bg-red-100 flex flex-col items-center pt-6">
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-600">💰 Expense Tracker</h1>
        <Link 
          to="/budget" 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Budget Dashboard
        </Link>
      </div>
      {connected ? <div className="w-full bg-green-500 flex justify-center p-2 mb-4 text-white font-semibold shadow-md">
        Online
      </div> : null}
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md w-full max-w-md mb-6"
      >
        <div className="mb-4">
          <label htmlFor="date" className="block text-sm font-medium mb-1">Dates</label>
          <input
            id="date"
            type="date"
            name="date"
            value={form.date ? form.date : new Date().toDateString()}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
          />
        </div>


        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
          <input
            id="description"
            type="text"
            name="description"
            placeholder="What was this for?"
            value={form.description}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="number" className="block text-sm font-medium mb-1">Amount</label>
          <input
            id="number"
            type="number"
            name="amount"
            placeholder="₹0"
            value={form.amount || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="category" className="block text-sm font-medium mb-1">Category</label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border p-2 rounded-lg"
          >
            <option value="">Select category</option>
            <option value="Kotak">Kotak Card</option>
            <option value="ICICI">ICICI</option>
            <option value="SBI">SBI</option>
            <option value="HDFC">HDFC</option>
            <option value="MISC">MISC</option>
            <option value="GROCERY">GROCERY</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 active:scale-95 transition"
        >
          Add Expense
        </button>
      </form>
    </div>)


  );

}
