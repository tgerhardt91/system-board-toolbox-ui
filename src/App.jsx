import React, { useState, useRef, useEffect } from "react";
import TensionBoardSelector from "./components/TensionBoardSelector.jsx";
import { tb2MirrorHolds } from "./data/holds.jsx";
import { useSendHolds } from "./hooks/useSendHolds.js";
import { getDisplayGrade } from "./utils.js"

export default function App() {
  const [selection, setSelection] = useState([]);
  const [setter, setSetter] = useState("");
  const [includeClimbsWithMirroredHolds, setIncludeClimbsWithMirroredHolds] = useState(false);
  const [requireTypeMatch, setRequireTypeMatch] = useState(false);

  const [returnedClimbs, setReturnedClimbs] = useState([]);
  const [activeClimb, setActiveClimb] = useState(null);
  const [displayMode, setDisplayMode] = useState("filter");

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [isFilterActive, setIsFilterActive] = useState(false);

  const loaderRef = useRef(null);

  const { sendHolds, loading, error, response } =
    useSendHolds("http://localhost:8080/api/v1/hold");

  // --------------------------------------------
  // Load a specific page of climbs
  // --------------------------------------------
  async function loadClimbs(requestedPage = 0) {
    const result = await sendHolds(
      requestedPage,
      selection,
      setter,
      includeClimbsWithMirroredHolds,
      requireTypeMatch
    );

    if (!result || !result.items) return;

    if (requestedPage === 0) {
      setReturnedClimbs(result.items);
    } else {
      setReturnedClimbs(prev => [...prev, ...result.items]);
    }

    setPage(result.page);

    const loadedCount = (result.page + 1) * result.pageSize;
    setHasMore(loadedCount < result.total);

    if (requestedPage === 0) {
      setActiveClimb(result.items[0] ?? null);
    }
  }

  // --------------------------------------------
  // User clicks the filter button
  // --------------------------------------------
  async function handleSend() {
    setIsFilterActive(true);
    setReturnedClimbs([]);
    setPage(0);
    setHasMore(true);
    await loadClimbs(0);
  }

  function renderStars(q) {
  const max = 3;
  const filled = "★".repeat(q || 0);
  const empty = "☆".repeat(max - (q || 0));
  return filled + empty;
  }

  // --------------------------------------------
  // Infinite scroll observer
  // --------------------------------------------
  useEffect(() => {
    if (!isFilterActive) return;

    const loader = loaderRef.current;
    if (!loader) return;

    const observer = new IntersectionObserver(entries => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !loading) {
        loadClimbs(page + 1);
      }
    });

    observer.observe(loader);
    return () => observer.disconnect();

  }, [loaderRef, hasMore, loading, page, isFilterActive]);

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ marginTop: 0 }}>Tension Board 2 Toolbox</h2>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        
        <TensionBoardSelector
          holds={tb2MirrorHolds}
          onSelectionChange={setSelection}
          activeClimb={activeClimb}
          imageUrl="/tension2.png"
          displayMode={displayMode}
        />

        <div style={{ width: 340 }}>
          <div style={{ marginTop: 16 }}>
            <strong>Hold Display Mode</strong>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                onClick={() => setDisplayMode("filter")}
                style={{
                  padding: "6px 10px",
                  background: displayMode === "filter" ? "#101112ff" : "grey"
                }}
              >
                Filter
              </button>

              <button
                onClick={() => setDisplayMode("climb")}
                style={{
                  padding: "6px 10px",
                  background: displayMode === "climb" ? "#101010ff" : "grey"
                }}
              >
                Climb
              </button>
            </div>

            {displayMode === "filter" && (
              <div>
                <div style={{ marginTop: 20 }}>
                  <label><strong>Setter</strong></label>
                  <input
                    type="text"
                    value={setter}
                    onChange={(e) => setSetter(e.target.value)}
                    placeholder="optional setter filter"
                    style={{
                      width: "100%",
                      marginTop: 6,
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "1px solid #ccc",
                      fontSize: 14
                    }}
                  />
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={{ display: "flex", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={includeClimbsWithMirroredHolds}
                      onChange={(e) => setIncludeClimbsWithMirroredHolds(e.target.checked)}
                    />
                    Include climbs with mirrored holds
                  </label>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={{ display: "flex", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={requireTypeMatch}
                      onChange={(e) => setRequireTypeMatch(e.target.checked)}
                    />
                    Require exact match on hold type
                  </label>
                </div>

                <button
                  disabled={loading || selection.length === 0}
                  onClick={handleSend}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid #ccc",
                    cursor: loading ? "default" : "pointer",
                    width: "100%",
                    marginTop: 8
                  }}
                >
                  {loading ? "Filtering..." : "Filter climbs by selection"}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div style={{ color: "crimson", marginTop: 8 }}>
              Error: {error}
            </div>
          )}

          <hr style={{ margin: "16px 0" }} />

          <h3>Returned climbs ({returnedClimbs.length})</h3>

          <div
            style={{
              maxHeight: 520,
              overflow: "auto",
              border: "1px solid #3d3d3dff",
              borderRadius: 8
            }}
          >
            {returnedClimbs.map(c => {
              const isActive = activeClimb?.uuid === c.uuid;
              return (
                <div
                  key={c.uuid}
                  onClick={() => {
                    setActiveClimb(c);
                    setDisplayMode("climb");
                  }}
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    background: isActive ? "#60a93cff" : "grey",
                    borderBottom: "1px solid #f0f0f0"
                  }}
                >
                  <div style={{ fontWeight: 700 }}>
                    {c.name + " - " + getDisplayGrade(c.difficulty)}
                  </div>
                  <div style={{ fontSize: 14, color: "#ffe083", marginTop: 4 }}>
                    {renderStars(c.quality)}
                  </div>
                  <div style={{ fontSize: 13 }}>
                    Setter: {c.setter || "—"} • Ascents: {c.ascentionistCount || "—"}
                  </div>
                  {c.noMatching && (
                    <div style={{ fontSize: 12, color: "crimson" }}>
                      No Matching
                    </div>
                  )}
                </div>
              );
            })}

            <div
              ref={loaderRef}
              style={{
                height: 40,
                textAlign: "center",
                color: "#aaa",
                paddingTop: 10
              }}
            >
              {loading && "Loading more…"}
            </div>
          </div>

          <h3 style={{ marginTop: 0 }}>Selected holds</h3>

          {selection.length === 0 ? (
            <div style={{ color: "#666" }}>
              Click holds to select them.
            </div>
          ) : (
            <ul style={{ paddingLeft: 18 }}>
              {selection.map(h => (
                <li key={h.id}>
                  <b>{h.id}</b>{" "}
                  <span style={{ color: "#444" }}>
                    (x={h.x.toFixed(1)}, y={h.y.toFixed(1)})
                  </span>
                </li>
              ))}
            </ul>
          )}

        </div>
      </div>
    </div>
  );
}
