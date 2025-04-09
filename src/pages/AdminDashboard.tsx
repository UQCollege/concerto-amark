import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchRaters, createRaters } from "../features/data/ratersUpdateSlice";

import Loading from "../uis/Loading";
// import Button from "../uis/Button";
import { Button } from "primereact/button";
import {
  toMatrix,
  matrixToCSV,
  transformApiData,
  type TD,
} from "../utils/transformApiData";
import DataTableUI from "../uis/DataTableUI";
import {
  getAssessmentData,
  getInitialAssessmentData,
} from "../utils/apiService";
import { sampleApiData } from "../utils/data/sampledata";
import InfoSidebar from "../uis/InfoSidebar";
import { TaskContent } from "../uis/InfoSidebar";
import { setTasks } from "../features/data/taskAllocationSlice";
import { verifyTaskAllocation } from "../utils/verifyTaskAllocation";
import { TabPanel, TabView } from "primereact/tabview";
import RatersTableUI from "../uis/RaterTable";

export function AdminDashboard() {
  const [isProcess, setIsProcess] = useState(false);
  const dispatch = useAppDispatch();
  const taskData = useAppSelector((state) => state.taskAllocation);
  const assessorsList = useAppSelector((state) => state.ratersUpdate).map(
    (rater) => rater.raterDigitalId
  );

  useEffect(() => {
    setIsProcess(true);
    const getInitialData = async () => {
      const result = await getInitialAssessmentData();
      if (result.length === 0) {
        setIsProcess(false);
        return;
      }
      const newTaskData = transformApiData(result).sort((a: TD, b: TD) => {
        return Number(a.studentName) - Number(b.studentName);
      });
      dispatch(setTasks(newTaskData));
      setIsProcess(false);
    };

    getInitialData();
    dispatch(fetchRaters());
  }, []);

  const handleFetchResult = async () => {
    setIsProcess(true);
    const result =
      import.meta.env.VITE_MODE === "DEMO"
        ? sampleApiData
        : await getAssessmentData();
    const newTaskData = transformApiData(result).sort((a: TD, b: TD) => {
      return Number(a.studentName) - Number(b.studentName);
    });

    dispatch(setTasks(newTaskData));
  };


  const createRaterList = (e: React.ChangeEvent<HTMLInputElement>) => {
    // todo: test setIsProcess(true) in order to show the process
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split("\n").filter((row) => row.trim() !== ""); // Filter out empty rows
      const headerIndex = 1; // Skip the header row
      const maxRows = rows.length - headerIndex; // Dynamically determine the limit based on the actual data
      const records = rows
        .slice(headerIndex, headerIndex + maxRows)
        .map((row) => {
          console.log(row);
          const [name, rater_digital_id] = row
            .split(",")
            .map((col) => col.trim());
          return {
            raterName: name,
            raterDigitalId: rater_digital_id,
            active: true,
          };
        });

      dispatch(createRaters(records));
      // todo: setIsProcess(false)
    };
    reader.readAsText(file);
  };

  const downloadMatrixCSVHandler = () => {
    const matrix = toMatrix(taskData);
    const csvContent = matrixToCSV(matrix);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rater_matrix.csv";

    // Trigger download
    a.click();

    // Clean up
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-start min-h-screen">
      <div className="w-[80vw] h-[80vh] p-6 rounded-lg shadow-lg flex flex-col gap-4">
       <div className="flex justify-between">

        
        <div className="flex items-start gap-3">
          <div className="flex flex-row items-center gap-2">
            <Button onClick={() => {}}>Data Migration</Button>
            (todo)
            <span>&rarr;</span>
          </div>
          <div>
            <Button onClick={() => {}}>Manual choose 3 Students</Button>{" "}
            <span>&rarr;</span>
          </div>
          
            <label
              htmlFor="raterlist"
              className="cursor-pointer bg-blue-600 text-white px-2 py-2 rounded-lg shadow hover:bg-blue-700 transition"
            >
              Upload Rater-List
              <input
                id="raterlist"
                type="file"
                onChange={createRaterList}
                className="hidden"
              />
            <span>&rarr;</span>
            </label>
         
          <div className="flex flex-row items-center gap-2">
            <Button onClick={handleFetchResult}>tasks allocating</Button>
         
          </div>
            {taskData.length === 0 && isProcess && <Loading />}
            </div>
          <div className="flex items-end ">

          <Button label="RaterMatrix .csv" icon="pi pi-download"  onClick={downloadMatrixCSVHandler}>
            
          </Button>
          <div className="flex flex-row items-center gap-2">
            <InfoSidebar
              infoHead=""
              infoList={verifyTaskAllocation(taskData, assessorsList)}
              renderInfo={(info) => (
                <TaskContent info={info as { name: string; value: number }} />
              )}
              />
          </div>
          </div>
        </div>
        <div>
          <span>(to esure all tasks been allocated correctly)</span>
        </div>
        <hr />
        <TabView>
          <TabPanel header="Task Allocation">
            {taskData.length > 0 && (
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
            )}
          </TabPanel>
          <TabPanel header="Rater List">
            <RatersTableUI />
          </TabPanel>
        </TabView>
      </div>
    </div>
  );
}
