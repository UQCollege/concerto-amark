import {createSlice, PayloadAction} from "@reduxjs/toolkit"
import { TD } from "../../utils/transformApiData"

const initialState: TD[] =[]

// interface UpdateTaskPayload {
//     index: number;
//     field: keyof TD;
//     value: string;
// }

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
        
            if (index !== -1) {
                state[index] = updatedTask; // Replace the existing record
            }
        }, 
        removeTasks: (state, action: PayloadAction<{id:number}>) => {
            return state.filter(task => task.id !== action.payload.id);
        
        }
    }
});

export const {setTasks, updateTasks, removeTasks} = taskAllocationSlice.actions
export default taskAllocationSlice.reducer