import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { View } from "react-native";
import HeadingComponent from "./components/HeadingComponent";

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />Е
      <HeadingComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
