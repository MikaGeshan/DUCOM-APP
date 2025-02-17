import { StyleSheet, View, Image } from 'react-native';
import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Splashscreen = ({ navigation }) => {
  
  useEffect(() => {
    const checkLoginStatus = async () => {
      // Simulasi delay sebelum memeriksa status login
      setTimeout(async () => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          navigation.navigate('Home');
        } else {
          navigation.navigate('Auths');
        }
      }, 1500); // Delay selama 2 detik
    };

    checkLoginStatus();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <Image
          style={styles.logo}
          source={require('../../assets/logo1.png')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    height: 130,
    width: 215,
  },
});

export default Splashscreen;
