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
import SavingsDashboard from './src/screens/SavingsDashboard';
import RetailComparingScreen from './src/screens/RetailComparingScreen';
import recipes from './src/data/recipes';
import { AccountProvider, useAccount } from './src/context/AccountContext';

function AppContent() {
  const { isLoggedIn } = useAccount();
  const [authView, setAuthView] = React.useState('login');
  const [currentScreen, setCurrentScreen] = React.useState('home');
  const [selectedRecipe, setSelectedRecipe] = React.useState(null);
  const [retailItems, setRetailItems] = React.useState([]);

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

  const openRetail = React.useCallback((items) => {
    setRetailItems(items || []);
    setCurrentScreen('retail');
  }, []);

  const handleNavChange = React.useCallback(
    (id) => {
      if (id === 'Profile') {
        setCurrentScreen('account');
      } else if (id === 'MealPlan') {
        setCurrentScreen('mealplan');
      } else if (id === 'Shopping') {
        setCurrentScreen('mealplan');
      } else if (id === 'Savings') {
        setCurrentScreen('savings');
      } else if (id === 'Home') {
        goHome();
      }
    },
    [goHome]
  );

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentScreen === 'retail') {
        setCurrentScreen('ingredient');
        return true;
      }
      if (
        currentScreen === 'account' ||
        currentScreen === 'ingredient' ||
        currentScreen === 'mealplan' ||
        currentScreen === 'savings'
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
    if (currentScreen === 'savings') return 'Savings';
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
    return (
      <IngredientScreen
        recipe={selectedRecipe}
        onBack={goHome}
        onCompare={openRetail}
      />
    );
  }

  if (currentScreen === 'retail') {
    return (
      <RetailComparingScreen
        items={retailItems}
        onBack={() => setCurrentScreen('ingredient')}
      />
    );
  }

  if (currentScreen === 'mealplan') {
    return <MealPlanScreen onNavigateHome={goHome} />;
  }

  if (currentScreen === 'savings') {
    return <SavingsDashboard onBack={goHome} />;
  }

  return (
    <HomeScreen
      onSelectRecipe={openRecipe}
      activeNav={renderActiveNav()}
      onNavChange={handleNavChange}
      onMilestonePress={() => setCurrentScreen('savings')}
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
