import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {Rating} from "./assessDataSlice";

export interface TableData {
    id: number;
    userId: string;
    trait: string;
    startedTime: string;
    rater1: string;
    rater2: string;
    ratings: {
        ta: Rating;
        gra: Rating;
        voc: Rating;
        coco: Rating;
      };
}

export const initialState: TableData[] = [
    {
        id: 0,
        userId: "",
        trait: "",
        startedTime: "",
        rater1: "",
        rater2: "",
        ratings: {
            ta: undefined,
            gra: undefined,
            voc: undefined,
            coco: undefined,
        },
    },
];

const assessTaskstatusSlice = createSlice({
    name: "assessTaskstatus",
    initialState,
    reducers: {
        setTableData: (state, action: PayloadAction<TableData[]>) => {
            return action.payload;
        },
    },
}); 

export const { setTableData } = assessTaskstatusSlice.actions;
export default assessTaskstatusSlice.reducer;