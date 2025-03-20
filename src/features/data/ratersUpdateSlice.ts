import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type RaterList = string[]

export const initialState:RaterList = []
export interface RaterListPayLoad {
    prev: string;
    new: string;
}

const ratersUpdateSlice = createSlice({
    name: "ratersUpdate",
    initialState,
    reducers: {
        setRaters: (state, action: PayloadAction<RaterListPayLoad[]>) => {
            // Replace old names with new ones based on the payload, and add new ones if not found
            const updatedState = state.map(rater => {
                const replacement = action.payload.find(item => item.prev === rater);
                return replacement ? replacement.new : rater;
            });

            action.payload.forEach(item => {
                if (!state.includes(item.prev)) {
                    updatedState.push(item.new);
                }
            });

            return updatedState;
        }
    }
});

export const { setRaters } = ratersUpdateSlice.actions;
export default ratersUpdateSlice.reducer;
