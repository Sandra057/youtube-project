import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, where, doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from '../firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/Feed.css';

function Feed() {
  const [videos, setVideos] = useState([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const fetchVideos = async () => {
      const user = auth.currentUser;
      if (user) {
        const videosCollection = collection(db, 'videos');
        const q = query(videosCollection, where('email', '!=', user.email));
        const snapshot = await getDocs(q);
        const videosData = snapshot.docs.map(doc => ({
          id: doc.id,
          likes: [], // Provide default value
          comments: [], // Provide default value
          ...doc.data()
        }));
        setVideos(videosData);
      }
    };

    fetchVideos();
  }, []);

  const handleVideoWatch = async (videoId) => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          let userPoints = userDoc.data().points || 0;
          let watchedVideos = userDoc.data().watchedVideos || [];
  
          if (!watchedVideos.includes(videoId)) {
            watchedVideos.push(videoId);
            userPoints += 5;
  
            await updateDoc(userDocRef, {
              points: userPoints,
              watchedVideos: watchedVideos
            });
  
            toast.success('You have gained 5 points!', {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            });
          }
        } else {
          console.error("User document does not exist");
        }
      } catch (error) {
        console.error("Error fetching user document: ", error);
      }
    } else {
      alert("Please log in to watch videos.");
    }
  };

  const handleLike = async (videoId) => {
    const user = auth.currentUser;
    if (user) {
      const videoDocRef = doc(db, 'videos', videoId);
      const videoDoc = await getDoc(videoDocRef);
      const likes = videoDoc.data().likes || [];

      if (!likes.includes(user.uid)) {
        likes.push(user.uid);
        await updateDoc(videoDocRef, { likes });

        setVideos(prevVideos =>
          prevVideos.map(video =>
            video.id === videoId ? { ...video, likes } : video
          )
        );
      }
    } else {
      alert("Please log in to like videos.");
    }
  };

  const handleAddComment = async (videoId) => {
    const user = auth.currentUser;
    if (user && commentText.trim()) {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const userName = userDoc.exists() ? userDoc.data().name : 'Anonymous';

      const videoDocRef = doc(db, 'videos', videoId);
      const videoDoc = await getDoc(videoDocRef);
      const comments = videoDoc.data().comments || [];

      comments.push({ name: userName, comment: commentText });
      await updateDoc(videoDocRef, { comments });

      setVideos(prevVideos =>
        prevVideos.map(video =>
          video.id === videoId ? { ...video, comments } : video
        )
      );
      setCommentText('');
    } else {
      alert("Please log in and enter a comment.");
    }
  };

  return (
    <div className="feed">
      <ToastContainer />
      {videos.map(video => (
        <div key={video.id} className="video-card">
          <video
            width="100%"
            controls
            src={video.url}
            onEnded={() => handleVideoWatch(video.id)}
          ></video>
          <div className="video-details">
            <p><strong>Description:</strong> {video.description}</p>
            <p><strong>Uploaded by:</strong> {video.name}</p> {/* Display the uploader's name */}
          </div>
          <button className="like-button" onClick={() => handleLike(video.id)}>
            Like ({video.likes?.length || 0})
          </button>
          <div className="comments-section">
            <input
              type="text"
              placeholder="Add a comment"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button onClick={() => handleAddComment(video.id)}>Comment</button>
            <div className="comments-list">
              {video.comments?.map((comment, idx) => (
                <div key={idx} className="comment">
                  <strong>{comment.name}</strong>: {comment.comment}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Feed;
