import { useState, useEffect, useRef } from "react";
import type { Pokemon } from "../types";

interface PokeApiPokemon {
  name: string;
  url: string;
}

interface PokeApiSpecies {
  names: { language: { name: string }; name: string }[];
}

interface PokemonEntry {
  name: string;
  id: number;
  nameJa: string;
}

let allPokemonCache: PokemonEntry[] = [];
let jaNamesFetched = false;
let jaNamesFetchPromise: Promise<void> | null = null;

async function fetchAllPokemon(): Promise<PokemonEntry[]> {
  if (allPokemonCache.length > 0) return allPokemonCache;
  const res = await fetch(
    "https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0"
  );
  const data = await res.json();
  allPokemonCache = data.results.map((p: PokeApiPokemon, i: number) => ({
    name: p.name,
    id: i + 1,
    nameJa: "",
  }));
  return allPokemonCache;
}

async function fetchJapaneseNames(): Promise<void> {
  if (jaNamesFetched) return;
  if (jaNamesFetchPromise) return jaNamesFetchPromise;

  jaNamesFetchPromise = (async () => {
    const allPokemon = await fetchAllPokemon();
    const batchSize = 30;

    for (let i = 0; i < allPokemon.length; i += batchSize) {
      const batch = allPokemon.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (p) => {
          if (p.nameJa) return;
          try {
            const res = await fetch(
              `https://pokeapi.co/api/v2/pokemon-species/${p.id}`
            );
            const data: PokeApiSpecies = await res.json();
            const ja = data.names.find((n) => n.language.name === "ja-Hrkt");
            p.nameJa = ja?.name ?? "";
          } catch {
            // skip
          }
        })
      );
    }
    jaNamesFetched = true;
  })();

  return jaNamesFetchPromise;
}

// Start pre-fetching Japanese names immediately on module load
fetchAllPokemon().then(() => fetchJapaneseNames());

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
        const q = query.trim();
        const qLower = q.toLowerCase();
        const japanese = isJapanese(q);

        // If Japanese query, wait for Japanese names to be available
        if (japanese) {
          await fetchJapaneseNames();
        }

        if (controller.signal.aborted) return;

        let matched: PokemonEntry[];

        if (japanese) {
          matched = allPokemon
            .filter((p) => p.nameJa.includes(q))
            .slice(0, 20);
        } else {
          // English name search + any cached Japanese name matches
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

        // Fetch any missing Japanese names for results
        await Promise.all(
          matched.map(async (p) => {
            if (p.nameJa) return;
            try {
              const res = await fetch(
                `https://pokeapi.co/api/v2/pokemon-species/${p.id}`
              );
              const data: PokeApiSpecies = await res.json();
              const ja = data.names.find((n) => n.language.name === "ja-Hrkt");
              p.nameJa = ja?.name ?? "";
            } catch {
              // skip
            }
          })
        );

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
