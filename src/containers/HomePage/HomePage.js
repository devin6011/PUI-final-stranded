import { useEffect } from 'react';
import { FaHeart } from 'react-icons/fa'
import { useOutletContext, useNavigate } from 'react-router-dom';

export default function HomePage() {
  // TODO: add example image
  // TODO: give a better look
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
        <span className='fs-4' ><FaHeart /> Login to start <FaHeart /></span>

        <AuthButton />
      </>
    )}
    </main>
  );
}
