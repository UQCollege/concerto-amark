
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {type TransformedEntry} from "./transformApiData";

export const downloadExcel = (data: TransformedEntry[]) => {
    const flattenedData = data.flatMap((task) =>
      task.Date.map((entry) => {
        const dateKey = Object.keys(entry)[0];
        const raterNames = entry[dateKey].raterName.join(", ");
  
        return {
          TestID: task.testId,
          ItemID: task.itemId,
          Date: dateKey,
          Raters: raterNames,
          TA: task.rate1,
          Grammar: task.rate2,
          Vocabulary: task.rate3,
          "Cohesion & coherence": task.rate4
        };
      })
    );
  
    // ✅ Convert JSON to Excel Sheet
    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  
    // ✅ Generate Excel File and Download
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
    const date = new Date().toISOString().slice(0, 10);
    saveAs(blob, `AllocatedData-${date}.xlsx`);
  };
  