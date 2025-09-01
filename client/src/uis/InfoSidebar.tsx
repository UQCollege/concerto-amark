import React, { useState } from "react";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import { AssessData } from "../features/data/assessDataSlice";
import { Panel } from "primereact/panel";
import { getValueColor } from "../utils/data/constants";
import { useAppSelector } from "../store/hooks";
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
        className="w-[30vw] bg-gray-800"
      >
        <Panel header="Task List">
          {infoList.map((info, index) => {
              return (
                <div key={index}>
                  <div className="tex-gray-800 ">{renderInfo(info as AssessData)}</div>
            
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
  setTaskId?: (id: number | undefined) => void;
}



export const TaskContent: React.FC<TaskContentProps> = ({ info, setTaskId }) => {
  const groups = useAppSelector((state) => state.auth.groups);
  console.log("groups in TaskContent:", groups);
  const isTestRater = groups.includes("Test-Rater");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setTaskIdHandler = setTaskId ? setTaskId : (id:number|undefined) => {};

  const taskNaviHandler =()=>{
    console.log(isTestRater)
    setTaskIdHandler(info.id);
  }  
  
  return (
      <div className="text-sm/6 font-semibold text-shadow-sm p-1">
       <p onClick={(isTestRater || info.completed)?taskNaviHandler : ()=>{}} className={isTestRater? "cursor-pointer hover:bg-gray-100" : ""}>

       
        {/* {isTestRater? <i className="pi pi-directions"/>:null} */}
      
      {/* Render a checkbox */}
      <input className="inline" type="checkbox" checked={info.completed} onChange={() => { }} />
        <span >
        Student: #{info.studentCode} </span >
        <span>MARK  </span>
          <span className={getValueColor(info.ratings.ta)}>{info.ratings.ta}</span>-
        <span className={getValueColor(info.ratings.gra)}>{info.ratings.gra}</span>-
        <span className={getValueColor(info.ratings.voc)}>{info.ratings.voc}</span>-
        <span className={getValueColor(info.ratings.coco)}>{info.ratings.coco}</span>
        <span> COMMENTS: {info.comments==="null" ? "":info.comments} </span>
     
        
      </p>
        
      </div>
    );
  
};

export default InfoSidebar;
