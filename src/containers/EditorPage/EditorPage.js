import './EditorPage.css';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { useDrag, useDrop } from 'react-dnd';
import { DndProvider, Preview } from 'react-dnd-multi-backend';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';
import {
  Button,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledTooltip,
} from 'reactstrap';
import {
  Stage,
  Layer,
  Group,
  Text,
  Circle,
  Arrow,
} from 'react-konva';
import {
  Html,
} from 'react-konva-utils';
import {
  FaBars,
  FaUndo,
  FaRedo,
  FaTrash,
  FaSave,
  FaInfo,
  FaBroom,
} from 'react-icons/fa';
import {
  MdGridOn,
  MdGridOff,
  MdDeleteSweep,
  MdPlayArrow,
  MdPlayDisabled,
  MdClose,
  MdPause,
  MdUndo,
  MdRedo,
  MdSkipPrevious,
  MdSkipNext,
  MdFitScreen,
} from 'react-icons/md';

const union = (setA, setB) => {
  const _union = new Set(setA);
  for(const x of setB) {
    _union.add(x);
  }
  return _union;
}

export function Node({ viewPos, zoom, node, isSelected, dragNodeStart, dragNodeMove, dragNodeEnd, editNode, selectNode, pointerDownNode, pointerUpNode, radius, fill, stroke, doubleStroke, fontSize }) {
  return (
    <Group
      x={zoom * (node.x - viewPos.x)}
      y={zoom * (node.y - viewPos.y)}
      draggable={isSelected}
      onDragStart={dragNodeStart}
      onDragMove={dragNodeMove}
      onDragEnd={dragNodeEnd}
      onPointerDblClick={editNode}
      onPointerClick={selectNode}
      onPointerDown={pointerDownNode}
      onPointerUp={pointerUpNode}
      visible={node.visible}
    >
      <Circle
        x={zoom * radius}
        y={zoom * radius}
        radius={zoom * radius}
        fill={fill}
        shadowBlur={isSelected ? 20 : 0}
        stroke={stroke}
        strokeWidth={2 * zoom}
      />
      {doubleStroke && (
        <Circle
          x={zoom * radius}
          y={zoom * radius}
          radius={zoom * (radius * 0.9)}
          stroke={stroke}
          strokeWidth={2 * zoom}
          listening={false}
        />
      )}
      <Text
        text={node.name}
        fontSize={zoom * fontSize}
        width={zoom * radius * 2}
        height={zoom * radius * 2}
        align='center'
        verticalAlign='middle'
        listening={false}
      />
    </Group>
  );
}

function DrawingEdge({ viewPos, zoom, drawingEdge, color, opacity }) {
  return (
    <Arrow
      x={zoom * (drawingEdge.fromX - viewPos.x)}
      y={zoom * (drawingEdge.fromY - viewPos.y)}
      points={[0, 0, zoom * (drawingEdge.toX - drawingEdge.fromX), zoom * (drawingEdge.toY - drawingEdge.fromY)]}
      pointerLength={20 * zoom}
      pointerWidth={20 * zoom}
      fill={color}
      stroke={color}
      strokeWidth={2 * zoom}
      opacity={opacity}
      listening={false}
    />
  );
}

