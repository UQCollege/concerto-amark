import { jwtDecode } from "jwt-decode";

const WARNING_BEFORE_EXPIRY_SECONDS = 300; // 5 minutes

export const getAccessToken = () => {
    if (import.meta.env.VITE_AUTH_DISABLED === "true") {
        return "FAKE_TOKEN";
    }

    const token = sessionStorage.getItem("access_token");
    if (!token) return null;

    try {
        const { exp, iat }: { exp: number; iat: number } = jwtDecode(token);
        console.log("Token iat:", iat, "| exp:", exp);

        if (!exp || !iat) {
            throw new Error("Invalid token");
        }

        // Save iat timestamp locally on first decode (if not saved yet)
        if (!sessionStorage.getItem("token_iat")) {
            sessionStorage.setItem("token_iat", iat.toString());
        }

        const storedIat = Number(sessionStorage.getItem("token_iat"));
        const now = Math.floor(Date.now() / 1000);
        const elapsed = now - storedIat;
        const lifetime = exp - iat;

        if (lifetime > 3600) {
            // suspicious token lifetime, force logout
            alert("Your session is invalid or expired. Please log in again.");
            sessionStorage.removeItem("access_token");
            sessionStorage.removeItem("token_iat");
            window.location.href = `${import.meta.env.VITE_LOGOUT_URL}`;
            return null;
        }

        if (elapsed >= lifetime) {
            // Token expired
            alert("Your session has expired. Please log in again.");
            sessionStorage.removeItem("access_token");
            sessionStorage.removeItem("token_iat");
            window.location.href = `${import.meta.env.VITE_LOGOUT_URL}`;
            return null;
        }

        if (elapsed >= lifetime - WARNING_BEFORE_EXPIRY_SECONDS) {
            // Token about to expire soon - warn user
            console.warn("Your session will expire soon. Please save your work and re-login.");
        }

        return token;
    } catch (e) {
        console.error("Invalid access token format. Redirecting to login...");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("token_iat");
        window.location.href = `${import.meta.env.VITE_LOGOUT_URL}`;
        return null;
    }
};
