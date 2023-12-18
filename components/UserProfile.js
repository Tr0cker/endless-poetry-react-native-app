import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, StyleSheet, ScrollView} from 'react-native';
import axios from "axios"; // Import Axios
import { useUserContext } from "../UserContext"; // Import the context hook
import { View, Image, Text, Button, FlatList, TouchableOpacity } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import PoetryPost from '../components/PoetryPost';
import { useNavigation } from '@react-navigation/native';
import CardComponent from "../components/CardComponent";
import PoeticLoading from "./PoeticLoading";
import NothingFound from "./NothingFound";

export default function UserProfile({ route }) {
    // Segmented control tab
    const { userId } = route.params;
    const { userData } = useUserContext(); // Access user data from the context
    const [value, setValue] = React.useState('Posted Poem');
    const [loading, setLoading] = useState(true);

    const [profileData, setProfileData] = useState({
        username: "",
        bio: "",
        followers_count: 0,
        followings_count: 0,
        poetry_count: 0,
        image_url: 'false',  
        isFollowing: false,  
    });
    
    const defaultUserImage = require('../assets/images/default_user.jpg');
    const profilePhotoSource = profileData.image_url && profileData.image_url !== 'false'
    ? { uri: profileData.image_url }
    : defaultUserImage;




    const handleFollow = async () => {
        try {
            if (profileData.isFollowing) {
                // If already following, unfollow
                await axios.post("https://rui2666.pythonanywhere.com/follow_cancel", {
                    userId: userData.userId,
                    followingId: userId,
                });
                // Update the profileData state
                setProfileData(prevData => ({
                    ...prevData,
                    isFollowing: false
                }));
            } else {
                // If not following, follow
                await axios.post("https://rui2666.pythonanywhere.com/follow", {
                    userId: userData.userId,
                    followingId: userId,
                });
                // Update the profileData state
                setProfileData(prevData => ({
                    ...prevData,
                    isFollowing: true
                }));
            }
        } catch (error) {
            console.error("Error following/unfollowing user:", error);
        }
    };
    





    // poetry post based on user ID
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
        isLiked={item.isLiked} // Pass isLiked as a prop
        isFollowing={item.isFollowing} // Pass isFollowing as a prop
        isCollected={item.isCollected}
        imageUrl={item.image_url}
      />
    );


    // collection list post based on user ID
    const [collectionLists, setCollectionLists] = useState([]);


    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const profileResponse = await axios.post('https://rui2666.pythonanywhere.com/user_profile_another', {
                    user_id: userId,                 // Existing user_id
                    user_id_login: userData.userId  // Add user_id_login
                });
                setProfileData(profileResponse.data);
            } catch (error) {
                console.error("Error fetching profile data:", error);
            }
        };
      
        fetchProfileData();
        const refreshProfileInterval = setInterval(fetchProfileData, 1000);
      
        return () => clearInterval(refreshProfileInterval);
    }, [userId, userData.userId]);  // Add userData.userId in the dependency array
    
    

    useEffect(() => {
        const fetchPoetryPosts = async () => {
            try {
                const poetryResponse = await axios.post('https://rui2666.pythonanywhere.com/display_poetry_by_another_user', {
                    user_id_one: userData.userId, // Current user's ID
                    user_id_two: userId          // ID of the user whose poems we are fetching
                });
                setPoetryPosts(poetryResponse.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching poetry data:', error);
            }
        };
    
        fetchPoetryPosts();
        const refreshPoetryInterval = setInterval(fetchPoetryPosts, 1000);
    
        return () => clearInterval(refreshPoetryInterval);
    }, [userId, userData.userId]); // Add userData.userId to the dependency array
    
    

    useEffect(() => {
        const fetchCollectionLists = async () => {
            try {
                const collectionResponse = await axios.post('https://rui2666.pythonanywhere.com/collection_lists_other_user', {
                    user_id_login: userData.userId,
                    user_id: userId
                });
                setCollectionLists(collectionResponse.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching collection lists data:', error);
            }
        };
    
        fetchCollectionLists();
        const refreshCollectionsInterval = setInterval(fetchCollectionLists, 1000);
    
        return () => clearInterval(refreshCollectionsInterval);
    }, [userId]);
    
    
    
    
      



    const navigation = useNavigation();

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

    

    const [savedCollections, setSavedCollections] = useState([]); // New state for saved collections




    useEffect(() => {
        if (value === 'Saved Poem Collections') {
            const fetchSavedCollections = async () => {
                try {
                    const collectionsResponse = await axios.post('https://rui2666.pythonanywhere.com/display_saved_collection_lists_other_user', {
                        user_id_login: userData.userId,
                        user_id: userId
                    });
                    setSavedCollections(collectionsResponse.data);
                    setLoading(false);
                    // Log the id part of the response data
                    console.log('Response Data ID:', collectionsResponse.data.id);
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
    }, [value, userId]);
    
    

      



    return (
        <View style={styles.container}>
        <View style={styles.header}>
            <Image style={styles.avatar} source={profilePhotoSource} />
            <View style={styles.info}>
            <Text style={styles.name}>{profileData.username}</Text>
            {/* Conditionally render the follow/unfollow button */}
            {profileData.username !== userData.username && (
                <TouchableOpacity
                    style={styles.followButton}
                    onPress={handleFollow}
                >
                    <Text style={styles.followButtonText}>
                        {profileData.isFollowing ? "Following" : "Follow"}
                    </Text>
                </TouchableOpacity>
            )}
            </View>
        </View>
        <View style={styles.stats}>
            <View style={styles.stat}>
            <Text style={styles.statLabel}>Poems</Text>
            <Text style={styles.statValue}>{profileData.poetry_count}</Text>
            </View>
            <TouchableOpacity
                style={styles.stat}
                onPress={profileData.followings_count > 0 ? () => navigation.navigate('FollowingListUser', { userId: userId }) : undefined}
                disabled={profileData.followings_count === 0}
            >
                <Text style={styles.statLabel}>Following</Text>
                <Text style={styles.statValue}>
                    {profileData.followings_count}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.stat}
                onPress={profileData.followers_count > 0 ? () => navigation.navigate('FollowersListUser', { userId: userId }) : undefined}
                disabled={profileData.followers_count === 0}
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

        {/* Display the current value outside SafeAreaView */}
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
            {value === 'Poem Collection' && collectionLists.length > 0 ? (
            loading ? (
                <PoeticLoading /> // Use the PoeticLoading component here
            ) : (
                <FlatList
                    data={collectionLists}
                    renderItem={({ item }) => (
                        <CardComponent
                            item={item}
                            userData={userData}
                            handleCardPress={handleCardPress} 
                        />
                    )}
                    keyExtractor={(item) => item.id.toString()}
                    ListEmptyComponent={<NothingFound />}
                />
            )
            ) : null}
            {value === 'Saved Poem Collections' && savedCollections.length > 0 ? (
            loading ? (
                <PoeticLoading /> // Use the PoeticLoading component here
            ) : (
                <FlatList
                    data={savedCollections}
                    renderItem={({ item }) => (
                        <CardComponent
                            item={item}
                            userData={userData}
                            handleCardPress={handleCardPress}
                        />
                    )}
                    keyExtractor={(item) => item.id.toString()}
                    ListEmptyComponent={<NothingFound />}
                />
            )
            ) : null}

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
    followButton: {
        backgroundColor: '#9060de',
        padding: 8,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10, 
    },
    followButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    });
