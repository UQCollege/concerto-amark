import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

import { deleteRater, fetchRaters, type RaterList } from "../features/data/ratersUpdateSlice";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

import { useAppDispatch, useAppSelector } from "../store/hooks"; //useAppDispatch
import DialogUi from "./DialogUi";



const fieldNames = ["raterName", "raterDigitalId", "active"];

export default function RatersTableUI() {


  useEffect(() => {
    dispatch(fetchRaters());
  }, [])
  const raterList = useAppSelector((state) => state.ratersUpdate);
  const [filters, setFilters] = useState(() =>
    fieldNames.reduce(
      (acc, field) => ({
        ...acc,
        [field]: { value: null, matchMode: FilterMatchMode.CONTAINS },
      }),
      {}
    )
  );
  const dispatch = useAppDispatch();

  const [selectedRow, setSelectedRow] = useState<RaterList | null>(null);
  const [isDelDialogVisible, setisDelDialogVisible] = useState(false);

  const actionBodyTemplate = (rowData: RaterList) => (
    <Button
      icon="pi pi-trash"
      className="p-button-rounded p-button-danger"
      onClick={() => confirmDelete(rowData)}
    />
  );
  const confirmDelete = (rowData: RaterList) => {
    setSelectedRow(rowData);
    setisDelDialogVisible(true);
  };
  const onDeleteConfirmed = () => {
    if (selectedRow) {
      dispatch(deleteRater(selectedRow.raterDigitalId));
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

  const tableData = raterList.map((item, index) => ({
    id: index,
    raterName: item.raterName,
    raterDigitalId: item.raterDigitalId,
    active: item.active.toString(),
  }));

  return (
    <div className="card p-fluid">
      <DataTable
        value={tableData}
        editMode="row"
        dataKey="id"
        filters={filters}
        paginator
        rows={10}
        rowsPerPageOptions={[10, 20, 50]}
        tableStyle={{ minWidth: "50rem" }}
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"

      >

        {fieldNames.map((col, idx) => (
          <Column
            key={`col-${col}-${idx}`}
            field={col}
            header={col}
            sortable
            filter
            filterElement={columnFilterTemplate(col)}

            style={{ width: "5%", padding: "0", margin: "0" }}
          />
        ))}

        <Column body={actionBodyTemplate} headerStyle={{ width: "5%", minWidth: "5rem" }} style={{ textAlign: "center" }} hidden={raterList.length === 0} />
      </DataTable>

      <DialogUi
        visible={isDelDialogVisible}
        message="Are you sure you want to delete this record?"
        onHide={() => setisDelDialogVisible(false)}
        onConfirm={onDeleteConfirmed}
      />
    </div>
  );
}