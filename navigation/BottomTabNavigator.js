// Learn more about createBottomTabNavigator:
// https://reactnavigation.org/docs/bottom-tab-navigator
import CommentDetailScreen from "../components/CommentDetailScreen"; // Import the CommentDetailScreen
import Ionicons from "@expo/vector-icons/Ionicons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { useColorScheme } from "react-native";
import Colors from "../constants/Colors";
import TabOneScreen from "../screens/TabOneScreen";
import TabTwoScreen from "../screens/TabTwoScreen";
import TabThreeScreen from "../screens/TabThreeScreen";
import TabFourScreen from "../screens/TabFourScreen";
import CardDetailScreen from '../components/CardDetailScreen'; // Import the CardDetailScreen
import SearchResultScreen from "../components/SearchResultScreen";
import FollowersList from "../components/FollowersList"; // Import the FollowersList component
import FollowingList from "../components/FollowingList"; // Import the FollowingList component
import { AntDesign } from '@expo/vector-icons';
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState, useEffect, useRef } from "react";
import axios from 'axios'; // Import Axios
import { View, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import EditProfileView from "../components/EditProfileView";
import CreateCollectionModal from "../components/CreateCollectionModal"; // Import the CreateCollectionModal component
import PostPoemModal from '../components/PostPoemModal'; // Import the PostPoemModal component
import UserProfile from "../components/UserProfile";
import Chat from "../components/Chat";
import PoetIntro from "../components/PoetIntro";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FollowersListUser from "../components/FollowersListUser";
import FollowingListUser from "../components/FollowingListUser";




const BottomTab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  const colorScheme = useColorScheme();
  const [fabVisible, setFabVisible] = useState(false); // State for FAB visibility

  // Function to toggle the FAB visibility
  const toggleFabVisibility = () => {
    setFabVisible(!fabVisible);
  };

  const [isModalVisible, setModalVisible] = useState(false); // State for modal visibility
  const [isPostPoemModalVisible, setPostPoemModalVisible] = useState(false); // State for the PostPoemModal
  // Function to show the modal
  const showModal = () => {
    setModalVisible(true);
  };

  // Function to hide the modal
  const hideModal = () => {
    setModalVisible(false);
  };

  // Function to show the PostPoemModal
const showPostPoemModal = () => {
  setPostPoemModalVisible(true);
};

// Function to hide the PostPoemModal
const hidePostPoemModal = () => {
  setPostPoemModalVisible(false);
};


// ... existing states and functions ...
const [isFabEnabled, setIsFabEnabled] = useState(true); // State to control FAB visibility

// Toggle for the FAB switch
const toggleFabSwitch = () => setIsFabEnabled(previousState => !previousState);




  return (
    <View style={{ flex: 1 }}>
    <BottomTab.Navigator
      initialRouteName="TabOne"
      screenOptions={{ tabBarActiveTintColor: Colors[colorScheme].tint }}
    >
      <BottomTab.Screen
        name="TabOne"
        component={TabOneNavigator}
        options={{
          tabBarLabel: '',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="lighthouse" size={24} color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name="TabTwo"
        component={TabTwoNavigator}
        options={{
          tabBarLabel: '',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <AntDesign name="search1" size={24} color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name="TabThree"
        component={TabThreeNavigator}
        options={{
          tabBarLabel: '',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="bird" size={24} color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name="TabFour"
        component={TabFourNavigator}
        options={{
          tabBarLabel: '',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <AntDesign name="profile" size={24} color={color} />
          ),
        }}
      />
      
    </BottomTab.Navigator>


    {/* Switch to control FAB visibility */}
    <View style={styles.switchContainer}>
      <Switch
        trackColor={{ false: "#767577", true: "#bc9feb" }}
        thumbColor={isFabEnabled ? "#f2f2f2" : "#f4f3f4"}
        onValueChange={toggleFabSwitch}
        value={isFabEnabled}
      />
    </View>

    {isFabEnabled && fabVisible && (
        <View style={styles.subFabContainer}>
        <TouchableOpacity
          style={styles.subFabButton}
          onPress={showPostPoemModal} // Use showPostPoemModal to open the PostPoemModal
        >
          <Ionicons name="create" size={60} color={`rgba(188,159,235,0.7)`} />
        </TouchableOpacity>

          <TouchableOpacity
            style={styles.subFabButton}
            onPress={showModal}
          >
            <MaterialIcons name="create-new-folder" size={60} color={`rgba(188,159,235,0.7)`} />
          </TouchableOpacity>

        </View>
      )}

      {isFabEnabled && (
        <TouchableOpacity
          style={styles.mainFabButton}
          onPress={toggleFabVisibility}
        >
          <Ionicons name="add-circle" size={60} color={`rgba(188,159,235,0.7)`} />
        </TouchableOpacity>
      )}


      <CreateCollectionModal
        isVisible={isModalVisible}
        onCancel={hideModal}
        onConfirm={(collectionName, intro) => {
          // Handle the confirmation and data submission here
          console.log("Collection Name:", collectionName);
          console.log("Intro:", intro);

          // Hide the modal after submission
          hideModal();
        }}
      />

      {/* Render the PostPoemModal */}
      <PostPoemModal
        isVisible={isPostPoemModalVisible} // Pass the visibility state
        onCancel={hidePostPoemModal} // Pass the hide function
        onConfirm={(postData) => {
          // Handle the confirmation and data submission here for the PostPoemModal
          console.log('Post Data:', postData);

          // Hide the modal after submission
          hidePostPoemModal();
        }}
      />


    </View>
  );
}

// You can explore the built-in icon families and icons on the web at:
// https://icons.expo.fyi/
function TabBarIcon(props) {
  return <Ionicons size={30} style={{ marginBottom: -3 }} {...props} />;
}

// Each tab has its own navigation stack, you can read more about this pattern here:
// https://reactnavigation.org/docs/tab-based-navigation#a-stack-navigator-for-each-tab
const TabOneStack = createStackNavigator();

function TabOneNavigator() {
  return (
    <TabOneStack.Navigator>
      <TabOneStack.Screen
        name="TabOneScreen"
        component={TabOneScreen}
        options={{ headerTitle: "Feed" }}
      />
      <TabOneStack.Screen
        name="CommentDetail" // Add a screen for the CommentDetailScreen
        component={CommentDetailScreen}
        options={{ headerTitle: "Comments" }} // Customize the header title
      />
      <TabOneStack.Screen
        name="PoetIntro" // Add a screen for the CommentDetailScreen
        component={PoetIntro}
        options={{ headerTitle: "Poet Introduction" }} // Customize the header title
      />
      <TabFourStack.Screen
        name="UserProfile" // Name of the new screen
        component={UserProfile}
        options={{ headerTitle: 'User Profile' }} // Customize the header title
      />
      <TabFourStack.Screen
        name="FollowersListUser" // Add a screen for the FollowersList component
        component={FollowersListUser}
        options={{ headerTitle: 'Followers' }} // Customize the header title
      />
      <TabFourStack.Screen
        name="FollowingListUser" // Add a screen for the FollowingList component
        component={FollowingListUser}
        options={{ headerTitle: 'Following' }} // Customize the header title
      />
      <TabFourStack.Screen
        name="CardDetail" // Name of the new screen
        component={CardDetailScreen}
        options={{ headerTitle: 'Collection Detail' }} // Customize the header title
      />
    </TabOneStack.Navigator>
  );
}

const TabTwoStack = createStackNavigator();

function TabTwoNavigator() {
  return (
    <TabTwoStack.Navigator>
      <TabTwoStack.Screen
        name="TabTwoScreen"
        component={TabTwoScreen}
        options={{ headerTitle: "Search" }}
      />
      <TabTwoStack.Screen
        name="SearchResult" // Add a screen for the SearchResultScreen
        component={SearchResultScreen}
        options={{ headerTitle: "Search Result" }} // Customize the header title
      />
      <TabFourStack.Screen
        name="CardDetail" // Name of the new screen
        component={CardDetailScreen}
        options={{ headerTitle: 'Collection Detail' }} // Customize the header title
      />
      <TabFourStack.Screen
        name="UserProfile" // Name of the new screen
        component={UserProfile}
        options={{ headerTitle: 'User Profile' }} // Customize the header title
      />
      <TabFourStack.Screen
        name="FollowersListUser" // Add a screen for the FollowersList component
        component={FollowersListUser}
        options={{ headerTitle: 'Followers' }} // Customize the header title
      />
      <TabFourStack.Screen
        name="FollowingListUser" // Add a screen for the FollowingList component
        component={FollowingListUser}
        options={{ headerTitle: 'Following' }} // Customize the header title
      />
      <TabOneStack.Screen
        name="CommentDetail" // Add a screen for the CommentDetailScreen
        component={CommentDetailScreen}
        options={{ headerTitle: "Comments" }} // Customize the header title
      />
      <TabOneStack.Screen
        name="PoetIntro" // Add a screen for the CommentDetailScreen
        component={PoetIntro}
        options={{ headerTitle: "Poet Introduction" }} // Customize the header title
      />
    </TabTwoStack.Navigator>
  );
}

const TabThreeStack = createStackNavigator();

function TabThreeNavigator() {
  return (
    <TabThreeStack.Navigator>
      <TabThreeStack.Screen
        name="TabThreeScreen"
        component={TabThreeScreen}
        options={{ headerTitle: "Friends" }}
      />
      <TabThreeStack.Screen
        name="Chat"
        component={Chat}
        options={{ headerTitle: "Chat" }}
      />
      <TabFourStack.Screen
        name="UserProfile" // Name of the new screen
        component={UserProfile}
        options={{ headerTitle: 'User Profile' }} // Customize the header title
      />
      <TabFourStack.Screen
        name="FollowersListUser" // Add a screen for the FollowersList component
        component={FollowersListUser}
        options={{ headerTitle: 'Followers' }} // Customize the header title
      />
      <TabFourStack.Screen
        name="FollowingListUser" // Add a screen for the FollowingList component
        component={FollowingListUser}
        options={{ headerTitle: 'Following' }} // Customize the header title
      />
      <TabOneStack.Screen
        name="PoetIntro" // Add a screen for the CommentDetailScreen
        component={PoetIntro}
        options={{ headerTitle: "Poet Introduction" }} // Customize the header title
      />
      <TabOneStack.Screen
        name="CommentDetail" // Add a screen for the CommentDetailScreen
        component={CommentDetailScreen}
        options={{ headerTitle: "Comments" }} // Customize the header title
      />
      <TabFourStack.Screen
        name="CardDetail" // Name of the new screen
        component={CardDetailScreen}
        options={{ headerTitle: 'Collection Detail' }} // Customize the header title
      />
    </TabThreeStack.Navigator>
  );
}

const TabFourStack = createStackNavigator();

function TabFourNavigator() {
  return (
    <TabFourStack.Navigator>
      <TabFourStack.Screen
        name="TabFourScreen"
        component={TabFourScreen}
        options={{ headerTitle: 'Profile' }}
      />
      <TabFourStack.Screen
        name="FollowersList" // Add a screen for the FollowersList component
        component={FollowersList}
        options={{ headerTitle: 'Followers' }} // Customize the header title
      />
      <TabFourStack.Screen
        name="FollowingList" // Add a screen for the FollowingList component
        component={FollowingList}
        options={{ headerTitle: 'Following' }} // Customize the header title
      />
      <TabOneStack.Screen
        name="CommentDetail" // Add a screen for the CommentDetailScreen
        component={CommentDetailScreen}
        options={{ headerTitle: "Comments" }} // Customize the header title
      />
      <TabFourStack.Screen
        name="CardDetail" // Name of the new screen
        component={CardDetailScreen}
        options={{ headerTitle: 'Collection Detail' }} // Customize the header title
      />
      <TabFourStack.Screen
        name="EditProfileView" // Name of the new screen
        component={EditProfileView}
        options={{ headerTitle: 'Edit Profile' }} // Customize the header title
      />
      <TabOneStack.Screen
        name="PoetIntro" // Add a screen for the CommentDetailScreen
        component={PoetIntro}
        options={{ headerTitle: "Poet Introduction" }} // Customize the header title
      />
      <TabFourStack.Screen
        name="UserProfile" // Name of the new screen
        component={UserProfile}
        options={{ headerTitle: 'User Profile' }} // Customize the header title
      />
      <TabFourStack.Screen
        name="FollowersListUser" // Add a screen for the FollowersList component
        component={FollowersListUser}
        options={{ headerTitle: 'Followers' }} // Customize the header title
      />
      <TabFourStack.Screen
        name="FollowingListUser" // Add a screen for the FollowingList component
        component={FollowingListUser}
        options={{ headerTitle: 'Following' }} // Customize the header title
      />
    </TabFourStack.Navigator>
  );
}

const styles = {
  subFabContainer: {
    position: "absolute",
    bottom: 190,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  subFabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "transparent", // Set background color to transparent
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  mainFabButton: {
    position: "absolute",
    bottom: 110,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "transparent", // Set background color to transparent
    justifyContent: "center",
    alignItems: "center",
  },
  switchContainer: {
    position: 'absolute',
    top: 40, // Adjust as needed
    right: 20, // Adjust as needed
    zIndex: 1, // Ensure it's above other elements
  },
};



