import './ProjectBrowserPage.css';
import { useState, useEffect } from 'react';
import { deleteField } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardTitle,
  CardSubtitle,
  CardText,
  Button,
} from 'reactstrap';
import { FaPlus } from 'react-icons/fa';

function CreateProjectCard({ onClick }) {
  return (
    <Card className='CreateProjectCard w-25' role='button' onClick={onClick}>
      <CardBody className='d-flex align-items-center justify-content-center'>
        <CardTitle tag='h3' className='d-flex align-items-center gap-2'>
          <FaPlus />
          New Project
        </CardTitle>
      </CardBody>
    </Card>
  );
}

function ProjectCard({ project, deleteProject, editProjectName, editProjectDescription }) {
  return (
    <Card className='ProjectCard w-25'>
      <CardBody className='d-flex flex-column align-items-start text-break'>
        <CardTitle tag='h3' contentEditable={true} suppressContentEditableWarning={true} onBlur={e => editProjectName(e.target.innerText)}>
          {project.projectName}
        </CardTitle>
        <CardSubtitle tag='h4' className='fs-6 text-muted'>
          {(new Date(project.lastEditTime)).toLocaleString('en-US', { hour12: false })}
        </CardSubtitle>
        <CardText className='my-3' contentEditable={true} suppressContentEditableWarning={true} onBlur={e => editProjectDescription(e.target.innerText)}>
          {project.description}
        </CardText>
        <div className='d-flex justify-content-between mt-auto align-self-stretch'>
          <Link to={`/edit/${project.id}`}>
            <Button>
              Open
            </Button>
          </Link>
          <Button onClick={deleteProject}>
            Delete
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export default function ProjectBrowserPage() {
  const { user, userData, setUserData, toggleModal, setModalData } = useOutletContext();
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if(user === null) {
      const timer = setTimeout(() => navigate('/'), 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const projects = !userData ? null :
    Object.entries(userData).map(x => ({id: x[0], ...x[1]}));

  projects?.sort((a, b) => b.lastEditTime - a.lastEditTime);

  const createNewProject = () => {
    const projectId = uuidv4();
    setUserData({
      [projectId]: {
        projectName: newProjectName || 'Untitled',
        description: newProjectDescription,
        lastEditTime: Date.now(),
        graph: {
          nodes: [],
          edges: [],
        },
        events: [],
      },
    });
    navigate(`/edit/${projectId}`);
  };

  const deleteProject = projectId => {
    setUserData({
      [projectId]: deleteField(),
    });
  };

  const editProjectName = projectId => newName => {
    setUserData({
      [projectId]: {
        ...userData[projectId],
        projectName: newName || 'Untitled',
      },
    });
  };

  const editProjectDescription = projectId => newDescription => {
    setUserData({
      [projectId]: {
        ...userData[projectId],
        description: newDescription,
      },
    });
  };

  // Reset the onClick to prevent createNewProject closure
  useEffect(() => {
    setModalData(data => ({
      ...data,
      buttons: [
        {
          text: 'Create',
          onClick: () => {
            toggleModal();
            createNewProject();
          },
        },
        {
          text: 'Cancel',
          onClick: toggleModal,
        },
      ],
    }));
  }, [newProjectName, newProjectDescription]);

  const toggleCreateNewProjectModal = () => {
    setModalData({
      body: 'Type in your project information.',
      buttons: [
        {
          text: 'Create',
          onClick: () => {
            toggleModal();
            createNewProject();
          },
        },
        {
          text: 'Cancel',
          onClick: toggleModal,
        },
      ],
      inputs: [
        {
          type: 'text',
          label: 'Project Name',
          onChange: e => setNewProjectName(e.target.value),
        },
        {
          type: 'text',
          label: 'Project Description',
          onChange: e => setNewProjectDescription(e.target.value),
        },
      ],
    });
    toggleModal();
  };

  const toggleDeleteProjectModal = (projectId, name) => {
    setModalData({
      body: `Are you sure you want to delete "${name}"?`,
      buttons: [
        {
          text: 'Delete',
          onClick: () => {
            toggleModal();
            deleteProject(projectId);
          },
        },
        {
          text: 'Cancel',
          onClick: toggleModal,
        },
      ],
    });
    toggleModal();
  };

  return (
    <main className='p-5'>
      <h2 className='pb-4'>Browse your projects</h2>
      <section className='d-flex gap-3 flex-wrap'>
        <CreateProjectCard onClick={toggleCreateNewProjectModal} />
        {projects?.map(project => (
          <ProjectCard project={project} deleteProject={() => toggleDeleteProjectModal(project.id, project.projectName)} editProjectName={editProjectName(project.id)} editProjectDescription={editProjectDescription(project.id)} key={project.id} />
        ))}
      </section>
    </main>
  );
}
