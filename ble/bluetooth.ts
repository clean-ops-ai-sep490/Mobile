import { bleManager } from "./bleManager";

export async function isBluetoothOn() {
  const state = await bleManager.state();
  return state === "PoweredOn";
}
