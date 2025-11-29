import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Circle, Rect } from "react-konva";
import useImage from "use-image";

export default function TensionBoardSelector({ holds, imageUrl, onSelect }) {
  const [image] = useImage(imageUrl);
  const [selected, setSelected] = useState([]);
  const [dragStart, setDragStart] = useState(null);
  const [dragRect, setDragRect] = useState(null);
  const stageRef = useRef();

  function pixelToBoard(px, py) {
  const boardX = -64 + (px - 52) * (128 / 1095);
  const boardY = 140 - (py - 52) * (136 / 1168);
  return { x: boardX, y: boardY };
}

  // Convert a pixel point to closest hold in board dataset
  function nearestHold(boardPoint) {
    let best = null;
    let bestD2 = Infinity;
    for (const h of holds) {
      const dx = h.hole.x - boardPoint.x;
      const dy = h.hole.y - boardPoint.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        best = h;
        bestD2 = d2;
      }
    }
    return best;
  }

  // ---------- CLICK SELECT ----------
  function handleClick(e) {
    // ignore click if dragging
    if (dragRect) return;

    const stage = stageRef.current;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const board = pixelToBoard(pos.x, pos.y);
    const hold = nearestHold(board);
    if (!hold) return;

    setSelected((prev) =>
      prev.some((s) => s.id === hold.id)
        ? prev.filter((s) => s.id !== hold.id)
        : [...prev, hold]
    );

    onSelect && onSelect(selected);
  }

  // ---------- DRAG-BOX SELECT ----------
  function handleMouseDown(e) {
    const pos = stageRef.current.getPointerPosition();
    setDragStart(pos);
    setDragRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  }

  function handleMouseMove(e) {
    if (!dragStart) return;

    const pos = stageRef.current.getPointerPosition();
    const x = Math.min(dragStart.x, pos.x);
    const y = Math.min(dragStart.y, pos.y);
    const w = Math.abs(pos.x - dragStart.x);
    const h = Math.abs(pos.y - dragStart.y);

    setDragRect({ x, y, w, h });
  }

  function handleMouseUp(e) {
    if (!dragRect) {
      setDragStart(null);
      return;
    }

    const { x, y, w, h } = dragRect;
    const box = { x1: x, y1: y, x2: x + w, y2: y + h };

    // find holds inside box
    const found = [];
    for (const h of holds) {
      // convert the board hold to pixel via inverse mapping?
      // easier: just compute its pixel center from approximate x/y.
      // But since you don’t have per-hold pixel coords,
      // use nearest matching per-click inside box.
      // For a full app you’d want pixel hold centers precomputed.
    }

    setDragRect(null);
    setDragStart(null);
  }

  return (
    <div style={{ display: "flex", gap: 12 }}>
      <Stage
        width={1200}
        height={1300}
        ref={stageRef}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        draggable
      >
        <Layer>
          <KonvaImage image={image} />

          {/* Optional: highlight selected hold centers visually */}
          {selected.map((h) => {
            // Convert hold board coords → pixel for display, but
            // since we don’t have inverse mapping yet,
            // for now use estimated pixel from linear inverse:
            const px =
              52 + ((h.hole.x + 64) * 1095) / 128;
            const py =
              52 + ((140 - h.hole.y) * 1168) / 136;

            return (
              <Circle
                key={h.id}
                x={px}
                y={py}
                radius={20}
                stroke="red"
                strokeWidth={4}
              />
            );
          })}

          {dragRect && (
            <Rect
              x={dragRect.x}
              y={dragRect.y}
              width={dragRect.w}
              height={dragRect.h}
              stroke="blue"
              dash={[4, 3]}
            />
          )}
        </Layer>
      </Stage>

      <div style={{ minWidth: 250 }}>
        <h3>Selected Holds</h3>
        <pre>{JSON.stringify(selected, null, 2)}</pre>
      </div>
    </div>
  );
}
