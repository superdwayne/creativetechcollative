import React from "react";
import "./team.css";
const teamMembers = [
    {
        name: "Dwayne Paisley-Marshall",
        title: "Senior Creative Technologist",
        image: "./images/7.png",
        linkedin: "https://www.linkedin.com/in/ddpmarshall/",
    
      },
  
  {
    name: "James Milton",
    title: "Creative Technologist",
    image: "./images/1.png",
    linkedin: "https://www.linkedin.com/in/jamesxdigital/",
  },
  {
    name: "Pax (Pakwing) Man",
    title: "Creative Technology Director",
    image: "./images/2.png",
    linkedin: "https://www.linkedin.com/in/pax-man-b0173047/",
  },
  
  
  {
    name: "Jennifer Cohen",
    title: "Senior Creative Technologist",
    image: "./images/5.png",
    linkedin: "https://www.linkedin.com/in/jennifermcohen/",
  },
  {
    name: "Angelica Ortiz",
    title: "Senior Creative Technologist",
    image: "./images/4.png",
    linkedin: "https://www.linkedin.com/in/angelicaortiz",
  },
  
  
  {
    name: "Deniz Kurt",
    title: "Creative Technologist",
    image: "./images/6.png",
    linkedin: "https://www.linkedin.com/in/denizezgikurt/",
  },
  {
    name: "Koen Mostert",
    title: "Senior Creative Technologist",
    image: "./images/3.png",
    linkedin: "https://www.linkedin.com/in/koenmostert",
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
   

    <div className="grid-container">
      <div className="flex-row">
        <div className="flex-cell">
          {" "}
          <h1>
            The Creative Technology Collective is a dynamic team of creative
            technologists blending art and tech to redefine creative expression.
          </h1>
        </div>
        <div className="flex-cell">
          {" "}
          <h3>
            United by a philosophy of collaborative intelligence, each of us
            brings unique insights and expertise, fueling innovation and
            pioneering concepts.
          </h3>
        </div>
      </div>
      <div className="flex-row">
        <div className="flex-cell">
          {" "}
          <h3>
            Our mission extends beyond creating groundbreaking technology; we
            aim to inspire and share our collective wisdom with the community,
            driving forward the future of creativity and technology.
          </h3>
        </div>
        <div className="flex-cell">
          {" "}
          <h1>
            We hold meetups to discuss the latest in the world of creative tech,
            fostering a space for learning, sharing, and sparking new ideas.
          </h1>
        </div>
      </div>
    </div>

    <div className="team-grid">
      <div className="visionaries">
        <p>CREATIVE TECH COLLECTIVE</p>
        <h2>
          Members
        </h2>
      </div>
      {teamMembers.map((member, index) => (
        <TeamMember key={index} {...member} />
      ))}
      <div className="meetup-invite">
        <a
          target="_blank"
          href="mailto:ddpmarshall@gmail.com?subject=Hosting%20the%20Next%20Meetup"
        >
          <button>Want to host our next meet up?</button>
        </a>{" "}
      </div>
    </div>
  </div>
);

export default TeamPage;
