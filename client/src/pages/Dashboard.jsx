import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { trackingAPI } from '../services/api';
import { Loader2, CheckCircle, Circle, RotateCcw, ExternalLink, TrendingUp, Target, Award } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentlySolved, setRecentlySolved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await trackingAPI.getStats();
      setStats(response.data.data);
      setRecentlySolved(response.data.data.recentlySolved || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      Easy: 'text-green-600 bg-green-50 border-green-200',
      Medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      Hard: 'text-red-600 bg-red-50 border-red-200',
    };
    return colors[difficulty] || 'text-neutral-600 bg-neutral-50 border-neutral-200';
  };

  const getDifficultyBarColor = (difficulty) => {
    const colors = {
      Easy: 'bg-green-500',
      Medium: 'bg-yellow-500',
      Hard: 'bg-red-500',
    };
    return colors[difficulty] || 'bg-neutral-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-black" />
        </div>
      </div>
    );
  }

  const totalSolved = stats?.solved || 0;
  const totalUnsolved = stats?.unsolved || 0;
  const totalRevisiting = stats?.revisiting || 0;
  const totalTracked = stats?.total || 0;
  const progressPercentage = totalTracked > 0 ? Math.round((totalSolved / totalTracked) * 100) : 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Dashboard</h1>
          <p className="text-neutral-500">Track your DSA preparation progress</p>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-black text-white rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="h-5 w-5 text-neutral-400" />
              <span className="text-xs text-neutral-400 uppercase tracking-wide">Progress</span>
            </div>
            <div className="text-4xl font-bold mb-1">{progressPercentage}%</div>
            <div className="text-sm text-neutral-400">{totalSolved} of {totalTracked} done</div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-xs text-neutral-400 uppercase tracking-wide">Solved</span>
            </div>
            <div className="text-4xl font-bold text-black mb-1">{totalSolved}</div>
            <div className="text-sm text-green-600">Completed</div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Circle className="h-5 w-5 text-yellow-500" />
              <span className="text-xs text-neutral-400 uppercase tracking-wide">Unsolved</span>
            </div>
            <div className="text-4xl font-bold text-black mb-1">{totalUnsolved}</div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <RotateCcw className="h-5 w-5 text-blue-500" />
              <span className="text-xs text-neutral-400 uppercase tracking-wide">Revisit</span>
            </div>
            <div className="text-4xl font-bold text-black mb-1">{totalRevisiting}</div>
            <div className="text-sm text-blue-600">To Review</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black">Overall Progress</h2>
            <span className="text-sm text-neutral-500">{totalSolved}/{totalTracked} questions</span>
          </div>
          <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-black rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Difficulty Breakdown */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-black" />
              <h2 className="text-lg font-semibold text-black">By Difficulty</h2>
            </div>
            <div className="space-y-5">
              {['Easy', 'Medium', 'Hard'].map((difficulty) => {
                const difficultyData = stats?.byDifficulty?.[difficulty] || { total: 0, solved: 0 };
                const percentage = difficultyData.total > 0 
                  ? Math.round((difficultyData.solved / difficultyData.total) * 100) 
                  : 0;
                
                return (
                  <div key={difficulty}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${getDifficultyColor(difficulty)}`}>
                          {difficulty}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-black">
                        {difficultyData.solved}/{difficultyData.total}
                        <span className="text-neutral-400 ml-2">({percentage}%)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${getDifficultyBarColor(difficulty)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Company Progress */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Award className="h-5 w-5 text-black" />
              <h2 className="text-lg font-semibold text-black">By Company</h2>
            </div>
            <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
              {Object.entries(stats?.byCompany || {})
                .sort(([,a], [,b]) => b.solved - a.solved)
                .map(([company, data]) => {
                  const percentage = data.total > 0 
                    ? Math.round((data.solved / data.total) * 100) 
                    : 0;
                  
                  return (
                    <div key={company} className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-black group-hover:underline cursor-pointer">
                          {company}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-neutral-500">
                            {data.solved}/{data.total}
                          </span>
                          <span className="text-xs font-medium text-black w-10 text-right">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              {Object.keys(stats?.byCompany || {}).length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="h-6 w-6 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500 text-sm">
                    Start tracking questions to see company progress
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recently Solved */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-black">Recently Solved</h2>
            {recentlySolved.length > 0 && (
              <Link to="/questions" className="text-sm text-neutral-500 hover:text-black transition-colors">
                View all →
              </Link>
            )}
          </div>

          {recentlySolved.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-neutral-400" />
              </div>
              <p className="text-neutral-500 mb-4">You haven't solved any questions yet</p>
              <Link to="/">
                <button className="px-6 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors">
                  Browse Questions
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentlySolved.map((tracking, index) => (
                <div 
                  key={tracking._id}
                  className="group flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 rounded-xl transition-all cursor-pointer"
                  onClick={() => window.location.href = `/questions/${tracking.question?._id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium text-black group-hover:underline">
                        {tracking.question?.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${getDifficultyColor(tracking.question?.difficulty)}`}>
                          {tracking.question?.difficulty}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {new Date(tracking.solvedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={tracking.question?.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-500 hover:text-black hover:bg-white rounded-lg transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="hidden sm:inline">LeetCode</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/questions" className="block">
            <div className="bg-white border border-neutral-200 hover:border-black rounded-2xl p-6 transition-all group">
              <h3 className="font-semibold text-black mb-1 group-hover:underline">All Questions</h3>
              <p className="text-sm text-neutral-500">Browse and filter all DSA questions</p>
            </div>
          </Link>
          <Link to="/companies" className="block">
            <div className="bg-white border border-neutral-200 hover:border-black rounded-2xl p-6 transition-all group">
              <h3 className="font-semibold text-black mb-1 group-hover:underline">Companies</h3>
              <p className="text-sm text-neutral-500">View questions by company</p>
            </div>
          </Link>
          <Link to="/" className="block">
            <div className="bg-black text-white rounded-2xl p-6 transition-all hover:bg-neutral-800">
              <h3 className="font-semibold mb-1">Start Practicing</h3>
              <p className="text-sm text-neutral-400">Continue your preparation</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;