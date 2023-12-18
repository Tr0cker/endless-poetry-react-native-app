import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, View, Text, SafeAreaView } from 'react-native';
import axios from 'axios';
import PoetryPost from '../components/PoetryPost';
import { SegmentedButtons } from 'react-native-paper';
import { useUserContext } from "../UserContext"; // Import the context hook
import PoeticLoading from '../components/PoeticLoading'; // Import the PoeticLoading component
import NothingFound from '../components/NothingFound'; // Import the NothingFound component



export default function TabOneScreen() {
  const [loading, setLoading] = useState(true);
  const [poetryPosts, setPoetryPosts] = useState([]);
  const [trendingPoems, setTrendingPoems] = useState([]);
  const [followingPoems, setFollowingPoems] = useState([]); // State to store following poems
  const [selectedButton, setSelectedButton] = useState('Trending');
  const { userData } = useUserContext(); // Access user data from the context
  
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.post('https://rui2666.pythonanywhere.com/latest_poem_feed', {
          userId: userData.userId,
        });
        setPoetryPosts(response.data);
        console.log(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    const refreshData = () => {
      fetchData();
    };

    if (selectedButton === 'Latest') {
      fetchData();

      const refreshInterval = setInterval(refreshData, 1000);

      return () => {
        clearInterval(refreshInterval);
      };
    }
  }, [selectedButton, userData]);

  




  useEffect(() => {
    if (selectedButton === 'Trending') {
      const fetchData = async () => {
        try {
          const response = await axios.post('https://rui2666.pythonanywhere.com/poetry_trending', {
            userId: userData.userId, // Pass userId to the backend function
          });
          setTrendingPoems(response.data);
          console.log(response.data); // Log the response data
          setLoading(false);
        } catch (error) {
          console.error('Error fetching data:', error);
          setLoading(false);
        }
      };

      fetchData();

      const refreshData = () => {
        fetchData();
      };

      const refreshInterval = setInterval(refreshData, 1000);

      return () => {
        clearInterval(refreshInterval);
      };
    }
  }, [selectedButton, userData]); // Add userData to the dependency array





  useEffect(() => {
    if (selectedButton === 'Following') {
      const fetchData = async () => {
        try {
          const response = await axios.post('https://rui2666.pythonanywhere.com/poetry_following', {
            userId: userData.userId, // Pass userId to the backend function
          });
          setFollowingPoems(response.data);
          console.log(response.data); // Log the response data
          setLoading(false);
        } catch (error) {
          console.error('Error fetching data:', error);
          setLoading(false);
        }
      };

      fetchData();

      const refreshData = () => {
        fetchData();
      };

      const refreshInterval = setInterval(refreshData, 1000);

      return () => {
        clearInterval(refreshInterval);
      };
    }
  }, [selectedButton, userData]); // Add userData to the dependency array
  


  
  
  


  
  const renderContent = () => {
    if (selectedButton === 'Latest') {
      return (
        <View style={styles.container}>
          {loading ? (
            <PoeticLoading /> // Use the PoeticLoading component here
          ) : (
            <FlatList
              data={poetryPosts}
              renderItem={renderPoetryPost}
              keyExtractor={(item) => item.poetry_id.toString()}
              ListEmptyComponent={<NothingFound />}
            />
          )}
        </View>
      );
    } else if (selectedButton === 'Trending') {
      // Add code to display Trending content
    return (
      <View style={styles.container}>
        {loading ? (
          <PoeticLoading /> // Use the PoeticLoading component here
        ) : (
          <FlatList
            data={trendingPoems}
            renderItem={renderTrendingPoems}
            keyExtractor={(item) => item.poetry_id.toString()}
            ListEmptyComponent={<NothingFound />}
          />
        )}
      </View>
    );
    } else if (selectedButton === 'Following') {
      // Add code to display Following content
      return (
        <View style={styles.container}>
          {loading ? (
            <PoeticLoading /> // Use the PoeticLoading component here
          ) : (
            <FlatList
              data={followingPoems} // Use the following poems data
              renderItem={renderFollowingPoems} // Define a new render method
              keyExtractor={(item) => item.poetry_id.toString()}
              ListEmptyComponent={<NothingFound />}
            />
          )}
        </View>
      );
    }
  }
  
  

  const renderPoetryPost = ({ item }) => (
    <PoetryPost
      username={item.username}
      title={item.title}
      poemText={item.poem_text}
      likeCount={item.like_count}
      commentCount={item.comment_count}
      poetryID={item.poetry_id}
      userID={item.user_id}
      poetName={item.poet_name}
      isLiked={item.isLiked} 
      isFollowing={item.isFollowing} 
      isCollected={item.isCollected}
      imageUrl={item.image_url}
    />
  );



  const renderTrendingPoems = ({ item }) => (
    <PoetryPost
      username={item.username}
      title={item.title}
      poemText={item.poem_text}
      likeCount={item.like_count}
      commentCount={item.comment_count}
      poetryID={item.poetry_id}
      userID={item.user_id}
      poetName={item.poet_name}
      isLiked={item.isLiked} 
      isFollowing={item.isFollowing} 
      isCollected={item.isCollected}
      imageUrl={item.image_url}
    />
  );  



  const renderFollowingPoems = ({ item }) => (
    <PoetryPost
      username={item.username}
      title={item.title}
      poemText={item.poem_text}
      likeCount={item.like_count}
      commentCount={item.comment_count}
      poetryID={item.poetry_id}
      userID={item.user_id}
      poetName={item.poet_name}
      isLiked={item.isLiked} 
      isFollowing={item.isFollowing}
      isCollected={item.isCollected}
      imageUrl={item.image_url}
    />
  );

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView>
        <SegmentedButtons
          value={selectedButton}
          onValueChange={(value) => setSelectedButton(value)}
          buttons={[
            {
              value: 'Following',
              label: 'Following',
            },
            {
              value: 'Trending',
              label: 'Trending',
            },
            {
              value: 'Latest',
              label: 'Latest',
            },
          ]}
        />
      </SafeAreaView>
      {renderContent()}
    </View>
  );  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
