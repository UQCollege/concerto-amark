import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { TD, transformApiData } from "../../utils/transformApiData"
import { createTaskInTable, deleteTaskInTable, updateTasksTable } from "../../utils/apiService";
import { AppDispatch } from "../../store/store";
import { createAsyncThunk } from '@reduxjs/toolkit';

const initialState: TD[] = []
export const deleteTask = createAsyncThunk(
    'tasks/deleteTask', // Action type prefix
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (id: number, thunkAPI) => {
        // This is where the side effect (API call) goes
        await deleteTaskInTable(id); 
        
        // Return the ID so the reducer knows what to remove from state
        return id; 
    }
);

export const updateTasks = createAsyncThunk(
    'tasks/updateTasks', // Action type prefix
    async (payload: { idList: number[]; raterName: string; isMulti: boolean }) => {
        // 1. Perform the API call (the side effect)
        await updateTasksTable({ idList: payload.idList, raterName: payload.raterName });

        // 2. Return the necessary data for the reducer to update the state
        return { 
            idList: payload.idList, 
            raterName: payload.raterName, 
            isMulti: payload.isMulti 
        };
    }
);
const taskAllocationSlice = createSlice({
    name: "taskAllocation",
    initialState,
    reducers: {
        setTasks: (state, action: PayloadAction<TD[]>) => {
            return [...action.payload];
        },
        // updateTasks: (state, action: PayloadAction<TD>) => {
        //     const { id, raterName } = action.payload

        //     if (state.some((item) => item.selected === true)) {
        //         // update multipla tasks
        //         const taskIds = state.filter((item) => item.selected === true).map((item) => item.id)

        //         for (const id of taskIds) {
        //             const assessmentTaskItem = state.filter((item) => item.id === id)[0]
        //             assessmentTaskItem.raterName = raterName
        //             assessmentTaskItem.selected = false

        //         }

        //         updateTasksTable({ idList: [...taskIds], raterName })

        //     } else {

        //         const updatedSingleTask = action.payload;
        //         const index = state.findIndex(task => task.id === updatedSingleTask.id);


        //         if (index !== -1) {
        //             state[index].raterName = raterName; // Replace the existing record
        //         }


        //         updateTasksTable({ idList: [id], raterName })
        //     }
        // },
        addTask: (state, action: PayloadAction<TD | TD[]>) => {
            // Add the new task to the state
            console.log("addTask");
            if (Array.isArray(action.payload)) {
                // If payload is an array, spread it into the state
                state.push(...action.payload);
                return;
            }else{

                state.push(action.payload);
                return
            }
        },
      
        selectedTasks: (state, action: PayloadAction<number[]>) => {
            const selectedId = action.payload
            for (const num of selectedId) {
                const selectedTask = state.filter((task) => task.id === num)[0]
                selectedTask.selected = true
            }
        },
        cancelSelectedTasks: (state) => {
            for (const task of state) {
                if (task.selected === true) {
                    task.selected = false
                }
            }
        }
      
    },
    extraReducers: (builder) => {
        builder.addCase(deleteTask.fulfilled, (state, action) => {
            // The API call is done, now update the state immutably.
            const deletedId = action.payload; // payload is the ID we returned from the thunk
          
            return state.filter(task => task.id !== deletedId);
            
           
        })
        // 2. Logic for successful TASK UPDATE
    .addCase(updateTasks.fulfilled, (state, action) => {
        const { idList, raterName } = action.payload;

        // Use the map function to generate the new state array immutably.
        return state.map(task => {
            // Check if the current task's ID is one of the updated IDs
            if (idList.includes(task.id)) {
                // If it is, return a NEW object with the updated properties.
                return { 
                    ...task, 
                    raterName: raterName,
                    selected: false // Ensure selection is cleared after update
                };
            }
            // Otherwise, return the task unchanged.
            return task;
        });
    });
        // You could also handle .pending and .rejected cases for loading/error states
    },
});

export const { setTasks, selectedTasks, cancelSelectedTasks, addTask } = taskAllocationSlice.actions
export default taskAllocationSlice.reducer

// Async thunk for creating a new task
export const createNewTask =
    (data: { studentCode?: string | undefined; trait?: string | undefined; raterName?: string | undefined }) =>
    async (dispatch: AppDispatch) => {
        const { studentCode, trait, raterName } = data;

        if (!studentCode || !trait || !raterName) {
            console.error("Missing required fields: studentCode, trait, or raterName");
            return;
        }

        try {
            const response = await createTaskInTable({
                student_code: studentCode,
                trait: trait,
                rater_name: raterName,
            });
            console.log("createNewTask response: ", response,response["created tasks"]);
            const tdResponse = transformApiData(Array.isArray(response["created tasks"]) ? response["created tasks"] : [response["created tasks"]]);
            console.log("tdResponse: ", tdResponse);

            if (response) {
                // Dispatch the addTask action to update the state
                dispatch(addTask(tdResponse));
            }
        } catch (error) {
            console.error("Error creating task: ", error);
        }
    };