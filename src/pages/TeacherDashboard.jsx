import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { loadLocalProgress } from "../stores/localProgress";

export default function TeacherDashboard() {
  const [remoteProgress, setRemoteProgress] = useState([]);
  const [local, setLocal] = useState({});

  useEffect(() => {
    setLocal(loadLocalProgress());

    // Fetch remote progress if Supabase is configured
    if (supabase) {
      (async () => {
        const { data, error } = await supabase
          .from("progress")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);

        if (error) console.warn("Supabase fetch error", error);
        else setRemoteProgress(data || []);
      })();
    }
  }, []);

  return (
    <div>
      <h2>Teacher Dashboard</h2>

      <div className="card">
        <h3>Local (device) progress</h3>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(local, null, 2)}
        </pre>
      </div>

      <div className="card">
        <h3>Remote progress (Supabase)</h3>
        {supabase ? (
          remoteProgress.length ? (
            <ul>
              {remoteProgress.map((r, i) => (
                <li key={i}>
                  {r.student_id} — {r.topic} — {r.score} —{" "}
                  {new Date(r.created_at).toLocaleString()}
                </li>
              ))}
            </ul>
          ) : (
            <p>No remote progress found</p>
          )
        ) : (
          <p>
            Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
            to .env
          </p>
        )}
      </div>
    </div>
  );
}