export function Edge({ edge, fontSize, radius, viewPos, zoom, isSelected, color, nodes, selectEdge, editEdge, scale }) {
  const dx = nodes[edge.to].x - nodes[edge.from].x;
  const dy = nodes[edge.to].y - nodes[edge.from].y;
  const arrowAngle = Math.atan2(dy, dx);
  // offset for rotation
  const textOffsetX = (Math.abs(dx) + 2 * radius) / 2;
  const textOffsetY = (Math.abs(dy) + 2 * radius) / 2;
  // displacement from center
  const textShiftX = fontSize * Math.sin(arrowAngle);
  const textShiftY = -fontSize * Math.cos(arrowAngle);

  return (
  <Group
    visible={edge.visible && nodes[edge.from].visible && nodes[edge.to].visible}
    onPointerClick={selectEdge}
    onPointerDblClick={editEdge}
  >
    <Arrow
      x={zoom * (nodes[edge.from].x + radius + radius * Math.cos(arrowAngle) - viewPos.x)}
      y={zoom * (nodes[edge.from].y + radius + radius * Math.sin(arrowAngle) - viewPos.y)}
      points={[
        0,
        0,
        zoom * (dx - 2 * radius * Math.cos(arrowAngle)),
        zoom * (dy - 2 * radius * Math.sin(arrowAngle)),
      ]}
      pointerLength={20 * zoom * (scale ? scale : 1)}
      pointerWidth={20 * zoom * (scale ? scale : 1)}
      fill={color}
      stroke={color}
      strokeWidth={2 * zoom * (scale ? scale : 1)}
      shadowBlur={isSelected ? 20 : 0}
    />
    <Text
      x={zoom * (Math.min(nodes[edge.from].x, nodes[edge.to].x) + textOffsetX + textShiftX - viewPos.x)}
      y={zoom * (Math.min(nodes[edge.from].y, nodes[edge.to].y) + textOffsetY + textShiftY - viewPos.y)}
      width={zoom * (Math.abs(dx) + 2 * radius)}
      height={zoom * (Math.abs(dy) + 2 * radius)}
      align='center'
      verticalAlign='middle'
      text={edge.events.join(', ')}
      fontSize={zoom * fontSize}
      fill={color}
      listening={false}
      rotation={dx >= 0 ? arrowAngle / Math.PI * 180 : arrowAngle / Math.PI * 180 + 180}
      offsetX={zoom * textOffsetX}
      offsetY={zoom * textOffsetY}
    />
  </Group>
  );
}

function EventQueueItem({ id, name, color, findEventQueueItem, moveEventQueueItem, removeEventQueueItem }) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'eventQueueItem',
      item: { id, name, color },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      end: (item, monitor) => {
        const { id: droppedId } = item;
        const didDrop = monitor.didDrop();
        if(!didDrop) {
          removeEventQueueItem(droppedId);
        }
      },
    }),
    [id, name, color, removeEventQueueItem],
  );

  const [, drop] = useDrop(
    () => ({
      accept: 'eventQueueItem',
      hover({ id: draggedId }) {
        if(draggedId !== id) {
          const { idx: overIdx } = findEventQueueItem(id);
          moveEventQueueItem(draggedId, overIdx);
        }
      },
    }),
    [findEventQueueItem, moveEventQueueItem],
  );

  return (
    <Button innerRef={node => drag(drop(node))} className='EventButton text-truncate' color={color} style={{opacity: isDragging ? 0 : 1}}>
      {name}
    </Button>
  );
}

function EventQueue({ eventQueue, setEventQueue, curEventIdx, eventQueueRef, canvasHeight }) {
  const [, drop] = useDrop(() => ({ accept: 'eventQueueItem' }));

  const findEventQueueItem = useCallback(
    id => {
      const event = eventQueue.find(e => e.id === id);
      return { event, idx: eventQueue.indexOf(event) };
    },
    [eventQueue],
  );

  const moveEventQueueItem = useCallback(
    (id, toIdx) => {
      const { event, idx } = findEventQueueItem(id);
      const newQueue = [...eventQueue];
      newQueue.splice(idx, 1);
      newQueue.splice(toIdx, 0, event);
      setEventQueue(queue => newQueue);
    },
    [findEventQueueItem, eventQueue, setEventQueue],
  );

  const removeEventQueueItem = useCallback(
    (id) => {
      const { idx } = findEventQueueItem(id);
      const newQueue = [...eventQueue];
      newQueue.splice(idx, 1);
      setEventQueue(queue => newQueue);
    },
    [findEventQueueItem, eventQueue, setEventQueue],
  );

  return (
    <section ref={drop} className='border-top border-1 d-flex align-items-center' style={{height: '80px'}}>
      <div ref={eventQueueRef} className='d-flex align-items-center gap-1 p-2 overflow-auto'>
      {eventQueue.map((event, idx) => (
        <EventQueueItem key={event.id} id={event.id} name={event.name} findEventQueueItem={findEventQueueItem} moveEventQueueItem={moveEventQueueItem} removeEventQueueItem={removeEventQueueItem} color={idx < curEventIdx ? 'success' : idx === curEventIdx ? 'primary' : 'secondary'} />
      ))}
      </div>
      <Preview>
        {({ item, style }) => (
          <Button className='EventButtonDragged text-truncate' color={item.color} style={{...style, opacity: 0.5, top: -(window.innerHeight - canvasHeight)}}>
            {item.name}
          </Button>
        )}
      </Preview>
    </section>
  );
}

