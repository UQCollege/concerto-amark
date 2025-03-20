import { DataTable, DataTableRowEditCompleteEvent  } from "primereact/datatable";
import { Column, ColumnEditorOptions } from "primereact/column";
import React, {} from "react";

import { InputText } from "primereact/inputtext";
import { type TD } from "../../utils/transformApiData";

import { useAppDispatch } from "../../hooks";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/saga-blue/theme.css";
import "primeicons/primeicons.css";
import { updateTasks } from "../../features/data/taskAllocationSlice";


type DataTableUIProps = {

  taskData: TD[];
  fieldNames: string[];
};


export default function DataTableUI({ taskData,fieldNames }: DataTableUIProps) {

const dispatch = useAppDispatch();
  
  const onRowEditComplete = (e: DataTableRowEditCompleteEvent) => {
      console.log("onRowEditComplete", e.data);
      const _data = [...taskData];
      const { newData, index } = e;
      _data[index] = newData as TD;
      console.log("onRowEditComplete", _data[index]);


      dispatch(updateTasks( _data[index] as TD));
  };

  const textEditor = (options: ColumnEditorOptions) => {
      return <InputText type="text" value={options.value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => options.editorCallback!(e.target.value)} />;
  };

 

  const allowEdit = () => {
      return true;
  };

  return (
      <div className="card p-fluid">
    data size:     {taskData.length}
          <DataTable value={taskData} editMode="row" dataKey="id" onRowEditComplete={onRowEditComplete} tableStyle={{ minWidth: '50rem' }}>
                         {fieldNames.map((field, idx) => (
<Column  key={`col-${field}-${idx}`} field={field} header={field} editor={(options) => textEditor(options)} style={{ width: '20%' }}></Column>
                     ))}                
        <Column rowEditor={allowEdit} headerStyle={{ width: '10%', minWidth: '8rem' }} bodyStyle={{ textAlign: 'center' }}></Column>
          </DataTable>
      </div>
  );
}

