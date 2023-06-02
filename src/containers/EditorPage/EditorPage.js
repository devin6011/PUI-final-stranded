import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [viewPos, setViewPos] = useState({x: 0, y: 0});
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
  }, [user, navigate]);

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

  const updateGraph = useCallback((newGraph, newEvents) => {
    setUserData({
      [projectId]: {
        ...userData[projectId],
        lastEditTime: Date.now(),
        graph: newGraph,
        events: newEvents,
      },
    });
  }, [userData, setUserData, projectId]);

  const clearGraph = () => {
    updateGraph({
      nodes: nodes.map(node => ({...node, visible: false})),
      edges: edges,
    }, events);
  };

  const deleteNode = useCallback(idx => {
    const newNodes = [...nodes];
    newNodes[idx].visible = false;
    updateGraph({
      nodes: newNodes,
      edges,
    }, events);
  }, [nodes, edges, events, updateGraph]);

  useEffect(() => {
    const keydownHandler = (e) => {
      console.log(e.key);
      switch(e.key) {
        case 'Delete':
          if(selected) {
            deleteNode(selected);
            setSelected(null);
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', keydownHandler, true);
    return () => document.removeEventListener('keydown', keydownHandler, true);
  }, [deleteNode, selected]);

  useEffect(() => {
    const wheelHandler = (e) => {
      let newZoom = zoom + e.deltaY * 1e-4;
      newZoom = Math.max(0.2, Math.min(2, newZoom));
      const offX = e.offsetX;
      const offY = e.offsetY;
      setZoom(newZoom);
      setViewPos({
        x: offX / zoom - offX / newZoom + viewPos.x,
        y: offY / zoom - offY / newZoom + viewPos.y,
      });
    };

    document.addEventListener('wheel', wheelHandler);
    return () => document.removeEventListener('wheel', wheelHandler);
  }, [zoom, setZoom, viewPos, setViewPos]);
  
  const pointerDownCanvas = e => {
    setEventStartData({
      type: 'canvas',
      pointerX: e.evt.offsetX,
      pointerY: e.evt.offsetY,
      viewPosX: viewPos.x,
      viewPosY: viewPos.y,
    });
  };
  
  const pointerMoveCanvas = e => {
    if(eventStartData?.type !== 'canvas') return;
    const deltaX = e.evt.offsetX - eventStartData.pointerX;
    const deltaY = e.evt.offsetY - eventStartData.pointerY;
    setViewPos({
      x: eventStartData.viewPosX - deltaX / zoom,
      y: eventStartData.viewPosY - deltaY / zoom,
    });
  };

  const pointerUpCanvas = e => {
    setEventStartData(null);
  };

  const createNode = e => {
    const posX = e.evt.offsetX;
    const posY = e.evt.offsetY;
    updateGraph({
      nodes: nodes.concat([{
        name: 'State',
        x: posX / zoom + viewPos.x - radius,
        y: posY / zoom + viewPos.y - radius,
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
    newNodes[idx].x = e.target.x() / zoom + viewPos.x;
    newNodes[idx].y = e.target.y() / zoom + viewPos.y;
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
      <Stage width={canvasWidth} height={canvasHeight} onPointerDblClick={createNode} onPointerClick={!dragging && selectNode(null)} onPointerDown={pointerDownCanvas} onPointerMove={pointerMoveCanvas} onPointerUp={pointerUpCanvas}>
        <Layer>
          {nodes?.map((node, idx) => (
            <Group key={idx} x={zoom * (node.x - viewPos.x)} y={zoom * (node.y - viewPos.y)} draggable={idx === selected} onDragStart={dragNodeStart(idx)} onDragEnd={dragNodeEnd(idx)} onPointerDblClick={stopEventBubble} onPointerClick={selectNode(idx)} onPointerDown={stopEventBubble} visible={node.visible}>
              <Circle x={zoom * radius} y={zoom * radius} radius={zoom * radius} fill='gold' shadowBlur={idx === selected ? 20 : 0} stroke='black' strokeWidth={2} />
              <Text text={node.name} fontSize={zoom * fontSize} width={zoom * radius * 2} height={zoom * radius * 2} align='center' verticalAlign='middle' listening={false} />
            </Group>
          ))}
        </Layer>
      </Stage>
    }
    </main>
  );
}
