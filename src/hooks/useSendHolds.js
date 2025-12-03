import { useState, useCallback } from "react";

export function useSendHolds(apiUrl) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  const sendHolds = useCallback(
    async (page, holds, setter, includeMirrored, requireTypeMatch, difficultyMin, difficultyMax) => {
      setLoading(true);
      setError(null);
      setResponse(null);

      const gradeOffset = 10;

      const holdFrames = holds.map(h => `${h.id}r${h.roleId}`);

      const payload = {
        page,
        pageSize: 10,
        layout: "TENSION_2_MIRROR",
        setter: setter || null,
        includeClimbsWithMirroredHolds: includeMirrored,
        holdFrames: holdFrames,
        requireTypeMatch: requireTypeMatch,
        minGrade: difficultyMin + gradeOffset,
        maxGrade: difficultyMax + gradeOffset
      };

      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        setResponse(json);
        return json;

      } catch (err) {
        setError(err.message);
        return null;

      } finally {
        setLoading(false);
      }
    },
    [apiUrl]
  );

  return { sendHolds, loading, error, response };
}
