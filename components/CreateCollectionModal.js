import React, { useState, useEffect, useRef } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useUserContext } from "../UserContext"; // Import the context hook
import axios from 'axios'; // Import Axios


const CreateCollectionModal = ({ isVisible, onCancel, onConfirm }) => {
  const [collectionName, setCollectionName] = useState('');
  const [intro, setIntro] = useState('');
  const { userData } = useUserContext(); // Access user data from the context
  const [errorMessage, setErrorMessage] = useState('');
  const MAX_COLLECTION_NAME_LENGTH = 50;
  const MAX_INTRO_LENGTH = 200;



  const handleConfirm = () => {
    // Trim input values and validate
    const trimmedCollectionName = collectionName.trim();
    const trimmedIntro = intro.trim();
  
    // Validate input and perform any necessary actions
    if (trimmedCollectionName === '' || trimmedIntro === '') {
      // Display an error message or handle validation as needed
      if (trimmedCollectionName === '') {
        // Handle empty collection name
        setErrorMessage('Collection name cannot be empty');
        return;
      }
      if (trimmedIntro === '') {
        // Handle empty intro
        setErrorMessage('Intro cannot be empty');
        return;
      }
      setErrorMessage('');
      return;
    }
  
    // Create a data object with the required fields
    const data = {
      userId: userData.userId,
      listName: trimmedCollectionName,
      intro: trimmedIntro,
    };
  
    // Send a POST request to your Flask backend
    axios.post('https://rui2666.pythonanywhere.com/create_collection_list', data)
      .then(response => {
        // Handle a successful response
        console.log('Collection list created successfully');
        // Call the onConfirm function with the collected data
        onConfirm(trimmedCollectionName, trimmedIntro);
        // Clear input fields
        setCollectionName('');
        setIntro('');
      })
      .catch(error => {
        // Handle errors
        console.error('Error creating collection list:', error);
      });
  };

  const handleCancel = () => {
    setErrorMessage('');  // Clear the error message
    setCollectionName('');  // Reset collection name
    setIntro('');  // Reset intro text
    onCancel();  // Call the original onCancel function passed as a prop
  };
  



  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create Collection</Text>
          <TextInput
            style={styles.input}
            placeholder="Collection Name"
            value={collectionName}
            onChangeText={(text) => setCollectionName(text)}
            maxLength={MAX_COLLECTION_NAME_LENGTH} // Set the max length
          />
          <Text style={styles.charCount}>
            {collectionName.length} / {MAX_COLLECTION_NAME_LENGTH}
          </Text>
          <TextInput
            style={[styles.input, styles.introInput]}
            placeholder="Intro"
            value={intro}
            onChangeText={(text) => setIntro(text)}
            multiline={true}
            numberOfLines={4}
            maxLength={MAX_INTRO_LENGTH} // Set the max length
          />
          <Text style={styles.charCount}>
            {intro.length} / {MAX_INTRO_LENGTH}
          </Text>
          {errorMessage !== '' && (
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          )}
          <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={styles.confirmButton}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '95%', 
    alignSelf: 'center', 
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    width: '90%', 
    alignSelf: 'center', 
  },
  introInput: {
    height: 200, 
    textAlignVertical: 'top', 
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    color: 'red',
    marginRight: 10,
  },
  confirmButton: {
    color: 'blue',
  },
  errorMessage: {
    color: 'red', 
    textAlign: 'center', 
    fontSize: 14, 
    marginBottom: 10, 
  },
  charCount: {
    textAlign: 'right', 
    width: '90%', 
    alignSelf: 'center', 
    marginBottom: 10, 
    color: '#666', 
    fontSize: 12, 
  },
  
});

export default CreateCollectionModal;
