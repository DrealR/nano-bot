import React, { useState } from 'react';
import './styles.css';

interface ControlPanelProps {
  onSpawnBot: () => void;
  onReplicateBot: () => void;
  onThemeChange: (theme: string) => void;
  onSpeedChange: (speed: number) => void;
  onCameraPreset: (preset: string) => void;
  currentTheme: string;
  currentSpeed: number;
  canReplicate: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onSpawnBot,
  onReplicateBot,
  onThemeChange,
  onSpeedChange,
  onCameraPreset,
  currentTheme,
  currentSpeed,
  canReplicate,
}) => {
  const [expanded, setExpanded] = useState(true);

  const themes = [
    { name: 'NEON', value: 'neon' },
    { name: 'CYBER', value: 'cyber' },
    { name: 'MATRIX', value: 'matrix' },
    { name: 'SYNTHWAVE', value: 'synthwave' },
  ];

  const speeds = [0.25, 0.5, 1, 2, 4];

  const cameraPresets = [
    { name: 'OVERVIEW', icon: '⊕', value: 'overview' },
    { name: 'FOLLOW', icon: '⊙', value: 'follow' },
    { name: 'ORBIT', icon: '⟲', value: 'orbit' },
    { name: 'FREE', icon: '⊗', value: 'free' },
  ];

  return (
    <div style={styles.container}>
      <div className="panel panel-accent corner-accent" style={styles.panel}>
        {/* Header */}
        <div style={styles.header}>
          <div className="text-accent glow-text" style={styles.title}>
            CONTROL CENTER
          </div>
          <button
            className="btn btn-accent"
            onClick={() => setExpanded(!expanded)}
            style={styles.toggleBtn}
          >
            {expanded ? '−' : '+'}
          </button>
        </div>

        {expanded && (
          <>
            <div className="divider" />

            {/* Primary Actions */}
            <div style={styles.section}>
              <div className="stat-label" style={{ marginBottom: 12 }}>
                PRIMARY ACTIONS
              </div>
              <div style={styles.buttonGrid}>
                <button
                  className="btn btn-primary"
                  onClick={onSpawnBot}
                  style={styles.actionBtn}
                >
                  <div style={styles.btnIcon}>+</div>
                  <div style={styles.btnLabel}>SPAWN BOT</div>
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={onReplicateBot}
                  disabled={!canReplicate}
                  style={styles.actionBtn}
                >
                  <div style={styles.btnIcon}>◈</div>
                  <div style={styles.btnLabel}>
                    {canReplicate ? 'REPLICATE' : 'NO SELECTION'}
                  </div>
                </button>
              </div>
            </div>

            <div className="divider" />

            {/* Speed Control */}
            <div style={styles.section}>
              <div className="stat-label" style={{ marginBottom: 12 }}>
                SIMULATION SPEED
              </div>
              <div style={styles.speedDisplay}>
                <span className="text-primary glow-text" style={{ fontSize: 20 }}>
                  {currentSpeed}x
                </span>
              </div>
              <div style={styles.speedSlider}>
                {speeds.map((speed) => (
                  <button
                    key={speed}
                    className={`btn ${
                      currentSpeed === speed ? 'btn-primary' : 'btn-secondary'
                    }`}
                    onClick={() => onSpeedChange(speed)}
                    style={styles.speedBtn}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            <div className="divider" />

            {/* Theme Selector */}
            <div style={styles.section}>
              <div className="stat-label" style={{ marginBottom: 12 }}>
                VISUAL THEME
              </div>
              <div style={styles.themeGrid}>
                {themes.map((theme) => (
                  <button
                    key={theme.value}
                    className={`btn ${
                      currentTheme === theme.value ? 'btn-accent' : 'btn-secondary'
                    }`}
                    onClick={() => onThemeChange(theme.value)}
                    style={styles.themeBtn}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="divider" />

            {/* Camera Presets */}
            <div style={styles.section}>
              <div className="stat-label" style={{ marginBottom: 12 }}>
                CAMERA PRESETS
              </div>
              <div style={styles.cameraGrid}>
                {cameraPresets.map((preset) => (
                  <button
                    key={preset.value}
                    className="btn btn-primary"
                    onClick={() => onCameraPreset(preset.value)}
                    style={styles.cameraBtn}
                    data-tooltip={preset.name}
                  >
                    <div style={styles.cameraIcon}>{preset.icon}</div>
                    <div style={styles.cameraLabel}>{preset.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="divider" />

            {/* Additional Controls */}
            <div style={styles.section}>
              <div className="stat-label" style={{ marginBottom: 12 }}>
                SYSTEM CONTROLS
              </div>
              <div style={styles.systemGrid}>
                <button className="btn btn-secondary" style={styles.systemBtn}>
                  <span>⟲</span>
                  <span>RESET</span>
                </button>
                <button className="btn btn-secondary" style={styles.systemBtn}>
                  <span>‖</span>
                  <span>PAUSE</span>
                </button>
                <button className="btn btn-accent" style={styles.systemBtn}>
                  <span>✕</span>
                  <span>CLEAR</span>
                </button>
              </div>
            </div>

            {/* Performance Monitor */}
            <div style={styles.perfSection} className="scanline">
              <div style={styles.perfRow}>
                <span className="text-dim" style={{ fontSize: 11 }}>RENDER TIME:</span>
                <span className="text-primary" style={{ fontSize: 11 }}>
                  16.7ms
                </span>
              </div>
              <div style={styles.perfRow}>
                <span className="text-dim" style={{ fontSize: 11 }}>GPU USAGE:</span>
                <span className="text-secondary" style={{ fontSize: 11 }}>
                  42%
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'fixed',
    bottom: 100,
    right: 20,
    width: 320,
    pointerEvents: 'auto',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  toggleBtn: {
    padding: '4px 12px',
    minWidth: 'auto',
    fontSize: 20,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
  },
  buttonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
  },
  actionBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    height: 80,
    justifyContent: 'center',
  },
  btnIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  btnLabel: {
    fontSize: 11,
    letterSpacing: 1,
  },
  speedDisplay: {
    textAlign: 'center',
    padding: 12,
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    marginBottom: 12,
  },
  speedSlider: {
    display: 'flex',
    gap: 8,
  },
  speedBtn: {
    flex: 1,
    padding: '8px 4px',
    fontSize: 11,
  },
  themeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
  },
  themeBtn: {
    padding: '10px 12px',
    fontSize: 11,
  },
  cameraGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
  },
  cameraBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: 12,
  },
  cameraIcon: {
    fontSize: 20,
  },
  cameraLabel: {
    fontSize: 10,
    letterSpacing: 1,
  },
  systemGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
  },
  systemBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    fontSize: 11,
  },
  perfSection: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: 12,
    borderRadius: 8,
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  perfRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
};
