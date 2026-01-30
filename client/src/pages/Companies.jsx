import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { questionsAPI } from '../services/api';

const Companies = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // Query: Companies (Shared with Home.jsx)
  const { data: companiesData, isLoading: loadingCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => questionsAPI.getCompanies(),
    staleTime: 60 * 60 * 1000,
  });

  const companies = companiesData?.data?.data || [];

  // Query: Company Counts (Shared with Home.jsx)
  const { data: companyCountsData, isLoading: loadingCounts } = useQuery({
    queryKey: ['companyCounts'],
    queryFn: () => questionsAPI.getCompanyStats(),
    staleTime: 5 * 60 * 1000,
  });

  const companyCounts = companyCountsData?.data?.success ? companyCountsData.data.data.counts : {};
  const loading = loadingCompanies || loadingCounts;

  const filteredCompanies = useMemo(() => {
    return companies
      .filter(c => c.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (companyCounts[b] || 0) - (companyCounts[a] || 0));
  }, [companies, search, companyCounts]);

  return (
    <div className="bg-white">

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-2">All Companies</h1>
            <p className="text-lg text-neutral-500">
              {companies.length} companies with {Object.values(companyCounts).reduce((a, b) => a + b, 0)} total questions
            </p>
          </div>

          {/* Search */}
          <div className="max-w-xl mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search companies..."
                className="w-full pl-14 pr-4 py-4 text-lg bg-white border-2 border-neutral-200 rounded-2xl focus:outline-none focus:border-black transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Companies Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredCompanies.map((company) => (
                <div
                  key={company}
                  className="group bg-white border-2 border-neutral-200 rounded-xl p-4 cursor-pointer hover:border-black transition-all duration-200"
                  onClick={() => navigate(`/company/${encodeURIComponent(company)}`)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-neutral-100 group-hover:bg-black group-hover:text-white rounded-lg flex items-center justify-center text-sm font-bold text-neutral-600 transition-all">
                      {company[0]}
                    </div>
                    <span className="text-sm font-medium text-black truncate flex-1">
                      {company}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400">Questions</span>
                    <span className="text-xl font-bold text-neutral-400 group-hover:text-black transition-colors">
                      {companyCounts[company] || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredCompanies.length === 0 && !loading && (
            <div className="text-center py-16 text-neutral-500">
              No companies found for "{search}"
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Companies;
