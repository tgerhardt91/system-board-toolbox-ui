import React, { useMemo, useRef, useState, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Circle } from "react-konva";
import useImage from "use-image";
import { pixelToBoard, boardToPixel } from "../pixelToBoard.js";

const BASE_ROLES = ["5", "6", "7", "8"];

export default function TensionBoardSelector({
  holds,
  imageUrl = "/tension2.png",
  onSelectionChange,
  activeClimb,
  displayMode = "filter"
}) {
  const [image] = useImage(imageUrl);

  const stageRef = useRef();
  const [stageScale, setStageScale] = useState(1);

  const [selected, setSelected] = useState([]);
  const [holdClicks, setHoldClicks] = useState(new Map());

  const radius = window.innerWidth < 600 ? 32 : 22;
  const strokeWidth = window.innerWidth < 600 ? 6 : 4;

  // Scale stage based on screen height
  useEffect(() => {
    if (image) {
      const maxH = window.innerHeight * 0.8;
      const scale = maxH / image.height;
      setStageScale(scale);
    }
  }, [image]);

  // Hold lookup table
  const holdMap = useMemo(() => {
    const m = new Map();
    for (const h of holds) {
      m.set(h.id, {
        id: h.id,
        x: h.hole.x,
        y: h.hole.y,
        defaultRoleId: h.default_role_id
      });
    }
    return m;
  }, [holds]);

  // Geometry list for nearest-neighbor search
  const holePoints = useMemo(
    () =>
      holds.map((h) => ({
        id: h.id,
        x: h.hole.x,
        y: h.hole.y,
        defaultRoleId: h.default_role_id
      })),
    [holds]
  );

  // Find nearest board coordinate hold
  function nearestHold(boardPoint) {
    let best = null;
    let bestD2 = Infinity;
    for (const h of holePoints) {
      const dx = h.x - boardPoint.x;
      const dy = h.y - boardPoint.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = h;
      }
    }
    return best;
  }

  // Color mapping for selected holds by roleId
  function getColorByRoleId(roleId) {
    switch (roleId) {
      case "5":
        return "#00FF00"; // start
      case "6":
        return "#0000FF"; // middle
      case "7":
        return "#FF0000"; // finish
      case "8":
        return "#FF00FF"; // foot
      default:
        return "#0000FF";
    }
  }

  function getColorByRole(role) { 
        if(role === 'r8') 
            { return '#FF00FF'; } 
        if(role === 'r6') 
            { return '#0000FF'; }
        if(role === 'r5') 
            { return '#00FF00'; }
        if(role === 'r7') 
            { return '#FF0000'; }
        return '#0000FF'; 
    }

  // Build a per-hold role sequence rotated so defaultRoleId is first
  function getRoleSequence(defaultRoleId) {
    const idx = BASE_ROLES.indexOf(defaultRoleId);
    if (idx === -1) {
      // fallback: just use base
      return BASE_ROLES;
    }
    return [
      BASE_ROLES[idx],
      BASE_ROLES[(idx + 1) % BASE_ROLES.length],
      BASE_ROLES[(idx + 2) % BASE_ROLES.length],
      BASE_ROLES[(idx + 3) % BASE_ROLES.length]
    ];
  }

  // Role cycle for a given hold & click count
  //  1st click: handled by stage (select with default)
  //  2nd–4th click: cycle through other roles in rotated sequence
  //  5th click: deselect
  function getNextRole(hold, clickCount) {
    const seq = getRoleSequence(hold.defaultRoleId);

    // Defensive: if we ever call with clickCount <= 1, just return default
    if (clickCount <= 1) {
      return hold.defaultRoleId;
    }

    // 2nd click -> seq[1]
    // 3rd click -> seq[2]
    // 4th click -> seq[3]
    // 5th+ click -> null (deselect)
    const index = clickCount - 1; // 1-based to 0-based
    if (index >= seq.length) {
      return null; // end of cycle
    }
    return seq[index];
  }

  // Handle clicking an already-selected hold (Circle click)
  function handleHoldClick(e, hold) {
    e.cancelBubble = true;

    // Update click count for this hold
    setHoldClicks((prev) => {
      const next = new Map(prev);
      const prevCount = next.get(hold.id) || 1;
      next.set(hold.id, prevCount + 1);
      return next;
    });

    setSelected((prev) => {
      const rawPrevCount = holdClicks.get(hold.id) || 1;
      const clicks = rawPrevCount + 1;
      const exists = prev.some((h) => h.id === hold.id);

      if (!exists) {
        return [
          ...prev,
          { ...hold, roleId: hold.defaultRoleId }
        ];
      }

      const newRole = getNextRole(hold, clicks);

      // FIX: When deselecting, reset click counter
      if (newRole === null) {
        const nextSel = prev.filter((h) => h.id !== hold.id);

        setHoldClicks(prev => {
          const nextMap = new Map(prev);
          nextMap.set(hold.id, 0);   // 🔥 reset
          return nextMap;
        });

        onSelectionChange?.(nextSel);
        return nextSel;
      }

      const nextSel = prev.map((h) =>
        h.id === hold.id ? { ...h, roleId: newRole } : h
      );

      onSelectionChange?.(nextSel);
      return nextSel;
    });
}

  // Handle clicking empty board background (Stage click)
  function onStageClick() {
    if (displayMode === "climb") return;

    const stage = stageRef.current;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const scaledPos = {
      x: pos.x / stageScale,
      y: pos.y / stageScale
    };

    const boardPoint = pixelToBoard(scaledPos.x, scaledPos.y);
    const hold = nearestHold(boardPoint);
    if (!hold) return;

    // First click for this hold: initialize to 1
    setHoldClicks((prev) => {
      const next = new Map(prev);
      if (!next.has(hold.id)) {
        next.set(hold.id, 1);
      }
      return next;
    });

    // Add new selection if not already selected,
    // with initial roleId = defaultRoleId
    setSelected((prev) => {
      if (prev.some((h) => h.id === hold.id)) return prev;

      const next = [
        ...prev,
        {
          ...hold,
          roleId: hold.defaultRoleId
        }
      ];

      onSelectionChange?.(next);
      return next;
    });
  }

  // Active climb parsing
  const activeFrames = useMemo(() => {
    if (!activeClimb?.frames) return [];
    return activeClimb.frames.match(/p\d+r\d+/g) ?? [];
  }, [activeClimb]);

  const activeClimbHolds = useMemo(() => {
    return activeFrames
      .map((frame) => {
        const pid = frame.match(/p\d+/)?.[0];
        const rid = frame.match(/r\d+/)?.[0];
        const h = holdMap.get(pid);
        return h ? { ...h, frame, rid } : null;
      })
      .filter(Boolean);
  }, [activeFrames, holdMap]);

  return (
    <div >
      {image && (
        <Stage
          ref={stageRef}
          scaleX={stageScale}
          scaleY={stageScale}
          width={image.width * stageScale}
          height={image.height * stageScale}
          onClick={onStageClick}
        >
          <Layer>
            <KonvaImage image={image} />

            {/* Climb mode (gold) */}
            {displayMode === "climb" &&
              activeClimbHolds.map((h) => {
                const { px, py } = boardToPixel(h.x, h.y);
                return (
                  <Circle
                    key={"climb-" + h.frame}
                    x={px}
                    y={py}
                    radius={26}
                    stroke={getColorByRole(h.rid)}
                    strokeWidth={6}
                    opacity={0.85}
                  />
                );
              })}

            {/* Selected holds (colored by roleId) */}
            {displayMode === "filter" &&
              selected.map((h) => {
                const { px, py } = boardToPixel(h.x, h.y);
                return (
                  <Circle
                    key={"sel-" + h.id}
                    x={px}
                    y={py}
                    radius={radius}
                    stroke={getColorByRoleId(h.roleId)}
                    strokeWidth={strokeWidth}
                    onClick={(e) => handleHoldClick(e, h)}
                    onTap={(e) => handleHoldClick(e, h)}
                  />
                );
              })}
          </Layer>
        </Stage>
      )}
    </div>
  );
}
