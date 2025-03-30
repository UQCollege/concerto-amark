import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Rating } from "../../apiTypes";
// export type Rating = 1 | 2 | 3 | 4 | 5 | undefined;
export type Task = {
  id: number;

  userId: string;
  trait: string;
  startedTime: string;
  response: string;
  completed: boolean;
  ta: Rating;
  gra: Rating;
  voc: Rating;
  coco: Rating;
  comment: string;
};

// export type TaskAPI = {
//   id: number;
//   userId: string;
//   trait: string;
//   raterName: string;
//   startedTime: string;
//   response: string;

//   ta: Rating | undefined;
//   gra: Rating | undefined;
//   voc: Rating | undefined;
//   coco: Rating | undefined;
// };

export interface AssessData {
  id: number;
  userId: string;
  trait: string;
  startedTime: string;
  response: string;
  ratings: {
    ta: Rating;
    gra: Rating;
    voc: Rating;
    coco: Rating;
  };
  comments: string;
  completed: boolean;
}

export const initialState: AssessData[] = [

  {
    id: 0,
    userId: "",
    trait: "",
    startedTime: "",
    response: "",
    ratings: {
      ta: undefined,
      gra: undefined,
      voc: undefined,
      coco: undefined,
    },
    comments: "",
    completed: false,
  },
];

interface UpdateRatingPayload {
  id: number;
  ratingType: "ta" | "gra" | "voc" | "coco";
  value: Rating;
}

interface UpdateCommentPayload {
  id: number;
  comment: string;
}

interface SetCompletedPayload {
  id: number;
  completed: boolean;
}



const assessSlice = createSlice({
  name: "assess",
  initialState,
  reducers: {
    initialRating: (state, action: PayloadAction<AssessData[]>) => {
      return [...action.payload];
    },
    setRating: (state, action: PayloadAction<UpdateRatingPayload>) => {
      const { id, ratingType, value } = action.payload;

      const assessData = state.find((data) => data.id === id);
      if (assessData) {
        assessData.ratings[ratingType] = value;
      }
    },
    setComment: (state, action: PayloadAction<UpdateCommentPayload>) => {
      const { id, comment } = action.payload;
      const task = state.find((d) => d.id === id);
      if (task) task.comments = comment;
    },
    setCompleted: (state, action: PayloadAction<SetCompletedPayload>) => {
      const { id, completed } = action.payload;
      const task = state.find((d) => d.id === id);
      if (task) task.completed = completed;
    },
  },
});

export const { setRating, initialRating, setCompleted, setComment } = assessSlice.actions;

export default assessSlice.reducer;
