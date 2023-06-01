import { FaHeart } from 'react-icons/fa'
import { useOutletContext } from 'react-router-dom';

export default function HomePage() {
  const { AuthButton } = useOutletContext();

  return (
    <main className='d-flex flex-column align-items-center'>
      <h1>Stranded</h1>
      <h2>State Transition Diagram Editor</h2>
      <span><FaHeart /> Login to start <FaHeart /></span>

      <AuthButton />
    </main>
  );
}
