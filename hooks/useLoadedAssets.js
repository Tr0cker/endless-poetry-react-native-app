import React from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";

export function useLoadedAssets() {
  const [isLoadingComplete, setLoadingComplete] = React.useState(false);

  React.useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        SplashScreen.preventAutoHideAsync();

        // Load Ionicons and a custom font
        await Font.loadAsync({
          ...Ionicons.font,
          'KirimomiSwash': require('../assets/fonts/KirimomiSwash.ttf'), // Example path to your custom font
          // You can add more custom fonts here
        });

      } catch (e) {
        console.warn(e);
      } finally {
        setLoadingComplete(true);
        SplashScreen.hideAsync();
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  return isLoadingComplete;
}
