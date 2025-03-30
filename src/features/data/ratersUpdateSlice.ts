import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// Types
export type RaterList = { raterName: string; raterDigitalId: string };

export interface RaterListUpdatePayLoad {
    prev: RaterList;
    new: RaterList;
}

// Async functions (these should come from your DB module)
import { getRatersFromDB, writeRatersToDatabase } from "../../utils/apiService";

// Initial state
const initialState: RaterList[] = [];

// Async thunk: Fetch from DB
export const fetchRaters = createAsyncThunk<RaterList[]>(
    "ratersUpdate/fetchRaters",
    async () => {
        return await getRatersFromDB();
    }
);

// Async thunk: Update DB and store
export const createRaters = createAsyncThunk<RaterList[], RaterList[]>(
    "ratersUpdate/createRaters",
    async (payload) => {
        await writeRatersToDatabase(payload);
        return payload;
    }
);

const ratersUpdateSlice = createSlice({
    name: "ratersUpdate",
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchRaters.fulfilled, (state, action: PayloadAction<RaterList[]>) => {
                return action.payload;
            })
            .addCase(createRaters.fulfilled, (state, action: PayloadAction<RaterList[]>) => {
                return action.payload;
            });
    }
});

export default ratersUpdateSlice.reducer;
