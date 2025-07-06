import React, { useState } from "react";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import { AssessData } from "../features/data/assessDataSlice";
import { Panel } from "primereact/panel";
import { getValueColor } from "../utils/data/constants";
export interface InfoSidebarProps {
  infoHead: string;
  infoList: AssessData[];
  renderInfo: (task: AssessData ) => React.ReactNode;
}

const InfoSidebar = ({ infoHead, infoList, renderInfo }: InfoSidebarProps) => {
  const [visibleRight, setVisibleRight] = useState(false);

  return (
    <>
      <Button
      className="w-25" rounded outlined 
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
              return (
                <div key={index}>
                  <p className="p-1">{renderInfo(info as AssessData)}</p>
                </div>
              );
          })}
        </Panel>
      </Sidebar>
    </>
  );
};

export interface TaskContentProps {
  info: AssessData ;
}



export const TaskContent: React.FC<TaskContentProps> = ({ info }) => {
    return (
      <div className="flex gap-2 text-lg p-1 ">
        <span >
          {info.studentCode} - {info.trait} Score:</span >
          <span className={getValueColor(info.ratings.ta)}>{info.ratings.ta}</span>-
        <span className={getValueColor(info.ratings.gra)}>{info.ratings.gra}</span>-
        <span className={getValueColor(info.ratings.voc)}>{info.ratings.voc}</span>-
        <span className={getValueColor(info.ratings.coco)}>{info.ratings.coco}</span>
        <span> {info.comments ? info.comments : "NC"} </span>

        {/* Render a checkbox */}

        <input type="checkbox" checked={info.completed} onChange={() => { }} />
      </div>
    );
  
};

export default InfoSidebar;
