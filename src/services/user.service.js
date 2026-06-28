import httpCommon from "../http-common";

const getCurrentUser = () => {
  return httpCommon.get("/users/me");
};

const updateCurrentUserProfile = (userData) => {
  return httpCommon.put("/users/me", userData);
};

const getAllUsers = () => {
  return httpCommon.get("/users/");
};

const activateUser = (userId) => {
  return httpCommon.patch(`/users/${userId}/activate`);
};

const deactivateUser = (userId) => {
  return httpCommon.patch(`/users/${userId}/deactivate`);
};

export default {
  getCurrentUser,
  updateCurrentUserProfile,
  getAllUsers,
  activateUser,
  deactivateUser,
};