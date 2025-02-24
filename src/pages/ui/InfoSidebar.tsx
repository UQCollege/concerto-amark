import React, { useState } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Task } from '../UserDashboard';
import { Panel } from 'primereact/panel';



export interface InfoSidebarProps {
    tasks: Task[];
}

const InfoSidebar = ({ tasks }: InfoSidebarProps) => {

    const [visibleRight, setVisibleRight] = useState(false);


    return (
        <>

            <Button onClick={() => setVisibleRight(true)} label="(Click here to review)" />



            <Sidebar visible={visibleRight} position="right" onHide={() => setVisibleRight(false)} className='card w-[25vw] bg-gray-800 text-white'>
                <Panel header="Task List" >
                    {tasks.map((task) => <div key={task.id}>

                        <p className='p-2'>

                            {task.id} - {task.title}: <span>{task.ta}</span> <span>{task.gra}</span> <span>{task.voc}</span> <span>{task.coco}</span> <span>Note: {task.comment}</span> <input type="checkbox" checked={task.completed} />
                        </p>


                    </div>)}
                </Panel>
            </Sidebar>


        </>
    )
}

export default InfoSidebar