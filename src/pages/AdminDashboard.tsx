import { useState } from "react";

import Loading from "./ui/Loading";
import Button from "./ui/Button";
import { transformApiData, type TransformedEntry } from "../utils/transformApiData";
import { downloadExcel } from "../utils/downloadExcel";
import DataTableUI from "./ui/DataTableUI";
import { getAssessmentData } from "../utils/apiService";
import { sampleApiData } from "../utils/data/sampledata";
import { Divide } from "lucide-react";
import { list } from "postcss";


export function AdminDashboard() {
  const [isProcess, setIsProcess] = useState(false);
  const [isStart, setIsStart] = useState(false);
  const [taskData, setTaskData] = useState<TransformedEntry[]>([]);




  const handleFetchResult = async () => {

    setIsProcess(true);
    setIsStart(true);
    console.log(import.meta.env.MODE)
    const result = import.meta.env.VITE_MODE === "DEMO" ? sampleApiData : await getAssessmentData();
    const newTaskData = transformApiData(result)
      .sort((a: TransformedEntry, b: TransformedEntry) => {

        return Number(a.userId) - Number(b.userId);

      });

    setTaskData(newTaskData);
  };
  const handleDownloadExcel = () => {
    downloadExcel(taskData);
  }

//  const verify_tasks=(taskData: TransformedEntry[])=>{
//   const assessorsList= ["Alice1", "Alice2","Alice3", "Alice4"]

//   const verify_assessorList = []
  
//   for (const rater of assessorsList){
//   console.log("rate",  rater)
//     const obj = {rater: 0} as {[key:string]: number}
//      obj.rater= taskData.filter((task)=> rater === task.rater1 || rater===task.rater2).length
//      verify_assessorList.push(obj)
//   }
//   console.log(verify_assessorList)
//   return verify_assessorList
//  }


  return (
    <div className="flex items-start min-h-screen">
      <div className="w-[80vw] h-[80vh] p-6 rounded-lg shadow-lg flex flex-col gap-4">
        <div className="flex items-start gap-3">

          <div className="flex flex-row items-center gap-2">

            <Button onClick={() => { }}>Data Migration</Button> <span>&rarr;</span>
          </div>
          <div>
            <Button onClick={() => { }}>Manual choose 3 Students</Button> <span>&rarr;</span>
          </div>
          <div>
            <Button onClick={() => { }}>Create Accessor List</Button> <span>&rarr;</span>
          </div>
          <div className="flex flex-row items-center gap-2">
            <Button onClick={!isStart ? handleFetchResult : () => { }} className={isStart ? "bg-red-200 cursor-not-allowed opacity-50" : ""} disabled={isStart}>{isStart ? "locked" : "tasks allocating"}</Button> <span>&rarr;</span>
          </div>

          <div className="flex flex-row items-center gap-2">
            <Button onClick={handleDownloadExcel}>Download as Excel</Button> <span>save allocation result to local</span>
          </div>

          {taskData.length === 0 && isProcess && <Loading />}
        </div>
        <div>
          <Button onClick={() => { }}>Verification</Button> <span>At the end need to make sure all tasks been allocated correctly</span>
        </div>


        <hr />

        {/* <div>verify tasks allocation {verify_tasks(taskData).map((item, index)=> <li key={index}>{Object.keys(item)}: {Object.values(item)}</li>)}</div> */}

        <DataTableUI uniqueKey="main" apidata={taskData} fieldNames={[ "userId","trait", "startedTime", "raterName", "raterName"]} />

   

      </div>
    </div>
  );
}
