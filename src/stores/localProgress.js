import { supabase } from "../supabaseClient";

const LS_KEY = "gamify_progress_v1";
const QUEUE_KEY = "gamify_sync_queue_v1";

/**
 * Load all local progress from localStorage
 */
export function loadLocalProgress() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch (e) {
    console.warn("⚠️ Failed to parse local progress:", e);
    return {};
  }
}

/**
 * Save progress for a specific student
 */
export function saveLocalProgress(studentId, progress) {
  const all = loadLocalProgress();
  all[studentId] = progress;
  localStorage.setItem(LS_KEY, JSON.stringify(all));
}

/**
 * Queue an item to be synced later
 */
export function enqueueSync(item) {
  const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  q.push(item);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

/**
 * Attempt to flush sync queue to Supabase
 */
export async function tryFlushQueue() {
  if (!supabase) return;

  const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  if (q.length === 0) return;

  try {
    for (const item of q) {
      // item shape: { student_id, topic, score, timestamp }
      const { error } = await supabase.from("progress").insert([
        {
          student_id: item.student_id,
          topic: item.topic,
          score: item.score,
          created_at: item.timestamp,
        },
      ]);

      if (error) {
        console.warn("⚠️ Sync error:", error);
        throw error; // stop if one fails
      }
    }

    // ✅ if all items synced successfully, clear queue
    localStorage.setItem(QUEUE_KEY, JSON.stringify([]));
    console.log("✅ Synced progress to Supabase");
  } catch (err) {
    console.warn("⚠️ Could not flush queue:", err);
  }
}

/**
 * Initialize background sync loop
 */
export function initSync() {
  // Try flush immediately when online
  window.addEventListener("online", tryFlushQueue);

  // Try every 20 seconds if online
  setInterval(() => {
    if (navigator.onLine) {
      tryFlushQueue();
    }
  }, 20000);
}
