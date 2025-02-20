import { type ApiData } from "../pages/AdminDashboard";

  
  export interface TransformedEntry {
    testId: string;
    itemId: string;
    Date: { [key: string]: { raterName: string[] } }[];
    rate1: number;
    rate2: number;
    rate3: number;
    rate4: number;
  }
  
  export function transformApiData(data: ApiData[]): TransformedEntry[] {
    const grouped: Record<string, TransformedEntry> = {};
  
    data.forEach(({ testId, itemId, raterName, day, ...scores }) => {
      const key = `${testId}_${itemId}`;
  
      if (!grouped[key]) {
        grouped[key] = { testId, itemId, Date: [], ...scores };
      }
  
      let dateEntry = grouped[key].Date.find(entry => entry[day]);
  
      if (!dateEntry) {
        dateEntry = { [day]: { raterName: [] } };
        grouped[key].Date.push(dateEntry);
      }
  
      dateEntry[day].raterName.push(raterName);
    });
  
    return Object.values(grouped);
  }
  