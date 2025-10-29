// utils/api.ts
import { attachAuthHeaders } from "./apiService";
import { getApi } from "./apiService";

export const api = () => attachAuthHeaders(getApi());
