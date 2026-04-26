import axiosInstance from "@/config/axiosInstance";

export async function getDevicesByIdentifier(identifier: string) {
  const res = await axiosInstance.get(
    `/AccessDevices?by-identifier=${identifier}&page=1&pageSize=50`,
  );

  const d = res.data;
  return [
    // ← wrap thành array
    {
      id: d.id,
      identifier: d.identifier,
      serviceUuid: d.bleInfo?.serviceUuid,
      rssiThreshold: d.bleInfo?.rssiThreshold ?? -80,
    },
  ];
}
