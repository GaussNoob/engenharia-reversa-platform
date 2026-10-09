import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { memorySample } from "./scene-data";

export type ScenePart = {
  layer: number;
  index: number;
  group: THREE.Group;
  material: THREE.MeshStandardMaterial;
  outline: THREE.LineBasicMaterial;
};

/** A spark of light travelling along a trace, from `start` to `end`. */
export type ScenePulse = {
  mesh: THREE.Mesh;
  start: THREE.Vector3;
  end: THREE.Vector3;
  phase: number;
  speed: number;
};

const plateSize: [number, number, number] = [4.6, 0.12, 3.55];
const layerNames = ["CPU", "MEMÓRIA", "EXECUTÁVEL"];
const mono = '"Commit Mono", ui-monospace, monospace';

export function buildSoftwareModel(root: THREE.Group) {
  const plates: THREE.Group[] = [];
  const parts: ScenePart[] = [];
  const pulses: ScenePulse[] = [];
  const geometries = new Map<string, THREE.BufferGeometry>();
  const base = new THREE.MeshPhysicalMaterial({
    color: 0x2a3135,
    roughness: 0.5,
    metalness: 0.45,
    clearcoat: 0.4,
    clearcoatRoughness: 0.45,
  });
  const rim = new THREE.MeshStandardMaterial({
    color: 0xb08b54,
    roughness: 0.32,
    metalness: 0.9,
  });
  const face = new THREE.MeshPhysicalMaterial({
    color: 0x1f2528,
    roughness: 0.22,
    metalness: 0.6,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
  });
  const trace = new THREE.MeshStandardMaterial({
    color: 0xc39a5f,
    roughness: 0.35,
    metalness: 0.85,
  });
  const ink = new THREE.MeshStandardMaterial({
    color: 0x5f6d74,
    roughness: 0.6,
    metalness: 0.2,
  });
  const spark = new THREE.MeshBasicMaterial({
    color: 0xffd9a0,
    toneMapped: false,
  });
  const plateLine = new THREE.LineBasicMaterial({
    color: 0xc6d2d8,
    transparent: true,
    opacity: 0.22,
  });
  /** Geometries are shared by size so the 32 memory cells reuse one buffer. */
  function rounded(size: [number, number, number], radius: number) {
    const key = `${size.join("x")}:${radius}`;
    let geometry = geometries.get(key);
    if (!geometry) {
      geometry = new RoundedBoxGeometry(...size, 3, radius);
      geometries.set(key, geometry);
    }
    return geometry;
  }
  function box(
    parent: THREE.Object3D,
    size: [number, number, number],
    position: [number, number, number],
    material: THREE.Material,
    radius = Math.min(...size) * 0.3,
  ) {
    const mesh = new THREE.Mesh(rounded(size, radius), material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function instances(
    parent: THREE.Object3D,
    size: [number, number, number],
    material: THREE.Material,
    positions: [number, number, number][],
  ) {
    const mesh = new THREE.InstancedMesh(
      rounded(size, Math.min(...size) * 0.3),
      material,
      positions.length,
    );
    const matrix = new THREE.Matrix4();
    positions.forEach((position, index) =>
      mesh.setMatrixAt(index, matrix.makeTranslation(...position)),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function canvasTexture(
    width: number,
    height: number,
    draw: (context: CanvasRenderingContext2D) => void,
  ) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    draw(context);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }
  /** Soft rounded shadow, stretched under each component as baked occlusion. */
  const occlusion = canvasTexture(256, 256, (context) => {
    context.filter = "blur(22px)";
    context.fillStyle = "rgba(0, 0, 0, 0.9)";
    context.beginPath();
    context.roundRect(52, 52, 152, 152, 18);
    context.fill();
  });
  function contact(
    parent: THREE.Object3D,
    width: number,
    depth: number,
    y: number,
    opacity = 0.75,
  ) {
    if (!occlusion) return;
    const mesh = decal(parent, occlusion, width * 1.68, depth * 1.68, [
      0,
      y,
      0,
    ]);
    mesh.material.opacity = opacity;
    mesh.renderOrder = 1;
  }
  /** A crisp one-pixel outline that keeps edges defined at any zoom. */
  function outline(
    parent: THREE.Object3D,
    width: number,
    depth: number,
    y: number,
    radius: number,
    material: THREE.LineBasicMaterial,
  ) {
    const shape = new THREE.Shape();
    const x = -width / 2,
      z = -depth / 2;
    shape.moveTo(x + radius, z);
    shape.lineTo(x + width - radius, z);
    shape.quadraticCurveTo(x + width, z, x + width, z + radius);
    shape.lineTo(x + width, z + depth - radius);
    shape.quadraticCurveTo(x + width, z + depth, x + width - radius, z + depth);
    shape.lineTo(x + radius, z + depth);
    shape.quadraticCurveTo(x, z + depth, x, z + depth - radius);
    shape.lineTo(x, z + radius);
    shape.quadraticCurveTo(x, z, x + radius, z);
    const points = shape
      .getPoints(4)
      .map(({ x, y: z }) => new THREE.Vector3(x, 0, z));
    const line = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(points),
      material,
    );
    line.position.y = y;
    line.raycast = () => {};
    parent.add(line);
  }
  function pulse(
    parent: THREE.Object3D,
    start: [number, number, number],
    end: [number, number, number],
    phase: number,
    speed = 0.45,
  ) {
    const horizontal =
      Math.abs(end[0] - start[0]) > Math.abs(end[2] - start[2]);
    const mesh = new THREE.Mesh(
      rounded(horizontal ? [0.12, 0.016, 0.034] : [0.034, 0.016, 0.12], 0.007),
      spark,
    );
    mesh.raycast = () => {};
    parent.add(mesh);
    const item = {
      mesh,
      start: new THREE.Vector3(...start),
      end: new THREE.Vector3(...end),
      phase,
      speed,
    };
    mesh.position.copy(item.start).lerp(item.end, phase);
    pulses.push(item);
  }
  function decal(
    parent: THREE.Object3D,
    texture: THREE.Texture,
    width: number,
    depth: number,
    position: [number, number, number],
  ) {
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      material,
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(...position);
    mesh.raycast = () => {};
    parent.add(mesh);
    return mesh;
  }
  function label(
    parent: THREE.Object3D,
    text: string,
    width: number,
    y: number,
    z = 0,
    color = "#f3f0e9",
    depth = width / 4,
  ) {
    // The canvas keeps the plane's proportions so short labels can grow.
    const height = Math.round((1024 * depth) / width);
    const texture = canvasTexture(1024, height, (context) => {
      let size = Math.round(height * 0.62);
      context.font = `600 ${size}px ${mono}`;
      const measured = context.measureText(text).width;
      if (measured > 920) size = Math.floor((size * 920) / measured);
      context.font = `600 ${size}px ${mono}`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.shadowColor = "rgba(0, 0, 0, 0.6)";
      context.shadowBlur = 8;
      context.fillStyle = color;
      context.fillText(text, 512, height / 2 + size * 0.04);
    });
    if (texture)
      decal(parent, texture, width, depth, [0, y, z]).renderOrder = 2;
  }
  /** Silkscreen for a plate: dot grid, inset frame, corner marks and name. */
  function silkscreen(plate: THREE.Group, layer: number) {
    const texture = canvasTexture(1380, 1065, (context) => {
      const w = 1380,
        h = 1065,
        inset = 36;
      // Gentle sheen towards the centre and falloff at the edges.
      const sheen = context.createRadialGradient(
        w * 0.42,
        h * 0.38,
        40,
        w / 2,
        h / 2,
        w * 0.68,
      );
      sheen.addColorStop(0, "rgba(255, 255, 255, 0.05)");
      sheen.addColorStop(1, "rgba(0, 0, 0, 0.22)");
      context.fillStyle = sheen;
      context.fillRect(0, 0, w, h);
      // Deterministic hairline routing, like inner copper seen through solder mask.
      let seed = 17 + layer * 31;
      const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      context.strokeStyle = "rgba(205, 168, 110, 0.07)";
      context.lineWidth = 2;
      context.lineJoin = "round";
      for (let n = 0; n < 46; n++) {
        let x = inset + 40 + Math.round(random() * 43) * 30,
          y = inset + 40 + Math.round(random() * 32) * 30;
        context.beginPath();
        context.moveTo(x, y);
        for (let step = 0; step < 3; step++) {
          const length = 60 + random() * 220;
          if (step % 2)
            y = Math.min(
              h - inset - 40,
              Math.max(inset + 40, y + (random() > 0.5 ? length : -length)),
            );
          else
            x = Math.min(
              w - inset - 40,
              Math.max(inset + 40, x + (random() > 0.5 ? length : -length)),
            );
          context.lineTo(x, y);
        }
        context.stroke();
        context.fillStyle = "rgba(205, 168, 110, 0.12)";
        context.beginPath();
        context.arc(x, y, 5, 0, Math.PI * 2);
        context.fill();
      }
      context.fillStyle = "rgba(170, 186, 196, 0.11)";
      for (let x = inset + 30; x < w - inset; x += 30)
        for (let y = inset + 30; y < h - inset; y += 30)
          context.fillRect(x - 1.5, y - 1.5, 3, 3);
      context.strokeStyle = "rgba(170, 186, 196, 0.22)";
      context.lineWidth = 3;
      context.beginPath();
      context.roundRect(inset, inset, w - inset * 2, h - inset * 2, 22);
      context.stroke();
      context.strokeStyle = "rgba(205, 168, 110, 0.75)";
      context.lineWidth = 6;
      const mark = 70,
        m = inset - 14;
      for (const [x, y, dx, dy] of [
        [m, m, 1, 1],
        [w - m, m, -1, 1],
        [m, h - m, 1, -1],
        [w - m, h - m, -1, -1],
      ] as const) {
        context.beginPath();
        context.moveTo(x + dx * mark, y);
        context.lineTo(x, y);
        context.lineTo(x, y + dy * mark);
        context.stroke();
      }
      context.font = `600 30px ${mono}`;
      context.fillStyle = "rgba(205, 168, 110, 0.8)";
      context.textBaseline = "middle";
      context.fillText(`0${layer + 1}`, inset + 30, h - inset - 34);
      context.fillStyle = "rgba(170, 186, 196, 0.55)";
      context.fillText(layerNames[layer]!, inset + 86, h - inset - 34);
      context.textAlign = "right";
      context.fillText("NUCLEO · x86-64", w - inset - 30, h - inset - 34);
    });
    if (texture)
      decal(plate, texture, plateSize[0], plateSize[2], [
        0,
        plateSize[1] / 2 + 0.001,
        0,
      ]);
  }
  /** Pins evenly spaced along the sides of a component, like a QFP package. */
  function pins(
    group: THREE.Group,
    size: [number, number, number],
    count: [number, number],
  ) {
    const positions: [number, number, number][] = [];
    const [w, , d] = size;
    for (let n = 0; n < count[0]; n++) {
      const x = ((n + 0.5) / count[0] - 0.5) * w * 0.82;
      positions.push([x, 0.02, d / 2 + 0.04], [x, 0.02, -d / 2 - 0.04]);
    }
    if (positions.length)
      instances(group, [0.045, 0.026, 0.1], trace, positions);
    const sides: [number, number, number][] = [];
    for (let n = 0; n < count[1]; n++) {
      const z = ((n + 0.5) / count[1] - 0.5) * d * 0.82;
      sides.push([w / 2 + 0.04, 0.02, z], [-w / 2 - 0.04, 0.02, z]);
    }
    if (sides.length) instances(group, [0.1, 0.026, 0.045], trace, sides);
  }
  function part(
    plate: THREE.Group,
    layer: number,
    index: number,
    name: string,
    size: [number, number, number],
    position: [number, number, number],
    width: number,
    labelDepth?: number,
  ) {
    const group = new THREE.Group();
    group.position.set(...position);
    group.userData = { layer, component: index };
    const material = new THREE.MeshStandardMaterial({
      color: 0x4a555b,
      roughness: 0.42,
      metalness: 0.5,
      emissive: 0xb08b54,
      emissiveIntensity: 0,
    });
    const [w, h, d] = size;
    const radius = Math.min(h * 0.35, 0.05);
    contact(group, w, d, -0.0085);
    box(group, size, [0, h / 2, 0], material, radius);
    const lip = Math.min(w, d) * 0.08;
    box(
      group,
      [w - lip * 2, 0.014, d - lip * 2],
      [0, h + 0.004, 0],
      face,
      0.006,
    );
    const edge = new THREE.LineBasicMaterial({
      color: 0x8d9aa1,
      transparent: true,
      opacity: 0.55,
    });
    outline(
      group,
      w - radius * 0.6,
      d - radius * 0.6,
      h + 0.0005,
      radius,
      edge,
    );
    outline(group, w - lip * 2, d - lip * 2, h + 0.0115, 0.006, edge);
    label(group, name, width, h + 0.013, 0, undefined, labelDepth);
    parts.push({ layer, index, group, material, outline: edge });
    plate.add(group);
    return group;
  }
  for (let layer = 0; layer < 3; layer++) {
    const plate = new THREE.Group();
    plate.userData = { layer, component: 0 };
    box(plate, plateSize, [0, 0, 0], base, 0.05);
    box(
      plate,
      [plateSize[0] + 0.04, 0.035, plateSize[2] + 0.04],
      [0, -0.05, 0],
      rim,
      0.017,
    );
    silkscreen(plate, layer);
    const top = plateSize[1] / 2;
    outline(
      plate,
      plateSize[0] - 0.03,
      plateSize[2] - 0.03,
      top + 0.0005,
      0.035,
      plateLine,
    );
    if (layer === 0) {
      const alu = part(
        plate,
        layer,
        0,
        "ALU",
        [1.3, 0.25, 1.3],
        [0, 0.07, 0],
        1,
        0.34,
      );
      pins(alu, [1.3, 0.25, 1.3], [9, 9]);
      const rax = part(
        plate,
        layer,
        1,
        "RAX",
        [0.9, 0.16, 1.7],
        [-1.65, 0.07, 0],
        0.8,
        0.3,
      );
      pins(rax, [0.9, 0.16, 1.7], [0, 10]);
      const flags = part(
        plate,
        layer,
        2,
        "FLAGS",
        [0.9, 0.16, 1.7],
        [1.65, 0.07, 0],
        0.8,
        0.3,
      );
      pins(flags, [0.9, 0.16, 1.7], [0, 10]);
      // ZF SF CF OF: four status lamps on the flags register.
      instances(flags, [0.12, 0.02, 0.12], trace, [
        [-0.24, 0.17, 0.55],
        [-0.08, 0.17, 0.55],
        [0.08, 0.17, 0.55],
        [0.24, 0.17, 0.55],
      ]);
      const rip = part(
        plate,
        layer,
        3,
        "RIP",
        [1.6, 0.16, 0.47],
        [0, 0.07, -1.24],
        1.1,
        0.32,
      );
      pins(rip, [1.6, 0.16, 0.47], [12, 0]);
      const buses: [number, number, number][] = [];
      const vias: [number, number, number][] = [];
      for (let n = 0; n < 5; n++) {
        const z = (n - 2) * 0.15;
        buses.push([-0.93, top + 0.006, z], [0.93, top + 0.006, z]);
        vias.push([-1.22, top + 0.008, z], [1.22, top + 0.008, z]);
      }
      instances(plate, [0.5, 0.012, 0.03], trace, buses);
      instances(plate, [0.05, 0.016, 0.05], rim, vias);
      // Operands flow from RAX into the ALU; the result flows out to FLAGS.
      for (let n = 0; n < 5; n++) {
        const z = (n - 2) * 0.15,
          y = top + 0.014;
        pulse(plate, [-1.18, y, z], [-0.68, y, z], (n * 0.37) % 1);
        pulse(plate, [0.68, y, z], [1.18, y, z], (n * 0.37 + 0.5) % 1);
      }
      for (let n = 0; n < 4; n++) {
        const x = (n - 1.5) * 0.15;
        box(plate, [0.03, 0.012, 0.42], [x, top + 0.006, -0.87], trace, 0.006);
        pulse(
          plate,
          [x, top + 0.014, -1.0],
          [x, top + 0.014, -0.7],
          n * 0.25,
          0.3,
        );
      }
      label(plate, "ADD RAX, 3", 2, top + 0.004, 1.2, "#cda86e");
    } else if (layer === 1) {
      for (let index = 0; index < memorySample.length; index++) {
        const x = index % 8,
          z = Math.floor(index / 8);
        const value = memorySample[index]!;
        const cell = part(
          plate,
          layer,
          index,
          value.toString(16).padStart(2, "0").toUpperCase(),
          [0.43, 0.16, 0.5],
          [(x - 3.5) * 0.53, 0.07, (z - 1.5) * 0.7],
          0.36,
          0.24,
        );
        // Non-zero bytes carry a small indicator so the sample reads at a glance.
        if (value)
          box(cell, [0.06, 0.012, 0.06], [0.14, 0.174, -0.17], trace, 0.006);
      }
      const rails: [number, number, number][] = [];
      for (let z = 0; z < 4; z++)
        rails.push([0, top + 0.005, (z - 1.5) * 0.7 + 0.3]);
      instances(plate, [4.1, 0.01, 0.025], ink, rails);
      rails.forEach(([, y, z], n) =>
        pulse(plate, [-2.0, y + 0.008, z], [2.0, y + 0.008, z], n * 0.29, 0.16),
      );
    } else {
      const accents = [0xcda86e, 0x8fa8b6, 0x9c8fb6];
      for (let index = 0; index < 3; index++) {
        const component = part(
          plate,
          layer,
          index,
          [".text", ".data", ".idata"][index]!,
          [1.16, 0.18, 2.55],
          [(index - 1) * 1.39, 0.07, 0],
          1.08,
        );
        const header = new THREE.MeshStandardMaterial({
          color: accents[index],
          roughness: 0.4,
          metalness: 0.6,
        });
        box(component, [0.96, 0.012, 0.06], [0, 0.198, -1.08], header, 0.006);
        label(
          component,
          ["CODE", "DATA", "IMPORTS"][index]!,
          0.86,
          0.199,
          -0.8,
        );
        for (let row = 0; row < 7; row++) {
          const length = 0.72 - ((row * 7) % 4) * 0.1;
          box(
            component,
            [length, 0.01, 0.03],
            [(length - 0.72) / 2, 0.197, 0.35 + row * 0.12],
            ink,
            0.005,
          );
        }
      }
    }
    plates.push(plate);
    root.add(plate);
  }
  return { plates, parts, pulses };
}
