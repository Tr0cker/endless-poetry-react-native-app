import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  FlatList, // Import FlatList for displaying lists
} from "react-native";
import { Feather } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons'; 
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useUserContext } from "../UserContext";
import { Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';


export default function PoetryPost({ username, title, poemText, likeCount, commentCount, poetryID, userID, poetName, isLiked, isFollowing, isCollected, imageUrl}) {
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userLists, setUserLists] = useState([]); // State to store user lists
  const [selectedListId, setSelectedListId] = useState(null); // State to store the selected list ID


  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const [showFullText, setShowFullText] = useState(false);

  const navigation = useNavigation();
  const { userData } = useUserContext();


  useEffect(() => {
    // Function to fetch user lists
    const fetchUserLists = () => {
      axios
        .get(`https://rui2666.pythonanywhere.com/get_lists_by_user/${userData.userId}`)
        .then((response) => {
          setUserLists(response.data);
        })
        .catch((error) => {
          console.error('Error fetching user lists:', error);
        });
    };
  
    // Update user lists only when the modal is open
    if (isModalVisible) {
      fetchUserLists();
    }
  }, [isModalVisible, userData.userId]);
  
  
  


  // Function to toggle the showFullText state
  const toggleShowFullText = () => {
    setShowFullText(!showFullText);
  };

  // Create a variable to store the text to be displayed
  let displayedText = poemText;
  if (!showFullText) {
    // Display only the first 30 words
    const words = poemText.split(' ');
    if (words.length > 30) {
      displayedText = words.slice(0, 30).join(' ');
    }
  }
  


  // Function to show the delete confirmation modal
  const showDeleteConfirmation = () => {
    setIsDeleteModalVisible(true);
  };

  // Function to hide the delete confirmation modal
  const hideDeleteConfirmation = () => {
    setIsDeleteModalVisible(false);
  };



  const renderDeleteModalContent = () => {
    return (
      <View style={styles.modalDeleteContainer}>
        <View style={styles.modalDeleteContent}>
          <Text style={styles.modalDeleteTitle}>Are you sure to delete this poem?</Text>
          <View style={styles.DeletebuttonContainer}>
            <TouchableOpacity
              onPress={() => setIsDeleteModalVisible(false)}
              style={styles.closeDeleteButton}
            >
              <Text style={styles.closeDeleteButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteConfirm}
              style={styles.confirmDeleteButton}
            >
              <Text style={styles.confirmDeleteButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };



// Function to delete the poem
const handleDeleteConfirm = () => {
  console.log('Deleting poem with poetryID:', poetryID); // Log the poetryID
  axios
    .post('https://rui2666.pythonanywhere.com/delete_poem', {
      poetry_id: poetryID,
    })
    .then((response) => {
      console.log('Poem deleted successfully:', response.data); // Log the response
      // Implement further actions after deleting if needed
    })
    .catch((error) => {
      console.error('Error deleting poem:', error);
    });
    
  // Hide the delete confirmation modal outside of Axios call
  hideDeleteConfirmation();
};




  const handleCommentIconPress = () => {
    navigation.navigate("CommentDetail", { poetryID });
  };



  const handleFollow = () => {

    if (isFollowing) {
      axios.post(`https://rui2666.pythonanywhere.com/follow_cancel`, {
        userId: userData.userId,
        followingId: userID,
      })
        .then(response => {
          // Handle success
        })
        .catch(error => {
          console.error('Error unfollowing:', error);
        });
    } else {
      axios.post(`https://rui2666.pythonanywhere.com/follow`, {
        userId: userData.userId,
        followingId: userID,
      })
        .then(response => {
          // Handle success
        })
        .catch(error => {
          console.error('Error following:', error);
        });
    }

  };



  const handleHeart = () => {

    if (isLiked) {
      axios.post(`https://rui2666.pythonanywhere.com/like_poem_cancel`, {
        userId: userData.userId,
        poetryId: poetryID,
      })
        .then(response => {
          // Handle success if needed
        })
        .catch(error => {
          console.error('Error canceling like:', error);
        });
    } else {
      axios.post(`https://rui2666.pythonanywhere.com/like_poem`, {
        userId: userData.userId,
        poetryId: poetryID,
      })
        .then(response => {
          // Handle success if needed
        })
        .catch(error => {
          console.error('Error handling like:', error);
        });
    }
  };




  const handleAddToList = () => {
    setIsModalVisible(true); // Show the modal when "Add to Collection" is clicked
  };



  const handleConfirm = () => {
    if (selectedListId) {
      axios
        .post('https://rui2666.pythonanywhere.com/add_poetry_to_collection', {
          userId: userData.userId,
          poetryId: poetryID,
          listId: selectedListId,
        })
        .then((response) => {
          if (response.status === 200) {
            // Handle success
            setIsModalVisible(false);
          } else {
            // Handle other status codes or errors if needed
            console.error('Error adding poetry to collection:', response);
          }
        })
        .catch((error) => {
          console.error('Error adding poetry to collection:', error);
        });
    } else {
      // Handle the case where no collection is selected
      console.error('No list selected.');
    }
    setIsModalVisible(false); // Close the modal after confirmation
  };



  const handleAddToUserList = (listId) => {
    setSelectedListId(listId); // Set the selected collection ID
    console.log(listId);
  };



  const handleCheckIconPress = () => {
    if (isCollected) {
      // Poetry is collected, so remove it from the collection list
      axios
        .post("https://rui2666.pythonanywhere.com/delete_poetry_collection", {
          userId: userData.userId,
          poetryId: poetryID,
        })
        .then((response) => {
          // Handle success if needed
        })
        .catch((error) => {
          console.error("Error removing poetry from collection:", error);
        });
    } else {
      // Poetry is not collected, log an error (you can also display an alert)
      console.error("Poetry is not collected.");
    }
  };
  
  



  const renderModalContent = () => {
    const itemsPerPage = 5;
    const [currentPage, setCurrentPage] = useState(1);
  
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
  
    const paginatedLists = userLists.slice(startIndex, endIndex);
    const totalPages = Math.ceil(userLists.length / itemsPerPage);
  
    const nextPage = () => {
      if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
      }
    };
  
    const prevPage = () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    };
  
    return (
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add to Your Collection</Text>
          <FlatList
            data={paginatedLists}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleAddToUserList(item.id)}
                style={[
                  styles.listItem,
                  item.id === selectedListId && styles.selectedListItem,
                ]}
              >
                <Text style={styles.listItemText}>{item.list_name}</Text>
              </TouchableOpacity>
            )}
          />
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              onPress={prevPage}
              style={[
                styles.pageButton,
                currentPage === 1 && styles.disabledPageButton,
                styles.smallPageButton, // Style for small page buttons
              ]}
              disabled={currentPage === 1}
            >
              <Text style={[styles.pageButtonText, styles.smallPageButtonText]}>
                Previous
              </Text>
            </TouchableOpacity>
            <Text style={styles.pageText}>
              Page {currentPage} of {totalPages}
            </Text>
            <TouchableOpacity
              onPress={nextPage}
              style={[
                styles.pageButton,
                currentPage === totalPages && styles.disabledPageButton,
                styles.smallPageButton, // Style for small page buttons
              ]}
              disabled={currentPage === totalPages}
            >
              <Text style={[styles.pageButtonText, styles.smallPageButtonText]}>
                Next
              </Text>
            </TouchableOpacity>
          </View>
          {/* Add some more spacing between the pagination and confirm/close buttons */}
          <View style={{ height: 20 }} />
          <View style={styles.CollectionbuttonContainer}>
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  function navigateToPoetIntro() {
    navigation.navigate('PoetIntro', { poetName });
  }  
  
  const profilePhotoSource = imageUrl && imageUrl !== 'false' 
    ? { uri: imageUrl } 
    : require('../assets/images/default_user.jpg');

  


  return (
    <View style={styles.postContainer}>
      <View style={styles.profileContainer}>
      <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: userID })}>
      <Image
          source={profilePhotoSource}
          style={styles.profilePhoto}
      />
      </TouchableOpacity>
        <View style={styles.userInfo}>
        {/* Wrap the username text with TouchableOpacity for navigation */}
        <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: userID })}>
          <Text style={styles.username}>{username}</Text>
        </TouchableOpacity>
        </View>
      </View>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>{title}</Text>
      </View>
        {/* Conditionally render the delete icon based on userID */}
        {userID === userData.userId && (
          <TouchableOpacity
            style={styles.deleteIconContainer}
            onPress={showDeleteConfirmation} // Add the onPress prop
          >
            <AntDesign
              name="delete"
              size={24}
              color="red"
            />
          </TouchableOpacity>
        )}
      <View style={styles.poemContainer}>
      <TouchableOpacity onPress={toggleShowFullText}>
        <Text style={styles.poemText}>
        <MaterialCommunityIcons name="format-quote-open" size={18} color="black" />
          {displayedText}
        <MaterialCommunityIcons name="format-quote-close" size={18} color="black" />
        </Text>
      </TouchableOpacity>
        {poemText.split(' ').length > 30 && (
        <TouchableOpacity style={styles.moreButton} onPress={toggleShowFullText}>
          <Text style={styles.moreButtonText}>
            {showFullText ? "hide away" : "read more"}
          </Text>
        </TouchableOpacity>
        )}
        <TouchableOpacity onPress={poetName !== 'Original' ? navigateToPoetIntro : undefined}>
          <Text style={styles.poetNameText}>{poetName === 'Original' ? poetName : `― ${poetName}`}</Text>
        </TouchableOpacity>      
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleHeart}>
          <View style={styles.countContainer}>
            <AntDesign
              name={isLiked ? 'heart' : 'hearto'}
              size={20}
              color={isLiked ? 'black' : 'black'}
              style={styles.buttonIcon}
            />
            <Text style={styles.countText}>{likeCount}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCommentIconPress}>
          <View style={styles.countContainer}>
            <Feather name="message-circle" size={20} color="black"/>
            <Text style={styles.countText}>{commentCount}</Text>
          </View>
        </TouchableOpacity>
        {isCollected ? (
          // Render the check icon if the poetry is collected
          <TouchableOpacity onPress={handleCheckIconPress}>
            <MaterialIcons name="playlist-add-check" size={24} color="black" />
          </TouchableOpacity>
        ) : (
          // Render the "Add to List" button if the poetry is not collected
          <TouchableOpacity onPress={handleAddToList}>
            <MaterialIcons name="playlist-add" size={20} color="black" />
          </TouchableOpacity>
        )}
          {/* Conditionally render the Follow/Unfollow icon */}
          {userID !== userData.userId && (
            <TouchableOpacity onPress={handleFollow}>
              {isFollowing ? (
                <Feather name="user-check" size={20} color="black" />
              ) : (
                <Feather name="user-plus" size={20} color="black" />
              )}
            </TouchableOpacity>
          )}
      </View>



      {/* Modal */}
      <Modal
        transparent={true}
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        {renderModalContent()}
      </Modal>



      {/* Delete Confirmation Modal */}
      <Modal
        transparent={true}
        visible={isDeleteModalVisible}
        animationType="slide"
        onRequestClose={hideDeleteConfirmation}
      >
        {renderDeleteModalContent()}
      </Modal>



    </View>
  );
}

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  postContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: '#fcfdf7',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    position: 'relative', //new
  },
  deleteIconContainer: {
    position: 'absolute', // Position the delete icon absolutely
    top: 30, 
    right: 30, 
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profilePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    marginLeft: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  followButton: {
    paddingVertical: 10, // Vertical padding
    width: screenWidth * 0.25, // 25% of screen width
    height: screenHeight * 0.05, // 5% of the screen height
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
    backgroundColor: '#9e5f11',
    borderRadius: 5,
  },
  followButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fcfdf7',
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'left',
    color: '#333',
    fontFamily: 'KirimomiSwash',
    fontStyle: 'italic',
  },
  poemContainer: {
    alignItems: 'flex-start', // Align items to the start
    justifyContent: 'center',
    backgroundColor: '#fcfdf7',
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  poemText: {
    fontSize: 18,
    textAlign: 'left',
    fontStyle: 'italic',
    lineHeight: 24,
    color: '#333',
    marginBottom: 10, // Add this line to create space
    fontFamily: 'KirimomiSwash',
  },  
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: screenWidth * 0.92, // This ensures the container takes up the full width
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  countText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#333',
    fontFamily: 'KirimomiSwash',
  },
  poetNameText: {
    fontSize: 17,
    fontStyle: 'italic',
    color: '#555',
    marginTop: 5, 
    fontFamily: 'KirimomiSwash',
    fontWeight: 'bold',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(60, 60, 60, 0.5)", // Slightly transparent overlay
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#eae0d5", 
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    color: "#55483e", 
    textAlign: "center",
    fontFamily: "System",
  },
  CollectionbuttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
    paddingHorizontal: 10, // Add padding to the sides of the container
  },
  confirmButton: {
    backgroundColor: "#9060de", 
    padding: 12,
    borderRadius: 5,
    flex: 0.45, // Adjust the flex basis
    marginRight: 10,
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "bold",
    fontFamily: "System",
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: "#cf60de",
    padding: 12,
    borderRadius: 5,
    flex: 0.45, // Adjust the flex basis
    marginLeft: 10,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontFamily: "System",
    textAlign: 'center',
  },
  listItem: {
    padding: 10,
    marginBottom: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    width: "100%",
  },
  listItemText: {
    fontWeight: "bold",
  },
  selectedListItem: {
    backgroundColor: "#9060de",
    borderColor: "#cf60de",
    color: "#cf60de",
  },
  // Modal styles for Delete Confirmation
  modalDeleteContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(60, 60, 60, 0.7)", 
  },
  modalDeleteContent: {
    width: "85%",
    backgroundColor: "#f4f1ee", 
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 6,
  },
  modalDeleteTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 20,
    color: "#3a3a3c", 
    textAlign: "center",
    fontFamily: "System", // Using system default font
  },
  DeletebuttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 15,
  },
  confirmDeleteButton: {
    backgroundColor: "#9060de", 
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  confirmDeleteButtonText: {
    color: "white",
    fontWeight: "bold",
    fontFamily: "System", // Using system default font
    textAlign: 'center',
  },
  closeDeleteButton: {
    backgroundColor: "#cf60de", 
    borderWidth: 0,
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  closeDeleteButtonText: {
    color: "white",
    fontWeight: "bold",
    fontFamily: "System", // Using system default font
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16, 
  },
  pageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#9060de",
    borderRadius: 5,
    marginHorizontal: 8,
  },
  disabledPageButton: {
    backgroundColor: "#bc9feb",
  },
  pageButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  smallPageButton: {
    paddingHorizontal: 8, // Set the width of small page buttons
    paddingVertical: 4, // Set the height of small page buttons
  },
  smallPageButtonText: {
    fontSize: 14, 
  },
  moreButton: {
    alignItems: 'flex-start', // Aligns the button content to the left
    padding: 10, // Provides padding around the text for a larger touch area
    marginTop: 5, 
    marginBottom: 5, 
  },
  moreButtonText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#6a5acd', 
    fontFamily: 'KirimomiSwash', 
    textAlign: 'left',
  },
});

