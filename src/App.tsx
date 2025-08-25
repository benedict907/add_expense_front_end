import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
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
    fetch(apiUrl, {
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
      console.log('sdfsdf', e)
    });

  }, [])

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


    await fetch(apiUrl + "/add-expense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).then(resp => {
      setForm({ date: new Date().toISOString().split('T')[0], category: "", description: "", amount: 0 });
      console.log('resss', resp)
      setLoading(false);
      if (resp.status !== 200) {
        throw new Error("Failed to add expense");
      } else {
        alert("Expense added successfully!");
      }

    }).catch(e => {
      alert(e)
      console.log('sdfsdf', e)
    });

  };

  return (


    loading ? <Loader /> : (<div className="min-h-screen bg-red-100 flex flex-col items-center pt-6">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">💰 Expense Tracker</h1>
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
