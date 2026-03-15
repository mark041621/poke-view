import { usePokemonSearch } from "../hooks/usePokemonSearch";
import type { Pokemon } from "../types";
import "./PokemonSearch.css";

interface Props {
  onSelect: (pokemon: Pokemon) => void;
}

export function PokemonSearch({ onSelect }: Props) {
  const { query, setQuery, results, loading } = usePokemonSearch();

  return (
    <div className="pokemon-search">
      <input
        type="text"
        className="search-input"
        placeholder="ポケモンを検索..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && <div className="search-loading">検索中...</div>}
      {results.length > 0 && (
        <ul className="search-results">
          {results.map((pokemon) => (
            <li
              key={pokemon.id}
              className="search-result-item"
              onClick={() => {
                onSelect(pokemon);
                setQuery("");
              }}
            >
              <img
                src={pokemon.sprite}
                alt={pokemon.nameJa || pokemon.name}
                className="search-result-sprite"
              />
              <span className="search-result-name">
                {pokemon.nameJa || pokemon.name}
              </span>
              <span className="search-result-id">#{pokemon.id}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
