import { StyleSheet, Image, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import axios from 'axios';


export default function TabTwoScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const onChangeSearch = (query) => setSearchQuery(query);

  const navigation = useNavigation();

  const [poetBio, setPoetBio] = useState('No poet bio found');
  const [imageUrl, setImageUrl] = useState(require('../assets/images/default_user.jpg'));
  const [poemText, setPoemText] = useState('No poem found');

  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [isPoemExpanded, setIsPoemExpanded] = useState(false);
  const [poetName, setPoetName] = useState('');

  const toggleBioExpansion = () => {
    setIsBioExpanded(!isBioExpanded);
  };
  
  const togglePoemExpansion = () => {
    setIsPoemExpanded(!isPoemExpanded);
  };
  


  const fetchPoetData = () => {
    axios.get('https://rui2666.pythonanywhere.com/random_poet_suggestion')
      .then(response => {
        const data = response.data;
        if (data.poet_bio) setPoetBio(data.poet_bio);
        if (data.image_url !== 'No image found') setImageUrl({ uri: data.image_url });
        if (data.poem_text) setPoemText(data.poem_text);
        if (data.poet_name) setPoetName(data.poet_name);
      })
      .catch(error => {
        console.error('Error fetching poet data:', error);
      });
  };

  useEffect(() => {
    fetchPoetData();
  }, []);


  const handleSearch = () => {
    // Navigate to SearchResult screen and pass the search query
    navigation.navigate('SearchResult', { searchQuery });
  };

  const handleReadMorePoems = () => {
    navigation.navigate('SearchResult', { searchQuery: poetName });
  };

  const DailyPoetryRecommendation = () => {
  
    const handleRefresh = () => {
      console.log('Refresh icon clicked');
      fetchPoetData();
    };
  
    return (
      <View style={styles.poetryCard}>
        <TouchableOpacity style={styles.readMorePoemButton} onPress={handleReadMorePoems}>
          <Text style={styles.readMorePoemButtonText}>Read more of this poet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.refreshIcon} onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Daily Recommendation</Text>
        <Image source={imageUrl} style={styles.poetImage} />
        <Text style={styles.introduction}>
          {isBioExpanded ? poetBio : `${poetBio.substring(0, 100)}...`}
        </Text>
        <TouchableOpacity onPress={toggleBioExpansion}>
          <Text style={styles.readMore}>{isBioExpanded ? 'hide away' : 'continue reading'}</Text>
        </TouchableOpacity>
        <Text style={styles.poem}>
          {isPoemExpanded ? poemText : `${poemText.substring(0, 100)}...`}
        </Text>
        <TouchableOpacity onPress={togglePoemExpansion}>
          <Text style={styles.readMore}>{isPoemExpanded ? 'hide away' : 'read more'}</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        {/* Search bar and other fixed-size components */}
        <Searchbar
          placeholder="Search"
          onChangeText={onChangeSearch}
          value={searchQuery}
          onSubmitEditing={handleSearch}
        />
      </View>

      <Text style={styles.inspirationText}>Need some search inspiration? Take a peek at our Daily Recommendation!</Text>

      {/* Scrollable content area */}
      <ScrollView style={styles.scrollableContent}>
        <DailyPoetryRecommendation />
        {/* You can add more content here if needed */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start', // Align content to the top
  },
  searchContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  scrollableContent: {
    width: '100%',
    flex: 1, // Ensure it occupies the remaining space
  },
  refreshIcon: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1, // Ensure it's above other elements
  },
  poetryCard: {
    margin: 20,
    padding: 16,
    paddingTop: 40, 
    borderRadius: 10,
    backgroundColor: '#f3e9dc',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3d2c29',
    marginBottom: 12, 
    textAlign: 'center', 
  },
  poetImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  introduction: {
    marginTop: 12,
    fontSize: 16,
    fontStyle: 'italic',
    color: '#604d53',
  },
  poem: {
    marginTop: 16,
    fontSize: 18,
    lineHeight: 28, // Increased line height for a more airy and readable layout
    color: '#5A4B41', 
    fontStyle: 'normal', // Change to normal to contrast with italic introduction
    textAlign: 'left', // Align text to the left
    paddingHorizontal: 8, // Add some horizontal padding for better readability
    fontFamily: 'KirimomiSwash', // Use the custom font if available
  },
  inspirationText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
    color: '#6C5B7B', 
    padding: 16,
    fontStyle: 'italic',
  },
  readMore: {
    color: '#9060de',
    fontWeight: 'bold',
    marginTop: 5,
  },
  readMorePoemButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'transparent', 
    padding: 8,
},
readMorePoemButtonText: {
    color: '#9060de',
    fontWeight: 'bold',
    textAlign: 'center',
},
});
