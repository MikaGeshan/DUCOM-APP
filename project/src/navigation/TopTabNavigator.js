import React, {useState} from 'react';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {StyleSheet, View, Dimensions} from 'react-native';
import {
  Likescreen,
  Mediascreen,
  Postscreen,
  Profilescreen,
  Replyscreen,
} from '../pages';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

const Tab = createMaterialTopTabNavigator();
const {height} = Dimensions.get('window');

function TopTabNavigator() {
  const [profileHeight, setProfileHeight] = useState(height * 0.4);

  const handleProfileLayout = event => {
    const {height: profileWrapperHeight} = event.nativeEvent.layout;
    setProfileHeight(profileWrapperHeight);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View
        style={[styles.profileWrapper, {height: profileHeight}]}
        onLayout={handleProfileLayout}>
        <Profilescreen />
      </View>
      <View style={[styles.navigatorWrapper, {height: height - profileHeight}]}>
        <Tab.Navigator
          screenOptions={{
            tabBarLabelStyle: styles.tabBarLabel,
            tabBarIndicatorStyle: styles.tabBarIndicator,
            tabBarStyle: styles.tabBar,
          }}>
          <Tab.Screen name="Posts" component={Postscreen} />
          <Tab.Screen name="Replies" component={Replyscreen} />
          <Tab.Screen name="Likes" component={Likescreen} />
          <Tab.Screen name="Media" component={Mediascreen} />
        </Tab.Navigator>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileWrapper: {
    backgroundColor: '#fff',
  },
  navigatorWrapper: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    elevation: 0,
  },
  tabBarLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textTransform: 'none',
  },
  tabBarIndicator: {
    backgroundColor: '#000',
    height: 3,
  },
});

export default TopTabNavigator;
