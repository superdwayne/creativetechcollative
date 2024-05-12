import React, { useEffect, useState } from 'react';
import FallingPixel from './FallingPixel'; // Ensure you import your FallingPixel component

const SpectrumAnimation = () => {
    const [pixels, setPixels] = useState([]);

    // Function to add a new pixel
    const addPixel = () => {
        const startX = Math.random() * window.innerWidth;
        const color = `hsl(${Math.random() * 360}, 100%, 50%)`; // Generates a random color in HSL format
        const id = Math.random();

        // Add new pixel to the state
        setPixels(prevPixels => [...prevPixels, { id, startX, color }]);
    };

    // Function to remove a pixel
    const removePixel = id => {
        setPixels(prevPixels => prevPixels.filter(pixel => pixel.id !== id));
    };

    // Effect to start adding pixels automatically
    useEffect(() => {
        const interval = setInterval(addPixel, 1000); // Adds a new pixel every 1000ms (1 second)
        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, []);

    return (
        <div style={{ position: 'absolute', width: '50%', height: '50vh' , zIndex: 1  }}>
            {pixels.map(pixel => (
                <FallingPixel
                    key={pixel.id}
                    startX={pixel.startX}
                    endCallback={() => removePixel(pixel.id)}
                    color={pixel.color} // Use the color passed as a prop to FallingPixel
                />
            ))}
        </div>
    );
};

export default SpectrumAnimation;
