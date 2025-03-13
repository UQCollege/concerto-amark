import React from "react";
import { useEffect, useState } from "react";
import { getUserTasks } from "../utils/apiService";
import Button from "./ui/Button";

import MarkOption from "./ui/MarkOption";
import { type Mark, SelectOptionType } from "./ui/MarkOption";
import InfoSidebar from "./ui/InfoSidebar";
import { ChevronFirst, ChevronLast } from "lucide-react";
import { sampleTaskData } from "../utils/data/sampledata";

export type Task = {
  id: number;
  userId: string;
  trait: string;
  response: string;
  completed: boolean;
  ta: string;
  gra: string;
  voc: string;
  coco: string;
  comment: string;
};

export type TaskAPI = {
  testId: string;
  userId: string;
  raterName: string;
  startedTime: string;
  response: string;
  trait: string;
  ta: string | undefined;
  gra: string | undefined;
  voc: string | undefined;
  coco: string | undefined;

}


const markOptions = [
  { name: "ta" as const, label: "TA Mark" },
  { name: "gra" as const, label: "GR&A Mark:" },
  { name: "voc" as const, label: "Voc Mark:" },
  { name: "coco" as const, label: "Co&co Mark:" },
];
export function UserDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentUser, setCurrentUser] = useState(81); //50
  const [marks, setMarks] = useState<Partial<Record<SelectOptionType, Mark>>>({});
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [taskHistory, setTaskHistory] = useState<number[]>([]);
  const [expanded, setExpanded] = useState(true);


  const isAllSelected = markOptions.every(
    (opt) => marks[opt.name] && marks[opt.name] !== ""
  );
  const handleMarkChange = (selected: Partial<Record<SelectOptionType, Mark>>) => {
    const key = Object.keys(selected)[0] as SelectOptionType;
    const val = selected[key] as Mark;
    setMarks((prev) => ({ ...prev, [key]: val }));
  };


  useEffect(() => {
    const fetchTask = async () => {
      const data = import.meta.env.VITE_MODE === "DEMO" ? sampleTaskData : await getUserTasks(currentUser);

      const tasks = data.map((task: TaskAPI, index: number) => ({
        index,
        id: task.testId,
        userId: task.userId,
        trait: task.trait,
        response: task.response,
        completed: false,
        ta: "",
        gra: "",
        voc: "",
        coco: "",
        comment: "",
      }));

      setTasks(tasks);
    };
    fetchTask();
  }, []);

  const currentTask = tasks[currentTaskIndex];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;

  const handleCommentChange = (comment: string) => {
    setTasks(
      tasks.map((task, index) =>
        index === currentTaskIndex ? { ...task, ...marks, comment } : task
      )
    );
  };
  const handleRevert = () => {
    if (taskHistory.length > 0) {
      const previousIndex = taskHistory[taskHistory.length - 1];
      const previousTask = tasks[previousIndex];
      setMarks({
        ta: previousTask.ta as Mark,
        gra: previousTask.gra as Mark,
        voc: previousTask.voc as Mark,
        coco: previousTask.coco as Mark,
      });
      setCurrentTaskIndex(previousIndex);
      setTaskHistory(taskHistory.slice(0, -1));
    } else {
      console.log("No previous task to revert to");
    }
  };

  const handleSubmit = () => {
    setTasks(
      tasks.map((task, index) =>
        index === currentTaskIndex ? { ...task, ...marks, completed: true } : task
      )
    );
    setTaskHistory((prevHistory) => [...prevHistory, currentTaskIndex]);
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    }
    setMarks({ ta: "", gra: "", voc: "", coco: "" });
  };

  const isLastTask = currentTaskIndex === tasks.length - 1;
  const allTasksCompleted = completedTasks === totalTasks;

  if (allTasksCompleted) {
    return (
      <div>
        All assessments completed. Great job!
        <br />
        would you like try more, please{" "}
        <Button className="bg-white-200 text-gray-300" onClick={() => { }}>
          click here
        </Button>
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex items-center h-[100vh]">


        <div className={` h-full p-6 rounded-lg shadow-lg border flex flex-col gap-4 border-spacing-4  ${expanded ? "w-[25vw]" : "w-0 invisible"
          }`}>
          <div className="text-2xl">
            {completedTasks} of {totalTasks} tasks completed <span><InfoSidebar tasks={tasks} /></span>
          </div>
          <div className="flex flex-col justify-center items-center gap-4 border-spacing-4">

            {markOptions.map(({ name, label }) => (
              <React.Fragment key={name}>
                <span>{label}</span>
                {/* // forces remount on task change */}
                <MarkOption key={`${name}-${currentTaskIndex}`} name={name} value={marks[name] || ""} handleChange={handleMarkChange} />
                <hr />
              </React.Fragment>
            ))}


            <div className="flex flex-col justify-center items-center gap-3">
              <label htmlFor="comment">Notes:</label>

              <textarea
                className="border"
                id="comment"
                value={currentTask.comment}
                onChange={(e) => handleCommentChange(e.target.value)}
                placeholder="Enter your Notes here"
                rows={8}
              />
            </div>
            <div>
              <Button onClick={handleRevert}> Last</Button>
              <Button onClick={isAllSelected ? handleSubmit : () => { }} className={!isAllSelected ? "bg-red-200 cursor-not-allowed opacity-50" : ""} disabled={!isAllSelected}>
                {isLastTask ? "Submit Final Assessment" : "Next"}
              </Button>
            </div>
          </div>

          {completedTasks > 0 && !allTasksCompleted && (
            <div>
              Previously completed: {completedTasks}{" "}
              {completedTasks === 1 ? "assessment" : "assessments"}
            </div>
          )}


        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg bg-gray-550 hover:bg-gray-10"
        >
          {expanded ? <ChevronFirst /> : <ChevronLast />}
        </button>
        <div className="w-[60vw] h-full">
          <h3 className="header">{tasks[currentTaskIndex].id}</h3>
          <h3 className="header">{tasks[currentTaskIndex].trait}</h3>
          <h3 className="header">{tasks[currentTaskIndex].userId}</h3>
          <p className="body">{tasks[currentTaskIndex].response} </p>
        </div>

      </div>


    </div>
  );
}
