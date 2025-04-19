import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Rating } from "../../apiTypes";

export interface RatingAspects {
  ta: Rating;
  gra: Rating;
  voc: Rating;
  coco: Rating;
}

export interface AssessData {
  id: number;
  studentName: string;
  trait: string;
  startedTime: string;
  response: string;
  wordsCount: number;
  ratings: RatingAspects;
  comments: string;
  completed: boolean;
}

export const initialState: AssessData[] = [];

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
