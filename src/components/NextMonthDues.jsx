import React, { useState } from 'react';

const NextMonthDues = () => {
  const [dues, setDues] = useState([
    { id: 1, name: 'ICICI Credit Card', amount: 1509, dueDate: '2024-02-15', status: 'pending' },
    { id: 2, name: 'SBI Home Loan', amount: 5620, dueDate: '2024-02-20', status: 'pending' },
    { id: 3, name: 'HDFC Personal Loan', amount: 2565, dueDate: '2024-02-25', status: 'pending' },
    { id: 4, name: 'Electricity Bill', amount: 1200, dueDate: '2024-02-10', status: 'pending' },
    { id: 5, name: 'Internet Bill', amount: 800, dueDate: '2024-02-12', status: 'pending' },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDue, setNewDue] = useState({
    name: '',
    amount: '',
    dueDate: ''
  });

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (dueDate) => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return 'text-red-600 bg-red-100';
    if (days <= 3) return 'text-orange-600 bg-orange-100';
    if (days <= 7) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusText = (dueDate) => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due Today';
    if (days === 1) return 'Due Tomorrow';
    return `${days} days left`;
  };

  const handleAddDue = (e) => {
    e.preventDefault();
    if (newDue.name && newDue.amount && newDue.dueDate) {
      const due = {
        id: Date.now(),
        name: newDue.name,
        amount: parseFloat(newDue.amount),
        dueDate: newDue.dueDate,
        status: 'pending'
      };
      setDues(prev => [...prev, due]);
      setNewDue({ name: '', amount: '', dueDate: '' });
      setShowAddForm(false);
    }
  };

  const handleDeleteDue = (id) => {
    setDues(prev => prev.filter(due => due.id !== id));
  };

  const handleMarkPaid = (id) => {
    setDues(prev => prev.map(due => 
      due.id === id ? { ...due, status: 'paid' } : due
    ));
  };

  const totalAmount = dues
    .filter(due => due.status === 'pending')
    .reduce((sum, due) => sum + due.amount, 0);

  const upcomingDues = dues
    .filter(due => due.status === 'pending')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Next Month Dues</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          + Add Due
        </button>
      </div>

      {/* Total Amount */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Pending Amount</span>
          <span className="text-xl font-bold text-blue-600">
            {formatAmount(totalAmount)}
          </span>
        </div>
      </div>

      {/* Add Due Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add New Due</h3>
            <form onSubmit={handleAddDue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Name
                </label>
                <input
                  type="text"
                  value={newDue.name}
                  onChange={(e) => setNewDue(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Credit Card Payment"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={newDue.amount}
                  onChange={(e) => setNewDue(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newDue.dueDate}
                  onChange={(e) => setNewDue(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Add Due
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dues List */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {upcomingDues.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No upcoming dues
          </div>
        ) : (
          upcomingDues.map((due) => (
            <div key={due.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-800">{due.name}</h3>
                  <p className="text-sm text-gray-600">
                    Due: {formatDate(due.dueDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-800">
                    {formatAmount(due.amount)}
                  </p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(due.dueDate)}`}>
                    {getStatusText(due.dueDate)}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleMarkPaid(due.id)}
                  className="flex-1 bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 transition-colors"
                >
                  Mark as Paid
                </button>
                <button
                  onClick={() => handleDeleteDue(due.id)}
                  className="bg-red-100 text-red-600 py-1 px-3 rounded text-sm hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Total Dues</p>
            <p className="text-lg font-semibold text-gray-800">{upcomingDues.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Due This Week</p>
            <p className="text-lg font-semibold text-orange-600">
              {upcomingDues.filter(due => getDaysUntilDue(due.dueDate) <= 7).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NextMonthDues;
