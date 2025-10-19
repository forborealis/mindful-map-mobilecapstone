import { authService } from './authService';

export const initializeAuth = async () => {
//Validates authentication and session status, fetched from App.js
  try {
    const session = await authService.checkAuthStatus();
    
    if (session.isAuthenticated) {
      console.log('User session found:', session.user.email);
      return { initialRoute: 'Home' };
    } else {
      console.log('No user session found');
      return { initialRoute: 'Landing' };
    }
  } catch (error) {
    console.error('Error during auth initialization:', error);
    return { initialRoute: 'Landing' };
  }
};