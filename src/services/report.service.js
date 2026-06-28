import httpCommon from "../http-common";

const getSalesReportByPeriod = (startDate, endDate) => {
  return httpCommon.get("/reports/sales", {
    params: { startDate, endDate },
  });
};

const getTourPackageRankingByPeriod = (startDate, endDate) => {
  return httpCommon.get("/reports/tour-packages-ranking", {
    params: { startDate, endDate },
  });
};

export default {
  getSalesReportByPeriod,
  getTourPackageRankingByPeriod,
};