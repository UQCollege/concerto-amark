import { getStore } from "./storeAccessor";
import { getAccessToken } from "../utils/auth";
import { defaultTestId } from "../uis/ImportData";
import { RaterList } from "../features/data/ratersUpdateSlice";
import { RatingAspects } from "../features/data/assessDataSlice";
import { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { api } from "./api";

// Helper to get the current axios instance from Redux
export const getApi = () => getStore().getState().api.apiService;

// Optional helper to attach auth header (if needed)
export const attachAuthHeaders = (api: AxiosInstance) => {
  const token = getAccessToken();
  api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["X-Custom-Origin"] = import.meta.env.VITE_CUSTOM_ORIGIN;
    return config;
  });
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 500) {
        const detail = error.response.data || "Server Error";
        alert(detail);
        sessionStorage.removeItem("access_token");
      }
      return Promise.reject(error);
    }
  );
  return api;
};
// const apiService = attachAuthHeaders(getApi());
// Get Method
export const getClassWritings = async (name: string) => {
  try {
    const apiService = api();
    const response = await apiService.get(`/tasks/?teacher_name=${name}`);
    if (response.data.Code === 404) {
      alert(`No Class Writings for ${name}`);
    }
    return response.data;
  } catch (error) {
    alert(`Error fetching data:${error} `);
  }
};
export const verify = async () => {
  try {
    const apiService = api();
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
      const apiService = api();
    const response = await apiService.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching data: ", error);
  }
};

export const getAssessmentData = async () => {
  try {
    const apiService = api();
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
    const apiService = api();
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
    const apiService = api();
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

export const migrateWritings = async (
  testId = defaultTestId
): Promise<string> => {
  console.log("Migrating writings...");
  try {
    const apiService = api();
    const response = await apiService.post("writing-tasks/", { testId });
    return response.data.message;
  } catch (error) {
    console.error("Error migratiing writings:", error);
    return `Error migrating writings: ${error}`;
  }
};

// upload splitted writing data to S3
export const uploadSplittedDataToS3 = async (): Promise<string> => {
  console.log("Uploading splitted writing data to S3...");
  try {
    const apiService = api();
    const response = await apiService.post("upload-s3/");
    alert(response.data.message);
    return response.data.message;
  } catch (error) {
    console.error("Error uploading splitted writing data to S3:", error);
    return `Error uploading splitted writing data to S3: ${error}`;
  }
};

export const createTaskInTable = async (data: {
  student_code: string;
  trait: string;
  rater_name: string;
}) => {
  try {
    const apiService = api();
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
    const apiService = api();
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
    const apiService = api();
    const response = await apiService.post("/assign-all/", data);
    return response.data.message;
  } catch (error) {
    console.error(error);
    const errorMsg = `Error ${error}`;
    return errorMsg;
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
    const apiService = api();
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
    const apiService = api();
    await apiService.put("/allocated-tasks/", data);
  } catch (error) {
    console.error(error);
  }
};

export const updateRater = async (data: { taskAccess: number }) => {
  try {
    const apiService = api();
    await apiService.put("/raters/", data);
  } catch (error) {
    console.log(error);
  }
};

// Delete Method
export const deleteTaskInTable = async (id: number) => {
  try {
    const apiService = api();
    await apiService.delete(`/allocated-tasks/${id}/`);
  } catch (error) {
    console.error("Error deleting task: ", error);
  }
};

export const deleteRaterInTable = async (rater_digital_id: string) => {
  try {
    const apiService = api();
    await apiService.delete(`/raters/`, { data: { rater_digital_id } });
  } catch (error) {
    console.error("Error deleting task: ", error);
  }
};

export const deleteAllTasks = async () => {
  try {
    const apiService = api();
    await apiService.get("/clear-tasks");
  } catch (error) {
    alert(`Error happens deleteing all task: ${error}`);
  }
};
