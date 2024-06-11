import React, { useEffect, useRef, useState } from 'react';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import { db, auth } from '../firebase';
import './styles/CustomVideoPlayer.css';

function CustomVideoPlayer({ onVideoEnd }) {
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [description, setDescription] = useState('');
  const videoRefs = useRef([]);
  const currentIndex = useRef(0);
  const timer = useRef(null);

  useEffect(() => {
    const fetchVideos = async () => {
      const user = auth.currentUser;
      if (user) {
        const videosCollection = collection(db, 'videos');
        const q = query(videosCollection, where('email', '==', user.email));
        const snapshot = await getDocs(q);
        const videos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUploadedVideos(videos);
      }
    };

    fetchVideos();
  }, []);

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files);
    const user = auth.currentUser;

    if (user) {
      // Fetch the user's name
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const userName = userDoc.exists() ? userDoc.data().name : 'Anonymous';

      const videoFiles = await Promise.all(files.map(async file => {
        const url = URL.createObjectURL(file);
        return {
          title: file.name,
          url,
          description: description,
          email: user.email,
          name: userName, // Include the uploader's name
          likes: [],
          comments: []
        };
      }));

      setUploadedVideos(prevVideos => [...prevVideos, ...videoFiles]);

      const videosCollection = collection(db, 'videos');
      try {
        for (const video of videoFiles) {
          await addDoc(videosCollection, {
            title: video.title,
            url: video.url,
            description: video.description,
            email: video.email,
            name: video.name, // Include the uploader's name
            likes: [],
            comments: []
          });
        }
        setDescription('');
      } catch (error) {
        if (error.code === 'permission-denied') {
          alert('Missing or insufficient permissions to upload videos.');
        } else {
          alert('Failed to upload videos. Please try again.');
        }
      }
    } else {
      alert("Please log in to upload videos.");
    }
  };

  const handleDelete = async (index) => {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to delete videos.");
      return;
    }

    const videoToDelete = uploadedVideos[index];
    setUploadedVideos(prevVideos => prevVideos.filter((_, i) => i !== index));

    const videosCollection = collection(db, 'videos');
    try {
      const q = query(videosCollection, where('url', '==', videoToDelete.url));
      const snapshot = await getDocs(q);
      snapshot.forEach(doc => {
        deleteDoc(doc.ref);
      });
    } catch (error) {
      if (error.code === 'permission-denied') {
        alert('Missing or insufficient permissions to delete videos.');
      } else {
        alert('Failed to delete video. Please try again.');
      }
    }
  };

  const showCurrentLocationAndTemperature = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        const apiKey = 'YOUR_API_KEY'; // Replace with your actual API key
        const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${latitude},${longitude}`;

        fetch(url)
          .then(response => {
            if (!response.ok) {
              throw new Error(`API error: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            const temperature = data.current.temp_c;
            alert(`Current Location: (${latitude}, ${longitude}), Temperature: ${temperature}°C`);
          })
          .catch(error => {
            alert(`Failed to fetch weather data: ${error.message}`);
          });
      },
      error => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert("User denied the request for Geolocation.");
            break;
          case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            alert("The request to get user location timed out.");
            break;
          case error.UNKNOWN_ERROR:
            alert("An unknown error occurred.");
            break;
        }
      }
    );
  };

  const handleDoubleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;

    if (x > rect.width / 2) {
      event.target.currentTime += 10;
    } else {
      event.target.currentTime -= 10;
    }
  };

  const handleClick = (event) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const rect = event.target.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (event.detail === 1) {
        if (x > rect.width - 50 && y < 50) {
          showCurrentLocationAndTemperature();
        } else {
          event.target.paused ? event.target.play() : event.target.pause();
        }
      } else if (event.detail === 2) {
        handleDoubleClick(event);
      } else if (event.detail === 3) {
        if (x > rect.width / 2) {
          window.close();
        } else if (x < rect.width / 2) {
          showCommentSection();
        } else {
          moveToNextVideo();
        }
      }
    }, 200);
  };

  const handleHold = (event) => {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;

    if (x > rect.width / 2) {
      event.target.playbackRate = 2;
    } else {
      event.target.playbackRate = 0.5;
    }

    event.target.addEventListener('pointerup', () => {
      event.target.playbackRate = 1;
    }, { once: true });
  };

  const moveToNextVideo = () => {
    if (uploadedVideos.length > 0) {
      currentIndex.current = (currentIndex.current + 1) % uploadedVideos.length;
      const nextVideo = videoRefs.current[currentIndex.current];
      if (nextVideo) {
        nextVideo.src = uploadedVideos[currentIndex.current].url;
        nextVideo.play();
      }
    }
  };

  const showCommentSection = () => {
    alert("Comment Section is now displayed!");
  };

  return (
    <div>
      <div className="upload-section">
        <input
          className="description-input"
          type="text"
          placeholder="Enter video description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label className="upload-label">
          Choose Files
          <input
            className="upload-input"
            type="file"
            accept="video/mp4"
            multiple
            onChange={handleUpload}
          />
        </label>
      </div>
      <div className="uploaded-videos">
        {uploadedVideos.map((video, index) => (
          <div key={index} className="video-container">
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              controls
              onEnded={onVideoEnd}
              src={video.url}
              onClick={handleClick}
              onPointerDown={handleHold}
              volume={1.0}
              muted={false}
            ></video>
            <p>{video.title}</p>
            <p>{video.description}</p>
            <p>Uploaded by: {video.name}</p> {/* Display the uploader's name */}
            <button className="delete-button" onClick={() => handleDelete(index)}>Delete</button>
            <div className="likes-comments-section">
              <p>Likes: {video.likes?.length || 0}</p>
              <div className="comments-list">
                {video.comments?.map((comment, idx) => (
                  <div key={idx} className="comment">
                    <strong>{comment.email}</strong>: {comment.comment}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CustomVideoPlayer;
