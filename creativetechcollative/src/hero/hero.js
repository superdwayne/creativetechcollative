import React from 'react';

const UnicornStudioEmbed = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <iframe
        src="https://unicorn.studio/embed/0jXySgHZoWysSC5mZKqm?scale=1&dpi=undefined&fps=60"
        style={{ width: '100%', height: '100%', border: 'none' }}
        loading="lazy"
        title="Unicorn Studio Embed"
      ></iframe>
    </div>
  );
};

export default UnicornStudioEmbed;
