import { useState, useEffect, useRef } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import {
  Stage,
  Layer,
  Group,
  Text,
  Circle,
  Line,
} from 'react-konva';

export default function EditorPage() {
  const { projectId } = useParams();
  const { user, userData, setUserData } = useOutletContext();
  const mainRef = useRef(null);
  const navigate = useNavigate();

  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [eventStartData, setEventStartData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(false);

  const graph = userData?.[projectId]?.graph;
  const nodes = graph?.nodes;
  const edges = graph?.edges;
  const events = userData?.[projectId]?.events;

  const radius = 50;
  const fontSize = 20;

  useEffect(() => {
    if(user === null) {
      const timer = setTimeout(() => navigate('/'), 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    const currentHeight = window.innerHeight - mainRef?.current?.offsetTop;
    setCanvasHeight(currentHeight || 0);
    setCanvasWidth(window.innerWidth);

    const updateCanvasSize = () => {
      const newHeight = window.innerHeight - mainRef?.current?.offsetTop;
      setCanvasHeight(() => newHeight || 0);
      setCanvasWidth(() => window.innerWidth);
    };

    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const updateGraph = (newGraph, newEvents) => {
    setUserData({
      [projectId]: {
        ...userData[projectId],
        lastEditTime: Date.now(),
        graph: newGraph,
        events: newEvents,
      },
    });
  };

  const clearGraph = () => {
    updateGraph({
      nodes: [],
      edges: [],
    }, []);
  };

  const createNode = e => {
    const posX = e.evt.offsetX;
    const posY = e.evt.offsetY;
    updateGraph({
      nodes: nodes.concat([{
        name: 'State',
        x: posX - radius,
        y: posY - radius,
      }]),
      edges,
    }, events);
  };

  const selectNode = idx => e => {
    setSelected(idx);
    e.cancelBubble = true;
  };

  const dragNodeStart = idx => e => {
    setDragging(true);
  };

  const dragNodeEnd = idx => e => {
    const newNodes = [...nodes];
    newNodes[idx].x = e.target.x();
    newNodes[idx].y = e.target.y();
    updateGraph({
      nodes: newNodes,
      edges,
    }, events);
    setDragging(false);
  };

  const stopEventBubble = (e) => {
    e.cancelBubble = true;
  };

  return (
    <main ref={mainRef}>
    {!userData?.[projectId] ?
      <h2 className='m-3'>This project ID is invalid!</h2>
      :
      <Stage width={canvasWidth} height={canvasHeight} onPointerDblClick={createNode} onPointerClick={!dragging && selectNode(null)}>
        <Layer>
          {nodes?.map((node, idx) => (
            <Group key={idx} x={node.x} y={node.y} draggable={idx === selected} onDragStart={dragNodeStart(idx)} onDragEnd={dragNodeEnd(idx)} onPointerDblClick={stopEventBubble} onPointerClick={selectNode(idx)}>
              <Circle x={radius} y={radius} radius={radius} fill='gold' shadowBlur={idx === selected ? 20 : 0} stroke='black' strokeWidth={2} />
              <Text text={node.name} fontSize={fontSize} width={radius * 2} height={radius * 2} align='center' verticalAlign='middle' listening={false} />
            </Group>
          ))}
        </Layer>
      </Stage>
    }
    </main>
  );
}
