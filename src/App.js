import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { db, auth } from './index';
import { Button } from 'reactstrap';

import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

import './App.css';

import Header from './containers/Header/Header';

function AuthButton() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const googleLogin = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(result => {
        navigate('/browse');
      }).catch(console.error);
  };

  const logout = () => {
    signOut(auth)
      .then(() => {
        navigate('/');
      }).catch(console.error);
  };

  return (
    user === null ? (
      <Button onClick={googleLogin}>
        Log in with Google
      </Button>
    )
    : (
      <Button onClick={logout}>
        Log out as {user.displayName}
      </Button>
    )
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [userData, __setUserData] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, user => {
      setUser(user);
    });
  }, []);

  useEffect(() => {
    if(user === null) {
      __setUserData(null);
      return;
    }

    const unsub = onSnapshot(doc(db, 'anchors', user.uid), doc => {
      __setUserData(doc.data() ? doc.data() : null);
    });

    return () => {
      unsub();
    };
  }, [user]);

  const setUserData = nextData => {
    if(user === null) return;
    setDoc(doc(db, 'anchors', user.uid), {
      ...nextData,
      timestamp: serverTimestamp(),
    }, { merge: true });
  };


  return (
    <>
      <Header AuthButton={AuthButton} />
      <Outlet context={{
        AuthButton,
        user,
        userData,
        setUserData,
      }} />
    </>
  );
}

export default App;
