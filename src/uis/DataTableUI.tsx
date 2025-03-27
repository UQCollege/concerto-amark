import { DataTable, DataTableRowEditCompleteEvent } from "primereact/datatable";
import { Column, ColumnEditorOptions } from "primereact/column";
import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { type TD } from "../utils/transformApiData";
import { useAppDispatch } from "../store/hooks";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/saga-blue/theme.css";
import "primeicons/primeicons.css";
import { updateTasks, removeTasks } from "../features/data/taskAllocationSlice";
import { FilterMatchMode } from "primereact/api";
import DialogUi from "./DialogUi";


type DataTableUIProps = {
  taskData: TD[];
  fieldNames: string[];
};

export default function DataTableUI({ taskData, fieldNames }: DataTableUIProps) {
  const dispatch = useAppDispatch();
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
  const [isDialogVisible, setIsDialogVisible] = useState(false);

  const onRowEditComplete = (e: DataTableRowEditCompleteEvent) => {

    const _data = [...taskData];
    const { newData, index } = e;
    _data[index] = newData as TD;
    console.log("onRowEditComplete", _data[index]);

    dispatch(updateTasks(_data[index] as TD));
  };

  const confirmDelete = (rowData: TD) => {
    setSelectedRow(rowData);
    setIsDialogVisible(true);
  };

  const onDeleteConfirmed = () => {
    if (selectedRow) {
      console.log("Deleting row:", selectedRow);
      dispatch(removeTasks({ id: selectedRow.id }));
    }
    setIsDialogVisible(false);
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

      <DataTable
        value={taskData}
        editMode="row"
        dataKey="id"
        onRowEditComplete={onRowEditComplete}
        filters={filters}
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 25, 50]}
        tableStyle={{ minWidth: "50rem" }}
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      >
        {fieldNames.map((field, idx) => (
          <Column
            key={`col-${field}-${idx}`}
            field={field}
            header={field}
            sortable
            filter
            filterElement={columnFilterTemplate(field)}
            editor={textEditor}
            style={{ width: "10%", padding: "0", margin: "0" }}
          />
        ))}

        <Column rowEditor={() => true} headerStyle={{ width: "5%", minWidth: "5rem" }} bodyStyle={{ textAlign: "center" }} hidden={taskData.length === 0} />
        
        <Column body={actionBodyTemplate} headerStyle={{ width: "5%", minWidth: "5rem" }} style={{ textAlign: "center" }} hidden={taskData.length === 0} />

      </DataTable>

      <DialogUi
        visible={isDialogVisible}
        message="Are you sure you want to delete this record?"
        onHide={() => setIsDialogVisible(false)}
        onConfirm={onDeleteConfirmed}
      />
    </div>
  );
}
