import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { TD, transformApiData } from "../../utils/transformApiData"
import { createTaskInTable, deleteTaskInTable, updateTasksTable } from "../../utils/apiService";
import { AppDispatch } from "../../store/store";


const initialState: TD[] = []

const taskAllocationSlice = createSlice({
    name: "taskAllocation",
    initialState,
    reducers: {
        setTasks: (state, action: PayloadAction<TD[]>) => {
            return [...action.payload];
        },
        updateTasks: (state, action: PayloadAction<TD>) => {
            const { id, raterName } = action.payload

            if (state.some((item) => item.selected === true)) {
                // update multipla tasks
                const taskIds = state.filter((item) => item.selected === true).map((item) => item.id)

                for (const id of taskIds) {
                    const assessmentTaskItem = state.filter((item) => item.id === id)[0]
                    assessmentTaskItem.raterName = raterName
                    assessmentTaskItem.selected = false

                }

                updateTasksTable({ idList: [...taskIds], raterName })

            } else {

                const updatedSingleTask = action.payload;
                const index = state.findIndex(task => task.id === updatedSingleTask.id);


                if (index !== -1) {
                    state[index].raterName = raterName; // Replace the existing record
                }


                updateTasksTable({ idList: [id], raterName })
            }
        },
        addTask: (state, action: PayloadAction<TD>) => {
            // Add the new task to the state
            console.log("addTask");
            state.push(action.payload);
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
        ,
        removeTasks: (state, action: PayloadAction<{ id: number }>) => {
            const { id } = action.payload

            deleteTaskInTable(id)
            return state.filter(task => task.id !== action.payload.id);

        }
    }
});

export const { setTasks, updateTasks, selectedTasks, cancelSelectedTasks, removeTasks, addTask } = taskAllocationSlice.actions
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
            const tdResponse = transformApiData(Array.isArray(response) ? response : [response]);

            if (response) {
                // Dispatch the addTask action to update the state
                dispatch(addTask(tdResponse[0]));
            }
        } catch (error) {
            console.error("Error creating task: ", error);
        }
    };