import { create } from 'zustand'

/**
 * Webcam device selection for the Live Monitor. Devices are discovered via
 * navigator.mediaDevices.enumerateDevices() (populated after permission grant).
 */
interface CameraState {
  devices: MediaDeviceInfo[]
  deviceId: string | null
  setDevices: (devices: MediaDeviceInfo[]) => void
  setDeviceId: (deviceId: string | null) => void
}

export const useCameraStore = create<CameraState>((set) => ({
  devices: [],
  deviceId: null,
  setDevices: (devices) =>
    set((state) => ({
      devices,
      // Default to the first camera once we know about one.
      deviceId: state.deviceId ?? devices[0]?.deviceId ?? null,
    })),
  setDeviceId: (deviceId) => set({ deviceId }),
}))
