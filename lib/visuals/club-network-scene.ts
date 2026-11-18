import type {
  BufferGeometry,
  Group,
  LineBasicMaterial,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PointsMaterial,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { CLUB_NETWORK_COLORS, type ClubNetworkState } from "./club-network-config";

export type ClubNetworkHandle = {
  setState(state: ClubNetworkState): void;
  setVisible(visible: boolean): void;
  resize(): void;
  dispose(): void;
};

type ClubNetworkCallbacks = {
  onReady(): void;
  onFailure(): void;
};

const MAX_DPR = 1.5;
const MOBILE_DPR = 1.25;
const clamp01 = (value: number) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);
const smooth = (value: number) => value * value * (3 - 2 * value);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * A blue holographic network rather than a wireframe globe: a physically shaded
 * faceted core is surrounded by emissive orbit planes, depth-layered nodes, and
 * fine links that converge on the core.
 */
export async function createClubNetwork(
  host: HTMLElement,
  callbacks: ClubNetworkCallbacks,
): Promise<ClubNetworkHandle | null> {
  let disposed = false;
  let failureNotified = false;
  let visible = true;
  let ready = false;
  let frame: number | null = null;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let lastTime = 0;
  let state: ClubNetworkState = { progress: 0 };

  let canvas: HTMLCanvasElement | null = null;
  let renderer: WebGLRenderer | null = null;
  let scene: Scene | null = null;
  let camera: PerspectiveCamera | null = null;
  let network: Group | null = null;
  let core: Mesh | null = null;
  let coreShell: Mesh | null = null;
  let coreMaterial: MeshPhysicalMaterial | null = null;
  let shellMaterial: MeshBasicMaterial | null = null;
  let starMaterial: PointsMaterial | null = null;
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const revealMaterials: Array<Material & { opacity: number }> = [];
  const nodeMaterials: Array<Material & { opacity: number }> = [];
  const lineMaterials: LineBasicMaterial[] = [];

  const onContextLost = (event: Event) => {
    event.preventDefault();
    fail();
  };

  const cancelFrame = () => {
    if (frame === null) return;
    window.cancelAnimationFrame(frame);
    frame = null;
  };

  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    cancelFrame();
    canvas?.removeEventListener("webglcontextlost", onContextLost);
    scene?.clear();
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    if (renderer) {
      try {
        renderer.dispose();
        renderer.forceContextLoss();
      } catch {
        // A browser that already lost its context can still release other resources.
      }
    }
    canvas?.remove();
    canvas = null;
    renderer = null;
    scene = null;
    camera = null;
    network = null;
    core = null;
    coreShell = null;
    coreMaterial = null;
    shellMaterial = null;
    starMaterial = null;
    revealMaterials.length = 0;
    nodeMaterials.length = 0;
    lineMaterials.length = 0;
  };

  function fail() {
    if (!failureNotified) {
      failureNotified = true;
      try {
        callbacks.onFailure();
      } catch {
        // Rendering failure must never turn into a React error.
      }
    }
    cleanup();
  }

  const applyState = () => {
    if (!network || !core || !coreShell || !coreMaterial || !shellMaterial || !starMaterial) return;
    const progress = smooth(clamp01(state.progress));
    const depth = progress * 0.9;
    network.position.z = depth * 0.2;
    network.rotation.y = -0.48 + progress * 1.65;
    network.rotation.x = 0.12 + progress * 0.28;
    network.rotation.z = progress * -0.1;
    core.scale.setScalar(lerp(0.76, 1, progress));
    coreShell.scale.setScalar(lerp(0.84, 1.05, progress));
    coreMaterial.opacity = lerp(0.48, 0.98, progress);
    shellMaterial.opacity = lerp(0.04, 0.14, progress);
    starMaterial.opacity = lerp(0.24, 0.62, progress);
    revealMaterials.forEach((material) => {
      material.opacity = Math.max(0.001, material.opacity * 0 + lerp(0.16, 1, progress));
    });
    nodeMaterials.forEach((material) => {
      material.opacity = lerp(0.22, 0.98, progress);
    });
  };

  const resizeNow = () => {
    if (disposed || !renderer || !camera || !canvas) return;
    const rect = host.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(rect.width));
    const nextHeight = Math.max(1, Math.round(rect.height));
    const mobile = nextWidth < 560;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const qualityCap = typeof memory === "number" && memory <= 4 ? 1 : mobile ? MOBILE_DPR : MAX_DPR;
    const nextRatio = Math.min(qualityCap, Math.max(1, window.devicePixelRatio || 1));
    if (nextWidth === width && nextHeight === height && nextRatio === pixelRatio) return;
    width = nextWidth;
    height = nextHeight;
    pixelRatio = nextRatio;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    canvas.dataset.dpr = String(pixelRatio);
  };

  const render = (now: number) => {
    frame = null;
    if (disposed || !visible || document.hidden || !renderer || !scene || !camera || !network) return;
    const delta = Math.min(0.05, Math.max(0, (now - lastTime) / 1000 || 0));
    lastTime = now;
    network.rotation.y += delta * 0.12;
    network.rotation.x += delta * 0.018;
    try {
      renderer.render(scene, camera);
      if (!ready) {
        ready = true;
        callbacks.onReady();
      }
      canvas!.dataset.progress = state.progress.toFixed(3);
    } catch {
      fail();
      return;
    }
    queue();
  };

  const queue = () => {
    if (disposed || !visible || document.hidden || frame !== null) return;
    frame = window.requestAnimationFrame(render);
  };

  try {
    const THREE = await import("three");
    if (disposed) return null;

    canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.dataset.progress = "0";
    canvas.addEventListener("webglcontextlost", onContextLost, { passive: false });
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
      premultipliedAlpha: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
    camera.position.set(0, 0.08, 7.15);
    camera.lookAt(0, 0, 0);

    const ambient = new THREE.AmbientLight(0x205078, 0.5);
    const hemisphere = new THREE.HemisphereLight(0xdff7ff, 0x06101f, 1.15);
    const key = new THREE.DirectionalLight(0xe8f8ff, 2.6);
    key.position.set(-3.5, 4.4, 5.5);
    const rim = new THREE.PointLight(0x168dff, 8, 14, 2);
    rim.position.set(3.2, -1.4, 2.5);
    scene.add(ambient, hemisphere, key, rim);

    const smallViewport = host.getBoundingClientRect().width < 560;
    const starCount = smallViewport ? 110 : 190;
    const starPositions = new Float32Array(starCount * 3);
    let seed = 1701;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let index = 0; index < starCount; index += 1) {
      const angle = random() * Math.PI * 2;
      const radius = 3.2 + random() * 4.8;
      starPositions[index * 3] = Math.cos(angle) * radius;
      starPositions[index * 3 + 1] = (random() - 0.5) * 5.2;
      starPositions[index * 3 + 2] = -1.5 - random() * 4.5;
    }
    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
    starMaterial = new THREE.PointsMaterial({
      color: 0x83cfff,
      size: smallViewport ? 0.025 : 0.032,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    geometries.push(starsGeometry);
    materials.push(starMaterial);
    scene.add(new THREE.Points(starsGeometry, starMaterial));

    network = new THREE.Group();
    scene.add(network);

    const coreGeometry = new THREE.IcosahedronGeometry(1.08, smallViewport ? 2 : 3);
    const shellGeometry = new THREE.SphereGeometry(1.18, smallViewport ? 32 : 48, smallViewport ? 24 : 36);
    const innerGeometry = new THREE.SphereGeometry(0.82, smallViewport ? 24 : 36, smallViewport ? 18 : 26);
    const edgeGeometry = new THREE.EdgesGeometry(coreGeometry, 22);
    geometries.push(coreGeometry, shellGeometry, innerGeometry, edgeGeometry);

    coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x6dbcf5,
      emissive: 0x092d62,
      emissiveIntensity: 1.35,
      metalness: 0.5,
      roughness: 0.23,
      clearcoat: 0.85,
      clearcoatRoughness: 0.18,
      transparent: true,
      opacity: 0.92,
    });
    shellMaterial = new THREE.MeshBasicMaterial({
      color: 0x51b9ff,
      transparent: true,
      opacity: 0.13,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0x0c3b77,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x9cddff,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    materials.push(coreMaterial, shellMaterial, innerMaterial, edgeMaterial);
    revealMaterials.push(edgeMaterial);

    core = new THREE.Mesh(coreGeometry, coreMaterial);
    coreShell = new THREE.Mesh(shellGeometry, shellMaterial);
    const inner = new THREE.Mesh(innerGeometry, innerMaterial);
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    network.add(coreShell, inner, core, edges);

    const ringGeometry = new THREE.TorusGeometry(1.72, 0.012, 8, 160);
    const ringGeometryWide = new THREE.TorusGeometry(2.08, 0.008, 8, 160);
    geometries.push(ringGeometry, ringGeometryWide);
    const ringGroup = new THREE.Group();
    ringGroup.rotation.set(0.33, -0.18, -0.25);
    network.add(ringGroup);
    const ringColors = [0x61c9ff, 0x2b83e6, 0xaadfff];
    ringColors.forEach((color, index) => {
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: index === 1 ? 0.34 : 0.62,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      materials.push(material);
      revealMaterials.push(material);
      const ring = new THREE.Mesh(index === 1 ? ringGeometryWide : ringGeometry, material);
      ring.rotation.x = index * 0.78 + 0.24;
      ring.rotation.y = index * -0.41;
      ring.rotation.z = index * 0.3;
      ringGroup.add(ring);
    });

    const nodeGeometry = new THREE.SphereGeometry(smallViewport ? 0.075 : 0.085, 14, 10);
    const haloGeometry = new THREE.SphereGeometry(smallViewport ? 0.14 : 0.16, 12, 8);
    const anchorGeometry = new THREE.SphereGeometry(0.125, 14, 10);
    geometries.push(nodeGeometry, haloGeometry, anchorGeometry);
    const origin = new THREE.Vector3(0, 0, 0);
    const anchors = [
      new THREE.Vector3(0.96, 0.25, 0.47),
      new THREE.Vector3(-0.72, 0.54, 0.57),
      new THREE.Vector3(-0.94, -0.3, 0.28),
      new THREE.Vector3(-0.18, -0.87, 0.5),
      new THREE.Vector3(0.77, -0.63, -0.08),
      new THREE.Vector3(0.83, 0.28, -0.49),
    ];

    anchors.forEach((anchor, groupIndex) => {
      const color = CLUB_NETWORK_COLORS[groupIndex];
      const direction = anchor.clone().normalize();
      const tangent = new THREE.Vector3(-direction.y, direction.x, 0).normalize();
      const cluster = new THREE.Group();
      cluster.position.copy(direction.clone().multiplyScalar(1.08));
      cluster.rotation.z = groupIndex * 0.34;
      network!.add(cluster);

      const anchorMaterial = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.8,
        roughness: 0.22,
        metalness: 0.25,
        transparent: true,
        opacity: 0.92,
      });
      materials.push(anchorMaterial);
      nodeMaterials.push(anchorMaterial);
      const anchorMesh = new THREE.Mesh(anchorGeometry, anchorMaterial);
      cluster.add(anchorMesh);

      const haloMaterial = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      materials.push(haloMaterial);
      revealMaterials.push(haloMaterial);
      cluster.add(new THREE.Mesh(haloGeometry, haloMaterial));

      const centerLinkGeometry = new THREE.BufferGeometry().setFromPoints([origin, direction.clone().multiplyScalar(1.06)]);
      const centerLinkMaterial = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.34,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      geometries.push(centerLinkGeometry);
      materials.push(centerLinkMaterial);
      revealMaterials.push(centerLinkMaterial);
      lineMaterials.push(centerLinkMaterial);
      network!.add(new THREE.Line(centerLinkGeometry, centerLinkMaterial));

      const nodes: Vector3[] = [];
      const nodeCount = smallViewport ? 4 : 5;
      for (let nodeIndex = 0; nodeIndex < nodeCount; nodeIndex += 1) {
        const offset = (nodeIndex - (nodeCount - 1) / 2) * 0.21;
        const localPosition = direction.clone().multiplyScalar(0.33 + Math.abs(offset) * 0.26).add(tangent.clone().multiplyScalar(offset));
        localPosition.z += Math.sin(groupIndex * 1.7 + nodeIndex) * 0.13;
        nodes.push(localPosition);
        const nodeMaterial = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 2.25,
          roughness: 0.16,
          metalness: 0.2,
          transparent: true,
          opacity: 0.95,
        });
        materials.push(nodeMaterial);
        nodeMaterials.push(nodeMaterial);
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.copy(localPosition);
        cluster.add(node);

        const nodeHaloMaterial = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.12,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        materials.push(nodeHaloMaterial);
        revealMaterials.push(nodeHaloMaterial);
        const nodeHalo = new THREE.Mesh(haloGeometry, nodeHaloMaterial);
        nodeHalo.position.copy(localPosition);
        cluster.add(nodeHalo);
      }
      for (let nodeIndex = 0; nodeIndex < nodes.length - 1; nodeIndex += 1) {
        const linkGeometry = new THREE.BufferGeometry().setFromPoints([nodes[nodeIndex], nodes[nodeIndex + 1]]);
        const linkMaterial = new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.42,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        geometries.push(linkGeometry);
        materials.push(linkMaterial);
        revealMaterials.push(linkMaterial);
        lineMaterials.push(linkMaterial);
        cluster.add(new THREE.Line(linkGeometry, linkMaterial));
      }
    });

    applyState();
    resizeNow();
    host.appendChild(canvas);
    if (typeof renderer.compileAsync === "function") await renderer.compileAsync(scene, camera);
    if (disposed) return null;
    queue();

    return {
      setState(next) {
        if (disposed) return;
        state = { progress: clamp01(next.progress) };
        applyState();
        queue();
      },
      setVisible(next) {
        if (disposed) return;
        visible = next;
        if (visible) {
          lastTime = performance.now();
          queue();
        } else {
          cancelFrame();
        }
      },
      resize() {
        if (disposed) return;
        resizeNow();
        queue();
      },
      dispose: cleanup,
    };
  } catch {
    fail();
    return null;
  }
}
