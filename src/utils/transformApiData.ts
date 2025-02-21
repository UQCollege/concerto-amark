
export type ApiData = {
  testId: string;
  itemId: string;
  raterName: string;
  day: number;
  rate1: number;
  rate2: number;
  rate3: number;
  rate4: number;
};

export interface TransformedEntry {
  index: number;
  testId: string;
  itemId: string;
  day: number;
  rater1: string;
  rater2: string;
  rate1: number;
  rate2: number;
  rate3: number;
  rate4: number;
}

export function transformApiData(data: ApiData[]): TransformedEntry[] {
  const result = data.map(({ testId, itemId, raterName, day, rate1, rate2, rate3, rate4 }, index) => {
    const tRaters = data.filter((entry) => entry.testId === testId && entry.day === day);
    return { index, testId, itemId, day, rater1: tRaters[0].raterName, rater2: tRaters[1].raterName, rate1, rate2, rate3, rate4 };
  });
  console.log("result", result);
  return result

}
