import { useState, useEffect, useRef } from "react";
import type { Pokemon } from "../types";
import { pokemonJaNames } from "../data/pokemonJaNames";

interface PokeApiPokemon {
  name: string;
  url: string;
}

interface PokemonEntry {
  name: string;
  id: number;
  nameJa: string;
}

let allPokemonCache: PokemonEntry[] = [];

async function fetchAllPokemon(): Promise<PokemonEntry[]> {
  if (allPokemonCache.length > 0) return allPokemonCache;
  const res = await fetch(
    "https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0"
  );
  const data = await res.json();
  allPokemonCache = data.results.map((p: PokeApiPokemon, i: number) => ({
    name: p.name,
    id: i + 1,
    nameJa: pokemonJaNames[i + 1] ?? "",
  }));
  return allPokemonCache;
}

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

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const allPokemon = await fetchAllPokemon();
        if (controller.signal.aborted) return;

        const q = query.trim();
        const qLower = q.toLowerCase();
        const japanese = isJapanese(q);

        let matched: PokemonEntry[];

        if (japanese) {
          matched = allPokemon
            .filter((p) => p.nameJa.includes(q))
            .slice(0, 20);
        } else {
          const engMatched = allPokemon.filter((p) =>
            p.name.includes(qLower)
          );
          const jaMatched = allPokemon.filter(
            (p) =>
              p.nameJa &&
              p.nameJa.toLowerCase().includes(qLower) &&
              !engMatched.some((e) => e.id === p.id)
          );
          matched = [...engMatched, ...jaMatched].slice(0, 20);
        }

        if (controller.signal.aborted) return;

        const pokemonResults: Pokemon[] = matched.map((p) => ({
          id: p.id,
          name: p.name,
          nameJa: p.nameJa,
          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`,
        }));

        setResults(pokemonResults);
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  return { query, setQuery, results, loading };
}