export default function EditorPage() {
  const { projectId } = useParams();
  const { user, userData, setUserData, toggleModal, setModalData, toggleInfoModal, setInfoModal} = useOutletContext();
  const mainRef = useRef(null);
  const navigate = useNavigate();

  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [viewPos, setViewPos] = useState({x: 0, y: 0});

  const [nodes, setNodes] = useState(null);
  const [edges, setEdges] = useState(null);
  const [events, setEvents] = useState(null);
  const [entryNode, setEntryNode] = useState(null);

  const [eventStartData, setEventStartData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [drawingEdge, setDrawingEdge] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyTime, setHistoryTime] = useState(-1);

  const [menuOpen, setMenuOpen] = useState(false);

  const [alignGrid, setAlignGrid] = useState(false);

  const [runPanelOpen, setRunPanelOpen] = useState(false);
  const [eventQueue, setEventQueue] = useState([]);
  const [eventQueueNextId, setEventQueueNextId] = useState(0);
  const [curEventIdx, setCurEventIdx] = useState(-1);
  const [curNode, setCurNode] = useState(null);
  const [runHistory, setRunHistory] = useState([]);
  const [runJobCnt, setRunJobCnt] = useState(0);
  const [autoRun, setAutoRun] = useState(null);
  const eventQueueRef = useRef(null);

  const radius = 50;
  const fontSize = 20;

  useEffect(() => {
    if(user === null) {
      const timer = setTimeout(() => navigate('/'), 500);
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);

  useEffect(() => {
    setInfoModal(true);
  }, [setInfoModal]);

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

  const restartEventRunner = useCallback((newEntryNode) => {
    setCurEventIdx(-1);
    setCurNode(newEntryNode);
    setRunHistory([]);
    setAutoRun(false);
    setRunJobCnt(0);
  }, []);

  useEffect(() => {
    if(history.length === 0 && userData?.[projectId]) {
      setNodes(userData[projectId].graph.nodes);
      setEdges(userData[projectId].graph.edges);
      setEvents(new Set(userData[projectId].events));
      setEntryNode(userData[projectId].entryNode);
      setEventQueue(userData[projectId].eventQueue.map((event, idx) => ({ id: idx, name: event })));
      setEventQueueNextId(userData[projectId].eventQueue.length);

      setHistory([{
        nodes: userData[projectId].graph.nodes,
        edges: userData[projectId].graph.edges,
        events: new Set(userData[projectId].events),
        entryNode: userData[projectId].entryNode,
      }]);
      setHistoryTime(0);
      restartEventRunner(userData[projectId].entryNode);
    }
  }, [userData, projectId, history, restartEventRunner]);

  const updateNodes = useCallback((newNodes, save=true) => {
    setNodes(newNodes);
    restartEventRunner(entryNode);

    if(save) {
      setHistory(history.slice(0, historyTime + 1).concat([{ nodes: newNodes, edges, events, entryNode }]));
      setHistoryTime(historyTime + 1);
    }
  }, [edges, events, entryNode, history, historyTime, restartEventRunner]);

  const updateEdges = useCallback((newEdges, newEvents, save=true) => {
    setEdges(newEdges);
    restartEventRunner(entryNode);

    if(save) {
      setHistory(history.slice(0, historyTime + 1).concat([{ nodes, edges: newEdges, events: newEvents, entryNode }]));
      setHistoryTime(historyTime + 1);
    }
  }, [nodes, entryNode, history, historyTime, restartEventRunner]);

  // update nodes and edges simultaneously to prevent error
  const updateGraph = useCallback((newNodes, newEdges, newEvents, save=true) => {
    setNodes(newNodes);
    setEdges(newEdges);
    restartEventRunner(entryNode);

    if(save) {
      setHistory(history.slice(0, historyTime + 1).concat([{ nodes: newNodes, edges: newEdges, events: newEvents, entryNode }]));
      setHistoryTime(historyTime + 1);
    }
  }, [entryNode, history, historyTime, restartEventRunner]);

  const updateEntryNode = useCallback((newEntryNode, save=true) => {
    setEntryNode(newEntryNode);
    restartEventRunner(newEntryNode);

    if(save) {
      setHistory(history.slice(0, historyTime + 1).concat([{ nodes, edges, events, entryNode: newEntryNode }]));
      setHistoryTime(historyTime + 1);
    }
  }, [nodes, edges, events, history, historyTime, restartEventRunner]);

  const undo = useCallback(() => {
    if(historyTime <= 0) return;
    setNodes(history[historyTime-1].nodes);
    setEdges(history[historyTime-1].edges);
    setEvents(history[historyTime-1].events);
    setEntryNode(history[historyTime-1].entryNode);
    setHistoryTime(historyTime-1);
    restartEventRunner(history[historyTime-1].entryNode);
  }, [history, historyTime, restartEventRunner]);

  const redo = useCallback(() => {
    if(historyTime + 1 >= history.length) return;
    setNodes(history[historyTime+1].nodes);
    setEdges(history[historyTime+1].edges);
    setEvents(history[historyTime+1].events);
    setEntryNode(history[historyTime+1].entryNode);
    setHistoryTime(historyTime+1);
    restartEventRunner(history[historyTime+1].entryNode);
  }, [history, historyTime, restartEventRunner]);

  const saveData = () => {
    setUserData({
      [projectId]: {
        ...userData[projectId],
        lastEditTime: Date.now(),
        graph: {
          nodes,
          edges,
        },
        events: [...events],
        entryNode: entryNode,
        eventQueue: eventQueue.map(event => event.name),
      },
    });
  };

  const clearData = () => {
    setNodes([]);
    setEdges([]);
    setEvents(new Set());
    setEntryNode(null);
    setEventQueue([]);

    setHistory(history.slice(0, historyTime + 1).concat([{ nodes: [], edges: [], events: [], entryNode: null }]));
    setHistoryTime(historyTime + 1);
    restartEventRunner(null);
  };

  const deleteNode = useCallback(idx => {
    updateNodes(Object.assign([], nodes, {
      [idx]: {
        ...nodes[idx],
        visible: false,
      }
    }));
  }, [nodes, updateNodes]);

  const deleteEdge = useCallback(idx => {
    updateEdges(Object.assign([], edges, {
      [idx]: {
        ...edges[idx],
        visible: false,
      }
    }), events);
  }, [edges, events, updateEdges]);

  const deleteSelected = useCallback(() => {
    if(!selected) return;
    if(selected.type === 'node') {
      deleteNode(selected.idx);
    }
    else if(selected.type === 'edge') {
      deleteEdge(selected.idx);
    }
    setSelected(null);
  }, [selected, deleteNode, deleteEdge]);

  useEffect(() => {
    const keydownHandler = (e) => {
      // console.log(e.key);
      switch(e.key) {
        case 'Delete':
          deleteSelected();
          break;
        case 'z':
          if(e.ctrlKey) {
            undo();
          }
          break;
        case 'y':
          if(e.ctrlKey) {
            redo();
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', keydownHandler, true);
    return () => document.removeEventListener('keydown', keydownHandler, true);
  }, [undo, redo, deleteSelected]);

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
    if(eventStartData?.type === 'canvas') {
      const deltaX = e.evt.offsetX - eventStartData.pointerX;
      const deltaY = e.evt.offsetY - eventStartData.pointerY;
      setViewPos({
        x: eventStartData.viewPosX - deltaX / zoom,
        y: eventStartData.viewPosY - deltaY / zoom,
      });
    }
    else if(eventStartData?.type === 'node') {
      setDrawingEdge({
        ...drawingEdge,
        toX: e.evt.offsetX / zoom + viewPos.x,
        toY: e.evt.offsetY / zoom + viewPos.y,
      });
    }
  };

  const pointerUpCanvas = e => {
    setEventStartData(null);
    setDrawingEdge(null);
  };

  const pointerDownNode = idx => e => {
    if(selected?.type !== 'node' || selected?.idx !== idx) {
      setEventStartData({
        type: 'node',
        nodeIdx: idx,
      });
      setDrawingEdge({
        from: idx,
        fromX: nodes[idx].x + radius,
        fromY: nodes[idx].y + radius,
        toX: e.evt.offsetX / zoom + viewPos.x,
        toY: e.evt.offsetY / zoom + viewPos.y,
      });
    }
    e.cancelBubble = true;
  };

  const pointerUpNode = idx => e => {
    if(drawingEdge) {
      if(drawingEdge.from !== idx) {
        // check if already exists
        const edgeIdx = nodes[drawingEdge.from].adj.find(edgeIdx => edges[edgeIdx].visible && edges[edgeIdx].to === idx);
        if(edgeIdx !== undefined) {
          // removeEdge
          updateEdges(Object.assign([], edges, {
            [edgeIdx]: {
              ...edges[edgeIdx],
              visible: false,
            }
          }), events);
        }
        else {
          // createEdge
          const newEdgeIdx = edges.length;
          updateGraph(
            Object.assign([], nodes, {
              [drawingEdge.from]: {
                ...nodes[drawingEdge.from],
                adj: nodes[drawingEdge.from].adj.concat([newEdgeIdx]),
              }
            }),
            edges.concat([{
              from: drawingEdge.from,
              to: idx,
              events: [],
              visible: true,
            }]),
            events,
          );
        }
      }
    }
  };
  
  const applyAlign = x => {
    if(alignGrid) {
      x = Math.round(x / 50) * 50;
    }
    return x;
  };

  const createNode = e => {
    const posX = e.evt.offsetX;
    const posY = e.evt.offsetY;
    updateNodes(nodes.concat([{
      name: 'State',
      x: applyAlign(posX / zoom + viewPos.x - radius),
      y: applyAlign(posY / zoom + viewPos.y - radius),
      visible: true,
      adj: [],
    }]));
  };

  const selectNode = idx => e => {
    setSelected({
      type: 'node',
      idx: idx,
    });
    e.cancelBubble = true;
  };

  const selectEdge = idx => e => {
    setSelected({
      type: 'edge',
      idx: idx,
    });
    e.cancelBubble = true;
  };

  const dragNodeStart = idx => e => {
    setDragging(true);
  };

  const dragNodeMove = idx => e => {
    updateNodes(Object.assign([], nodes, {
      [idx]: {
        ...nodes[idx],
        x: e.target.x() / zoom + viewPos.x,
        y: e.target.y() / zoom + viewPos.y,
      }
    }), false);
  };

  const dragNodeEnd = idx => e => {
    updateNodes(Object.assign([], nodes, {
      [idx]: {
        ...nodes[idx],
        x: applyAlign(e.target.x() / zoom + viewPos.x),
        y: applyAlign(e.target.y() / zoom + viewPos.y),
      }
    }));
    setDragging(false);
  };

  const editNode = idx => e => {
    setModalData({
      body: 'Edit state',
      inputs: [
        {
          type: 'text',
          label: 'Name',
          onChange: e => {
            updateNodes(Object.assign([], nodes, {
              [idx]: {
                ...nodes[idx],
                name: e.target.value,
              }
            }));
          },
        },
      ],
      buttons: [
        {
          text: 'Delete',
          onClick: () => {
            deleteNode(idx);
            toggleModal();
          },
        },
        {
          text: 'As initial state',
          onClick: () => {
            updateEntryNode(idx);
            toggleModal();
          },
        },
        {
          text: 'Close',
          onClick: toggleModal,
        },
      ],
    });
    toggleModal();
    e.cancelBubble = true;
  };

  const editEdge = idx => e => {
    setModalData({
      body: `Edit edge (${nodes[edges[idx].from].name} → ${nodes[edges[idx].to].name})`,
      inputs: [
        {
          type: 'text',
          label: 'Event list (comma separated)',
          value: edges[idx].events.join(', '),
          onChange: e => {
            setModalData(data => ({
              ...data,
              inputs: [
                {
                  ...data.inputs[0],
                  value: e.target.value,
                },
              ],
              buttons: [
                {
                  text: 'Save',
                  onClick: () => {
                    const newEdgeEvents = new Set(e.target.value.split(',').map(x => x.trim()).filter(x => x));
                    const newEvents = union(events, newEdgeEvents);
                    setEvents(newEvents);
                    updateEdges(Object.assign([], edges, {
                      [idx]: {
                        ...edges[idx],
                        events: [...newEdgeEvents],
                      }
                    }), newEvents);
                    toggleModal();
                  },
                },
              ],
            }));
          },
        },
      ],
      buttons: [
        {
          text: 'Save',
          onClick: () => {
            toggleModal();
          },
        },
      ],
    });
    toggleModal();
    e.cancelBubble = true;
  };

  const fitScreen = () => {
    if(!nodes || nodes.length === 0) {
      setZoom(1);
      setViewPos({
        x: 0,
        y: 0,
      });
    }
    else {
      let left = nodes.map(node => node.x).reduce((prev, val) => Math.min(prev, val));
      let top = nodes.map(node => node.y).reduce((prev, val) => Math.min(prev, val));
      let right = nodes.map(node => node.x).reduce((prev, val) => Math.max(prev, val)) + 2 * radius;
      let bottom = nodes.map(node => node.y).reduce((prev, val) => Math.max(prev, val)) + 2 * radius;

      const margin = 50;

      const newViewPos = { x: left - margin, y: top - margin };
      let newZoom = 1 / Math.max((right - left + margin * 2) / canvasWidth, (bottom - top + margin * 2) / canvasHeight);
      newZoom = Math.max(0.2, Math.min(2, newZoom));
      setZoom(newZoom);
      setViewPos(newViewPos);
    }
  };

  const toggleRunPanel = () => {
    restartEventRunner(entryNode);
    setRunPanelOpen(state => !state);
  };

  const runOneEvent = useCallback(() => {
    if(curEventIdx + 1 >= eventQueue.length) return;
    let cur = curEventIdx === -1 ? entryNode : curNode;
    if(cur === null) return;

    let event = eventQueue[curEventIdx + 1].name;

    const nextNodes = [];

    for(const edgeIdx of nodes[cur].adj) {
      const edge = edges[edgeIdx];
      if(edge.visible && nodes[edge.to].visible && edge.events.includes(event)) {
        nextNodes.push(edge.to);
      }
    }

    const nextNode = nextNodes.length === 0 ? cur : nextNodes[Math.floor(Math.random() * nextNodes.length)];

    setCurNode(nextNode);
    setRunHistory(history => history.concat([curNode]));
    setCurEventIdx(idx => idx + 1);
  }, [curEventIdx, eventQueue, entryNode, curNode, nodes, edges]);

  useEffect(() => {
    if(runJobCnt >= 1) {
      runOneEvent();
      setRunJobCnt(cnt => cnt - 1);
    }
  }, [runJobCnt, runOneEvent]);

  const undoEvent = () => {
    if(curEventIdx <= -1) return;
    setCurNode(runHistory[runHistory.length - 1]);
    setRunHistory(history => history.slice(0, -1));
    setCurEventIdx(idx => idx - 1);
  };

  useEffect(() => {
    if(autoRun) {
      const id = setInterval(() => {
        setRunJobCnt(cnt => cnt + 1);
      }, 500);
      return () => clearInterval(id);
    }
  }, [autoRun]);

  useEffect(() => {
    const curEventNode = eventQueueRef?.current?.childNodes?.[curEventIdx];
    if(curEventNode) {
      curEventNode.scrollIntoView({behavior: 'smooth'});
    }
  }, [curEventIdx]);

  const clearEvent = () => {
    setEventQueue([]);
    restartEventRunner(entryNode);
  };

  const clearRedundantEvent = () => {
    // not undoable now
    const curEventSet = new Set();
    for(const edge of edges) {
      if(edge.visible !== true) continue;
      if(nodes[edge.from].visible !== true || nodes[edge.to].visible !== true) continue;
      for(const event of edge.events) {
        curEventSet.add(event);
      }
    }
    setEvents(curEventSet);
  };

  let curEdgeIdx;
  if(runPanelOpen) {
    curEdgeIdx = edges?.findIndex(edge => edge.to === curNode && edge.from === runHistory[runHistory.length - 1]);
    curEdgeIdx = curEdgeIdx === -1 ? undefined : curEdgeIdx;
  }

  return (
    <main ref={mainRef} style={{touchAction: 'none'}}>
    {!userData?.[projectId] ?
      <h2 className='m-3'>This project ID is invalid!</h2>
      :
      <Stage
        width={canvasWidth}
        height={canvasHeight}
        onPointerDblClick={!dragging && createNode}
        onPointerClick={!dragging && (() => setSelected(null))}
        onPointerDown={pointerDownCanvas}
        onPointerMove={pointerMoveCanvas}
        onPointerUp={pointerUpCanvas}
      >
        <Layer>
          {drawingEdge && (
            <DrawingEdge
              viewPos={viewPos}
              zoom={zoom}
              drawingEdge={drawingEdge}
              color='black'
              opacity={0.5}
            />
          )}
          {edges?.map((edge, idx) => {
            if(idx === curEdgeIdx) return null;
            return (
              <Edge
                key={idx}
                edge={edge}
                fontSize={fontSize}
                radius={radius}
                viewPos={viewPos}
                zoom={zoom}
                isSelected={selected?.type === 'edge' && idx === selected.idx}
                color='black'
                nodes={nodes}
                selectEdge={selectEdge(idx)}
                editEdge={editEdge(idx)}
              />
            );
          })}
          {curEdgeIdx !== undefined && (
            <Edge
              edge={edges[curEdgeIdx]}
              fontSize={fontSize}
              radius={radius}
              viewPos={viewPos}
              zoom={zoom}
              isSelected={selected?.type === 'edge' && curEdgeIdx === selected.idx}
              color='deepskyblue'
              nodes={nodes}
              selectEdge={selectEdge(curEdgeIdx)}
              editEdge={editEdge(curEdgeIdx)}
              scale={1.5}
            />
          )}

          {nodes?.map((node, idx) => (
            <Node
              key={idx}
              node={node}
              radius={radius}
              fill={runPanelOpen ? (idx === curNode ? 'deepskyblue' : (runHistory?.includes(idx) ? 'gold' : 'lightyellow')) : 'gold'}
              fontSize={fontSize}
              stroke='black'
              viewPos={viewPos}
              zoom={zoom}
              isSelected={selected?.type === 'node' && idx === selected.idx}
              dragNodeStart={dragNodeStart(idx)}
              dragNodeMove={dragNodeMove(idx)}
              dragNodeEnd={dragNodeEnd(idx)}
              editNode={editNode(idx)}
              selectNode={selectNode(idx)}
              pointerDownNode={pointerDownNode(idx)}
              pointerUpNode={pointerUpNode(idx)}
              doubleStroke={idx === entryNode}
            />
          ))}

          <Html>
            <Dropdown
              isOpen={menuOpen}
              toggle={() => setMenuOpen(state => !state)}
              direction='up'
              className='position-absolute'
              style={{top: runPanelOpen ? canvasHeight - 220 - Math.max(60, canvasHeight * 0.1) : canvasHeight - Math.max(60, canvasHeight * 0.1), left: canvasWidth - Math.max(60, canvasHeight * 0.1)}}
            >
              <DropdownToggle color='light'><FaBars /></DropdownToggle>
              <DropdownMenu style={{minWidth: 0}}>
                <DropdownItem toggle={false} id='menuUndo' onClick={undo}>
                  <FaUndo />
                </DropdownItem>
                <DropdownItem toggle={false} id='menuRedo' onClick={redo}>
                  <FaRedo />
                </DropdownItem>
                <DropdownItem toggle={false} id='menuDelete' onClick={deleteSelected}>
                  <FaTrash />
                </DropdownItem>
                <DropdownItem toggle={false} id='menuSave' onClick={saveData}>
                  <FaSave />
                </DropdownItem>
                <DropdownItem toggle={false} id='menuClear' onClick={clearData}>
                  <MdDeleteSweep />
                </DropdownItem>
                <DropdownItem toggle={false} id='menuFit' onClick={fitScreen}>
                  <MdFitScreen />
                </DropdownItem>
                <DropdownItem toggle={false} id='menuGrid' onClick={() => setAlignGrid(state => !state)}>
                  {alignGrid ? <MdGridOn /> : <MdGridOff />}
                </DropdownItem>
                <DropdownItem toggle={false} id='menuRun' onClick={toggleRunPanel}>
                  {runPanelOpen ? <MdPlayArrow /> : <MdPlayDisabled />}
                </DropdownItem>
                <DropdownItem toggle={false} id='menuInfo' onClick={toggleInfoModal}>
                  <FaInfo />
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
            {menuOpen && (<>
              <UncontrolledTooltip placement='left' target='menuUndo'>
                Undo
              </UncontrolledTooltip>
              <UncontrolledTooltip placement='left' target='menuRedo'>
                Redo
              </UncontrolledTooltip>
              <UncontrolledTooltip placement='left' target='menuDelete'>
                Delete selected item
              </UncontrolledTooltip>
              <UncontrolledTooltip placement='left' target='menuSave'>
                Save
              </UncontrolledTooltip>
              <UncontrolledTooltip placement='left' target='menuClear'>
                Clear all
              </UncontrolledTooltip>
              <UncontrolledTooltip placement='left' target='menuFit'>
                Fit screen
              </UncontrolledTooltip>
              <UncontrolledTooltip placement='left' target='menuGrid'>
                Toggle alignment to integer coordinates
              </UncontrolledTooltip>
              <UncontrolledTooltip placement='left' target='menuRun'>
                Toggle event runner panel
              </UncontrolledTooltip>
              <UncontrolledTooltip placement='left' target='menuInfo'>
                Help
              </UncontrolledTooltip>
            </>)}
            
            {runPanelOpen && (
            <section className='position-absolute border-top border-2 bg-light' style={{top: canvasHeight - 220, width: canvasWidth, height: 220}}>
              <section className='d-flex align-items-center justify-content-between p-2' style={{height: '40px'}}>
                <div>
                  <Button color='light' size='sm' id='panelRun' onClick={() => setAutoRun(state => !state)}>
                    {autoRun ? <MdPause /> : <MdPlayArrow />}
                  </Button>
                  <Button color='light' size='sm' id='panelUndo' onClick={undoEvent}>
                    <MdUndo />
                  </Button>
                  <Button color='light' size='sm' id='panelRedo' onClick={() => setRunJobCnt(cnt => cnt + 1)}>
                    <MdRedo />
                  </Button>
                  <Button color='light' size='sm' id='panelRestart' onClick={() => restartEventRunner(entryNode)}>
                    <MdSkipPrevious />
                  </Button>
                  <Button color='light' size='sm' id='panelRunAll' onClick={() => setRunJobCnt(cnt => cnt + (eventQueue.length - curEventIdx - 1))}>
                    <MdSkipNext />
                  </Button>
                  <Button color='light' size='sm' id='panelClear' onClick={clearEvent}>
                    <MdDeleteSweep />
                  </Button>
                  <Button color='light' size='sm' id='panelClearRedundant' onClick={clearRedundantEvent}>
                    <FaBroom />
                  </Button>
                </div>
                <div>
                  <Button color='light' size='sm' id='panelClose' onClick={toggleRunPanel}>
                    <MdClose />
                  </Button>
                </div>
              </section>
              <DndProvider options={HTML5toTouch}>
                <EventQueue eventQueueRef={eventQueueRef} eventQueue={eventQueue} setEventQueue={(x) => {setEventQueue(x); restartEventRunner(entryNode);}} curEventIdx={curEventIdx} canvasHeight={canvasHeight} />
              </DndProvider>
              <section className='border-top border-1 d-flex align-items-center gap-1 p-2 overflow-auto' style={{height: '80px'}}>
              {events && [...events].map((event, idx) => (
                <Button key={idx} className='EventButton text-truncate' onClick={() => {
                  setEventQueue(queue => queue.concat([{id: eventQueueNextId, name: event}]));
                  setEventQueueNextId(id => id + 1);
                }}>
                  {event}
                </Button>
              ))}
              </section>
              <UncontrolledTooltip placement='top' target='panelRun'>
                {autoRun ? 'Pause' : 'Run the events'}
              </UncontrolledTooltip>
              <UncontrolledTooltip placement='top' target='panelUndo'>
                Undo one event
              </UncontrolledTooltip>
              <UncontrolledTooltip placement='top' target='panelRedo'>
                Run one event
              </UncontrolledTooltip>
              <UncontrolledTooltip placement='top' target='panelRestart'>
                Restart
              </UncontrolledTooltip>
              <UncontrolledTooltip placement='top' target='panelRunAll'>
                Run all events
              </UncontrolledTooltip>
              <UncontrolledTooltip placement='top' target='panelClear'>
                Clear the event queue
              </UncontrolledTooltip>
              <UncontrolledTooltip placement='top' target='panelClearRedundant'>
                Clear events not present in the graph
              </UncontrolledTooltip>
              <UncontrolledTooltip placement='top' target='panelClose'>
                Close panel
              </UncontrolledTooltip>
            </section>)}
          </Html>
        </Layer>
      </Stage>
    }
    </main>
  );
}
