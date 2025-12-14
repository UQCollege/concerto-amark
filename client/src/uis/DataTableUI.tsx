import { DataTable, DataTableRowEditCompleteEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { MultiSelect, MultiSelectChangeEvent } from "primereact/multiselect";
import { useState, useRef } from "react";
import { InputText } from "primereact/inputtext";
import OptionsEditor from "./OptionsEditor";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toolbar } from "primereact/toolbar";
import { type TD } from "../utils/transformApiData";
import { useAppDispatch } from "../store/hooks";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/saga-blue/theme.css";
import "primeicons/primeicons.css";
import {
  updateTasks,
  // removeTasks,
  selectedTasks,
  cancelSelectedTasks,
  createNewTask,
  deleteTask,
} from "../features/data/taskAllocationSlice";
import { FilterMatchMode } from "primereact/api";
import DialogUi from "./DialogUi";
import { classNames } from "primereact/utils";
import { RadioButton, RadioButtonChangeEvent } from "primereact/radiobutton";
import { exportExcel } from "../utils/downloadExcel";
import { Divider } from 'primereact/divider';
import { DownloadData, downloadPDF } from "../utils/downloadPDF";
import { getInitialAssessmentData } from "../utils/apiService";
// import { Icon } from "lucide-react";


export interface ColumnMeta {
  field: string;
  header: string;
}

type DataTableUIProps = {
  taskData: TD[];
  fieldNames: string[];
};

