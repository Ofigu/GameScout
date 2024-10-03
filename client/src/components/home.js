import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Accordion, Button } from 'react-bootstrap';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const FixturesComponent = ({ username, selectedDate, fixturesByLeague, handleDateChange, handleLogout, getLogoUrl }) => {
  // Function to format date as DD/MM/YYYY
  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '/');
  };

  // Function to parse DD/MM/YYYY to Date object
  const parseDateInput = (dateString) => {
    const [day, month, year] = dateString.split('/');
    return new Date(year, month - 1, day);
  };

  // Custom handler for date input change
  const handleCustomDateChange = (e) => {
    const dateValue = e.target.value;
    const parsedDate = parseDateInput(dateValue);
    handleDateChange({ target: { value: parsedDate.toISOString().split('T')[0] } });
  };

  // Function to change date by a given number of days
  const changeDateByDays = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    handleDateChange({ target: { value: newDate.toISOString().split('T')[0] } });
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12 text-end p-3">
          <Button variant="outline-danger" onClick={handleLogout}>Logout</Button>
        </div>
      </div>
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="text-center mb-4">
            <h1 className="mt-3">Welcome, {username}!</h1>
          </div>
          <div className="mb-3 d-flex align-items-center justify-content-center">
            <Button variant="outline-primary" onClick={() => changeDateByDays(-1)} className="me-2">
              <ChevronLeft size={20} />
            </Button>
            <div className="d-flex flex-column align-items-center" style={{width: '200px'}}>
              <label htmlFor="dateSelect" className="form-label mb-0">Select Date:</label>
              <input
                type="text"
                className="form-control text-center"
                id="dateSelect"
                value={formatDateForDisplay(selectedDate)}
                onChange={handleCustomDateChange}
                placeholder="DD/MM/YYYY"
              />
            </div>
            <Button variant="outline-primary" onClick={() => changeDateByDays(1)} className="ms-2">
              <ChevronRight size={20} />
            </Button>
          </div>
          <h2 className="text-center mb-4">Fixtures for {formatDateForDisplay(selectedDate)}</h2>
          <Accordion alwaysOpen>
            {Object.entries(fixturesByLeague).map(([league, fixtures], index) => (
              <Accordion.Item eventKey={index.toString()} key={league}>
                <Accordion.Header>
                  <div className="d-flex align-items-center w-100">
                    <span>{league}</span>
                    <span className="badge bg-primary rounded-pill ms-2">{fixtures.length}</span>
                    <div className="flex-grow-1"></div>
                  </div>
                </Accordion.Header>
                <Accordion.Body>
                  <ul className="list-unstyled">
                    {fixtures.map((fixture, fixtureIndex) => (
                      <React.Fragment key={fixtureIndex}>
                        <li className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center justify-content-end" style={{width: '40%'}}>
                            <span className="me-2">{fixture.team1}</span>
                            <img 
                              src={getLogoUrl(fixture.team1, league).specific}
                              alt={`${fixture.team1} logo`} 
                              style={{width: '30px', height: '30px'}}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = getLogoUrl(fixture.team1, league).generic;
                              }}
                            />
                          </div>
                          <div style={{width: '20%', textAlign: 'center'}}>
                            <span className="mx-2">vs</span>
                          </div>
                          <div className="d-flex align-items-center justify-content-start" style={{width: '40%'}}>
                            <img 
                              src={getLogoUrl(fixture.team2, league).specific}
                              alt={`${fixture.team2} logo`} 
                              style={{width: '30px', height: '30px'}}
                              onError={(e) => {
                                e.target.onerror = null; 
                                e.target.src = getLogoUrl(fixture.team2, league).generic;
                              }}
                            />
                            <span className="ms-2">{fixture.team2}</span>
                          </div>
                          <span style={{width: '10%', textAlign: 'right'}}>{fixture.time}</span>
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
      } else {
        throw new Error('Failed to fetch fixtures');
      }
    } catch (error) {
      console.error('Error fetching fixtures:', error);
      setError('Failed to fetch fixtures. Please try again.');
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
    />
  );
}

export default Home;