export async function cacheTransactionExplanation(digest: string, explanation: any): Promise<void> {
  try {
    const db = await openIndexedDB()
    const tx = db.transaction(["transactions"], "readwrite").objectStore("transactions")
    await tx.put(explanation, digest)
  } catch (error) {
    console.error("Failed to cache explanation:", error)
  }
}

export async function getOfflineCachedExplanation(digest: string): Promise<any | null> {
  try {
    const db = await openIndexedDB()
    const tx = db.transaction(["transactions"], "readonly").objectStore("transactions")
    return await tx.get(digest)
  } catch (error) {
    console.error("Failed to retrieve cached explanation:", error)
    return null
  }
}

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("SuiExplainer", 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains("transactions")) {
        db.createObjectStore("transactions")
      }
      if (!db.objectStoreNames.contains("preferences")) {
        db.createObjectStore("preferences")
      }
    }
  })
}

export async function savePreferencesOffline(preferences: any): Promise<void> {
  try {
    const db = await openIndexedDB()
    const tx = db.transaction(["preferences"], "readwrite").objectStore("preferences")
    await tx.put(preferences, "user_preferences")
  } catch (error) {
    console.error("Failed to save preferences offline:", error)
  }
}

export async function getOfflinePreferences(): Promise<any | null> {
  try {
    const db = await openIndexedDB()
    const tx = db.transaction(["preferences"], "readonly").objectStore("preferences")
    return await tx.get("user_preferences")
  } catch (error) {
    console.error("Failed to retrieve offline preferences:", error)
    return null
  }
}
