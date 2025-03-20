import { describe, expect, test } from "vitest";

import { TD } from "./transformApiData";
import { verifyTaskAllocation } from "./verifyTaskAllocation";

describe("verifyTaskAllocation function", () => {
  const sampleTasks: TD[] = [
    { id: 1, trait: "Writing", userId: "1", startedTime: "2025-02-27", rater1: "Alice", rater2: "Bob" },
    { id: 2, trait: "Reading", userId: "2", startedTime: "2025-02-28", rater1: "Alice", rater2: "Charlie" },
    { id: 3, trait: "Listening", userId: "3", startedTime: "2025-03-01", rater1: "Bob", rater2: "Charlie" },
    { id: 4, trait: "Speaking", userId: "4", startedTime: "2025-03-02", rater1: "Alice", rater2: "Bob" },
  ];

  test("should return an empty array when assessorsList is empty", () => {
    const result = verifyTaskAllocation(sampleTasks, []);
    expect(result).toEqual([]); 
  });

  test("should return correct task counts for each assessor", () => {
    const assessorsList = ["Alice", "Bob", "Charlie"];
    const result = verifyTaskAllocation(sampleTasks, assessorsList);

    expect(result).toEqual([
      { Alice: 3 },  
      { Bob: 3 },    
      { Charlie: 2 } 
    ]);
  });

  test("should return zero tasks for assessors not in taskData", () => {
    const assessorsList = ["David", "Emma"];
    const result = verifyTaskAllocation(sampleTasks, assessorsList);

    expect(result).toEqual([
      { David: 0 }, 
      { Emma: 0 }   
    ]);
  });

 

  test("should return an empty array when taskData is empty", () => {
    const assessorsList = ["Alice", "Bob", "Charlie"];
    const result = verifyTaskAllocation([], assessorsList);

    expect(result).toEqual([
      { Alice: 0 },
      { Bob: 0 },
      { Charlie: 0 }
    ]);
  });

  test("should return correct counts when some assessors have no tasks", () => {
    const assessorsList = ["Alice", "Bob", "Charlie", "David"];
    const result = verifyTaskAllocation(sampleTasks, assessorsList);

    expect(result).toEqual([
      { Alice: 3 },  
      { Bob: 3 },    
      { Charlie: 2 },
      { David: 0 }   
    ]);
  });

//  This is important case to prevent
  test("should count twice if an assessor is both rater1 and rater2", () => {
    const sampleTasksWithDoubleRater: TD[] = [
      { id: 1, trait: "Writing", userId: "1", startedTime: "2025-02-27", rater1: "Alice", rater2: "Alice" }, 
      { id: 2, trait: "Reading", userId: "2", startedTime: "2025-02-28", rater1: "Bob", rater2: "Charlie" },
    ];

    const assessorsList = ["Alice", "Bob", "Charlie"];
    const result = verifyTaskAllocation(sampleTasksWithDoubleRater, assessorsList);

    expect(result).toEqual([
      { Alice: 2 },  
      { Bob: 1 },
      { Charlie: 1 }
    ]);
  });
});
