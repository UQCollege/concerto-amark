import {  migrateWritings } from "../utils/apiService";
import { Button } from "primereact/button";

export const ImportData = () => {

  const importWritingsHandler = async () => {
    const response = await migrateWritings()
    alert(response)
  }

  return (
    <div className="flex items-center gap-4">
     <Button onClick={importWritingsHandler}>Migrate Writing Data</Button>
    </div>
  );
};
