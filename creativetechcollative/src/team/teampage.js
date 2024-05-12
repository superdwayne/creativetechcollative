import React from 'react';
import "./team.css";
import SceneWithLumaSplats from '../splat/splatscene';

const TeamPage = () => {
  const teamMembers = [
    { id: 1, imageUrl: 'https://www.creativetechnologists.nl/images/7.png', name: 'Dwayne Paisley-Marshall', title: 'Lead Creative Technologist' , splatSource: '' },
    { id: 2, imageUrl: 'https://www.creativetechnologists.nl/images/2.png', name: 'Pax (Pakwing) Man', title: 'Creative Technology Director' ,  splatSource: 'path/to/splat2.jpg' },
    { id: 3, imageUrl: 'https://www.creativetechnologists.nl/images/5.png', name: 'Jennifer Cohen', title: 'Senior Creative Technologist' ,  splatSource: 'path/to/splat3.jpg' },
    { id: 4, imageUrl: 'https://www.creativetechnologists.nl/images/6.png', name: 'Deniz Kurt', title: 'Senior Creative Technologist' ,  splatSource: 'path/to/splat4.jpg' },
    { id: 5, imageUrl: 'https://www.creativetechnologists.nl/images/3.png', name: 'Koen Mostert', title: 'Senior Creative Technologist' ,  splatSource: 'path/to/splat5.jpg' },
    { id: 6, imageUrl: 'https://www.creativetechnologists.nl/images/1.png', name: 'James Milton', title: 'Creative Technologist' , splatSource: 'path/to/splat6.jpg' }
  ];

  return (
    <div className="team-container">
      {teamMembers.map(member => (
        <div key={member.id} className="team-member">
          <div className="image-container">
            <img src={member.imageUrl} alt={member.name} className="profile-image"/>
            <div className="splat-overlay">
              {/* <SceneWithLumaSplats source={member.splatSource} /> */}
            </div>
            <div class="name-card"><div class="name-card-text"><h1>{member.name}</h1><p>{member.title}</p></div><a href="https://www.linkedin.com/in/jamesxdigital/" target="_blank" rel="noopener noreferrer" class="linkedin-logo"></a></div>

          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamPage;
