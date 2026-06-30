import React, { useState, useEffect, useMemo } from 'react';
import './styles.css';

interface HUDProps {
  swarmCount: number;
  totalEnergy: number;
  activeTasks: number;
  fps?: number;
  timestamp?: number;
  formation?: string;
  isPaused?: boolean;
  score?: number;
  wave?: number;
  enemyCount?: number;
  resourceCount?: number;
  baseHealth?: number;
  maxBaseHealth?: number;
  comboMultiplier?: number;
  waveEnemiesRemaining?: number;
  waveCountdown?: number;
  nmsStyle?: boolean;
}

// Keyboard shortcuts info
const SHORTCUTS = [
  { key: 'SPACE', action: 'Pause/Resume' },
  { key: 'R', action: 'Replicate Bot' },
  { key: '+/-', action: 'Speed Control' },
  { key: 'G', action: 'Toggle Grid' },
  { key: 'F', action: 'Toggle Fog' },
  { key: 'P', action: 'Toggle Particles' },
  { key: 'C', action: 'Toggle Connections' },
  { key: '1-7', action: 'Formation Patterns' },
];

const FORMATIONS = [
  { key: '1', name: 'Free' },
  { key: '2', name: 'Circle' },
  { key: '3', name: 'Spiral' },
  { key: '4', name: 'DNA Helix' },
  { key: '5', name: 'Sphere' },
  { key: '6', name: 'Vortex' },
  { key: '7', name: 'Grid' },
];

