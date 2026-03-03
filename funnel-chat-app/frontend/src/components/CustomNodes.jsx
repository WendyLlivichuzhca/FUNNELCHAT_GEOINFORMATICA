import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { MessageSquare, GitBranch, Settings } from 'lucide-react';

export const MessageNode = memo(({ data }) => {
    return (
        <div className="glass-card" style={{ padding: '12px', minWidth: '180px', border: '1px solid var(--primary)', position: 'relative' }}>
            <Handle type="target" position={Position.Top} style={{ background: 'var(--primary)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--primary)' }}>
                <MessageSquare size={14} />
                <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Mensaje</span>
            </div>
            <div style={{ fontSize: '12px', color: 'white' }}>{data.label}</div>
            <Handle type="source" position={Position.Bottom} style={{ background: 'var(--primary)' }} />
        </div>
    );
});

export const ConditionNode = memo(({ data }) => {
    return (
        <div className="glass-card" style={{ padding: '12px', minWidth: '180px', border: '1px solid #f59e0b', position: 'relative' }}>
            <Handle type="target" position={Position.Top} style={{ background: '#f59e0b' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#f59e0b' }}>
                <GitBranch size={14} />
                <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Condición</span>
            </div>
            <div style={{ fontSize: '12px', color: 'white' }}>{data.label}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <div style={{ fontSize: '10px', color: '#10b981' }}>SÍ</div>
                <div style={{ fontSize: '10px', color: '#ef4444' }}>NO</div>
            </div>
            <Handle type="source" position={Position.Bottom} id="yes" style={{ left: '30%', background: '#10b981' }} />
            <Handle type="source" position={Position.Bottom} id="no" style={{ left: '70%', background: '#ef4444' }} />
        </div>
    );
});
