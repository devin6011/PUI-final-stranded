import { Link } from 'react-router-dom';

export default function Header({ AuthButton, toggleModal, setModalData }) {
  return (
    <header className='d-flex justify-content-between align-items-center py-2 px-5 border-bottom shadow-sm'>
      <Link to='/' className='text-decoration-none' style={{color: 'inherit'}}>
        <h1 className='m-0 fs-2'>Stranded</h1>
      </Link>
      <AuthButton toggleModal={toggleModal} setModalData={setModalData} />
    </header>
  );
}
