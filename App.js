import React, { useEffect } from 'react';
import {
  View,
  StatusBar,
  BackHandler,
  StyleSheet,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import AccountScreen from './src/screens/AccountScreen';
import IngredientScreen from './src/screens/IngredientScreen';
import MealPlanScreen from './src/screens/MealPlanScreen';
import SavingsDashboard from './src/screens/SavingsDashboard';
import RetailComparingScreen from './src/screens/RetailComparingScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import BottomNav from './src/components/BottomNav';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AsyncStorage from './src/utils/safeStorage';
import { AccountProvider, useAccount } from './src/context/AccountContext';
import { NotificationProvider } from './src/context/NotificationContext';
import InAppNotificationBanner from './src/components/notification/InAppNotificationBanner';
import NotificationCenterModal from './src/components/notification/NotificationCenterModal';

function AppContent() {
  const { isLoggedIn } = useAccount();
  const [isSplashing, setIsSplashing] = React.useState(true);
  const [hasOnboarded, setHasOnboarded] = React.useState(null);
  const [authView, setAuthView] = React.useState('login');
  const [currentScreen, setCurrentScreen] = React.useState('home');
  const [selectedRecipe, setSelectedRecipe] = React.useState(null);
  const [retailItems, setRetailItems] = React.useState([]);
  const [mealPlanTargetDay, setMealPlanTargetDay] = React.useState(null);

  React.useEffect(() => {
    AsyncStorage.getItem('@stockpot_has_onboarded')
      .then((val) => {
        setHasOnboarded(val === 'true');
      })
      .catch(() => setHasOnboarded(true));
  }, []);

  const handleOnboardingComplete = React.useCallback(async () => {
    try {
      await AsyncStorage.setItem('@stockpot_has_onboarded', 'true');
    } catch (_) {}
    setHasOnboarded(true);
  }, []);

  const goHome = React.useCallback(() => {
    setCurrentScreen('home');
    setSelectedRecipe(null);
  }, []);

  const openRecipe = React.useCallback((recipeItem) => {
    if (typeof recipeItem === 'object' && recipeItem !== null) {
      setSelectedRecipe(recipeItem);
      setCurrentScreen('ingredient');
    } else if (typeof recipeItem === 'string') {
      setSelectedRecipe({ title: recipeItem, id: recipeItem });
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
      } else if (id === 'History') {
        setCurrentScreen('history');
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
        currentScreen === 'savings' ||
        currentScreen === 'history'
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
    if (currentScreen === 'history') return 'History';
    return 'Home';
  };

  const renderMainScreen = () => {
    if (currentScreen === 'account') {
      return <AccountScreen onBack={goHome} onNavigateHome={goHome} />;
    }
    if (currentScreen === 'mealplan') {
      return (
        <MealPlanScreen
          onNavigateHome={goHome}
          onSelectMeal={openRecipe}
          onOpenRetail={openRetail}
          initialDay={mealPlanTargetDay}
        />
      );
    }
    if (currentScreen === 'savings') {
      return <SavingsDashboard onBack={goHome} />;
    }
    if (currentScreen === 'history') {
      return <HistoryScreen onBack={goHome} />;
    }
    return (
      <HomeScreen
        onSelectRecipe={openRecipe}
        onMilestonePress={() => setCurrentScreen('savings')}
        onOpenProfile={() => setCurrentScreen('account')}
      />
    );
  };

  if (isSplashing || hasOnboarded === null) {
    return <SplashScreen onFinish={() => setIsSplashing(false)} />;
  }

  if (hasOnboarded === false) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

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

  const renderScreenContent = () => {
    if (currentScreen === 'ingredient' && selectedRecipe) {
      return (
        <IngredientScreen
          recipe={selectedRecipe}
          onBack={goHome}
          onCompare={openRetail}
          onAddToMealPlan={(navParams) => {
            if (navParams?.day) {
              setMealPlanTargetDay(navParams.day);
            }
            setCurrentScreen('mealplan');
          }}
        />
      );
    }

    if (currentScreen === 'retail') {
      return (
        <RetailComparingScreen
          items={retailItems}
          onBack={() => {
            if (selectedRecipe) {
              setCurrentScreen('ingredient');
            } else {
              goHome();
            }
          }}
        />
      );
    }

    return (
      <>
        {renderMainScreen()}
        <BottomNav activeNav={renderActiveNav()} onNavChange={handleNavChange} />
      </>
    );
  };

  return (
    <View style={styles.shell}>
      {renderScreenContent()}
      <InAppNotificationBanner />
      <NotificationCenterModal />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AccountProvider>
        <NotificationProvider>
          <View style={styles.root}>
            <StatusBar barStyle="dark-content" />
            <AppContent />
          </View>
        </NotificationProvider>
      </AccountProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  shell: {
    flex: 1,
  },
});
