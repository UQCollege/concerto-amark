import { useState } from "react";
import Loading from "./ui/Loading";
import Button from "./ui/Button";
import { transformApiData, type TransformedEntry } from "../utils/transformApiData";
import { downloadExcel } from "../utils/downloadExcel";
import DataTableUI from "./ui/DataTableUI";
import { getAssessmentData } from "../utils/apiService";

export function AdminDashboard() {
  const [isProcess, setIsProcess] = useState(false);
  const [isStart, setIsStart] = useState(false);
  const [taskData, setTaskData] = useState<TransformedEntry[]>([]);




  const handleFetchResult = async () => {

    setIsProcess(true);
    setIsStart(true);
    const result = await getAssessmentData();
    const newTaskData = transformApiData(result)
      .sort((a: TransformedEntry, b: TransformedEntry) => {

        return Number(a.itemId) - Number(b.itemId);

      });

    setTaskData(newTaskData);
  };
  const handleDownloadExcel = () => {
    downloadExcel(taskData);
  }

  return (
    <div className="flex items-start min-h-screen">
      <div className="w-[80vw] h-[80vh] p-6 rounded-lg shadow-lg flex flex-col gap-4">
        <div className="flex flex-col items-start gap-3">

          <div className="flex flex-row items-center gap-2">

            <Button onClick={() => { }}>Data Migration</Button> <span>migration writing tasks from Concerto to current app</span>
          </div>
          choose 3 papaers per each day
          <div className="flex flex-row items-center gap-2">
            <Button onClick={!isStart ? handleFetchResult : () => { }} className={isStart ? "bg-red-200 cursor-not-allowed opacity-50" : ""} disabled={isStart}>{isStart ? "locked" : "start"}</Button> <span>start the task allocation process</span>
          </div>
          Manual allocation, adjuating
          <div className="flex flex-row items-center gap-2">
            <Button onClick={handleDownloadExcel}>Download as Excel</Button> <span>save allocation result to local</span>
          </div>

          {taskData.length === 0 && isProcess && <Loading />}
        </div>


        <hr />

        <h2 className="text-2xl">Result Overview</h2>

        <DataTableUI apidata={taskData} />



      </div>
    </div>
  );
}
