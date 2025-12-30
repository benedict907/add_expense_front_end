import React, { useEffect } from 'react';
import { BudgetProvider } from '../context/BudgetContext';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseTable from '../components/ExpenseTable';
import SummaryCard from '../components/SummaryCard';
import NextMonthDues from '../components/NextMonthDues';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchDueData } from '../store/dueSlice';

const BudgetDashboard = () => {
  const dispatch = useAppDispatch();
  const { items: dueItems, loading, error } = useAppSelector((state) => state.due);

  useEffect(() => {
    dispatch(fetchDueData());
  }, [dispatch]);

  // https://sheets.googleapis.com/v4/spreadsheets/1IDBkc4Lh8SueHu3_GMjeybm92Xwiefc7LfeQwsQd-sY/values/October!A1:D18?key=AIzaSyAcjFAa67cEO30VmkbvLhU35VCxu71WJXM

  return (
    <BudgetProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">💰 Budget Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Track your expenses, manage budgets, and plan for the future
            </p>
          </div>

          {/* Due Items Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Due Items from Google Sheets</h2>
            {loading && <p className="text-blue-600">Loading due items...</p>}
            {error && <p className="text-red-600">Error: {error}</p>}
            {dueItems.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dueItems.map((item) => (
                    <div
                      key={item.rowNumber}
                      className={`p-4 rounded-lg border-2 ${item.completed
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-600"> {}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.completed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                          {item.completed ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {Object.entries(item.values).map(([key, value]) => {
                          console.log('Key:', key, 'Value:', value);
                          return <div key={key} className="text-sm">
                             {value}
                          </div>
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Forms and Tables */}
            <div className="space-y-6">
              {/* Expense Form */}
              <ExpenseForm />

              {/* Expense Table */}
              <ExpenseTable />
            </div>

            {/* Right Column - Summary and Dues */}
            <div className="space-y-6">
              {/* Summary Card */}
              <SummaryCard />

              {/* Next Month Dues */}
              <NextMonthDues />
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month's Savings</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    <BudgetProvider>
                      {({ balance }) => {
                        const formatAmount = (amount) => {
                          return new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }).format(amount);
                        };
                        return (
                          <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatAmount(balance)}
                          </span>
                        );
                      }}
                    </BudgetProvider>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    <BudgetProvider>
                      {({ expenses }) => expenses.length}
                    </BudgetProvider>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Upcoming Dues</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    <BudgetProvider>
                      {({ expenses }) => {
                        // This is a simplified count - in a real app, you'd track dues separately
                        const upcomingDues = [
                          { name: 'ICICI Credit Card', amount: 1509 },
                          { name: 'SBI Home Loan', amount: 5620 },
                          { name: 'HDFC Personal Loan', amount: 2565 }
                        ];
                        return upcomingDues.length;
                      }}
                    </BudgetProvider>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  💡 Pro Tips
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Set monthly budgets for each category to track overspending</li>
                    <li>Add recurring income to get accurate balance calculations</li>
                    <li>Use the 6-month projection to plan for future expenses</li>
                    <li>Mark dues as paid to keep track of your payment history</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BudgetProvider>
  );
};

export default BudgetDashboard;
