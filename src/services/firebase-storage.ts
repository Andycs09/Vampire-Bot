import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

class FirebaseStorageService {
  async uploadPhoto(file: File, landId: string): Promise<{ url: string; path: string }> {
    try {
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.name}`;
      const storagePath = `lands/${landId}/photos/${filename}`;
      
      console.log('📤 Uploading photo to Firebase:', storagePath);
      
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, file);
      
      console.log('✅ Photo uploaded successfully');
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('✅ Download URL obtained:', downloadURL);
      
      return {
        url: downloadURL,
        path: storagePath
      };
    } catch (error) {
      console.error('❌ Firebase upload error:', error);
      throw error;
    }
  }

  async uploadMultiplePhotos(files: File[], landId: string): Promise<Array<{ url: string; path: string }>> {
    const uploadPromises = files.map(file => this.uploadPhoto(file, landId));
    return Promise.all(uploadPromises);
  }

  // Convert file to base64 for Gemini API
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (data:image/jpeg;base64,)
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const firebaseStorageService = new FirebaseStorageService();
