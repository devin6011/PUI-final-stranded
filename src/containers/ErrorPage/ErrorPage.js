import { FaRegLaughBeam } from 'react-icons/fa'

export default function ErrorPage() {
  return (
    <main className='d-flex justify-content-center align-items-center vh-100'>
      <div className='d-flex align-items-center'>
        <FaRegLaughBeam className='fs-1'/>
        <h1 className='d-inline'>You are stranded in a wrong URL!</h1>
        <FaRegLaughBeam className='fs-1'/>
      </div>
    </main>
  );
}
