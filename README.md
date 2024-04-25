Android app made with [Expo](https://expo.dev/) to collect data from sensors and export it to CSV file. 
Data is collected from accelerometer, magnetometer and gyroscope.

## Screenshot

<img src="./screenshot.jpg" width="600" alt="screenshot">

## How to build .apk

run the following commands to open up an app using local server provided by Expo Go

```bash
git clone https://github.com/3sbi/sensor-scraper-expo-ts.git
cd ./sensor-scraper-expo-ts
npm install
npm run start
```

then open up device emulator in Android Studio and run the following command:

```bash
npx expo run:android --variant debug
```

To build it use expo-cli (you will need an expo account):

```bash
npm install --global eas-cli
sudo eas build -p android --profile preview
```

It can be built locally using android studio emalator and react-native, but it doesn't work properly for me because of expo packages that crash the build.

If you want to use it just download [.rar file](./app-release.rar) and extract apk from it


## License


This project is [GPL v2 licensed](./LICENSE)