import { configureStore } from "@reduxjs/toolkit";
import assessReducer from "../features/data/assessDataSlice";
import ratersUpdateReducer from "../features/data/ratersUpdateSlice"
import taskAllocationReducer from "../features/data/taskAllocationSlice"
import assessTaskstatusReducer from "../features/data/joinTable";
import authReducer from "../features/auth/authSlice";

const store = configureStore({
  reducer: {
    assess: assessReducer, // Add the slice reducer to the store
    ratersUpdate: ratersUpdateReducer,
    taskAllocation: taskAllocationReducer,
    assessTaskstatus: assessTaskstatusReducer,
    auth: authReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
