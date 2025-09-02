import axios from "axios";
import { RaterList } from "../features/data/ratersUpdateSlice";
import { RatingAspects } from "../features/data/assessDataSlice";
import { getAccessToken } from "./auth";

const API_BASE_URL = import.meta.env.VITE_AUTH_DISABLED == 'true'
  ? import.meta.env.VITE_API_URL_LOCAL
  : import.meta.env.VITE_API_URL;


const apiService = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiService.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["X-Custom-Origin"] = import.meta.env.VITE_CUSTOM_ORIGIN;

    return config;
  },
  (error) => Promise.reject(error)
);

apiService.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 500) {
      const detail = error.response.data?.detail || "Unauthorized access";
      alert(detail);
      alert("Your session time out, Previous jobs has been saved, Please logout and login back to continue.");
      sessionStorage.removeItem("access_token");
    }

    return Promise.reject(error);
  }
);

// Get Method
export const getClassWritings = async (name: string) => {
  try {
    const response = await apiService.get(`/tasks/?teacher_name=${name}`);
    if (response.data.Code === 404){
      alert(`No Class Writings for ${name}`)
    }
    return response.data;
  } catch (error) {
    alert(`Error fetching data:${error} `);
  }
};
export const verify = async () => {
  try {
    const response = await apiService.get("/verify");
    return response.data;
  } catch (error) {
    console.error(error);
  }
};
export const getInitialAssessmentData = async (id?: number) => {
  try {
    const endpoint =
      id !== undefined ? `/allocated-tasks/?id=${id}` : "/allocated-tasks";
    const response = await apiService.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching data: ", error);
  }
};

export const getAssessmentData = async () => {
  try {
    const allocating = await apiService.get("/assign-tasks");
    if (allocating.data.Code === 500) {
      alert(`${allocating.data.message}, refresh the page`);
      return [];
    }
    const response = await apiService.get("/allocated-tasks");
    return response.data;
  } catch (error) {
    console.error("Error fetching data: ", error);
  }
};

export const getUserTasks = async (name: string) => {
  try {
    const response = await apiService.get(
      `/allocated-tasks/?rater_name=${name}`
    );
    
    return response.data;
  } catch (error) {
    console.error("Error fetching data: ", error);
  }
};

export const getRatersFromDB = async () => {
  try {
    const response = await apiService.get("/raters/");

    const result = response.data.map(
      (item: {
        username: string;
        rater_digital_id: string;
        active: boolean;
        tasks_total: number;
        user_type: string;
      }) => ({
        raterName: item.username,
        raterDigitalId: item.rater_digital_id,
        active: item.active,
        totalTasks: item.tasks_total,
        userType: item.user_type,
      })
    );

    return result;
  } catch (error) {
    console.error("Error fetching data: ", error);
  }
};

// Post Method

// Create Students records



// Migrate the Writings

export const migrateWritings = async ():Promise<string> => {
  console.log("Migrating writings...")
  try{
    const response = await apiService.post("writing-tasks/");
    return response.data.message

  }
  catch(error){
    console.error("Error migratiing writings:", error)
    return `Error migrating writings: ${error}`
  }
}



export const createTaskInTable = async (data: {
  student_code: string;
  trait: string;
  rater_name: string;
}) => {
  try {
    const response = await apiService.post("/allocated-tasks/", data);
    return response.data;
  } catch (error) {
    console.error("Error creating task: ", error);
  }
};
export const writeRatersToDatabase = async (
  raters: RaterList[]
): Promise<void> => {
  const ratersData = [];
  try {
    for (const rater of raters) {
      const raterData = {
        name: rater.raterName,
        rater_digital_id: rater.raterDigitalId,
        first_name: rater.firstName || "",
        last_name: rater.lastName || "",
        user_type: rater.userType || "Rater", // Default to "Rater" if not provided
        active: rater.active,
        class_name: rater.className,
        password: "test123", // Default password
      };

      ratersData.push(raterData);
    }
    const response = await apiService.post("/raters/", { raters: ratersData });

    if (response.data.Code === 409) {
      console.log(response.data.message);
    }
    alert(response.data.message);
  } catch (error) {
    console.error("Error creating raters: ", error);
  }
};

export const assignToAll = async (data: {
  studentCodes: string[];
  writingDay: string;
}): Promise<string> => {
  try {
    const response = await apiService.post("/assign-all/", data);
    return response.data.message
  } catch (error) {
    console.error(error);
    const errorMsg = `Error ${error}`
    return errorMsg
  }
};


// Put Method

export const updateTasksTable = async (task: {
  idList: number[];
  raterName: string;
}) => {
  try {
    const { idList, raterName } = task;
    const data = [];
    data.push({ idList, raterName });
    await apiService.put("/allocated-tasks/", data);
  } catch (error) {
    console.error(error);
  }
};

export const updateRatingInTable = async (
  data: {
    id: number;
    ratings: RatingAspects;
    comments: string;
    completed: boolean;
  }[]
) => {
  try {
    await apiService.put("/allocated-tasks/", data);
  } catch (error) {
    console.error(error);
  }
};

export const updateRater = async (data: { taskAccess: number }) => {
  try {
    await apiService.put("/raters/", data);
  } catch (error) {
    console.log(error);
  }
};

// Delete Method
export const deleteTaskInTable = async (id: number) => {
  try {
    await apiService.delete(`/allocated-tasks/${id}/`);
  } catch (error) {
    console.error("Error deleting task: ", error);
  }
};

export const deleteRaterInTable = async (rater_digital_id: string) => {
  try {
    await apiService.delete(`/raters/`, { data: { rater_digital_id } });
  } catch (error) {
    console.error("Error deleting task: ", error);
  }
};

export const deleteAllTasks = async () => {
  try {
    await apiService.get("/clear-tasks");
  } catch (error) {
    console.error("Error happens deleteing all task: ", error);
  }
};
