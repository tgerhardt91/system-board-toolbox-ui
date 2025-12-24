import React, { useState, useRef, useEffect } from "react";
import TensionBoardSelector from "./components/TensionBoardSelector.jsx";
import { tb2MirrorHolds } from "./data/holds.jsx";
import { useSendHolds } from "./hooks/useSendHolds.js";
import { difficultyOptions, getDisplayGrade } from "./utils.js";

export default function App() {
  const [activeTab, setActiveTab] = useState("filter");

  const [selection, setSelection] = useState([]);
  const [setter, setSetter] = useState("");
  const [includeClimbsWithMirroredHolds, setIncludeClimbsWithMirroredHolds] =
    useState(false);
  const [requireTypeMatch, setRequireTypeMatch] = useState(false);

  const [returnedClimbs, setReturnedClimbs] = useState([]);
  const [activeClimb, setActiveClimb] = useState(null);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [difficultyMin, setDifficultyMin] = useState(0);
  const [difficultyMax, setDifficultyMax] =
    useState(difficultyOptions.length - 1);

  const [angle, setAngle] = useState(40);

  const [showFilterOptions, setShowFilterOptions] = useState(false);

  const [isFilterActive, setIsFilterActive] = useState(false);
  const loaderRef = useRef(null);

  const { sendHolds, loading, error } =
    useSendHolds("http://localhost:8080/api/v1/hold");

const angleOptions = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, "Any"];

  async function loadClimbs(requestedPage = 0) {
    const result = await sendHolds(
      requestedPage,
      selection,
      setter,
      includeClimbsWithMirroredHolds,
      requireTypeMatch,
      difficultyMin,
      difficultyMax,
      angle
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
      setActiveClimb(null);
    }
  }

  async function handleSend() {
    setIsFilterActive(true);
    setReturnedClimbs([]);
    setPage(0);
    setHasMore(true);

    await loadClimbs(0);

    setActiveTab("climbs");
  }

  function setSelectedAngle(angle) {
    if(angle == "Any") {
      setAngle("Any");
    } else {
      setAngle(Number(angle));
    }
  }

  function renderStars(q) {
    const max = 3;
    const filled = "★".repeat(q || 0);
    const empty = "☆".repeat(max - (q || 0));
    return filled + empty;
  }

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
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "#eee",
        fontFamily: "system-ui, sans-serif",
        width: "100vw",
        maxWidth: "100vw",
        overflowX: "hidden"
      }}
    >
      {/* ───────── TAB BAR (full width) ───────── */}
<div
  style={{
    display: "flex",
    justifyContent: "space-around",
    background: "#222",
    borderBottom: "1px solid #333",
    position: "sticky",
    top: 0,
    zIndex: 50,
    width: "100vw"
  }}
>
  {["filter", "climbs"].map(tab => (
    <div
      key={tab}
      onClick={() => setActiveTab(tab)}
      style={{
        padding: "12px 16px",
        cursor: "pointer",
        fontWeight: activeTab === tab ? 700 : 400,
        color: activeTab === tab ? "#4caf50" : "#aaa",
        borderBottom:
          activeTab === tab ? "2px solid #4caf50" : "2px solid transparent",
      }}
    >
      {tab.toUpperCase()}
    </div>
  ))}
</div>

{/* ───────── CENTERED CONTENT WRAPPER ───────── */}
<div
  style={{
    width: "100%",
    maxWidth: 900,
    margin: "0 auto",
    padding: 16,
    boxSizing: "border-box"
  }}
