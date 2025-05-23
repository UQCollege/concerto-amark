import React from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getUserTasks } from "../utils/apiService";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";

import MarkOption from "../uis/MarkOption";
import { SelectOptionType } from "../uis/MarkOption";
import InfoSidebar from "../uis/InfoSidebar";
import { TaskContent } from "../uis/InfoSidebar";
import { ChevronFirst, ChevronLast } from "lucide-react";
import { sampleTaskData } from "../utils/data/sampledata";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { Rating } from "../apiTypes";
import {
  setRating,
  setComment,
  type AssessData,
  initialRating,
  completeAndUpdate,
} from "../features/data/assessDataSlice";
import { ApiData } from "../apiTypes";
import { Divider } from "primereact/divider";

const markOptions = [
  { name: "ta" as const, label: "TA Mark" },
  { name: "gra" as const, label: "GR&A Mark:" },
  { name: "voc" as const, label: "Voc Mark:" },
  { name: "coco" as const, label: "Co&co Mark:" },
];

export function UserDashboard() {
  const { name } = useParams<{ name: string | undefined }>();
  const currentUser = name ? name : ""
  const [currentTaskId, setCurrentTaskId] = useState<number | undefined>();
  const [expanded, setExpanded] = useState(true);
  const [lightMode, setLightMode] = useState(false)
  const [showDialog, setShowDialog] = useState(false);
  const dialogLastSubmit = () => {
    setShowDialog(true)
  }

  const assessData: AssessData[] = [...useAppSelector((state) => state.assess)];
  const dispatch = useAppDispatch();

  const currentTask = assessData.find((task) => task.id === currentTaskId);

  useEffect(() => {
    const fetchTask = async () => {
      const data =
        import.meta.env.VITE_MODE === "DEMO"
          ? sampleTaskData
          : await getUserTasks(currentUser);
      const tasks: AssessData[] = data
        .map((task: ApiData) => ({
          id: task.id,
          studentCode: task.student_code,
          trait: task.trait,
          startedTime: task.started_time,
          response: task.response,
          wordsCount: task.words_count,
          ratings: {
            ta: task.ta,
            gra: task.gra,
            voc: task.voc,
            coco: task.coco,
          },
          comments: "" + task.comments, //"" - to solve textarea should not be null
          completed: task.completed
        }))
        .sort((a: AssessData, b: AssessData) => a.id - b.id);

      dispatch(initialRating(tasks));
      const currentTaskId = tasks[0]?.id;
      setCurrentTaskId(currentTaskId);
    };
    if (currentUser === null || currentUser === undefined) return;
    fetchTask();
  }, [currentUser, dispatch]);

  if (currentUser === undefined || currentUser === null) return <div>Invalid user</div>;

  if (!currentTask) return <div>Loading task for {currentUser} </div>;

  const totalTasks = assessData.length;
  const completedTasks = assessData.filter((task) => task.completed).length;
  const allTasksCompleted = completedTasks === totalTasks;
  const isLastTask =
    completedTasks === totalTasks - 1 && !currentTask?.completed;
  const marks = currentTask?.ratings || {
    ta: undefined,
    gra: undefined,
    voc: undefined,
    coco: undefined,
  };
  const isAllSelected = markOptions.every(
    (opt) => marks[opt.name] && marks[opt.name] !== undefined
  );

  const handleMarkChange = (
    selected: Partial<Record<SelectOptionType, Rating>>
  ) => {
    const key = Object.keys(selected)[0] as SelectOptionType;
    const val = selected[key] as Rating;

    dispatch(setRating({ id: currentTask.id, ratingType: key, value: val }));
  };

  const handleCommentChange = (comment: string) => {
    dispatch(setComment({ id: currentTask.id, comment }));
  };
  const currentTaskIndex = assessData.findIndex(
    (task) => task.id === currentTaskId
  );
  const handleSubmit = async () => {
    dispatch(completeAndUpdate(currentTask.id))
    const index = assessData.findIndex((t) => t.id === currentTaskId);
    if (index < assessData.length - 1) {
      setCurrentTaskId(assessData[index + 1].id);
    }

  };

  const handleRevert = () => {
    const index = assessData.findIndex((t) => t.id === currentTaskId);
    if (index > 0) {
      setCurrentTaskId(assessData[index - 1].id);
    }
  };

  if (allTasksCompleted) {
    return (
      <div>
        All assessments completed. Great job!

      </div>
    );
  }

  return (
    <div className="">
      <div className="flex items-center h-[100vh]">
        <div
          className={` h-full p-6 rounded-lg shadow-lg border flex flex-col gap-4 border-spacing-4  ${expanded ? "w-[25vw]" : "w-0 invisible"
            }`}
        >
          <div className="text-2xl">
            <div className="flex gap-5 justify-between">

              <span>
                <InfoSidebar
                  infoHead="Review"
                  infoList={assessData}
                  renderInfo={(info) => <TaskContent info={info as AssessData} />}
                ></InfoSidebar>
              </span>

            </div>
            <p>Current is Task {currentTaskIndex + 1}  of {totalTasks} tasks</p>
            {completedTasks > 0 && !allTasksCompleted && (
              <div>
                (  {completedTasks} completed out of {totalTasks} tasks)
              </div>
            )}


          </div>

          <div className="flex flex-col justify-center items-center gap-4 border-spacing-4">
            {markOptions.map(({ name, label }) => (
              <React.Fragment key={name}>
                <span>{label}</span>
                <MarkOption
                  key={`${name}-${currentTaskId}`}
                  name={name}
                  value={marks[name] || undefined}
                  handleChange={handleMarkChange}
                />
                <hr />
              </React.Fragment>
            ))}

            <div className="flex flex-col justify-center items-center gap-3">
              <label htmlFor="comment">Notes:</label>

              <textarea
                className="border"
                id="comment"
                value={currentTask.comments}
                onChange={(e) => handleCommentChange(e.target.value)}
                placeholder="Enter your Notes here"
                rows={8}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRevert}> <i className="pi pi-arrow-left"></i></Button>

              <Button
                onClick={isLastTask ? dialogLastSubmit : handleSubmit}
                className={
                  !isAllSelected
                    ? "bg-red-200 cursor-not-allowed opacity-50"
                    : ""
                }
                disabled={!isAllSelected}
              >
                {isLastTask ? "Submit Final Assessment" : <span> <i className="pi pi-arrow-right" /> <i className="pi pi-save" /> </span>}
              </Button>
            </div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg bg-gray-550 hover:bg-gray-10"
        >
          {expanded ? <ChevronFirst /> : <ChevronLast />}
        </button>
        <div
          className={`w-[60vw] h-full card border-1 surface-100 p-4 font-[Arial] line-height-3 shadow-2 ${lightMode ? "bg-[#35454c] text-[#f7f9f9]" : "bg-gray-100 text-black"
            }`}
        >
          <div className="flex justify-end">
            <Button
              rounded
              outlined
              className="border-solid border-2 border-gray-300"
              onClick={() => setLightMode(!lightMode)}
            >
              {lightMode ? <i className="pi pi-sun"></i> : <i className="pi pi-moon"></i>}
            </Button>
          </div>
          <h3 className="text-left mb-2">{currentTask.studentCode}</h3>
          <h3 className="text-left mb-2">{currentTask.trait}</h3>
          <h3 className="text-left mb-2">({currentTask.wordsCount} words)</h3>
          <h3 className="text-left mb-2">{currentTask.startedTime}</h3>
          <hr />
          <div
            className="block w-full text-left whitespace-pre-line leading-7 mt-5 text-lg overflow-y-auto max-h-[70vh]"
            dangerouslySetInnerHTML={{ __html: currentTask.response }}
          ></div>
        </div>
      </div>
      <Dialog onHide={() => setShowDialog(false)} visible={showDialog} header="Confirm" footer={
        <div className="flex gap-2">
          <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={() => setShowDialog(false)} />
          <Button label="Submit" icon="pi pi-check" className="p-button-danger" onClick={handleSubmit} />
        </div>
      }>
        <p>Are you sure you want to submit the final assessment?</p>
        <Divider />
        <ul className="max-h-[300px] overflow-y-auto">
          {assessData.map((result, idx) => (
            <li key={idx}>
              coco: {result.ratings.coco} gra: {result.ratings.gra} ta: {result.ratings.ta} voc: {result.ratings.voc} comments: {result.comments}
              <Divider />
            </li>
          ))}
        </ul>
        <p>Once submitted, you will not be able to change your assessment.</p>
        <p>Click "Submit" to confirm.</p>

      </Dialog>
    </div>
  );
}
