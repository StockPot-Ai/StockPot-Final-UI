import React, { useEffect } from 'react';
import {
  View,
  StatusBar,
  BackHandler,
  StyleSheet,
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
import HistoryScreen from './src/screens/HistoryScreen';
import BottomNav from './src/components/BottomNav';
import recipes from './src/data/recipes';
import { AccountProvider, useAccount } from './src/context/AccountContext';

function AppContent() {
  const { isLoggedIn } = useAccount();
  const [authView, setAuthView] = React.useState('login');
  const [currentScreen, setCurrentScreen] = React.useState('home');
  const [selectedRecipe, setSelectedRecipe] = React.useState(null);
  const [retailItems, setRetailItems] = React.useState([]);
  const [retailShoppingListId, setRetailShoppingListId] = React.useState(null);

  const goHome = React.useCallback(() => {
    setCurrentScreen('home');
    setSelectedRecipe(null);
  }, []);

  const openRecipe = React.useCallback((recipeOrTitle) => {
    if (typeof recipeOrTitle === 'object' && recipeOrTitle !== null) {
      setSelectedRecipe(recipeOrTitle);
      setCurrentScreen('ingredient');
    } else if (recipes[recipeOrTitle]) {
      setSelectedRecipe(recipes[recipeOrTitle]);
      setCurrentScreen('ingredient');
    } else {
      setSelectedRecipe({ title: recipeOrTitle, name: recipeOrTitle });
      setCurrentScreen('ingredient');
    }
  }, []);

  const openRetail = React.useCallback((items, shoppingListId = null) => {
    setRetailItems(items || []);
    setRetailShoppingListId(shoppingListId);
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
        if (selectedRecipe) {
          setCurrentScreen('ingredient');
        } else {
          setCurrentScreen('mealplan');
        }
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
  }, [currentScreen, goHome, selectedRecipe]);

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
      />
    );
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
        shoppingListId={retailShoppingListId}
        onBack={() => {
          if (selectedRecipe) {
            setCurrentScreen('ingredient');
          } else {
            setCurrentScreen('mealplan');
          }
        }}
      />
    );
  }

  return (
    <View style={styles.shell}>
      {renderMainScreen()}
      <BottomNav activeNav={renderActiveNav()} onNavChange={handleNavChange} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AccountProvider>
        <View style={styles.root}>
          <StatusBar barStyle="dark-content" />
          <AppContent />
        </View>
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
