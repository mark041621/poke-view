import { useState, useEffect, useRef } from "react";
import type { Pokemon } from "../types";

interface PokeApiPokemon {
  name: string;
  url: string;
}

interface PokeApiSpecies {
  names: { language: { name: string }; name: string }[];
}

let allPokemonCache: { name: string; id: number }[] = [];

async function fetchAllPokemon(): Promise<{ name: string; id: number }[]> {
  if (allPokemonCache.length > 0) return allPokemonCache;
  const res = await fetch(
    "https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0"
  );
  const data = await res.json();
  allPokemonCache = data.results.map((p: PokeApiPokemon, i: number) => ({
    name: p.name,
    id: i + 1,
  }));
  return allPokemonCache;
}

const jaNameCache = new Map<number, string>();

async function fetchJapaneseName(id: number): Promise<string> {
  if (jaNameCache.has(id)) return jaNameCache.get(id)!;
  try {
    const res = await fetch(
      `https://pokeapi.co/api/v2/pokemon-species/${id}`
    );
    const data: PokeApiSpecies = await res.json();
    const ja = data.names.find((n) => n.language.name === "ja-Hrkt");
    const name = ja?.name ?? "";
    jaNameCache.set(id, name);
    return name;
  } catch {
    return "";
  }
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
        const q = query.toLowerCase().trim();

        // Filter by English name
        const matched = allPokemon
          .filter((p) => p.name.includes(q))
          .slice(0, 20);

        // Also try Japanese name search
        const jaMatched: { name: string; id: number }[] = [];
        for (const p of allPokemon) {
          if (controller.signal.aborted) return;
          const jaName = jaNameCache.get(p.id);
          if (jaName && jaName.includes(q)) {
            jaMatched.push(p);
          }
        }

        const combined = [
          ...matched,
          ...jaMatched.filter((j) => !matched.some((m) => m.id === j.id)),
        ].slice(0, 20);

        if (controller.signal.aborted) return;

        // Fetch Japanese names for results
        const pokemonResults: Pokemon[] = await Promise.all(
          combined.map(async (p) => {
            const jaName = await fetchJapaneseName(p.id);
            return {
              id: p.id,
              name: p.name,
              nameJa: jaName,
              sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`,
            };
          })
        );

        if (!controller.signal.aborted) {
          setResults(pokemonResults);
        }
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
