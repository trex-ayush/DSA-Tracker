import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { questionsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import QuestionCard from '../components/QuestionCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Loader2, ArrowLeft, List, ExternalLink } from 'lucide-react';

const getDifficultyColor = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'bg-green-100 text-green-700';
    case 'medium': return 'bg-yellow-100 text-yellow-700';
    case 'hard': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getTimeRangeColor = (askedWithin) => {
  switch (askedWithin) {
    case '30days': return 'bg-green-100 text-green-700';
    case '2months': return 'bg-blue-100 text-blue-700';
    case '6months': return 'bg-yellow-100 text-yellow-700';
    case 'older': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
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
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allQuestions, setAllQuestions] = useState([]);
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

  useEffect(() => {
    fetchAllQuestions();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [filters, pagination.page]);

  const fetchAllQuestions = async () => {
    try {
      const response = await questionsAPI.getAll({ ...filters, limit: 1000 });
      setAllQuestions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching all questions:', error);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await questionsAPI.getAll({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      setQuestions(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 0
      }));
    } catch (error) {
      console.error('Error fetching questions:', error);
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
      company: '',
      timeRange: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const uniqueCompanies = [...new Set(allQuestions.flatMap(q => q.companies?.map(c => c.company) || []))].filter(Boolean).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">All Questions</h1>
            <p className="text-muted-foreground">
              Browse {pagination.total || allQuestions.length} questions with company tags and details
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or topic..."
                  className="pl-9"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              
              <Select
                value={filters.company}
                onValueChange={(value) => handleFilterChange('company', value)}
              >
                <SelectTrigger>
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
                onValueChange={(value) => handleFilterChange('difficulty', value)}
              >
                <SelectTrigger>
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
                onValueChange={(value) => handleFilterChange('timeRange', value)}
              >
                <SelectTrigger>
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
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Clear All
              </Button>
              {(filters.company || filters.difficulty || filters.timeRange || filters.search) && (
                <span className="text-sm text-muted-foreground">
                  Showing {questions.length} of {pagination.total} questions
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Questions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Questions List
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : questions.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No questions found matching your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Title</th>
                      <th className="pb-3 font-medium">Difficulty</th>
                      <th className="pb-3 font-medium">Companies</th>
                      <th className="pb-3 font-medium">Topics</th>
                      <th className="pb-3 font-medium">Recency</th>
                      <th className="pb-3 font-medium">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((question) => (
                      <tr key={question._id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-4">
                          <div>
                            <span className="font-medium text-gray-900">{question.title}</span>
                            {question.trackingStatus && (
                              <span className="ml-2 text-xs">
                                {question.trackingStatus === 'solved' && '✅'}
                                {question.trackingStatus === 'unsolved' && '❌'}
                                {question.trackingStatus === 'revising' && '🔄'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-wrap gap-1">
                            {question.companies?.slice(0, 3).map((comp, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                                {comp.company}
                              </span>
                            ))}
                            {question.companies?.length > 3 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                +{question.companies.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-wrap gap-1">
                            {question.topics?.slice(0, 2).map((topic, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                                {topic}
                              </span>
                            ))}
                            {question.topics?.length > 2 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                +{question.topics.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col gap-1">
                            {question.companies?.slice(0, 2).map((comp, idx) => (
                              <span key={idx} className={`px-2 py-0.5 rounded text-xs ${getTimeRangeColor(comp.askedWithin)}`}>
                                {comp.company}: {formatTimeRange(comp.askedWithin)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4">
                          <a
                            href={question.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                          >
                            <ExternalLink className="h-3 w-3" />
                            LeetCode
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Questions;
