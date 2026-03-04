import React, { useState, useCallback, useEffect } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Handle,
    Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Save, Play, MessageSquare, Split } from 'lucide-react';

// --- Componentes de Nodos Personalizados ---

const MessageNode = ({ data }) => (
    <div className="glass-card" style={{
        padding: '12px',
        minWidth: '180px',
        border: '1px solid var(--primary)',
        background: 'rgba(99, 102, 241, 0.1)',
        borderRadius: '12px'
    }}>
        <Handle type="target" position={Position.Top} style={{ background: 'var(--primary)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--primary)' }}>
            <MessageSquare size={16} />
            <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mensaje</span>
        </div>
        <div style={{ fontSize: '13px', color: 'white', lineHeight: '1.4' }}>{data.label}</div>
        <Handle type="source" position={Position.Bottom} style={{ background: 'var(--primary)' }} />
    </div>
);

const ConditionNode = ({ data }) => (
    <div className="glass-card" style={{
        padding: '12px',
        minWidth: '200px',
        border: '1px solid #f59e0b',
        background: 'rgba(245, 158, 11, 0.1)',
        borderRadius: '12px'
    }}>
        <Handle type="target" position={Position.Top} style={{ background: '#f59e0b' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#f59e0b' }}>
            <Split size={16} />
            <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Condición</span>
        </div>
        <div style={{ fontSize: '13px', color: 'white', marginBottom: '10px' }}>{data.label}</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', position: 'relative' }}>
            <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 'bold' }}>SÍ</div>
            <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold' }}>NO</div>
        </div>

        <Handle
            type="source"
            position={Position.Bottom}
            id="yes"
            style={{ left: '25%', background: '#10b981', width: '8px', height: '8px' }}
        />
        <Handle
            type="source"
            position={Position.Bottom}
            id="no"
            style={{ left: '75%', background: '#ef4444', width: '8px', height: '8px' }}
        />
    </div>
);

const nodeTypes = {
    message: MessageNode,
    condition: ConditionNode,
};

const initialNodes = [
    {
        id: '1',
        type: 'message',
        position: { x: 250, y: 0 },
        data: { label: 'Entrada: Palabra clave "Hola"' },
    },
    {
        id: '2',
        type: 'condition',
        position: { x: 240, y: 120 },
        data: { label: '¿Es cliente registrado?' },
    },
    {
        id: '3',
        type: 'message',
        position: { x: 50, y: 280 },
        data: { label: 'Enviar: ¡Bienvenido de nuevo! 👋' },
    },
    {
        id: '4',
        type: 'message',
        position: { x: 400, y: 280 },
        data: { label: 'Enviar: ¡Hola! Cuéntanos tu nombre.' },
    },
];

const initialEdges = [
    { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: 'var(--primary)', strokeWidth: 2 } },
    { id: 'e2-3', source: '2', sourceHandle: 'yes', target: '3', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
    { id: 'e2-4', source: '2', sourceHandle: 'no', target: '4', animated: true, style: { stroke: '#ef4444', strokeWidth: 2 } },
];

