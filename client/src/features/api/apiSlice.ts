// src/store/apiSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosInstance } from 'axios';

type EnvType = "PROD" | "DEV";

interface ApiState {
  environment: EnvType;
  apiService: AxiosInstance;
}

const getApiBaseUrl = (env: EnvType): string => {
  if (import.meta.env.VITE_AUTH_DISABLED === 'true') {
    return import.meta.env.VITE_API_URL_LOCAL;
  }
  return env === 'PROD' 
    ? import.meta.env.VITE_API_URL_PROD 
    : import.meta.env.VITE_API_URL_DEV;
};

const createApiService = (env: EnvType): AxiosInstance => {
  return axios.create({
    baseURL: getApiBaseUrl(env),
    headers: { "Content-Type": "application/json" },
  });
};

const getInitialEnvironment = (): EnvType => {
  const stored = localStorage.getItem('api-environment');
  return (stored === 'PROD' || stored === 'DEV') ? stored as EnvType : "PROD";
};

const initialState: ApiState = {
  environment: getInitialEnvironment(),
  apiService: createApiService(getInitialEnvironment())
};

const apiSlice = createSlice({
  name: 'api',
  initialState,
  reducers: {
    switchEnvironment: (state, action: PayloadAction<EnvType>) => {
      state.environment = action.payload;
      state.apiService = createApiService(action.payload);
      localStorage.setItem('api-environment', action.payload);
    }
  }
});

export const { switchEnvironment } = apiSlice.actions;
export default apiSlice.reducer;