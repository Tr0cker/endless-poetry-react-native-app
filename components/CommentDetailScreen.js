import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Avatar, Card, Paragraph, Divider, Text, TextInput, Button } from 'react-native-paper';
import { AntDesign } from '@expo/vector-icons';
import { useUserContext } from "../UserContext"; // Import the context hook
import axios from 'axios'; // Add this import

export default function CommentDetailScreen({ route }) {
  const { poetryID } = route.params; // Access the poetryID from the route params
  const [commentText, setCommentText] = useState('');
  const { userData } = useUserContext(); // Access user data from the context
  const [comments, setComments] = useState([]); // State to store comments
  const defaultUserImage = require('../assets/images/default_user.jpg');


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.post('https://rui2666.pythonanywhere.com/comments', {
          poetry_id: poetryID,
          user_id: userData.userId,
        });
        const data = response.data;
        setComments(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    const refreshInterval = setInterval(fetchData, 1000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [poetryID, userData.userId]);
  
  
  const handleDeleteComment = (commentId) => {
    // Directly make an Axios request to delete the comment
    axios
      .post('https://rui2666.pythonanywhere.com/delete_comment', {
        comment_id: commentId,
        poetry_id: poetryID,
      })
      .then((response) => {
        if (response.status === 200) {
          console.log('Comment deleted:', commentId);
          // Refresh comments here if necessary
        } else {
          console.error('Failed to delete comment');
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };





  const handleLikePress = async (commentId, isLiked, isDisliked) => {
    console.log('Like button pressed for Comment ID:', commentId);

    try {
        // If the comment is already liked, cancel the like
        if (isLiked) {
            const response = await axios.post('https://rui2666.pythonanywhere.com/cancel_like_comment', {
                userId: userData.userId,
                commentId: commentId,
            });
            if (response.status === 200) {
                setComments(prevComments => prevComments.map(comment => 
                    comment.comment_id === commentId 
                        ? { ...comment, isLiked: false, like_count: comment.like_count - 1 } 
                        : comment
                ));
            }
            return;
        }

        // If the comment is currently disliked, cancel the dislike first
        if (isDisliked) {
            const cancelDislikeResponse = await axios.post('https://rui2666.pythonanywhere.com/cancel_dislike_comment', {
                userId: userData.userId,
                commentId: commentId,
            });

            if (cancelDislikeResponse.status === 200) {
                setComments(prevComments => prevComments.map(comment => 
                    comment.comment_id === commentId 
                        ? { ...comment, isDisliked: false, dislike_count: comment.dislike_count - 1 } 
                        : comment
                ));
            }
        }

        // Then, proceed with liking the comment
        const likeResponse = await axios.post('https://rui2666.pythonanywhere.com/like_comment', {
            userId: userData.userId,
            commentId: commentId,
        });

        if (likeResponse.status === 200) {
            setComments(prevComments => prevComments.map(comment => 
                comment.comment_id === commentId 
                    ? { ...comment, isLiked: true, like_count: comment.like_count + 1 } 
                    : comment
            ));
        }
    } catch (error) {
        console.error('Error handling like:', error);
    }
};


  
const handleDislikePress = async (commentId, isDisliked, isLiked) => {
  console.log('Dislike button pressed for Comment ID:', commentId);

  try {
      // If the comment is already disliked, cancel the dislike
      if (isDisliked) {
          const response = await axios.post('https://rui2666.pythonanywhere.com/cancel_dislike_comment', {
              userId: userData.userId,
              commentId: commentId,
          });
          if (response.status === 200) {
              setComments(prevComments => prevComments.map(comment => 
                  comment.comment_id === commentId 
                      ? { ...comment, isDisliked: false, dislike_count: comment.dislike_count - 1 } 
                      : comment
              ));
          }
          return;
      }

      // If the comment is currently liked, cancel the like first
      if (isLiked) {
          const cancelLikeResponse = await axios.post('https://rui2666.pythonanywhere.com/cancel_like_comment', {
              userId: userData.userId,
              commentId: commentId,
          });

          if (cancelLikeResponse.status === 200) {
              setComments(prevComments => prevComments.map(comment => 
                  comment.comment_id === commentId 
                      ? { ...comment, isLiked: false, like_count: comment.like_count - 1 } 
                      : comment
              ));
          }
      }

      // Then, proceed with disliking the comment
      const dislikeResponse = await axios.post('https://rui2666.pythonanywhere.com/dislike_comment', {
          userId: userData.userId,
          commentId: commentId,
      });

      if (dislikeResponse.status === 200) {
          setComments(prevComments => prevComments.map(comment => 
              comment.comment_id === commentId 
                  ? { ...comment, isDisliked: true, dislike_count: comment.dislike_count + 1 } 
                  : comment
          ));
      }
  } catch (error) {
      console.error('Error handling dislike:', error);
  }
};


  
  
  

  const handleCommentSubmit = () => {
    // Ensure all required data is available
    console.log('Comment clicked');
    if (!userData.userId || !userData.username || !commentText || !poetryID) {
      console.error('Missing data for comment submission');
      return;
    }
    console.log('here before commentData');
    // Create a comment object with the necessary data
    const commentData = {
      userId: userData.userId,
      username: userData.username,
      commentText: commentText,
      poetryId: poetryID,
    };
    console.log('here before axios post');
    console.log(commentData);
    // Make a POST request to the backend to submit the comment using Axios
    axios.post('https://rui2666.pythonanywhere.com/submit_comment', commentData)
      .then((response) => {
        if (response.status === 200) {
          // Comment was successfully submitted
          console.log('Comment submitted:', commentText);
          setCommentText(''); // Clear the comment input field
        } else {
          console.error('Failed to submit comment');
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const renderComment = ({ item }) => {
    // Logic to determine the correct image source
    const avatarSource = item.image_url && item.image_url !== 'false'
      ? { uri: item.image_url }
      : defaultUserImage;
  
    return (
      <Card style={styles.commentCard}>
        <Card.Title
          title={item.username}
          left={(props) => (
            <Avatar.Image
              source={avatarSource}
              style={styles.avatarStyle}
              {...props}
            />
          )}
        />
        {item.user_id === userData.userId && (
          <TouchableOpacity
            style={styles.deleteIcon}
            onPress={() => handleDeleteComment(item.comment_id)}
          >
            <AntDesign name="delete" size={24} color="red" />
          </TouchableOpacity>
        )}
        <Card.Content>
          <Paragraph>{item.comment_text}</Paragraph>
        </Card.Content>
        <Card.Actions style={styles.actionsContainer}>
        <TouchableOpacity
            onPress={() => handleLikePress(item.comment_id, item.isLiked, item.isDisliked)}
            style={styles.iconButton}
        >
            <AntDesign
              name={item.isLiked ? 'like1' : 'like2'}
              size={24}
              color="black"
            />
            <Text style={styles.iconText}>{item.like_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity
              onPress={() => handleDislikePress(item.comment_id, item.isDisliked, item.isLiked)}
              style={styles.iconButton}
          >
            <AntDesign
              name={item.isDisliked ? 'dislike1' : 'dislike2'}
              size={24}
              color="black"
            />
            <Text style={styles.iconText}>{item.dislike_count}</Text>
          </TouchableOpacity>
        </Card.Actions>
      </Card>
    );
  };
  
  

  return (
    <View style={styles.container}>
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.comment_id.toString()}
        ItemSeparatorComponent={() => <Divider />}
      />

      {/* Comment Input Section */}
      <View style={styles.commentInputContainer}>
        <TextInput
          label="Add a Comment"
          value={commentText}
          onChangeText={(text) => setCommentText(text)}
          style={styles.commentInput}
          multiline
        />
        <Button
          mode="contained"
          onPress={handleCommentSubmit}
          disabled={!commentText.trim()}
          style={styles.commentButton} 
        >
          Comment
        </Button>
      </View>



    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  commentCard: {
    margin: 5,
    padding: 5,
    elevation: 2,
    borderRadius: 10,
    backgroundColor: '#fcfdf7',
  },
  avatarStyle: {
    backgroundColor: 'transparent',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    alignItems: 'center',
    padding: 2,
  },
  iconText: {
    fontSize: 12,
    color: 'black',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#fcfdf7',
  },
  commentInput: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#fcfdf7',
  },
  commentButton: {
    backgroundColor: '#bc9feb', 
  },
  deleteIcon: {
    position: 'absolute',
    top: 5, 
    right: 5, 
  },
});

