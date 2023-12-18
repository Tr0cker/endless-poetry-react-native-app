import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import axios from "axios";
import { useUserContext } from "../UserContext";
import { Switch } from 'react-native';

const PostPoemModal = ({ isVisible, onCancel }) => {
  const [title, setTitle] = useState('');
  const [poem, setPoem] = useState('');
  const [original, setOriginal] = useState(false); // Updated state for original poem
  const [poetName, setPoetName] = useState('');
  const { userData } = useUserContext();
  const [errorMessage, setErrorMessage] = useState('');
  const MAX_TITLE_LENGTH = 40; // Maximum length for the title
  const MAX_POET_NAME_LENGTH = 30; // Maximum length for the poet name



  const handleConfirm = () => {
    if (title.trim() === '') {
      setErrorMessage('Title cannot be empty');
      return;
    } else if (poem.trim() === '') {
      setErrorMessage('Poem cannot be empty');
      return;
    } else if (!original && poetName.trim() === '') {
      setErrorMessage('Poet name cannot be empty');
      return;
    }
  
    setErrorMessage(''); // Reset error message on valid input

    const postData = {
      user_id: userData.userId,
      username: userData.username,
      title: title.trim(),
      poem_text: poem.trim(),
      poet_name: original ? 'Original' : poetName.trim(),
    };

    axios.post('https://rui2666.pythonanywhere.com/insert_poem', postData)
      .then((response) => {
        console.log('Poem posted successfully', response.data);
        setTitle('');
        setPoem('');
        setOriginal(false);
        setPoetName('');
        onCancel();
      })
      .catch((error) => {
        console.error('Error posting poem', error);
      });
  };

  const handleCancel = () => {
    setTitle('');  // Clear the title
    setPoem('');  // Clear the poem
    setPoetName('');  // Clear the poet name if it's not an original poem
    setErrorMessage('');  // Clear any error message
    setOriginal(false);  // Reset the original switch
    onCancel();  // Call the original onCancel function passed as a prop
  };
  

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Post Poem</Text>
          <TextInput
            style={styles.input}
            placeholder="Title"
            value={title}
            onChangeText={(text) => setTitle(text)}
            maxLength={MAX_TITLE_LENGTH} // Apply the max length here
          />
          <Text style={styles.charCount}>
            {title.length} / {MAX_TITLE_LENGTH}
          </Text>
          <TextInput
            style={[styles.input, styles.poemInput]}
            placeholder="Poem"
            value={poem}
            onChangeText={(text) => setPoem(text)}
            multiline={true}
            numberOfLines={6}
          />
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Is Original?</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={original ? "#f5dd4b" : "#f4f3f4"}
              onValueChange={(value) => setOriginal(value)}
              value={original}
            />
          </View>
          {!original && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Poet Name"
                value={poetName}
                onChangeText={(text) => setPoetName(text)}
                maxLength={MAX_POET_NAME_LENGTH}
              />
              <Text style={styles.charCount}>
                {poetName.length} / {MAX_POET_NAME_LENGTH}
              </Text>
            </>
          )}
          <View style={styles.buttonContainer}>
          {errorMessage !== '' && (
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          )}
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
    alignSelf: 'center', // Center the modal content within the screen
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
    width: '90%', // Set the width to 90% of the parent container's width
    alignSelf: 'center', 
  },
  poemInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    width: '90%', // Set the width to 90% of the parent container's width
    alignSelf: 'center', 
    height: 300, // Increase the height to give more space
    textAlignVertical: 'top', // For Android, this ensures that the text starts from the top
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleLabel: {
    fontSize: 16,
    marginRight: 10,
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
    textAlign: 'center', // Center the text
    fontSize: 14, 
    marginBottom: 10, // Space before the buttons
    width: '100%', // Ensure it spans the full width of the modal
  },
  charCount: {
    textAlign: 'right', // Aligns text to the right
    width: '90%', // Aligns with the width of the TextInput
    alignSelf: 'center', // Ensures it aligns with the center of the TextInput
    marginBottom: 10, // Adds some space below the count
    color: '#666', 
    fontSize: 12, 
  },
  
});

export default PostPoemModal;
