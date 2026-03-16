import { useState, useEffect, useRef } from "react";
import type { Pokemon } from "../types";
import { allPokemonData } from "../data/pokemonData";

function isJapanese(text: string): boolean {
  return /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(text);
}

export function usePokemonSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timeoutId = setTimeout(() => {
      setLoading(true);

      const q = query.trim();
      const qLower = q.toLowerCase();
      const japanese = isJapanese(q);

      const matched = allPokemonData
        .filter((p) => {
          if (japanese) {
            return p.nameJa.includes(q) || p.formNameJa.includes(q);
          }
          return (
            p.name.includes(qLower) ||
            p.formName.toLowerCase().includes(qLower)
          );
        })
        .slice(0, 20);

      const pokemonResults: Pokemon[] = matched.map((p) => ({
        id: p.pokemonId,
        name: p.name,
        nameJa: p.nameJa,
        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.pokemonId}.png`,
      }));

      if (!controller.signal.aborted) {
        setResults(pokemonResults);
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  return { query, setQuery, results, loading };
}
