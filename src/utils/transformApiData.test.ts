import { describe, test, expect } from "vitest";
import { ApiData, TD, transformApiData } from "./transformApiData";

describe("transformApiData function", () => {
  test("should transform ApiData into TD correctly", () => {
    const sampleApiData: ApiData[] = [
      { id: 1, response: "A", startedTime: "2025-02-27", trait: "Writing", userId: "1", raterName: "Alice", ta: null, gra: null, voc: null, coco: null },
      { id: 2, response: "B", startedTime: "2025-02-27", trait: "Writing", userId: "1", raterName: "Bob", ta: null, gra: null, voc: null, coco: null },
      { id: 3, response: "C", startedTime: "2025-02-27", trait: "Reading", userId: "2", raterName: "Charlie", ta: null, gra: null, voc: null, coco: null },
      { id: 4, response: "D", startedTime: "2025-02-27", trait: "Reading", userId: "2", raterName: "David", ta: null, gra: null, voc: null, coco: null },
    ];

    const expectedOutput: TD[] = [
      { id: 1, trait: "Writing", userId: "1", startedTime: "2025-02-27", rater1: "Alice", rater2: "Bob" },
      { id: 2, trait: "Writing", userId: "1", startedTime: "2025-02-27", rater1: "Alice", rater2: "Bob" },
      { id: 3, trait: "Reading", userId: "2", startedTime: "2025-02-27", rater1: "Charlie", rater2: "David" },
      { id: 4, trait: "Reading", userId: "2", startedTime: "2025-02-27", rater1: "Charlie", rater2: "David" },
    ];

    expect(transformApiData(sampleApiData)).toEqual(expectedOutput);
  });

  test("should return an empty array when input data is empty", () => {
    expect(transformApiData([])).toEqual([]);
  });

  test("should handle cases where only one rater exists for a trait-user combination", () => {
    const sampleApiData: ApiData[] = [
      { id: 1, response: "A", startedTime: "2025-02-27", trait: "Writing", userId: "1", raterName: "Alice", ta: null, gra: null, voc: null, coco: null },
    ];

    const expectedOutput: TD[] = [
      { id: 1, trait: "Writing", userId: "1", startedTime: "2025-02-27", rater1: "Alice", rater2: "Alice" }, // Only one rater, so duplicated
    ];

    expect(transformApiData(sampleApiData)).toEqual(expectedOutput);
  });

  test("should correctly transform when multiple traits exist for the same user", () => {
    const sampleApiData: ApiData[] = [
      { id: 1, response: "A", startedTime: "2025-02-27", trait: "Writing", userId: "1", raterName: "Alice", ta: null, gra: null, voc: null, coco: null },
      { id: 2, response: "B", startedTime: "2025-02-27", trait: "Writing", userId: "1", raterName: "Bob", ta: null, gra: null, voc: null, coco: null },
      { id: 3, response: "C", startedTime: "2025-02-27", trait: "Speaking", userId: "1", raterName: "Charlie", ta: null, gra: null, voc: null, coco: null },
      { id: 4, response: "D", startedTime: "2025-02-27", trait: "Speaking", userId: "1", raterName: "David", ta: null, gra: null, voc: null, coco: null },
    ];

    const expectedOutput: TD[] = [
      { id: 1, trait: "Writing", userId: "1", startedTime: "2025-02-27", rater1: "Alice", rater2: "Bob" },
      { id: 2, trait: "Writing", userId: "1", startedTime: "2025-02-27", rater1: "Alice", rater2: "Bob" },
      { id: 3, trait: "Speaking", userId: "1", startedTime: "2025-02-27", rater1: "Charlie", rater2: "David" },
      { id: 4, trait: "Speaking", userId: "1", startedTime: "2025-02-27", rater1: "Charlie", rater2: "David" },
    ];

    expect(transformApiData(sampleApiData)).toEqual(expectedOutput);
  });
});
