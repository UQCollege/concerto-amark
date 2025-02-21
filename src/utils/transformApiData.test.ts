import { describe, expect, test } from "vitest";
import { transformApiData, type TransformedEntry, type ApiData } from "./transformApiData";

describe("transformData function", () => {
  test("should transform input data into the expected format", () => {
    const input: ApiData[] = [
      { testId: "54", itemId: "A", raterName: "R1", day: 1, rate1: 5, rate2: 4, rate3: 5, rate4: 3 },
      { testId: "54", itemId: "A", raterName: "R2", day: 1,  rate1: 5, rate2: 4, rate3: 5, rate4: 3 },
      { testId: "54", itemId: "A", raterName: "R3", day: 2,  rate1: 5, rate2: 4, rate3: 5, rate4: 3 },
      { testId: "54", itemId: "A", raterName: "R4", day: 2,  rate1: 5, rate2: 4, rate3: 5, rate4: 3 },
      { testId: "54", itemId: "B", raterName: "R1", day: 1,  rate1: 5, rate2: 4, rate3: 5, rate4: 3 },
    ];

    const expectedOutput: TransformedEntry[] = [
      {
        testId: "54",
        itemId: "A",
        Date: [
          { "1": { raterName: ["R1", "R2"] } },
          { "2": { raterName: ["R3", "R4"] } }
        ],
        rate1: 5,
        rate2: 4,
        rate3: 5,
        rate4: 3
      },
      {
        testId: "54",
        itemId: "B",
        Date: [
          { "1": { raterName: ["R1"] } }
        ],
        rate1: 5,
        rate2: 4,
        rate3: 5,
        rate4: 3
      }
    ];

    expect(transformApiData(input)).toEqual(expectedOutput);
  });

  test("should return an empty array when input is empty", () => {
    expect(transformApiData([])).toEqual([]);
  });

  test("should handle single entry correctly", () => {
    const input: ApiData[] = [
      { testId: "54", itemId: "C", raterName: "R1", day: 3, rate1: 4, rate2: 3, rate3: 2, rate4: 1 }
    ];
    const expectedOutput: TransformedEntry[] = [
      {
        testId: "54",
        itemId: "C",
        Date: [
          { "3": { raterName: ["R1"] } }
        ],
        rate1: 4,
        rate2: 3,
        rate3: 2,
        rate4: 1
      }
    ];
    expect(transformApiData(input)).toEqual(expectedOutput);
  });

  test("should correctly group multiple raters with the same item and date", () => {
    const input: ApiData[] = [
      { testId: "54", itemId: "D", raterName: "R1", day: 5, rate1: 3, rate2: 3, rate3: 3, rate4: 3 },
      { testId: "54", itemId: "D", raterName: "R2", day: 5, rate1: 3, rate2: 3, rate3: 3, rate4: 3 },
      { testId: "54", itemId: "D", raterName: "R3", day: 5, rate1: 3, rate2: 3, rate3: 3, rate4: 3 }
    ];
    const expectedOutput: TransformedEntry[] = [
      {
        testId: "54",
        itemId: "D",
        Date: [
          { "5": { raterName: ["R1", "R2", "R3"] } }
        ],
        rate1: 3,
        rate2: 3,
        rate3: 3,
        rate4: 3
      }
    ];
    expect(transformApiData(input)).toEqual(expectedOutput);
  });
});
