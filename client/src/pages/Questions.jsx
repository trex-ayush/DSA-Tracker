import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionsAPI, trackingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { debounce } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Search,
  Loader2,
  ArrowLeft,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  List,
  Star,
  CheckCircle,
  Circle,
} from 'lucide-react';

const getDifficultyStyle = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    case 'hard': return 'bg-red-500/10 text-red-600 border-red-500/20';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

const getTimeRangeStyle = (askedWithin) => {
  switch (askedWithin) {
    case '30days': return 'text-green-600';
    case '2months': return 'text-yellow-600';
    case '6months': return 'text-orange-600';
    case 'older': return 'text-gray-500';
    default: return 'text-gray-500';
  }
};

const formatTimeRange = (askedWithin) => {
  switch (askedWithin) {
    case '30days': return 'Last 30 Days';
    case '2months': return 'Last 2 Months';
    case '6months': return 'Last 6 Months';
    case 'older': return 'Older';
    default: return 'Unknown';
  }
};

const Questions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    difficulty: '',
    company: '',
    timeRange: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  // Debounced search - updates filters.search after 300ms of no typing
  const debouncedSearch = useMemo(
    () => debounce((value) => {
      setFilters(prev => ({ ...prev, search: value }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  // Query: Stats
  const { data: statsData } = useQuery({
    queryKey: ['questionsStats'],
    queryFn: () => questionsAPI.getStats(),
    select: (res) => {
      const data = res.data.data;
      return {
        easy: data.byDifficulty?.Easy || 0,
        medium: data.byDifficulty?.Medium || 0,
        hard: data.byDifficulty?.Hard || 0
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const stats = statsData || { easy: 0, medium: 0, hard: 0 };

  // Query: Questions
  const { data: questionsData, isLoading: loading } = useQuery({
    queryKey: ['questions', filters, pagination.page],
    queryFn: () => questionsAPI.getAll({
      ...filters,
      page: pagination.page,
      limit: pagination.limit
    }),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const questions = questionsData?.data?.data || [];

  // Update pagination total when questions data arrives
  useEffect(() => {
    if (questionsData?.data?.pagination) {
      setPagination(prev => ({
        ...prev,
        total: questionsData.data.pagination.total || 0,
        pages: questionsData.data.pagination.pages || 0
      }));
    }
  }, [questionsData]);

  // Query: User Tracking
  const { data: trackingData } = useQuery({
    queryKey: ['userTracking', user?._id],
    queryFn: () => trackingAPI.getAll({ limit: 1000 }),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const trackingMap = useMemo(() => {
    const map = {};
    if (trackingData?.data?.data) {
      trackingData.data.data.forEach(t => {
        if (t.question) {
          map[t.question._id] = {
            isSolved: t.isSolved,
            isRevise: t.isRevise
          };
        }
      });
    }
    return map;
  }, [trackingData]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      difficulty: '',
      company: '',
      timeRange: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Helper to optimistically update cache
  const updateTrackingCache = (questionId, updates) => {
    queryClient.setQueryData(['userTracking', user?._id], (oldData) => {
      if (!oldData?.data?.data) return oldData;

      const newData = { ...oldData };
      const trackingList = [...newData.data.data];
      const index = trackingList.findIndex(t => t.question?._id === questionId);

      if (index !== -1) {
        trackingList[index] = { ...trackingList[index], ...updates };
      } else {
        trackingList.push({
          question: { _id: questionId },
          ...updates
        });
      }

      newData.data.data = trackingList;
      return newData;
    });
  };

  const handleSolvedToggle = async (questionId) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    const currentTracking = trackingMap[questionId] || { isSolved: false, isRevise: false };
    const newIsSolved = !currentTracking.isSolved;

    // Optimistic Update
    updateTrackingCache(questionId, { isSolved: newIsSolved });

    try {
      await trackingAPI.create(questionId, { isSolved: newIsSolved });
      // Invalidate to ensure consistency eventually
      queryClient.invalidateQueries(['userTracking']);
      queryClient.invalidateQueries(['reviseTracking']);
    } catch (error) {
      console.error('Error updating solved status:', error);
      // Revert/Refetch
      queryClient.invalidateQueries(['userTracking']);
      queryClient.invalidateQueries(['reviseTracking']);
    }
  };

  const handleReviseToggle = async (questionId) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    const currentTracking = trackingMap[questionId] || { isSolved: false, isRevise: false };
    const newIsRevise = !currentTracking.isRevise;

    // Optimistic Update
    updateTrackingCache(questionId, { isRevise: newIsRevise });

    try {
      await trackingAPI.create(questionId, { isRevise: newIsRevise });
      queryClient.invalidateQueries(['userTracking']);
      queryClient.invalidateQueries(['reviseTracking']);
    } catch (error) {
      console.error('Error updating revise status:', error);
      queryClient.invalidateQueries(['userTracking']);
      queryClient.invalidateQueries(['reviseTracking']);
    }
  };

  // Get companies from current questions (or use the ones shown in filters)
  const uniqueCompanies = [...new Set(questions.flatMap(q => q.companies?.map(c => c.company) || []))].filter(Boolean).sort();
  const hasActiveFilters = filters.difficulty || filters.timeRange || searchInput || filters.company;

  return (
    <div className="bg-white">

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6 -ml-2 text-gray-600 hover:text-black">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8 pb-8 border-b">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
              <List className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-black mb-1">
                All Questions
              </h1>
              <p className="text-gray-500">
                Browse {pagination.total} interview questions
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex gap-6 mt-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-black">{stats.easy}</span> Easy
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-black">{stats.medium}</span> Medium
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-black">{stats.hard}</span> Hard
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search questions..."
                className="pl-10 border-gray-200 focus:border-black focus:ring-black"
                value={searchInput}
                onChange={handleSearchChange}
              />
            </div>

            <Select
              value={filters.company}
              onValueChange={(value) => handleFilterChange('company', value === 'all' ? '' : value)}
            >
              <SelectTrigger className="w-full sm:w-[180px] border-gray-200">
                <SelectValue placeholder="Company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {uniqueCompanies.map(company => (
                  <SelectItem key={company} value={company}>{company}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.difficulty}
              onValueChange={(value) => handleFilterChange('difficulty', value === 'all' ? '' : value)}
            >
              <SelectTrigger className="w-full sm:w-[150px] border-gray-200">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.timeRange}
              onValueChange={(value) => handleFilterChange('timeRange', value === 'all' ? '' : value)}
            >
              <SelectTrigger className="w-full sm:w-[150px] border-gray-200">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="2months">Last 2 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="older">Older</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="border-gray-200"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {hasActiveFilters && (
            <p className="text-sm text-gray-500 mt-3">
              Showing {pagination.total} questions
            </p>
          )}
        </div>

        {/* Questions Table */}
        <div className="border rounded-lg overflow-hidden">
          {loading && !questions.length ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400 mb-3" />
              <p className="text-gray-500 text-sm">Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Search className="h-10 w-10 text-gray-300 mb-4" />
              <p className="font-medium text-gray-900 mb-1">
                No questions found
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Try adjusting your search or filters
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  size="sm"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        Revise
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                        Difficulty
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Companies
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Asked
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        Link
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {questions.map((question) => {
                      const trackingData = trackingMap[question._id] || { isSolved: false, isRevise: false };

                      return (
                        <tr key={question._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => handleSolvedToggle(question._id)}
                              className={`p-1 rounded-md transition-colors ${trackingData.isSolved
                                ? 'text-green-500 hover:text-green-600'
                                : 'text-gray-300 hover:text-gray-400'
                                }`}
                              title="Mark as solved"
                            >
                              {trackingData.isSolved ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : (
                                <Circle className="h-5 w-5" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => handleReviseToggle(question._id)}
                              className={`p-1 rounded-md transition-colors ${trackingData.isRevise
                                ? 'text-yellow-500 hover:text-yellow-600'
                                : 'text-gray-300 hover:text-gray-400'
                                }`}
                              title="Mark for revision"
                            >
                              <Star className="h-5 w-5" fill={trackingData.isRevise ? 'currentColor' : 'none'} />
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-medium text-gray-900">
                              {question.title}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${getDifficultyStyle(question.difficulty)}`}>
                              {question.difficulty}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1">
                              {question.companies?.slice(0, 3).map((comp, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                                >
                                  {comp.company}
                                </span>
                              ))}
                              {question.companies?.length > 3 && (
                                <span className="px-2 py-0.5 text-gray-400 text-xs">
                                  +{question.companies.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              {question.companies?.slice(0, 2).map((comp, idx) => (
                                <span key={idx} className={`text-xs font-medium ${getTimeRangeStyle(comp.askedWithin)}`}>
                                  {comp.company}: {formatTimeRange(comp.askedWithin)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <a
                              href={question.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 text-gray-600 hover:text-black transition-colors"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile List */}
              <div className="md:hidden divide-y">
                {questions.map((question) => {
                  const trackingData = trackingMap[question._id] || { isSolved: false, isRevise: false };

                  return (
                    <div key={question._id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <button
                              onClick={() => handleSolvedToggle(question._id)}
                              className={`p-1 rounded-md transition-colors ${trackingData.isSolved
                                ? 'text-green-500'
                                : 'text-gray-300'
                                }`}
                            >
                              {trackingData.isSolved ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <Circle className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleReviseToggle(question._id)}
                              className={`p-1 rounded-md transition-colors ${trackingData.isRevise
                                ? 'text-yellow-500'
                                : 'text-gray-300'
                                }`}
                            >
                              <Star className="h-4 w-4" fill={trackingData.isRevise ? 'currentColor' : 'none'} />
                            </button>
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${getDifficultyStyle(question.difficulty)}`}>
                              {question.difficulty}
                            </span>
                          </div>
                          <h3 className="font-medium text-gray-900 mb-2">
                            {question.title}
                          </h3>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {question.companies?.slice(0, 3).map((comp, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                              >
                                {comp.company}
                              </span>
                            ))}
                            {question.companies?.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{question.companies.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                        <a
                          href={question.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-md text-gray-600"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Pagination - only show if there are pages */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="border-gray-200"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="border-gray-200"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Questions;
