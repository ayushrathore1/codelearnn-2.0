import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faStar,
  faShieldAlt,
  faFire,
} from "@fortawesome/free-solid-svg-icons";
import { getLevelInfo } from "../../services/charchaApi";

const UserStatsBar = ({ user }) => {
  if (!user) return null;

  const levelInfo = getLevelInfo(user.aura || 0);

  return (
    <div className="card-bento p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Level Badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl">
            {levelInfo.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-text-main">
                Level {levelInfo.level}
              </span>
              <span className="text-xs text-text-dim">{levelInfo.name}</span>
            </div>
            {levelInfo.nextLevel && (
              <div className="mt-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-24 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${levelInfo.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-text-dim font-mono">
                    {Math.round(levelInfo.progress)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6">
          {/* AURA */}
          <div className="text-center">
            <div className="flex items-center gap-1.5 text-primary">
              <FontAwesomeIcon icon={faBolt} className="text-sm" />
              <span className="font-bold text-lg">{user.aura || 0}</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-text-dim">
              AURA
            </span>
          </div>

          {/* XP */}
          <div className="text-center">
            <div className="flex items-center gap-1.5 text-secondary">
              <FontAwesomeIcon icon={faStar} className="text-sm" />
              <span className="font-bold text-lg">{user.xp || 0}</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-text-dim">
              XP
            </span>
          </div>

          {/* CRED */}
          <div className="text-center">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <FontAwesomeIcon icon={faShieldAlt} className="text-sm" />
              <span className="font-bold text-lg">
                {(user.cred || 0).toFixed(1)}
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-text-dim">
              CRED
            </span>
          </div>

          {/* Streak */}
          {user.streak > 0 && (
            <div className="text-center">
              <div className="flex items-center gap-1.5 text-orange-400">
                <FontAwesomeIcon icon={faFire} className="text-sm" />
                <span className="font-bold text-lg">{user.streak}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-text-dim">
                Streak
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserStatsBar;
