import { 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  ConfirmationResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';

class AuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;

  setupRecaptcha(elementId: string) {
    this.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA solved');
      }
    });
  }

  async sendOTP(phoneNumber: string): Promise<boolean> {
    try {
      if (!this.recaptchaVerifier) {
        throw new Error('reCAPTCHA not initialized');
      }

      // For prototype, we'll simulate OTP sending
      console.log('Simulating OTP send to:', phoneNumber);
      return true;

      // Actual implementation:
      // this.confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, this.recaptchaVerifier);
      // return true;
    } catch (error) {
      console.error('Error sending OTP:', error);
      return false;
    }
  }

  async verifyOTP(otp: string): Promise<boolean> {
    try {
      // For prototype, accept mock OTP
      if (otp === '123456') {
        return true;
      }
      
      // Actual implementation:
      // if (!this.confirmationResult) {
      //   throw new Error('No confirmation result available');
      // }
      // await this.confirmationResult.confirm(otp);
      // return true;
      
      return false;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return false;
    }
  }

  async createUserProfile(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    try {
      const userId = `user_${Date.now()}`;
      const user: User = {
        ...userData,
        id: userId,
        createdAt: new Date()
      };

      await setDoc(doc(db, 'users', userId), user);
      return user;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
}

export const authService = new AuthService();