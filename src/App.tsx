import { useState, useCallback } from "react";
import { PokemonSearch } from "./components/PokemonSearch";
import { CanvasView } from "./components/CanvasView";
import { Toolbar } from "./components/Toolbar";
import type { Pokemon, PlacedPokemon, Arrow } from "./types";
import "./App.css";

function App() {
  const [pokemonList, setPokemonList] = useState<PlacedPokemon[]>([]);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [drawingMode, setDrawingMode] = useState(false);
  const [arrowWidth, setArrowWidth] = useState(3);
  const [arrowColor, setArrowColor] = useState("#e74c3c");

  const handleSelectPokemon = useCallback((pokemon: Pokemon) => {
    const placed: PlacedPokemon = {
      uid: crypto.randomUUID(),
      pokemon,
      x: 200 + Math.random() * 400,
      y: 150 + Math.random() * 300,
    };
    setPokemonList((prev) => [...prev, placed]);
  }, []);

  const handleUpdatePosition = useCallback(
    (uid: string, x: number, y: number) => {
      setPokemonList((prev) =>
        prev.map((p) => (p.uid === uid ? { ...p, x, y } : p))
      );
    },
    []
  );

  const handleRemovePokemon = useCallback((uid: string) => {
    setPokemonList((prev) => prev.filter((p) => p.uid !== uid));
  }, []);

  const handleDuplicatePokemon = useCallback((uid: string) => {
    setPokemonList((prev) => {
      const source = prev.find((p) => p.uid === uid);
      if (!source) return prev;
      const duplicate: PlacedPokemon = {
        uid: crypto.randomUUID(),
        pokemon: source.pokemon,
        x: source.x + 60,
        y: source.y + 60,
      };
      return [...prev, duplicate];
    });
  }, []);

  const handleArrowCreated = useCallback((arrow: Arrow) => {
    setArrows((prev) => [...prev, arrow]);
  }, []);

  const handleUpdateArrow = useCallback((arrow: Arrow) => {
    setArrows((prev) => prev.map((a) => (a.id === arrow.id ? arrow : a)));
  }, []);

  const handleRemoveArrow = useCallback((id: string) => {
    setArrows((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Poke View</h1>
        <p className="app-subtitle">ランクバトル環境 パーティービューワー</p>
      </header>

      <div className="app-controls">
        <PokemonSearch onSelect={handleSelectPokemon} />
        <Toolbar
          drawingMode={drawingMode}
          onToggleDrawingMode={() => setDrawingMode((prev) => !prev)}
          arrowWidth={arrowWidth}
          onArrowWidthChange={setArrowWidth}
          arrowColor={arrowColor}
          onArrowColorChange={setArrowColor}
        />
      </div>

      <CanvasView
        pokemonList={pokemonList}
        onUpdatePosition={handleUpdatePosition}
        onRemovePokemon={handleRemovePokemon}
        onDuplicatePokemon={handleDuplicatePokemon}
        arrows={arrows}
        onUpdateArrow={handleUpdateArrow}
        onRemoveArrow={handleRemoveArrow}
        drawingMode={drawingMode}
        arrowWidth={arrowWidth}
        arrowColor={arrowColor}
        onArrowCreated={handleArrowCreated}
      />
    </div>
  );
}

export default App;
