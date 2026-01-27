import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faBolt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { charchaAuthAPI, getLevelInfo } from '../../services/charchaApi';

const LeaderboardPanel = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await charchaAuthAPI.getLeaderboard('aura', 10);
        setLeaders(response.data.leaderboard || []);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankStyle = (rank) => {
    switch(rank) {
      case 1: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 2: return 'text-gray-300 bg-gray-400/10 border-gray-400/30';
      case 3: return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      default: return 'text-text-dim bg-bg-elevated border-border';
    }
  };

  return (
    <div className="card-bento p-4">
      <div className="flex items-center gap-2 mb-4">
        <FontAwesomeIcon icon={faTrophy} className="text-yellow-400" />
        <h3 className="font-heading font-semibold text-text-main">Top Contributors</h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <FontAwesomeIcon icon={faSpinner} className="text-primary animate-spin" />
        </div>
      ) : leaders.length === 0 ? (
        <p className="text-text-muted text-sm text-center py-4">No data yet</p>
      ) : (
        <div className="space-y-2">
          {leaders.map((user, index) => {
            const levelInfo = getLevelInfo(user.aura || 0);
            const rank = user.rank || index + 1;
            
            return (
              <Link
                key={user._id || user.username}
                to={`/charcha/user/${user.username}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-elevated transition-colors group"
              >
                {/* Rank Badge */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border ${getRankStyle(rank)}`}>
                  {rank}
                </div>

                {/* Avatar */}
                <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center text-sm">
                  {levelInfo.icon}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-text-main group-hover:text-primary transition-colors truncate">
                      {user.username}
                    </span>
                    <span className="text-[10px] text-text-dim">Lv.{user.level || levelInfo.level}</span>
                  </div>
                </div>

                {/* AURA */}
                <div className="flex items-center gap-1 text-primary">
                  <FontAwesomeIcon icon={faBolt} className="text-xs" />
                  <span className="text-sm font-bold">{user.aura || 0}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Link 
        to="/charcha/leaderboard"
        className="block text-center text-sm text-text-muted hover:text-primary mt-4 pt-3 border-t border-border transition-colors"
      >
        View Full Leaderboard →
      </Link>
    </div>
  );
};

export default LeaderboardPanel;
