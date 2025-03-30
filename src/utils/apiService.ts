import axios from "axios";
import { RaterList } from "../features/data/ratersUpdateSlice";

const API_BASE_URL = "http://localhost:8000/api";

const apiService = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Get Method
export const getInitialAssessmentData = async () => {
    try {
        const response = await
            apiService.get("/raters-assignment");
        return response.data;
    } catch (error) {
        console.error("Error fetching data: ", error);
    }
}


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

export const getUserTasks = async (name: string) => {


    try {
        const response = await apiService.get(`/raters-assignment/?rater_name=${name}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching data: ", error);
    }
}

export const getRatersFromDB = async () => {
    try {
        const response = await apiService.get("/raters/");

        const result = response.data.map((item: { name: string; rater_digital_id: string }) => ({ raterName: item.name, raterDigitalId: item.rater_digital_id }))
        return result
    } catch (error) {
        console.error("Error fetching data: ", error);
    }
}

// Post Method
export const writeRatersToDatabase = async (raters: RaterList[]): Promise<void> => {

    try {

        for (const rater of raters) {
            const raterData = {
                name: rater.raterName,
                rater_digital_id: rater.raterDigitalId,
                password: 'test123', // Default password
            };
            console.log(raterData)
            await apiService.post("/raters/", raterData);
        }
    } catch (error) {

        if (axios.isAxiosError(error)) {
            if (error.response) {

                console.error("Error response from server:", error.response.data);

                // Show the error message if available from the backend
                alert(`Error: ${error.response.data.detail || "An error occurred while saving raters."}`);
            } else if (error.request) {
                // The request was made but no response was received
                console.error("Error request:", error.request);
                alert("Error: No response from server.");
            } else {

                console.error("Error message:", error.message);
                alert(`Error: ${error.message}`);
            }
        } else {

            console.error("Unknown error:", error);
            alert("An unexpected error occurred.");
        }
    }
}

// Put Method

// Delete Method