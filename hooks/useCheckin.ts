import axiosInstance from "@/config/axiosInstance";

export const checkin = async (payload: {
  workareaId?: string;
  qrRaw?: string;
  deviceUuid?: string;
}) => {
  const res = await axiosInstance.post("/CheckinRecords/checkin", payload);
  return res.data;
};
