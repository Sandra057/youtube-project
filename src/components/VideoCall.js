import React, { useRef, useState, useEffect } from 'react';
import SimplePeer from 'simple-peer';
import './styles/VideoCall.css';
import { v4 as uuidv4 } from 'uuid';

function VideoCall() {
  const localVideoRef = useRef(null);
  const [remoteVideos, setRemoteVideos] = useState([]);
  const peersRef = useRef([]);
  const wsRef = useRef(null);
  const [callId, setCallId] = useState('');
  const [isCallAllowed, setIsCallAllowed] = useState(checkCallAllowed());
  const [isCallCreated, setIsCallCreated] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [stream, setStream] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsCallAllowed(checkCallAllowed());
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  function checkCallAllowed() {
    const now = new Date();
    const hours = now.getHours();
    return hours >= 8 && hours < 24;
  }

  const startCall = (stream) => {
    const peer = new SimplePeer({ initiator: true, stream: stream });

    peer.on('signal', data => {
      wsRef.current.send(JSON.stringify({ type: 'signal', signal: data, callId }));
    });

    peer.on('stream', stream => {
      addRemoteStream(stream);
    });

    peersRef.current.push({ id: callId, peer });
  };

  const joinCall = (callId) => {
    wsRef.current = new WebSocket('ws://localhost:3001');

    wsRef.current.onopen = () => {
      wsRef.current.send(JSON.stringify({ type: 'join-call', callId }));
    };

    wsRef.current.onmessage = (message) => {
      const data = JSON.parse(message.data);
      handleWebSocketMessage(data);
    };

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setStream(stream);
        localVideoRef.current.srcObject = stream;
        const peer = new SimplePeer({ initiator: false, stream: stream });

        peer.on('signal', data => {
          wsRef.current.send(JSON.stringify({ type: 'signal', signal: data, callId }));
        });

        peer.on('stream', stream => {
          addRemoteStream(stream);
        });

        peersRef.current.push({ id: callId, peer });
      })
      .catch(error => {
        console.error('Error accessing media devices:', error);
        alert('Could not access your camera and/or microphone.');
      });
  };

  const createCall = () => {
    if (isCallAllowed) {
      wsRef.current = new WebSocket('ws://localhost:3001');

      wsRef.current.onopen = () => {
        wsRef.current.send(JSON.stringify({ type: 'create-call' }));
      };

      wsRef.current.onmessage = (message) => {
        const data = JSON.parse(message.data);
        handleWebSocketMessage(data);
      };
    } else {
      alert('Calls are only allowed between 8 AM and 12 AM.');
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'call-created':
        setCallId(data.callId);
        setIsCallCreated(true);
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(stream => {
            setStream(stream);
            localVideoRef.current.srcObject = stream;
            startCall(stream);
          })
          .catch(error => {
            console.error('Error accessing media devices:', error);
            alert('Could not access your camera and/or microphone.');
          });
        break;
      case 'signal':
        const peer = peersRef.current.find(p => p.id === data.callId).peer;
        if (peer) {
          peer.signal(data.signal);
        } else {
          const newPeer = new SimplePeer({ initiator: false, stream: stream });
          newPeer.signal(data.signal);
          peersRef.current.push({ id: data.callId, peer: newPeer });
          newPeer.on('stream', stream => {
            addRemoteStream(stream);
          });
        }
        break;
      case 'call-joined':
        setCallId(data.callId);
        break;
      case 'call-not-found':
        alert('Call not found');
        break;
      default:
        break;
    }
  };

  const addRemoteStream = (stream) => {
    setRemoteVideos(prevRemoteVideos => [
      ...prevRemoteVideos,
      { id: uuidv4(), stream }
    ]);
  };

  const shareScreen = () => {
    if (isCallCreated) {
      navigator.mediaDevices.getDisplayMedia({ video: true })
        .then(screenStream => {
          const screenTrack = screenStream.getTracks()[0];
          peersRef.current.forEach(({ peer }) => {
            const sender = peer._pc.getSenders().find(s => s.track.kind === 'video');
            sender.replaceTrack(screenTrack);
          });

          screenTrack.onended = () => {
            const originalTrack = stream.getVideoTracks()[0];
            peersRef.current.forEach(({ peer }) => {
              const sender = peer._pc.getSenders().find(s => s.track.kind === 'video');
              sender.replaceTrack(originalTrack);
            });
          };
        })
        .catch(error => {
          console.error('Error sharing screen:', error);
          alert('Could not share screen.');
        });
    } else {
      alert('No active call to share screen.');
    }
  };

  const toggleCamera = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = !isCameraOn;
      setIsCameraOn(!isCameraOn);
    }
  };

  const recordStream = () => {
    if (isCallCreated) {
      const mediaRecorder = new MediaRecorder(localVideoRef.current.srcObject);
      let chunks = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recorded_video.webm';
        a.click();
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 10000); // Record for 10 seconds
    } else {
      alert('No active call to record.');
    }
  };

  const endCall = () => {
    // Close WebSocket connection
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'end-call', callId }));
      wsRef.current.close();
    }

    // Close all peer connections
    peersRef.current.forEach(({ peer }) => peer.destroy());
    peersRef.current = [];

    // Stop local media stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    // Reset state
    setRemoteVideos([]);
    setCallId('');
    setIsCallCreated(false);
    setStream(null);
    setIsCameraOn(true);
    setShowJoinInput(false);
  };

  return (
    <div className="video-call">
      <div className="videos">
        <video ref={localVideoRef} autoPlay muted className="local-video"></video>
        {remoteVideos.map(video => (
          <video key={video.id} ref={(ref) => { if (ref) ref.srcObject = video.stream; }} autoPlay className="remote-video"></video>
        ))}
      </div>
      <div className="controls">
        {!isCallCreated && !showJoinInput && (
          <>
            <button onClick={createCall}>Create Call</button>
            <button onClick={() => { setShowJoinInput(true); setCallId(''); }}>Join Call</button>
          </>
        )}
        {showJoinInput && (
          <>
            <input type="text" value={callId} onChange={(e) => setCallId(e.target.value)} placeholder="Enter Call ID" />
            <button onClick={() => joinCall(callId)}>Join</button>
          </>
        )}
        {isCallCreated && <div>Call ID: {callId}</div>}
        <button onClick={shareScreen} disabled={!isCallCreated}>Share Screen</button>
        <button onClick={recordStream} disabled={!isCallCreated}>Start Recording</button>
        <button onClick={toggleCamera} disabled={!isCallCreated}>
          {isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
        </button>
        <button onClick={endCall} disabled={!isCallCreated}>End Call</button>
      </div>
    </div>
  );
}

export default VideoCall;