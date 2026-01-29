import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { questionsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import QuestionCard from '../components/QuestionCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Loader2, ArrowLeft, Filter, X, Building2 } from 'lucide-react';

const getDifficultyColor = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'bg-green-100 text-green-700';
    case 'medium': return 'bg-yellow-100 text-yellow-700';
    case 'hard': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const Company = () => {
  const { companyName } = useParams();
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    difficulty: '',
    timeRange: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
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
      setQuestions(response.data.data || []);
      setTotalQuestions(response.data.pagination?.total || 0);
      setPagination(prev => ({
        ...prev,
        pages: response.data.pagination?.pages || 0
      }));
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
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{decodedCompany}</h1>
              <p className="text-muted-foreground">
                {totalQuestions} interview questions asked at {decodedCompany}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  className="pl-9"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              
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

              <Button variant="outline" onClick={clearFilters}>
                Clear All
              </Button>
            </div>

            {/* Active Filters */}
            {(filters.difficulty || filters.timeRange || filters.search) && (
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {filters.difficulty && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-full text-sm">
                    {filters.difficulty}
                    <button onClick={() => handleFilterChange('difficulty', '')}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.timeRange && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-full text-sm">
                    {filters.timeRange === '30days' ? 'Last 30 Days' : 
                     filters.timeRange === '2months' ? 'Last 2 Months' :
                     filters.timeRange === '6months' ? 'Last 6 Months' : 'Older'}
                    <button onClick={() => handleFilterChange('timeRange', '')}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.search && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-full text-sm">
                    "{filters.search}"
                    <button onClick={() => handleFilterChange('search', '')}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Questions List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No questions found matching your filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <QuestionCard key={question._id} question={question} />
            ))}
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
      </main>
    </div>
  );
};

export default Company;
