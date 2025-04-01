import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { TD } from "../../utils/transformApiData"
import { updateTasksTable } from "../../utils/apiService";

const initialState: TD[] = []

const taskAllocationSlice = createSlice({
    name: "taskAllocation",
    initialState,
    reducers: {
        setTasks: (state, action: PayloadAction<TD[]>) => {
            return [...action.payload];
        },
        updateTasks: (state, action: PayloadAction<TD>) => {
            const updatedTask = action.payload;
            const index = state.findIndex(task => task.id === updatedTask.id);
            
            console.log("update raters: ", updatedTask)
            if (index !== -1) {
                state[index] = updatedTask; // Replace the existing record
            }
            updateTasksTable(updatedTask)
        },
        removeTasks: (state, action: PayloadAction<{ id: number }>) => {
            return state.filter(task => task.id !== action.payload.id);

        }
    }
});

export const { setTasks, updateTasks, removeTasks } = taskAllocationSlice.actions
export default taskAllocationSlice.reducer