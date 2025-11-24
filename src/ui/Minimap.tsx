import React, { useEffect, useRef, useState } from 'react';
import './styles.css';

interface Bot {
  id: string;
  position: { x: number; y: number; z: number };
  state: string;
  connections: string[];
}

interface MinimapProps {
  bots: Bot[];
  worldSize: { width: number; height: number };
  cameraPosition?: { x: number; y: number };
  onPositionClick?: (x: number, y: number) => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  bots,
  worldSize,
  cameraPosition = { x: 0, y: 0 },
  onPositionClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);

  const mapSize = 200;
  const padding = 10;

  const getStateColor = (state: string): string => {
    const colors: { [key: string]: string } = {
      idle: '#9090A0',
      wandering: '#00FF41',
      eating: '#00D9FF',
      replicating: '#FF006E',
      fleeing: '#FF3333',
      following: '#FFB700',
    };
    return colors[state.toLowerCase()] || '#EAEAEA';
  };

  const worldToMap = (worldX: number, worldY: number) => {
    const scale = (mapSize - padding * 2) / Math.max(worldSize.width, worldSize.height);
    return {
      x: padding + (worldX + worldSize.width / 2) * scale * zoom,
      y: padding + (worldY + worldSize.height / 2) * scale * zoom,
    };
  };

  const mapToWorld = (mapX: number, mapY: number) => {
    const scale = (mapSize - padding * 2) / Math.max(worldSize.width, worldSize.height);
    return {
      x: (mapX - padding) / (scale * zoom) - worldSize.width / 2,
      y: (mapY - padding) / (scale * zoom) - worldSize.height / 2,
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, mapSize, mapSize);

    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, mapSize, mapSize);

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let i = 0; i <= mapSize; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, mapSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(mapSize, i);
      ctx.stroke();
    }

    // Draw border
    ctx.strokeStyle = '#00FF41';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, mapSize - padding * 2, mapSize - padding * 2);

    // Draw connections
    ctx.lineWidth = 1;
    const drawnConnections = new Set<string>();
    bots.forEach((bot) => {
      const botPos = worldToMap(bot.position.x, bot.position.z);

      bot.connections.forEach((targetId) => {
        const connectionId = [bot.id, targetId].sort().join('-');
        if (drawnConnections.has(connectionId)) return;
        drawnConnections.add(connectionId);

        const target = bots.find((b) => b.id === targetId);
        if (!target) return;

        const targetPos = worldToMap(target.position.x, target.position.z);

        ctx.beginPath();
        ctx.moveTo(botPos.x, botPos.y);
        ctx.lineTo(targetPos.x, targetPos.y);
        ctx.strokeStyle = 'rgba(0, 217, 255, 0.3)';
        ctx.stroke();
      });
    });

    // Draw bots
    bots.forEach((bot) => {
      const pos = worldToMap(bot.position.x, bot.position.z);

      // Bot dot
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = getStateColor(bot.state);
      ctx.shadowColor = getStateColor(bot.state);
      ctx.shadowBlur = 5;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw viewport indicator
    const viewportSize = 50;
    const viewportPos = worldToMap(cameraPosition.x, cameraPosition.y);
    ctx.strokeStyle = '#FF006E';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      viewportPos.x - viewportSize / 2,
      viewportPos.y - viewportSize / 2,
      viewportSize,
      viewportSize
    );
    ctx.setLineDash([]);
  }, [bots, worldSize, cameraPosition, zoom]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onPositionClick) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const worldPos = mapToWorld(x, y);
    onPositionClick(worldPos.x, worldPos.y);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !onPositionClick) return;
    handleCanvasClick(e);
  };

  return (
    <div style={styles.container}>
      <div className="panel corner-accent" style={styles.panel}>
        {/* Header */}
        <div style={styles.header}>
          <div className="text-primary glow-text" style={styles.title}>
            TACTICAL MAP
          </div>
          <div style={styles.botCount}>
            <span className="text-dim" style={{ fontSize: 10 }}>UNITS:</span>
            <span className="text-primary" style={{ fontSize: 14, fontWeight: 'bold' }}>
              {bots.length}
            </span>
          </div>
        </div>

        {/* Canvas */}
        <div style={styles.canvasContainer} className="scanline">
          <canvas
            ref={canvasRef}
            width={mapSize}
            height={mapSize}
            style={styles.canvas}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseUp}
          />
        </div>

        {/* Zoom Controls */}
        <div style={styles.controls}>
          <button
            className="btn btn-secondary"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            style={styles.zoomBtn}
          >
            −
          </button>
          <span className="text-secondary" style={styles.zoomLabel}>
            {(zoom * 100).toFixed(0)}%
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            style={styles.zoomBtn}
          >
            +
          </button>
        </div>

        {/* Legend */}
        <div style={styles.legend}>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendDot, background: '#00FF41' }} />
            <span className="text-dim" style={{ fontSize: 10 }}>ACTIVE</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendDot, background: '#00D9FF' }} />
            <span className="text-dim" style={{ fontSize: 10 }}>EATING</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendDot, background: '#FF006E' }} />
            <span className="text-dim" style={{ fontSize: 10 }}>REPLICATING</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendDot, background: '#9090A0' }} />
            <span className="text-dim" style={{ fontSize: 10 }}>IDLE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'fixed',
    bottom: 100,
    left: 20,
    width: 240,
    pointerEvents: 'auto',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  botCount: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  canvasContainer: {
    background: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 8,
    padding: 4,
    border: '1px solid rgba(0, 255, 65, 0.2)',
    cursor: 'crosshair',
  },
  canvas: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  zoomBtn: {
    padding: '4px 12px',
    fontSize: 16,
    minWidth: 40,
  },
  zoomLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 50,
    textAlign: 'center',
  },
  legend: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
    paddingTop: 8,
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    boxShadow: '0 0 5px currentColor',
  },
};
