import React, { useState } from "react";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import { Task } from "../UserDashboard";
import { Panel } from "primereact/panel";

export interface InfoSidebarProps {
  infoHead: string;
  infoList: (Task | { [key: string]: number })[];
  renderInfo: (task: Task | { name: string; value: number }) => React.ReactNode;
}

const InfoSidebar = ({ infoHead,infoList, renderInfo }: InfoSidebarProps) => {
  const [visibleRight, setVisibleRight] = useState(false);

  return (
    <>
      <Button
        onClick={() => setVisibleRight(true)}
        label={infoHead}
      />
      <Sidebar
        visible={visibleRight}
        position="right"
        onHide={() => setVisibleRight(false)}
        className="card w-[25vw] bg-gray-800 text-white"
      >
        <Panel header="Task List">
          {infoList.map((info, index) => {
            if ("userId" in info) {
              // Case: Original format
              return (
                <div key={index}>
                  <p className="p-2">{renderInfo(info as Task)}</p>
                </div>
              );
            } else {
              // Case: New format (extract key-value)
              const [name, value] = Object.entries(info)[0];
              return (
                <div key={index}>
                  <p className="p-2">{renderInfo({ name, value })}</p>
                </div>
              );
            }
          })}
        </Panel>
      </Sidebar>
    </>
  );
};

export interface TaskContentProps {
  info: Task | { name: string; value: number };
}

export const TaskContent: React.FC<TaskContentProps> = ({ info }) => {
  if ("userId" in info) {
    // Case: Original format
    return (
      <>
        <span>
          {info.userId} - {info.trait}: {info.ta}{" "}
        </span>
        <span>{info.gra}</span>
        <span>{info.voc}</span>
        <span>{info.coco}</span>
        <span> Note: {info.comment}</span>

        {/* Render a checkbox */}
        <input type="checkbox" checked={info.completed} />
      </>
    );
  } else {
    // Case: New format
    return (
      <span>
        {info.name}: {info.value}
      </span>
    );
  }
};

export default InfoSidebar;
