import axiosInstance from "@/config/axiosInstance";

export const sendWorkerGps = async (
  workerId: string,
  latitude: number | null,
  longitude: number | null,
  isConfirmed: boolean,
) => {
  const payload = {
    workerId,
    latitude,
    longitude,
    isConfirmed,
  };

  console.log("📍 Sending GPS:", payload);

  const res = await axiosInstance.post("/WorkerGps", payload);

  return res.data;
};
