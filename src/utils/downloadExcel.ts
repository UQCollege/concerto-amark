
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { type TransformedEntry } from "./transformApiData";

export const downloadExcel = (data: TransformedEntry[]) => {

  // Convert JSON to Excel Sheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Generate Excel File and Download
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
  const date = new Date().toISOString().slice(0, 10);
  saveAs(blob, `AllocatedData-${date}.xlsx`);
};
