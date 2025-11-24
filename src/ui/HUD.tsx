import React from 'react';
import './styles.css';

interface HUDProps {
  swarmCount: number;
  totalEnergy: number;
  activeTasks: number;
  fps?: number;
  timestamp?: number;
}

export const HUD: React.FC<HUDProps> = ({
  swarmCount,
  totalEnergy,
  activeTasks,
  fps = 60,
  timestamp = Date.now(),
}) => {
  const formatEnergy = (energy: number): string => {
    if (energy >= 1000000) return `${(energy / 1000000).toFixed(2)}M`;
    if (energy >= 1000) return `${(energy / 1000).toFixed(2)}K`;
    return energy.toFixed(0);
  };

  const formatTime = (ts: number): string => {
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  return (
    <div className="hud-container">
      {/* Top Bar */}
      <div style={styles.topBar}>
        <div className="panel corner-accent" style={styles.topPanel}>
          <div style={styles.logoSection}>
            <div className="text-primary glow-text" style={styles.logo}>
              NANO<span className="text-accent">BOT</span>
            </div>
            <div style={styles.subtitle}>
              SWARM CONTROL SYSTEM
            </div>
          </div>

          <div style={styles.dividerVertical} />

          <div style={styles.statsGrid}>
            <div className="stat">
              <div className="stat-label">SWARM SIZE</div>
              <div className="stat-value text-primary">{swarmCount}</div>
            </div>

            <div style={styles.dividerVertical} />

            <div className="stat">
              <div className="stat-label">TOTAL ENERGY</div>
              <div className="stat-value text-secondary">
                {formatEnergy(totalEnergy)}
              </div>
            </div>

            <div style={styles.dividerVertical} />

            <div className="stat">
              <div className="stat-label">ACTIVE TASKS</div>
              <div className="stat-value text-accent">{activeTasks}</div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="panel panel-secondary" style={styles.statusPanel}>
          <div style={styles.statusRow}>
            <div style={styles.statusIndicator}>
              <div className="pulse" style={{
                ...styles.statusDot,
                background: 'var(--color-primary)',
                boxShadow: 'var(--glow-primary)',
              }} />
              <span className="text-primary">ONLINE</span>
            </div>

            <div style={styles.statusInfo}>
              <span className="text-dim" style={styles.smallText}>FPS</span>
              <span className="text-secondary" style={styles.statusValue}>
                {fps.toFixed(0)}
              </span>
            </div>

            <div style={styles.statusInfo}>
              <span className="text-dim" style={styles.smallText}>TIME</span>
              <span className="text-primary" style={styles.statusValue}>
                {formatTime(timestamp)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Quick Stats */}
      <div style={styles.bottomBar}>
        <div className="panel scanline" style={styles.bottomPanel}>
          <div style={styles.quickStats}>
            <div style={styles.quickStat}>
              <span className="text-dim">AVG ENERGY:</span>
              <span className="text-primary">
                {swarmCount > 0 ? (totalEnergy / swarmCount).toFixed(1) : '0.0'}
              </span>
            </div>

            <div style={styles.quickStat}>
              <span className="text-dim">EFFICIENCY:</span>
              <span className="text-secondary">
                {activeTasks > 0 ? Math.min(100, (activeTasks / swarmCount) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>

            <div style={styles.quickStat}>
              <span className="text-dim">HIVE MIND:</span>
              <span className="text-accent pulse">
                {swarmCount > 10 ? 'ACTIVE' : 'DORMANT'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Corner Decorations */}
      <div style={styles.cornerTL} className="text-primary">┌</div>
      <div style={styles.cornerTR} className="text-secondary">┐</div>
      <div style={styles.cornerBL} className="text-accent">└</div>
      <div style={styles.cornerBR} className="text-primary">┘</div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  topBar: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
  },
  topPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 24,
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 2,
    color: 'var(--color-text-dim)',
  },
  statsGrid: {
    display: 'flex',
    gap: 24,
    flex: 1,
    alignItems: 'center',
  },
  dividerVertical: {
    width: 1,
    height: 50,
    background: 'linear-gradient(180deg, transparent, var(--color-primary), transparent)',
    boxShadow: '0 0 5px var(--color-primary)',
  },
  statusPanel: {
    minWidth: 300,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
  },
  statusInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2,
  },
  smallText: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    display: 'flex',
    justifyContent: 'center',
  },
  bottomPanel: {
    maxWidth: 800,
  },
  quickStats: {
    display: 'flex',
    gap: 40,
    justifyContent: 'center',
  },
  quickStat: {
    display: 'flex',
    gap: 8,
    fontSize: 14,
    alignItems: 'center',
  },
  cornerTL: {
    position: 'absolute',
    top: 10,
    left: 10,
    fontSize: 24,
    fontWeight: 'bold',
    textShadow: 'var(--glow-primary)',
  },
  cornerTR: {
    position: 'absolute',
    top: 10,
    right: 10,
    fontSize: 24,
    fontWeight: 'bold',
    textShadow: 'var(--glow-secondary)',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    fontSize: 24,
    fontWeight: 'bold',
    textShadow: 'var(--glow-accent)',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    fontSize: 24,
    fontWeight: 'bold',
    textShadow: 'var(--glow-primary)',
  },
};
