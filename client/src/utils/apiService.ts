import axios from "axios";
import { RaterList } from "../features/data/ratersUpdateSlice";
import { RatingAspects } from "../features/data/assessDataSlice";
import { getAccessToken } from "./auth";


const API_BASE_URL = import.meta.env.VITE_API_URL;

const apiService = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

apiService.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Get Method
export const getClassWritings = async (name: string) => {
    try {

        const response = await apiService.get(`/tasks/?teacher_name=${name}`)


        return response.data
    } catch (error) {
        console.error(error)
    }
}
export const verify = async () => {
    try {
        const response = await apiService.get("/verify")
        return response.data
    } catch (error) {
        console.error(error)
    }
}
export const getInitialAssessmentData = async (id?: number) => {
    try {
        const endpoint = id !== undefined ? `/allocated-tasks/?id=${id}` : "/allocated-tasks";
        const response = await apiService.get(endpoint);
        return response.data;
    } catch (error) {
        console.error("Error fetching data: ", error);
    }
};



export const getAssessmentData = async () => {
    try {
        await apiService.get("/assign-tasks");
        const response = await
            apiService.get("/allocated-tasks");
        return response.data;
    } catch (error) {
        console.error("Error fetching data: ", error);
    }
};

export const getUserTasks = async (name: string) => {

    try {
        const response = await apiService.get(`/allocated-tasks/?rater_name=${name}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching data: ", error);
    }
}

export const getRatersFromDB = async () => {
    try {
        const response = await apiService.get("/raters/");

        const result = response.data.map((item: { username: string; rater_digital_id: string; active: boolean; tasks_total: number }) => ({ raterName: item.username, raterDigitalId: item.rater_digital_id, active: item.active, totalTasks: item.tasks_total }));
        console.log(result)
        return result
    } catch (error) {
        console.error("Error fetching data: ", error);
    }
}

// Post Method
export const createTaskInTable = async (data: { student_name: string; trait: string; rater_name: string }) => {
    try {
        const response = await apiService.post("/allocated-tasks/", data);
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

export const assignToAll = async (data: { studentNames: string[] }): Promise<void> => {
    try {
        console.log(data)
        await apiService.post("/assign-all/", data)

    } catch (error) {
        console.error(error)
    }
}

export const uploadData = async <T>(
    url: string,
    payloadKey: string,
    data: T[]
): Promise<string> => {
    try {
        const response = await apiService.post(url, {
            [payloadKey]: data,
        });

        return response.data.message || "Upload successful";
    } catch (error: any) {
        const msg =
            error.response?.data?.message || error.message || "Upload failed";
        throw new Error(msg);
    }
};
// Put Method

export const updateTasksTable = async (task: { idList: number[], raterName: string }) => {
    try {
        const { idList, raterName } = task
        const data = []
        data.push({ idList, raterName })
        await apiService.put("/allocated-tasks/", data)
    } catch (error) {
        console.error(error)
    }
}

export const updateRatingInTable = async (data: { id: number; ratings: RatingAspects; comments: string; completed: boolean }[]) => {
    try {
        await apiService.put("/allocated-tasks/", data)
    } catch (error) {
        console.error(error)
    }
}


export const updateRater = async (data: { taskAccess: number }) => {
    try {
        await apiService.put("/raters/", data)
    } catch (error) {
        console.log(error)
    }
}

// Delete Method
export const deleteTaskInTable = async (id: number) => {
    try {
        await apiService.delete(`/allocated-tasks/${id}/`);
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

export const deleteAllTasks = async () => {
    try {
        await apiService.get("/clear-tasks")
    } catch (error) {
        console.error("Error happens deleteing all task: ", error)
    }
}