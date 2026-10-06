import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { DERIVED } from "../brand";

// A 3D specimen on a turntable. Rotation is a pure function of the frame (never useFrame), so
// every frame renders identically in parallel workers. Transparent background: the Plate's
// archival white shows through; only a soft floor shadow is drawn.

type ModelProps = { src: string; clay: boolean; angle: number; tilt: number; aspect: number };

const Model: React.FC<ModelProps> = ({ src, clay, angle, tilt, aspect }) => {
  const { scene } = useGLTF(src);
  const { camera } = useThree();
  const prepared = useMemo(() => {
    const root = scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 2 / Math.max(size.x, size.y, size.z, 1e-6);
    root.position.set(-center.x, -box.min.y, -center.z); // centred, standing on the floor
    const material = new THREE.MeshStandardMaterial({ color: DERIVED.clay, roughness: 0.82, metalness: 0 });
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (clay) mesh.material = material;
    });
    return { root, scale, size, height: size.y * scale };
  }, [scene, clay]);
  // Frame the model: bounding sphere fits the vertical field of view with a margin, camera 16 deg
  // above the horizon. Set synchronously so every frame (and every worker) sees the same camera.
  const cam = camera as THREE.PerspectiveCamera;
  const r = Math.hypot(prepared.size.x, prepared.size.y, prepared.size.z) * 0.5 * prepared.scale;
  const cy = prepared.height / 2;
  const fov = 30;
  const vHalf = (fov * Math.PI) / 360;
  const hHalf = Math.atan(Math.tan(vHalf) * aspect);
  const d = (r * 1.18) / Math.sin(Math.min(vHalf, hHalf));
  const el = (16 * Math.PI) / 180;
  cam.fov = fov;
  cam.position.set(0, cy + d * Math.sin(el), d * Math.cos(el));
  cam.lookAt(0, cy * 0.92, 0);
  cam.updateProjectionMatrix();
  return (
    <group rotation={[tilt, angle, 0]}>
      <group scale={prepared.scale}>
        <primitive object={prepared.root} />
      </group>
    </group>
  );
};

export type TurntableProps = {
  src: string;
  width: number;
  height: number;
  clay?: boolean;
  /** Seconds per full revolution. */
  period?: number;
  /** Starting angle in degrees (pick the most flattering view for frame 0). */
  startAngle?: number;
};

export const Turntable: React.FC<TurntableProps> = ({ src, width: rawW, height: rawH, clay = false, period = 9, startAngle = -30 }) => {
  const width = Math.round(rawW); // ThreeCanvas requires integer sizes
  const height = Math.round(rawH);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const angle = (startAngle * Math.PI) / 180 + (frame / fps) * ((2 * Math.PI) / period);
  return (
    <ThreeCanvas
      width={width}
      height={height}
      shadows
      gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      camera={{ position: [0, 1.55, 5.2], fov: 30, near: 0.1, far: 100 }}
      style={{ background: "transparent" }}
    >
      {/* Soft studio: hemisphere wash, a large key from upper right, a weak fill from the left. */}
      <hemisphereLight args={["#F2F3EC", "#8C938D", 1.1]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[1.5, 7, 2.5]}
        intensity={2.1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-radius={12}
        shadow-bias={-0.0004}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
      <directionalLight position={[-4, 2.5, 2]} intensity={0.55} />
      <Model src={src} clay={clay} angle={angle} tilt={0} aspect={width / height} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial transparent opacity={0.12} />
      </mesh>
    </ThreeCanvas>
  );
};
