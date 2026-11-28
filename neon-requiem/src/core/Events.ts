/** Minimaler, typisierter Event-Bus für lose Kopplung zwischen Systemen und UI. */
type Handler<T> = (payload: T) => void;

export interface GameEvents {
  'settings:changed': void;
  'preset:changed': void;
  'subtitle': { speaker: string; text: string; duration: number };
  'objective': { text: string };
  'prompt': { text: string | null };
  'knock': void;
  'lightning': { strength: number };
  'scan': { active: boolean };
}

class EventBus {
  private map = new Map<string, Set<Handler<unknown>>>();

  on<K extends keyof GameEvents>(type: K, fn: Handler<GameEvents[K]>): () => void {
    if (!this.map.has(type)) this.map.set(type, new Set());
    this.map.get(type)!.add(fn as Handler<unknown>);
    return () => this.map.get(type)?.delete(fn as Handler<unknown>);
  }

  emit<K extends keyof GameEvents>(type: K, ...payload: GameEvents[K] extends void ? [] : [GameEvents[K]]): void {
    this.map.get(type)?.forEach((fn) => fn(payload[0]));
  }
}

export const events = new EventBus();
