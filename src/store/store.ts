import { configureStore } from '@reduxjs/toolkit';
import dueReducer from './dueSlice';

export const store = configureStore({
  reducer: {
    due: dueReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
