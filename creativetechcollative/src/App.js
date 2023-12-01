import TeamPage from './team/team';
import ReactGA from 'react-ga';
import React, { useEffect, useState } from 'react';
import './App.css';

ReactGA.initialize('UA-294935751-1'); // Replace with your Google Analytics tracking ID

const AboutOverlay = ({ onClose }) => {
  return (
    <div className="about-overlay">
      
      <div className='aboutcontent'>
      <button className="close-button" onClick={onClose}>X</button>
        <h2>At the Creative Technology Collective, we are a dynamic team of eight creative technologists, blending art and technology to redefine digital expression. Our diverse skills range from software engineering and digital artistry to interactive media and beyond. United by a philosophy of collaborative intelligence, each of us brings unique insights and expertise, fueling innovation and pioneering concepts. </h2>
        <h2>We hold monthly meetups to discuss the latest in the world of creative tech, fostering a space for learning, sharing, and sparking new ideas. Our mission extends beyond creating groundbreaking technology; we aim to inspire and share our collective wisdom with the community, driving forward the future of digital creativity.</h2>
      </div>     
    </div>
  );
};

const Weather = ({ onAboutClick }) => {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      const apiKey = '0128f326def470b7fe59e5815edbc56b';
      const url = `https://api.openweathermap.org/data/2.5/weather?q=Amsterdam&appid=${apiKey}&units=metric`;

      try {
        const response = await fetch(url);
        const data = await response.json();
        setWeather(data);
      } catch (error) {
        console.error('Error fetching weather data:', error);
      }
    };

    fetchWeather();
  }, []);

  if (!weather) {
    return <div>Loading...</div>;
  }

  return (
    <nav className="navbar">
      <div className="nav-brand">  {weather.main.temp}°C Amsterdam </div>
      <div className="nav-links">
        <a href="/about" onClick={onAboutClick}>About</a>
        <a target="_blank" href="mailto:ddpmarshall@gmail.com?subject=I want to support">
        Support us
        </a>

      </div>
    </nav>
  );
};

function App() {
  const [showAbout, setShowAbout] = useState(false);

  const handleAboutClick = (event) => {
    event.preventDefault();
    setShowAbout(true);
  };

  const handleCloseOverlay = () => {
    setShowAbout(false);
  };

  return (
    <>
      <Weather onAboutClick={handleAboutClick} />
      {showAbout && <AboutOverlay onClose={handleCloseOverlay} />}
      <TeamPage />
    </>
  );
}
export default App;
