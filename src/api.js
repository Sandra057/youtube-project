import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, setDoc } from "firebase/firestore";

export const signUp = async (name, email, password, profilePicture) => {
  const auth = getAuth();
  const firestore = getFirestore();
  const storage = getStorage();

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  let profilePictureURL = null;
  if (profilePicture) {
    const storageRef = ref(storage, `profilePictures/${user.uid}`);
    await uploadBytes(storageRef, profilePicture);
    profilePictureURL = await getDownloadURL(storageRef);
  }

  await updateProfile(user, {
    displayName: name,
    photoURL: profilePictureURL,
  });

  await setDoc(doc(firestore, "users", user.uid), {
    name,
    email,
    profilePicture: profilePictureURL,
  });
};
