import React from "react";
import {  migrateWritings } from "../utils/apiService";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
export const defaultTestId=54

export const ImportData = () => {
  const [testId, setTestId] = React.useState(defaultTestId); // default writing test id

  const importWritingsHandler = async () => {
    const response = await migrateWritings(testId)
    alert(response)
  }

  return (
    <div className="flex items-center gap-4">
       <label htmlFor="test-id" className="font-bold mb-2">Input Test ID?</label>
      <InputNumber inputId="test-id" value={testId} onValueChange={(e) => setTestId(e.value ?? 0)} />
     <Button onClick={importWritingsHandler}>Migrate Writing Data</Button>
    </div>
  );
};
