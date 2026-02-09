import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { isCompleted } from '../utils/helpers';

// Types
export interface DueItem {
  rowNumber: number;
  values: {
    col1?: string;
    col2?: string;
    col3?: string;
    col4?: string;
  };
  completed: boolean;
}

interface DueState {
  items: DueItem[];
  loading: boolean;
  error: string | null;
}

// API Configuration
const API_KEY = 'AIzaSyAcjFAa67cEO30VmkbvLhU35VCxu71WJXM';
const SHEET_ID = '1IDBkc4Lh8SueHu3_GMjeybm92Xwiefc7LfeQwsQd-sY';
const RANGE = 'October!A1:D18';

// Async thunk for fetching due data
export const fetchDueData = createAsyncThunk(
  'due/fetchDueData',
  async (_, { rejectWithValue }) => {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?ranges=${RANGE}&includeGridData=true&key=${API_KEY}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      // console.log('Data:', data);
      const rows = data.sheets[0].data[0].rowData?.slice(1).filter((row: any) => row !== undefined) || [];

      const expensesData: DueItem[] = [];

      rows.forEach((row: any, i: number) => {
        const rowData: DueItem = {
          rowNumber: i + 1,
          values: {},
          completed: false
        };
        
        row.values?.forEach((cell: any, j: number) => {
          const color = cell.effectiveFormat?.backgroundColor;
          const value = cell.formattedValue;
          
          if(value !== undefined) {
            rowData.values[`col${j + 1}` as keyof typeof rowData.values] = value;
            console.log(`Cell ${i + 1},${j + 1} => ${value},${color}`);
            
            // Check completion status (assuming it's based on column 1 or 2)
            if(j === 1) { // Column B
              rowData.completed = isCompleted(color);
            }
          }
        });
        
        // Only add row if it has values
        if(Object.keys(rowData.values).length > 0) {
          expensesData.push(rowData);
        }
      });
      
      console.log('Expenses Data Array:', expensesData);
      return expensesData;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  }
);

// Initial state
const initialState: DueState = {
  items: [],
  loading: false,
  error: null,
};

// Slice
const dueSlice = createSlice({
  name: 'due',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateDueItem: (state, action: PayloadAction<{ rowNumber: number; completed: boolean }>) => {
      const { rowNumber, completed } = action.payload;
      const item = state.items.find(item => item.rowNumber === rowNumber);
      if (item) {
        item.completed = completed;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDueData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDueData.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchDueData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, updateDueItem } = dueSlice.actions;
export default dueSlice.reducer;
