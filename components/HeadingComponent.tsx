import React, { useState, useEffect } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Magnetometer,
  MagnetometerMeasurement,
  Accelerometer,
  AccelerometerMeasurement,
  Gyroscope,
  GyroscopeMeasurement,
} from "expo-sensors";
import { Subscription } from "expo-sensors/build/Pedometer";
import * as FileSystem from "expo-file-system";

type DataToSave<T> = Array<T & { timestamp: number }>;

export default function Compass() {
  const [speed, setSpeed] = useState<number>(100);
  const [accelerometerData, setAccelerometerData] = useState({
    x: 0,
    y: 0,
    z: 0,
  });
  const [magnetometerData, setMagnetometerData] = useState({
    x: 0,
    y: 0,
    z: 0,
  });
  const [gyroscopeData, setGyroscopeData] = useState({ x: 0, y: 0, z: 0 });
  const [subscriptions, setSubscriptions] = useState<{
    accelerometer: Subscription | null;
    magnetometer: Subscription | null;
    gyroscope: Subscription | null;
  } | null>(null);

  const [magnetometerDataToSave, setMagnetometerDataToSave] = useState<
    DataToSave<MagnetometerMeasurement>
  >([]);

  const [accelerometerDataToSave, setAccelerometerDataToSave] = useState<
    DataToSave<AccelerometerMeasurement>
  >([]);
  const [gyroscopeDataToSave, setGyroscopeDataToSave] = useState<
    DataToSave<GyroscopeMeasurement>
  >([]);

  const _updateSpeed = (speed: number) => {
    Accelerometer.setUpdateInterval(speed);
    Magnetometer.setUpdateInterval(speed);
    Gyroscope.setUpdateInterval(speed);
    setSpeed(speed);
  };

  const getHeading = (x: number, y: number): number => {
    let heading = Math.atan2(y, x) * (180 / Math.PI);
    heading = heading >= 0 ? heading : heading + 360;
    return heading;
  };

  const _subscribe = () => {
    const mSub = Magnetometer.addListener((data) => {
      setMagnetometerData(data);
      setMagnetometerDataToSave((prev) => {
        return [...prev, { ...data, timestamp: Date.now() }];
      });
    });

    const aSub = Accelerometer.addListener((data) => {
      setAccelerometerData(data);
      setAccelerometerDataToSave((prev) => {
        return [...prev, { ...data, timestamp: Date.now() }];
      });
    });

    const gSub = Gyroscope.addListener((data) => {
      setGyroscopeData(data);
      setGyroscopeDataToSave((prev) => {
        return [...prev, { ...data, timestamp: Date.now() }];
      });
    });

    _updateSpeed(100);
    setSubscriptions({
      magnetometer: mSub,
      accelerometer: aSub,
      gyroscope: gSub,
    });
  };

  const _unsubscribe = () => {
    subscriptions?.magnetometer && subscriptions.magnetometer.remove();
    subscriptions?.accelerometer && subscriptions.accelerometer.remove();
    subscriptions?.gyroscope && subscriptions.gyroscope.remove();
    setSubscriptions(null);
  };

  useEffect(() => {
    _subscribe();
    return () => _unsubscribe();
  }, []);

  const saveDataToCSV = async () => {
    try {
      if (Platform.OS !== "android") throw new Error("Not an android device!");

      const permissions =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) throw new Error("permissions not granted");

      const filename = `magnetometer_data_${new Date()}.csv`;
      const uri = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        filename,
        "text/csv"
      );

      let linesToSave: string =
        "Magnetometer_x, Magnetometer_y, Magnetometer_z, Heading (angle), Accelerometer_x, Accelerometer_y, Accelerometer_z, Gyroscope_x, Gyroscope_y, Gyroscope_z\n";

      // I know that timestamps for magnetometer and accelerometer would be different because it requrires some time to add listener to them both
      // that is why we are using index and pretend that timestamp is relatively the same
      for (const [index, mLine] of magnetometerDataToSave.entries()) {
        const aLine = accelerometerDataToSave[index];
        const gLine = gyroscopeDataToSave[index];
        const heading = getHeading(mLine.x, mLine.y);
        const newLine = `${mLine.x}, ${mLine.y}, ${mLine.z}, ${heading}, ${aLine?.x}, ${aLine?.y}, ${aLine?.z}, ${gLine.x}, ${gLine.y}, ${gLine.z}\n`;
        linesToSave = linesToSave + newLine;
      }
      await FileSystem.writeAsStringAsync(uri, linesToSave);
      console.log("Data saved to CSV file.");
      setAccelerometerDataToSave([]);
      setMagnetometerDataToSave([]);
    } catch (error) {
      console.log("Error saving data to CSV file:", error);
    }
  };
  if (Platform.OS !== "android") {
    return <Text style={styles.warning}>THIS IS ANDROID ONLY APP</Text>;
  }

  const noDataToSave =
    accelerometerDataToSave.length === 0 || magnetometerDataToSave.length === 0;

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Text style={styles.text}>Magnetometer:</Text>
        <Text style={styles.text}>
          {subscriptions?.magnetometer ? "RECORDING" : "NOT RECORDING"}
        </Text>
        <Text style={styles.text}>x: {magnetometerData.x}</Text>
        <Text style={styles.text}>y: {magnetometerData.y}</Text>
        <Text style={styles.text}>z: {magnetometerData.z}</Text>
        <Text style={styles.text}>
          heading:{" "}
          {`${getHeading(magnetometerData.x, magnetometerData.y).toFixed(2)}°`}
        </Text>
      </View>

      <View style={styles.container}>
        <Text style={styles.text}>Accelerometer:</Text>
        <Text style={styles.text}>
          {subscriptions?.accelerometer ? "RECORDING" : "NOT RECORDING"}
        </Text>
        <Text style={styles.text}>x: {accelerometerData.x}</Text>
        <Text style={styles.text}>y: {accelerometerData.y}</Text>
        <Text style={styles.text}>z: {accelerometerData.z}</Text>
      </View>

      <View style={styles.container}>
        <Text style={styles.text}>Gyroscope:</Text>
        <Text style={styles.text}>
          {subscriptions?.gyroscope ? "RECORDING" : "NOT RECORDING"}
        </Text>
        <Text style={styles.text}>x: {gyroscopeData.x}</Text>
        <Text style={styles.text}>y: {gyroscopeData.y}</Text>
        <Text style={styles.text}>z: {gyroscopeData.z}</Text>
      </View>

      <View style={styles.buttonContainer}>
        {[
          { label: "Fast (100)", speed: 100 },
          { label: "Normal (200)", speed: 200 },
          { label: "Slow (1000)", speed: 1000 },
        ].map((btn, index, array) => (
          <TouchableOpacity
            key={btn.speed}
            onPress={() => _updateSpeed(btn.speed)}
            disabled={speed === btn.speed}
            style={[
              styles.button,
              index !== 0 && index !== array.length - 1
                ? styles.middleButton
                : {},

              speed === btn.speed ? { backgroundColor: "#ccc" } : {},
            ]}
          >
            <Text>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={subscriptions ? _unsubscribe : _subscribe}
        >
          <Text>{subscriptions ? "Stop" : "Start"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.deleteButton,
            noDataToSave ? styles.disabled : {},
          ]}
          onPress={() => {
            setAccelerometerDataToSave([]);
            setMagnetometerDataToSave([]);
          }}
          disabled={noDataToSave}
        >
          <Text>Delete data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            { paddingHorizontal: 20, minHeight: 60 },
            noDataToSave ? styles.disabled : { backgroundColor: "#22c55e" },
          ]}
          onPress={() => saveDataToCSV()}
          disabled={noDataToSave}
        >
          <Text>Save to CSV file</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "stretch",
    paddingHorizontal: 10,
    marginVertical: 40,
    width: "100%",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "stretch",
    paddingHorizontal: 10,
    marginVertical: 40,
  },
  text: {
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: 20,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
    paddingHorizontal: 20,
    minWidth: 100,
    minHeight: 40,
  },
  middleButton: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#ccc",
  },
  deleteButton: {
    backgroundColor: "#EF4444",
  },
  disabled: {
    opacity: 0.5,
  },
  warning: { fontSize: 40, fontWeight: "900" },
});
