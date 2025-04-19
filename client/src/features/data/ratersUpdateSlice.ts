import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// Types - this is a combined query result, totalTasks is not a data column
export type RaterList = { raterName: string; raterDigitalId: string; active: boolean; totalTasks?: number}; 

export interface RaterListUpdatePayLoad {
    prev: RaterList;
    new: RaterList;
}

// Async functions (these should come from your DB module)
import { deleteRaterInTable, getRatersFromDB, writeRatersToDatabase } from "../../utils/apiService";

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

// Async thunk: Delete from DB and store
export const deleteRater = createAsyncThunk<string, string>(
    "ratersUpdate/deleteRaters",
    async (payload:string) => {
        await deleteRaterInTable(payload);
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
            })
            .addCase(deleteRater.fulfilled, (state, action: PayloadAction<string>) => {
                // Remove the deleted rater from the state using the id returned by the async thunk
   
                const deleteRater = state.filter(rater => rater.raterDigitalId === action.payload);
                deleteRater[0].active = false;
                return state
            });
    }
});

export default ratersUpdateSlice.reducer;
