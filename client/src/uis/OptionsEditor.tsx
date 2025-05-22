import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { useAppSelector } from '../store/hooks';

type OptionsEditorDialogProps = {
  value?: string;
  onChange?: (value: string) => void;
};

type OptionsEditorTableProps = {
  rowData: Record<string, unknown>;
  column: { field: string };
  editorCallback?: (value: string) => void;
};

type OptionsEditorProps = OptionsEditorDialogProps | OptionsEditorTableProps;

const OptionsEditor = (props: OptionsEditorProps) => {
  const raters = useAppSelector((state) => state.ratersUpdate).map((rater) => ({
    label: rater.raterName,
    value: rater.raterName,
    active: rater.active,
  }));

  const isTableContext = (p: OptionsEditorProps): p is OptionsEditorTableProps =>
    'rowData' in p && 'column' in p;

  const initialValue = isTableContext(props)
    ? (typeof props.rowData?.[props.column?.field] === 'string' ? props.rowData?.[props.column?.field] as string : undefined)
    : props.value;

  const [selectedValue, setSelectedValue] = useState<string | undefined>(initialValue);
  const [filterText, setFilterText] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(
    raters.filter((r) => r.active)
  );

  const handleFilterInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setFilterText(e.target.value);
    setFilteredOptions(
      raters.filter((r) => r.active && r.label.toLowerCase().includes(query))
    );
  };

  const handleDropdownChange = (e: DropdownChangeEvent) => {
    setSelectedValue(e.value);
    if (isTableContext(props)) {
      props.editorCallback?.(e.value);
    } else {
      props.onChange?.(e.value);
    }
  };

  const handleClear = () => {
    setSelectedValue(undefined);
    setFilterText('');
    setFilteredOptions(raters.filter((r) => r.active));
    if (isTableContext(props)) {
      props.editorCallback?.('');
    } else {
      props.onChange?.('');
    }
  };

  return (
    <div>
      {selectedValue ? (
        <div className="flex align-items-center justify-content-between border-1 p-2 border-round surface-border">
          <span>{selectedValue}</span>
          <button
            type="button"
            className="p-button p-button-text p-button-danger p-ml-2"
            onClick={handleClear}
          >
            ×
          </button>
        </div>
      ) : (
        <>
          <InputText
            placeholder="Search a rater name"
            value={filterText}
            onChange={handleFilterInput}
            className="mb-2 w-full"
          />
          <Dropdown
            value={selectedValue}
            options={filteredOptions}
            onChange={handleDropdownChange}
            placeholder="Click to select"
            itemTemplate={(option) => <p>{option.label}</p>}
            className="w-full"
          />
        </>
      )}
    </div>
  );
};

export default OptionsEditor;
