export interface Pokemon {
  id: number;
  name: string;
  nameJa: string;
  sprite: string;
}

export interface PlacedPokemon {
  uid: string;
  pokemon: Pokemon;
  x: number;
  y: number;
}

export interface Arrow {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width: number;
  color: string;
}
