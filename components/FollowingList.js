import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native'; // Import TouchableOpacity for the button
import { useUserContext } from '../UserContext';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

export default function FollowingList() {
    const { userData } = useUserContext(); // Access user data from the context
    const [followers, setFollowers] = useState([]);
    const defaultUserImage = require('../assets/images/default_user.jpg');
    const navigation = useNavigation();
  
    useEffect(() => {
        if (userData.userId) {
          // Prepare the request body
          const requestBody = {
            user_id_login: userData.userId,
            user_id: userData.userId
          };
      
          // Make an API request to fetch the following list
          axios
            .post('https://rui2666.pythonanywhere.com/get_following_list', requestBody)
            .then((response) => {
              // Update the state with the fetched followings
              setFollowers(response.data);
            })
            .catch((error) => {
              console.error('Error fetching following list:', error);
            });
        }
    }, [userData.userId]);
      

    const handleFollowPress = (item) => {
        // Check if the user is currently following
        if (item.isFollowing) {
            // Prepare the request body for unfollowing
            const requestBody = {
                userId: userData.userId,
                followingId: item.id
            };
    
            // Make an API request to the follow_cancel endpoint
            axios.post('https://rui2666.pythonanywhere.com/follow_cancel', requestBody)
                .then((response) => {
                    console.log('Unfollowed successfully', response);
                    // Update the local state to reflect the change
                    setFollowers(followers.map(follower => 
                        follower.id === item.id ? { ...follower, isFollowing: false } : follower
                    ));
                })
                .catch((error) => {
                    console.error('Error unfollowing user:', error);
                });
        } else {
            // Prepare the request body for following
            const requestBody = {
                userId: userData.userId,
                followingId: item.id
            };
    
            // Make an API request to the follow endpoint
            axios.post('https://rui2666.pythonanywhere.com/follow', requestBody)
                .then((response) => {
                    console.log('Followed successfully', response);
                    // Update the local state to reflect the change
                    setFollowers(followers.map(follower => 
                        follower.id === item.id ? { ...follower, isFollowing: true } : follower
                    ));
                })
                .catch((error) => {
                    console.error('Error following user:', error);
                });
        }
    };
    

    const navigateToUserProfile = (userId) => {
        // Navigate to the UserProfile screen with userId
        navigation.navigate('UserProfile', { userId });
    };


    return (
        <View style={styles.container}>
            <FlatList
                data={followers}
                renderItem={({ item }) => (
                <TouchableOpacity onPress={() => navigateToUserProfile(item.id)}>
                <View style={styles.itemContainer}>
                    <Image
                        style={styles.image}
                        source={item.image_url ? { uri: item.image_url } : defaultUserImage}
                    />
                    <View style={styles.textContainer}>
                    <Text style={styles.nameText}>{item.username}</Text>
                    </View>
                    {item.username !== userData.username && (
                        <TouchableOpacity
                            style={styles.followButton}
                            onPress={() => handleFollowPress(item)}
                        >
                            <Text style={styles.followButtonText}>
                                {item.isFollowing ? 'Following' : 'Follow'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
                </TouchableOpacity>
                )}
                keyExtractor={(item, index) => index.toString()} // Use index as a unique key
            />
        </View>
    );
    }

    const styles = StyleSheet.create({
      container: {
          flex: 1,
          backgroundColor: '#F3F2EF', // A soft off-white background
      },
      itemContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: '#EAEAEA', // Soft border color
          backgroundColor: '#fcfdf7', 
          shadowColor: '#000', // For a subtle shadow below each item
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 2,
          elevation: 2,
          marginHorizontal: 10,
          marginTop: 10,
          borderRadius: 10, // Rounded corners for each item
      },
      image: {
          width: 60,
          height: 60,
          borderRadius: 30, // More rounded
          borderWidth: 2,
          borderColor: '#DADADA', // Soft border for the image
      },
      textContainer: {
          marginLeft: 16,
          flex: 1, // Ensures it takes up the available space
      },
      nameText: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#333333', // Darker text for better readability
      },
      followButton: {
          backgroundColor: '#9060de', 
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 20, // More rounded
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000', // Subtle shadow for the button
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 2,
          elevation: 2,
      },
      followButtonText: {
          color: '#FFFFFF',
          fontSize: 16,
          fontWeight: '500', // Slightly bolder text
      },
  });
  