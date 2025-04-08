import React, { useState } from "react";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import { AssessData } from "../features/data/assessDataSlice";
import { Panel } from "primereact/panel";

export interface InfoSidebarProps {
  infoHead: string;
  infoList: (AssessData | { [key: string]: number })[];
  renderInfo: (task: AssessData | { name: string; value: number }) => React.ReactNode;
}

const InfoSidebar = ({ infoHead, infoList, renderInfo }: InfoSidebarProps) => {
  const [visibleRight, setVisibleRight] = useState(false);

  return (
    <>
      <Button
      icon="pi pi-arrow-left"
        onClick={() => setVisibleRight(true)}
        label={infoHead}
      />
      <Sidebar
        visible={visibleRight}
        position="right"
        onHide={() => setVisibleRight(false)}
        className="card w-[30vw] bg-gray-800 text-white"
      >
        <Panel header="Task List">
          {infoList.map((info, index) => {
            if ("studentName" in info) {
              // Case: Original format
              return (
                <div key={index}>
                  <p className="p-1">{renderInfo(info as AssessData)}</p>
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
  info: AssessData | { name: string; value: number };
}

export const TaskContent: React.FC<TaskContentProps> = ({ info }) => {
  if ("studentName" in info) {
    // Case: Original format
    return (
      <>
        <span>
          {info.studentName} - {info.trait} Score: {info.ratings.ta}-
        </span>
        <span>{info.ratings.gra}-</span>
        <span>{info.ratings.voc}-</span>
        <span>{info.ratings.coco}</span>
        <span> {info.comments ? info.comments : "NC"} </span>

        {/* Render a checkbox */}

        <input type="checkbox" checked={info.completed} onChange={() => { }} />
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
