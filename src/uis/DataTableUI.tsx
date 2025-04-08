import { DataTable, DataTableRowEditCompleteEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { MultiSelect, MultiSelectChangeEvent } from 'primereact/multiselect';
import { useState } from "react";
import { InputText } from "primereact/inputtext";
import  OptionsEditor  from "./OptionsEditor";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toolbar } from "primereact/toolbar";
import { type TD } from "../utils/transformApiData";
import { useAppDispatch } from "../store/hooks";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/saga-blue/theme.css";
import "primeicons/primeicons.css";
import { updateTasks, removeTasks, selectedTasks, cancelSelectedTasks, createNewTask } from "../features/data/taskAllocationSlice";
import { FilterMatchMode } from "primereact/api";
import DialogUi from "./DialogUi";
import { classNames } from 'primereact/utils';
import { RadioButton, RadioButtonChangeEvent } from 'primereact/radiobutton';


export interface ColumnMeta {
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
  const [selected, setSelected] = useState<TD[] | null>();
  const [displaySelected, setDisplaySelected] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSelectionChange = (event: any) => {
    const selectedItems = event.value as TD[];
    console.log("selectedItems", selectedItems);

    if (selectedItems) {
      dispatch(selectedTasks(selectedItems.map((item: TD) => item.id)));
    }

    setSelected(selectedItems);
  };

  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-row gap-2">
        <Button label="New" icon="pi pi-plus" severity="success" onClick={createNew} size="small" />
        <Button label={displaySelected ? "Cancel / Done" : "Select to Bulk Edit"} icon="pi pi-file-edit" severity={displaySelected ? "warning" : "info"} onClick={updateBulk} size="small" />
        <Button label="Run SQL" icon="pi pi-file-edit" severity="info" onClick={OnRunSQL} size="small" disabled/>
      </div>
    );
  };
// Create New
const [createNewDialog, setCreateNewDialog] = useState(false);
const [submitted, setSubmitted] = useState(false);
const [newRecord, setNewRecord] = useState<{studentName?: string; trait?: string; raterName?:string; completed:false}>();
  const createNew = () => { setCreateNewDialog(true) }
  const hideDialog = () => {
    setCreateNewDialog(false); setSubmitted(false); setNewRecord(undefined)}
  const saveNew = () => {console.log("save new"); if(!newRecord?.studentName || !newRecord.raterName || !newRecord.trait) return setSubmitted(true); dispatch(createNewTask(newRecord))  }


  const onRadioInputChange = (e:RadioButtonChangeEvent ) => {
  setNewRecord((state) => ({ ...state, trait: e.value, completed: false }));
};

  const updateBulk = () => {

    if (displaySelected) {
      dispatch(cancelSelectedTasks())
      setSelected(null)
    }
    setDisplaySelected((state) => !state)
  }

  // SQL dialog
  const [isSQLDialogVisible, setisSQLDialogVisible] = useState(false)
  const OnRunSQL = () => {
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

  // Edit Row and Bulk edit rows
  const onRowEditComplete = (e: DataTableRowEditCompleteEvent) => {
    const _data = [...taskData];
    const { newData, index } = e;
    _data[index] = newData as TD;
    console.log("input text", _data[index])
    setSelected(null)
    setDisplaySelected(false)
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
        {displaySelected ? <Column selectionMode="multiple" headerStyle={{ width: "1%", minWidth: "1rem" }} /> : null}
        {visibleColumn.map((col, idx) => (
          <Column
            key={`col-${col.field}-${idx}`}
            field={col.field}
            header={col.field}
            sortable
            filter
            filterElement={columnFilterTemplate(col.field)}
            {...(col.field === "raterName" ? { editor:  (options) => <OptionsEditor {...options} /> } : {})}
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
        visible={isSQLDialogVisible}
        onHide={() => { if (!isSQLDialogVisible) return; setisSQLDialogVisible(false) }}
      >

        <label htmlFor="">select a SQL options to run
          <select name="" id="">

            <option value="">Find smallest on </option>
            <option value="">2</option>
          </select>
        </label>

      </Dialog>



      <Dialog visible={createNewDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Product Details" modal className="p-fluid" onHide={hideDialog}>
            
                <div className="field">
                    <label htmlFor="name" className="font-bold">
                        Student Name
                    </label>
                    <InputText id="studentName" onChange={(e) => setNewRecord((state)=>({...state, studentName: e.target.value, completed:false}))} required autoFocus className={classNames({ 'p-invalid': submitted && !newRecord?.studentName })} />
                 
                </div>
         
                <div className="field">
                    <label className="mb-3 font-bold">Writing Task</label>
                    <div className="formgrid grid">
                        <div className="field-radiobutton col-6">
                            <RadioButton inputId="writing_task_1" name="writing_task_1" value="Writing 1" onChange={onRadioInputChange} checked={newRecord?.trait === 'Writing 1'} />
                            <label htmlFor="writing_task_1">Writing 1</label>
                        </div>
                        <div className="field-radiobutton col-6">
                            <RadioButton inputId="writing_task_2" name="writing_task_2" value="Writing 2" onChange={onRadioInputChange} checked={newRecord?.trait === 'Writing 2'} />
                            <label htmlFor="writing_task_2">Writing 2</label>
                        </div>
                    
                       
                    </div>
                </div>
                <div className="formgrid grid">
                    <div className="field col">
                        <label htmlFor="price" className="font-bold">
                            Rater Name
                        </label>
                        <OptionsEditor
                          value={newRecord?.raterName}
                          onChange={(newValue) =>
                          setNewRecord((state) => ({
                            ...state,
                            raterName: newValue,
                            completed: false
                          }))
                        }
                      />
                    </div>
                    
                </div>
                {submitted && !newRecord?.studentName && <small className="p-error">Name is required.</small>}
                    {submitted && !newRecord?.raterName && <small className="p-error">choose a rater is required.</small>}
                    {submitted && !newRecord?.trait && <small className="p-error">select writing 1 or 2 is required.</small>}
                <div className="flex align-items-center justify-content-end mt-4 gap-5">
                <Button label="Cancel" icon="pi pi-times" outlined onClick={hideDialog} />
                <Button label="Save" icon="pi pi-check" onClick={saveNew}  />
                </div>
             
            </Dialog>



    </div>
  );
}
