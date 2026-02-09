# Budget Tracking Module

A comprehensive budget tracking module built with React and Tailwind CSS that provides expense management, budget tracking, and financial planning features.

## Features

### 💰 Expense Management
- Add expenses and income with categories, amounts, dates, and notes
- Delete expenses with a single click
- Sort and filter expenses by date, category, amount, or type
- Visual indicators for overspending

### 📊 Budget Tracking
- Set monthly budgets for different categories
- Visual progress bars showing spending vs. budget
- Red highlighting for overspent categories
- Real-time budget status updates

### 💵 Balance Calculation
- Track base income (default ₹100,000)
- Add additional income entries
- Calculate total spent vs. total income
- Real-time balance display with color coding

### 📈 6-Month Projection
- Automatic calculation of 6-month spending projections
- Based on current month's spending patterns
- Helps with long-term financial planning

### 📅 Next Month Dues
- Track upcoming payments and bills
- Due date tracking with status indicators
- Mark payments as completed
- Total pending amount calculation

## File Structure

```
src/
├── context/
│   └── BudgetContext.jsx          # State management and localStorage persistence
├── components/
│   ├── ExpenseForm.jsx            # Add expense/income form
│   ├── ExpenseTable.jsx           # Display and manage expenses
│   ├── SummaryCard.jsx            # Financial summary and budget management
│   └── NextMonthDues.jsx          # Upcoming payments tracker
└── pages/
    └── BudgetDashboard.jsx        # Main dashboard page
```

## Usage

### Accessing the Budget Dashboard
1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:5173/budget`
3. Or click the "Budget Dashboard" button on the main page

### Adding Expenses
1. Select "Expense" or "Income" type
2. Choose a category from the dropdown
3. Enter the amount in ₹
4. Set the date (defaults to today)
5. Add an optional note
6. Click "Add Expense" or "Add Income"

### Setting Budgets
1. In the Summary Card, click "Add Budget"
2. Select a category
3. Enter the monthly budget amount
4. Click "Set Budget"
5. View progress bars and overspending alerts

### Managing Dues
1. In the Next Month Dues section, click "Add Due"
2. Enter payment name, amount, and due date
3. View upcoming payments with status indicators
4. Mark payments as completed or delete them

## Data Persistence

All data is automatically saved to localStorage and persists between browser sessions:
- Expenses and income entries
- Budget settings
- Due payments
- Income settings

## Styling

The module uses Tailwind CSS for styling with:
- Clean, modern design
- Responsive grid layout
- Color-coded status indicators
- Hover effects and transitions
- Mobile-friendly interface

## Technical Details

- **State Management**: React Context API
- **Data Persistence**: localStorage
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **TypeScript**: Full TypeScript support

## Default Data

The module comes with some default upcoming dues:
- ICICI Credit Card: ₹1,509
- SBI Home Loan: ₹5,620
- HDFC Personal Loan: ₹2,565

You can modify or delete these as needed.

## Browser Support

- Modern browsers with localStorage support
- Responsive design works on desktop and mobile
- No external API dependencies
