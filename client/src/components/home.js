import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Accordion, Button } from 'react-bootstrap';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import GameStats from './GameStats'; 
import '../styles.css'


const FixturesComponent = ({ username, selectedDate, fixturesByLeague, handleDateChange, handleLogout, getLogoUrl, gameStats, fetchGameStats, loading }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '/');
  };

  const parseDateInput = (dateString) => {
    const [day, month, year] = dateString.split('/');
    return new Date(year, month - 1, day);
  };

  const handleCustomDateChange = (e) => {
    const dateValue = e.target.value;
    const parsedDate = parseDateInput(dateValue);
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      handleDateChange({ target: { value: parsedDate.toISOString().split('T')[0] } });
    }
  };

  const changeDateByDays = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    handleDateChange({ target: { value: newDate.toISOString().split('T')[0] } });
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12 text-end p-3">
          <Button variant="outline-danger" size={isMobile ? "sm" : "md"} onClick={handleLogout}>Logout</Button>
        </div>
      </div>
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8">
          <div className="text-center mb-4">
            <h1 className="mt-3 fs-4 fs-md-3">Welcome, {username}!</h1>
          </div>
          <div className="mb-3 d-flex flex-wrap align-items-center justify-content-center">
            <Button variant="outline-primary" size={isMobile ? "sm" : "md"} onClick={() => changeDateByDays(-1)} className="me-2 mb-2 mb-md-0">
              <ChevronLeft size={isMobile ? 16 : 20} />
            </Button>
            <div className="d-flex flex-column align-items-center mb-2 mb-md-0" style={{width: isMobile ? '150px' : '200px'}}>
              <label htmlFor="dateSelect" className="form-label mb-0 small">Select Date:</label>
              <input
                type="text"
                className="form-control form-control-sm text-center"
                id="dateSelect"
                value={formatDateForDisplay(selectedDate)}
                onChange={handleCustomDateChange}
                placeholder="DD/MM/YYYY"
              />
            </div>
            <Button variant="outline-primary" size={isMobile ? "sm" : "md"} onClick={() => changeDateByDays(1)} className="ms-2 mb-2 mb-md-0">
              <ChevronRight size={isMobile ? 16 : 20} />
            </Button>
          </div>
          <h2 className="text-center mb-4 fs-5 fs-md-4">Fixtures for {formatDateForDisplay(selectedDate)}</h2>
          <Accordion alwaysOpen>
            {Object.entries(fixturesByLeague).map(([league, fixtures], index) => (
              <Accordion.Item eventKey={index.toString()} key={league}>
                <Accordion.Header>
                  <div className="d-flex align-items-center w-100">
                    <span className="text-truncate">{league}</span>
                    <span className="badge bg-primary rounded-pill ms-2">{fixtures.length}</span>
                  </div>
                </Accordion.Header>
                <Accordion.Body>
                  <ul className="list-unstyled">
                    {fixtures.map((fixture, fixtureIndex) => (
                      <React.Fragment key={fixtureIndex}>
                        <li className="d-flex flex-wrap align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center justify-content-end flex-grow-1 flex-md-grow-0" style={{width: '100%', maxWidth: '40%'}}>
                            <span className="me-2 text-truncate">{fixture.team1}</span>
                            <img 
                              src={getLogoUrl(fixture.team1, league).specific}
                              alt={`${fixture.team1} logo`} 
                              className="team-logo"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = getLogoUrl(fixture.team1, league).generic;
                              }}
                            />
                          </div>
                          <div className="text-center mx-2">
                            <span>vs</span>
                          </div>
                          <div className="d-flex align-items-center justify-content-start flex-grow-1 flex-md-grow-0" style={{width: '100%', maxWidth: '40%'}}>
                            <img 
                              src={getLogoUrl(fixture.team2, league).specific}
                              alt={`${fixture.team2} logo`} 
                              className="team-logo"
                              onError={(e) => {
                                e.target.onerror = null; 
                                e.target.src = getLogoUrl(fixture.team2, league).generic;
                              }}
                            />
                            <span className="ms-2 text-truncate">{fixture.team2}</span>
                          </div>
                          <span className="w-100 text-center text-md-end mt-2 mt-md-0">{fixture.time}</span>
                          <Button 
                            variant="outline-info" 
                            size="sm" 
                            onClick={() => fetchGameStats(fixture.team1, fixture.team2)}
                            className="mt-2 w-100"
                            disabled={loading[`${fixture.team1}-${fixture.team2}`]}
                          >
                            {loading[`${fixture.team1}-${fixture.team2}`] ? 'Loading...' : 
                              (gameStats[`${fixture.team1}-${fixture.team2}`] ? 'Update Stats' : 'Show Stats')}
                          </Button>
                          {gameStats[`${fixture.team1}-${fixture.team2}`] && (
                          <GameStats stats={gameStats[`${fixture.team1}-${fixture.team2}`]} />
                        )}
                        </li>
                        {fixtureIndex < fixtures.length - 1 && <hr className="my-2" />}
                      </React.Fragment>
                    ))}
                  </ul>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

function Home() {
  const [username, setUsername] = useState('');
  const [fixturesByLeague, setFixturesByLeague] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState('');
  const [gameStats, setGameStats] = useState({});
  const [loading, setLoading] = useState({});
  const navigate = useNavigate();

  const fetchFixtures = useCallback(async (date) => {
    const formattedDate = date.toISOString().split('T')[0];
    try {
      const fixturesResponse = await fetch(`http://localhost:3200/api/fixtures/${formattedDate}`, { 
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      if (fixturesResponse.ok) {
        const fixturesData = await fixturesResponse.json();
        const groupedFixtures = groupFixturesByLeague(fixturesData);
        setFixturesByLeague(groupedFixtures);
        console.log(groupedFixtures);
      } else {
        throw new Error('Failed to fetch fixtures');
      }
    } catch (error) {
      console.error('Error fetching fixtures:', error);
      setError('Failed to fetch fixtures. Please try again.');
    }
  }, []);

  const fetchGameStats = useCallback(async (team1, team2) => {
    if (!team1 || !team2) {
      console.error('Both team names are required');
      return;
    }
    console.log(`Fetching game stats for: ${team1} vs ${team2}`);
    setError('');
    setLoading(prevLoading => ({...prevLoading, [`${team1}-${team2}`]: true}));
    try {
      const url = `http://localhost:3200/api/game-stats/${encodeURIComponent(team1)}/${encodeURIComponent(team2)}`;
      console.log(`Sending request to: ${url}`);
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Received data:', data);
      if (data.error) {
        throw new Error(data.error);
      }
      setGameStats(prevStats => ({...prevStats, [`${team1}-${team2}`]: data}));
    } catch (error) {
      console.error('Error fetching game stats:', error);
      if (error.message.includes('Club not found')) {
        alert(`Error: ${error.message}. Please check the team names.`);
      } else {
        setError(`Failed to fetch game stats: ${error.message}`);
      }
    } finally {
      setLoading(prevLoading => ({...prevLoading, [`${team1}-${team2}`]: false}));
    }
  }, []);

  useEffect(() => {
    const fetchUserAndFixtures = async () => {
      try {
        const userResponse = await fetch('http://localhost:3200/api/user', { 
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUsername(userData.username);
          
          await fetchFixtures(selectedDate);
        } else {
          throw new Error('Not authenticated');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        if (error.message === 'Not authenticated') {
          navigate('/login');
        }
      }
    };

    fetchUserAndFixtures();
  }, [navigate, selectedDate, fetchFixtures]);

  const groupFixturesByLeague = (fixtures) => {
    return fixtures.reduce((acc, fixture) => {
      if (!acc[fixture.league]) {
        acc[fixture.league] = [];
      }
      acc[fixture.league].push(fixture);
      return acc;
    }, {});
  };

  const handleDateChange = (event) => {
    setSelectedDate(new Date(event.target.value));
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:3200/api/logout', { 
        method: 'GET',
        credentials: 'include'
      });
      if (response.ok) {
        navigate('/login');
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      setError('Failed to logout. Please try again.');
    }
  };

  const getLogoUrl = useCallback((teamName, league) => {
    const encodedLeague = encodeURIComponent(league);
    const encodedTeamName = encodeURIComponent(teamName);
    const logoPath = `${process.env.PUBLIC_URL}/logo's/${encodedLeague}/${encodedTeamName}.png`;
    return {
      specific: logoPath,
      generic: `${process.env.PUBLIC_URL}/generic_team_logo.png`
    };
  }, []);

  if (error) {
    return <div className="text-center mt-5">Error: {error}</div>;
  }

  return (
    <FixturesComponent 
      username={username}
      selectedDate={selectedDate}
      fixturesByLeague={fixturesByLeague}
      handleDateChange={handleDateChange}
      handleLogout={handleLogout}
      getLogoUrl={getLogoUrl}
      gameStats={gameStats}
      fetchGameStats={fetchGameStats}
      loading={loading}
    />
  );
}

export default Home;