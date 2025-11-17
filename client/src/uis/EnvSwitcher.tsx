import React from "react";
import { Button } from "primereact/button";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { switchEnvironment } from "../features/api/apiSlice";
import { Dialog } from "primereact/dialog";

export const EnvSwitcher: React.FC = () => {
  const[open, setOpen] = React.useState<boolean>(false);
  const dispatch = useAppDispatch();
  const environment = useAppSelector((state) => state.api.environment);
  const userData = useAppSelector((state) => state.auth.user);

  const handleSwitch = () => {
    setOpen(!open);
  };

  return (
    <>
    <Button
      label={environment === "PROD" ? "Concerto 2" : "Concerto 1"}
      onClick={handleSwitch}
      severity={environment === "PROD" ? "success" : "secondary"}
      style={{ fontSize: "0.65rem", padding: "0.25rem 0.25rem" }}
      tooltip={`Current tasks from ${environment}. Click to switch data source.`}
      rounded
      disabled={userData === null}
      />
    {open && (<Dialog header="Switch Environment" visible={open} style={{ width: '350px' }} modal onHide={() => setOpen(false)}>
      <p>Are you sure you want to switch to different data source? you won’t be able to see your current tasks anymore.</p>
      <div className="flex justify-content-end gap-2 mt-4">
        <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={() => setOpen(false)} />
        <Button label="Yes, Switch" icon="pi pi-check" onClick={() => {
          const newEnv = environment === "PROD" ? "DEV" : "PROD";
          dispatch(switchEnvironment(newEnv));
          setOpen(false);
        }} autoFocus />
      </div>
    </Dialog>)}


    </>
  
  );
};
