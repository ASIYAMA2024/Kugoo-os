export type DeviceSlot = 'fardriver' | 'jbd'
export type DeviceConnection = {
  slot: DeviceSlot
  name: string
  connected: boolean
  device: BluetoothDevice
}

// Discovery/connection only. No UUIDs, characteristics, packet parsing or writes
// are assumed. Protocol integration must be added only after verification.
export async function discoverDevice(slot: DeviceSlot): Promise<DeviceConnection> {
  if (!('bluetooth' in navigator)) {
    throw new Error('Web Bluetooth is not available in this browser. Try a supported Chromium-based browser over HTTPS.')
  }
  const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true })
  if (!device.gatt) throw new Error('This Bluetooth device does not expose a GATT server.')
  await device.gatt.connect()
  return { slot, name: device.name || 'Unnamed BLE device', connected: true, device }
}

export function disconnectDevice(connection?: DeviceConnection) {
  connection?.device.gatt?.disconnect()
}

declare global {
  interface Navigator {
    bluetooth: {
      requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>
    }
  }
}