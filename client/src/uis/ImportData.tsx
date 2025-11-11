import React from "react";
import {  migrateWritings } from "../utils/apiService";
import { Button } from "primereact/button";
import { InputNumber, InputNumberValueChangeEvent } from "primereact/inputnumber";
import { FloatLabel } from 'primereact/floatlabel';
export const defaultTestId=54

export const ImportData = () => {
  const [testId, setTestId] = React.useState(defaultTestId); // default writing test id

  const importWritingsHandler = async () => {
    const response = await migrateWritings(testId)
    alert(response)
  }

  return (
    <div className="p-inputgroup flex-1">
      <FloatLabel className="border p-1 rounded w-24" >
        <InputNumber
          id="test-id"
          onValueChange={(e: InputNumberValueChangeEvent) => setTestId(e.value ?? defaultTestId)}
          inputStyle={{ width: '100%', minWidth: 50 }} // ensure input fits container
        />
        <label htmlFor="test-id">Test ID</label>
      </FloatLabel>
     <Button onClick={importWritingsHandler} tooltip="Import writings from the specified test" icon="pi pi-file-import"/>
    </div>
  );
};
