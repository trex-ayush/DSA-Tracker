import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { questionsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Search, 
  Loader2, 
  ArrowLeft, 
  X, 
  Building2, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
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

const Company = () => {
  const { companyName } = useParams();
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [stats, setStats] = useState({ easy: 0, medium: 0, hard: 0 });
  const [filters, setFilters] = useState({
    search: '',
    difficulty: '',
    timeRange: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    pages: 0
  });

  const decodedCompany = decodeURIComponent(companyName);

  useEffect(() => {
    fetchCompanyQuestions();
  }, [decodedCompany, filters, pagination.page]);

  const fetchCompanyQuestions = async () => {
    setLoading(true);
    try {
      const response = await questionsAPI.getAll({
        company: decodedCompany,
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      const questionsData = response.data.data || [];
      setQuestions(questionsData);
      setTotalQuestions(response.data.pagination?.total || 0);
      setPagination(prev => ({
        ...prev,
        pages: response.data.pagination?.pages || 0
      }));
      
      const newStats = { easy: 0, medium: 0, hard: 0 };
      questionsData.forEach(q => {
        const diff = q.difficulty?.toLowerCase();
        if (diff in newStats) newStats[diff]++;
      });
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching company questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      difficulty: '',
      timeRange: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = filters.difficulty || filters.timeRange || filters.search;

  return (
    <div className="bg-white">
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <Link to="/companies">
          <Button variant="ghost" size="sm" className="mb-6 -ml-2 text-gray-600 hover:text-black">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Companies
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8 pb-8 border-b">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-black mb-1">
                {decodedCompany}
              </h1>
              <p className="text-gray-500">
                {totalQuestions} interview questions
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
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            
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
              Showing {questions.length} of {totalQuestions} questions
            </p>
          )}
        </div>

        {/* Questions Table */}
        <div className="border rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400 mb-3" />
              <p className="text-gray-500 text-sm">Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Search className="h-10 w-10 text-gray-300 mb-4" />
              <p className="font-medium text-gray-900 mb-1">No questions found</p>
              <p className="text-sm text-gray-500">Try adjusting your filters</p>
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  onClick={clearFilters} 
                  className="mt-4"
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
                      const companyData = question.companies?.find(c => c.company === decodedCompany);
                      const otherCompanies = question.companies?.filter(c => c.company !== decodedCompany) || [];
                      
                      return (
                        <tr key={question._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {question.title}
                              </span>
                              {question.trackingStatus === 'solved' && (
                                <span className="text-green-500 text-xs">✓</span>
                              )}
                              {question.trackingStatus === 'revising' && (
                                <span className="text-yellow-500 text-xs">↻</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${getDifficultyStyle(question.difficulty)}`}>
                              {question.difficulty}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1">
                              <span className="px-2 py-0.5 bg-black text-white rounded text-xs font-medium">
                                {decodedCompany}
                              </span>
                              {otherCompanies.slice(0, 2).map((comp, idx) => (
                                <span 
                                  key={idx} 
                                  className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                                >
                                  {comp.company}
                                </span>
                              ))}
                              {otherCompanies.length > 2 && (
                                <span className="px-2 py-0.5 text-gray-400 text-xs">
                                  +{otherCompanies.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`text-xs font-medium ${getTimeRangeStyle(companyData?.askedWithin)}`}>
                              {formatTimeRange(companyData?.askedWithin)}
                            </span>
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
                  const companyData = question.companies?.find(c => c.company === decodedCompany);
                  const otherCompanies = question.companies?.filter(c => c.company !== decodedCompany) || [];
                  
                  return (
                    <div key={question._id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${getDifficultyStyle(question.difficulty)}`}>
                              {question.difficulty}
                            </span>
                            <span className={`text-xs ${getTimeRangeStyle(companyData?.askedWithin)}`}>
                              {formatTimeRange(companyData?.askedWithin)}
                            </span>
                          </div>
                          <h3 className="font-medium text-gray-900 mb-2">
                            {question.title}
                          </h3>
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-0.5 bg-black text-white rounded text-xs font-medium">
                              {decodedCompany}
                            </span>
                            {otherCompanies.slice(0, 2).map((comp, idx) => (
                              <span 
                                key={idx} 
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                              >
                                {comp.company}
                              </span>
                            ))}
                            {otherCompanies.length > 2 && (
                              <span className="text-xs text-gray-400">
                                +{otherCompanies.length - 2}
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

        {/* Pagination */}
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

export default Company;