import { useParams } from 'react-router-dom';

export default function EditorPage() {
  const { projectId } = useParams();

  return (
    <main>
      EditorPage
      Pageid: {projectId}
    </main>
  );
}
