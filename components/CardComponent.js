import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal, Button, TextInput } from 'react-native';
import { AntDesign } from '@expo/vector-icons'; 
import axios from 'axios';
import { Entypo } from '@expo/vector-icons'; 

const CardComponent = ({ item, userData, handleCardPress }) => {

  const [isSaved, setIsSaved] = useState(item.isSaved);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const defaultImage = require('../assets/images/default_collection_cover.jpg');
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [updateStatusMessage, setUpdateStatusMessage] = useState('');

    // Toggle the saved status of the collection
    const toggleSaveStatus = () => {
      if (isSaved) {
        handleUnsave();
      } else {
        handleSave();
      }
    };

    // Save the collection
    const handleSave = () => {
      axios
        .post(`https://rui2666.pythonanywhere.com/save_collection`, {
          userId: userData.userId,
          collectionId: item.id,
        })
        .then(() => {
          setIsSaved(true);
        })
        .catch((error) => {
          console.error('Error saving collection:', error);
        });
    };
  
    // Unsave the collection
    const handleUnsave = () => {
      axios
        .post(`https://rui2666.pythonanywhere.com/save_collection_cancel`, {
          userId: userData.userId,
          collectionId: item.id,
        })
        .then(() => {
          setIsSaved(false);
        })
        .catch((error) => {
          console.error('Error unsaving collection:', error);
        });
    };

    const toggleDeleteModal = () => {
      setDeleteModalVisible(!isDeleteModalVisible);
    };
    
  
    const handleDelete = () => {

      axios
        .post(`https://rui2666.pythonanywhere.com/delete_collection_list`, {
          userId: userData.userId,
          collectionId: item.id,
        })
        .then(() => {
          toggleDeleteModal(); // Close the modal after successful deletion
        })
        .catch((error) => {
          console.error('Error deleting collection:', error);
        });
    };
  
    const handleImageIconClick = () => {
      setImageModalVisible(true);
    };
  
    const handleCancelImageChange = () => {
      setImageModalVisible(false);
    };
  
    const handleConfirmImageChange = () => {
      if (!newImageUrl.trim()) {
        setUpdateStatusMessage('Image URL cannot be blank.');
        return;
      }
  
      axios.post(`https://rui2666.pythonanywhere.com/collection_cover_url`, {
        list_id: item.id,
        image_url: newImageUrl
      })
      .then(response => {
        console.log(response.data.message);
        setUpdateStatusMessage('Image URL updated successfully.');
        setImageModalVisible(false);
      })
      .catch(error => {
        console.error('Error updating image URL:', error);
        setUpdateStatusMessage('Failed to update image URL.');
      });
    };

    return (
      <TouchableOpacity onPress={() => handleCardPress(item)}>
        <View style={styles.cardContainer}>
          <Image
            style={styles.cardImage}
            source={item.image_url !== false ? { uri: item.image_url } : defaultImage} 
          />
          <View style={styles.cardContent}>
            <Text style={styles.title}>{item.list_name}</Text>
            <Text style={styles.intro}>{item.intro}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>{item.username}</Text>
            {item.user_id === userData.userId && (
            <>
              <TouchableOpacity onPress={handleImageIconClick}>
                <Entypo name="image" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleDeleteModal}>
                <AntDesign name="delete" size={24} color="red" />
              </TouchableOpacity>
            </>
          )}
            {item.user_id !== userData.userId && (
            <TouchableOpacity onPress={toggleSaveStatus}>
              <AntDesign name={isSaved ? 'tag' : 'tago'} size={24} color="black" />
            </TouchableOpacity>
            )}
          </View>
        </View>


        <Modal
          transparent={true}
          animationType="slide"
          visible={isDeleteModalVisible}
          onRequestClose={toggleDeleteModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Collection Farewell</Text>
              <Text style={styles.modalText}>
                Are you sure to delete this collection?
              </Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={toggleDeleteModal}
                >
                  <Text style={styles.buttonText}>Keep It</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleDelete}
                >
                  <Text style={styles.buttonText}>Farewell</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>



        <Modal
          transparent={true}
          visible={isImageModalVisible}
          animationType="slide"
          onRequestClose={() => setImageModalVisible(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.imageModalContainer}>
              <Text style={styles.modalTitle}>Change Image URL</Text>
              <TextInput
                style={styles.textInput}
                onChangeText={setNewImageUrl}
                value={newImageUrl}
                placeholder="Enter image URL"
              />
              <Text style={styles.statusMessage}>{updateStatusMessage}</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancelImageChange}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={handleConfirmImageChange}
                >
                  <Text style={styles.buttonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>



      </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
  cardContainer: {
    margin: 10,
    borderWidth: 1,
    borderColor: 'lightgray',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  intro: {
    fontSize: 16,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  imageModalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#3b3b3b', // Dark gray color
  },
  textInput: {
    width: '100%',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    minWidth: '40%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: '#9060de',
    padding: 10,
    borderRadius: 5,
    margin: 10,
  },
  cancelButton: {
    backgroundColor: '#cf60de',
    padding: 10,
    borderRadius: 5,
    margin: 10,
  },
  statusMessage: {
    color: 'blue', 
    fontSize: 14,
    marginTop: 5,
  },
});

export default CardComponent;
