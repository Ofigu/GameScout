import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Accordion, Button } from 'react-bootstrap';
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
    // Encode the league and team names to handle spaces and special characters in the URL
    const encodedLeague = encodeURIComponent(league);
    const encodedTeamName = encodeURIComponent(teamName);

    // Construct the path to the logo
    const logoPath = `${process.env.PUBLIC_URL}/logo's/${encodedLeague}/${encodedTeamName}.png`;

    // Return an object with both the specific logo path and a generic fallback
    return {
      specific: logoPath,
      generic: `${process.env.PUBLIC_URL}/generic_team_logo.png`
    };
  }, []);

  if (error) {
    return <div className="text-center mt-5">Error: {error}</div>;
  }

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
          <div className="mb-3">
            <label htmlFor="dateSelect" className="form-label">Select Date:</label>
            <input
              type="date"
              className="form-control"
              id="dateSelect"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={handleDateChange}
            />
          </div>
          <h2 className="text-center mb-4">Fixtures for {selectedDate.toDateString()}</h2>
          <Accordion alwaysOpen>
            {Object.entries(fixturesByLeague).map(([league, fixtures], index) => (
              <Accordion.Item eventKey={index.toString()} key={league}>
                <Accordion.Header>
                  <div className="d-flex justify-content-between align-items-center w-100">
                    <div className="flex-grow-1"></div>
                    <span className="text-center">{league}</span>
                    <div className="flex-grow-1 text-end">
                      <span className="badge bg-primary rounded-pill">{fixtures.length}</span>
                    </div>
                  </div>
                </Accordion.Header>
                <Accordion.Body>
                  <ul className="list-unstyled">
                    {fixtures.map((fixture, fixtureIndex) => (
                      <React.Fragment key={fixtureIndex}>
                        <li className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center">
                            <img 
                              src={getLogoUrl(fixture.team1, league).specific}
                              alt={`${fixture.team1} logo`} 
                              className="me-2" 
                              style={{width: '30px', height: '30px'}}
                              onError={(e) => {
                                console.log(`Failed to load: ${e.target.src}`);
                                e.target.onerror = null;
                                e.target.src = getLogoUrl(fixture.team1, league).generic;
                              }}
                            />
                            <span>{fixture.team1}</span>
                          </div>
                          <span className="mx-2">vs</span>
                          <div className="d-flex align-items-center">
                            <span>{fixture.team2}</span>
                            <img 
                              src={getLogoUrl(fixture.team2, league).specific}
                              alt={`${fixture.team2} logo`} 
                              className="ms-2" 
                              style={{width: '30px', height: '30px'}}
                              onError={(e) => {
                                e.target.onerror = null; 
                                e.target.src = getLogoUrl(fixture.team2, league).generic;
                              }}
                            />
                          </div>
                          <span className="ms-2">{fixture.time}</span>
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
}

export default Home;