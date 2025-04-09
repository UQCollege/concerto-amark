
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { TD } from "./transformApiData";


export const downloadExcel = (data: TD[]) => {

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


 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 export const exportExcel = (taskData:TD[], visibleColumn:any) => {
    import('xlsx').then((xlsx) => {
        const filteredData = taskData.map((task) => {
            const filteredTask: Record<string, unknown> = {};
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            visibleColumn.forEach((col:any) => {
                filteredTask[col.field] = task[col.field as keyof TD];
            });
            return filteredTask;
        });

        const worksheet = xlsx.utils.json_to_sheet(filteredData);
        const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
        const excelBuffer = xlsx.write(workbook, {
            bookType: 'xlsx',
            type: 'array'
        });

        saveAsExcelFile(excelBuffer, 'Task Data Allocation');
    });
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const saveAsExcelFile = (buffer: any, fileName: string) => {
  import('file-saver').then((module) => {
      if (module && module.default) {
          const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
          const EXCEL_EXTENSION = '.xlsx';
          const data = new Blob([buffer], {
              type: EXCEL_TYPE
          });

          module.default.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
      }
  });
};