import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Animated, // Import Animated
  Easing, // Import Easing for the animation easing function
} from "react-native";
import axios from "axios";
import { useUserContext } from "../UserContext";
import AsyncStorage from '@react-native-async-storage/async-storage';


const SignInScreen = ({ navigation }) => {
  const { setUserData } = useUserContext();
  const [username, setUsername] = useState(""); // Change to username
  const [password, setPassword] = useState("");

  const [isCreateAccount, setCreateAccount] = useState(false); // Track if user is in "Create Account" mode

  const [registrationMessage, setRegistrationMessage] = useState(null); // State for registration message

  const fadeInAnim = new Animated.Value(0); // Initialize the animated value

  const [loginErrorMessage, setLoginErrorMessage] = useState(null);

  useEffect(() => {
    const checkUserCredentials = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      const storedUserId = await AsyncStorage.getItem('userId');
  
      if (storedUsername && storedUserId) {
        // Convert storedUserId to a number
        const userIdAsNumber = parseInt(storedUserId, 10); // 10 is the radix for decimal
  
        setUserData({ username: storedUsername, userId: userIdAsNumber });
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        });
      }
    };
  
    checkUserCredentials();
  
    // Fade-in animation code
    Animated.timing(fadeInAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, []);
  
  

  const handleSignIn = async () => {
    try {
      const response = await axios.post("https://rui2666.pythonanywhere.com/login", {
        username, // Send username
        password,
      });

      if (response.status === 200) {
        const data = response.data;
        const userId = data.userId;
        const returnedUsername = data.username; // Change to username
        setUserData({ userId, username: returnedUsername }); // Update user data in context
        await AsyncStorage.setItem('username', returnedUsername);
        await AsyncStorage.setItem('userId', userId.toString());
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainApp' }], 
        });
      } else {
        // Handle incorrect login
        setLoginErrorMessage(null);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setLoginErrorMessage("Invalid username or password");
      } else {
        console.error("Error during login:", error);
        // Handle other errors
      }
    }
  };

  const handleSignUp = async () => {
    if (username.trim() === "" || password.trim() === "") {
      setRegistrationMessage("Please fill in all required fields.");
      return;
    }
  
    try {
      const response = await axios.post("https://rui2666.pythonanywhere.com/sign_up", {
        username,
        password,
      });
  
      if (response.status === 201) {
        setRegistrationMessage("Registration successful. Logging in...");
        handleSignIn(); // Call handleSignIn after successful registration
      } else if (response.status === 409) {
        setRegistrationMessage("Username already exists.");
      } else {
        setRegistrationMessage("Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      setRegistrationMessage("Error during registration. Please try again.");
    }
  };

  const handleCreateAccount = () => {
    setCreateAccount(true);
    setRegistrationMessage(null); // Clear registration message when switching to Create Account mode
  };

  const handleGoBack = () => {
    setCreateAccount(false);
    setRegistrationMessage(null); // Clear registration message when switching back
  };

  return (
    <ImageBackground source={require('../assets/images/login_bg.jpg')} style={styles.container}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { opacity: fadeInAnim }]}>
          {isCreateAccount ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={(text) => setUsername(text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry={true}
                value={password}
                onChangeText={(text) => setPassword(text)}
              />
              <TouchableOpacity style={styles.button} onPress={handleSignUp}>
                <Text style={styles.buttonText}>Create Account</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createAccountButton} onPress={handleGoBack}>
                <Text style={styles.createAccountButtonText}>Back to Login</Text>
              </TouchableOpacity>
              {registrationMessage && (
                <Text style={styles.registrationMessage}>{registrationMessage}</Text>
              )}
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={(text) => setUsername(text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry={true}
                value={password}
                onChangeText={(text) => setPassword(text)}
              />
              <TouchableOpacity style={styles.button} onPress={handleSignIn}>
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
              {loginErrorMessage && (
                <Text style={styles.errorMessage}>{loginErrorMessage}</Text>
              )}
              <TouchableOpacity style={styles.createAccountButton} onPress={handleCreateAccount}>
                <Text style={styles.createAccountButtonText}>Create Account</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0)",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 15, // Slightly larger border radius
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, // Larger shadow
    shadowOpacity: 0.3, // Slightly more opacity
    shadowRadius: 8, // Larger shadow radius
    elevation: 8, // Higher elevation
    padding: 30, // More padding
    width: '95%', // Larger width
    alignItems: 'center',
  },
  input: {
    borderWidth: 1.5, // Thicker border
    borderColor: "#ccc",
    borderRadius: 8, // More rounded borders
    padding: 15, // More padding
    marginVertical: 12, // More vertical space between inputs
    width: "100%",
    fontSize: 18, // Larger font size
  },
  forgotPasswordButton: {
    width: "100%",
    textAlign: "flex-end",
  },
  forgotPasswordButtonText: {
    color: "#20B2AA",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
  },
  button: {
    backgroundColor: "#9060de",
    borderRadius: 8, // More rounded
    paddingVertical: 15, // More vertical padding
    paddingHorizontal: 20, // More horizontal padding
    marginTop: 15, // More margin on top
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20, // Larger text
  },
  createAccountButton: {
    backgroundColor: "transparent",
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 15,
    width: "100%",
    alignItems: "center",
  },
  createAccountButtonText: {
    color: "#9060de",
    fontSize: 18, // Larger text
    fontWeight: "bold",
  },
  errorMessage: {
    color: 'red',
    marginTop: 12,
    textAlign: 'center',
    fontSize: 16, // Larger text
  },
});

export default SignInScreen;
