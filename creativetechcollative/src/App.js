
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Canvas, extend } from '@react-three/fiber';
import { LumaSplatsThree } from "@lumaai/luma-web";
import TeamPage from './team/teampage';
import HorizontalScrollingText from './htext/htext';

import HamburgerMenu from './hamburger/hamburger'; // Adjust the path as necessary

// import SceneWithLumaSplats from './splat/splat'
import ReactGA from 'react-ga';
import './App.css';

// Extend R3F to recognize LumaSplats
extend({ LumaSplats: LumaSplatsThree });

const TRACKING_ID = "UA-294935751-1"; // Your tracking ID
ReactGA.initialize(TRACKING_ID);



function App() {


    const [pixels, setPixels] = useState([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const newPixel = {
                id: Math.random(),
                startX: Math.random() * window.innerWidth
            };
            setPixels(currentPixels => [...currentPixels, newPixel]);
        }, 150); // Create a new pixel every 150ms

        return () => clearInterval(interval);
    }, []);

    const removePixel = id => {
        setPixels(currentPixels => currentPixels.filter(pixel => pixel.id !== id));
    };

  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(3);
  const [pageColor, setPageColor] = useState('#000');
  const [contentVisible, setContentVisible] = useState(false);
  const [animationPlayed, setAnimationPlayed] = useState(false);

  const handleMouseMove = (event) => {
    setCursorPos({ x: event.clientX, y: event.clientY });
  };

  const handleMouseDown = () => {
    setScale(currentScale => currentScale + 0.1);
  };

  const handleMouseUp = () => {
    setScale(1); // Reset scale to 1 on mouse up
  };

  const handleIconClick = () => {
    if (!animationPlayed) {
      setPageColor('#FFF'); // Change the background color
      setTimeout(() => {
        setContentVisible(true); // Show the content after the color transition
        setAnimationPlayed(true);
      }, 500);
    } else {
      setContentVisible(false); // Hide the content
      setTimeout(() => {
        setPageColor('#000'); // Change the background color back
        setAnimationPlayed(false);
      }, 500);
    }
  };



  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <>
        <Router>
        <HamburgerMenu />
       
    </Router>
   
    <div className='mobile' style={{ width: '90vw', height: '90vh', overflow: 'hidden', margin: '0px auto' }}>
      <iframe
        src="https://unicorn.studio/embed/0jXySgHZoWysSC5mZKqm?scale=1&fps=60"
        style={{ width: '100%', height: '100%', border: 'none' }}
        loading="lazy"
        title="Unicorn Studio Embed"
      ></iframe>
    </div>

    <TeamPage />
    {/* <HorizontalScrollingText /> */}
    <footer className="footer team-container">
      <div className="footer-content">
        <div className="footer-section left">
      
         
        </div>
        <div className="footer-section right">
          <div className="social-links">
            <a href="https://www.instagram.com/creativetechnologist.nl/">Instagram</a>
            <a href="https://www.linkedin.com/company/creativetechnologycollective/">Linked-in</a>
          </div>
        </div>
      </div>
    </footer>
   
    </>
);
}
export default App;

