import React, { useEffect, useState } from 'react';
import { db, auth, storage } from '../firebase'; // Correct the import path and include storage
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import './styles/Profile.css';

function Profile() {
  // State variables for profile information
  const [points, setPoints] = useState(0);
  const [watchedVideos, setWatchedVideos] = useState([]);
  const [email, setEmail] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('');
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [newProfilePicURL, setNewProfilePicURL] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      const user = auth.currentUser;
      if (user) {
        console.log("User ID:", user.uid); // Debug user UID
        setEmail(user.email);
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("Fetched user data:", userData); // Debug fetched data
          setPoints(userData.points || 0);
          console.log("Points:", userData.points); // Debug points
          setWatchedVideos(userData.watchedVideos || []);
          console.log("Watched Videos:", userData.watchedVideos); // Debug watched videos
          setProfilePic(userData.profilePic || '');
          console.log("Profile Pic URL:", userData.profilePic); // Debug profile pic
          setName(userData.name || '');
          console.log("Name:", userData.name); // Debug name
          setPhone(userData.phone || '');
          console.log("Phone:", userData.phone); // Debug phone
          setAddress(userData.address || '');
          console.log("Address:", userData.address); // Debug address
          setBirthday(userData.birthday || '');
          console.log("Birthday:", userData.birthday); // Debug birthday
          setGender(userData.gender || '');
          console.log("Gender:", userData.gender); // Debug gender
          setSkills(userData.skills || []);
          console.log("Skills:", userData.skills); // Debug skills
        } else {
          console.log("User document does not exist.");
        }
      } else {
        console.log("No user is authenticated.");
      }
    };

    fetchProfileData();
  }, []);

  // Function to handle saving profile changes
  const handleSave = async () => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);

      if (newProfilePic) {
        const profilePicRef = ref(storage, `profilePictures/${user.uid}`);
        await uploadBytes(profilePicRef, newProfilePic);
        const profilePicURL = await getDownloadURL(profilePicRef);
        setProfilePic(profilePicURL);
        await updateDoc(userDocRef, { profilePic: profilePicURL });
      }

      await updateDoc(userDocRef, {
        name,
        phone,
        address,
        birthday,
        gender,
        skills
      });
      alert('Profile updated successfully!');
    }
  };

  // Function to reset points and watched videos
  const handleResetPoints = async () => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { points: 0, watchedVideos: [] });
      setPoints(0);
      setWatchedVideos([]);
      alert('Points reset and watched videos cleared successfully!');
    }
  };

  // Function to add a new skill
  const addSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  // Function to remove a skill
  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  // Function to handle profile picture change
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewProfilePic(file);
      setNewProfilePicURL(URL.createObjectURL(file));
    }
  };

  return (
    <div className="profile">
      <div className="profile-header">
        <img src={newProfilePicURL || profilePic} alt="Profile Pic" />
        <div className="info">
          <h1>{name}</h1>
          <p>POINTS: {points}</p>
        </div>
      </div>
      <div className="profile-pic-upload">
        <input type="file" id="profilePicInput" onChange={handleProfilePicChange} />
        <label htmlFor="profilePicInput">Change Profile Picture</label>
      </div>
      <div className="contact-info">
        <div>
          <h3>Contact Information</h3>
          <p>
            <strong>Phone:</strong>
            <input 
              type="text" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
            />
          </p>
          <p>
            <strong>Address:</strong>
            <input 
              type="text" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
            />
          </p>
          <p>
            <strong>Email:</strong>
            <a href={`mailto:${email}`}>{email}</a>
          </p>
        </div>
        <div>
          <h3>Basic Information</h3>
          <p>
            <strong>Birthday:</strong>
            <input 
              type="date" 
              value={birthday} 
              onChange={(e) => setBirthday(e.target.value)} 
            />
          </p>
          <p>
            <strong>Gender:</strong>
            <input 
              type="text" 
              value={gender} 
              onChange={(e) => setGender(e.target.value)} 
            />
          </p>
        </div>
      </div>
      <button onClick={handleSave}>Save</button>
      <button onClick={handleResetPoints}>Reset Points</button>
      <div className="skills">
        <h3>Skills</h3>
        <ul>
          {skills.map(skill => (
            <li key={skill}>
              {skill}
              <button onClick={() => removeSkill(skill)}>🙅</button>
            </li>
          ))}
        </ul>
        <input 
          type="text" 
          className="add-skill-input"
          value={newSkill} 
          onChange={(e) => setNewSkill(e.target.value)} 
          placeholder="Add new skill" 
        />
        <button className="add-skill-button" onClick={addSkill}>Add Skill</button>
      </div>
      <div className="watched-videos">
        <h3>Watched Videos</h3>
        <table>
          <thead>
            <tr>
              <th>Title</th>
            </tr>
          </thead>
          <tbody>
            {watchedVideos.map((video, index) => (
              <tr key={index}>
                <td>{video}</td> {/* Displaying raw video ID for now */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="terms-container">
        <h2>Terms and Conditions:</h2>
        <p>Welcome to our application. By using our services, you agree to comply with and be bound by the following terms and conditions of use. Please review the following terms carefully.</p>
        <h3>1. Acceptance of Agreement</h3>
        <p>You agree to the terms and conditions outlined in this Terms and Conditions Agreement ("Agreement") with respect to our application ("App"). This Agreement constitutes the entire and only agreement between us and you, and supersedes all prior or contemporaneous agreements, representations, warranties, and understandings with respect to the App, the content, products, or services provided by or through the App, and the subject matter of this Agreement.</p>
        <h3>2. Use of the App</h3>
        <p>You agree to use the App only for lawful purposes. You agree not to take any action that might compromise the security of the App, render the App inaccessible to others, or otherwise cause damage to the App or its content.</p>
        <h3>3. User Account</h3>
        <p>To use certain features of the App, you may be required to register for an account. You agree to provide true, accurate, current, and complete information about yourself as prompted by the App's registration form.</p>
        <h3>4. Privacy</h3>
        <p>Your use of the App is also governed by our Privacy Policy. By using the App, you consent to the collection and use of information as described in the Privacy Policy.</p>
      </div>
    </div>
  );
}

export default Profile;
