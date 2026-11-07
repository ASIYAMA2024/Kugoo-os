import { openDB } from 'idb'

export type Ride = {
  id: string
  startedAt: number
  endedAt: number
  durationSeconds: number
  distanceKm: number | null
  maxSpeedKmh: number | null
  averageSpeedKmh: number | null
  energyWh: number | null
  source: 'demo' | 'verified'
}

const dbPromise = openDB('kugoo-dashboard', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('rides')) {
      const store = db.createObjectStore('rides', { keyPath: 'id' })
      store.createIndex('startedAt', 'startedAt')
    }
  }
})

export async function saveRide(ride: Ride) {
  return (await dbPromise).put('rides', ride)
}
export async function getRides(): Promise<Ride[]> {
  return (await dbPromise).getAllFromIndex('rides', 'startedAt')
}
export async function clearRides() {
  return (await dbPromise).clear('rides')
}