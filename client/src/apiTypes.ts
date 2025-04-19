export type Rating = 1 | 2 | 3 | 4 | 5 | undefined;

// Type from DB
export type ApiData = {
    id: number;
    student_name: string;
    trait: string;
    rater_digital_id: string;
    rater_name: string;
    started_time: string;
    response: string;
    words_count: number;

    ta: Rating | null;
    gra: Rating | null;
    voc: Rating | null;
    coco: Rating | null;
    comments: string;
    completed: boolean;
};

// Type save to DB
export type TaskAPI = {
    id: number;
    studentName: string;
    trait: string;
    raterDigitalId: string;
    raterName: string;
    startedTime: string;
    response: string;
    wordsCount: number;

    ta: Rating | undefined;
    gra: Rating | undefined;
    voc: Rating | undefined;
    coco: Rating | undefined;
    comments: string;
    completed: boolean;
};
