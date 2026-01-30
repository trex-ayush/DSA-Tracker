import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Loader2, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const Admin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [company, setCompany] = useState('');
  const [askedIn, setAskedIn] = useState('30days');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV file first');
      return;
    }
    if (!company.trim()) {
      setError('Please enter a company name');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('company', company);
    formData.append('askedIn', askedIn);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Upload successful! Created: ${data.data.created}, Updated: ${data.data.updated}, Errors: ${data.data.errors}`
        });
        setFile(null);

        // Invalidate caches to ensure freshness
        queryClient.invalidateQueries({ queryKey: ['companies'] }); // Refresh Home/Companies list
        queryClient.invalidateQueries({ queryKey: ['companyCounts'] }); // Refresh counts
        queryClient.invalidateQueries({ queryKey: ['questionsStats'] }); // Refresh global stats
        queryClient.invalidateQueries({ queryKey: ['questions'] }); // Refresh Questions list
        queryClient.invalidateQueries({ queryKey: ['company', company] }); // Refresh specific Company page

      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (err) {
      setError('Error uploading file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                You need admin privileges to access this page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CSV Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Bulk Upload Questions (CSV)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Company Name
                  </label>
                  <Input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g., Google, Amazon, Meta"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Asked In
                  </label>
                  <Select value={askedIn} onValueChange={setAskedIn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="2months">Last 3 Months</SelectItem>
                      <SelectItem value="6months">Last 6 Months</SelectItem>
                      <SelectItem value="older">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select CSV File
                  </label>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Required columns: ID, URL, Title, Difficulty, Acceptance %, Frequency %
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
                    {message.text}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !file || !company}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Questions
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* CSV Format Guide */}
          <Card>
            <CardHeader>
              <CardTitle>CSV Format Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">CSV Columns (Required):</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• <code>ID</code> - Question ID (optional)</li>
                    <li>• <code>URL</code> - LeetCode problem URL</li>
                    <li>• <code>Title</code> - Question title</li>
                    <li>• <code>Difficulty</code> - Easy, Medium, or Hard</li>
                    <li>• <code>Acceptance %</code> - Acceptance rate (e.g., 49.2)</li>
                    <li>• <code>Frequency %</code> - Frequency indicator (e.g., 5)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">How it works:</h4>
                  <ol className="text-sm space-y-2 text-muted-foreground list-decimal list-inside">
                    <li>Enter the <strong>Company Name</strong> (e.g., Google)</li>
                    <li>Select the <strong>Time Range</strong> (Asked In)</li>
                    <li>Upload the CSV file with question data</li>
                    <li>All questions will be associated with the selected company and time range</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Example CSV:</h4>
                  <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-x-auto">
                    {`ID,URL,Title,Difficulty,Acceptance %,Frequency %
1,https://leetcode.com/problems/two-sum,Two Sum,Easy,49.2,5
2,https://leetcode.com/problems/longest-substring,Longest Substring,Medium,32.1,3
3,https://leetcode.com/problems/median,Median of Two Sorted Arrays,Hard,29.8,2`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Admin;
