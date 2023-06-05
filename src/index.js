import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import ErrorPage from './containers/ErrorPage/ErrorPage';
import HomePage from './containers/HomePage/HomePage';
import ProjectBrowserPage from './containers/ProjectBrowserPage/ProjectBrowserPage';
import EditorPage from './containers/EditorPage/EditorPage';

import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCu0S5esgB4-UR_ru71ilJ7EMnOdsFomGw",
  authDomain: "pui-final-stranded.firebaseapp.com",
  projectId: "pui-final-stranded",
  storageBucket: "pui-final-stranded.appspot.com",
  messagingSenderId: "282988824654",
  appId: "1:282988824654:web:7ec62cdf1c388943715b1f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence);

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '',
        element: <HomePage />,
      },
      {
        path: 'browse',
        element: <ProjectBrowserPage />,
      },
      {
        path: 'edit/:projectId',
        element: <EditorPage />,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

export { db, auth };
