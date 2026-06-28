import httpCommon from "../http-common";

const createReservation = (reservationData) => {
  return httpCommon.post("/reservations/", reservationData);
};

const createMultipleReservations = (reservationsData) => {
  return httpCommon.post("/reservations/multiple", reservationsData);
};

const getAllReservations = () => {
  return httpCommon.get("/reservations/");
};

const getReservationById = (reservationId) => {
  return httpCommon.get(`/reservations/${reservationId}`);
};

const getReservationsByUserId = (userId) => {
  return httpCommon.get(`/reservations/user/${userId}`);
};

const getReservationsByPurchaseGroupCode = (purchaseGroupCode) => {
  return httpCommon.get(`/reservations/purchase-group/${purchaseGroupCode}`);
};

const cancelReservation = (reservationId) => {
  return httpCommon.patch(`/reservations/${reservationId}/cancel`);
};

export default {
  createReservation,
  createMultipleReservations,
  getAllReservations,
  getReservationById,
  getReservationsByUserId,
  getReservationsByPurchaseGroupCode,
  cancelReservation,
};
