import React from 'react';
import { useNavigate } from 'react-router-dom';
import VortexEntry from '../components/VortexEntry';

const VortexDemo: React.FC = () => {
  const navigate = useNavigate();

  const handleVortexComplete = () => {
    // Navigate to the home page content
    navigate('/home');
  };

  return (
    <div className="relative w-full min-h-screen bg-black">
      <VortexEntry onComplete={handleVortexComplete} />
    </div>
  );
};

export default VortexDemo;
