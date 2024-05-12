import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SignupForm from  '../form/form'

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div className="hamburger-icon" onClick={toggleMenu}>
        {isOpen ? 'X' : '☰'}
      </div>
      {isOpen && (
        <div className="menu">
          
          <h1 className='mobile'>At the Creative Technology Collective, we believe that Creative Technologists are the natural progression of innovation.
            Our mission is to illuminate the endless possibilities that creative technology holds for innovation, expression, and problem-solving. <br /><br />
            We make Creative Technology accessible to everyone—artists, creators, educators, students, and innovators—empowering them to discover and harness new tools and techniques that turn imagination into reality. 
            <br /><br />
            Each month, we partner with different creative studios to enhance our mission, bringing unique perspectives and expertise that enrich our community's experience and output. 
          <br /><br />
           Want to join our next meet up? <SignupForm />
            </h1>

        

            
      
        </div>
        
      )}
    </>
  );
};

export default HamburgerMenu;
