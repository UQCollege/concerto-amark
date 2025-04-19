import { TD } from "./transformApiData";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const exportExcel = (taskData: TD[], visibleColumn: any) => {
    import('xlsx').then((xlsx) => {
        const filteredData = taskData.map((task) => {
            const filteredTask: Record<string, unknown> = {};
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            visibleColumn.forEach((col: any) => {
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