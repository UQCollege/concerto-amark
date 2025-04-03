import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { TD } from "../../utils/transformApiData"
import { updateTasksTable } from "../../utils/apiService";
import { SidebarItem } from "../../uis/Sidebar";


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
                console.log(taskIds)
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
        selectedTasks: (state, action: PayloadAction<number[]>) => {
            const selectedId = action.payload
            for (const num of selectedId) {
                const selectedTask = state.filter((task) => task.id === num)[0]
                selectedTask.selected = true
            }
        }
        ,
        removeTasks: (state, action: PayloadAction<{ id: number }>) => {
            return state.filter(task => task.id !== action.payload.id);

        }
    }
});

export const { setTasks, updateTasks, selectedTasks, removeTasks } = taskAllocationSlice.actions
export default taskAllocationSlice.reducer