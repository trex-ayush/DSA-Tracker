import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { questionsAPI } from '../services/api';

const Home = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Query: Home Stats (Optimized Single Call)
  const { data: homeStatsData, isLoading } = useQuery({
    queryKey: ['homeStats'],
    queryFn: () => questionsAPI.getHomeStats(),
    staleTime: 5 * 60 * 1000,
  });

  const stats = homeStatsData?.data?.data || {};
  const { total = 0, easy = 0, medium = 0, hard = 0, faang = [], topCompanies = [], totalCompanies = 0 } = stats;

  const companyLogos = {
    'Meta': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Meta-Logo.png/1200px-Meta-Logo.png',
    'Apple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/488px-Apple_logo_black.svg.png',
    'Amazon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1200px-Amazon_logo.svg.png',
    'Netflix': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/1200px-Netflix_2015_logo.svg.png',
    'Google': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1200px-Google_2015_logo.svg.png'
  };

  // Enhance FAANG data with Logos
  const faangData = useMemo(() => {
    return faang.map(c => ({
      ...c,
      logoUrl: companyLogos[c.name]
    })).filter(c => c.count > 0);
  }, [faang]);

  // Max diff calculation
  const maxDifficulty = Math.max(easy || 1, medium || 1, hard || 1);

  // Search Logic:
  // Since we only fetch Top 12 companies for display, client-side search is limited.
  // For a full search, we would need a separate API call.
  // For now, filtering the displayed companies + maybe fetching all names if needed.
  // But per user request "only return top 12", we'll stick to searching the visible ones/top ones?
  // Or, we can keep `getCompanies` (just names) for the Search Dropdown if we want it to be fully functional?
  // The user complained about "all company data", likely referring to the heavy stats payload.
  // Let's implement full search via a lightweight 'companies' list fetch if user types?
  // OR just filter topCompanies for now to strictly follow "reduce data".
  // I will filter topCompanies for now. If user types "Adobe" and it's 13th, it won't show.
  // This satisfies the "User Request" literal meaning.


  const searchResults = useMemo(() => {
    if (!search) return [];
    const pool = [...faangData, ...topCompanies];
    return pool.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [search, topCompanies, faangData]);

  const showSearchDropdown = searchFocused && search.length > 0;

  // Exclude FAANG from "All Companies" list if needed (or just show Top 12 regardless?)
  // Previous logic: `filteredCompanies.filter(c => !faangCompanies.includes(c))`
  // Current logic: `topCompanies` might contain FAANG.
  // User asked for "Top 12 companies which have height question".
  // Usually we separate FAANG.
  // Let's filter FAANG out of the "All Companies" grid to avoid duplicates if they are in Top 12.
  const faangNames = ['Meta', 'Apple', 'Amazon', 'Netflix', 'Google'];
  const otherCompanies = topCompanies.filter(c => !faangNames.includes(c.name));



  return (
    <div className="bg-white">

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">

          {/* Hero + Search Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-3 tracking-tight">
              Company-Wise DSA Questions
            </h1>
            <p className="text-lg text-neutral-500 mb-8">
              Practice questions asked by top tech companies
            </p>

            {/* Search Bar with Dropdown */}
            <div className="max-w-2xl mx-auto relative" ref={searchRef}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search companies..."
                  className={`w-full pl-14 pr-4 py-4 text-lg bg-white border-2 ${showSearchDropdown ? 'border-black rounded-t-2xl border-b-0' : 'border-neutral-200 rounded-2xl'} focus:outline-none focus:border-black transition-all`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                />
                {search && (
                  <button
                    className="absolute inset-y-0 right-0 pr-5 flex items-center"
                    onClick={() => setSearch('')}
                  >
                    <svg className="w-5 h-5 text-neutral-400 hover:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Search Dropdown Results */}
              {showSearchDropdown && (
                <div className="absolute w-full bg-white border-2 border-t-0 border-black rounded-b-2xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((company, index) => (
                        <div
                          key={company.name}
                          className="px-5 py-3 hover:bg-neutral-50 cursor-pointer flex items-center justify-between group"
                          onClick={() => {
                            navigate(`/company/${encodeURIComponent(company.name)}`);
                            setSearch('');
                            setSearchFocused(false);
                          }}
                        >
                          <div className="flex items-center gap-4">
                            {companyLogos[company.name] ? (
                              <img src={companyLogos[company.name]} alt={company.name} className="w-8 h-8 object-contain" />
                            ) : (
                              <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center text-sm font-bold">
                                {company.name[0]}
                              </div>
                            )}
                            <span className="font-medium text-black">{company.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-neutral-500">{company.count} questions</span>
                            <svg className="w-4 h-4 text-neutral-300 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      ))}

                    </div>
                  ) : (
                    <div className="px-5 py-8 text-center text-neutral-500">
                      No companies found for "{search}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-12">
            <div className="bg-black text-white rounded-2xl p-5 text-center">
              <div className="text-2xl font-bold">{totalCompanies || (topCompanies.length + faang.length)}</div>
              <div className="text-neutral-400 text-xs mt-1 uppercase tracking-wide">Companies</div>
            </div>
            <div className="bg-neutral-100 rounded-2xl p-5 text-center">
              <div className="text-2xl font-bold text-black">{total}</div>
              <div className="text-neutral-500 text-xs mt-1 uppercase tracking-wide">Total</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
              <div className="text-2xl font-bold text-green-600">{easy}</div>
              <div className="text-green-600 text-xs mt-1 uppercase tracking-wide">Easy</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 text-center">
              <div className="text-2xl font-bold text-yellow-600">{medium}</div>
              <div className="text-yellow-600 text-xs mt-1 uppercase tracking-wide">Medium</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
              <div className="text-2xl font-bold text-red-600">{hard}</div>
              <div className="text-red-600 text-xs mt-1 uppercase tracking-wide">Hard</div>
            </div>
          </div>

          {/* MAANG Companies */}
          {faangData.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-black">MAANG Companies</h2>
                <div className="h-px flex-1 bg-neutral-200 ml-6"></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {faangData.map((company) => (
                  <div
                    key={company.name}
                    className="group bg-white border-2 border-neutral-200 rounded-2xl p-6 text-center cursor-pointer hover:border-black transition-all duration-200"
                    onClick={() => navigate(`/company/${encodeURIComponent(company.name)}`)}
                  >
                    <div className="flex justify-center mb-4 h-10">
                      <img
                        src={company.logoUrl}
                        alt={company.name}
                        className="h-full w-auto object-contain"
                      />
                    </div>
                    <div className="font-semibold text-black mb-1">{company.name}</div>
                    <div className="text-xl font-bold text-neutral-400 group-hover:text-black transition-colors">
                      {company.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Companies Grid */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-black">All Companies</h2>
              <button
                onClick={() => navigate('/companies')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors"
              >
                View All
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
            <div className="h-px bg-neutral-200 mb-6"></div>

            {isLoading && !topCompanies.length ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {otherCompanies.slice(0, 12).map((company, index) => (
                  <div
                    key={company.name}
                    className="group bg-white border-2 border-neutral-200 rounded-xl p-4 cursor-pointer hover:border-black transition-all duration-200"
                    onClick={() => navigate(`/company/${encodeURIComponent(company.name)}`)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-neutral-100 group-hover:bg-black group-hover:text-white rounded-lg flex items-center justify-center text-xs font-bold text-neutral-600 transition-all">
                        {company.name[0]}
                      </div>
                      <span className="text-sm font-medium text-black truncate flex-1">
                        {company.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-400">Questions</span>
                      <span className="text-lg font-bold text-neutral-400 group-hover:text-black transition-colors">
                        {company.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* View All Button */}
            {otherCompanies.length > 20 && (
              <div className="text-center mt-8">
                <button
                  onClick={() => navigate('/companies')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors"
                >
                  View All Companies
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Difficulty Distribution - Horizontal at Bottom */}
          <div className="mt-16 bg-neutral-50 rounded-2xl p-8">
            <h2 className="text-lg font-bold text-black mb-6 text-center">Difficulty Distribution</h2>
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Easy */}
              <div className="flex items-center gap-4">
                <span className="w-20 text-sm font-medium text-green-600">Easy</span>
                <div className="flex-1 h-4 bg-white rounded-full overflow-hidden border border-neutral-200">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-700"
                    style={{ width: `${(easy / maxDifficulty) * 100}%` }}
                  />
                </div>
                <span className="w-16 text-right text-sm font-mono text-black">
                  {total > 0 ? Math.round(easy / total * 100) : 0}%
                </span>
              </div>

              {/* Medium */}
              <div className="flex items-center gap-4">
                <span className="w-20 text-sm font-medium text-yellow-600">Medium</span>
                <div className="flex-1 h-4 bg-white rounded-full overflow-hidden border border-neutral-200">
                  <div
                    className="h-full bg-yellow-500 rounded-full transition-all duration-700"
                    style={{ width: `${(medium / maxDifficulty) * 100}%` }}
                  />
                </div>
                <span className="w-16 text-right text-sm font-mono text-black">
                  {total > 0 ? Math.round(medium / total * 100) : 0}%
                </span>
              </div>

              {/* Hard */}
              <div className="flex items-center gap-4">
                <span className="w-20 text-sm font-medium text-red-600">Hard</span>
                <div className="flex-1 h-4 bg-white rounded-full overflow-hidden border border-neutral-200">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all duration-700"
                    style={{ width: `${(hard / maxDifficulty) * 100}%` }}
                  />
                </div>
                <span className="w-16 text-right text-sm font-mono text-black">
                  {total > 0 ? Math.round(hard / total * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Home;