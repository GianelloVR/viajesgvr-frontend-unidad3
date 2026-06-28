import axios from "axios";
import keycloak from "./services/keycloak";

const API_SERVER = import.meta.env.VITE_API_SERVER;
const API_PORT = import.meta.env.VITE_API_PORT;

const httpCommon = axios.create({
  baseURL: `http://${API_SERVER}:${API_PORT}/api`,
  headers: {
    "Content-type": "application/json",
  },
});

httpCommon.interceptors.request.use(
  async (config) => {
    if (keycloak.authenticated) {
      try {
        await keycloak.updateToken(30);
        config.headers.Authorization = `Bearer ${keycloak.token}`;
      } catch (error) {
        console.error("Error updating Keycloak token:", error);
        keycloak.login();
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default httpCommon;