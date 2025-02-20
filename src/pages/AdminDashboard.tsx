import { useState } from "react";
import Loading from "./ui/Loading";
import Button from "./ui/Button";
import { transformApiData, type TransformedEntry } from "../utils/transformApiData";

// type taskData = {
//   testNumber: string;
//   itemid: number;
//   raterName: string;
//   dayNumber: number;
//   rate1: number;
//   rate2: number;
//   rate3: number;
//   rate4: number;
// };

export type ApiData = {
  testId: string;
  itemId: string;
  raterName: string;
  day: number;
  rate1: number;
  rate2: number;
  rate3: number;
  rate4: number;
};


export function AdminDashboard() {
  const [isProcess, setIsProcess] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [taskData, setTaskData] = useState<TransformedEntry[]>([]);

  const fetchAssignmentData = async () => {
    await fetch("http://localhost:8000/api/clear-tasks");

    const responseCode = await fetch("http://localhost:8000/api/assign-tasks");
    if (responseCode.status !== 200) return;

    const response = await fetch("http://127.0.0.1:8000/api/raters-assignment");
    const data = await response.json();
    console.log("data", data);
    return data;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      // Here you would typically process the file and update userData
      // The File including Students item IDs and assessors IDs
    }
  };

  const handleFetchResult = async () => {
    // Here you would implement the logic to generate an Excel file
    setIsProcess(true);
    const result = await fetchAssignmentData();
    const taskData = transformApiData(result);
    console.log(taskData)
    const newTaskData = transformApiData(result)
      .sort((a: TransformedEntry, b: TransformedEntry) => {
       
          return Number(a.itemId) - Number(b.itemId); // Assuming itemid is a number, otherwise use localeCompare if it's a string
      
      });

    setTaskData(newTaskData);
  };
   const raterAlloc = (task: TransformedEntry)=>{
    return <>
    {task.Date.map((entry, index) => {
      // Extract the date and rater names
      const dateKey = Object.keys(entry)[0];
      const raterNames = entry[dateKey].raterName;
      
      return (
        <span key={index}>
          <strong>Date {dateKey}:</strong> {raterNames.join(", ")} <br />
        </span>
      );
    })}
    </>
   }
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-[80vw] h-[80vh] p-6 rounded-lg shadow-lg flex flex-col gap-4 border-spacing-4">
        <div className="flex flex-col justify-center items-center gap-4">
          <label htmlFor="#data-input">
            Upload the raters list (if changes)
            <br />
            <input
              className=" rounded-l bg-gray-400 inset-shadow-sm inset-shadow-gray-500 text-black"
              id="data-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
            />
          </label>
          <div>
            <Button onClick={handleFetchResult}>Allocate Task</Button>
            <br />
            (this will performs: writing items exatract from concerto, allocate
            the tasks to raters)
            <br />
          </div>

          {taskData.length === 0 && isProcess && <Loading />}
        </div>

        {file && <p>Uploaded: {file.name}</p>}
        <hr />
        <div>
          <Button onClick={() => {}}>Download as Excel</Button>
        </div>
        <h2 className="text-2xl">Result Overview</h2>
        <table className="">
          <thead>
            <tr>
              <th>Test ID</th>
              <th>ItemID</th>
          
              <th>Date</th>
              <th>(Task Completion)</th>
              <th>(Grammar)</th>
              <th>(Vocabulary)</th>
              <th>(Cohesion & coherence)</th>
            </tr>
          </thead>
          <tbody>
            {taskData.map((task, index) => (
              <tr key={index}>
                <td>{task.testId}</td>
                <td>{task.itemId}</td>
                <td>{raterAlloc(task)}</td>
                <td>{task.rate1}</td>
                <td>{task.rate2}</td>
                <td>{task.rate3}</td>
                <td>{task.rate4}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
