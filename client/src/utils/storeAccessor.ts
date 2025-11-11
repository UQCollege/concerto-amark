import { Store } from "@reduxjs/toolkit";
import type { RootState } from "../store/store";

let _store: Store<RootState> | null = null;

export const setStore = (storeInstance: Store<RootState>) => {
  _store = storeInstance;
};

export const getStore = (): Store<RootState> => {
  if (!_store) throw new Error("Store not initialized yet!");
  return _store;
};
