import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from './src/store';
import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AddLogScreen from './src/screens/AddLogScreen';
import GenerateScreen from './src/screens/GenerateScreen';

export type RootStackParamList = {
  Auth: undefined;
  Dashboard: undefined;
  AddLog: undefined;
  Generate: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const { token, loadAuth } = useAuthStore();

  useEffect(() => {
    loadAuth();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#111',
          headerTitleStyle: { fontWeight: '600' },
          headerShadowVisible: false,
        }}
      >
        {!token ? (
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen} 
            options={{ headerShown: false }} 
          />
        ) : (
          <>
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen} 
              options={{ title: 'Evident' }} 
            />
            <Stack.Screen 
              name="AddLog" 
              component={AddLogScreen} 
              options={{ title: 'Add Log' }} 
            />
            <Stack.Screen 
              name="Generate" 
              component={GenerateScreen} 
              options={{ title: 'Generate Summary' }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
