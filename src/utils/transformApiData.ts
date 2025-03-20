export type ApiData = {
  id: number;
  response: string;
  startedTime: string;
  trait: string;
  userId: string;
  raterName: string;
  ta: number | null;
  gra: number | null;
  voc: number | null;
  coco: number | null;
};

// TD: Task distribution
export interface TD {
  id: number;
  trait: string;
  userId: string;
  startedTime: string;
  rater1: string;
  rater2: string;
}

export function transformApiData(data: ApiData[]): TD[] {
  const result = data.map(({ userId, startedTime, trait, id }) => {
    const tRaters = data.filter(
      (entry) => entry.trait === trait && entry.userId === userId
    );
    return {
      id,
      trait,
      userId,
      startedTime,
      rater1: tRaters[0].raterName,
      rater2: tRaters[1].raterName,
    };
  });

  return result;
}
