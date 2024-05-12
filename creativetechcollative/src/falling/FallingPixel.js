import React, { useState, useEffect } from 'react';

const FallingPixel = ({ startX, endCallback, color }) => {
    const [top, setTop] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTop(prevTop => {
                const newTop = prevTop + 2; // Speed of the falling pixel
                if (newTop > window.innerHeight) {
                    clearInterval(interval);
                    endCallback(); // Call the parent to indicate the pixel should be removed
                    return prevTop;
                }
                return newTop;
            });
        }, 20); // Update position every 20ms

        return () => clearInterval(interval);
    }, [endCallback]);

    return (
        <div style={{
            position: 'absolute',
            left: `${startX}px`,
            top: `${top}px`,
            width: '50px',
            height: '50px',
            backgroundColor: color, // Use the passed color
            opacity: 0.8,
        }} />
    );
};

export default FallingPixel;
