export interface BleDeviceConfig {
  id?: string;
  identifier?: string;
  serviceUuid: string;
  rssiThreshold?: number;
}

export interface BleCheckinResult {
  valid: boolean;
  message?: string;

  checkinRecordId?: string;
  checkinAt?: string;

  checkinPointId?: string;
  workareaId?: string;
  code?: string;

  deviceId?: string;
  deviceName?: string;
  deviceUuid?: string;

  verifiedAt?: string;
}
