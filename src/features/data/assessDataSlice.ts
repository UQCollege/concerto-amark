import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Rating = 1 | 2 | 3 | 4 | 5 | undefined;

export interface AssessData {
  userId: string;
  trait: string;
  raterName: string;
  startedTime: string;
  ratings: {
    ta: Rating;
    gra: Rating;
    voc: Rating;
    coco: Rating;
  };
  comments: string;
}

export const initialState: AssessData[] = [
  {
    userId: "",
    trait: "",
    raterName: "",
    startedTime: "",
    ratings: {
      ta: undefined,
      gra: undefined,
      voc: undefined,
      coco: undefined,
    },
    comments: "",
  },
];

interface UpdateRatingPayload {
  userId: string;
  ratingType: "ta" | "gra" | "voc" | "coco";
  value: Rating;
}

const assessSlice = createSlice({
  name: "assess",
  initialState,
  reducers: {
    setRating: (state, action: PayloadAction<UpdateRatingPayload>) => {
      const { userId, ratingType, value } = action.payload;

      const assessData = state.find((data) => data.userId === userId);
      if (assessData) {
        assessData.ratings[ratingType] = value;
      }
    },
  },
});

export const { setRating } = assessSlice.actions;

export default assessSlice.reducer;
