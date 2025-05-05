import { useRef } from "react";
import { parseCsvFile } from "../utils/uploadCSV";
import { uploadData, uploadZipFile } from "../utils/apiService";
import { Button } from "primereact/button";

interface WritingTask {
  started_time: string;
  trait: string;
  student_code: string; // ensure it's a string
  response: string;
  words_count: number;
}

export const ImportData = () => {
  const studentInputRef = useRef<HTMLInputElement>(null);

  const handleStudentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const students = await parseCsvFile(
        file,
        ([student_code, last_name, first_name, classes]) => ({
          student_code,
          last_name,
          first_name,
          class_name:classes,
        })
      );
      const message = await uploadData("/students/", "students", students);
      alert(message);
    } catch (err) {
      console.error(err);
      alert("Student upload failed");
    }
  };

  const handleWritingTaskUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const tasks: WritingTask[] = await parseCsvFile(
        file,
        ([started_time, trait, student_code, response, words_count]) => ({
          started_time,
          trait,
          student_code: student_code.toString(),
          response,
          words_count: Number(words_count),
        })
      );
     
      const message = await uploadData("/writing-tasks/", "tasks", tasks);
      alert(message);
    } catch (err) {
      console.error(err);
      alert("Writing task upload failed");
    }
  };

    const uploadBundleHandler = async (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      
      const file = e.target.files?.[0];
      const response = await uploadZipFile(file);
      alert(response.message);
 
    };
  return (
    <div className="flex items-center gap-4">
      <div>
        <Button onClick={() => studentInputRef.current?.click()}>
          Upload Students CSV
        </Button>
        <input
          type="file"
          accept=".csv"
          ref={studentInputRef}
          onChange={handleStudentUpload}
          style={{ display: "none" }}
        />
      </div>
      <div className="pi pi-arrow-right"></div>
      <div>
     <span>Writing Task Upload</span>
     <label
                  htmlFor="csvfile"
                  className="cursor-pointer bg-blue-400 rounded-lg text-white px-2 py-2 m-2 shadow hover:bg-blue-300 transition"
                  >
        .CSV
        <input
        id="csvfile"
          type="file"
          accept=".csv"
          onChange={handleWritingTaskUpload}
          className="hidden"
          />
     </label>
      or 
      <label
                  htmlFor="bundlefiles"
                  className="cursor-pointer bg-blue-400 rounded-lg text-white px-2 py-2 m-2 shadow hover:bg-blue-300 transition"
                  >
                 .ZIP
                  <input
                    id="bundlefiles"
                    type="file"
                    onChange={uploadBundleHandler}
                    className="hidden"
                    
                    />
      </label>
       </div>
    </div>
  );
};
