import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const PoeticLoading = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Loading...</Text>
      <ActivityIndicator size="large" color="#000" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default PoeticLoading;

