// store/authSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";

const isAuthDisabled = import.meta.env.VITE_AUTH_DISABLED === "true";
type UserType = "Admin" | "Rater" | "Admin-Rater" | "Teacher" | "Test-Rater"|null

interface User {
    token: string | null;
    user: string | null;
    groups: UserType[];
}

const initialState: User = {
    token: sessionStorage.getItem("access_token") || null,
    user: null,
    groups: [] as UserType[],
};

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setToken: (state, action) => {
            state.token = action.payload;
            if (isAuthDisabled) { // for local development
                state.user = import.meta.env.VITE_LOCALDEV
                state.groups = [import.meta.env.VITE_LOCALDEV_TYPE]
            } else {

                try {
                    interface DecodedToken {
                        "username"?: string;
                        "cognito:groups"?: UserType[];
                    }
                    if (action.payload === null) return
                    const decodedToken: DecodedToken = jwtDecode<DecodedToken>(action.payload);
                    state.user = decodedToken["username"]
                        ? decodedToken["username"]
                        : null;
                    state.groups = decodedToken["cognito:groups"] || [];
                } catch (error) {
                    console.error("Failed to decode token:", error);
                    state.user = null;
                    state.groups = [];
                }
            }
        },
        logout: (state) => {
            state.token = null;
            state.user = null;
            state.groups = [];
            sessionStorage.removeItem("access_token");
        },
    },
});

export const { setToken, logout } = authSlice.actions;
export default authSlice.reducer;
