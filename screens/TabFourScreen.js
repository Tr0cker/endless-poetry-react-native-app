import React, { useState, useEffect } from "react";
import { SafeAreaView, StyleSheet, View, Image, Text, Button, FlatList, TouchableOpacity } from 'react-native';
import axios from "axios";
import { useUserContext } from "../UserContext";
import { SegmentedButtons } from 'react-native-paper';
import PoetryPost from '../components/PoetryPost';
import { useNavigation } from '@react-navigation/native';
import CardComponent from "../components/CardComponent";
import PoeticLoading from '../components/PoeticLoading'; // Import the PoeticLoading component
import NothingFound from '../components/NothingFound'; // Import the NothingFound component
import { Entypo } from '@expo/vector-icons'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabFourScreen({ route }) {
    const [value, setValue] = React.useState('Posted Poem');
    const [loading, setLoading] = useState(true);

    const { userData } = useUserContext();
    const { setUserData } = useUserContext();
    const [profileData, setProfileData] = useState({
        username: "",
        bio: "",
        followers_count: 0,
        followings_count: 0,
        poetry_count: 0,
        image_url: 'false',  
    });

    const [savedCollections, setSavedCollections] = useState([]);
    const defaultUserImage = require('../assets/images/default_user.jpg');

    const profilePhotoSource = profileData.image_url && profileData.image_url !== 'false'
    ? { uri: profileData.image_url }
    : defaultUserImage;


    useEffect(() => {
        if (value === 'Saved Poem Collections') {
            const fetchSavedCollections = async () => {
                try {
                    const collectionsResponse = await axios.post('https://rui2666.pythonanywhere.com/display_saved_collection_lists', {
                        user_id: userData.userId
                    });
                    setSavedCollections(collectionsResponse.data);
                    setLoading(false);
                    // Log the id part of the response data
                    console.log('Response Data ID:', collectionsResponse.data.id);
                    console.log('Response Data isSaved:', collectionsResponse.data.isSaved);
                } catch (error) {
                    console.error('Error fetching collection lists:', error);
                }
            };
    
            fetchSavedCollections();
    
            const refreshCollectionsInterval = setInterval(() => {
                fetchSavedCollections();
            }, 1000);
    
            return () => clearInterval(refreshCollectionsInterval);
        }
    }, [value, userData.userId]);
    

    
      

    const [poetryPosts, setPoetryPosts] = useState([]);

    const renderPoetryPost = ({ item }) => (
        <PoetryPost
            username={item.username}
            title={item.title}
            poemText={item.poem_text}
            likeCount={item.like_count}
            commentCount={item.comment_count}
            poetryID={item.poetry_id}
            userID={item.user_id}
            poetName={item.poet_name}
            isLiked={item.isLiked} 
            isFollowing={item.isFollowing} 
            isCollected={item.isCollected}
            imageUrl={item.image_url}
      />
    );

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const profileResponse = await axios.post(`https://rui2666.pythonanywhere.com/user_profile`, {
                    user_id: userData.userId
                });
                setProfileData(profileResponse.data);
            } catch (error) {
                console.error("Error fetching profile data:", error);
            }
        };
    
        fetchProfileData();
    
        const refreshProfileInterval = setInterval(() => {
            fetchProfileData();
        }, 2500);
    
        return () => clearInterval(refreshProfileInterval);
    }, [userData.userId]);
    

    useEffect(() => {
        if (value === 'Posted Poem') {
            const fetchPoetryPosts = async () => {
                try {
                    const poetryResponse = await axios.post('https://rui2666.pythonanywhere.com/poetry_by_user', {
                        user_id: userData.userId
                    });
                    setPoetryPosts(poetryResponse.data);
                    setLoading(false);
                } catch (error) {
                    console.error('Error fetching poetry data:', error);
                }
            };
            fetchPoetryPosts();
    
            const refreshPoetryInterval = setInterval(() => {
                fetchPoetryPosts();
            }, 1000);
    
            return () => clearInterval(refreshPoetryInterval);
        }
    }, [value, userData.userId]);
    


    const navigation = useNavigation();

    const onEditProfilePress = () => {
        navigation.navigate('EditProfileView', {
            username: profileData.username,
            bio: profileData.bio,
            userId: userData.userId,
        });
    };

    const [collectionLists, setCollectionLists] = useState([]);

    useEffect(() => {
        if (value === 'Poem Collection') {
            const fetchPoemCollections = async () => {
                try {
                    const collectionsResponse = await axios.post('https://rui2666.pythonanywhere.com/collection_lists', {
                        user_id: userData.userId
                    });
                    setCollectionLists(collectionsResponse.data);
                    setLoading(false);
                    // Log the id part of the response data
                    console.log('Response Data ID:', collectionsResponse.data.id);
                    console.log('Response Data isSaved:', collectionsResponse.data.isSaved);
                } catch (error) {
                    console.error('Error fetching collection lists:', error);
                }
            };
    
            fetchPoemCollections();
    
            const refreshCollectionsInterval = setInterval(() => {
                fetchPoemCollections();
            }, 1000);
    
            return () => clearInterval(refreshCollectionsInterval);
        }
    }, [value, userData.userId]);



    const handleLogout = async () => {
        try {
      
          // Clear specific data or all data from AsyncStorage
          await AsyncStorage.removeItem('username');
          await AsyncStorage.removeItem('userId');
      
          // Navigate to SignInScreen
          navigation.reset({
            index: 0,
            routes: [{ name: 'SignIn' }],
          });
        } catch (error) {
          console.error("Error during logout:", error);
          // Handle any errors during logout
        }
      };
      
      


    // Inside your handleCardPress function
    const handleCardPress = (item) => {
    axios
    .get(`https://rui2666.pythonanywhere.com/poem_collection/${item.id}`)
    .then((response) => {
        // Navigate to CardDetailScreen and pass the cardData as params
        console.log('API Response:', response.data);
        navigation.navigate('CardDetail', { cardData: response.data });
    })
    .catch((error) => {
        console.error('Error fetching card data:', error);
    });
};


    return (
        <View style={styles.container}>
            <View style={styles.header}>
            <Image
                style={styles.avatar}
                source={profilePhotoSource}
            />
                <View style={styles.info}>
                    <Text style={styles.name}>{profileData.username}</Text>
                    <TouchableOpacity onPress={onEditProfilePress} style={styles.editProfileButton}>
                        <Text style={styles.editProfileButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Entypo name="log-out" size={24} color="black" />
                </TouchableOpacity>
            </View>
            <View style={styles.stats}>
                <View style={styles.stat}>
                    <Text style={styles.statLabel}>Poems</Text>
                    <Text style={styles.statValue}>{profileData.poetry_count}</Text>
                </View>
                <TouchableOpacity
                    style={styles.stat}
                    onPress={() => navigation.navigate('FollowingList')}
                    disabled={profileData.followings_count === 0} // Disable when followings count is 0
                >
                    <Text style={styles.statLabel}>Following</Text>
                    <Text style={styles.statValue}>
                        {profileData.followings_count}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.stat}
                    onPress={() => navigation.navigate('FollowersList')}
                    disabled={profileData.followers_count === 0} // Disable when followers count is 0
                >
                    <Text style={styles.statLabel}>Followers</Text>
                    <Text style={styles.statValue}>
                        {profileData.followers_count}
                    </Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.bio}>
                {profileData.bio}
            </Text>
            <SafeAreaView>
            <SegmentedButtons
                    value={value}
                    onValueChange={setValue}
                    buttons={[
                        {
                            value: 'Posted Poem',
                            label: 'Poem',
                        },
                        {
                            value: 'Poem Collection',
                            label: 'Collection',
                        },
                        {
                            value: 'Saved Poem Collections',
                            label: 'Saved',
                        },
                    ]}
                />
            </SafeAreaView>
            


            
            {value === 'Posted Poem' && (
            loading ? (
                <PoeticLoading /> // Use the PoeticLoading component here
            ) : (
                <FlatList
                data={poetryPosts}
                renderItem={renderPoetryPost}
                keyExtractor={item => item.poetry_id.toString()}
                ListEmptyComponent={<NothingFound />}
                />
            )
            )}

            {value === 'Poem Collection' && (
            loading ? (
                <PoeticLoading /> // Use the PoeticLoading component here
            ) : (
                collectionLists.length > 0 ? (
                <FlatList
                    data={collectionLists}
                    renderItem={({ item }) => (
                    <CardComponent
                        item={item}
                        userData={userData}
                        handleCardPress={handleCardPress} // Replace with your card press handler function
                    />
                    )}
                    keyExtractor={(item) => item.id.toString()}
                    ListEmptyComponent={<NothingFound />}
                />
                ) : null
            )
            )}

            {value === 'Saved Poem Collections' && (
            loading ? (
                <PoeticLoading /> // Use the PoeticLoading component here
            ) : (
                savedCollections.length > 0 ? (
                <FlatList
                    data={savedCollections}
                    renderItem={({ item }) => (
                    <CardComponent
                        item={item}
                        userData={userData}
                        handleCardPress={handleCardPress} // Replace with your card press handler function
                    />
                    )}
                    keyExtractor={(item) => item.id.toString()}
                    ListEmptyComponent={<NothingFound />}
                />
                ) : null
            )
            )}





        </View>
    );
}

