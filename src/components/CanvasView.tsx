import { useState, useRef, useCallback, useEffect } from "react";
import type { PlacedPokemon, Arrow } from "../types";
import "./CanvasView.css";

interface Props {
  pokemonList: PlacedPokemon[];
  onUpdatePosition: (uid: string, x: number, y: number) => void;
  onRemovePokemon: (uid: string) => void;
  onDuplicatePokemon: (uid: string) => void;
  arrows: Arrow[];
  onUpdateArrow: (arrow: Arrow) => void;
  onRemoveArrow: (id: string) => void;
  drawingMode: boolean;
  arrowWidth: number;
  arrowColor: string;
  onArrowCreated: (arrow: Arrow) => void;
}

export function CanvasView({
  pokemonList,
  onUpdatePosition,
  onRemovePokemon,
  onDuplicatePokemon,
  arrows,
  onUpdateArrow,
  onRemoveArrow,
  drawingMode,
  arrowWidth,
  arrowColor,
  onArrowCreated,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{
    uid: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [drawingArrow, setDrawingArrow] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [editingArrow, setEditingArrow] = useState<{
    id: string;
    handle: "start" | "end";
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [draggingArrow, setDraggingArrow] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const getCanvasPos = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    []
  );

  // Pokemon dragging
  const handlePokemonMouseDown = useCallback(
    (e: React.MouseEvent, uid: string, pokemonX: number, pokemonY: number) => {
      if (drawingMode) return;
      e.preventDefault();
      e.stopPropagation();
      const pos = getCanvasPos(e);
      setDragging({
        uid,
        offsetX: pos.x - pokemonX,
        offsetY: pos.y - pokemonY,
      });
    },
    [drawingMode, getCanvasPos]
  );

  // Arrow drawing
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!drawingMode) return;
      const pos = getCanvasPos(e);
      setDrawingArrow({
        startX: pos.x,
        startY: pos.y,
        endX: pos.x,
        endY: pos.y,
      });
    },
    [drawingMode, getCanvasPos]
  );

  // Arrow handle dragging
  const handleArrowHandleMouseDown = useCallback(
    (
      e: React.MouseEvent,
      arrowId: string,
      handle: "start" | "end"
    ) => {
      e.preventDefault();
      e.stopPropagation();
      const pos = getCanvasPos(e);
      const arrow = arrows.find((a) => a.id === arrowId);
      if (!arrow) return;
      const handleX = handle === "start" ? arrow.startX : arrow.endX;
      const handleY = handle === "start" ? arrow.startY : arrow.endY;
      setEditingArrow({
        id: arrowId,
        handle,
        offsetX: pos.x - handleX,
        offsetY: pos.y - handleY,
      });
    },
    [arrows, getCanvasPos]
  );

  // Arrow body dragging (move entire arrow)
  const handleArrowBodyMouseDown = useCallback(
    (e: React.MouseEvent, arrowId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const pos = getCanvasPos(e);
      const arrow = arrows.find((a) => a.id === arrowId);
      if (!arrow) return;
      const midX = (arrow.startX + arrow.endX) / 2;
      const midY = (arrow.startY + arrow.endY) / 2;
      setDraggingArrow({
        id: arrowId,
        offsetX: pos.x - midX,
        offsetY: pos.y - midY,
      });
    },
    [arrows, getCanvasPos]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const pos = getCanvasPos(e);

      if (dragging) {
        onUpdatePosition(
          dragging.uid,
          pos.x - dragging.offsetX,
          pos.y - dragging.offsetY
        );
      }

      if (drawingArrow) {
        setDrawingArrow((prev) =>
          prev ? { ...prev, endX: pos.x, endY: pos.y } : null
        );
      }

      if (editingArrow) {
        const arrow = arrows.find((a) => a.id === editingArrow.id);
        if (arrow) {
          const newX = pos.x - editingArrow.offsetX;
          const newY = pos.y - editingArrow.offsetY;
          const updated =
            editingArrow.handle === "start"
              ? { ...arrow, startX: newX, startY: newY }
              : { ...arrow, endX: newX, endY: newY };
          onUpdateArrow(updated);
        }
      }

      if (draggingArrow) {
        const arrow = arrows.find((a) => a.id === draggingArrow.id);
        if (arrow) {
          const midX = (arrow.startX + arrow.endX) / 2;
          const midY = (arrow.startY + arrow.endY) / 2;
          const newMidX = pos.x - draggingArrow.offsetX;
          const newMidY = pos.y - draggingArrow.offsetY;
          const dx = newMidX - midX;
          const dy = newMidY - midY;
          onUpdateArrow({
            ...arrow,
            startX: arrow.startX + dx,
            startY: arrow.startY + dy,
            endX: arrow.endX + dx,
            endY: arrow.endY + dy,
          });
        }
      }
    };

    const handleMouseUp = () => {
      if (dragging) {
        setDragging(null);
      }

      if (drawingArrow) {
        const dx = drawingArrow.endX - drawingArrow.startX;
        const dy = drawingArrow.endY - drawingArrow.startY;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 20) {
          onArrowCreated({
            id: crypto.randomUUID(),
            startX: drawingArrow.startX,
            startY: drawingArrow.startY,
            endX: drawingArrow.endX,
            endY: drawingArrow.endY,
            width: arrowWidth,
            color: arrowColor,
          });
        }
        setDrawingArrow(null);
      }

      if (editingArrow) {
        setEditingArrow(null);
      }

      if (draggingArrow) {
        setDraggingArrow(null);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    dragging,
    drawingArrow,
    editingArrow,
    draggingArrow,
    arrows,
    arrowWidth,
    arrowColor,
    getCanvasPos,
    onUpdatePosition,
    onUpdateArrow,
    onArrowCreated,
  ]);

  const renderArrow = (arrow: Arrow, isPreview = false) => {
    const dx = arrow.endX - arrow.startX;
    const dy = arrow.endY - arrow.startY;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return null;

    const headLen = Math.min(arrow.width * 4, len * 0.4);
    const angle = Math.atan2(dy, dx);

    // Arrow shaft end (where the head starts)
    const shaftEndX = arrow.endX - Math.cos(angle) * headLen;
    const shaftEndY = arrow.endY - Math.sin(angle) * headLen;

    // Arrow head points
    const headWidth = arrow.width * 2.5;
    const leftX =
      shaftEndX + Math.cos(angle + Math.PI / 2) * headWidth;
    const leftY =
      shaftEndY + Math.sin(angle + Math.PI / 2) * headWidth;
    const rightX =
      shaftEndX + Math.cos(angle - Math.PI / 2) * headWidth;
    const rightY =
      shaftEndY + Math.sin(angle - Math.PI / 2) * headWidth;

    return (
      <g key={isPreview ? "preview" : arrow.id}>
        <line
          x1={arrow.startX}
          y1={arrow.startY}
          x2={shaftEndX}
          y2={shaftEndY}
          stroke={arrow.color}
          strokeWidth={arrow.width}
          strokeLinecap="round"
        />
        <polygon
          points={`${arrow.endX},${arrow.endY} ${leftX},${leftY} ${rightX},${rightY}`}
          fill={arrow.color}
        />
        {!isPreview && (
          <>
            {/* Invisible thick line for drag-and-drop of entire arrow */}
            <line
              x1={arrow.startX}
              y1={arrow.startY}
              x2={arrow.endX}
              y2={arrow.endY}
              stroke="transparent"
              strokeWidth={Math.max(arrow.width * 3, 12)}
              className="arrow-body-handle"
              onMouseDown={(e) => handleArrowBodyMouseDown(e, arrow.id)}
            />
            <circle
              cx={arrow.startX}
              cy={arrow.startY}
              r={8}
              fill="transparent"
              stroke="transparent"
              className="arrow-handle"
              onMouseDown={(e) =>
                handleArrowHandleMouseDown(e, arrow.id, "start")
              }
            />
            <circle
              cx={arrow.endX}
              cy={arrow.endY}
              r={8}
              fill="transparent"
              stroke="transparent"
              className="arrow-handle"
              onMouseDown={(e) =>
                handleArrowHandleMouseDown(e, arrow.id, "end")
              }
            />
          </>
        )}
      </g>
    );
  };

  return (
    <div
      ref={canvasRef}
      className={`canvas-view ${drawingMode ? "drawing-mode" : ""}`}
      onMouseDown={handleCanvasMouseDown}
    >
      <svg className="arrow-layer">
        {arrows.map((arrow) => renderArrow(arrow))}
        {drawingArrow &&
          renderArrow(
            {
              id: "preview",
              ...drawingArrow,
              width: arrowWidth,
              color: arrowColor,
            },
            true
          )}
      </svg>

      {pokemonList.map((placed) => (
        <div
          key={placed.uid}
          className={`placed-pokemon ${dragging?.uid === placed.uid ? "dragging" : ""}`}
          style={{
            left: placed.x,
            top: placed.y,
            transform: "translate(-50%, -50%)",
          }}
          onMouseDown={(e) =>
            handlePokemonMouseDown(e, placed.uid, placed.x, placed.y)
          }
        >
          <img
            src={placed.pokemon.sprite}
            alt={placed.pokemon.nameJa || placed.pokemon.name}
            draggable={false}
          />
          <span className="pokemon-label">
            {placed.pokemon.nameJa || placed.pokemon.name}
          </span>
          <button
            className="duplicate-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicatePokemon(placed.uid);
            }}
            title="コピー"
          >
            +
          </button>
          <button
            className="remove-btn"
            onClick={(e) => {
              e.stopPropagation();
              onRemovePokemon(placed.uid);
            }}
            title="削除"
          >
            ×
          </button>
        </div>
      ))}

      {/* Arrow delete buttons */}
      {arrows.map((arrow) => (
        <button
          key={`del-${arrow.id}`}
          className="arrow-delete-btn"
          style={{
            left: (arrow.startX + arrow.endX) / 2,
            top: (arrow.startY + arrow.endY) / 2,
          }}
          onClick={() => onRemoveArrow(arrow.id)}
          title="矢印を削除"
        >
          ×
        </button>
      ))}
    </div>
  );
}
