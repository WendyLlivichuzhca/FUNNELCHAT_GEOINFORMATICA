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
import { Plus, Save, Play, MessageSquare, Split, Send, X } from 'lucide-react';
import { API_URL } from '../config/api';

// --- Componentes de Nodos Personalizados ---

const MessageNode = ({ data }) => (
    <div style={{
        padding: '16px',
        minWidth: '220px',
        background: 'rgba(99, 102, 241, 0.08)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        transition: 'all 0.3s ease'
    }}>
        <Handle type="target" position={Position.Top} style={{ background: 'var(--primary)', border: '2px solid var(--bg-card)', width: '10px', height: '10px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ padding: '6px', background: 'var(--primary-gradient)', borderRadius: '8px', display: 'flex' }}>
                <MessageSquare size={14} color="white" />
            </div>
            <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-title)', textTransform: 'uppercase', letterSpacing: '1px' }}>Mensaje</span>
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-subtitle)', lineHeight: '1.5', fontWeight: '500' }}>{data.label}</div>
        <Handle type="source" position={Position.Bottom} style={{ background: 'var(--primary)', border: '2px solid var(--bg-card)', width: '10px', height: '10px' }} />
    </div>
);

const ConditionNode = ({ data }) => (
    <div style={{
        padding: '16px',
        minWidth: '240px',
        background: 'rgba(245, 158, 11, 0.08)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        transition: 'all 0.3s ease'
    }}>
        <Handle type="target" position={Position.Top} style={{ background: 'var(--warning)', border: '2px solid var(--bg-card)', width: '10px', height: '10px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ padding: '6px', background: 'var(--warning)', borderRadius: '8px', display: 'flex' }}>
                <Split size={14} color="white" />
            </div>
            <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-title)', textTransform: 'uppercase', letterSpacing: '1px' }}>Condición</span>
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-subtitle)', marginBottom: '14px', fontWeight: '500' }}>{data.label}</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px', position: 'relative' }}>
            <div style={{ fontSize: '10px', color: 'var(--success)', fontWeight: '900', letterSpacing: '0.5px' }}>SÍ (True)</div>
            <div style={{ fontSize: '10px', color: 'var(--error)', fontWeight: '900', letterSpacing: '0.5px' }}>NO (False)</div>
        </div>

        <Handle
            type="source"
            position={Position.Bottom}
            id="yes"
            style={{ left: '25%', background: 'var(--success)', border: '2px solid var(--bg-card)', width: '10px', height: '10px' }}
        />
        <Handle
            type="source"
            position={Position.Bottom}
            id="no"
            style={{ left: '75%', background: 'var(--error)', border: '2px solid var(--bg-card)', width: '10px', height: '10px' }}
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
        fetch(`${API_URL}/api/flows`)
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
            const response = await fetch(`${API_URL}/api/flows/test`, {
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
            const response = await fetch('${API_URL}/api/flows', {
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
        <div className="animate-fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 className="heading-xl" style={{ fontSize: '28px' }}>Constructor de Flujos</h2>
                    <p className="text-main">Diseña la inteligencia de tu chatbot visualmente.</p>
                </div>
                <div style={{ display: 'flex', gap: '14px' }}>
                    <button
                        onClick={saveFlow}
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-subtle)',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer'
                        }}
                        className="hover:bg-white/5 transition-colors"
                    >
                        <Save size={18} />
                        Guardar Flujo
                    </button>
                    <button
                        onClick={() => setShowTestChat(true)}
                        className="btn-primary"
                        style={{ height: '44px' }}
                    >
                        <Play size={18} fill="currentColor" />
                        Probar Simulador
                    </button>
                </div>
            </header>

            <div style={{ flex: 1, display: 'flex', gap: '24px', minHeight: 0 }}>
                <div className="glass-card" style={{
                    flex: 1,
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-secondary)',
                    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)'
                }}>
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
                        <Controls style={{
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '12px',
                            padding: '4px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                        }} />
                        <MiniMap
                            style={{
                                backgroundColor: 'var(--bg-card)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.4)'
                            }}
                            nodeStrokeColor="var(--primary)"
                            maskColor="rgba(10, 10, 20, 0.7)"
                        />
                        <Background color="rgba(255,255,255,0.03)" gap={24} size={1} />
                    </ReactFlow>

                    <div style={{ position: 'absolute', bottom: '24px', right: '24px', zIndex: 4, display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => addNode('message')}
                            className="btn-primary"
                            title="Añadir Mensaje"
                            style={{ borderRadius: '14px', width: '52px', height: '52px', padding: 0, justifyContent: 'center', boxShadow: '0 15px 30px -5px rgba(99, 102, 241, 0.5)' }}
                        >
                            <MessageSquare size={22} />
                        </button>
                        <button
                            onClick={() => addNode('condition')}
                            className="hover:brightness-110 transition-all"
                            title="Añadir Condición"
                            style={{
                                background: 'var(--warning)',
                                color: 'white',
                                borderRadius: '14px',
                                width: '52px',
                                height: '52px',
                                padding: 0,
                                justifyContent: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 15px 30px -5px rgba(245, 158, 11, 0.5)'
                            }}
                        >
                            <Split size={22} />
                        </button>
                    </div>
                </div>

                {selectedNode && (
                    <div
                        className="glass-card animate-slide-in"
                        style={{
                            width: '360px',
                            padding: '32px',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '30px',
                            background: 'var(--bg-card)',
                            boxShadow: '-20px 0 50px rgba(0,0,0,0.5)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '4px', height: '18px', background: 'var(--primary)', borderRadius: '4px' }}></div>
                                <h3 className="heading-base" style={{ fontSize: '18px' }}>Propiedades</h3>
                            </div>
                            <button onClick={() => setSelectedNode(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '8px' }} className="hover:bg-white/10 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div>
                            <label className="text-small" style={{ display: 'block', marginBottom: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Contenido del {selectedNode.type === 'message' ? 'Mensaje' : 'Condición'}
                            </label>
                            <textarea
                                value={editValue}
                                onChange={handleEditChange}
                                placeholder="Escribe aquí el texto..."
                                className="input-styled"
                                style={{
                                    width: '100%',
                                    minHeight: '180px',
                                    padding: '18px',
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                    resize: 'none'
                                }}
                            />
                        </div>

                        <div style={{
                            padding: '20px',
                            borderRadius: '16px',
                            background: 'rgba(99, 102, 241, 0.04)',
                            border: '1px solid rgba(99, 102, 241, 0.1)',
                            display: 'flex',
                            gap: '12px'
                        }}>
                            <div style={{ color: 'var(--primary)' }}>
                                <Plus size={20} />
                            </div>
                            <p className="text-small" style={{ lineHeight: '1.5', color: 'var(--text-subtitle)' }}>
                                <span style={{ color: 'var(--primary)', fontWeight: '800' }}>Tip:</span> Los cambios se aplican al instante. Recuerda guardar el flujo completo antes de salir.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Chat de Prueba */}
            {showTestChat && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 5, 10, 0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
                    <div className="glass-card animate-scale-in" style={{ width: '420px', height: '650px', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.7)' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Play size={18} fill="white" color="white" style={{ marginLeft: '2px' }} />
                                </div>
                                <div>
                                    <h3 className="heading-base" style={{ fontSize: '16px' }}>Simulador de Flujo</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '6px', height: '6px', background: 'var(--success)', borderRadius: '50%', boxShadow: '0 0 8px var(--success)' }}></div>
                                        <span className="text-small" style={{ color: 'var(--success)', fontWeight: '700' }}>En línea</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => { setShowTestChat(false); setTestMessages([]); setCurrentTestNode(null); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', borderRadius: '10px' }} className="hover:bg-white/10 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-secondary)' }}>
                            {testMessages.length === 0 && (
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', paddingTop: '60px' }}>
                                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '50%', width: '80px', height: '80px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <MessageSquare size={32} style={{ opacity: 0.3 }} />
                                    </div>
                                    <p className="heading-base" style={{ fontSize: '15px', color: 'var(--text-subtitle)' }}>Inicia la Conversación</p>
                                    <p className="text-small" style={{ maxWidth: '200px', margin: '8px auto 0' }}>Envía un mensaje para validar la lógica de tu flujo en tiempo real.</p>
                                </div>
                            )}
                            {testMessages.map(m => (
                                <div key={m.id} style={{
                                    alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                                    background: m.sender === 'user' ? 'var(--bg-hover)' : 'var(--primary-gradient)',
                                    color: 'white',
                                    padding: '12px 18px',
                                    borderRadius: m.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                    fontSize: '14px',
                                    maxWidth: '85%',
                                    border: m.sender === 'user' ? '1px solid var(--border-subtle)' : 'none',
                                    boxShadow: m.sender === 'user' ? 'none' : '0 10px 20px -5px rgba(99, 102, 241, 0.3)',
                                    animation: 'fadeIn 0.3s ease forwards'
                                }}>
                                    <div style={{ lineHeight: '1.5', fontWeight: '500' }}>{m.text}</div>
                                    <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7, textAlign: 'right' }}>
                                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ padding: '24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', gap: '10px', background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '6px 6px 6px 16px', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    value={testInput}
                                    onChange={e => setTestInput(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleTestMessage()}
                                    placeholder="Escribe un mensaje..."
                                    style={{ flex: 1, background: 'none', border: 'none', color: 'white', outline: 'none', fontSize: '14px' }}
                                />
                                <button onClick={handleTestMessage} className="btn-primary" style={{ padding: '0', width: '40px', height: '40px', minWidth: '40px', borderRadius: '12px', justifyContent: 'center' }}>
                                    <Send size={18} fill="white" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Flujos;
