import React from "react";
import { Button } from "primereact/button";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { switchEnvironment } from "../features/api/apiSlice";

export const EnvSwitcher: React.FC = () => {
  const dispatch = useAppDispatch();
  const environment = useAppSelector((state) => state.api.environment);

  const handleSwitch = () => {
    const newEnv = environment === "PROD" ? "DEV" : "PROD";
    dispatch(switchEnvironment(newEnv));
  };

  return (
    <Button
      label={environment === "PROD" ? "Concerto 2" : "Concerto 1"}
      onClick={handleSwitch}
      severity={environment === "PROD" ? "success" : "secondary"}
      style={{ fontSize: "0.65rem", padding: "0.25rem 0.25rem" }}
      tooltip={`Current: ${environment}. Click to switch.`}
      rounded
    />
      
  
  );
};
