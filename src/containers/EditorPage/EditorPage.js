import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
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
} from 'react-icons/fa';
import {
  MdGridOn,
  MdGridOff,
  MdDeleteSweep,
} from 'react-icons/md';

const infoString =
` Basic usage:
  - Create node: double click on the background
  - Select node: click on the node
  - Move selected node: drag the selected node
  - Delete selected node: press 'Delete' key or press the upper trash icon in the menu

  - Add edge: click on the (unselected) start node and hold on, move to the end node and then release
  - Delete selected edge: same as deleting selected node
  
  - Move canvas: drag the background
  - Zoom: scroll the page

  - Undo: Ctrl+Z or press the undo icon in the menu
  - Redo: Ctrl+Y or press the redo icon in the menu
  - Save: press the save icon in the menu

  - Toggle alignment to integer coordinate: press the grid icon in the menu
  - Delete all: press the lower trash icon in the menu
`;

const union = (setA, setB) => {
  const _union = new Set(setA);
  for(const x of setB) {
    _union.add(x);
  }
  return _union;
}

export default function EditorPage() {
  const { projectId } = useParams();
  const { user, userData, setUserData, toggleModal, setModalData } = useOutletContext();
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

  useEffect(() => {
    if(history.length === 0 && userData?.[projectId]) {
      setNodes(userData[projectId].graph.nodes);
      setEdges(userData[projectId].graph.edges);
      setEvents(new Set(userData[projectId].events));
      setEntryNode(userData[projectId].entryNode);

      setHistory([{
        nodes: userData[projectId].graph.nodes,
        edges: userData[projectId].graph.edges,
        events: new Set(userData[projectId].events),
        entryNode: userData[projectId].entryNode,
      }]);
      setHistoryTime(0);
    }
  }, [userData, projectId, history]);

  const updateNodes = useCallback((newNodes, save=true) => {
    setNodes(newNodes);

    if(save) {
      setHistory(history.slice(0, historyTime + 1).concat([{ nodes: newNodes, edges, events, entryNode }]));
      setHistoryTime(historyTime + 1);
    }
  }, [edges, events, entryNode, history, historyTime]);

  const updateEdges = useCallback((newEdges, save=true) => {
    setEdges(newEdges);

    if(save) {
      setHistory(history.slice(0, historyTime + 1).concat([{ nodes, edges: newEdges, events, entryNode }]));
      setHistoryTime(historyTime + 1);
    }
  }, [nodes, events, entryNode, history, historyTime]);

  const updateEntryNode = useCallback((newEntryNode, save=true) => {
    setEntryNode(newEntryNode);

    if(save) {
      setHistory(history.slice(0, historyTime + 1).concat([{ nodes, edges, events, entryNode: newEntryNode }]));
      setHistoryTime(historyTime + 1);
    }
  }, [nodes, edges, events, history, historyTime]);

  const undo = useCallback(() => {
    if(historyTime <= 0) return;
    setNodes(history[historyTime-1].nodes);
    setEdges(history[historyTime-1].edges);
    setEvents(history[historyTime-1].events);
    setEntryNode(history[historyTime-1].entryNode);
    setHistoryTime(historyTime-1);
  }, [history, historyTime]);

  const redo = useCallback(() => {
    if(historyTime + 1 >= history.length) return;
    setNodes(history[historyTime+1].nodes);
    setEdges(history[historyTime+1].edges);
    setEvents(history[historyTime+1].events);
    setEntryNode(history[historyTime+1].entryNode);
    setHistoryTime(historyTime+1);
  }, [history, historyTime]);

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
      },
    });
  };

  const clearData = () => {
    setNodes([]);
    setEdges([]);
    setEvents(new Set());
    setEntryNode(null);

    setHistory(history.slice(0, historyTime + 1).concat([{ nodes: [], edges: [], events: [], entryNode: null }]));
    setHistoryTime(historyTime + 1);
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
    }));
  }, [edges, updateEdges]);

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
        // createEdge
        updateEdges(edges.concat([{
          from: drawingEdge.from,
          to: idx,
          events: [],
          visible: true,
        }]));
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
      body: 'Edit state data:',
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
          text: 'Make it the initial state',
          onClick: e => updateEntryNode(idx),
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
      body: 'Edit edge data:',
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
                    let newEvents = new Set(e.target.value.split(',').map(x => x.trim()));
                    setEvents(events => union(events, newEvents));
                    updateEdges(Object.assign([], edges, {
                      [idx]: {
                        ...edges[idx],
                        events: [...newEvents],
                      }
                    }));
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

  const toggleInfoModal = () => {
    setModalData({
      body: infoString,
      buttons: [
        {
          text: 'Close',
          onClick: toggleModal,
        },
      ],
    });
    toggleModal();
  };

  return (
    <main ref={mainRef}>
    {!userData?.[projectId] ?
      <h2 className='m-3'>This project ID is invalid!</h2>
      :
      <Stage width={canvasWidth} height={canvasHeight} onPointerDblClick={!dragging && createNode} onPointerClick={!dragging && (() => setSelected(null))} onPointerDown={pointerDownCanvas} onPointerMove={pointerMoveCanvas} onPointerUp={pointerUpCanvas}>
        <Layer>
          {drawingEdge && (
            <Arrow x={zoom * (drawingEdge.fromX - viewPos.x)} y={zoom * (drawingEdge.fromY - viewPos.y)} points={[0, 0, zoom * (drawingEdge.toX - drawingEdge.fromX), zoom * (drawingEdge.toY - drawingEdge.fromY)]} pointerLength={20 * zoom} pointerWidth={20 * zoom} fill='black' stroke='black' strokeWidth={2 * zoom} opacity={0.5} />
          )}
          {edges?.map((edge, idx) => {
            const dx = nodes[edge.to].x - nodes[edge.from].x;
            const dy = nodes[edge.to].y - nodes[edge.from].y;
            return (
            <Arrow
              key={idx}
              x={zoom * (nodes[edge.from].x + radius - viewPos.x)}
              y={zoom * (nodes[edge.from].y + radius - viewPos.y)}
              points={[
                0,
                0,
                zoom * (dx - radius * Math.cos(Math.atan2(dy, dx))),
                zoom * (dy - radius * Math.sin(Math.atan2(dy, dx))),
              ]}
              pointerLength={20 * zoom}
              pointerWidth={20 * zoom}
              fill='black'
              stroke='black'
              strokeWidth={2 * zoom}
              onPointerClick={selectEdge(idx)}
              onPointerDblClick={editEdge(idx)}
              shadowBlur={selected?.type === 'edge' && idx === selected.idx ? 20 : 0}
              visible={edge.visible && nodes[edge.from].visible && nodes[edge.to].visible}
            />
            );
          })}
          {nodes?.map((node, idx) => (
            <Group key={idx} x={zoom * (node.x - viewPos.x)} y={zoom * (node.y - viewPos.y)} draggable={selected?.type === 'node' && idx === selected.idx} onDragStart={dragNodeStart(idx)} onDragMove={dragNodeMove(idx)} onDragEnd={dragNodeEnd(idx)} onPointerDblClick={editNode(idx)} onPointerClick={selectNode(idx)} onPointerDown={pointerDownNode(idx)} onPointerUp={pointerUpNode(idx)} visible={node.visible}>
              <Circle x={zoom * radius} y={zoom * radius} radius={zoom * radius} fill='gold' shadowBlur={selected?.type === 'node' && idx === selected.idx ? 20 : 0} stroke='black' strokeWidth={2} />
              {idx === entryNode && (
                <Circle x={zoom * radius} y={zoom * radius} radius={zoom * (radius * 0.9)} stroke='black' strokeWidth={2} />
              )}
              <Text text={node.name} fontSize={zoom * fontSize} width={zoom * radius * 2} height={zoom * radius * 2} align='center' verticalAlign='middle' listening={false} />
            </Group>
          ))}

          <Html>
            <Dropdown
              isOpen={menuOpen}
              toggle={() => {}}
              onPointerEnter={() => setMenuOpen(true)}
              onPointerLeave={() => setMenuOpen(false)}
              direction='up'
              style={{top: canvasHeight-100, left: canvasWidth-100}}
            >
              <DropdownToggle color='light'><FaBars /></DropdownToggle>
              <DropdownMenu style={{minWidth: 0}}>
                <DropdownItem onClick={undo}>
                  <FaUndo />
                </DropdownItem>
                <DropdownItem onClick={redo}>
                  <FaRedo />
                </DropdownItem>
                <DropdownItem onClick={deleteSelected}>
                  <FaTrash />
                </DropdownItem>
                <DropdownItem onClick={saveData}>
                  <FaSave />
                </DropdownItem>
                <DropdownItem onClick={clearData}>
                  <MdDeleteSweep />
                </DropdownItem>
                <DropdownItem onClick={() => setAlignGrid(state => !state)}>
                  {alignGrid ? <MdGridOn /> : <MdGridOff />}
                </DropdownItem>
                <DropdownItem onClick={toggleInfoModal}>
                  <FaInfo />
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </Html>
        </Layer>
      </Stage>
    }
    </main>
  );
}
