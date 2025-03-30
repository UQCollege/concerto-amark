export type ApiData = {
  id: number;
  response: string;
  started_time: string;
  trait: string;
  student_name: string;
  rater_digital_id: string;
  rater_name: string;
  ta: number | null;
  gra: number | null;
  voc: number | null;
  coco: number | null;
  completed: boolean;
};

// TD: Task distribution
export interface TD {
  id: number;
  trait: string;
  studentName: string;
  startedTime: string;
  rater1: string;
  rater2: string;
  rater1Name: string;
  rater2Name: string;
  completed: boolean;
  // ta: number | null;
  // gra: number | null;
  // voc: number | null;
  // coco: number | null;
}

export function transformApiData(data: ApiData[]): TD[] {
  // Step 1: Group tasks by userId + trait
  const taskMap = new Map<string, TD>();

  for (const entry of data) {
    const key = `${entry.student_name}-${entry.trait}`;

    if (!taskMap.has(key)) {
      // First time see this userId + trait
      taskMap.set(key, {
        id: entry.id,
        trait: entry.trait,
        studentName: entry.student_name,
        startedTime: entry.started_time,
        rater1: entry.rater_digital_id ?? "Unknown",
        rater1Name: entry.rater_name ?? "Unknown",
        rater2: "Unknown",
        rater2Name: "Unknown",
        completed: entry.completed,
        // ta: entry.ta,
        // gra: entry.gra,
        // voc: entry.voc,
        // coco: entry.coco,
      });
    } else {
      // Update existing entry with the second rater
      const existing = taskMap.get(key)!;
      if (existing.rater1 !== entry.rater_digital_id) {
        existing.rater2 = entry.rater_digital_id ?? "Unknown";
        existing.rater2Name = entry.rater_name ?? "Unknown";
      }
    }
  }

  // Return one row per unique task
  return Array.from(taskMap.values());
}
