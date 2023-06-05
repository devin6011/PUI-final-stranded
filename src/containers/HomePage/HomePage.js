import { useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';

import ExampleImage from '../../assets/Example1.png'

export default function HomePage() {
  const { AuthButton, user } = useOutletContext();
  const navigate = useNavigate();

  useEffect(() => {
    if(user !== null) {
      navigate('/browse');
    }
  }, [user, navigate]);

  return (
    <main className='d-flex flex-column align-items-center'>
    {user === null && (
      <>
        <h2 className='fs-1'>Stranded</h2>
        <h3>State Transition Diagram Editor</h3>
        <div className='d-flex justify-content-center'>
          <img src={ExampleImage} className='w-75' alt='' ></img>
        </div>

        <div className='mb-5'>
          <AuthButton />
        </div>
      </>
    )}
    </main>
  );
}
