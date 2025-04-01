import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchRaters, createRaters } from "../features/data/ratersUpdateSlice";

import Loading from "../uis/Loading";
// import Button from "../uis/Button";
import { Button } from "primereact/button";
import { transformApiData, type TD } from "../utils/transformApiData";
import { downloadExcel } from "../utils/downloadExcel";
import DataTableUI from "../uis/DataTableUI";
import { getAssessmentData, getInitialAssessmentData } from "../utils/apiService";
import { sampleApiData } from "../utils/data/sampledata";
import InfoSidebar from "../uis/InfoSidebar";
import { TaskContent } from "../uis/InfoSidebar";
import { setTasks } from "../features/data/taskAllocationSlice";
import { verifyTaskAllocation } from "../utils/verifyTaskAllocation";



export function AdminDashboard() {
  const [isProcess, setIsProcess] = useState(false);
  const [isStart, setIsStart] = useState(false);

  const dispatch = useAppDispatch();
  const taskData = useAppSelector((state) => state.taskAllocation);
  const assessorsList = useAppSelector((state) => state.ratersUpdate).map((rater) => rater.raterDigitalId);

  useEffect(() => {
    const getInitialData = async () => {
      const result = await getInitialAssessmentData()
         if (result.length === 0) return
      const newTaskData = transformApiData(result).sort((a: TD, b: TD) => {
        return Number(a.studentName) - Number(b.studentName);
      });
      setIsStart(true)
      dispatch(setTasks(newTaskData));
    }

    getInitialData()
    dispatch(fetchRaters());

  }, [])

  const handleFetchResult = async () => {
    setIsProcess(true);
    setIsStart(true);
    const result =
      import.meta.env.VITE_MODE === "DEMO"
        ? sampleApiData
        : await getAssessmentData();
    const newTaskData = transformApiData(result).sort((a: TD, b: TD) => {
      return Number(a.studentName) - Number(b.studentName);
    });

    dispatch(setTasks(newTaskData));
  };
  const handleDownloadExcel = () => {
    downloadExcel(taskData);
  };

  const createRaterList = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split("\n").filter((row) => row.trim() !== ""); // Filter out empty rows
      console.log(rows)
      const headerIndex = 1; // Skip the header row
      const maxRows = rows.length - headerIndex; // Dynamically determine the limit based on the actual data
      const records = rows.slice(headerIndex, headerIndex + maxRows).map((row) => {
        console.log(row)
        const [name, rater_digital_id] = row.split(",").map((col) => col.trim());
        return { raterName: name, raterDigitalId: rater_digital_id };
      });

      dispatch(createRaters(records));
    };
    reader.readAsText(file);
  };



  return (
    <div className="flex items-start min-h-screen">
      <div className="w-[80vw] h-[80vh] p-6 rounded-lg shadow-lg flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex flex-row items-center gap-2">
            <Button onClick={() => { }}>Data Migration</Button>
            (todo: choose table to migrate)
            <span>&rarr;</span>
          </div>
          <div>
            <Button onClick={() => { }}>Manual choose 3 Students</Button>{" "}
            <span>&rarr;</span>
          </div>
          <div className="flex items-center">
            <label
              htmlFor="raterlist"
              className={!isStart ? "cursor-pointer bg-blue-600 text-white px-2 py-2 rounded-lg shadow hover:bg-blue-700 transition" : "bg-red-200 cursor-not-allowed text-white px-2 py-2 border rounded-lg"}
            >
              Uploading Rater-List
              <input
                id="raterlist"
                type="file"
                onChange={isStart ? () => { } : createRaterList}
                className="hidden"
              />
            </label>
            <span>&rarr;</span>
          </div>
          <div className="flex flex-row items-center gap-2">
            <Button
              onClick={!isStart ? handleFetchResult : () => { }}
              className={
                isStart ? "bg-red-200 cursor-not-allowed opacity-50" : ""
              }
              disabled={isStart}
            >
              {isStart ? "locked" : "tasks allocating"}
            </Button>{" "}
            <span>&rarr;</span>
          </div>

          <div className="flex flex-row items-center gap-2">
            <InfoSidebar
              infoHead="Verification"
              infoList={verifyTaskAllocation(taskData, assessorsList)}
              renderInfo={(info) => (
                <TaskContent info={info as { name: string; value: number }} />
              )}
            />

          </div>
          <Button onClick={handleDownloadExcel}>Download as Excel</Button>{" "}

          {taskData.length === 0 && isProcess && <Loading />}
        </div>
        <div>
          <span>
            (to esure all tasks been allocated correctly)
          </span>
        </div>
        <hr />
        {
          taskData.length > 0 &&
          <DataTableUI
            taskData={taskData}
            fieldNames={[
              "id",
              "studentName",
              "trait",
              "startedTime",
              "rater",
              "raterName",
              "completed",
              "ta",
              "gra",
              "voc",
              "coco",
            ]}
          />
        }
      </div>
    </div>
  );
}
