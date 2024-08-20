import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native';
import {Skeleton} from 'react-native-elements';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  ALERT_TYPE,
  Dialog,
  AlertNotificationRoot,
} from 'react-native-alert-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImagePicker from 'react-native-image-crop-picker';
import axios from 'axios';
import config from '../../config';

const serverUrl = config.SERVER_URL;

export default function EditProfilePage() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [banner, setBanner] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [newProfileImage, setNewProfileImage] = useState('');
  const [newBannerImage, setNewBannerImage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function getData() {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Token Retrieved Successfully');

      const userResponse = await axios.post(`${serverUrl}/userdata`, {token});
      console.log('Data Retrieved Successfully');

      const user = userResponse.data.data;
      setUserData(user);
      setUsername(user.username);

      if (user.bannerPicture) {
        setBanner({
          uri: `${user.bannerPicture}`,
        });
        console.log('Image Banner Retrieved Successfully');
      }

      if (user.profilePicture) {
        setProfilePicture({
          uri: `${user.profilePicture}`,
        });
        console.log('Image Profile Retrieved Successfully');
      }
    } catch (error) {
      console.error('Error occurred:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    getData();
  }, []);

  const validateUsername = username => {
    const usernameRegex = /^[a-z0-9]{4,15}$/;
    return usernameRegex.test(username) && !username.includes(' ');
  };

  useEffect(() => {
    const beforeRemoveListener = navigation.addListener('beforeRemove', e => {
      if (isSaving) {
        return;
      }

      e.preventDefault();
      Alert.alert('Konfirmasi', 'Apakah anda ingin membatalkan perubahan?', [
        {
          text: 'No',
          style: 'cancel',
          onPress: () => {},
        },
        {
          text: 'Yes',
          onPress: () => {
            setUsername(userData?.username);
            setName(userData?.name);
            setBio(userData?.bio);
            navigation.dispatch(e.data.action);
          },
        },
      ]);
    });

    return beforeRemoveListener;
  }, [navigation, userData, isSaving]);

  navigation.setOptions({
    headerRight: () => (
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}> Save </Text>
      </TouchableOpacity>
    ),
  });

  const handleSave = async () => {
    setIsSaving(true);

    Alert.alert('Confirmation', 'Do you want to save the changes?', [
      {text: 'No', style: 'cancel', onPress: () => setIsSaving(false)},
      {
        text: 'Yes',
        style: 'default',
        onPress: async () => {
          try {
            if (!username) {
              Dialog.show({
                type: ALERT_TYPE.DANGER,
                title: 'Invalid username',
                textBody: 'Username cannot be empty!',
              });
              return;
            } else if (!validateUsername(username)) {
              Dialog.show({
                type: ALERT_TYPE.DANGER,
                title: 'Invalid Username',
                textBody:
                  '4-15 characters, only lowercase letters and numbers without spaces.',
              });
              return;
            }

            const token = await AsyncStorage.getItem('token');
            const updatedUserData = {token: token};

            if (name && name !== userData?.name) {
              updatedUserData.name = name;
            }

            if (username && username !== userData?.username) {
              const checkUsernameResponse = await axios.post(
                `${serverUrl}/check-username`,
                {username},
              );
              if (checkUsernameResponse.data.status === 'error') {
                setIsSaving(false);
                Dialog.show({
                  type: ALERT_TYPE.DANGER,
                  title: 'Error',
                  textBody: 'Username already exist!',
                });
                return;
              }
              updatedUserData.username = username;
            }

            if (bio && bio !== userData?.bio) {
              updatedUserData.bio = bio;
            }

            // Upload the new profile image if exists
            if (newProfileImage) {
              const profileFormData = new FormData();
              profileFormData.append('image', {
                uri: newProfileImage.path,
                name: newProfileImage.filename || 'profile.jpg',
                type: newProfileImage.mime,
              });
              profileFormData.append('token', token);

              await axios.post(
                `${serverUrl}/upload-image-profile`,
                profileFormData,
                {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                  },
                },
              );
            }

            // Upload the new banner image if exists
            if (newBannerImage) {
              const bannerFormData = new FormData();
              bannerFormData.append('image', {
                uri: newBannerImage.path,
                name: newBannerImage.filename || 'banner.jpg',
                type: newBannerImage.mime,
              });
              bannerFormData.append('token', token);

              await axios.post(
                `${serverUrl}/upload-image-banner`,
                bannerFormData,
                {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                  },
                },
              );
            }

            const response = await axios.post(
              `${serverUrl}/update-profile`,
              updatedUserData,
            );

            if (response.data.status === 'update') {
              Dialog.show({
                type: ALERT_TYPE.SUCCESS,
                title: 'Success',
                textBody: 'Updated Successfully!',
                onHide: () => {
                  setTimeout(() => {
                    Dialog.hide();
                    navigation.goBack();
                  }, 1000); // Delay 1 second before hiding the dialog and navigating back
                },
              });
            } else {
              setIsSaving(false);
              Dialog.show({
                type: ALERT_TYPE.DANGER,
                title: 'Error',
                textBody: 'An Error Occured. Please Try Again Later.',
              });
            }
          } catch (error) {
            setIsSaving(false);
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile');
          }
        },
      },
    ]);
  };

  const selectImageProfile = () => {
    ImagePicker.openPicker({
      width: 400,
      height: 400,
      cropping: true,
      mediaType: 'photo',
      cropperCircleOverlay: true,
      avoidEmptySpaceAroundImage: true,
    })
      .then(image => {
        setNewProfileImage(image); // Store the image temporarily
        setProfilePicture({uri: image.path});
      })
      .catch(error => {
        console.error('Error selecting image:', error);
      });
  };

  const selectImageBanner = () => {
    ImagePicker.openPicker({
      width: 1600,
      height: 900,
      cropping: true,
      mediaType: 'photo',
      avoidEmptySpaceAroundImage: true,
    })
      .then(image => {
        setNewBannerImage(image); // Store the image temporarily
        setBanner({uri: image.path});
      })
      .catch(error => {
        console.error('Error selecting image:', error);
      });
  };

  return (
    <AlertNotificationRoot>
      <SafeAreaView style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.bannerContainer}>
            {isLoading ? (
              <Skeleton containerStyle={styles.banner} animation="wave" />
            ) : (
              <TouchableOpacity onPress={selectImageBanner}>
                <ImageBackground
                  source={banner || require('../../assets/banner.png')}
                  style={styles.banner}
                  resizeMode="cover">
                  <View style={styles.overlay}>
                    <MaterialCommunityIcons
                      name="camera"
                      size={50}
                      color="#fff"
                    />
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.contentContainer}>
            {isLoading ? (
              <Skeleton
                containerStyle={styles.profilePicture}
                animation="wave"
              />
            ) : (
              <TouchableOpacity onPress={selectImageProfile}>
                <ImageBackground
                  source={
                    profilePicture || require('../../assets/profilepic.png')
                  }
                  style={styles.profilePicture}
                  imageStyle={styles.profileImage}
                  resizeMode="cover">
                  <View style={styles.profileOverlay}>
                    <MaterialCommunityIcons
                      name="camera"
                      size={30}
                      color="#fff"
                    />
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            )}

            <View style={styles.usernameContainer}>
              <View style={styles.usernameInputContainer}>
                <Text style={styles.usernameStatic}> @</Text>
                {isLoading ? (
                  <Skeleton height={20} width={100} animation="wave" />
                ) : isEditing ? (
                  <TextInput
                    style={styles.usernameInput}
                    value={username}
                    onChangeText={text => setUsername(text)}
                    onBlur={() => setIsEditing(false)}
                    autoFocus
                  />
                ) : (
                  <Text style={styles.username}> {username} </Text>
                )}
              </View>
              {!isLoading && (
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <MaterialCommunityIcons
                    name="pencil"
                    size={17}
                    color="#000"
                  />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.textInput}
                placeholder={userData?.name}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                value={bio}
                onChangeText={setBio}
                style={styles.textInput}
                placeholder={userData?.bio || 'Bio'}
                multiline
                maxLength={150}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder={userData?.email}
                editable={false}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AlertNotificationRoot>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  bannerContainer: {
    width: '100%',
    height: 200,
    marginBottom: 20,
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 20,
  },
  profileImage: {
    borderRadius: 60, // Ensures the image is circular
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  profileOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 60, // Circular overlay
  },
  contentContainer: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  usernameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameStatic: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  usernameInput: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 5,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    width: '100%',
  },
  saveButton: {
    backgroundColor: '#00137F',
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 50,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