const Flujos = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [showTestChat, setShowTestChat] = useState(false);
    const [testMessages, setTestMessages] = useState([]);
    const [testInput, setTestInput] = useState('');
    const [currentTestNode, setCurrentTestNode] = useState(null);

    // Cargar flujo desde el backend
    useEffect(() => {
        fetch('http://localhost:8000/api/flows')
            .then(res => res.json())
            .then(data => {
                setNodes(data.nodes || []);
                setEdges(data.edges || []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error loading flows:", err);
                setLoading(false);
            });
    }, [setNodes, setEdges]);

    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
        setEditValue(node.data.label);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    const handleEditChange = (e) => {
        const newValue = e.target.value;
        setEditValue(newValue);
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNode.id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            label: newValue,
                        },
                    };
                }
                return node;
            })
        );
    };

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge({
            ...params,
            animated: true,
            style: { stroke: params.sourceHandle === 'yes' ? '#10b981' : params.sourceHandle === 'no' ? '#ef4444' : 'var(--primary)', strokeWidth: 2 }
        }, eds)),
        [setEdges]
    );

    const handleTestMessage = async () => {
        if (!testInput.trim()) return;
        const userMsg = { text: testInput, sender: 'user', id: Date.now() };
        setTestMessages(prev => [...prev, userMsg]);
        setTestInput('');

        try {
            const response = await fetch('http://localhost:8000/api/flows/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.text,
                    nodes,
                    edges,
                    current_node_id: currentTestNode
                })
            });
            const data = await response.json();
            setTestMessages(prev => [...prev, { text: data.response, sender: 'bot', id: Date.now() + 1 }]);
            setCurrentTestNode(data.node_id);
        } catch (err) {
            setTestMessages(prev => [...prev, { text: "Error de conexión.", sender: 'bot', id: Date.now() + 1 }]);
        }
    };

    const saveFlow = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/flows', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nodes, edges })
            });
            const data = await response.json();
            if (data.status === 'success') {
                alert('¡Flujo guardado con éxito!');
            }
        } catch (err) {
            console.error("Error saving flow:", err);
            alert('Error al guardar el flujo');
        }
    };

    const addNode = (type) => {
        const id = (nodes.length + 1).toString() + "_" + Date.now();
        const newNode = {
            id,
            type,
            position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
            data: { label: type === 'message' ? 'Nuevo Mensaje' : 'Nueva Condición' },
        };
        setNodes((nds) => nds.concat(newNode));
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'white' }}>
                <p>Cargando constructor de flujos...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: 'bold' }}>Constructor de Flujos</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Diseña la inteligencia de tu chatbot visualmente.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={saveFlow}
                        className="btn"
                        style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}
                    >
                        <Save size={18} />
                        Guardar
                    </button>
                    <button
                        onClick={() => setShowTestChat(true)}
                        className="btn"
                        style={{ background: '#10b981', color: 'white' }}
                    >
                        <Play size={18} />
                        Probar Flujo
                    </button>
                </div>
            </header>

            <div style={{ flex: 1, display: 'flex', gap: '20px', minHeight: 0 }}>
                <div className="glass-card" style={{ flex: 1, position: 'relative', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        nodeTypes={nodeTypes}
                        colorMode="dark"
                        fitView
                    >
                        <Controls style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'white' }} />
                        <MiniMap style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)' }} nodeStrokeColor="var(--primary)" />
                        <Background color="#1e293b" gap={20} />
                    </ReactFlow>

                    <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 4, display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => addNode('message')}
                            className="btn btn-primary"
                            title="Añadir Mensaje"
                            style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0, justifyContent: 'center' }}
                        >
                            <MessageSquare size={20} />
                        </button>
                        <button
                            onClick={() => addNode('condition')}
                            className="btn"
                            title="Añadir Condición"
                            style={{ background: '#f59e0b', color: 'white', borderRadius: '50%', width: '48px', height: '48px', padding: 0, justifyContent: 'center' }}
                        >
                            <Split size={20} />
                        </button>
                    </div>
                </div>

                {selectedNode && (
                    <div className="glass-card animate-slide-in" style={{ width: '320px', padding: '24px', border: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--surface)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>Propiedades</h3>
                            <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>
                                Contenido del {selectedNode.type === 'message' ? 'Mensaje' : 'Condición'}
                            </label>
                            <textarea
                                value={editValue}
                                onChange={handleEditChange}
                                placeholder="Escribe aquí el texto..."
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    color: 'white',
                                    minHeight: '160px',
                                    resize: 'none',
                                    outline: 'none',
                                    fontSize: '14px',
                                    transition: 'border-color 0.2s',
                                    lineHeight: '1.6'
                                }}
                            />
                        </div>

                        <div style={{
                            padding: '16px',
                            borderRadius: '12px',
                            background: 'rgba(99, 102, 241, 0.05)',
                            border: '1px solid rgba(99, 102, 241, 0.1)',
                            fontSize: '13px',
                            color: 'var(--text-muted)',
                            lineHeight: '1.5'
                        }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Tip:</span> Los cambios se ven en tiempo real. Pulsa "Guardar" arriba para persistir el flujo.
                        </div>
                    </div>
                )}
            </div>
            {/* Modal de Chat de Prueba */}
            {showTestChat && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                    <div className="glass-card animate-scale-in" style={{ width: '400px', height: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--primary)' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary-gradient)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%' }}></div>
                                <h3 style={{ fontWeight: 'bold' }}>Simulador de Flujo</h3>
                            </div>
                            <button onClick={() => { setShowTestChat(false); setTestMessages([]); setCurrentTestNode(null); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
                        </div>

                        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {testMessages.length === 0 && (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '40px' }}>
                                    <MessageSquare size={40} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                                    <p>Envía un mensaje para iniciar el flujo de prueba.</p>
                                </div>
                            )}
                            {testMessages.map(m => (
                                <div key={m.id} style={{
                                    alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                                    background: m.sender === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                    padding: '10px 14px',
                                    borderRadius: '12px',
                                    fontSize: '13px',
                                    maxWidth: '80%',
                                    border: m.sender === 'user' ? 'none' : '1px solid var(--glass-border)'
                                }}>
                                    {m.text}
                                </div>
                            ))}
                        </div>

                        <div style={{ padding: '20px', background: 'rgba(0,0,0,0.3)', display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                value={testInput}
                                onChange={e => setTestInput(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleTestMessage()}
                                placeholder="Escribe un mensaje de prueba..."
                                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '10px', color: 'white', outline: 'none' }}
                            />
                            <button onClick={handleTestMessage} className="btn btn-primary" style={{ padding: '10px' }}>
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Flujos;
