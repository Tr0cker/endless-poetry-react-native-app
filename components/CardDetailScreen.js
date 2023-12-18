import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import axios from 'axios';
import PoetryPost from './PoetryPost';
import { useUserContext } from "../UserContext";
import PoeticLoading from './PoeticLoading'; // Import the PoeticLoading component
import NothingFound from './NothingFound'; // Import the NothingFound component

export default function CardDetailScreen({ route }) {
  const { cardData } = route.params;
  const { userData } = useUserContext();

  const [poetryDetails, setPoetryDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // New state for loading

  useEffect(() => {
    const fetchData = async () => {
        try {
            const poetryData = [];

            for (const item of cardData) {
                // Make a POST request instead of GET and pass both poetry_id and user_id
                const response = await axios.post(`https://rui2666.pythonanywhere.com/poetry_by_id`, {
                    poetry_id: item.poetry_id,
                    user_id: userData.userId
                });
                const poetry = response.data[0]; // the response is an array with a single item
                poetryData.push(poetry);
            }

            setPoetryDetails(poetryData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        setIsLoading(false); // End loading
    };

    // Create a function to handle data fetching
    const fetchPoetryDetailsData = () => {
        fetchData();
    };

    // Call the fetchPoetryDetailsData function initially
    fetchPoetryDetailsData();

    // Use setInterval to call fetchPoetryDetailsData every 1.5 seconds
    const intervalId = setInterval(fetchPoetryDetailsData, 1500);

    // Clean up the interval when the component unmounts or when cardData changes
    return () => {
        clearInterval(intervalId);
    };
}, [cardData, userData.userId]); // Add userData.userId as a dependency


  // Render logic
  if (isLoading) {
    return <PoeticLoading />;
  }

  if (poetryDetails.length === 0) {
    return <NothingFound />;
  }

  return (
    <ScrollView>
      {/* Render the fetched data using PoetryPost component */}
      {poetryDetails.map((poetry, index) => (
        <PoetryPost
          key={index}
          username={poetry.username}
          title={poetry.title}
          poemText={poetry.poem_text}
          likeCount={poetry.like_count}
          commentCount={poetry.comment_count}
          poetryID={poetry.poetry_id}
          userID={poetry.user_id} 
          poetName={poetry.poet_name} 
          isLiked={poetry.isLiked} 
          isFollowing={poetry.isFollowing} 
          isCollected={poetry.isCollected}
          imageUrl={poetry.image_url}
        />
      ))}
    </ScrollView>
  );
}
