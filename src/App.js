import React, { useState, useEffect } from 'react';
import { Route, Routes, Link, useNavigate, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import CustomVideoPlayer from './components/CustomVideoPlayer';
import VideoCall from './components/VideoCall';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Feed from './components/Feed';
import Profile from './components/Profile';
import { auth, db } from './firebase'; // Import db for updating points
import { doc, updateDoc, increment, getDoc } from "firebase/firestore"; // Import getDoc

function App() {
  const [points, setPoints] = useState(0);
  const [isAuth, setIsAuth] = useState(false);
  const navigate = useNavigate();

  const handleVideoEnd = async () => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        points: increment(5)
      });
      fetchPoints(); // Fetch updated points
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setIsAuth(true);
        fetchPoints();
      } else {
        setIsAuth(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchPoints = async () => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setPoints(userDoc.data().points || 0);
      }
    }
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      setIsAuth(false);
      navigate('/login');
    });
  };

  return (
    <div className="App">
      <Header />
      <div className="top-right-button">
        {isAuth ? (
          <>
            <Link to="/"><button>Home</button></Link>
            <Link to="/videocall"><button>Call</button></Link>
            <Link to="/feed"><button>Feed</button></Link>
            <Link to="/profile"><button>Profile</button></Link>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login"><button>Login</button></Link>
            <Link to="/signup"><button>Sign Up</button></Link>
          </>
        )}
      </div>
      <main>
        <Routes>
          <Route path="/" element={isAuth ? <VideoPage onVideoEnd={handleVideoEnd} /> : <Navigate to="/login" />} />
          <Route path="/videocall" element={isAuth ? <VideoCall /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login setAuth={setIsAuth} />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/video" element={isAuth ? <VideoPage onVideoEnd={handleVideoEnd} /> : <Navigate to="/login" />} />
          <Route path="/feed" element={isAuth ? <Feed /> : <Navigate to="/login" />} />
          <Route path="/profile" element={isAuth ? <Profile /> : <Navigate to="/login" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

const Home = ({ points }) => (
  <>
    <h1 className="user-points">Points: {points}</h1>
  </>
);

const VideoPage = ({ onVideoEnd }) => (
  <>
    <CustomVideoPlayer onVideoEnd={onVideoEnd} />
  </>
);

export default App;
