import * as THREE from 'three';

/**
 * Erzeugt eine Environment-Map für Reflexionen auf nassen und glatten Flächen.
 * Statt eines HDR-Bildes wird eine kleine Szene aus leuchtenden Flächen
 * (Neon-Magenta, Cyan, Natriumorange, dunkler Himmel) per PMREM gefiltert.
 * Ergebnis: glaubwürdige Neon-Spiegelungen in Pfütze, Schreibtisch und Straße.
 */
export function buildNeonEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03040a);

  const panel = (color: THREE.ColorRepresentation, intensity: number, w: number, h: number, pos: THREE.Vector3) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    m.position.copy(pos);
    m.lookAt(0, 0, 0);
    scene.add(m);
  };

  // Richtung -Z ist "draußen": Koi-Magenta und Cyan-Schilder
  panel(0xff2aa8, 5, 6, 4, new THREE.Vector3(-2, 2, -10));
  panel(0x30e8ff, 4, 4, 1.5, new THREE.Vector3(5, 0.5, -9));
  panel(0xff8a2a, 3, 12, 1.5, new THREE.Vector3(0, -6, -8));
  panel(0x7d4dff, 1.5, 8, 3, new THREE.Vector3(-8, 4, -4));
  // Warme Innenlichter oben, schwacher Fülllicht-Ring
  panel(0xffc890, 2.5, 2, 2, new THREE.Vector3(0, 9, 2));
  panel(0x1a2030, 1, 30, 6, new THREE.Vector3(0, 0, 10));

  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(scene, 0.035);
  pmrem.dispose();
  scene.traverse((o) => {
    const me = o as THREE.Mesh;
    me.geometry?.dispose();
    (me.material as THREE.Material | undefined)?.dispose();
  });
  return rt.texture;
}
