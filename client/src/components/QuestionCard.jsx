import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ExternalLink, CheckCircle, Circle, RotateCcw, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { trackingAPI } from '../services/api';

const difficultyColors = {
  Easy: 'success',
  Medium: 'warning',
  Hard: 'destructive',
};

const QuestionCard = ({ question, onUpdate }) => {
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (status) => {
    if (!user) return;
    setUpdating(true);
    try {
      await trackingAPI.create(question._id, { status });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getTimeLabel = (askedWithin) => {
    const labels = {
      '30days': 'Last 30 days',
      '2months': 'Last 2 months',
      '6months': 'Last 6 months',
      'older': 'Older',
    };
    return labels[askedWithin] || '';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">
              <a 
                href={question.link}
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                {question.title}
              </a>
            </CardTitle>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant={difficultyColors[question.difficulty]}>
                {question.difficulty}
              </Badge>
              {question.topics?.slice(0, 3).map((topic, index) => (
                <Badge key={index} variant="secondary">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button
                  variant={question.trackingStatus === 'solved' ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleStatusUpdate('solved')}
                  disabled={updating}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant={question.trackingStatus === 'revisiting' ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleStatusUpdate('revisiting')}
                  disabled={updating}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant={question.trackingStatus === 'unsolved' ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleStatusUpdate('unsolved')}
                  disabled={updating}
                >
                  <Circle className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>Login to track</span>
              </div>
            )}
            <Button variant="outline" size="sm" asChild>
              <a href={question.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Solve
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Acceptance: {question.acceptanceRate}%</span>
          {question.companies && question.companies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {question.companies.slice(0, 3).map((company, index) => (
                <span key={index} className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {company.company}
                    {company.askedWithin && (
                      <span className="ml-1 text-muted-foreground">
                        ({getTimeLabel(company.askedWithin)})
                      </span>
                    )}
                  </Badge>
                </span>
              ))}
            </div>
          )}
        </div>
        {user && question.trackingStatus && (
          <div className="mt-3 pt-3 border-t">
            <span className="text-sm">
              Status:{' '}
              <span className="font-medium capitalize">
                {question.trackingStatus}
              </span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