export default function DataTableUI({
  taskData,
  fieldNames,
}: DataTableUIProps) {
  const dispatch = useAppDispatch();
  // DataTable functions
  // createnew, Select, bulk edit
  const [selected, setSelected] = useState<TD[] | null>();
  const [displaySelected, setDisplaySelected] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSelectionChange = (event: any) => {
    const selectedItems = event.value as TD[];

    if (selectedItems) {
      dispatch(selectedTasks(selectedItems.map((item: TD) => item.id)));
    }

    setSelected(selectedItems);
  };

  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-row gap-2">
        <Button
          label="Add Tasks"
          icon="pi pi-plus"
          severity="success"
          onClick={createNew}
          size="small"
        />
        <Button
          label={displaySelected ? "Cancel / Done" : "BulkEdit"}
          icon="pi pi-file-edit"
          severity={displaySelected ? "warning" : "info"}
          onClick={updateBulk}
          size="small"
        />
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <div className="flex flex-row gap-2">
        <Button
          label=".xlsx"
          icon="pi pi-file-excel"
          severity="success"
          onClick={() => exportExcel(taskData, visibleColumn)}
          data-pr-tooltip="XLS"
        />

      </div>
    );
  };
  // Create New
  const [createNewDialog, setCreateNewDialog] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [newRecord, setNewRecord] = useState<{
    studentCode?: string;
    trait?: string;
    raterName?: string;
    completed: false;
  }>();
  const createNew = () => {
    setCreateNewDialog(true);
  };
  const hideDialog = () => {
    setCreateNewDialog(false);
    setSubmitted(false);
    setNewRecord(undefined);
  };
  const saveANew = async () => {
    if (!newRecord?.studentCode || !newRecord.raterName || !newRecord.trait) {
      setSubmitted(true);
      return;
    }

    dispatch(createNewTask(newRecord));
    setCreateNewDialog(false);
    setNewRecord(undefined);
    setSubmitted(false);
  };



  const onRadioInputChange = (e: RadioButtonChangeEvent) => {
    setNewRecord((state) => ({ ...state, trait: e.value, completed: false }));
  };

  const updateBulk = () => {
    if (displaySelected) {
      dispatch(cancelSelectedTasks());
      setSelected(null);
    }
    setDisplaySelected((state) => !state);
  };

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
  const columns: ColumnMeta[] = fieldNames.map((stringItem) => ({
    field: stringItem,
    header: stringItem,
  }));
  const [visibleColumn, setVisibleColumn] = useState<ColumnMeta[]>(
    columns.filter((col) => col.field !== "id")
  );
  const onColumnToggle = (event: MultiSelectChangeEvent) => {
    const selectedColumns = event.value;
    const orderedSelectedColumns = columns.filter((col) =>
      selectedColumns.some((sCol: ColumnMeta) => sCol.field === col.field)
    );
    setVisibleColumn(orderedSelectedColumns);
  };
  const header = (
    <MultiSelect
      value={visibleColumn}
      options={columns}
      optionLabel="header"
      onChange={onColumnToggle}
      className="w-60 sm:w-20rem"
      display="chip"
    />
  );

  // Export Excel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dt = useRef<DataTable<any>>(null);

  // Edit Row and Bulk edit rows
 const onRowEditComplete = (e: DataTableRowEditCompleteEvent) => {
    // 1. Update the local data copy (This is fine)
    const _data = [...taskData];
    const { newData, index } = e;
    const singleEditedTask: TD = newData as TD;
    _data[index] = singleEditedTask; // Update the local copy

    // 2. Check for Bulk Edit condition (same logic as your old reducer)
    const isBulkEdit = _data.some((item) => item.selected === true);

    let idList: number[];
    let raterName: string;

    if (isBulkEdit) {
        // --- BULK EDIT SCENARIO ---
        // Get all selected IDs from the updated local data
        idList = _data.filter((item) => item.selected === true).map((item) => item.id);
        
        // Get the rater name from the single task that was just edited/submitted
        raterName = singleEditedTask.raterName;
        
    } else {
        // --- SINGLE ROW EDIT SCENARIO ---
        // The ID list is just the single ID of the task that was edited
        idList = [singleEditedTask.id];
        
        // Get the rater name from the single task
        raterName = singleEditedTask.raterName;
    }
    
    // 3. Construct the Thunk Payload
    const payloadForThunk = {
        idList: idList,
        raterName: raterName,
        isMulti: isBulkEdit,
    };

    // 4. Dispatch the ASYNC THUNK
    dispatch(updateTasks(payloadForThunk));
    
    // 5. Clean up local state (This is fine)
    setSelected(null);
    setDisplaySelected(false);
};

  const confirmDelete = (rowData: TD) => {
    setSelectedRow(rowData);
    setisDelDialogVisible(true);
  };

  const onDeleteConfirmed = () => {
    if (selectedRow) {
      dispatch(deleteTask(selectedRow.id));
    }
    setisDelDialogVisible(false);
    setSelectedRow(null);
  };

  const columnFilterTemplate = (field: string) => (
    <InputText
      onInput={(e) =>
        setFilters({
          ...filters,
          [field]: {
            value: e.currentTarget.value,
            matchMode: FilterMatchMode.CONTAINS,
          },
        })
      }
      placeholder={`Search ${field}...`}
    />
  );

  const actionDeleteTemplate = (rowData: TD) => (
    <Button
      icon="pi pi-trash"
      className="p-button-rounded p-button-danger"
      onClick={() => confirmDelete(rowData)}
    />
  );

  const downloadHandler = async (rowData: TD) => {
   // return `https://${import.meta.env.VITE_PDF_DOWNLOAD_DOMAIN}/${rowData.trait}/${rowData.trait}/${rowData.studentCode}.pdf`;
    const downloadData = (await getInitialAssessmentData(rowData.id))[0]
    await downloadPDF(downloadData as DownloadData)

  }
  const actionDownloadTemplate = (rowData: TD) => (
    // <a
    //   target="_blank"
    //   className="p-button-rounded p-button-info"
    //   href={downloadHandler(rowData) 
    //   }
    // ><i className="pi pi-download"/></a>
      <Button
      icon="pi pi-download"
      className="p-button-rounded p-button-info"
      onClick={() => downloadHandler(rowData)}
    />
  );

  return (
    <div className="card p-fluid">
      <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} />
      <DataTable
        ref={dt}
        value={taskData}
        header={header}
        editMode="row"
        dataKey="id"
        onRowEditComplete={onRowEditComplete}
        filters={filters}
        paginator
        rows={15}
        rowsPerPageOptions={[10, 15, 25, 55, 100]}
        tableStyle={{ minWidth: "50rem" }}
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        selection={selected}
        showSelectAll={false}
        onSelectionChange={onSelectionChange}
      >
        {displaySelected && (
          <Column
            selectionMode="multiple"
            headerStyle={{ width: "1%", minWidth: "1rem" }}
          />
        )}
        {visibleColumn.map((col, idx) => (
          <Column
            key={`col-${col.field}-${idx}`}
            field={col.field}
            header={col.field}
            sortable
            filter
            filterElement={columnFilterTemplate(col.field)}
            {...(col.field === "raterName"
              ? { editor: (options) => <OptionsEditor {...options} /> }
              : {})}
            style={{
              width: "5%",
              padding: "0",
              margin: "0",
              textAlign: "center",
            }}
          />
        ))}

        <Column
          rowEditor={() => true}
          headerStyle={{ width: "5%", minWidth: "5rem" }}
          bodyStyle={{ textAlign: "center" }}
          hidden={taskData.length === 0}
        />

        <Column
          body={actionDownloadTemplate}
          headerStyle={{ width: "5%", minWidth: "5rem" }}
          style={{ textAlign: "center" }}
          hidden={taskData.length === 0}
        />

        <Column
          body={actionDeleteTemplate}
          headerStyle={{ width: "5%", minWidth: "5rem" }}
          style={{ textAlign: "center" }}
          hidden={taskData.length === 0}
        />
      </DataTable>

      <DialogUi
        visible={isDelDialogVisible}
        message="Are you sure you want to delete this record?"
        onHide={() => setisDelDialogVisible(false)}
        onConfirm={onDeleteConfirmed}
      />



      <Dialog
        visible={createNewDialog}
        style={{ width: "32rem" }}
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
        header="Re-allocate for deleted Task"
        modal
        className="p-fluid"
        onHide={hideDialog}
      >

        <Divider align="left">
          <div className="inline-flex align-items-center">
            <b> Input Student Codes</b>
          </div>
        </Divider>
        <div className="field m-5">
          <label htmlFor="name" className="font-bold">
          </label>
          <InputText
            id="studentCode"
            placeholder="e.g., 123, 978 separated by comma"
            onChange={(e) =>
              setNewRecord((state) => ({
                ...state,
                studentCode: e.target.value,
                completed: false,
              }))
            }
            required
            autoFocus
            className={classNames({
              "p-invalid": submitted && !newRecord?.studentCode,
            })}
          />
        </div>
        <Divider align="left">
          <div className="inline-flex align-items-center">
            <b> Choose A unasssigned Writing Task</b>
          </div>
        </Divider>
        <div className="field m-5">
          <div className="formgrid grid">
            <div className="field-radiobutton col-6">
              <RadioButton
                inputId="writing_task_1"
                name="writing_task_1"
                value="Writing 1"
                onChange={onRadioInputChange}
                checked={newRecord?.trait === "Writing 1"}
              />
              <label htmlFor="writing_task_1">Writing 1</label>
            </div>
            <div className="field-radiobutton col-6">
              <RadioButton
                inputId="writing_task_2"
                name="writing_task_2"
                value="Writing 2"
                onChange={onRadioInputChange}
                checked={newRecord?.trait === "Writing 2"}
              />
              <label htmlFor="writing_task_2">Writing 2</label>
            </div>
          </div>
        </div>
        <Divider align="left">
          <div className="inline-flex align-items-center">
            <b> Choose a Rater </b>
          </div>
        </Divider>
        <div className="formgrid grid m-5">
          <div className="field col">

            <OptionsEditor
              value={newRecord?.raterName}
              onChange={(newValue) =>
                setNewRecord((state) => ({
                  ...state,
                  raterName: newValue,
                  completed: false,
                }))
              }
            />

          </div>
        </div>
        {submitted && !newRecord?.studentCode && (
          <small className="p-error">Name is required.</small>
        )}
        {submitted && !newRecord?.raterName && (
          <small className="p-error">choose a rater is required.</small>
        )}
        {submitted && !newRecord?.trait && (
          <small className="p-error">select writing 1 or 2 is required.</small>
        )}
        <Divider />
        <Divider />
        <div className="flex align-items-center justify-content-end mt-10 gap-5">
          <Button
            label="Cancel"
            icon="pi pi-times"
            outlined
            onClick={hideDialog}
          />
          <Button
            label="Save"
            icon="pi pi-check"
            onClick={saveANew}
          />
        </div>
      </Dialog>
    </div>
  );
}
