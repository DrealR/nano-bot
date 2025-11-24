import React, { useEffect, useRef } from 'react';
import './styles.css';

interface SwarmData {
  timestamp: number;
  botCount: number;
  totalEnergy: number;
  avgEnergy: number;
}

interface SwarmStatsProps {
  history: SwarmData[];
  hiveMindActive: boolean;
  currentFormation: string;
  onFormationChange: (formation: string) => void;
  connectionCount: number;
}

export const SwarmStats: React.FC<SwarmStatsProps> = ({
  history,
  hiveMindActive,
  currentFormation,
  onFormationChange,
  connectionCount,
}) => {
  const botCountCanvasRef = useRef<HTMLCanvasElement>(null);
  const energyCanvasRef = useRef<HTMLCanvasElement>(null);

  const formations = ['RANDOM', 'CIRCLE', 'GRID', 'SPIRAL', 'VORTEX'];

  // Draw bot count graph
  useEffect(() => {
    const canvas = botCountCanvasRef.current;
    if (!canvas || history.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (i / 4) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw graph
    const maxValue = Math.max(...history.map(d => d.botCount), 1);
    const step = width / (history.length - 1 || 1);

    ctx.strokeStyle = '#00FF41';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00FF41';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    history.forEach((data, index) => {
      const x = index * step;
      const y = height - (data.botCount / maxValue) * height;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Fill area under curve
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 255, 65, 0.1)';
    ctx.fill();
  }, [history]);

  // Draw energy distribution graph
  useEffect(() => {
    const canvas = energyCanvasRef.current;
    if (!canvas || history.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 217, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (i / 4) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw average energy
    const maxValue = Math.max(...history.map(d => d.avgEnergy), 1);
    const step = width / (history.length - 1 || 1);

    ctx.strokeStyle = '#00D9FF';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00D9FF';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    history.forEach((data, index) => {
      const x = index * step;
      const y = height - (data.avgEnergy / maxValue) * height;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 217, 255, 0.1)';
    ctx.fill();
  }, [history]);

  return (
    <div style={styles.container}>
      <div className="panel panel-secondary corner-accent slide-in-left" style={styles.panel}>
        {/* Header */}
        <div style={styles.header}>
          <div className="text-secondary glow-text" style={styles.title}>
            SWARM ANALYTICS
          </div>
          <div style={styles.hiveMindIndicator}>
            <div
              className={hiveMindActive ? 'pulse' : ''}
              style={{
                ...styles.hiveMindDot,
                background: hiveMindActive ? 'var(--color-accent)' : 'var(--color-text-dim)',
                boxShadow: hiveMindActive ? 'var(--glow-accent)' : 'none',
              }}
            />
            <span className={hiveMindActive ? 'text-accent' : 'text-dim'}>
              HIVE MIND {hiveMindActive ? 'ACTIVE' : 'DORMANT'}
            </span>
          </div>
        </div>

        <div className="divider" />

        {/* Bot Count Graph */}
        <div style={styles.graphSection}>
          <div className="stat-label">BOT POPULATION</div>
          <div style={styles.graphContainer} className="scanline">
            <canvas
              ref={botCountCanvasRef}
              width={300}
              height={80}
              style={styles.canvas}
            />
          </div>
        </div>

        {/* Energy Distribution Graph */}
        <div style={styles.graphSection}>
          <div className="stat-label">AVERAGE ENERGY</div>
          <div style={styles.graphContainer} className="scanline">
            <canvas
              ref={energyCanvasRef}
              width={300}
              height={80}
              style={styles.canvas}
            />
          </div>
        </div>

        <div className="divider" />

        {/* Connection Stats */}
        <div style={styles.connectionSection}>
          <div style={styles.connectionStat}>
            <span className="stat-label">NETWORK CONNECTIONS</span>
            <span className="text-primary glow-text" style={{ fontSize: 20, fontWeight: 'bold' }}>
              {connectionCount}
            </span>
          </div>
          <div style={styles.networkViz}>
            {Array.from({ length: Math.min(connectionCount, 20) }).map((_, i) => (
              <div
                key={i}
                className="fade-in"
                style={{
                  ...styles.connectionDot,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="divider" />

        {/* Formation Selector */}
        <div style={styles.formationSection}>
          <div className="stat-label" style={{ marginBottom: 12 }}>
            FORMATION PATTERN
          </div>
          <div style={styles.formationGrid}>
            {formations.map((formation) => (
              <button
                key={formation}
                className={`btn ${
                  currentFormation === formation ? 'btn-accent' : 'btn-secondary'
                }`}
                onClick={() => onFormationChange(formation)}
                style={styles.formationBtn}
              >
                {formation}
              </button>
            ))}
          </div>
        </div>

        {/* Mini Network Map */}
        <div style={styles.miniMapSection}>
          <div className="stat-label" style={{ marginBottom: 12 }}>
            CONNECTION TOPOLOGY
          </div>
          <div style={styles.miniMap} className="grid-bg">
            <NetworkVisualization connectionCount={connectionCount} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Network Visualization Component
const NetworkVisualization: React.FC<{ connectionCount: number }> = ({ connectionCount }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Draw connections
    const nodeCount = Math.min(Math.ceil(Math.sqrt(connectionCount)), 10);
    const radius = Math.min(width, height) / 3;

    const nodes: Array<{ x: number; y: number }> = [];

    // Position nodes in a circle
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      nodes.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    }

    // Draw connections
    ctx.strokeStyle = 'rgba(0, 217, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() > 0.5) {
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    nodes.forEach((node) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#00D9FF';
      ctx.shadowColor = '#00D9FF';
      ctx.shadowBlur = 10;
      ctx.fill();
    });
  }, [connectionCount]);

  return <canvas ref={canvasRef} width={280} height={150} style={{ width: '100%' }} />;
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'fixed',
    top: 120,
    left: 20,
    width: 350,
    maxHeight: 'calc(100vh - 240px)',
    pointerEvents: 'auto',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    maxHeight: '100%',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  hiveMindIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
  },
  hiveMindDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
  },
  graphSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  graphContainer: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  canvas: {
    width: '100%',
    height: 'auto',
  },
  connectionSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  connectionStat: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  networkViz: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    padding: 12,
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    border: '1px solid rgba(0, 255, 65, 0.2)',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--color-primary)',
    boxShadow: 'var(--glow-primary)',
  },
  formationSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  formationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
  },
  formationBtn: {
    padding: '8px 12px',
    fontSize: 11,
  },
  miniMapSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  miniMap: {
    background: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 8,
    padding: 12,
    border: '1px solid rgba(0, 217, 255, 0.2)',
  },
};
