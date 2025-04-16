import { describe, it, expect } from "vitest";
import { verifyTaskAllocation } from "./verifyTaskAllocation";
import { TD } from "./transformApiData";

describe("verifyTaskAllocation", () => {
  it("should return an empty array when both taskData and assessorsList are empty", () => {
    const taskData: TD[] = [];
    const assessorsList : string[] = [];
    const result = verifyTaskAllocation(taskData, assessorsList);
    expect(result).toEqual([]);
  });

  it("should return correct allocation counts for assessors", () => {
    const taskData = [
      { rater: "assessor1" },
      { rater: "assessor2" },
      { rater: "assessor1" },
      { rater: "assessor3" },
      { rater: "assessor2" },
    ];
    const assessorsList = ["assessor1", "assessor2", "assessor3"];
    const result = verifyTaskAllocation(taskData as TD[], assessorsList);
    expect(result).toEqual([
      { assessor1: 2 },
      { assessor2: 2 },
      { assessor3: 1 },
    ]);
  });

  it("should return zero counts for assessors not in taskData", () => {
    const taskData = [
      { rater: "assessor1" },
      { rater: "assessor2" },
    ];
    const assessorsList = ["assessor1", "assessor2", "assessor3"];
    const result = verifyTaskAllocation(taskData as TD[], assessorsList);
    expect(result).toEqual([
      { assessor1: 1 },
      { assessor2: 1 },
      { assessor3: 0 },
    ]);
  });

  it("should handle cases where assessorsList contains duplicate entries", () => {
    const taskData = [
      { rater: "assessor1" },
      { rater: "assessor1" },
    ];
    const assessorsList = ["assessor1", "assessor1"];
    const result = verifyTaskAllocation(taskData as TD[], assessorsList);
    expect(result).toEqual([
      { assessor1: 2 },
      { assessor1: 2 },
    ]);
  });

  it("should handle cases where taskData contains no matching raters", () => {
    const taskData = [
      { rater: "assessor4" },
      { rater: "assessor5" },
    ];
    const assessorsList = ["assessor1", "assessor2"];
    const result = verifyTaskAllocation(taskData as TD[], assessorsList);
    expect(result).toEqual([
      { assessor1: 0 },
      { assessor2: 0 },
    ]);
  });
});