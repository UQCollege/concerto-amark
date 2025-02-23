import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useState } from 'react';

import { FilterMatchMode } from 'primereact/api';
import { InputText } from 'primereact/inputtext';

import { type TransformedEntry } from '../../utils/transformApiData';
import { type Task } from '../UserDashboard';

type TaskDataTableProps = {
    uniqueKey: string;
    apidata: TransformedEntry[] | Task[];
    fieldNames: string[];
};

const TaskDataTable = ({ uniqueKey, apidata, fieldNames }: TaskDataTableProps) => {
    const [data, setData] = useState<TaskDataTableProps[]>([]);

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        raterName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        testId: { value: null, matchMode: FilterMatchMode.EQUALS }
    });



    const isPositiveInteger = (val: any) => {
        let str = String(val).trim();
        if (!str) return false;
        str = str.replace(/^0+/, '') || '0';
        let n = Math.floor(Number(str));
        return n !== Infinity && String(n) === str && n >= 0;
    };

    const onCellEditComplete = (e: any) => {
        let { rowData, newValue, field, originalEvent: event } = e;
        switch (field) {
            case 'day':
                if (isPositiveInteger(newValue)) rowData[field] = newValue;
                else event.preventDefault();
                break;
            default:
                if (newValue.trim().length > 0) rowData[field] = newValue;
                else event.preventDefault();
                break;
        }

    };

    const textEditor = (options: any) => {
        return <InputText value={options.value} onChange={(e) => options.editorCallback(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />;
    };

    return (


        <DataTable
            value={apidata}
            stripedRows
            paginator
            rows={5}
            rowsPerPageOptions={[5, 10, 25, 50]}
            tableStyle={{ minWidth: '20rem' }}
            filters={filters}
            filterDisplay="row"
            editMode="cell"
            dataKey="index"
        >
            {fieldNames.map((field) => (
                <Column key={`${uniqueKey}-${field}`} field={field} header={field} sortable filter filterPlaceholder="Search by test ID" editor={(options) => textEditor(options)} onCellEditComplete={onCellEditComplete}></Column>
            ))}

        </DataTable>

    );
};

export default TaskDataTable;
