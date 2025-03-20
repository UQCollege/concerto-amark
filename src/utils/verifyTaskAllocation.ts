import { TD } from "./transformApiData";

export const verifyTaskAllocation = (taskData: TD[], assessorsList: string[]) => {
    const verify_assessorList = [];

    for (const rater of assessorsList) {
      const obj = {} as { [key: string]: number };
      
      obj[rater] = taskData.reduce((count, task) => {
        if (rater === task.rater1 && rater === task.rater2) {
          return count + 2; 
        }
        if (rater === task.rater1 || rater === task.rater2) {
          return count + 1;
        }
        return count;
      }, 0);

      verify_assessorList.push(obj);
    }

    return verify_assessorList;
};