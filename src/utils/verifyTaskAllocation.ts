import { TD } from "./transformApiData";

export const verifyTaskAllocation = (taskData: TD[], assessorsList: string[]) => {
  const verify_assessorList = [];

  for (const rater of assessorsList) {
    const obj = {} as { [key: string]: number };

    const number = taskData.reduce((count, task) => {
     
      if (rater === task.rater) {
        return (count + 1);
      }
      return count;
    }, 0);
    obj[rater] = number
    verify_assessorList.push(obj);
  }

  return verify_assessorList;
};