
export type ApiData = {
  testId: string;
  userId: string;
  raterName: string;
  startedTime: string;
  ta: number;
  gra: number;
  voc: number;
  coco: number;
};

export interface TransformedEntry {
  index: number;
  testId: string;
  userId: string;
  startedTime: string;
  rater1: string;
  rater2: string;
  ta: number;
  gra: number;
  voc: number;
  coco: number;
}

export function transformApiData(data: ApiData[]): TransformedEntry[] {
  const result = data.map(({ testId, userId, raterName, startedTime, ta, gra, voc, coco }, index) => {
    const tRaters = data.filter((entry) => entry.testId === testId && entry.startedTime === startedTime);
    return { index, testId, userId, startedTime, rater1: tRaters[0].raterName, rater2: tRaters[1].raterName, ta, gra, voc, coco };
  });
  console.log("result", result);
  return result

}
