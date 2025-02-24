import React, { useState } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Task } from '../UserDashboard';


export interface InfoSidebarProps {
    tasks: Task[];
}

const  InfoSidebar = ({tasks}:InfoSidebarProps)=> {
    
    const [visibleRight, setVisibleRight] = useState(false);
   

    return (
        <>
         
                <Button  onClick={() => setVisibleRight(true)} label="(Click here to review)" />
               
   

            <Sidebar visible={visibleRight} position="right" onHide={() => setVisibleRight(false)} className='card w-50 bg-gray-800 text-white'>
                <h2>Right Sidebar</h2>
                {tasks.map((task) => <div key={task.id}>
                    <ul>
                    <li>
                        
                    {task.id} |  {task.title} | {task.ta} | {task.gra} | {task.voc} | {task.coco} | {task.comment} | {task.completed}
                    </li>
                    </ul>
                    
                    </div>)}
       
            </Sidebar>

           
        </>
    )
}

export default InfoSidebar