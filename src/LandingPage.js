import React from 'react';
import { useNavigate } from 'react-router-dom';
import getYoutubeID from 'get-youtube-id';

const HomePage = () => {
  const navigate = useNavigate();

  const handleButtonClick = (videoLink) => {
    // Extract video ID from the YouTube link
    const videoId = getYoutubeID(videoLink);

    // Navigate to the VideoPage with videoId as a parameter
    navigate(`/video/${videoId}`);
  };

  return (
    <div>
      <h1>YouTube Video Link</h1>
      <input
        type="text"
        placeholder="Paste YouTube video link here"
        onChange={(e) => handleButtonClick(e.target.value)}
      />
      <button onClick={() => handleButtonClick()}>Go to Video Page</button>
    </div>
  );
};

export default HomePage;
