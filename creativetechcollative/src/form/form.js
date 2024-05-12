import React, { useState } from 'react';
import { supabase } from '../super'; // Ensure the path matches your setup


const SignupForm = () => {

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
    setMessage('Email saved successfully!');
    setEmail(''); // Clear the input after successful submission
  }
};



  return (
    <form onSubmit={handleSubmit}>
<input
  type="email"
  placeholder="Enter your email here"
  value={email}
  onChange={handleEmailChange}
  required
/>
<button type="submit">Subscribe</button>
{message && <p>{message}</p>}
</form> 

  );
};

export default SignupForm;
