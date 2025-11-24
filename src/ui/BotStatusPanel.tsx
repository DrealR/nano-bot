import React, { useState, useEffect } from 'react';
import './styles.css';

interface Bot {
  id: string;
  state: string;
  energy: number;
  maxEnergy: number;
  health: number;
  maxHealth: number;
  memoryUsage: number;
  skills: Array<{ name: string; level: number }>;
  generation: number;
  parentId?: string;
  childrenIds: string[];
}

interface BotStatusPanelProps {
  bot: Bot | null;
  onClose: () => void;
}

export const BotStatusPanel: React.FC<BotStatusPanelProps> = ({ bot, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (bot) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [bot]);

  if (!bot || !visible) return null;

  const healthPercent = (bot.health / bot.maxHealth) * 100;
  const energyPercent = (bot.energy / bot.maxEnergy) * 100;
  const memoryPercent = bot.memoryUsage;

  const getStateColor = (state: string): string => {
    const colors: { [key: string]: string } = {
      idle: 'var(--color-text-dim)',
      wandering: 'var(--color-primary)',
      eating: 'var(--color-secondary)',
      replicating: 'var(--color-accent)',
      fleeing: 'var(--color-danger)',
      following: 'var(--color-warning)',
    };
    return colors[state.toLowerCase()] || 'var(--color-text)';
  };

  const getStateIcon = (state: string): string => {
    const icons: { [key: string]: string } = {
      idle: '◇',
      wandering: '↻',
      eating: '●',
      replicating: '◈',
      fleeing: '⚠',
      following: '→',
    };
    return icons[state.toLowerCase()] || '◇';
  };

  return (
    <div style={styles.container} className="slide-in-right">
      <div className="panel corner-accent" style={styles.panel}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div className="text-primary glow-text" style={styles.title}>
              BOT #{bot.id.substring(0, 8)}
            </div>
            <div style={styles.subtitle}>
              GEN-{bot.generation} | {bot.childrenIds.length} OFFSPRING
            </div>
          </div>
          <button className="btn btn-accent" onClick={onClose} style={styles.closeBtn}>
            ✕
          </button>
        </div>

        <div className="divider" />

        {/* State Indicator */}
        <div style={styles.stateSection}>
          <div style={styles.stateIcon}>
            <div
              className="pulse"
              style={{
                ...styles.stateIconInner,
                color: getStateColor(bot.state),
                textShadow: `0 0 20px ${getStateColor(bot.state)}`,
              }}
            >
              {getStateIcon(bot.state)}
            </div>
          </div>
          <div>
            <div className="stat-label">CURRENT STATE</div>
            <div
              className="glow-text"
              style={{
                ...styles.stateName,
                color: getStateColor(bot.state),
              }}
            >
              {bot.state.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="divider" />

        {/* Circular Health/Energy Bars */}
        <div style={styles.circularBars}>
          <CircularProgress
            value={healthPercent}
            label="HEALTH"
            color="var(--color-accent)"
          />
          <CircularProgress
            value={energyPercent}
            label="ENERGY"
            color="var(--color-primary)"
          />
        </div>

        {/* Memory Usage */}
        <div style={styles.memorySection}>
          <div style={styles.memoryHeader}>
            <span className="stat-label">MEMORY USAGE</span>
            <span className="text-secondary">{memoryPercent.toFixed(1)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${memoryPercent}%`,
                background: memoryPercent > 80
                  ? 'var(--color-danger)'
                  : 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
              }}
            />
          </div>
        </div>

        <div className="divider" />

        {/* Skills */}
        <div style={styles.skillsSection}>
          <div className="stat-label" style={{ marginBottom: 12 }}>ACQUIRED SKILLS</div>
          <div className="custom-scrollbar" style={styles.skillsList}>
            {bot.skills.length > 0 ? (
              bot.skills.map((skill, index) => (
                <div key={index} style={styles.skillItem} className="fade-in">
                  <div style={styles.skillInfo}>
                    <span className="text-primary">{skill.name}</span>
                    <span className="text-secondary">LVL {skill.level}</span>
                  </div>
                  <div className="progress-bar" style={{ height: 4 }}>
                    <div
                      className="progress-fill"
                      style={{ width: `${(skill.level / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-dim" style={{ textAlign: 'center', padding: 16 }}>
                No skills acquired
              </div>
            )}
          </div>
        </div>

        {/* Generation Tree Visualization */}
        <div style={styles.treeSection}>
          <div className="stat-label" style={{ marginBottom: 12 }}>LINEAGE</div>
          <div style={styles.treeViz} className="grid-bg">
            {bot.parentId && (
              <div style={styles.treeNode} className="text-dim">
                <div style={styles.treeNodeIcon}>↑</div>
                <div style={styles.treeNodeLabel}>PARENT</div>
              </div>
            )}
            <div style={styles.treeNode} className="text-primary glow-text">
              <div style={styles.treeNodeIcon}>◈</div>
              <div style={styles.treeNodeLabel}>SELF</div>
            </div>
            {bot.childrenIds.length > 0 && (
              <div style={styles.treeNode} className="text-secondary">
                <div style={styles.treeNodeIcon}>↓</div>
                <div style={styles.treeNodeLabel}>
                  {bot.childrenIds.length} CHILD{bot.childrenIds.length > 1 ? 'REN' : ''}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Circular Progress Component
interface CircularProgressProps {
  value: number;
  label: string;
  color: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ value, label, color }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div style={styles.circularContainer}>
      <svg width="140" height="140" style={styles.circularSvg}>
        {/* Background circle */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            ...styles.circularProgress,
            filter: `drop-shadow(0 0 10px ${color})`,
          }}
        />
      </svg>
      <div style={styles.circularText}>
        <div className="glow-text" style={{ fontSize: 24, fontWeight: 'bold', color }}>
          {value.toFixed(0)}%
        </div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'fixed',
    top: 120,
    right: 20,
    width: 400,
    maxHeight: 'calc(100vh - 240px)',
    pointerEvents: 'auto',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    maxHeight: '100%',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 11,
    color: 'var(--color-text-dim)',
    marginTop: 4,
  },
  closeBtn: {
    padding: '4px 12px',
    minWidth: 'auto',
  },
  stateSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  stateIcon: {
    width: 60,
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid currentColor',
    borderRadius: '50%',
  },
  stateIconInner: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  stateName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  circularBars: {
    display: 'flex',
    justifyContent: 'space-around',
    gap: 16,
  },
  circularContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularSvg: {
    transform: 'rotate(-90deg)',
  },
  circularProgress: {
    transition: 'stroke-dashoffset 0.5s ease',
  },
  circularText: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  memorySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  memoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillsSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  skillsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    maxHeight: 200,
    overflowY: 'auto',
    paddingRight: 8,
  },
  skillItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  skillInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
  },
  treeSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  treeViz: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: 16,
    borderRadius: 8,
    border: '1px solid rgba(0, 255, 65, 0.2)',
  },
  treeNode: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  treeNodeIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  treeNodeLabel: {
    fontSize: 10,
    letterSpacing: 1,
  },
};
