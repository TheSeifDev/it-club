import {
  BufferGeometry, Color, Float32BufferAttribute, Group, LineLoop,
  LineBasicMaterial, PerspectiveCamera, Points, Scene, ShaderMaterial,
  Vector3, WebGLRenderer,
} from "three";

export type CommunityOrbHandle = {
  setPointer(x: number, y: number): void;
  setVisible(visible: boolean): void;
  resize(): void;
  dispose(): void;
};

/** Procedural artwork: no image/video download, lights, textures or postprocessing. */
export function createCommunityOrb(
  host: HTMLElement,
  onFailure: () => void,
): CommunityOrbHandle | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  const camera = new PerspectiveCamera(42, 1, 0.1, 40);
  camera.position.z = 6.6;
  const orb = new Group();
  scene.add(orb);
  const geometries: BufferGeometry[] = [];
  const materials: Array<ShaderMaterial | LineBasicMaterial> = [];
  const positions: number[] = [];
  const seeds: number[] = [];
  const count = 3400;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let index = 0; index < count; index++) {
    const y = 1 - (index / (count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const angle = goldenAngle * index;
    positions.push(Math.cos(angle) * radius * 1.57, y * 1.57, Math.sin(angle) * radius * 1.57);
    seeds.push((index * 0.61803398875) % 1);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new Float32BufferAttribute(seeds, 1));
  geometries.push(geometry);
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uDpr: { value: 1 }, uColor: { value: new Color("#52e8d1") } },
    vertexShader: `
      attribute float aSeed;
      uniform float uTime;
      uniform float uDpr;
      varying float vLight;
      void main() {
        vec3 p = position * (1.0 + 0.012 * sin(uTime * 0.65 + position.y * 3.0));
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        vLight = 0.28 + 0.72 * smoothstep(-1.5, 1.5, (modelMatrix * vec4(p, 1.0)).z);
        vLight *= 0.76 + 0.24 * sin(uTime * 0.8 + aSeed * 6.283);
        gl_Position = projectionMatrix * view;
        gl_PointSize = uDpr * (2.4 + aSeed * 1.35) * (5.0 / -view.z);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vLight;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float mask = 1.0 - smoothstep(0.24, 0.5, length(uv));
        gl_FragColor = vec4(mix(uColor, vec3(0.85, 1.0, 0.97), vLight * 0.24), mask * vLight);
      }
    `,
  });
  materials.push(material);
  orb.add(new Points(geometry, material));

  for (let ring = 0; ring < 2; ring++) {
    const radius = ring === 0 ? 2.04 : 2.23;
    const points = Array.from({ length: 180 }, (_, index) => {
      const angle = (index / 180) * Math.PI * 2;
      return new Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    });
    const ringGeometry = new BufferGeometry().setFromPoints(points);
    const ringMaterial = new LineBasicMaterial({ color: "#52e8d1", transparent: true, opacity: ring === 0 ? 0.19 : 0.09 });
    const orbit = new LineLoop(ringGeometry, ringMaterial);
    orbit.rotation.x = ring === 0 ? 1.12 : -0.72;
    orbit.rotation.y = ring === 0 ? 0.32 : 0.8;
    geometries.push(ringGeometry);
    materials.push(ringMaterial);
    orb.add(orbit);
  }
  host.appendChild(renderer.domElement);
  let disposed = false;
  let visible = false;
  let frame = 0;
  let last = 0;
  let elapsed = 0;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  const resize = () => {
    if (disposed) return;
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, width < 520 ? 1.25 : 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    material.uniforms.uDpr.value = dpr;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };
  const tick = (now: number) => {
    frame = 0;
    if (disposed || !visible) return;
    const delta = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    elapsed += delta;
    const blend = 1 - Math.exp(-delta * 5);
    currentX += (targetX - currentX) * blend;
    currentY += (targetY - currentY) * blend;
    orb.rotation.y = elapsed * 0.065 + currentX * 0.26;
    orb.rotation.x = -0.15 + currentY * 0.18;
    orb.rotation.z = Math.sin(elapsed * 0.14) * 0.06;
    material.uniforms.uTime.value = elapsed;
    renderer.render(scene, camera);
    frame = window.requestAnimationFrame(tick);
  };
  const setVisible = (next: boolean) => {
    visible = next;
    if (!visible && frame) window.cancelAnimationFrame(frame);
    if (!visible) { frame = 0; last = 0; }
    if (visible && !disposed && !frame) frame = window.requestAnimationFrame(tick);
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    setVisible(false);
    renderer.domElement.removeEventListener("webglcontextlost", lost);
    geometries.forEach((item) => item.dispose());
    materials.forEach((item) => item.dispose());
    scene.clear();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
  const lost = (event: Event) => {
    event.preventDefault();
    dispose();
    onFailure();
  };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  resize();
  return {
    setPointer(x, y) {
      targetX = Math.max(-1, Math.min(1, x));
      targetY = Math.max(-1, Math.min(1, y));
    },
    setVisible, resize, dispose,
  };
}
