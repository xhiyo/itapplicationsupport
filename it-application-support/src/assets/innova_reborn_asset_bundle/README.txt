INNOVA REBORN INSPIRED GLB ASSET

Isi:
- public/models/innova-reborn.glb
- src/components/CarModel.jsx

Cara pakai di React Three Fiber:
1. Copy folder public/models ke project kamu.
2. Copy CarModel.jsx ke src/components.
3. Panggil di scene:

   import CarModel from "./components/CarModel";

   <CarModel position={[0, 0, 0]} scale={0.75} />

Install dependency jika belum ada:
   npm install three @react-three/fiber @react-three/drei

Catatan:
Ini model GLB custom low-poly yang terinspirasi dari Kijang Innova Reborn untuk kebutuhan web portfolio.
Bukan CAD/model pabrikan resmi, tapi sudah berbentuk file GLB siap load di browser.
