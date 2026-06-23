import { useGLTF } from "@react-three/drei";

export default function CarModel({
  position = [0, 0, 0],
  rotation = [0, Math.PI, 0],
  scale = 0.75,
}) {
  const { scene } = useGLTF("/models/innova-reborn.glb");

  return (
    <primitive
      object={scene}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}

useGLTF.preload("/models/innova-reborn.glb");
