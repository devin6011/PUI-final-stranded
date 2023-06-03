import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { db, auth } from './index';
import {
  Button,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
} from 'reactstrap';
import { FaGoogle } from 'react-icons/fa';

import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

import './App.css';

import Header from './containers/Header/Header';

function AuthButton( {toggleModal, setModalData} ) {
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

  const toggleLogoutModal = () => {
    setModalData({
      body: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Yes',
          onClick: () => {logout(); toggleModal();},
        },
        {
          text: 'No',
          onClick: toggleModal,
        },
      ],
    });
    toggleModal();
  };

  return (
    user === null ? (
      <Button onClick={googleLogin} className='d-flex align-items-center gap-1'>
        Log in with Google <FaGoogle />
      </Button>
    )
    : (
      <Button onClick={(toggleModal && setModalData) ? toggleLogoutModal : logout}>
        Log out as {user.displayName}
      </Button>
    )
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [userData, __setUserData] = useState(null);
  const [modal, setModal] = useState(false);
  const [modalData, setModalData] = useState({});

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

  const setUserData = useCallback(nextData => {
    if(user === null) return;
    setDoc(doc(db, 'anchors', user.uid), nextData, { merge: true });
  }, [user]);

  const toggleModal = useCallback(() => setModal(modal => !modal), []);

  return (
    <>
      <Header AuthButton={AuthButton} toggleModal={toggleModal} setModalData={setModalData} />
      <Outlet context={{
        AuthButton,
        user,
        userData,
        setUserData,
        toggleModal,
        setModalData,
      }} />

      <Modal
        isOpen={modal}
        toggle={toggleModal}
      >
        <ModalBody>
          <pre style={{fontSize: '1em', fontFamily: 'system-ui', whiteSpace: 'pre-wrap'}}>{modalData?.body}</pre>
          {modalData?.inputs?.map((input, idx) => (
            <FormGroup floating key={idx}>
              <Input type={input.type} onChange={input.onChange} className='my-2' placeholder={input.label} value={input.value}>
                {input.text}
              </Input>
              <Label>
                {input.label}
              </Label>
            </FormGroup>
          ))}
        </ModalBody>
        <ModalFooter>
        {modalData?.buttons?.map((button, idx) => (
          <Button onClick={button.onClick} key={idx}>
            {button.text}
          </Button>
        ))}
        </ModalFooter>
      </Modal>
    </>
  );
}

export default App;
