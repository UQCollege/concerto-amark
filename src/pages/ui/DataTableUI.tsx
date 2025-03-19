import { DataTable } from "primereact/datatable";
import { Column, ColumnEvent } from "primereact/column";
import React, { useState, useEffect, useRef } from "react";

import { Toast } from "primereact/toast";

import { Toolbar } from "primereact/toolbar";

import { Dialog } from "primereact/dialog";

import { Button } from "primereact/button";
import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext";
import { type TD } from "../../utils/transformApiData";

import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/saga-blue/theme.css";
import "primeicons/primeicons.css";

type DataTableUIProps = {
  uniqueKey: string;
  apidata: TD[];
  fieldNames: string[];
};

//TODO: Confirm input cases with Allister, delete
const inputCases = "input cases: ";

const DataTableUI = ({ uniqueKey, apidata, fieldNames }: DataTableUIProps) => {
  const [data, setData] = useState<TD[]>(apidata);
  useEffect(() => {
    setData(apidata);
  }, [apidata]);
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    testId: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    itemId: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    day: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    rater1: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    rater2: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  }); // Note: manually match data field

  // const [datas, setdatas] = useState<data[]>([]);
  const [dataDialog, setdataDialog] = useState<boolean>(false);
  const [deletedataDialog, setDeletedataDialog] = useState<boolean>(false);
  const [deletedatasDialog, setDeletedatasDialog] = useState<boolean>(false);
  const [dataRow, setDataRow] = useState(""); //TODO: Confirm input cases with Allister
  const [selectedData, setselectedData] = useState<TD[]>([]);
  const [submitted, setSubmitted] = useState<boolean>(false);
  // const [globalFilter, setGlobalFilter] = useState<string>('');
  const toast = useRef<Toast>(null);
  const dt = useRef<DataTable<TD[]>>(null);

  const isPositiveInteger = (val: string) => {
    let str = String(val).trim();
    if (!str) return false;
    str = str.replace(/^0+/, "") || "0";
    const n = Math.floor(Number(str));
    return n !== Infinity && String(n) === str && n >= 0;
  };

  const onCellEditComplete = (e: ColumnEvent) => {
    const { rowData, newValue, field, originalEvent: event } = e;
    switch (field) {
      case "day":
        if (isPositiveInteger(newValue)) rowData[field] = newValue;
        else event.preventDefault();
        break;
      default:
        if (newValue.trim().length > 0) rowData[field] = newValue;
        else event.preventDefault();
        break;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textEditor = (options: any) => {
    return (
      <InputText
        value={options.value}
        onChange={(e) => options.editorCallback(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
      />
    );
  };

  const openNew = () => {
    setDataRow(inputCases);
    setSubmitted(false);
    setdataDialog(true);
  };

  const hideDialog = () => {
    setSubmitted(false);
    setdataDialog(false);
  };

  const hideDeletedataDialog = () => {
    setDeletedataDialog(false);
  };

  const hideDeletedatasDialog = () => {
    setDeletedatasDialog(false);
  };

  const savedata = () => {
    setSubmitted(true);
    // TODO: add logic to save data
  };

  const editdata = (data: TD) => {
    // setDataRow({ ...data });
    setdataDialog(true);
  };

  const confirmDeletedata = (data: TD) => {
    // setDataRow(data);
    // setDeletedataDialog(true);
  };

  const deletedata = () => {
    const _data = data.filter((val) => val.index !== val.index);

    setData(_data);
    setDeletedataDialog(false);

    toast.current?.show({
      severity: "success",
      summary: "Successful",
      detail: "data Deleted",
      life: 3000,
    });
  };

  const confirmDeleteSelected = () => {
    setDeletedatasDialog(true);
  };

  const deleteselectedData = () => {
    const _data = data.filter((val) => !selectedData.includes(val));

    setData(_data);
    setDeletedatasDialog(false);
    setselectedData([]);
    toast.current?.show({
      severity: "success",
      summary: "Successful",
      detail: "Deleted",
      life: 3000,
    });
  };

  const actionBodyTemplate = (rowData: TD) => {
    return (
      <React.Fragment>
        <Button
          icon="pi pi-pencil"
          rounded
          outlined
          className="mr-2"
          onClick={() => editdata(rowData)}
        />
        <Button
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          onClick={() => confirmDeletedata(rowData)}
        />
      </React.Fragment>
    );
  };
  const dataDialogFooter = (
    <React.Fragment>
      <Button label="Cancel" icon="pi pi-times" outlined onClick={hideDialog} />
      <Button label="Save" icon="pi pi-check" onClick={savedata} />
    </React.Fragment>
  );
  const deletedataDialogFooter = (
    <React.Fragment>
      <Button
        label="No"
        icon="pi pi-times"
        outlined
        onClick={hideDeletedataDialog}
      />
      <Button
        label="Yes"
        icon="pi pi-check"
        severity="danger"
        onClick={deletedata}
      />
    </React.Fragment>
  );
  const deletedatasDialogFooter = (
    <React.Fragment>
      <Button
        label="No"
        icon="pi pi-times"
        outlined
        onClick={hideDeletedatasDialog}
      />
      <Button
        label="Yes"
        icon="pi pi-check"
        severity="danger"
        onClick={deleteselectedData}
      />
    </React.Fragment>
  );

  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          label="New"
          icon="pi pi-plus"
          severity="success"
          onClick={openNew}
        />
        <Button
          label="Delete"
          icon="pi pi-trash"
          severity="danger"
          onClick={confirmDeleteSelected}
          disabled={!selectedData || !selectedData.length}
        />
      </div>
    );
  };

  const centerToolbarTemplate = () => {
    return (
      <h2 className="text-gray-500 text-xl">
        <b>Assigned Table</b>{" "}
      </h2>
    );
  };

  return (
    <div>
      <Toast ref={toast} />

      <div className="card">
        <Toolbar
          className="mb-4"
          left={leftToolbarTemplate}
          center={centerToolbarTemplate}
        ></Toolbar>
        <DataTable
          ref={dt}
          value={data}
          selection={selectedData}
          onSelectionChange={(e) => {
            if (Array.isArray(e.value)) {
              setselectedData(e.value);
            }
          }}
          selectionMode="multiple"
          stripedRows
          paginator
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} data"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          rows={5}
          rowsPerPageOptions={[5, 10, 25, 50]}
          tableStyle={{ minWidth: "20rem" }}
          filters={filters}
          filterDisplay="row"
          editMode="cell"
          dataKey="index"
        >
          <Column selectionMode="multiple" exportable={false}></Column>
          {fieldNames.map((field) => (
            <Column
              key={`${uniqueKey}-${field}`}
              field={field}
              header={field}
              sortable
              filter
              filterPlaceholder="Search by test ID"
              editor={(options) => textEditor(options)}
              onCellEditComplete={onCellEditComplete}
            ></Column>
          ))}
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ minWidth: "12rem" }}
          ></Column>
        </DataTable>
      </div>

      <Dialog
        visible={dataDialog}
        style={{ width: "32rem" }}
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
        header="data Details"
        modal
        className="p-fluid"
        footer={dataDialogFooter}
        onHide={hideDialog}
      ></Dialog>

      <Dialog
        visible={deletedataDialog}
        style={{ width: "32rem" }}
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
        header="Confirm"
        modal
        footer={deletedataDialogFooter}
        onHide={hideDeletedataDialog}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {selectedData && (
            <span>
              Are you sure you want to delete <b>selected</b>?
            </span>
          )}
        </div>
      </Dialog>

      <Dialog
        visible={deletedatasDialog}
        style={{ width: "32rem" }}
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
        header="Confirm"
        modal
        footer={deletedatasDialogFooter}
        onHide={hideDeletedatasDialog}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {selectedData && (
            <span>Are you sure you want to delete the selected data?</span>
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default DataTableUI;
