import httpCommon from "../http-common";

const createPayment = (paymentData) => {
  return httpCommon.post("/payments/", paymentData);
};

const createPurchaseGroupPayment = (purchaseGroupCode, paymentData) => {
  return httpCommon.post(`/payments/purchase-group/${purchaseGroupCode}`, paymentData);
};

const getAllPayments = () => {
  return httpCommon.get("/payments/");
};

export default {
  createPayment,
  createPurchaseGroupPayment,
  getAllPayments,
};