export const HUD: React.FC<HUDProps> = ({
  swarmCount,
  totalEnergy,
  activeTasks,
  fps = 60,
  timestamp = Date.now(),
  formation = 'free',
  isPaused = false,
  score = 0,
  wave = 1,
  enemyCount = 0,
  resourceCount = 0,
  baseHealth = 1000,
  maxBaseHealth = 1000,
  comboMultiplier = 1,
  waveEnemiesRemaining = 0,
  waveCountdown = 0,
  nmsStyle = true,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [currentFormation, setCurrentFormation] = useState(formation);
  const [animatedEnergy, setAnimatedEnergy] = useState(totalEnergy);

  // Smooth energy animation
  useEffect(() => {
    const diff = totalEnergy - animatedEnergy;
    if (Math.abs(diff) > 1) {
      const timer = setTimeout(() => {
        setAnimatedEnergy(animatedEnergy + diff * 0.1);
      }, 16);
      return () => clearTimeout(timer);
    }
  }, [totalEnergy, animatedEnergy]);

  // Listen for formation changes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setShowHelp(prev => !prev);
      }
      const num = parseInt(e.key);
      if (num >= 1 && num <= 7) {
        setCurrentFormation(FORMATIONS[num - 1].name.toLowerCase().replace(' ', '-'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const formatEnergy = (energy: number): string => {
    if (energy >= 1000000) return `${(energy / 1000000).toFixed(2)}M`;
    if (energy >= 1000) return `${(energy / 1000).toFixed(2)}K`;
    return energy.toFixed(0);
  };

  const formatTime = (ts: number): string => {
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  const getSwarmStatus = () => {
    if (swarmCount === 0) return { text: 'NO BOTS', color: 'var(--color-accent)' };
    if (swarmCount < 5) return { text: 'NASCENT', color: 'var(--color-secondary)' };
    if (swarmCount < 15) return { text: 'GROWING', color: 'var(--color-primary)' };
    if (swarmCount < 30) return { text: 'THRIVING', color: '#51cf66' };
    return { text: 'SWARMING', color: '#fcc419' };
  };

  const status = getSwarmStatus();

  // Generate random planet name for NMS style
  const planetName = useMemo(() => {
    const prefixes = ['Eos', 'Zeta', 'Nova', 'Helix', 'Omega', 'Lyra', 'Vega', 'Orion'];
    const suffixes = ['Prime', 'Minor', 'IV', 'Sigma', 'Alpha', 'Beta', 'Tau'];
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]}-${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
  }, []);

  const [discoveryAnim, setDiscoveryAnim] = useState(false);

  // Trigger discovery animation periodically
  useEffect(() => {
    if (nmsStyle) {
      const interval = setInterval(() => {
        setDiscoveryAnim(true);
        setTimeout(() => setDiscoveryAnim(false), 2000);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [nmsStyle]);

  return (
    <div className="hud-container">
      {/* NMS-style Discovery Banner */}
      {nmsStyle && discoveryAnim && (
        <div style={nmsStyles.discoveryBanner}>
          <div style={nmsStyles.discoveryIcon}>◈</div>
          <div style={nmsStyles.discoveryText}>
            <span style={nmsStyles.discoveryLabel}>DISCOVERY UPLOADED</span>
            <span style={nmsStyles.discoveryName}>New Species Catalogued</span>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div style={styles.topBar}>
        <div className="panel corner-accent" style={nmsStyle ? nmsStyles.topPanel : styles.topPanel}>
          <div style={styles.logoSection}>
            <div className="text-primary glow-text" style={nmsStyle ? nmsStyles.logo : styles.logo}>
              {nmsStyle ? (
                <>
                  <span style={nmsStyles.planetIcon}>◉</span> {planetName}
                </>
              ) : (
                <>NANO<span className="text-accent">BOT</span></>
              )}
            </div>
            <div style={nmsStyle ? nmsStyles.subtitle : styles.subtitle}>
              {nmsStyle ? 'ALIEN WORLD • EXOTIC BIOME' : 'SWARM INTELLIGENCE v2.0'}
            </div>
          </div>

          <div style={styles.dividerVertical} />

          <div style={styles.statsGrid}>
            <div className="stat">
              <div className="stat-label">SWARM SIZE</div>
              <div className="stat-value text-primary" style={{ fontSize: 28 }}>{swarmCount}</div>
              <div style={{ fontSize: 10, color: status.color }}>{status.text}</div>
            </div>

            <div style={styles.dividerVertical} />

            <div className="stat">
              <div className="stat-label">TOTAL ENERGY</div>
              <div className="stat-value text-secondary">
                {formatEnergy(animatedEnergy)}
              </div>
              {/* Energy bar */}
              <div style={styles.energyBarContainer}>
                <div
                  style={{
                    ...styles.energyBar,
                    width: `${Math.min(100, (animatedEnergy / (swarmCount * 1000 || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div style={styles.dividerVertical} />

            <div className="stat">
              <div className="stat-label">FORMATION</div>
              <div className="stat-value text-accent" style={{ textTransform: 'uppercase' }}>
                {currentFormation.replace('-', ' ')}
              </div>
            </div>

            <div style={styles.dividerVertical} />

            <div className="stat">
              <div className="stat-label">ACTIVE TASKS</div>
              <div className="stat-value" style={{ color: activeTasks > 0 ? '#51cf66' : 'var(--color-text-dim)' }}>
                {activeTasks}
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="panel panel-secondary" style={styles.statusPanel}>
          <div style={styles.statusRow}>
            <div style={styles.statusIndicator}>
              <div className={isPaused ? '' : 'pulse'} style={{
                ...styles.statusDot,
                background: isPaused ? 'var(--color-accent)' : 'var(--color-primary)',
                boxShadow: isPaused ? 'var(--glow-accent)' : 'var(--glow-primary)',
              }} />
              <span style={{ color: isPaused ? 'var(--color-accent)' : 'var(--color-primary)' }}>
                {isPaused ? 'PAUSED' : 'ONLINE'}
              </span>
            </div>

            <div style={styles.statusInfo}>
              <span className="text-dim" style={styles.smallText}>FPS</span>
              <span className="text-secondary" style={{
                ...styles.statusValue,
                color: fps < 30 ? 'var(--color-accent)' : fps < 50 ? 'var(--color-secondary)' : 'var(--color-primary)',
              }}>
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

      {/* Right Panel - Gameplay Stats */}
      <div style={styles.rightPanel}>
        {/* BASE HEALTH - Critical! */}
        <div className="panel" style={{
          ...styles.gameplayPanel,
          borderColor: baseHealth < maxBaseHealth * 0.3 ? '#ff3366' : 'var(--color-border)',
          boxShadow: baseHealth < maxBaseHealth * 0.3 ? '0 0 20px rgba(255, 51, 102, 0.5)' : 'none',
        }}>
          <div style={styles.baseHealthDisplay}>
            <span style={styles.baseHealthLabel}>BASE HEALTH</span>
            <div style={styles.baseHealthBarContainer}>
              <div
                style={{
                  ...styles.baseHealthBar,
                  width: `${(baseHealth / maxBaseHealth) * 100}%`,
                  background: baseHealth < maxBaseHealth * 0.3
                    ? 'linear-gradient(90deg, #ff3366, #ff6b6b)'
                    : baseHealth < maxBaseHealth * 0.6
                    ? 'linear-gradient(90deg, #fcc419, #ffe066)'
                    : 'linear-gradient(90deg, #51cf66, #8ce99a)',
                }}
              />
            </div>
            <span style={{
              ...styles.baseHealthNumber,
              color: baseHealth < maxBaseHealth * 0.3 ? '#ff3366' : '#51cf66',
            }}>
              {Math.floor(baseHealth)} / {maxBaseHealth}
            </span>
          </div>
        </div>

        {/* Wave & Score */}
        <div className="panel" style={{ ...styles.gameplayPanel, marginTop: 10 }}>
          <div style={styles.waveDisplay}>
            <span style={styles.waveLabel}>WAVE</span>
            <span style={styles.waveNumber}>{wave}</span>
            {waveEnemiesRemaining > 0 && (
              <div style={styles.waveProgress}>
                <span style={styles.waveProgressLabel}>{waveEnemiesRemaining} REMAINING</span>
              </div>
            )}
            {waveEnemiesRemaining === 0 && waveCountdown > 0 && (
              <div style={styles.waveProgress}>
                <span style={styles.waveCountdownLabel}>NEXT: {Math.ceil(waveCountdown / 1000)}s</span>
              </div>
            )}
          </div>
          <div style={styles.scoreDisplay}>
            <span style={styles.scoreLabel}>SCORE</span>
            <span style={styles.scoreNumber}>{score.toLocaleString()}</span>
          </div>
          {comboMultiplier > 1 && (
            <div style={styles.comboDisplay}>
              <span style={styles.comboText}>COMBO x{comboMultiplier}</span>
            </div>
          )}
        </div>

        {/* Combat Stats */}
        <div className="panel" style={{ ...styles.gameplayPanel, marginTop: 10 }}>
          <div style={styles.combatRow}>
            <div style={styles.combatStat}>
              <div style={styles.combatIcon}>⚔️</div>
              <div style={styles.combatInfo}>
                <span style={styles.combatLabel}>ENEMIES</span>
                <span style={{ ...styles.combatValue, color: enemyCount > 0 ? '#ff3366' : 'var(--color-text-dim)' }}>
                  {enemyCount}
                </span>
              </div>
            </div>
            <div style={styles.combatStat}>
              <div style={styles.combatIcon}>💎</div>
              <div style={styles.combatInfo}>
                <span style={styles.combatLabel}>RESOURCES</span>
                <span style={{ ...styles.combatValue, color: resourceCount > 0 ? '#51cf66' : 'var(--color-text-dim)' }}>
                  {resourceCount}
                </span>
              </div>
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
              <span className={swarmCount > 10 ? 'text-accent pulse' : 'text-dim'}>
                {swarmCount > 10 ? 'SYNCED' : 'DORMANT'}
              </span>
            </div>

            <div style={styles.quickStat}>
              <span className="text-dim">CLICK TO SPAWN</span>
              <span className="text-primary">|</span>
              <span className="text-dim">H: HELP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Help Overlay */}
      {showHelp && (
        <div style={styles.helpOverlay} onClick={() => setShowHelp(false)}>
          <div className="panel" style={styles.helpPanel} onClick={e => e.stopPropagation()}>
            <div style={styles.helpTitle}>KEYBOARD CONTROLS</div>
            <div style={styles.helpGrid}>
              {SHORTCUTS.map((s, i) => (
                <div key={i} style={styles.helpRow}>
                  <span style={styles.helpKey}>{s.key}</span>
                  <span style={styles.helpAction}>{s.action}</span>
                </div>
              ))}
            </div>
            <div style={styles.helpFooter}>
              Click anywhere or press H to close
            </div>
          </div>
        </div>
      )}

      {/* Corner Decorations */}
      <div style={styles.cornerTL} className="text-primary">{'['}</div>
      <div style={styles.cornerTR} className="text-secondary">{']'}</div>
      <div style={styles.cornerBL} className="text-accent">{'<'}</div>
      <div style={styles.cornerBR} className="text-primary">{'>'}</div>

      {/* Animated scan line */}
      <div style={styles.scanLine} />
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
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 6,
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 3,
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
  energyBarContainer: {
    width: 80,
    height: 4,
    background: 'rgba(0, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  energyBar: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--color-secondary), var(--color-primary))',
    borderRadius: 2,
    transition: 'width 0.3s ease',
    boxShadow: '0 0 8px var(--color-primary)',
  },
  statusPanel: {
    minWidth: 280,
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
  rightPanel: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 160,
  },
  gameplayPanel: {
    padding: 12,
    textAlign: 'center',
  },
  waveDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottom: '1px solid var(--color-border)',
  },
  waveLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: 'var(--color-text-dim)',
  },
  waveNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ff3366',
    textShadow: '0 0 15px rgba(255, 51, 102, 0.5)',
    lineHeight: 1,
  },
  waveProgress: {
    marginTop: 6,
    padding: '3px 8px',
    background: 'rgba(255, 51, 102, 0.1)',
    borderRadius: 4,
    border: '1px solid rgba(255, 51, 102, 0.3)',
  },
  waveProgressLabel: {
    fontSize: 10,
    letterSpacing: 1,
    color: '#ff3366',
    fontWeight: 'bold',
  },
  waveCountdownLabel: {
    fontSize: 10,
    letterSpacing: 1,
    color: '#51cf66',
    fontWeight: 'bold',
  },
  scoreDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: 'var(--color-text-dim)',
  },
  scoreNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fcc419',
    textShadow: '0 0 10px rgba(252, 196, 25, 0.4)',
  },
  comboDisplay: {
    marginTop: 8,
    padding: '4px 8px',
    background: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 4,
    border: '1px solid #fcc419',
  },
  comboText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fcc419',
    textShadow: '0 0 10px rgba(252, 196, 25, 0.6)',
    animation: 'pulse 0.5s ease-in-out infinite',
  },
  baseHealthDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  baseHealthLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: 'var(--color-text-dim)',
  },
  baseHealthBarContainer: {
    width: '100%',
    height: 12,
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  baseHealthBar: {
    height: '100%',
    borderRadius: 6,
    transition: 'width 0.3s ease, background 0.3s ease',
    boxShadow: '0 0 10px currentColor',
  },
  baseHealthNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  combatRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  combatStat: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  combatIcon: {
    fontSize: 18,
  },
  combatInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  combatLabel: {
    fontSize: 9,
    letterSpacing: 1,
    color: 'var(--color-text-dim)',
  },
  combatValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  formationPanel: {
    padding: 12,
  },
  formationTitle: {
    fontSize: 10,
    letterSpacing: 2,
    color: 'var(--color-text-dim)',
    marginBottom: 10,
    textAlign: 'center',
  },
  formationGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  formationButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    border: '1px solid var(--color-border)',
    borderRadius: 4,
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  formationKey: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'var(--color-primary)',
    width: 16,
  },
  formationName: {
    fontSize: 11,
    color: 'var(--color-text)',
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    maxWidth: 900,
  },
  quickStats: {
    display: 'flex',
    gap: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStat: {
    display: 'flex',
    gap: 8,
    fontSize: 13,
    alignItems: 'center',
  },
  helpOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  helpPanel: {
    padding: 30,
    minWidth: 350,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'var(--color-primary)',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 3,
  },
  helpGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  helpRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid var(--color-border)',
  },
  helpKey: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'var(--color-accent)',
    background: 'rgba(255, 0, 102, 0.1)',
    padding: '4px 10px',
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  helpAction: {
    fontSize: 13,
    color: 'var(--color-text)',
  },
  helpFooter: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 11,
    color: 'var(--color-text-dim)',
  },
  cornerTL: {
    position: 'absolute',
    top: 10,
    left: 10,
    fontSize: 28,
    fontWeight: 'bold',
    textShadow: 'var(--glow-primary)',
  },
  cornerTR: {
    position: 'absolute',
    top: 10,
    right: 10,
    fontSize: 28,
    fontWeight: 'bold',
    textShadow: 'var(--glow-secondary)',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    fontSize: 28,
    fontWeight: 'bold',
    textShadow: 'var(--glow-accent)',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    fontSize: 28,
    fontWeight: 'bold',
    textShadow: 'var(--glow-primary)',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)',
    opacity: 0.3,
    animation: 'scanline 4s linear infinite',
    pointerEvents: 'none',
  },
};

// NMS-specific styles
const nmsStyles: { [key: string]: React.CSSProperties } = {
  topPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    background: 'linear-gradient(135deg, rgba(255, 100, 150, 0.1), rgba(50, 200, 200, 0.05))',
    border: '1px solid rgba(255, 150, 200, 0.3)',
    borderRadius: 4,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 3,
    color: '#ff9ecd',
    textShadow: '0 0 20px rgba(255, 150, 200, 0.5)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  planetIcon: {
    fontSize: 28,
    color: '#7fdbff',
    textShadow: '0 0 15px rgba(127, 219, 255, 0.8)',
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 4,
    color: '#7fdbff',
    textTransform: 'uppercase',
  },
  discoveryBanner: {
    position: 'fixed',
    top: '15%',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 15,
    padding: '15px 30px',
    background: 'linear-gradient(90deg, transparent, rgba(127, 219, 255, 0.2), transparent)',
    borderTop: '2px solid rgba(127, 219, 255, 0.5)',
    borderBottom: '2px solid rgba(127, 219, 255, 0.5)',
    animation: 'fadeInOut 2s ease-in-out',
    zIndex: 1000,
  },
  discoveryIcon: {
    fontSize: 32,
    color: '#7fdbff',
    textShadow: '0 0 20px rgba(127, 219, 255, 0.8)',
    animation: 'pulse 1s ease-in-out infinite',
  },
  discoveryText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  discoveryLabel: {
    fontSize: 12,
    letterSpacing: 3,
    color: '#7fdbff',
    textTransform: 'uppercase',
  },
  discoveryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
  },
};
