import { configureStore } from "@reduxjs/toolkit";
import assessReducer from "./features/data/assessDataSlice";
const store = configureStore({
  reducer: {
    assess: assessReducer, // Add the slice reducer to the store
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
