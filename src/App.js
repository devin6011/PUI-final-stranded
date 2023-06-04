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
  ListGroup,
  ListGroupItem,
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
  const [infoModal, setInfoModal] = useState(false);

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
  const toggleInfoModal = useCallback(() => setInfoModal(modal => !modal), []);

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
        toggleInfoModal,
        setInfoModal,
      }} />

      <Modal
        isOpen={modal}
        toggle={toggleModal}
        onWheel={e => {e.stopPropagation()}}
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
      
      <Modal
        isOpen={infoModal}
        toggle={toggleInfoModal}
        size='lg'
        onWheel={e => {e.stopPropagation()}}
      >
        <ModalBody>
          <h2 className='fs-3'>Usage</h2>
          <ListGroup flush>
            <ListGroupItem>
              <h3 className='fs-5'>Create node</h3>
              <b>Double click</b> on the background.
            </ListGroupItem>
            <ListGroupItem>
              <h3 className='fs-5'>Create edge</h3>
              <b>Click</b> on an <b>unselected</b> start node and <b>hold on</b>, move to the end node and then release.
            </ListGroupItem>
            <ListGroupItem>
              <h3 className='fs-5'>Select node / edge</h3>
              <b>Click</b> on the node / edge. Click on the background to deselect.
            </ListGroupItem>
            <ListGroupItem>
              <h3 className='fs-5'>Edit node / edge</h3>
              <b>Double click</b> on the node / edge.
            </ListGroupItem>
            <ListGroupItem>
              <h3 className='fs-5'>Move node</h3>
              <b>Select</b> and <b>Drag</b> the node.
            </ListGroupItem>
            <ListGroupItem>
              <h3 className='fs-5'>Delete node</h3>
              <b>Select</b> and <b>press</b> <code>Delete</code>.
            </ListGroupItem>
            <ListGroupItem>
              <h3 className='fs-5'>Delete edge</h3>
              <ListGroup flush>
                <ListGroupItem>
                  Link the nodes again.
                </ListGroupItem>
                <ListGroupItem>
                  <b>Select</b> and <b>press</b> <code>Delete</code>.
                </ListGroupItem>
              </ListGroup>
            </ListGroupItem>
            <ListGroupItem>
              <h3 className='fs-5'>Move canvas</h3>
              <b>Drag</b> the background.
            </ListGroupItem>
            <ListGroupItem>
              <h3 className='fs-5'>Zoom</h3>
              <b>Scroll</b> the canvas.
            </ListGroupItem>
            <ListGroupItem>
              <h3 className='fs-5'>Undo</h3>
              <b>Press</b> <code>Ctrl+Z</code>.
            </ListGroupItem>
            <ListGroupItem>
              <h3 className='fs-5'>Redo</h3>
              <b>Press</b> <code>Ctrl+Y</code>.
            </ListGroupItem>
          </ListGroup>
        </ModalBody>
        <ModalFooter>
          <Button onClick={toggleInfoModal}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

export default App;
