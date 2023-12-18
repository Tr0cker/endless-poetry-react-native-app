import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const NothingFound = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.poem}>
      There is nothing but a cat c:
      </Text>
      <Image
        source={require('../assets/images/blank.gif')}
        style={styles.gif}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 20,
  },
  poem: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 20,
    fontStyle: 'italic',
    color:'#050505',
  },
  gif: {
    width: 294,
    height: 229,
  },
});

export default NothingFound;
