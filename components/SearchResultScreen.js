import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import axios from 'axios'; // Add this import
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import PoetryPost from './PoetryPost'; // Update the import path as needed
import {
  Avatar as PaperAvatar,
  Button as PaperButton,
  Card as PaperCard,
  Text as PaperText,
} from 'react-native-paper';
import { useUserContext } from "../UserContext";
import CardComponent from './CardComponent'; // Import the CardComponent
import PoeticLoading from './PoeticLoading'; // Import the PoeticLoading component
import NothingFound from './NothingFound'; // Import the NothingFound component


export default function SearchResultScreen({ route }) {
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState('Poem');
  const { searchQuery } = route.params;

  const { userData } = useUserContext();

  




  // Function to determine the profile photo source
  const getProfilePhotoSource = (image_url) => {
    return image_url !== 'false'
      ? { uri: image_url }
      : require('../assets/images/default_user.jpg'); // Update this path as necessary
  };

  const handleFollow = async (userId) => {
    try {
      await axios.post('https://rui2666.pythonanywhere.com/follow', {
        userId: userData.userId,
        followingId: userId,
      });
      // Update the follow status in the users array
      const updatedUsers = users.map(user => {
        if (user.id === userId) {
          return { ...user, isFollowing: true };
        }
        return user;
      });
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error following user:', error);
    }
  };
  
  const handleUnfollow = async (userId) => {
    try {
      await axios.post('https://rui2666.pythonanywhere.com/follow_cancel', {
        userId: userData.userId,
        followingId: userId,
      });
      // Update the follow status in the users array
      const updatedUsers = users.map(user => {
        if (user.id === userId) {
          return { ...user, isFollowing: false };
        }
        return user;
      });
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };
  

  // poem selection section
  const [poems, setPoems] = useState([]);

  useEffect(() => {
    if (value === 'Poem') {
      const fetchData = async () => {
        try {
          // Prepare the request body
          const requestBody = {
            key_word: searchQuery,
            user_id: userData.userId
          };
  
          // Make an API request to fetch the poems
          const response = await axios.post('https://rui2666.pythonanywhere.com/poetry_by_keyword', requestBody);
          setPoems(response.data);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching poems:', error);
        }
      };
  
      // Create a function to handle data fetching for "Poem" section
      const fetchPoemsData = () => {
        fetchData();
      };
  
      // Call the fetchPoemsData function initially
      fetchPoemsData();
  
      // Use setInterval to call fetchPoemsData every 2.5 seconds
      const intervalId = setInterval(fetchPoemsData, 2500);
  
      // Clean up the interval when the component unmounts or when value or searchQuery change
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [value, searchQuery, userData.userId]);
  
  




  const [users, setUsers] = useState([]);
  useEffect(() => {
    if (value === 'User') {
      const fetchData = async () => {
        try {
          const response = await axios.post('https://rui2666.pythonanywhere.com/user_by_keyword', {
            key_word: searchQuery,
            user_id: userData.userId
          });
          setUsers(response.data);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      };
  
      // Call fetchData immediately
      fetchData();
  
      // Set an interval to call fetchData every 2.5 seconds
      const intervalId = setInterval(fetchData, 2500);
  
      // Clear the interval when the component unmounts or dependencies change
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [value, searchQuery, userData.userId]);
  
  

  const [collections, setCollections] = useState([]);
  useEffect(() => {
    if (value === 'Collection') {
      const fetchData = async () => {
        try {
          const response = await axios.post(`https://rui2666.pythonanywhere.com/collection_by_keyword`, {
            keyword: searchQuery,
            user_id: userData.userId
          });
          setCollections(response.data);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching collections:', error);
        }
      };
  
      // Fetch data initially
      fetchData();
  
      // Set up an interval for fetching data
      const intervalId = setInterval(fetchData, 2500);
  
      // Clean up the interval on unmount or when dependencies change
      return () => clearInterval(intervalId);
    }
  }, [value, searchQuery, userData.userId]);
  
  
  

  const navigation = useNavigation();

  // Inside your handleCardPress function
  const handleCardPress = (item) => {
    axios
      .get(`https://rui2666.pythonanywhere.com/poem_collection/${item.id}`)
      .then((response) => {
        // Navigate to CardDetailScreen and pass the cardData as params
        console.log('API Response:', response.data);
        navigation.navigate('CardDetail', { cardData: response.data });
      })
      .catch((error) => {
        console.error('Error fetching card data:', error);
      });
  };

  // Function to navigate to the UserProfile screen
  const handleUserPress = (userId) => {
    navigation.navigate('UserProfile', { userId });
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView>
        {/* Move SegmentedButtons here */}
        <SegmentedButtons
          value={value}
          onValueChange={setValue}
          buttons={[
            {
              value: 'Poem',
              label: 'Poem',
            },
            {
              value: 'User',
              label: 'User',
            },
            {
              value: 'Collection',
              label: 'Collection',
            },
          ]}
        />
      </SafeAreaView>

      {/* Content below the SegmentedButtons */}
      <View style={{ flex: 1 }}>
        {value === 'Poem' && (
          <>
          {loading ? (
            <PoeticLoading /> // Use the PoeticLoading component here
          ) : (
            
            <FlatList
              data={poems}
              keyExtractor={(item) => item.poetry_id.toString()}
              renderItem={({ item }) => (
                <PoetryPost
                  username={item.username}
                  title={item.title}
                  poemText={item.poem_text}
                  likeCount={item.like_count}
                  commentCount={item.comment_count}
                  poetryID={item.poetry_id}
                  userID={item.user_id}
                  poetName={item.poet_name}
                  isLiked={item.isLiked} // Pass isLiked as a prop
                  isFollowing={item.isFollowing} // Pass isFollowing as a prop
                  isCollected={item.isCollected}
                  imageUrl={item.image_url}
              />       
              )}
              ListEmptyComponent={<NothingFound />}
            />
            
          )}
          </>
        )}
        {value === 'User' && (
          <>
          {loading ? (
            <PoeticLoading /> // Use the PoeticLoading component here
          ) : (
            
            <FlatList
            data={users}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleUserPress(item.id)}>
                <View style={styles.itemContainer}>
                  <Image
                    style={styles.image}
                    source={getProfilePhotoSource(item.image_url)}
                  />
                  <View style={styles.textContainer}>
                    <View style={styles.userInfo}>
                      <Text style={styles.nameText}>{item.username}</Text>
                    </View>
                    <View style={styles.followButtonContainer}>
                    {item.username !== userData.username && (
                    <PaperButton
                      mode="contained"
                      onPress={() => {
                        if (item.isFollowing) {
                          handleUnfollow(item.id);
                        } else {
                          handleFollow(item.id);
                        }
                      }}
                    >
                      {item.isFollowing ? 'Following' : 'Follow'}
                    </PaperButton>
                    )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={<NothingFound />}
          />
          
          )}
          </>

        )}
        {value === 'Collection' && (
          <>
          {loading ? (
            <PoeticLoading /> // Use the PoeticLoading component here
          ) : (
            
            <FlatList
            nestedScrollEnabled
            data={collections}
            renderItem={({ item }) => (
              <CardComponent
                item={item}
                userData={userData}
                handleCardPress={handleCardPress}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={<NothingFound />}
          />
          

          )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  textContainer: {
    marginLeft: 16,
    flex: 1, // This allows the text to take up the available space
    flexDirection: 'row',
    justifyContent: 'space-between', // Aligns items in a row with space in between
  },
  userInfo: {
    flex: 1, // This makes the user info take up the available space
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  followButtonContainer: {
    marginLeft: 8, 
  },
  helloWorldText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
});
