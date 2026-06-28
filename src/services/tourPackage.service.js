import httpCommon from "../http-common";

const getAllTourPackages = () => {
  return httpCommon.get("/tour-packages/");
};

const getTourPackageById = (id) => {
  return httpCommon.get(`/tour-packages/${id}`);
};

const getTourPackagesByDestination = (destination) => {
  return httpCommon.get(`/tour-packages/destination/${destination}`);
};

const deactivateTourPackage = (id) => {
  return httpCommon.patch(`/tour-packages/${id}/deactivate`);
};

const updateTourPackage = (id, tourPackageData) => {
  return httpCommon.put(`/tour-packages/${id}`, tourPackageData);
};

const createTourPackage = (tourPackageData) => {
  return httpCommon.post("/tour-packages/", tourPackageData);
};

export default {
  getAllTourPackages,
  getTourPackageById,
  getTourPackagesByDestination,
  deactivateTourPackage,
  updateTourPackage,
  createTourPackage,
};