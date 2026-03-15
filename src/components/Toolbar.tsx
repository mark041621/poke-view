import "./Toolbar.css";

interface Props {
  drawingMode: boolean;
  onToggleDrawingMode: () => void;
  arrowWidth: number;
  onArrowWidthChange: (width: number) => void;
  arrowColor: string;
  onArrowColorChange: (color: string) => void;
}

export function Toolbar({
  drawingMode,
  onToggleDrawingMode,
  arrowWidth,
  onArrowWidthChange,
  arrowColor,
  onArrowColorChange,
}: Props) {
  return (
    <div className="toolbar">
      <button
        className={`toolbar-btn ${drawingMode ? "active" : ""}`}
        onClick={onToggleDrawingMode}
        title={drawingMode ? "選択モードに切替" : "矢印描画モードに切替"}
      >
        {drawingMode ? "選択モード" : "矢印を描く"}
      </button>

      {drawingMode && (
        <div className="arrow-settings">
          <label className="toolbar-label">
            幅
            <input
              type="range"
              min="1"
              max="10"
              value={arrowWidth}
              onChange={(e) => onArrowWidthChange(Number(e.target.value))}
              className="toolbar-range"
            />
            <span className="toolbar-value">{arrowWidth}px</span>
          </label>

          <label className="toolbar-label">
            色
            <input
              type="color"
              value={arrowColor}
              onChange={(e) => onArrowColorChange(e.target.value)}
              className="toolbar-color"
            />
          </label>
        </div>
      )}
    </div>
  );
}
