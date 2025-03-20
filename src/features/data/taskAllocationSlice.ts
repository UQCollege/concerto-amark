import {createSlice, PayloadAction} from "@reduxjs/toolkit"
import { TD } from "../../utils/transformApiData"

const initialState: TD[] =[{
  
}as TD]

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
        }
        // updateTasks: (state, action: PayloadAction<UpdateTaskPayload>) => {
        //     const { index, field, value } = action.payload;
        //     console.log(index, field, value)
        //     state[index] = { ...state[index], [field]: value };
        
        // }
    }
});

export const {setTasks, updateTasks} = taskAllocationSlice.actions
export default taskAllocationSlice.reducer