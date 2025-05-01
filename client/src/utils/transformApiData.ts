import { ApiData, Rating } from "../apiTypes";

// TD: Task distribution
export interface TD {
  id: number;
  studentCode: string;
  trait: string;
  rater: string;
  raterName: string;
  startedTime: string;
  selected: boolean;
  completed: boolean;
  comments: string;
  ta: Rating | null;
  gra: Rating | null;
  voc: Rating | null;
  coco: Rating | null;
}

export function transformApiData(data: ApiData[]): TD[] {
  return data.map((entry) => ({
    id: entry.id,
    selected: false,
    trait: entry.trait,
    studentCode: entry.student_code,
    startedTime: entry.started_time,
    rater: entry.rater_digital_id,
    raterName: entry.rater_name,
    completed: entry.completed,
    comments: entry.comments,
    ta: entry.ta,
    gra: entry.gra,
    voc: entry.voc,
    coco: entry.coco,
  }))

}

export function toMatrix(data: TD[]): Record<string, Record<string, string>> {
  const matrix: Record<string, Record<string, string>> = {};

  data.forEach((entry) => {
    const rowKey = `${entry.studentCode}_${entry.trait}`;
    if (!matrix[rowKey]) {
      matrix[rowKey] = {};
    }
    matrix[rowKey][entry.raterName] = 'x';
  });

  return matrix;
}

export function matrixToCSV(matrix: Record<string, Record<string, string>>): string {
  const rows = Object.entries(matrix);
  const allRaters = new Set<string>();
  rows.forEach(([, raters]) => Object.keys(raters).forEach(r => allRaters.add(r)));

  const raterList = Array.from(allRaters);
  const csvRows = [
    ['Submission', ...raterList],
    ...rows.map(([submission, raters]) =>
      [submission, ...raterList.map(r => raters[r] || '')]
    ),
  ];

  return csvRows.map(row => row.join(',')).join('\n');
}

