import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildSoftwareModel } from "./build-software-model";
import type { LayerIndex } from "./scene-data";

export type SoftwareSceneState = {
  layer: LayerIndex;
  exploded: boolean;
  reduced: boolean;
  rotation: number;
  isolated: boolean;
  component: number;
  focused: boolean;
};

/** Logical components, not a physical CPU or DRAM floorplan. */
export function createSoftwareScene(
  host: HTMLDivElement,
  initial: SoftwareSceneState,
  onSelect: (layer: LayerIndex, component: number) => void,
  onRotate?: (degrees: number) => void,
) {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, window.innerWidth < 760 ? 1.5 : 2),
  );
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.append(renderer.domElement);
  const camera = new THREE.OrthographicCamera(-5, 5, 4, -4, 0.1, 80);
  camera.position.set(7, 10, 11);
  camera.lookAt(0, 0, 0);
  const root = new THREE.Group();
  scene.add(root);
  const environment = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = environment.fromScene(room, 0.04).texture;
  scene.environmentIntensity = 0.6;
  room.dispose();
  environment.dispose();
  scene.add(new THREE.HemisphereLight(0xe2e7eb, 0x1a1f22, 1.1));
  const key = new THREE.DirectionalLight(0xffe6c3, 2.6);
  key.position.set(3, 8, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -7;
  key.shadow.camera.right = key.shadow.camera.top = 7;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 24;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.015;
  key.shadow.radius = 4;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xbecfd9, 1.9);
  rim.position.set(-5, 2, -4);
  scene.add(rim);
  // Warm kicker from behind so bevels and the gold rim catch a highlight.
  const kicker = new THREE.DirectionalLight(0xffc98a, 1.2);
  kicker.position.set(-1, 0.6, -7);
  scene.add(kicker);
  const floorCanvas = document.createElement("canvas");
  floorCanvas.width = floorCanvas.height = 256;
  const floorContext = floorCanvas.getContext("2d");
  if (floorContext) {
    floorContext.filter = "blur(26px)";
    floorContext.fillStyle = "rgba(0, 0, 0, 0.8)";
    floorContext.beginPath();
    floorContext.roundRect(58, 64, 140, 128, 24);
    floorContext.fill();
  }
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(8.4, 6.6),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(floorCanvas),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      opacity: 0.55,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(-0.45, -2.3, -0.6);
  floor.raycast = () => {};
  scene.add(floor);
  const { plates, parts, pulses } = buildSoftwareModel(root);
  const startedAt = performance.now();
  const normalEdge = new THREE.Color(0x8d9aa1),
    selectedEdge = new THREE.Color(0xf0c88a);
  const origins = parts.map((part) => part.group.position.clone());
  const normalColor = new THREE.Color(0x3e4a50),
    selectedColor = new THREE.Color(0x9f7d4b);
  let state = initial;
  let frame = 0,
    visible = true,
    destroyed = false;
  let pointerX = 0,
    pointerY = 0;
  let hovered: { layer: LayerIndex; component: number } | undefined;
  let lastFrame = performance.now();
  root.rotation.y = -0.12;
  function render() {
    frame = 0;
    if (destroyed || !visible || document.hidden) return;
    const now = performance.now();
    const delta = Math.min(0.1, (now - lastFrame) / 1000);
    lastFrame = now;
    // Frame-rate independent easing (≈0.12 per frame at 60 Hz).
    const blend = state.reduced ? 1 : 1 - Math.exp(-delta * 7.7);
    const time = (performance.now() - startedAt) / 1000;
    const idle = !state.reduced;
    let remaining = 0;
    const targetRotation =
      -0.12 + (state.rotation * Math.PI) / 180 + pointerX * 0.06;
    root.rotation.y += (targetRotation - root.rotation.y) * blend;
    root.rotation.x += (pointerY * 0.03 - root.rotation.x) * blend;
    remaining +=
      Math.abs(targetRotation - root.rotation.y) +
      Math.abs(pointerY * 0.03 - root.rotation.x);
    plates.forEach((plate, index) => {
      const selected = index === state.layer;
      const y = state.isolated
        ? selected
          ? 0
          : index < state.layer
            ? 8
            : -8
        : (1 - index) * (state.exploded ? 1.4 : 0.35);
      const x = state.isolated && !selected ? 8 : 0;
      const scale = state.isolated ? 1.2 : 1;
      const float = idle ? Math.sin(time * 0.9 + index * 1.3) * 0.028 : 0;
      plate.position.y += (y + float - plate.position.y) * blend;
      plate.position.x += (x - plate.position.x) * blend;
      plate.scale.setScalar(plate.scale.x + (scale - plate.scale.x) * blend);
      remaining +=
        Math.abs(y + float - plate.position.y) +
        Math.abs(x - plate.position.x) +
        Math.abs(scale - plate.scale.x);
      plate.visible = !(
        state.isolated &&
        !selected &&
        Math.abs(y + float - plate.position.y) < 0.04
      );
      for (const child of plate.children)
        if (!(child instanceof THREE.Group)) child.visible = !state.focused;
    });
    parts.forEach((part, index) => {
      const selected =
        part.layer === state.layer && part.index === state.component;
      const focus = state.focused && selected;
      const origin = origins[index]!;
      const x = focus ? 0 : origin.x,
        z = focus ? 0 : origin.z;
      const hover =
        !state.focused &&
        hovered?.layer === part.layer &&
        hovered.component === part.index;
      const y = (state.isolated && selected ? 0.27 : 0.07) + (hover ? 0.1 : 0);
      const scale = focus ? (part.layer === 1 ? 3.5 : 1.5) : 1;
      part.group.visible = !state.focused || selected;
      part.group.position.x += (x - part.group.position.x) * blend;
      part.group.position.z += (z - part.group.position.z) * blend;
      part.group.position.y += (y - part.group.position.y) * blend;
      part.group.scale.setScalar(
        part.group.scale.x + (scale - part.group.scale.x) * blend,
      );
      part.material.color.lerp(selected ? selectedColor : normalColor, blend);
      part.outline.color.lerp(
        selected || hover ? selectedEdge : normalEdge,
        blend,
      );
      part.outline.opacity +=
        ((selected || hover ? 0.95 : 0.5) - part.outline.opacity) * blend;
      part.material.emissiveIntensity +=
        ((selected ? 0.22 : hover ? 0.12 : 0) -
          part.material.emissiveIntensity) *
        blend;
      remaining +=
        Math.abs(x - part.group.position.x) +
        Math.abs(z - part.group.position.z) +
        Math.abs(y - part.group.position.y) +
        Math.abs(scale - part.group.scale.x);
    });
    for (const pulse of pulses) {
      const progress = (pulse.phase + (idle ? time * pulse.speed : 0)) % 1;
      pulse.mesh.position.copy(pulse.start).lerp(pulse.end, progress);
      pulse.mesh.scale.setScalar(Math.max(0.001, Math.sin(progress * Math.PI)));
      pulse.mesh.visible = idle;
    }
    renderer.render(scene, camera);
    if (remaining > 0.004 || idle) frame = requestAnimationFrame(render);
  }
  const invalidate = () => {
    if (frame || destroyed) return;
    lastFrame = performance.now();
    frame = requestAnimationFrame(render);
  };
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    const aspect = width / height;
    const vertical = Math.max(3.5, 3.6 / aspect);
    camera.left = -vertical * aspect;
    camera.right = vertical * aspect;
    camera.top = vertical;
    camera.bottom = -vertical;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    invalidate();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const visibilityObserver = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? false;
    if (visible) invalidate();
    else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  });
  visibilityObserver.observe(host);
  const raycaster = new THREE.Raycaster();
  function hit(event: PointerEvent) {
    const bounds = host.getBoundingClientRect();
    const pointer = new THREE.Vector2(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      (-(event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    for (const intersection of raycaster.intersectObjects(
      root.children,
      true,
    )) {
      let object: THREE.Object3D | null = intersection.object;
      let selection: { layer: LayerIndex; component: number } | undefined;
      let shown = true;
      while (object) {
        if (!object.visible) shown = false;
        if (!selection && typeof object.userData.layer === "number")
          selection = {
            layer: object.userData.layer as LayerIndex,
            component: object.userData.component as number,
          };
        object = object.parent;
      }
      if (shown && selection) return selection;
    }
  }
  let start: { x: number; y: number; rotation: number } | undefined;
  let dragging = false;
  const same = (
    a?: { layer: LayerIndex; component: number },
    b?: { layer: LayerIndex; component: number },
  ) => a?.layer === b?.layer && a?.component === b?.component;
  const move = (event: PointerEvent) => {
    if (start && onRotate) {
      const dx = event.clientX - start.x;
      if (!dragging && Math.abs(dx) > 8) {
        dragging = true;
        host.setPointerCapture(event.pointerId);
      }
      if (dragging) {
        const degrees = Math.round(
          Math.max(
            -90,
            Math.min(90, start.rotation + (dx / host.clientWidth) * 220),
          ),
        );
        if (degrees !== state.rotation) onRotate(degrees);
        host.style.cursor = "grabbing";
        return;
      }
    }
    const target = event.pointerType === "mouse" ? hit(event) : undefined;
    if (!same(target, hovered)) {
      hovered = target;
      invalidate();
    }
    host.style.cursor = target ? "pointer" : onRotate ? "grab" : "default";
    if (state.reduced || event.pointerType !== "mouse") return;
    const bounds = host.getBoundingClientRect();
    pointerX = (event.clientX - bounds.left) / bounds.width - 0.5;
    pointerY = (event.clientY - bounds.top) / bounds.height - 0.5;
    invalidate();
  };
  const down = (event: PointerEvent) => {
    if (event.button !== 0) return;
    start = { x: event.clientX, y: event.clientY, rotation: state.rotation };
    dragging = false;
  };
  const select = (event: PointerEvent) => {
    const wasDragging = dragging;
    const origin = start;
    start = undefined;
    dragging = false;
    if (host.hasPointerCapture(event.pointerId))
      host.releasePointerCapture(event.pointerId);
    if (
      wasDragging ||
      !origin ||
      Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 8
    )
      return;
    const selection = hit(event);
    if (selection) onSelect(selection.layer, selection.component);
  };
  const cancel = () => {
    start = undefined;
    dragging = false;
  };
  const reset = (event: MouseEvent) => {
    if (onRotate && !hit(event as PointerEvent)) onRotate(0);
  };
  const leave = () => {
    pointerX = 0;
    pointerY = 0;
    if (hovered) hovered = undefined;
    host.style.cursor = "default";
    invalidate();
  };
  host.addEventListener("pointermove", move);
  host.addEventListener("pointerleave", leave);
  host.addEventListener("pointerdown", down);
  host.addEventListener("pointerup", select);
  host.addEventListener("pointercancel", cancel);
  host.addEventListener("dblclick", reset);
  host.style.touchAction = "pan-y";
  document.addEventListener("visibilitychange", invalidate);
  resize();
  return {
    update(next: SoftwareSceneState) {
      state = next;
      if (state.reduced) {
        pointerX = 0;
        pointerY = 0;
      }
      invalidate();
    },
    dispose() {
      destroyed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("pointerdown", down);
      host.removeEventListener("pointerup", select);
      host.removeEventListener("pointercancel", cancel);
      host.removeEventListener("dblclick", reset);
      document.removeEventListener("visibilitychange", invalidate);
      const materials = new Set<THREE.Material>();
      const geometries = new Set<THREE.BufferGeometry>();
      scene.traverse((item) => {
        if (item instanceof THREE.Mesh || item instanceof THREE.LineSegments) {
          geometries.add(item.geometry);
          (Array.isArray(item.material)
            ? item.material
            : [item.material]
          ).forEach((material) => materials.add(material));
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => {
        if ("map" in material && material.map instanceof THREE.Texture)
          material.map.dispose();
        material.dispose();
      });
      scene.environment?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
