import React, { useState, useCallback } from 'react';
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
import { Plus, Save, Play } from 'lucide-react';

const initialNodes = [
    {
        id: '1',
        position: { x: 250, y: 5 },
        data: { label: 'Entrada: Palabra clave "Hola"' },
        type: 'input',
        style: { background: 'var(--primary)', color: 'white', borderRadius: '8px', border: 'none', padding: '10px' }
    },
    {
        id: '2',
        position: { x: 250, y: 100 },
        data: { label: 'Enviar: ¡Hola! ¿Cómo podemos ayudarte?' },
        style: { background: 'var(--surface)', color: 'white', border: '1px solid var(--primary)', borderRadius: '8px', padding: '10px' }
    },
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: 'var(--primary)' } }];

const Flujos = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: 'var(--primary)' } }, eds)),
        [setEdges]
    );

    const addNode = () => {
        const newNode = {
            id: (nodes.length + 1).toString(),
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            data: { label: `Nuevo Paso ${nodes.length + 1}` },
            style: { background: 'var(--surface)', color: 'white', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '10px' }
        };
        setNodes((nds) => nds.concat(newNode));
    };

    return (
        <div className="animate-fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: 'bold' }}>Constructor de Flujos</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Diseña la inteligencia de tu chatbot visualmente.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn" style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
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
                    colorMode="dark"
                    fitView
                >
                    <Controls style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'white' }} />
                    <MiniMap style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)' }} nodeStrokeColor="var(--primary)" />
                    <Background color="#1e293b" gap={20} />
                </ReactFlow>

                <button
                    onClick={addNode}
                    className="btn btn-primary"
                    style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 4, borderRadius: '50%', width: '56px', height: '56px', padding: 0, justifyContent: 'center' }}
                >
                    <Plus size={24} />
                </button>
            </div>
        </div>
    );
};

export default Flujos;
