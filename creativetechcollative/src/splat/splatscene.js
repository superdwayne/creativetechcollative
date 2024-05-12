import React, { Suspense } from 'react';
import { Canvas, extend, useThree } from '@react-three/fiber';
import { LumaSplatsThree } from "@lumaai/luma-web";
import { OrbitControls } from '@react-three/drei';

// Extend R3F to recognize LumaSplats
extend({ LumaSplats: LumaSplatsThree });

function SceneWithLumaSplats({ source }) {
  return (
    <Canvas style={{ width: '50vw', height: '50vh' }}>
      <ambientLight />
      <OrbitControls />
      <pointLight position={[10, 10, 10]} />
      <Suspense fallback={<div>Loading...</div>}>
        <lumaSplats
          source={source}
          position={[-1, 0, 0]}
          scale={1.5}
          rotation={[0, Math.PI / 2, 0]}  // Rotation in radians
        />
      </Suspense>
    </Canvas>
  );
}

export default SceneWithLumaSplats;
