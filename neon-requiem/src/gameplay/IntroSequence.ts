import * as THREE from 'three';
import intro from '../data/intro.json';
import { loc, type LocText } from '../core/i18n';
import { events } from '../core/Events';
import { gameState } from './GameState';
import type { Subtitles } from '../ui/Subtitles';
import type { CameraRig } from '../systems/CameraRig';
import type { OfficeScene } from '../scenes/OfficeScene';
import type { SoundBank } from '../systems/audio/SoundBank';
import type { Music } from '../systems/audio/Music';

/**
 * Eröffnung des Prologs (datengetrieben aus intro.json):
 * Titelkarte „02:47“ → Kamerafahrt vom Fenster zu Kai → Monolog → freies Umsehen.
 * Nach genug untersuchten Objekten (oder Zeit) hämmert jemand an die Tür.
 */
interface TimedLine { at: number; speaker: string; text: LocText }

export class IntroSequence {
  private t = 0;
  private next = 0;
  private knocked = false;
  private knockLines: Array<{ at: number; speaker: string; text: LocText }> = [];
  private knockT = 0;
  private card: HTMLElement;
  running = false;
  /** Erlaubt dem Spieler die Steuerung (nach der Kamerafahrt). */
  onControl?: () => void;
  private controlGiven = false;

  constructor(
    uiRoot: HTMLElement,
    private subs: Subtitles,
    private rig: CameraRig,
    private office: OfficeScene,
    private sound: SoundBank,
    private music: Music,
  ) {
    this.card = document.createElement('div');
    this.card.className = 'title-card';
    uiRoot.appendChild(this.card);
  }

  start(): void {
    this.t = 0;
    this.next = 0;
    this.knocked = false;
    this.knockLines = [];
    this.controlGiven = false;
    this.running = true;
    const c = intro.card;
    this.card.innerHTML = `<div class="tc-place">${loc(c.place)}</div><div class="tc-time">${c.time}</div><div class="tc-sub">${loc(c.sub)}</div>`;
    this.card.classList.remove('show');
    void this.card.offsetWidth;
    this.card.classList.add('show');
    // Start: Blick nah an der Scheibe aufs Koi, dann zurück zu Kai
    this.rig.setCinematic(new THREE.Vector3(0.6, 1.75, -2.4), new THREE.Vector3(-0.5, 2.6, -15));
    this.music.setLayer('explore', 6);
    events.emit('objective', { text: '' });
  }

  /** Wird vom Interaktionssystem bei jedem Untersuchen aufgerufen. */
  examined(): void {
    if (!this.knocked && gameState.data.examined.length >= intro.knock.afterExamined) this.knockT = Math.min(this.knockT, this.t + 4);
  }

  private triggerKnock(): void {
    this.knocked = true;
    gameState.setFlag('knocked');
    this.sound.knock();
    this.office.shakeDoor(1.2);
    setTimeout(() => this.office.shakeDoor(1.2), 1600);
    this.rig.addShake(0.6);
    this.music.setLayer('tension', 2);
    this.office.lightning.strike(1);
    this.subs.clear();
    this.knockLines = intro.knock.lines.map((l) => ({ at: this.t + l.delay, speaker: l.speaker, text: l.text }));
    setTimeout(() => {
      // Drittes, härteres Hämmern
      this.sound.knock([0, 0.25, 0.5, 0.75]);
      this.office.shakeDoor(1.5);
      this.rig.addShake(0.8);
    }, 5200);
    events.emit('objective', { text: loc(intro.objectives.door) });
  }

  update(dt: number): void {
    if (!this.running) return;
    this.t += dt;

    // Kamerafahrt beenden → Steuerung übergeben
    if (!this.controlGiven && this.t > 4.2) {
      this.controlGiven = true;
      this.rig.setCinematic(null);
      this.onControl?.();
      events.emit('objective', { text: loc(intro.objectives.look) });
      this.knockT = intro.knock.fallbackAt;
    }

    const lines = intro.monologue as TimedLine[];
    while (this.next < lines.length && this.t >= lines[this.next].at) {
      const l = lines[this.next++];
      this.subs.push(l.speaker, loc(l.text));
    }

    if (!this.knocked && this.controlGiven && this.t >= this.knockT && !this.subs.busy) this.triggerKnock();

    while (this.knockLines.length && this.t >= this.knockLines[0].at) {
      const l = this.knockLines.shift()!;
      this.subs.push(l.speaker, loc(l.text));
    }
  }
}
