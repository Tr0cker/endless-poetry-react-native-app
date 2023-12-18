import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, Button, StyleSheet, Dimensions, TextInput, Modal } from 'react-native';
import axios from 'axios';
import { useUserContext } from "../UserContext"; 


function PoetIntro({ route }) {
  const { poetName } = route.params;
  const [poetBio, setPoetBio] = useState('');
  const [contributors, setContributors] = useState('');
  const { userData } = useUserContext(); // Access user data from the context
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState(''); // State to handle editing bio
  const [updateMessage, setUpdateMessage] = useState(''); // State to show update status

  const [poetImageUrl, setPoetImageUrl] = useState('');

  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageUpdateMessage, setImageUpdateMessage] = useState('');


  const handleEditImagePress = () => {
    setIsImageModalVisible(true);
  };
  
  const handleImageModalClose = () => {
    setIsImageModalVisible(false);
    setNewImageUrl('');
  };
  
  const handleImageUpdate = async () => {
    if (newImageUrl === '' || !newImageUrl.startsWith('http')) {
      alert('Please enter a valid website URL.');
      return;
    }
    
    try {
      const response = await axios.post('https://rui2666.pythonanywhere.com/image_poet_external_url', {
        poet_name: poetName,
        image_url: newImageUrl
      });
  
      if (response.status === 200) {
        setImageUpdateMessage('Image updated successfully.');
        setPoetImageUrl(newImageUrl);
      } else {
        setImageUpdateMessage('Failed to update image. Please try again.');
      }
    } catch (error) {
      console.error('An error occurred while updating the image:', error);
      setImageUpdateMessage('Failed to update image. Please try again.');
    }
  
    handleImageModalClose();
  };
  


  useEffect(() => {
    const fetchPoetImage = async () => {
      try {
        const response = await axios.post('https://rui2666.pythonanywhere.com/get_image_poet_external_url', { poet_name: poetName });
        if (response.status === 200 && response.data) {
          setPoetImageUrl(response.data.image_url);
        } else {
          setPoetImageUrl(require('../assets/images/default_poet_image.jpg'));
        }
      } catch (error) {
        console.error('An error occurred while fetching the poet image:', error);
        setPoetImageUrl(require('../assets/images/default_poet_image.jpg'));
      }
    };

    fetchPoetImage();
  }, [poetName]);

  // Function to handle the edit button press
  const handleEditPress = () => {
    setEditBio(poetBio); // Set initial text for editing
    setIsEditing(true); // Toggle to edit mode
  };

  // Function to handle the confirm button press
  const handleConfirmPress = async () => {
    try {
      const response = await axios.post('https://rui2666.pythonanywhere.com/edit_poet_intro', {
        poetName: poetName,
        poetBio: editBio,
        username: userData.username,
      });

      if (response.status === 200) {
        setPoetBio(editBio);
        setUpdateMessage('Updated');
        setIsEditing(false); // Toggle back to view mode
      }
    } catch (error) {
      // Handle errors
      console.error('An error occurred while updating poet intro:', error);
      setUpdateMessage('Failed to update. Please try again.');
    }
  };


  useEffect(() => {
    const fetchPoetIntro = async () => {
      try {
        const response = await axios.post('https://rui2666.pythonanywhere.com/get_poet_intro', { poetName });
        if (response.status === 200 && response.data) {
          setPoetBio(response.data.poet_bio);
          setContributors(response.data.contributors);
        }
      } catch (error) {
        if (error.response && error.response.data.message === 'Poet not found') {
          setPoetBio('This introduction has not been edited yet. Would you like to be the first to edit it?');
          setContributors('no one is here');
        } else {
          // Handle other errors
          console.error('An error occurred while fetching poet intro:', error);
          setPoetBio('');
          setContributors('');
        }
      }
    };

    fetchPoetIntro();
  }, [poetName]);


  const imageSource = poetImageUrl
  ? { uri: poetImageUrl }
  : require('../assets/images/default_poet_image.jpg'); // Default image for fallback

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
      <Image
          style={styles.poetImage}
          source={imageSource}
        />
        <Text style={styles.poetName}>{poetName}</Text>
        <View style={styles.separator} />
        {!isEditing ? (
      <>
        <Text style={styles.poetIntroduction}>
          {poetBio}
        </Text>
        <Button
          title="Edit Poet Information"
          onPress={handleEditPress}
          color="#6a5acd"
        />
      </>
    ) : (
      <>
      <TextInput
        style={[styles.poetIntroduction, styles.poetIntroductionEdit]} // Apply both styles
        onChangeText={setEditBio}
        value={editBio}
        multiline={true}
        autoFocus={true}
      />
      <Button
        title="Confirm"
        onPress={handleConfirmPress}
        color="#6a5acd"
      />
    </>
    )}
    <Text style={styles.updateMessage}>{updateMessage}</Text>
    <Button
      title="Edit Image URL"
      onPress={handleEditImagePress}
      color="#6a5acd"
    />
    <Text style={styles.updateMessage}>{imageUpdateMessage}</Text>

        <View style={styles.contributorsContainer}>
          <Text style={styles.contributorsTitle}>Contributors:</Text>
          <Text style={styles.contributors}>
            {contributors}
          </Text>
        </View>
      </View>



      <Modal
        animationType="slide"
        transparent={true}
        visible={isImageModalVisible}
        onRequestClose={handleImageModalClose}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TextInput
              placeholder="Enter Image URL"
              style={styles.modalText}
              onChangeText={setNewImageUrl}
              value={newImageUrl}
            />
            <View style={styles.buttonContainer}>
              <View style={styles.buttonWrapper}>
                <Button title="Cancel" onPress={handleImageModalClose} color="#6a5acd" />
              </View>
              <View style={styles.buttonWrapper}>
                <Button title="Confirm" onPress={handleImageUpdate} color="#6a5acd" />
              </View>
            </View>
          </View>
        </View>
      </Modal>



    </ScrollView>
  );
}

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#f8f8f8',
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },
  poetImage: {
    width: '100%',
    height: height * 0.33,
    resizeMode: 'cover',
  },
  poetName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2f4f4f',
    textAlign: 'center',
    marginVertical: 20,
  },
  separator: {
    borderBottomColor: '#d2b48c',
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 20,
    alignSelf: 'center',
    width: '80%',
  },
  poetIntroduction: {
    fontSize: 18,
    lineHeight: 28,
    color: '#333333',
    textAlign: 'justify',
    backgroundColor: '#fffefe',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  contributorsContainer: {
    padding: 10,
    alignItems: 'center',
  },
  contributorsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  contributors: {
    fontSize: 14,
    color: '#555',
  },
  updateMessage: {
    fontSize: 16,
    color: 'green',
    marginTop: 10,
  },
  // Style for the expanded TextInput when editing
  poetIntroductionEdit: {
    fontSize: 20, 
    lineHeight: 30,
    color: '#333333',
    textAlign: 'justify',
    backgroundColor: '#fffefe',
    padding: 20, 
    borderRadius: 15,
    marginHorizontal: 10, 
    marginBottom: 20,
    width: '95%',
    height: height * 0.25, 
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: '90%', 
  },
  modalText: {
    marginBottom: 15,
    width: '100%', 
    padding: 10, 
    fontSize: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15, 
  },
  buttonWrapper: {
    marginHorizontal: 10, 
  },
});


export default PoetIntro;
