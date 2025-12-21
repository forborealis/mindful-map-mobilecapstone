import { authService } from './authService';

export const initializeAuth = async () => {
//Validates authentication and session status, fetched from App.js
  try {
    const session = await authService.checkAuthStatus();
    
    if (session.isAuthenticated) {
      console.log('User session found:', session.user.email);
      const user = await authService.getCurrentUser();
      console.log('User role:', user?.role);
      
      // Check if user is an admin
      if (user?.role === 'admin') {
        console.log('✅ Admin role detected, redirecting to AdminDrawer');
        return { initialRoute: 'AdminDrawer' };
      }
      
      // Check if user is a teacher
      if (user?.role === 'teacher') {
        console.log('✅ Teacher role detected, redirecting to TeacherDrawer');
        return { initialRoute: 'TeacherDrawer' };
      }
      
      console.log('User role is not teacher or admin, redirecting to DailyQuote');
      return { initialRoute: 'DailyQuote' };
    } else {
      console.log('No user session found');
      return { initialRoute: 'Landing' };
    }
  } catch (error) {
    console.error('Error during auth initialization:', error);
    return { initialRoute: 'Landing' };
  }
};