import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

const apiService = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Get Method
export const getAssessmentData = async () => {
    try {
        console.log("Fetching data...", import.meta.env.VITE_API_URL);
        await apiService.get("/clear-tasks");
        await apiService.get("/assign-tasks");
        const response = await
            apiService.get("/raters-assignment");
        return response.data;
    } catch (error) {
        console.error("Error fetching data: ", error);
    }
};

export const getUserTasks = async (userId: number) => {
    try {
        const response = await apiService.get(`/raters-assignment/?rater_id=${userId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching data: ", error);
    }
}

// Post Method

// Put Method

// Delete Method