const styles = StyleSheet.create({
    container: {
      backgroundColor: '#fff',
      flex: 1,
  },
  header: {
      marginTop: 20, // Smaller header
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10, // Smaller padding
  },
  avatar: {
      width: 40, // Smaller avatar
      height: 40, // Smaller avatar
      borderRadius: 20, // Smaller avatar
  },
  info: {
      marginLeft: 10, // Smaller margin
  },
  name: {
      fontSize: 20, // Smaller font size
      fontWeight: 'bold',
  },
  stats: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10, // Smaller padding
  },
  stat: {
      flex: 1,
      alignItems: 'center',
  },
  statLabel: {
      color: '#999',
      fontSize: 12, // Smaller font size
  },
  statValue: {
      fontSize: 16, // Smaller font size
  },
  bio: {
      padding: 10, // Smaller padding
      fontSize: 14, // Smaller font size
      color: '#333',
  },
  logoutButton: {
    position: 'absolute',
    right: 30,
    top: 30,
  },
  editProfileButton: {
    backgroundColor: '#9060de', 
    padding: 10, 
    borderRadius: 10, // Rounded corners
    alignItems: 'center', // Center the text inside the button
    marginTop: 10, 
  },
  editProfileButtonText: {
    color: '#fff', // White text color
    fontWeight: 'bold', // Bold text
    fontSize: 16, 
  },
});