import { useEffect, useState } from "react"
import { type ApiData } from "./AdminDashboard"

type Task = {
  id: number
  title: string
  pdfUrl: string
  completed: boolean
  mark: string
  comment: string
}

export function UserDashboard() {
  const [tasks, setTasks] = useState<Task[]>([

  ])

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
useEffect(()=>{
  const fetchTask = async ()=>{
    const response = await fetch("http://127.0.0.1:8000/api/raters-assignment/?rater_id=7")
    const data = await response.json()
    // console.log(data)
    const tasks = data.map((task:ApiData)=>({
      id: task.itemId,
      title: `Doc ${task.itemId}`,
      pdfUrl: "/document4.pdf",
      completed: false,
      mark: "",
      comment: "",
    }))
   
    setTasks(tasks)
  }
  fetchTask()
}, [])
  
  const currentTask = tasks[currentTaskIndex]
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((task) => task.completed).length



  const handleMarkChange = (mark: string) => {
    console.log("mark", mark)
    setTasks(tasks.map((task, index) => (index === currentTaskIndex ? { ...task, mark } : task)))
  }

  const handleCommentChange = (comment: string) => {
    setTasks(tasks.map((task, index) => (index === currentTaskIndex ? { ...task, comment } : task)))
  }

  const handleSubmit = () => {
    console.log("clicked")
    setTasks(tasks.map((task, index) => (index === currentTaskIndex ? { ...task, completed: true } : task)))

    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1)
    }
  }

  const isLastTask = currentTaskIndex === tasks.length - 1
  const allTasksCompleted = completedTasks === totalTasks

  if (allTasksCompleted) {
    return <div>All assessments completed. Great job! 
      <br/>would you like try more, please <button className="bg-white-200 text-gray-300" disabled>click here</button></div>
  }

  return (
    <div>
      <hr />
      <h2 className="text-2xl">
        Progress: {completedTasks} of {totalTasks} tasks completed
      </h2>
    <hr />
      <br />
    
    <div className="flex justify-center items-center">
      
      
      <div className="w-[30vw] h-[80vh] p-6 rounded-lg shadow-lg border flex flex-col gap-4 border-spacing-4">
      
      <div className="flex flex-col justify-center items-center gap-4 border-spacing-4">
        {/* <h3 className="text-xl">{currentTask.title}</h3> */}
        {/* <p>
          Task {currentTaskIndex + 1} of {totalTasks}
        </p> */}
       
        <div className="flex flex-col justify-center gap-3">
        <span>TA Mark</span> 
          {/* TODO: component */}
          <div className="flex">
            <div className="flex items-center me-4">
                <input onChange={(e)=>handleMarkChange(e.target.value)} id="ta-1" type="radio" value="1" name="inline-radio-group" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                <label htmlFor="#ta-1" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">1</label>
            </div>
            <div className="flex items-center me-4">
                <input onChange={(e)=>handleMarkChange(e.target.value)} id="ta-2" type="radio" value="2" name="inline-radio-group" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                <label htmlFor="#ta-2" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">2</label>
            </div>
            <div className="flex items-center me-4">
                <input onChange={(e)=>handleMarkChange(e.target.value)} checked id="ta-3" type="radio" value="3" name="inline-radio-group" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                <label htmlFor="#ta-3" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">3</label>
            </div>
            <div className="flex items-center">
                <input onChange={(e)=>handleMarkChange(e.target.value)} id="ta-4" type="radio" value="4" name="inline-radio-group" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                <label htmlFor="#ta-4" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">4</label>
            </div>
            <div className="flex items-center">
                <input onChange={(e)=>handleMarkChange(e.target.value)} id="ta-5" type="radio" value="5" name="inline-radio-group" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/>
                <label htmlFor="#ta-4" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">5</label>
            </div>
         </div>
      <hr />
             <span>GR&A Mark:</span>
                   {/* TODO: component */}
                   <div className="flex">
           (Same style as above)
         </div>
         <hr />
             <span>Voc Mark:</span>
             (Same style as above)
             <hr />
             <span>Co&co Mark:</span>
             (Same style as above)
             <hr />
        </div>
        
        <div className="flex flex-col justify-center items-center gap-3">
      
          <label htmlFor="comment">Notes:</label>
          
          <textarea
            className="border"
            id="comment"
            value={currentTask.comment}
            onChange={(e) => handleCommentChange(e.target.value)}
            placeholder="Enter your Notes here"
            rows={2}
            />
        </div>
        <div>

        <button onClick={handleSubmit} >
          {isLastTask ? "Submit Final Assessment" : "Next"}
        </button>
        </div>
      </div>
      <hr />
      {completedTasks > 0 && !allTasksCompleted && (
        <div>
          Previously completed: {completedTasks} {completedTasks === 1 ? "assessment" : "assessments"}
        </div>
      )}
      <hr />
      <h3>Rate Result</h3>
      <table>
        <thead>

        <tr>
          <td>

         itemID
          </td>
          <td>

         Mark
          </td>
          <td>

Notes
 </td>
        </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>{task.id}</td>
           <td>{task.mark}</td>
           <td>{task.comment}</td>
            </tr>
          ))}
        </tbody>
        </table>
    </div>
    <div className="w-[70vw] h-[80vh] p-6 rounded-lg shadow-lg border flex flex-col gap-4 border-spacing-4">

{/* <button onClick={handleDownloadPDF}>Download PDF for Review</button> */}
<div className=" w-100">
  ...Rendering PDF here
  <iframe src="179.pdf" width="100%" height="500px"></iframe>
  </div>
</div>
          </div>
    </div>
  )
}

