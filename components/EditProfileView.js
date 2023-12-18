import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, StyleSheet, TouchableOpacity, Modal, Alert, Button } from 'react-native';
import axios from "axios"; // Import Axios
import { useUserContext } from "../UserContext";
import AsyncStorage from '@react-native-async-storage/async-storage';



const EditProfileView = ({ route }) => {
  const { userId } = route.params;
  const [profile, setProfile] = useState({
    username: route.params.username,
    bio: route.params.bio,
  });

  // Import default image using require to ensure it gets bundled correctly by the packager
  const defaultImage = require('../assets/images/default_user.jpg');

  const [avatarUrl, setAvatarUrl] = useState(defaultImage); // useState to hold the avatar URL

  const [updateStatusMessage, setUpdateStatusMessage] = useState(''); // New state variable for the update status message

  const { setUserData } = useUserContext();
  const MAX_USERNAME_LENGTH = 20; // Maximum length for username
  const MAX_BIO_LENGTH = 150;     // Maximum length for bio

  useEffect(() => {
    // Function to fetch user avatar
    const fetchUserAvatar = async () => {
      try {
        const response = await axios.post('https://rui2666.pythonanywhere.com/get_image_user_external_url', {
          user_id: userId,
        });
        if (response.data && response.data.image_url) {
          setAvatarUrl({ uri: response.data.image_url }); // Set the avatar URL if image_url is received
        }
      } catch (error) {
        console.error('Error fetching avatar:', error);
        // If there is an error or no image, the default image will be used as avatarUrl is already set to default
      }
    };

    fetchUserAvatar();
  }, [userId]);

  const handleSubmit = async () => {
    // Check if the username or bio has changed
    if (profile.username !== route.params.username || profile.bio !== route.params.bio) {
      // Prepare the data to send to the backend
      const data = {
        new_username: profile.username,
        new_bio: profile.bio,
      };
  
      try {
        const response = await axios.post(`https://rui2666.pythonanywhere.com/update_user_profile/${userId}`, data);
  
        // Handle a successful response
        if (response.status === 200) {
          setUpdateStatusMessage(response.data.message);
  
          // Update username in AsyncStorage and UserData
          if (profile.username !== route.params.username) {
            await AsyncStorage.setItem('username', profile.username);
            setUserData((prevData) => ({
              ...prevData,
              username: profile.username,
            }));
          }
        } else {
          setUpdateStatusMessage('Failed to update profile');
        }
      } catch (error) {
        console.error('Error updating profile', error);
        setUpdateStatusMessage('Error updating profile');
      }
    } else {
      // Username and bio haven't changed, you can display a message to inform the user
      console.log('Username and bio have not changed');
    }
  };
  


  const [modalVisible, setModalVisible] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');


  const updateAvatarUrl = async () => {
    try {
      const response = await axios.post('https://rui2666.pythonanywhere.com/image_user_external_url', {
        user_id: userId,
        image_url: newImageUrl,
      });
  
      if (response.data && response.data.message) {
        setUpdateMessage("Avatar uploaded"); // Display this message below the Change Avatar button
        setAvatarUrl({ uri: newImageUrl });
        setModalVisible(!modalVisible); // Close the modal after updating
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      alert('Failed to update avatar. Please try again.');
    }
  };
  



  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
      <Image
          style={styles.avatar}
          source={avatarUrl} 
        />
          <TouchableOpacity
              style={styles.changeAvatarButton}
              onPress={() => setModalVisible(true)}
            >
            <Text style={styles.changeAvatarButtonText}>Change Avatar</Text>
          </TouchableOpacity>
          <Text style={{ color: '#bc9feb' }}>{updateMessage}</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Edit Username"
          value={profile.username}
          onChangeText={(text) => setProfile({ ...profile, username: text })}
          maxLength={MAX_USERNAME_LENGTH} // Apply the max length here
        />
        <Text style={styles.charCount}>
          {profile.username.length} / {MAX_USERNAME_LENGTH}
        </Text>
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={styles.bioInput} 
          placeholder="Edit Bio"
          value={profile.bio}
          onChangeText={(text) => setProfile({ ...profile, bio: text })}
          multiline={true}
          numberOfLines={4}
          maxLength={MAX_BIO_LENGTH} // Apply the max length here
        />
        <Text style={styles.charCount}>
          {profile.bio.length} / {MAX_BIO_LENGTH}
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
        {/* Display the update status message here */}
        <Text style={styles.updateStatusMessageStyle}>{updateStatusMessage}</Text>


      </View>



      {/* modal within return statement */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          Alert.alert('Modal has been closed.');
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TextInput
              style={styles.modalText}
              onChangeText={setNewImageUrl}
              value={newImageUrl}
              placeholder="Edit image URL"
            />
            <View style={styles.modalButtonGroup}>
              <Button
                title="Cancel"
                color="#cf60de"  // Set the color for the Cancel button
                onPress={() => {
                  setModalVisible(!modalVisible);
                }}
              />
              <View style={styles.modalButtonSpacer} />
              <Button
                title="Confirm"
                color="#9060de"  // Set the color for the Confirm button
                onPress={() => {
                  if (newImageUrl.trim() === '') {
                    alert('Image URL cannot be blank.');
                    return;
                  }
                  updateAvatarUrl();
                }}
              />
            </View>
          </View>
        </View>
      </Modal>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    width: '80%',
  },
  label: {
    marginTop: 20,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    fontSize: 18,
  },
  bioInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    fontSize: 18,
    height: 120, 
  },
  button: {
    marginTop: 20,
    backgroundColor: '#9060de',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  avatarContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  changeAvatarButton: {
    marginTop: 10,
  },
  changeAvatarButtonText: {
    color: '#bc9feb',
    fontSize: 18,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%', 
  },
  modalText: {
    marginBottom: 15,
    width: '100%', 
    fontSize: 18, 
    padding: 10, 
    borderColor: '#ccc', 
    borderWidth: 1,
    borderRadius: 5,
  },
  modalButtonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20
  },
  modalButtonSpacer: {
    width: 20, // Space between buttons
  },
  charCount: {
    textAlign: 'right', 
    width: '90%',
    alignSelf: 'center', // Ensures it aligns with the center of the TextInput
    marginBottom: 10, // Adds some space below the count
    color: '#666', 
    fontSize: 12, 
  },
  updateStatusMessageStyle: {
    marginTop: 20,
    textAlign: 'center',
    color: '#9060de', 
    fontFamily: 'KirimomiSwash',
    fontSize: 16,
    fontStyle: 'italic',
  },
  
});

export default EditProfileView;
