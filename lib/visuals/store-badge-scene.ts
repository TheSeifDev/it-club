import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import type { Material, Texture } from "three";

export type StoreBadgeSceneHandle = {
  setPointer(x: number, y: number): void;
  rotateBy(yaw: number, pitch?: number): void;
  reset(): void;
  setPaused(paused: boolean): void;
  setVisible(visible: boolean): void;
  resize(): void;
  dispose(): void;
};

function roundedRectangle(width: number, height: number, radius: number): Shape {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const r = Math.min(radius, halfWidth, halfHeight);
  const shape = new Shape();
  shape.moveTo(-halfWidth + r, -halfHeight);
  shape.lineTo(halfWidth - r, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + r);
  shape.lineTo(halfWidth, halfHeight - r);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - r, halfHeight);
  shape.lineTo(-halfWidth + r, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - r);
  shape.lineTo(-halfWidth, -halfHeight + r);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + r, -halfHeight);
  return shape;
}

function ribbonGeometry(curve: CatmullRomCurve3, width: number, segments: number): BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const side = new Vector3(-tangent.y, tangent.x, 0).normalize();
    const halfWidth = width / 2;
    positions.push(
      point.x - side.x * halfWidth,
      point.y - side.y * halfWidth,
      point.z,
      point.x + side.x * halfWidth,
      point.y + side.y * halfWidth,
      point.z,
    );
    if (index < segments) {
      const start = index * 2;
      indices.push(start, start + 1, start + 2, start + 1, start + 3, start + 2);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Lightweight transparent product mockup; all non-logo artwork is procedural geometry. */
export function createStoreBadgeScene(
  host: HTMLElement,
  onFailure: () => void,
): StoreBadgeSceneHandle | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    });
  } catch {
    return null;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.pointerEvents = "none";

  const scene = new Scene();
  const camera = new PerspectiveCamera(36, 1, 0.1, 40);
  camera.position.set(0, 0.18, 9);
  camera.lookAt(0, 0.18, 0);

  scene.add(new AmbientLight(0xb9d5d8, 1.25));
  const key = new DirectionalLight(0xe6fff9, 3.2);
  key.position.set(-3.5, 5, 6);
  scene.add(key);
  const rim = new DirectionalLight(0x38e6cf, 4.6);
  rim.position.set(4.2, 1.8, -2.5);
  scene.add(rim);
  const fill = new PointLight(0x1bbba9, 2.4, 12);
  fill.position.set(-3.1, -2.7, 4.6);
  scene.add(fill);

  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const badge = new Group();
  badge.position.y = 0.17;
  scene.add(badge);

  const plateMaterial = new MeshStandardMaterial({
    color: 0x0a1721,
    metalness: 0.68,
    roughness: 0.27,
  });
  materials.push(plateMaterial);
  const plateGeometry = new ExtrudeGeometry(roundedRectangle(2.14, 2.94, 0.23), {
    depth: 0.095,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.042,
    bevelThickness: 0.042,
    curveSegments: 8,
    steps: 1,
  });
  geometries.push(plateGeometry);
  const plate = new Mesh(plateGeometry, plateMaterial);
  plate.position.set(0, -0.43, 0);
  badge.add(plate);

  const faceMaterial = new MeshStandardMaterial({
    color: 0x0e2029,
    metalness: 0.34,
    roughness: 0.38,
  });
  materials.push(faceMaterial);
  const faceGeometry = new ShapeGeometry(roundedRectangle(1.82, 2.62, 0.15), 8);
  geometries.push(faceGeometry);
  const face = new Mesh(faceGeometry, faceMaterial);
  face.position.set(0, -0.43, 0.141);
  badge.add(face);

  const stripeMaterial = new MeshStandardMaterial({
    color: 0x2bbda9,
    metalness: 0.42,
    roughness: 0.36,
    side: DoubleSide,
  });
  const stripeSoftMaterial = new MeshStandardMaterial({
    color: 0x426d73,
    metalness: 0.48,
    roughness: 0.42,
    side: DoubleSide,
  });
  materials.push(stripeMaterial, stripeSoftMaterial);
  const makeSlash = (x: number, y: number, width: number, height: number) => {
    const shape = new Shape();
    shape.moveTo(x, y);
    shape.lineTo(x + width * 0.63, y);
    shape.lineTo(x + width, y + height);
    shape.lineTo(x + width * 0.37, y + height);
    shape.closePath();
    const geometry = new ShapeGeometry(shape);
    geometries.push(geometry);
    return geometry;
  };
  [
    { x: -0.68, y: -1.56, width: 0.19, height: 0.3, material: stripeMaterial },
    { x: -0.4, y: -1.56, width: 0.13, height: 0.3, material: stripeSoftMaterial },
    { x: -0.19, y: -1.56, width: 0.09, height: 0.3, material: stripeSoftMaterial },
  ].forEach(({ x, y, width, height, material }) => {
    const slash = new Mesh(makeSlash(x, y, width, height), material);
    slash.position.z = 0.146;
    badge.add(slash);
  });

  const logoMaterial = new MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: DoubleSide,
  });
  materials.push(logoMaterial);
  const logoGeometry = new BufferGeometry();
  const logoPositions = new Float32Array([
    -0.72, -0.5, 0,
    0.72, -0.5, 0,
    0.72, 0.5, 0,
    -0.72, 0.5, 0,
  ]);
  logoGeometry.setAttribute("position", new Float32BufferAttribute(logoPositions, 3));
  logoGeometry.setAttribute(
    "uv",
    new Float32BufferAttribute(
      new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      2,
    ),
  );
  logoGeometry.setIndex([0, 1, 2, 0, 2, 3]);
  logoGeometry.computeVertexNormals();
  geometries.push(logoGeometry);
  const logo = new Mesh(logoGeometry, logoMaterial);
  logo.position.set(0, -0.36, 0.154);
  badge.add(logo);

  const hardwareMaterial = new MeshStandardMaterial({
    color: 0xa8c1c4,
    metalness: 0.9,
    roughness: 0.2,
  });
  const hardwareHighlight = new MeshStandardMaterial({
    color: 0xdaf4ef,
    metalness: 0.92,
    roughness: 0.16,
  });
  materials.push(hardwareMaterial, hardwareHighlight);
  const clipBodyGeometry = new BoxGeometry(0.15, 0.17, 0.07);
  const ringGeometry = new TorusGeometry(0.086, 0.022, 6, 18);
  const rivetGeometry = new TorusGeometry(0.027, 0.008, 5, 12);
  geometries.push(clipBodyGeometry, ringGeometry, rivetGeometry);
  for (const x of [-0.43, 0.43]) {
    const ring = new Mesh(ringGeometry, hardwareMaterial);
    ring.position.set(x, 1.18, 0.19);
    badge.add(ring);
    const clamp = new Mesh(clipBodyGeometry, hardwareHighlight);
    clamp.position.set(x, 1.045, 0.19);
    badge.add(clamp);
    const rivet = new Mesh(rivetGeometry, hardwareMaterial);
    rivet.position.set(x, 1.045, 0.231);
    badge.add(rivet);
  }

  const lanyardMaterial = new MeshStandardMaterial({
    color: 0x16353d,
    metalness: 0.3,
    roughness: 0.45,
    side: DoubleSide,
  });
  const lanyardStripeMaterial = new MeshStandardMaterial({
    color: 0x52e8d1,
    metalness: 0.25,
    roughness: 0.3,
    side: DoubleSide,
  });
  materials.push(lanyardMaterial, lanyardStripeMaterial);
  const leftCurve = new CatmullRomCurve3([
    new Vector3(-0.43, 1.21, 0.205),
    new Vector3(-0.51, 1.58, 0.19),
    new Vector3(-0.62, 2.05, 0.12),
    new Vector3(-0.53, 2.43, 0.02),
    new Vector3(-0.25, 2.69, -0.055),
    new Vector3(0, 2.73, -0.07),
  ]);
  const rightCurve = new CatmullRomCurve3([
    new Vector3(0.43, 1.21, 0.205),
    new Vector3(0.51, 1.58, 0.19),
    new Vector3(0.62, 2.05, 0.12),
    new Vector3(0.53, 2.43, 0.02),
    new Vector3(0.25, 2.69, -0.055),
    new Vector3(0, 2.73, -0.07),
  ]);
  [leftCurve, rightCurve].forEach((curve) => {
    const band = ribbonGeometry(curve, 0.22, 28);
    const pinstripe = ribbonGeometry(curve, 0.026, 28);
    const bandMesh = new Mesh(band, lanyardMaterial);
    const stripeMesh = new Mesh(pinstripe, lanyardStripeMaterial);
    stripeMesh.position.z += 0.012;
    geometries.push(band, pinstripe);
    badge.add(bandMesh, stripeMesh);
  });

  host.appendChild(renderer.domElement);
  let disposed = false;
  let visible = false;
  let paused = false;
  let frame = 0;
  let lastTime = 0;
  let elapsed = 0;
  let baseYaw = 0;
  let basePitch = 0;
  let pointerX = 0;
  let pointerY = 0;
  let currentYaw = 0;
  let currentPitch = 0;
  let logoTexture: Texture | undefined;

  const draw = () => {
    if (!disposed && visible) renderer.render(scene, camera);
  };
  const stopFrame = () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  };
  const animate = (now: number) => {
    frame = 0;
    if (disposed || !visible || paused || document.hidden) return;
    const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0;
    lastTime = now;
    elapsed += delta;
    const damp = 1 - Math.exp(-delta * 6.2);
    const targetYaw = baseYaw + pointerX * 0.23;
    const targetPitch = basePitch + pointerY * 0.15;
    currentYaw += (targetYaw - currentYaw) * damp;
    currentPitch += (targetPitch - currentPitch) * damp;
    badge.rotation.y = currentYaw;
    badge.rotation.x = currentPitch;
    badge.rotation.z = Math.sin(elapsed * 0.68) * 0.032;
    draw();
    frame = window.requestAnimationFrame(animate);
  };
  const requestAnimation = () => {
    if (!disposed && visible && !paused && !document.hidden && !frame) {
      frame = window.requestAnimationFrame(animate);
    }
  };
  const resize = () => {
    if (disposed) return;
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (visible) {
      if (paused) draw();
      else requestAnimation();
    }
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    stopFrame();
    renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
    if (logoTexture) logoTexture.dispose();
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    scene.clear();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
  const onContextLost = (event: Event) => {
    event.preventDefault();
    if (disposed) return;
    dispose();
    onFailure();
  };

  renderer.domElement.addEventListener("webglcontextlost", onContextLost);
  resize();
  try {
    logoTexture = new TextureLoader().load(
      "/logo.webp",
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = SRGBColorSpace;
        const image = texture.image as { width?: number; height?: number };
        const imageWidth = image.width || 1;
        const imageHeight = image.height || 1;
        const aspect = imageWidth / imageHeight;
        const width = aspect >= 1.45 ? 1.36 : Math.max(0.72, 0.92 * aspect);
        const height = width / aspect;
        logo.scale.set(width / 1.44, height / 1, 1);
        logoMaterial.map = texture;
        logoMaterial.opacity = 1;
        logoMaterial.needsUpdate = true;
        if (paused) draw();
      },
      undefined,
      () => {
        // The DOM fallback remains branded even if the local texture cannot be decoded.
      },
    );
  } catch {
    // Keep the procedural plaque and its DOM fallback if image loading is unavailable.
  }

  return {
    setPointer(x, y) {
      pointerX = Math.max(-1, Math.min(1, x));
      pointerY = Math.max(-1, Math.min(1, y));
      if (paused) {
        const targetYaw = baseYaw + pointerX * 0.23;
        const targetPitch = basePitch + pointerY * 0.15;
        currentYaw += (targetYaw - currentYaw) * 0.32;
        currentPitch += (targetPitch - currentPitch) * 0.32;
        badge.rotation.set(currentPitch, currentYaw, 0);
        draw();
      }
    },
    rotateBy(yaw, pitch = 0) {
      baseYaw = Math.max(-1.12, Math.min(1.12, baseYaw + yaw));
      basePitch = Math.max(-0.46, Math.min(0.46, basePitch + pitch));
      if (paused) {
        currentYaw = baseYaw + pointerX * 0.23;
        currentPitch = basePitch + pointerY * 0.15;
        badge.rotation.set(currentPitch, currentYaw, 0);
        draw();
      } else {
        requestAnimation();
      }
    },
    reset() {
      baseYaw = 0;
      basePitch = 0;
      pointerX = 0;
      pointerY = 0;
      if (paused) {
        currentYaw = 0;
        currentPitch = 0;
        badge.rotation.set(0, 0, 0);
        draw();
      } else {
        requestAnimation();
      }
    },
    setPaused(next) {
      paused = next;
      if (paused) {
        stopFrame();
        draw();
      } else {
        requestAnimation();
      }
    },
    setVisible(next) {
      visible = next;
      if (!visible) stopFrame();
      else {
        draw();
        requestAnimation();
      }
    },
    resize,
    dispose,
  };
}