>


        {/* ───────── FILTER TAB ───────── */}
        <div style={{ display: activeTab === "filter" ? "block" : "none" }}>
          <TensionBoardSelector
            holds={tb2MirrorHolds}
            onSelectionChange={setSelection}
            activeClimb={activeClimb}
            imageUrl="/tension2.png"
            displayMode={"filter"}
          />
        </div>

        {activeTab === "filter" && (
          <div style={{ padding: 16 }}>
            {/* BOARD */}
            {/* FILTER button */}
            <button
              disabled={loading || selection.length === 0}
              onClick={handleSend}
              style={{
                marginTop: 20,
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #555",
                background: loading ? "#555" : "#4caf50",
                color: "#fff",
                fontSize: 16,
                cursor: loading ? "default" : "pointer"
              }}
            >
              {loading ? "Filtering…" : "Filter climbs by selection"}
            </button>

            {/* FILTER OPTIONS TOGGLE */}
            <button
              onClick={() => setShowFilterOptions(prev => !prev)}
              style={{
                width: "100%",
                marginTop: 16,
                padding: "8px 12px",
                textAlign: "left",
                background: "#333",
                color: "#eee",
                borderRadius: 6,
                border: "1px solid #444"
              }}
            >
              {showFilterOptions ? "▼ Hide filter options" : "▶ Show filter options"}
            </button>

            {showFilterOptions && (
              <div
                style={{
                  marginTop: 16,
                  background: "#1a1a1a",
                  padding: 14,
                  borderRadius: 8,
                  border: "1px solid #333"
                }}
              >
                <div style={{ marginBottom: 12 }}>
                  <label><strong>Angle</strong></label>
                  <select
                    value={angle}
                    onChange={e => setSelectedAngle(e.target.value)}
                    style={{
                      width: "100%",
                      marginTop: 6,
                      padding: "6px 8px",
                      borderRadius: 6,
                      background: "#000",
                      color: "#eee",
                      border: "1px solid #333"
                    }}
                  >
                    {angleOptions.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label><strong>Setter</strong></label>
                  <input
                    type="text"
                    value={setter}
                    onChange={e => setSetter(e.target.value)}
                    style={{
                      width: "100%",
                      marginTop: 6,
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "1px solid #333",
                      background: "#000",
                      color: "#eee"
                    }}
                  />
                </div>

                <strong>Difficulty Range</strong>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <select
                    value={difficultyMin}
                    onChange={e => {
                      const val = Number(e.target.value);
                      if (val <= difficultyMax) setDifficultyMin(val);
                    }}
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      borderRadius: 6,
                      background: "#000",
                      color: "#eee",
                      border: "1px solid #333"
                    }}
                  >
                    {difficultyOptions.map((label, idx) => (
                      <option key={idx} value={idx}>{label}</option>
                    ))}
                  </select>

                  <select
                    value={difficultyMax}
                    onChange={e => {
                      const val = Number(e.target.value);
                      if (val >= difficultyMin) setDifficultyMax(val);
                    }}
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      borderRadius: 6,
                      background: "#000",
                      color: "#eee",
                      border: "1px solid #333"
                    }}
                  >
                    {difficultyOptions.map((label, idx) => (
                      <option key={idx} value={idx}>{label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginTop: 10 }}>
                  <label style={{ display: "flex", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={includeClimbsWithMirroredHolds}
                      onChange={e =>
                        setIncludeClimbsWithMirroredHolds(e.target.checked)
                      }
                    />
                    Include climbs with mirrored holds
                  </label>

                  <label style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <input
                      type="checkbox"
                      checked={requireTypeMatch}
                      onChange={e =>
                        setRequireTypeMatch(e.target.checked)
                      }
                    />
                    Require exact match on hold type
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "climbs" && (
          <div style={{
            display: "block",
            width: "100%",
            padding: 16,
            boxSizing: "border-box",
            overflowY: "auto",
            maxHeight: "calc(100vh - 60px)"
          }}>
            {activeClimb && (
              <>
                <button
                  onClick={() => setActiveClimb(null)}
                  style={{
                    marginBottom: 16,
                    padding: "6px 10px",
                    background: "#333",
                    color: "#fff",
                    borderRadius: 6,
                    border: "1px solid #444",
                    cursor: "pointer"
                  }}
                >
                  ← Back to climbs
                </button>

                <TensionBoardSelector
                  holds={tb2MirrorHolds}
                  activeClimb={activeClimb}
                  imageUrl="/tension2.png"
                  displayMode="climb"
                />

                <h2 style={{ marginTop: 16 }}>{activeClimb.name}</h2>
                <div style={{ fontSize: 14, color: "#bbb" }}>
                  Setter: {activeClimb.setter || "—"}
                </div>

                <div style={{ fontSize: 14, marginTop: 8 }}>
                  Grade: {getDisplayGrade(activeClimb.difficulty)}
                </div>

                <div style={{ fontSize: 14, color: "#ffe083", marginTop: 4 }}>
                  {renderStars(activeClimb.quality)}
                </div>

                <div style={{ fontSize: 13, marginTop: 6 }}>
                  Ascents: {activeClimb.ascentionistCount ?? "—"}
                </div>

                <button
                  onClick={() => setActiveClimb(null)}
                  style={{
                    marginTop: 20,
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #555",
                    background: "#444",
                    color: "#fff",
                    cursor: "pointer"
                  }}
                >
                  ← Back to climbs
                </button>
              </>
            )}

            {/* If NO climb selected: show climb list */}
            {!activeClimb && (
              <>
                {error && (
                  <div style={{ color: "crimson" }}>Error: {error}</div>
                )}

                {returnedClimbs.map(c => (
                  <div
                    key={c.uuid}
                    onClick={() => setActiveClimb(c)}
                    style={{
                      padding: "10px 12px",
                      marginBottom: 10,
                      background: "#222",
                      borderRadius: 8,
                      border: "1px solid #333",
                      cursor: "pointer",
                      width: "100%",
                      boxSizing: "border-box"
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>
                      {c.name} — {getDisplayGrade(c.difficulty)} @{c.angle}
                    </div>
                    <div style={{ fontSize: 14, color: "#ffe083", marginTop: 4 }}>
                      {renderStars(c.quality)}
                    </div>
                    <div style={{ fontSize: 13, color: "#ddd" }}>
                      Setter: {c.setter || "—"} • Ascents: {c.ascentionistCount || "—"}
                    </div>
                    {c.noMatching && (
                      <div style={{ fontSize: 12, color: "crimson" }}>
                        No Matching
                      </div>
                    )}
                  </div>
                ))}

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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
