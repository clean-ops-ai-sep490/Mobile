import axiosInstance from "@/config/axiosInstance";

export async function getDevicesByCheckinPoint(checkinPointId: string) {
  const res = await axiosInstance.get(
    `/AccessDevices/checkin-point/${checkinPointId}?page=1&pageSize=50`,
  );

  return res.data.items.map((d: any) => ({
    id: d.id,
    identifier: d.identifier,
    serviceUuid: d.bleInfo?.serviceUuid,
    rssiThreshold: d.bleInfo?.rssiThreshold ?? -80,
  }));
}
