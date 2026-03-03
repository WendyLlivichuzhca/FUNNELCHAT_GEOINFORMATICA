import React, { useState, useCallback, useEffect } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Save, Play, MessageSquare, GitBranch } from 'lucide-react';
import { MessageNode, ConditionNode } from '../components/CustomNodes';

const nodeTypes = {
    messageNode: MessageNode,
    conditionNode: ConditionNode,
};

const Flujos = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [showAddMenu, setShowAddMenu] = useState(false);

    // Cargar flujos desde el backend
    useEffect(() => {
        fetch('http://localhost:8000/api/flows')
            .then(res => res.json())
            .then(data => {
                if (data && !data.message) {
                    // Si el backend devuelve nodos, los cargamos. React Flow maneja edges por separado o dentro de la data.
                    // Para simplificar, asumimos que data es la lista de nodos.
                    setNodes(data);
                }
            })
            .catch(err => console.error("Error loading flows:", err));
    }, [setNodes]);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: 'var(--primary)' } }, eds)),
        [setEdges]
    );

    const saveFlow = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/flows', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nodes),
            });
            const result = await response.json();
            alert("Flujo guardado con éxito");
        } catch (error) {
            console.error("Error saving flow:", error);
            alert("Error al guardar el flujo");
        }
    };

    const addNode = (type) => {
        const id = (nodes.length + 1).toString();
        const newNode = {
            id,
            type,
            position: { x: Math.random() * 400, y: Math.random() * 200 },
            data: { label: type === 'messageNode' ? 'Escribe tu mensaje aquí...' : '¿Se cumple la condición?' },
        };
        setNodes((nds) => nds.concat(newNode));
        setShowAddMenu(false);
    };

    return (
        <div className="animate-fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: 'bold' }}>Constructor de Flujos</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Diseña la inteligencia de tu chatbot visualmente.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={saveFlow} className="btn" style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
                        <Save size={18} />
                        Guardar
                    </button>
                    <button className="btn" style={{ background: '#10b981', color: 'white' }}>
                        <Play size={18} />
                        Probar Flujo
                    </button>
                </div>
            </header>

            <div className="glass-card" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    colorMode="dark"
                    fitView
                >
                    <Controls style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'white' }} />
                    <MiniMap style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)' }} nodeStrokeColor="var(--primary)" />
                    <Background color="#1e293b" gap={20} />
                </ReactFlow>

                {/* Add Menu */}
                <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 4, display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                    {showAddMenu && (
                        <div className="glass-card animate-fade-in" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px', minWidth: '150px' }}>
                            <button
                                onClick={() => addNode('messageNode')}
                                className="btn" style={{ justifyContent: 'flex-start', fontSize: '13px', padding: '8px' }}
                            >
                                <MessageSquare size={16} color="var(--primary)" /> Mensaje
                            </button>
                            <button
                                onClick={() => addNode('conditionNode')}
                                className="btn" style={{ justifyContent: 'flex-start', fontSize: '13px', padding: '8px' }}
                            >
                                <GitBranch size={16} color="#f59e0b" /> Condición
                            </button>
                        </div>
                    )}
                    <button
                        onClick={() => setShowAddMenu(!showAddMenu)}
                        className="btn btn-primary"
                        style={{ borderRadius: '50%', width: '56px', height: '56px', padding: 0, justifyContent: 'center', boxShadow: '0 0 20px var(--primary)' }}
                    >
                        <Plus size={24} style={{ transform: showAddMenu ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Flujos;
