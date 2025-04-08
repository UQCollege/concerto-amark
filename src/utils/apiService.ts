import axios from "axios";
import { RaterList } from "../features/data/ratersUpdateSlice";
import { RatingAspects } from "../features/data/assessDataSlice";

const API_BASE_URL = import.meta.env.VITE_API_URL;

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

        const result = response.data.map((item: { name: string; rater_digital_id: string; active: boolean }) => ({ raterName: item.name, raterDigitalId: item.rater_digital_id, active: item.active }));
        return result
    } catch (error) {
        console.error("Error fetching data: ", error);
    }
}

// Post Method
export const createTaskInTable = async (data: { student_name: string; trait: string; rater_name: string }) => {
    try {
        const response = await apiService.post("/raters-assignment/", data);
        return response.data;
    } catch (error) {
        console.error("Error creating task: ", error);
    }
}
export const writeRatersToDatabase = async (raters: RaterList[]): Promise<void> => {
    const ratersData = []
    try {

        for (const rater of raters) {
            const raterData = {
                name: rater.raterName,
                rater_digital_id: rater.raterDigitalId,
                active: true,
                password: 'test123', // Default password
            };

            ratersData.push(raterData)
        }
        const response = await apiService.post("/raters/", { raters: ratersData });

        if (response.data.Code === 409) {
            console.log(response.data.message);
        }

    } catch (error) {
        console.error("Error creating raters: ", error);

    }
}

// Put Method

export const updateTasksTable = async (task: { idList: number[], raterName: string }) => {
    try {
        const { idList, raterName } = task
        const data = []
        data.push({ idList, raterName })
        await apiService.put("/raters-assignment/", data)
    } catch (error) {
        console.error(error)
    }
}

export const updateRatingInTable = async (data: { id: number; ratings: RatingAspects; completed: boolean }[]) => {
    try {
        await apiService.put("/raters-assignment/", data)
    } catch (error) {
        console.error(error)
    }
}

// Delete Method
export const deleteTaskInTable = async (id: number) => {
    try {
        await apiService.delete(`/raters-assignment/${id}/`);
    } catch (error) {
        console.error("Error deleting task: ", error);
    }
}

export const deleteRaterInTable = async (rater_digital_id: string) => {
    try {

        await apiService.delete(`/raters/`, { data: { rater_digital_id } });
    } catch (error) {
        console.error("Error deleting task: ", error);
    }
}