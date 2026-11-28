/**
 * Zentraler Spielzustand (Flags, Werte, Ziel). Bewusst als reine Daten gehalten,
 * damit das Speichersystem in M2 ihn direkt serialisieren kann.
 */
export interface GameStateData {
  flags: Record<string, boolean>;
  examined: string[];
  health: number;
  stress: number;
  implant: number;
  objective: string;
  scene: string;
  playTime: number;
}

export function freshState(): GameStateData {
  return {
    flags: {},
    examined: [],
    health: 100,
    stress: 18,
    implant: 100,
    objective: '',
    scene: 'office',
    playTime: 0,
  };
}

export class GameState {
  data: GameStateData = freshState();

  reset(): void {
    this.data = freshState();
  }

  flag(name: string): boolean {
    return !!this.data.flags[name];
  }

  setFlag(name: string, v = true): void {
    this.data.flags[name] = v;
  }

  markExamined(id: string): boolean {
    if (this.data.examined.includes(id)) return false;
    this.data.examined.push(id);
    return true;
  }
}

export const gameState = new GameState();
