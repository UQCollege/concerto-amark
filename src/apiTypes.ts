export type Rating = 1 | 2 | 3 | 4 | 5 | undefined;

export type TaskAPI = {
    id: number;
    studentName: string;
    trait: string;
    raterDigitalId: string;
    raterName: string;
    startedTime: string;
    response: string;

    ta: Rating | undefined;
    gra: Rating | undefined;
    voc: Rating | undefined;
    coco: Rating | undefined;
    completed: boolean;
};