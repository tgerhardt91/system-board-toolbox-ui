import React, { useState } from "react";
import TensionBoardSelector from ".tensionBoardSelector.jsx";
import { holds } from "./data/holds.js";

export default function App() {
  const [selection, setSelection] = useState([]);

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontFamily: "system-ui, sans-serif", marginTop: 0 }}>
        Tension Board 2 Hold Selector
      </h2>

      <TensionBoardSelector
        holds={holds}
        imageUrl="/tension2.png"
        onSelectionChange={setSelection}
      />

      <div style={{ marginTop: 12, fontFamily: "system-ui, sans-serif", color: "#333" }}>
        <b>Total selected:</b> {selection.length}
      </div>
    </div>
  );
}
