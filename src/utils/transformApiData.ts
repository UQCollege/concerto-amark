export type ApiData = {
  id: number;
  response: string;
  words_count:number;
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
  rater: string;
  raterName: string;
  completed: boolean;
  ta: number | null;
  gra: number | null;
  voc: number | null;
  coco: number | null;
}

export function transformApiData(data: ApiData[]): TD[] {
  return data.map((entry)=>({
        id: entry.id,
        trait: entry.trait,
        studentName: entry.student_name,
        startedTime: entry.started_time,
        rater: entry.rater_digital_id,
        raterName: entry.rater_name,
        completed: entry.completed,
        ta: entry.ta,
        gra: entry.gra,
        voc: entry.voc,
        coco: entry.coco,
  }))
 
}
