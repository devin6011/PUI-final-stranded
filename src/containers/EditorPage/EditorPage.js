import { useEffect } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';

export default function EditorPage() {
  const { projectId } = useParams();
  const { user } = useOutletContext();
  const navigate = useNavigate();

  useEffect(() => {
    if(user === null) {
      const timer = setTimeout(() => navigate('/'), 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  return (
    <main>
      EditorPage
      Pageid: {projectId}
    </main>
  );
}
