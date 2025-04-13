// store/authSlice.ts
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    token: localStorage.getItem("access_token") || null,
};

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setToken: (state, action) => {
            state.token = action.payload;
            localStorage.setItem("access_token", action.payload);
        },
        logout: (state) => {
            state.token = null;
            localStorage.removeItem("access_token");
        },
    },
});

export const { setToken, logout } = authSlice.actions;
export default authSlice.reducer;
