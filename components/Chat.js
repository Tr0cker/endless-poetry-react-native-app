import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image, TextInput, FlatList } from 'react-native'
import { useUserContext } from "../UserContext"; // Import the context hook
import axios from "axios"; // Import Axios
import { MaterialCommunityIcons } from '@expo/vector-icons'; 

export default function Chat ({ route }) {

  const [messages, setMessages] = useState();
  const [newMsg, setNewMsg] = useState('');

  const { userData } = useUserContext();

  // Access the passed variables from route.params
  const { chatId, friendId, friendName } = route.params;

  useEffect(() => {
    // Function to fetch chat messages
    const fetchChatMessages = () => {
      const backendUrl = "https://rui2666.pythonanywhere.com/get_chat_messages";
  
      const data = {
        chatId: chatId,
      };
  
      axios
        .post(backendUrl, data)
        .then((response) => {
          const chatMessages = response.data;
          setMessages(chatMessages);
        })
        .catch((error) => {
          console.error("Error fetching chat messages:", error);
        });
    };
  
    // Fetch chat messages initially when the component mounts
    fetchChatMessages();
  
    // Set up a timer to refresh the data every 5 seconds
    const refreshInterval = setInterval(() => {
      fetchChatMessages();
    }, 1500);
  
    // Clean up the timer when the component unmounts
    return () => {
      clearInterval(refreshInterval);
    };
  }, [chatId]);
  




    // Function to send a new message
    const sendMessage = () => {
      const backendUrl = "https://rui2666.pythonanywhere.com/send_chat_message";

      // Prepare the data to send to the backend
      const data = {
        sender_user_id: userData.userId,
        receiver_user_id: friendId,
        chat_id: chatId,
        message: newMsg, // Use the message typed by the user
      };

      // Make a POST request to send the message
      axios
        .post(backendUrl, data)
        .then((response) => {
          // Handle success, you might want to update the UI to show the sent message
          console.log("Message sent successfully");
          
          // update the messages state to include the new message
          setMessages([...messages, data]);
          
          // Clear the input field
          setNewMsg('');
        })
        .catch((error) => {
          console.error("Error sending message:", error);
        });
    };



  return (
    <View style={styles.container}>
      <FlatList
        style={styles.list}
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => {
          let isMessageIn = item.sender_user_id === friendId;
          let itemStyle = isMessageIn ? styles.itemIn : styles.itemOut;

          return (
            <View style={[styles.item, itemStyle]}>
              <View style={styles.balloon}>
                <Text>{item.message}</Text>
              </View>
            </View>
          );
        }}
      />
      <View style={styles.footer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.inputs}
            placeholder="Write a message..."
            underlineColorAndroid="transparent"
            onChangeText={(msg) => setNewMsg(msg)}
            value={newMsg} // Controlled input value
          />
        </View>

        <TouchableOpacity style={styles.btnSend} onPress={sendMessage}>
        <MaterialCommunityIcons name="bird" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff', // Soft blue reminiscent of a serene sky
  },
  list: {
    paddingHorizontal: 17,
    backgroundColor: '#fffaf0', // A light, warm cream color
  },
  footer: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#fdf5e6', // A soft off-white color
    paddingHorizontal: 10,
    padding: 5,
  },
  btnSend: {
    backgroundColor: '#778899', // A light slate gray for contrast
    width: 40,
    height: 40,
    borderRadius: 20, // Rounded for a softer look
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2, // Slight shadow for depth
  },
  iconSend: {
    width: 30,
    height: 30,
    alignSelf: 'center',
    color: '#ffffff', // White icon for visibility
  },
  inputContainer: {
    backgroundColor: '#ffffff', // White for the input field
    borderRadius: 30,
    borderBottomWidth: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    shadowColor: '#708090', // Soft grey shadow for depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  inputs: {
    height: 40,
    marginLeft: 16,
    flex: 1,
    color: '#2f4f4f', // Dark slate gray for text
  },
  balloon: {
    maxWidth: 250,
    padding: 15,
    borderRadius: 20,
    backgroundColor: '#f5f5dc', // A beige background, like old paper
    shadowColor: '#696969', // Dark gray shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 1,
  },
  itemIn: {
    alignSelf: 'flex-start',
    marginRight: 50, // Ensures the bubble doesn't stretch across the screen
  },
  itemOut: {
    alignSelf: 'flex-end',
    marginLeft: 50, // Ensures the bubble doesn't stretch across the screen
  },
  item: {
    marginVertical: 14,
    flex: 1,
    flexDirection: 'row',
  },
});
