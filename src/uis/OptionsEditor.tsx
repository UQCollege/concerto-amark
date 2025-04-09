import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { ColumnEditorOptions } from 'primereact/column';

import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { useAppSelector } from '../store/hooks';


type OptionsEditorDialogProps = {
  value?: string;
  onChange?: (value: string) => void;
};

type OptionsEditorTableProps = ColumnEditorOptions;

type OptionsEditorProps = OptionsEditorDialogProps | OptionsEditorTableProps;

const OptionsEditor = (props: OptionsEditorProps) => {
  const raters = useAppSelector((state) => state.ratersUpdate).map((rater) => ({
    label: rater.raterName,
    value: rater.raterName,
    active: rater.active,
  }));

  const [filteredOptions, setFilteredOptions] = useState(raters);

  const onFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.toLowerCase();
    setFilteredOptions(
      raters.filter((rater) => rater.active === true).filter((option) => option.label.toLowerCase().includes(query))
    );
  };

  // Determine context and extract props accordingly
  const isTableContext = (p: OptionsEditorProps): p is ColumnEditorOptions =>
    'rowData' in p && 'column' in p;

  let currentValue: string | undefined = undefined;

  if (isTableContext(props)) {
    const { column, rowData } = props;
    const col = column as { field?: string }; // 
    if (col.field && rowData && typeof col.field === 'string') {
      currentValue = rowData[col.field];
    }
  } else {
    currentValue = props.value;
  }

  const handleChange = (e: DropdownChangeEvent) => {
    if (isTableContext(props)) {
      props.editorCallback?.(e.value);
    } else {
      props.onChange?.(e.value);
    }
  };

  return (
    <div>
      <InputText
        placeholder="Search a rater name"
        onInput={onFilter}
        className="mb-2"
      />
      <Dropdown
        value={currentValue}
        options={filteredOptions}
        onChange={handleChange}
        placeholder="Click to Select a rater"
        itemTemplate={(option) => <p>{option.label}</p>}
      />
    </div>
  );
};
export default OptionsEditor;