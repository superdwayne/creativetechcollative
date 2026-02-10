import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../super'; // Ensure the path matches your setup


const SignupForm = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
const [message, setMessage] = useState('');

const handleEmailChange = (event) => {
  setEmail(event.target.value);
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const { data, error } = await supabase
    .from('emails') // Ensure your table is named 'emails'
    .insert([{ email: email }]);

  if (error) {
    setMessage('Error: ' + error.message);
  } else {
    navigate(`/create-password?email=${encodeURIComponent(email)}`);
  }
};



  return (
    <form onSubmit={handleSubmit} className='mobilehide'>
<input
  type="email"
  placeholder="Enter your email here"
  value={email}
  onChange={handleEmailChange}
  autoComplete="off"
  required
/>
<button type="submit">Sign Up</button>
{message && <p>{message}</p>}
</form> 

  );
};

export default SignupForm;
