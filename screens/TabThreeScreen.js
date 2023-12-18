import React, { useState, useEffect, useRef } from "react";
import { StyleSheet } from 'react-native';
import { List } from 'react-native-paper';
import axios from "axios"; // Import Axios
import { View, Image, Text, Button, FlatList, TouchableOpacity } from 'react-native';
import { useUserContext } from "../UserContext"; // Import the context hook
import { useNavigation } from '@react-navigation/native';
import PoeticLoading from '../components/PoeticLoading'; // Import the PoeticLoading component
import NothingFound from '../components/NothingFound'; // Import the NothingFound component



export default function TabThreeScreen() {
  const { userData } = useUserContext();
  const [chatFriends, setChatFriends] = useState([]);
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true); // Track loading state
  const [isListEmpty, setIsListEmpty] = useState(false); // Track empty list state
  const defaultUserImage = require('../assets/images/default_user.jpg');


  useEffect(() => {
    console.log("Current user's ID:", userData.userId, "Type:", typeof userData.userId);
    const fetchData = async () => {
      try {
        // Use POST and include the user ID in the request body
        const response = await axios.post('https://rui2666.pythonanywhere.com/get_chat_friends', {
          user_id: userData.userId
        });
  
        setChatFriends(response.data);
        setIsLoading(false); // Data is loaded, set loading to false
        setIsListEmpty(response.data.length === 0); // Check if the list is empty
      } catch (error) {
        console.error("Error fetching chat friends:", error);
        setIsLoading(false); // In case of an error, set loading to false
      }
    };
  
    // Call the fetchData function initially
    fetchData();
  
    // Use setInterval to call fetchData every 3 seconds
    const intervalId = setInterval(fetchData, 3000);
  
    // Clean up the interval when the component unmounts
    return () => {
      clearInterval(intervalId);
    };
  }, [userData.userId]);
  
  
  

  const navigateToChat = (friend) => {
    // Destructure the friend object to obtain necessary data
    const { chat_friends_id, friend_id, friend_name } = friend;
  
    // Navigate to Chat and pass the variables as separate params
    navigation.navigate("Chat", { chatId: chat_friends_id, friendId: friend_id, friendName: friend_name });
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.tutorialHint}>
        Just follow each other first, and then you're all set to chat!
      </Text>
      {isLoading ? (
        <PoeticLoading />
      ) : isListEmpty ? (
        <NothingFound />
      ) : (
        <List.Section style={styles.chatContainer}>
          {chatFriends.map((friend) => (
            <List.Item
              key={friend.chat_friends_id}
              title={friend.friend_name}
              description={
                friend.latest_message
                  ? (friend.latest_message.length > 53 
                     ? friend.latest_message.substring(0, 53) + "..."
                     : friend.latest_message)
                  : "You just followed each other, let's chat."
              }
              left={() => (
              <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: friend.friend_id })}>
                <Image 
                  source={friend.image_url ? { uri: friend.image_url } : defaultUserImage} 
                  style={styles.avatar} 
                />
              </TouchableOpacity>
              )}
              onPress={() => navigateToChat(friend)}
            />
          ))}
        </List.Section>
      )}
    </View>
  );
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5dc', 
    padding: 10,
  },
  chatContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fdf5e6', 
    borderRadius: 10, // Rounded corners
    padding: 10,
    shadowColor: '#708090', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3e2723', 
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#bc9feb',
  },
  separator: {
    marginVertical: 15,
    height: 1,
    width: '90%',
    backgroundColor: '#a9a9a9', 
  },
  tutorialHint: {
    fontSize: 16,
    color: '#fff', 
    textAlign: 'center',
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#bc9feb', 
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#9060de',
  },
});
