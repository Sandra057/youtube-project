import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase'; // Make sure to import auth and db from firebase
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import './Auth.css';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [profilePicFile, setProfilePicFile] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store additional user information in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        name: name,
        profilePic: profilePic,
        points: 0,
        watchedVideos: []
      });

      alert('User created successfully');
      navigate('/video'); // Navigate to video page after successful sign-up
    } catch (err) {
      console.error('Error signing up:', err);
      alert('Error signing up: ' + err.message);
    }
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="signup-container">
      {profilePic && (
        <div className="profile-pic-container">
          <img src={profilePic} alt="Profile" className="profile-pic-preview" />
        </div>
      )}
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Sign Up</h2>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleProfilePicChange}
          required
        />
        <button type="submit">Sign Up</button>
        <a href="/login">Already have an account? Login</a>
      </form>
    </div>
  );
};

export default SignUp;

