# Expense Tracker - Full Stack Setup Guide

This guide will help you set up both the frontend and backend for the Expense Tracker application.

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **MongoDB** (local installation or MongoDB Atlas account)

## Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Run the setup script
./start.sh

# Or manually:
npm install
cp config.env.example config.env
# Edit config.env with your MongoDB URI

# Start the development server
npm run dev
```

The backend will be available at `http://localhost:3001`

### 2. Frontend Setup

```bash
# Navigate to frontend directory (root of project)
cd ..

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 3. Configure Frontend to Use Backend

Update your frontend environment variables:

```bash
# Create .env file in the root directory
echo "VITE_API_URL=http://localhost:3001" > .env
```

## Detailed Setup

### Backend Configuration

1. **MongoDB Setup**:
   - **Local MongoDB**: Install MongoDB locally and ensure it's running
   - **MongoDB Atlas**: Create a free account and get your connection string

2. **Environment Variables**:
   Edit `backend/config.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/expense_tracker
   # OR for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense_tracker
   
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

3. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```

### Frontend Configuration

1. **Environment Variables**:
   Create `.env` in the root directory:
   ```env
   VITE_API_URL=http://localhost:3001
   ```

2. **Start Frontend**:
   ```bash
   npm run dev
   ```

## API Endpoints

The backend provides the following API endpoints:

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create new expense
- `GET /api/expenses/:id` - Get single expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/stats/summary` - Get expense statistics

### Budgets
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create/update budget
- `GET /api/budgets/:id` - Get single budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Income
- `GET /api/income` - Get income for current month
- `POST /api/income` - Create/update income
- `PUT /api/income/:id` - Update income
- `DELETE /api/income/:id` - Delete income

### Dues
- `GET /api/dues` - Get all dues
- `POST /api/dues` - Create new due
- `GET /api/dues/:id` - Get single due
- `PUT /api/dues/:id` - Update due
- `DELETE /api/dues/:id` - Delete due
- `PATCH /api/dues/:id/mark-paid` - Mark due as paid

## Testing

### Test Backend API
```bash
cd backend
npm test
```

### Test Frontend
```bash
npm run dev
# Open http://localhost:5173 in your browser
```

## Project Structure

```
expense-tracker/
├── backend/                 # Backend API
│   ├── config/             # Database configuration
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   └── README.md           # Backend documentation
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── context/            # React context
│   ├── pages/              # Page components
│   └── store/              # Redux store
├── package.json            # Frontend dependencies
└── SETUP_GUIDE.md          # This file
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:
   - Ensure MongoDB is running locally
   - Check your MongoDB URI in `config.env`
   - For MongoDB Atlas, verify your connection string

2. **CORS Error**:
   - Check that `FRONTEND_URL` in `config.env` matches your frontend URL
   - Ensure the frontend is running on the correct port

3. **Port Already in Use**:
   - Change the PORT in `config.env` to a different port
   - Update `VITE_API_URL` in frontend `.env` accordingly

4. **Frontend Not Connecting to Backend**:
   - Verify `VITE_API_URL` in frontend `.env`
   - Check that the backend is running
   - Look at browser console for error messages

### Getting Help

- Check the console logs for both frontend and backend
- Verify all environment variables are set correctly
- Ensure all dependencies are installed
- Check that MongoDB is running and accessible

## Features

### Backend Features
- RESTful API design
- MongoDB integration with Mongoose
- Input validation and error handling
- CORS support for frontend integration
- Security middleware (Helmet)
- Request logging (Morgan)
- Comprehensive error handling

### Frontend Features
- React with TypeScript
- Redux for state management
- Tailwind CSS for styling
- Responsive design
- Expense tracking and management
- Budget management
- Income tracking
- Due payment tracking
- Financial summaries and analytics

## Next Steps

1. **Deploy Backend**: Consider deploying to services like Heroku, Railway, or DigitalOcean
2. **Deploy Frontend**: Deploy to Vercel, Netlify, or similar services
3. **Add Authentication**: Implement user authentication and authorization
4. **Add More Features**: Categories, reports, data export, etc.
5. **Add Tests**: Implement comprehensive testing suite

## License

ISC
