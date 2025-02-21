import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useEffect, useState } from 'react';
import { fetchAssignmentData } from './AdminDashboard';
import { FilterMatchMode } from 'primereact/api';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import "primereact/resources/themes/lara-light-cyan/theme.css";
export type ApiData = {
    testId: string;
    itemId: string;
    raterName: string;
    day: number;
    rate1: number;
    rate2: number;
    rate3: number;
    rate4: number;
};

const Home = () => {
    const [data, setData] = useState<ApiData[]>([]);
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        raterName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        testId: { value: null, matchMode: FilterMatchMode.EQUALS }
    });

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetchAssignmentData();
            setData(response);
        };
        fetchData();
    }, []);

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
        setData([...data]);
    };

    const textEditor = (options: any) => {
        return <InputText value={options.value} onChange={(e) => options.editorCallback(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />;
    };

    const numberEditor = (options: any) => {
        return <InputNumber value={options.value} onValueChange={(e) => options.editorCallback(e.value)} onKeyDown={(e) => e.stopPropagation()} />;
    };

    return (
        <div className='p-5 w-[80vw]'>
            <h1>Home</h1>
            <DataTable
                value={data}
                stripedRows
                paginator
                rows={5}
                rowsPerPageOptions={[5, 10, 25, 50]}
                tableStyle={{ minWidth: '50rem' }}
                filters={filters}
                filterDisplay="row"
                editMode="cell"
                dataKey="itemId"
            >
                <Column field="itemId" header="UserID" sortable></Column>
                <Column field="day" header="Day" sortable editor={(options) => numberEditor(options)} onCellEditComplete={onCellEditComplete}></Column>
                <Column field="testId" header="Test" sortable filter filterPlaceholder="Search by test ID" editor={(options) => textEditor(options)} onCellEditComplete={onCellEditComplete}></Column>
                <Column field="raterName" header="Teacher" sortable filter filterPlaceholder="Search by name" editor={(options) => textEditor(options)} onCellEditComplete={onCellEditComplete}></Column>
            </DataTable>
        </div>
    );
};

export default Home;
