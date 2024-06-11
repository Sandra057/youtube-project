// src/components/Header.js
import React from 'react';
import './styles/Header.css';
import youtubeLogo from '../assets/youtube_logo.jpg'; // Adjust the path based on your file structure

const Header = () => (
  <header className="header">
    <img src={youtubeLogo} alt="YouTube Logo" className="logo" />
    <h1>YouTube</h1>
  </header>
);

export default Header;
