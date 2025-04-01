import { DataTable, DataTableRowEditCompleteEvent } from "primereact/datatable";
import { Column, ColumnEditorOptions } from "primereact/column";
import { MultiSelect, MultiSelectChangeEvent } from 'primereact/multiselect';
import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toolbar } from "primereact/toolbar";
import { type TD } from "../utils/transformApiData";
import { useAppDispatch } from "../store/hooks";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/saga-blue/theme.css";
import "primeicons/primeicons.css";
import { updateTasks, removeTasks } from "../features/data/taskAllocationSlice";
import { FilterMatchMode } from "primereact/api";
import DialogUi from "./DialogUi";


interface ColumnMeta {
  field: string;
  header: string;
}

type DataTableUIProps = {
  taskData: TD[];
  fieldNames: string[];
};

export default function DataTableUI({ taskData, fieldNames }: DataTableUIProps) {
  const dispatch = useAppDispatch();

  // DataTable functions
  // createnew, Select, bulk edit
  const [selected, setSelected] = useState(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSelectionChange = (event : any) => {
    const value = event.value;
     console.log("selected value: ",value)
    setSelected(value);
  
};

const leftToolbarTemplate = () => {
  return (
    <div className="flex flex-row gap-2">
          <Button label="New" icon="pi pi-plus" severity="success" onClick={createNew} size="small" />
          <Button label="Bulk Edit" icon="pi pi-file-edit" severity="info" onClick={updateBulk} disabled={!selected}  size="small" />
          <Button label="Run SQL" icon="pi pi-file-edit" severity="info" onClick={OnRunSQL} size="small" /> 
    </div>
  );
};
const [isBulkDialogVisible, setisBulkDialogVisible] = useState(false);

const createNew = ()=>{console.log("createNew")}
const updateBulk =()=>{
setisBulkDialogVisible(true)
}

const onBulkUpdate =()=>{
  if (!selected) return
  console.log("BulkEdit", selected)
  for (const item of selected as TD[]){
  dispatch(updateTasks( item)) 
  }
  
}

// SQL dialog
const [isSQLDialogVisible, setisSQLDialogVisible]= useState(false)
const OnRunSQL = ()=>{
  setisSQLDialogVisible(true)
}
// Filter
  const [filters, setFilters] = useState(() =>
    fieldNames.reduce(
      (acc, field) => ({
        ...acc,
        [field]: { value: null, matchMode: FilterMatchMode.CONTAINS },
      }),
      {}
    )
  );

  // Dialog state
  const [selectedRow, setSelectedRow] = useState<TD | null>(null);
  const [isDelDialogVisible, setisDelDialogVisible] = useState(false);

  // Toggle columns option
  const columns: ColumnMeta[] = fieldNames.map((stringItem) => ({ field: stringItem, header: stringItem }))
  const [visibleColumn, setVisibleColumn] = useState<ColumnMeta[]>(columns)
  const onColumnToggle = (event: MultiSelectChangeEvent) => {
    const selectedColumns = event.value
    const orderedSelectedColumns = columns.filter((col) => selectedColumns.some((sCol: ColumnMeta) => sCol.field === col.field));
    setVisibleColumn(orderedSelectedColumns)
  }
  const header = <MultiSelect value={visibleColumn} options={columns} optionLabel="header" onChange={onColumnToggle} className="w-full sm:w-20rem" display="chip" />

  // Edit Row
  const onRowEditComplete = (e: DataTableRowEditCompleteEvent) => {
    const _data = [...taskData];
    const { newData, index } = e;
    _data[index] = newData as TD;
    
    dispatch(updateTasks(_data[index] as TD));
  };

  const confirmDelete = (rowData: TD) => {
    setSelectedRow(rowData);
    setisDelDialogVisible(true);
  };

  const onDeleteConfirmed = () => {
    if (selectedRow) {
      dispatch(removeTasks({ id: selectedRow.id }));
    }
    setisDelDialogVisible(false);
    setSelectedRow(null);
  };

  const textEditor = (options: ColumnEditorOptions) => (
    <InputText
      type="text"
      value={options.value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        options.editorCallback!(e.target.value)
      }
    />
  );

  const columnFilterTemplate = (field: string) => (
    <InputText
      onInput={(e) =>
        setFilters({
          ...filters,
          [field]: { value: e.currentTarget.value, matchMode: FilterMatchMode.CONTAINS },
        })
      }
      placeholder={`Search ${field}...`}
    />
  );

  const actionBodyTemplate = (rowData: TD) => (
    <Button
      icon="pi pi-trash"
      className="p-button-rounded p-button-danger"
      onClick={() => confirmDelete(rowData)}
    />
  );

  return (
    <div className="card p-fluid">
<Toolbar left={leftToolbarTemplate} />
      <DataTable
        value={taskData}
        header={header}
        editMode="row"
        dataKey="id"
        onRowEditComplete={onRowEditComplete}
        filters={filters}
        paginator
        rows={10}
        rowsPerPageOptions={[10, 20, 50]}
        tableStyle={{ minWidth: "50rem" }}
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        selection={selected}
        onSelectionChange={onSelectionChange}
      >
 <Column selectionMode="multiple" headerStyle={{ width: "1%", minWidth: "1rem" }} />
        {visibleColumn.map((col, idx) => (
          <Column
            key={`col-${col.field}-${idx}`}
            field={col.field}
            header={col.field}
            sortable
            filter
            filterElement={columnFilterTemplate(col.field)}
            {...(col.field === "raterName" ? { editor: textEditor } : {})}
            style={{ width: "5%", padding: "0", margin: "0" }}
          />
        ))}

        <Column rowEditor={() => true} headerStyle={{ width: "5%", minWidth: "5rem" }} bodyStyle={{ textAlign: "center" }} hidden={taskData.length === 0} />

        <Column body={actionBodyTemplate} headerStyle={{ width: "5%", minWidth: "5rem" }} style={{ textAlign: "center" }} hidden={taskData.length === 0} />

      </DataTable>

      <DialogUi
        visible={isDelDialogVisible}
        message="Are you sure you want to delete this record?"
        onHide={() => setisDelDialogVisible(false)}
        onConfirm={onDeleteConfirmed}
      />
  
      <Dialog
        visible={isBulkDialogVisible}
        onHide={() =>{ if (!isBulkDialogVisible) return; setisBulkDialogVisible(false)}}
        className="flex flex-column"
      >
       <div className="flex flex-column">
        <div>

       <label htmlFor="rater1">Change Rater 1 Name</label>
       <InputText id="rater1" aria-describedby="rater1-help" />
        </div>
        <div>

       <label htmlFor="rater2">Change Rater 2 Name</label>
       <InputText id="rater2" aria-describedby="rater2-help" />
        </div>
     
      <Button label="Bulk Update!" onClick={onBulkUpdate} />
      <Button label="Cancel" onClick={()=>setisBulkDialogVisible(false)} />
       </div>
      </Dialog>
      <Dialog
        visible={isSQLDialogVisible}
        onHide={() =>{ if (!isSQLDialogVisible) return; setisSQLDialogVisible(false)}}
      >

       <label htmlFor="">select a SQL options to run
      <select name="" id="">

      <option value="">Find smallest on </option>
      <option value="">2</option>
      </select>
       </label>
    
      </Dialog>
    </div>
  );
}
