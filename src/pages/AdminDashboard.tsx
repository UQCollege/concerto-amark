import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setRaters } from "../features/data/ratersUpdateSlice";

import Loading from "../uis/Loading";
import Button from "../uis/Button";
import { transformApiData, type TD } from "../utils/transformApiData";
import { downloadExcel } from "../utils/downloadExcel";
import DataTableUI from "../uis/DataTableUI";
import { getAssessmentData } from "../utils/apiService";
import { sampleApiData } from "../utils/data/sampledata";
import InfoSidebar from "../uis/InfoSidebar";
import { TaskContent } from "../uis/InfoSidebar";
import { setTasks } from "../features/data/taskAllocationSlice";
import { verifyTaskAllocation } from "../utils/verifyTaskAllocation";
import { Rating } from "../features/data/assessDataSlice";

export interface TaskAssessData extends TD {
  ratings: {
    ta: Rating;
    gra: Rating; 
    voc: Rating; 
    coco: Rating; 
  };
}
export function AdminDashboard() {
  const [isProcess, setIsProcess] = useState(false);
  const [isStart, setIsStart] = useState(false);

  const dispatch = useAppDispatch();
  const taskData = useAppSelector((state) => state.taskAllocation);
  const assessorsList = useAppSelector((state) => state.ratersUpdate);



  const handleFetchResult = async () => {
    setIsProcess(true);
    setIsStart(true);
    const result =
      import.meta.env.VITE_MODE === "DEMO"
        ? sampleApiData
        : await getAssessmentData();
    const newTaskData = transformApiData(result).sort((a: TD, b: TD) => {
      return Number(a.userId) - Number(b.userId);
    });

    dispatch(setTasks(newTaskData));
  };
  const handleDownloadExcel = () => {
    downloadExcel(taskData);
  };

  const updateRaterList = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split(",").map((row) => row.trim());
      const newrows = rows.map((row) => ({ prev: row, new: row }));
      dispatch(setRaters(newrows));
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex items-start min-h-screen">
      <div className="w-[80vw] h-[80vh] p-6 rounded-lg shadow-lg flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex flex-row items-center gap-2">
            <Button onClick={() => {}}>Data Migration</Button>{" "}
            <span>&rarr;</span>
          </div>
          <div>
            <Button onClick={() => {}}>Manual choose 3 Students</Button>{" "}
            <span>&rarr;</span>
          </div>
          <div className="flex items-center">
            <label
              htmlFor="raterlist"
              className="cursor-pointer bg-blue-600 text-white px-2 py-2 rounded-lg shadow hover:bg-blue-700 transition"
            >
              Uploading Rater-List
              <input
                id="raterlist"
                type="file"
                onChange={updateRaterList}
                className="hidden"
              />
            </label>
            <span>&rarr;</span>
          </div>
          <div className="flex flex-row items-center gap-2">
            <Button
              onClick={!isStart ? handleFetchResult : () => {}}
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
            <Button onClick={handleDownloadExcel}>Download as Excel</Button>{" "}
            <span>save allocation result to local</span>
          </div>

          {taskData.length === 0 && isProcess && <Loading />}
        </div>
        <div>
          <InfoSidebar
            infoHead="Verification"
            infoList={verifyTaskAllocation(taskData, assessorsList)}
            renderInfo={(info) => (
              <TaskContent info={info as { name: string; value: number }} />
            )}
          />
          <span>
            At the end need to make sure all tasks been allocated correctly
          </span>
        </div>Ta:

        <hr />
        {
taskData.length>0 &&
        <DataTableUI
          taskData={taskData}
          fieldNames={[
            "id",
            "userId",
            "trait",
            "startedTime",
            "rater1",
            "rater2",
            "completed",
          ]}
        />
        }
      </div>
    </div>
  );
}
