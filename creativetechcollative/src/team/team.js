import React from "react";
import "./team.css";
const teamMembers = [
  {
    name: "Angelica Ortiz",
    title: "Senior Creative Technologist",
    image: "./images/4.png",
    linkedin: "https://www.linkedin.com/in/angelicaortiz",
  },
  {
    name: "Jennifer Cohen",
    title: "Senior Creative Technologist",
    image: "./images/5.png",
    linkedin: "https://www.linkedin.com/in/jennifermcohen/",
  },
  {
    name: "James Milton",
    title: "Creative Technologist",
    image: "./images/1.png",
    linkedin: "https://www.linkedin.com/in/jamesmilton",
  },
  {
    name: "Pax (Pakwing) Man",
    title: "Creative Technology Director",
    image: "./images/2.png",
    linkedin: "https://www.linkedin.com/in/paxman",
  },
  {
    name: "Koen Mostert",
    title: "Senior Creative Technologist",
    image: "./images/3.png",
    linkedin: "https://www.linkedin.com/in/koenmostert",
  },
  {
    name: "Deniz Kurt",
    title: "Creative Technologist",
    image: "./images/6.png",
    linkedin: "https://www.linkedin.com/in/denizkurt",
  },
  {
    name: "Dwayne Paisley-Marshall",
    title: "Senior Creative Technologist",
    image: "./images/7.png",
    linkedin: "https://www.linkedin.com/in/dwaynepaisleymarshall",

  },
];

const TeamMember = ({ name, title, image, linkedin }) => (
  <div className="team-member">
    <img src={image} alt={`${name}`} />
    <div className="name-card">
    <div className="name-card-text">
      <h1>{name}</h1>
      <p>{title}</p>
    </div>
    <a href={linkedin} target="_blank" rel="noopener noreferrer" className="linkedin-logo">
      <img src="/images/in.png" alt="LinkedIn" />
    </a>
  </div>
  </div>
);

const TeamPage = () => (
  <div className="team-container">
    <div className="header">
      <h1>
        We are a diverse collective of creative technologists dedicated to
        pushing the boundaries of what's possible
      </h1>
    </div>

   

    <div className="team-grid">
      <div className="visionaries">
        <p>CREATIVE TECH COLLECTIVE</p>
        <h2>Meet the <br /> visionaries</h2>
      </div>
      {teamMembers.map((member, index) => (
        <TeamMember key={index} {...member} />
      ))}
      <div className="meetup-invite">
      <a target="_blank" href="mailto:ddpmarshall@gmail.com?subject=Hosting%20the%20Next%20Meetup">
    <button>Want to host our next meet up?</button>
</a>    </div>
    </div>
    
  </div>
);

export default TeamPage;
