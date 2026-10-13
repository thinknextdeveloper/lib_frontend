import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import menuReducer from "./slices/menuSlice" 
import renewReducer from "./slices/renewSlice"
import issueReducer from "./slices/issueSlice"
import stockReducer from "./slices/stockSlice";
import studentIssueReducer from "./slices/studentIssueSlice";
 import gateReducer from "./slices/gateSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    menu: menuReducer, 
    renew: renewReducer,
    issue: issueReducer,
    stock: stockReducer,
    studentIssue: studentIssueReducer ,
    gate: gateReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;