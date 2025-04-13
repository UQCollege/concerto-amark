export const getAccessToken = () => {
    if (import.meta.env.VITE_AUTH_DISABLED === "true") {
        return "FAKE_TOKEN";
    }
    return localStorage.getItem("access_token");
};