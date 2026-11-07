import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { observer } from 'mobx-react-lite';

import { modelStore } from './src/store/ModelStore';
import { RootNavigator } from './src/navigation/RootNavigator';
import { darkTheme } from './src/utils/colors';

export const App = observer(() => {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  /**
   * Hardware memory management for Nubia Red Magic 10 Pro:
   * When the app transitions to 'background' or 'inactive', immediately
   * call releaseContext() / unload() to release 8+ GB of RAM and Adreno 830 VRAM
   * back to the system, protecting against Android Low Memory Killer (LMK).
   */
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const isEnteringBackground =
        appState.current.match(/active/) &&
        (nextAppState === 'background' || nextAppState === 'inactive');

      if (isEnteringBackground) {
        try {
          await modelStore.releaseContext();
          await modelStore.unload();
        } catch (error) {
          console.warn('Failed to release model context on background:', error);
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PaperProvider theme={darkTheme as any}>
          <StatusBar
            barStyle="light-content"
            backgroundColor={darkTheme.colors.background}
          />
          <NavigationContainer theme={darkTheme as any}>
            <RootNavigator />
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;