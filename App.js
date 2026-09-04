import React, { useEffect } from 'react';
import {
  View,
  StatusBar,
  BackHandler,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import AccountScreen from './src/screens/AccountScreen';
import IngredientScreen from './src/screens/IngredientScreen';
import MealPlanScreen from './src/screens/MealPlanScreen';
import recipes from './src/data/recipes';
import { AccountProvider, useAccount } from './src/context/AccountContext';

function AppContent() {
  const { isLoggedIn } = useAccount();
  const [authView, setAuthView] = React.useState('login');
  const [currentScreen, setCurrentScreen] = React.useState('home');
  const [selectedRecipe, setSelectedRecipe] = React.useState(null);

  const goHome = React.useCallback(() => {
    setCurrentScreen('home');
    setSelectedRecipe(null);
  }, []);

  const openRecipe = React.useCallback((title) => {
    if (recipes[title]) {
      setSelectedRecipe(recipes[title]);
      setCurrentScreen('ingredient');
    }
  }, []);

  const handleNavChange = React.useCallback(
    (id) => {
      if (id === 'Profile') {
        setCurrentScreen('account');
      } else if (id === 'MealPlan') {
        setCurrentScreen('mealplan');
      } else if (id === 'Shopping') {
        setCurrentScreen('mealplan');
      } else if (id === 'Home') {
        goHome();
      }
    },
    [goHome]
  );

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (
        currentScreen === 'account' ||
        currentScreen === 'ingredient' ||
        currentScreen === 'mealplan'
      ) {
        goHome();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [currentScreen, goHome]);

  const renderActiveNav = () => {
    if (currentScreen === 'account') return 'Profile';
    if (currentScreen === 'mealplan') return 'MealPlan';
    return 'Home';
  };

  if (!isLoggedIn) {
    if (authView === 'signup') {
      return (
        <SignUpScreen
          onSignIn={() => setAuthView('login')}
        />
      );
    }
    return (
      <LoginScreen
        onSignUp={() => setAuthView('signup')}
        onForgotPassword={() => {}}
      />
    );
  }

  if (currentScreen === 'account') {
    return <AccountScreen onBack={goHome} onNavigateHome={goHome} />;
  }

  if (currentScreen === 'ingredient' && selectedRecipe) {
    return <IngredientScreen recipe={selectedRecipe} onBack={goHome} />;
  }

  if (currentScreen === 'mealplan') {
    return <MealPlanScreen onNavigateHome={goHome} />;
  }

  return (
    <HomeScreen
      onSelectRecipe={openRecipe}
      activeNav={renderActiveNav()}
      onNavChange={handleNavChange}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AccountProvider>
        <View style={{ flex: 1 }}>
          <StatusBar barStyle="dark-content" />
          <AppContent />
        </View>
      </AccountProvider>
    </SafeAreaProvider>
  );
}
