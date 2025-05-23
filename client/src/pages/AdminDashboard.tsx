import React, { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchRaters, createRaters } from "../features/data/ratersUpdateSlice";

import Loading from "../uis/Loading";
import { Button } from "primereact/button";
import {
  toMatrix,
  matrixToCSV,
  transformApiData,
  type TD,
} from "../utils/transformApiData";
import DataTableUI from "../uis/DataTableUI";
import {
  assignToAll,
  deleteAllTasks,
  getAssessmentData,
  getInitialAssessmentData,
  updateRater,
  verify,
} from "../utils/apiService";
import { sampleApiData } from "../utils/data/sampledata";
import { setTasks } from "../features/data/taskAllocationSlice";
import { TabPanel, TabView } from "primereact/tabview";
import RatersTableUI from "../uis/RaterTable";
import { Toast } from "primereact/toast";
import ChipInput from "../uis/ChipInput";
import DialogUi from "../uis/DialogUi";
import { ImportData } from "../uis/ImportData";
import { SelectButton, SelectButtonChangeEvent } from "primereact/selectbutton";

interface JustifyOption {
  label: string;
  value: string;
}
export function AdminDashboard() {
  const [showDialog, setShowDialog] = useState(false);
  const [isProcess, setIsProcess] = useState(false);

  const options: JustifyOption[] = [
    { label: "DAY 1", value: "day1" },
    { label: "DAY 2", value: "day2" },
  ];
  const buttonTemplate = (option: JustifyOption) => {
    return <span>{option.label}</span>;
  };
  const [dayValue, setDayValue] = useState(options[0].value);
  const dispatch = useAppDispatch();
  const taskData = useAppSelector((state) => state.taskAllocation);

  useEffect(() => {
    setIsProcess(true);
    const getInitialData = async () => {
      const result = await getInitialAssessmentData();
      if (result.length === 0) {
        setIsProcess(false);
        return;
      }
      const newTaskData = transformApiData(result).sort((a: TD, b: TD) => {
        return Number(a.studentCode) - Number(b.studentCode);
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
      return Number(a.studentCode) - Number(b.studentCode);
    });

    dispatch(setTasks(newTaskData));
    setIsProcess(false);
  };

 
  const createRaterList = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsProcess(true);
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
          const [name, rater_digital_id, first_name, last_name, active, class_name] = row
            .split(",")
            .map((col) => col.trim());
          return {
            raterName: name,
            raterDigitalId: rater_digital_id,
            firstName: first_name || "",
            lastName: last_name || "",
            active: active.toLowerCase()=="true",
            className: Number(class_name) || undefined,
          };
        });

      dispatch(createRaters(records));
      setIsProcess(false);
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

    a.click();
    URL.revokeObjectURL(url);
  };
  const toast = useRef<Toast>(null);
  const updateDay = (day: number) => {
    toast.current?.show({
      severity: "info",
      summary: "Info",
      detail: "Set tasks for Day " + day,
    });
  };
  const [chips, setChips] = useState<string[]>([]);
  const verifyHandler = async () => {
    const message = await verify();

    if ("details" in message) {
      toast.current?.show({
        severity: "warn",
        summary: "Warning: ",
        detail: JSON.stringify(message.details),
      });
    } else {
      toast.current?.show({
        severity: "info",
        summary: "Info",
        detail: JSON.stringify(message.message),
      });
    }
  };
  const userData = useAppSelector((state) => state.auth);
  const isAdmin = userData.groups.includes("Admin");
  return (
    <div className="flex items-start min-h-screen">
      <Toast ref={toast} />
      <div className="w-[90vw] h-[80vh] p-6 rounded-lg shadow-lg flex flex-col gap-4">
        {isAdmin && (
          <div className="flex justify-between">
            <div className="flex items-center  gap-3">
              <div className="flex flex-row items-center gap-2">
               
               
                <ImportData />
              </div>
              <div className="pi pi-arrow-right"></div>

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
              </label>
              <div className="pi pi-arrow-right"></div>

              <div className="flex items-center gap-2">
                <ChipInput chips={chips} setChips={setChips} />
                <SelectButton
                  value={dayValue}
                  onChange={(e: SelectButtonChangeEvent) => setDayValue(e.value)}
                  options={options}
                  itemTemplate={buttonTemplate}
                  optionLabel="label"
                />
                <Button
                  onClick={async () => {
                    const result = await assignToAll({
                      studentCodes: chips,
                      writingDay: dayValue,
                    });
                    alert(result)
                  }}
                >
                  Tasks for All, click!
                </Button>{" "}
              </div>

              <div className="pi pi-arrow-right"></div>
              <div className="flex flex-row items-center gap-2">
                <Button onClick={handleFetchResult}>tasks allocating</Button>
                <Button
                  className="p-button-danger"
                  onClick={() => setShowDialog(true)}
                >
                  Clear all tasks
                </Button>
              </div>
              {isProcess && <Loading />}
            </div>
            <div className="flex gap-2 items-center">
              <Button
                outlined
                rounded
                onClick={async () => {
                  await updateRater({ taskAccess: 1 });
                  updateDay(1);
                }}
              >
                Day 1
              </Button>
              <Button
                outlined
                rounded
                onClick={async () => {
                  await updateRater({ taskAccess: 2 });
                  updateDay(2);
                }}
              >
                Day 2
              </Button>

              <Button
                label="Matrix"
                className="w-25"
                rounded
                outlined
                icon="pi pi-download"
                onClick={downloadMatrixCSVHandler}
              />
              <Button
                label="Verify"
                className="w-25"
                rounded
                outlined
                aria-setsize={10}
                onClick={verifyHandler}
              />
            </div>
          </div>
        )}

        <hr />
        <TabView>
          <TabPanel header="Task Allocation">
            {taskData.length > 0 && (
              <DataTableUI
                taskData={taskData}
                fieldNames={[
                  "id",
                  "studentCode",
                  "trait",
                  "startedTime",
                  "rater",
                  "raterName",
                  "comments",
                  "completed",
                  "ta",
                  "gra",
                  "voc",
                  "coco",
                ]}
              />
            )}
          </TabPanel>
          <TabPanel header="User List">
            <RatersTableUI />
          </TabPanel>
        </TabView>
      </div>

      <DialogUi
        visible={showDialog}
        message="Are you sure you want to delete all records?"
        onHide={() => setShowDialog(false)}
        onConfirm={() => {
          deleteAllTasks();
          setShowDialog(false);
        }}
      />
    </div>
  );
}
