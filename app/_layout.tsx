import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, StyleSheet, Platform } from 'react-native';
import { isAuthenticated as checkAuth } from './utils/auth';
import { COLORS } from '@/constants/theme';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function RootLayout() {
  
  // Set web body background
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Set the document body background to match our app background
      if (typeof document !== 'undefined') {
        document.body.style.backgroundColor = COLORS.background;
        document.documentElement.style.backgroundColor = COLORS.background;
        // Ensure no margin/padding that could show default background
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.documentElement.style.margin = '0';
        document.documentElement.style.padding = '0';
      }
    }
  }, []);

  return (
    <View style={styles.rootContainer}>
      <ErrorBoundary>
        <StatusBar style="light" backgroundColor={COLORS.background} />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 300,
            contentStyle: { backgroundColor: COLORS.background },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              animation: 'fade',
              animationDuration: 200,
            }}
          />

          <Stack.Screen
            name="(profile)"
            options={{
              animation: 'slide_from_right',
              animationDuration: 250,
            }}
          />
          <Stack.Screen
            name="(automation)"
            options={{
              animation: 'slide_from_right',
              animationDuration: 300,
            }}
          />
          <Stack.Screen
            name="(Login)"
            options={{
              animation: 'slide_from_right',
              animationDuration: 400,
            }}
          />
          <Stack.Screen
            name="(connect)"
            options={{
              animation: 'slide_from_right',
              animationDuration: 300,
            }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{
              animation: 'slide_from_bottom',
              animationDuration: 350,
            }}
          />
        </Stack>
      </ErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    ...(Platform.OS === 'web' && {
      minHeight: '100vh' as any, // For web browsers
      minWidth: '100vw' as any, // For web browsers
      position: 'fixed' as any,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    }),
  },
});
