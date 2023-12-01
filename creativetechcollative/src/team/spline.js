import React, { useEffect, useRef } from 'react';
import { Application } from '@splinetool/runtime';

const SplineApp = ({ splineUrl }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    let app;
    if (canvasRef.current) {
      app = new Application(canvasRef.current);
      app.load(splineUrl);

      const disableScroll = (event) => {
        event.preventDefault();
      };

      // Add event listeners to the current canvas
      canvasRef.current.addEventListener('wheel', disableScroll, { passive: false });
      canvasRef.current.addEventListener('touchmove', disableScroll, { passive: false });

      return () => {
        // Remove event listeners
        canvasRef.current.removeEventListener('wheel', disableScroll);
        canvasRef.current.removeEventListener('touchmove', disableScroll);

        // Cleanup when the component unmounts
        if (app) {
          app.dispose();
        }
      };
    }
  }, [splineUrl]);

  return <canvas ref={canvasRef} className="spline-canvas" />;
};

export default SplineApp;
