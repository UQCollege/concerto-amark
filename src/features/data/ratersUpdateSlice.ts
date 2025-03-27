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
            console.log("Setting raters:", action.payload);
            const updatedState = state.map(rater => {
                const replacement = action.payload.find(item => item.prev === rater);
                return replacement ? replacement.new : rater;
            });

            action.payload.forEach(item => {
                if (!state.includes(item.prev)) {
                    updatedState.push(item.new);
                }
            });

            // Call an async function to write the updated state to the database
            (async () => {
                try {
                    await writeRatersToDatabase(updatedState);
                } catch (error) {
                    console.error("Failed to write raters to database:", error);
                }
            })();

            return updatedState;
        }
    }
});

// Example async function to write raters to the database
async function writeRatersToDatabase(raters: RaterList): Promise<void> {
    // Replace this with actual database writing logic
    console.log("Writing raters to database:", raters);
}

export const { setRaters } = ratersUpdateSlice.actions;
export default ratersUpdateSlice.reducer;
