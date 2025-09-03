// Handle get token
export const getAccessToken = () => {
    if (import.meta.env.VITE_AUTH_DISABLED === "true") {
        return "FAKE_TOKEN";
    }

    return  sessionStorage.getItem("access_token");
    
};

// Handle Log-out

const LOGOUT_URL = `${import.meta.env.VITE_COGNITO_DOMAIN}/logout?client_id=${import.meta.env.VITE_OIDC_CLIENT_ID}&logout_uri=${encodeURIComponent(import.meta.env.VITE_LOGOUT_REDIRECT_URI)}`;  
export const handleLogout = ()=>{
    sessionStorage.removeItem("access_token");
    window.location.href = LOGOUT_URL
}