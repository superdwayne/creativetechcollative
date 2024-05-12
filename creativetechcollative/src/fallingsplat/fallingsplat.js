import React, { useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';

const FallingSplat = ({ startX, startY, startZ, endCallback, source }) => {
    const [position, setPosition] = useState([startX, startY, startZ]);

    useEffect(() => {
        const interval = setInterval(() => {
            setPosition(currentPosition => {
                const newY = currentPosition[1] - 0.1; // Adjust fall speed here
                if (newY < -5) { // Assuming -5 is the floor level
                    clearInterval(interval);
                    endCallback(); // Notify to remove the splat
                    return currentPosition;
                }
                return [currentPosition[0], newY, currentPosition[2]];
            });
        }, 50); // Update position every 50ms
        return () => clearInterval(interval);
    }, [endCallback]);

    useFrame(() => {
        // Additional frame-based animations can be handled here if needed
    });

    return <lumaSplats source={source} position={position} scale={0.01} />;
};

export default FallingSplat;
