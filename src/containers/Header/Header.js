export default function Header({ AuthButton }) {
  return (
    <header className='d-flex justify-content-between align-items-center p-2 border-bottom'>
      Stranded
      <AuthButton />
    </header>
  );
}
