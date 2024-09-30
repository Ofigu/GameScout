import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [username, setUsername] = useState('');
  const [fixtures, setFixtures] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndFixtures = async () => {
      try {
        const userResponse = await fetch('/api/user', { credentials: 'include' });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUsername(userData.username);
          
          const fixturesResponse = await fetch('/api/fixtures', { credentials: 'include' });
          if (fixturesResponse.ok) {
            const fixturesData = await fixturesResponse.json();
            setFixtures(fixturesData);
          } else {
            throw new Error('Failed to fetch fixtures');
          }
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
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', { 
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

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Welcome, {username}!</h1>
      <button onClick={handleLogout}>Logout</button>
      <h2>Today's Fixtures</h2>
      <ul>
        {fixtures.map((fixture, index) => (
          <li key={index}>
            {fixture.team1} vs {fixture.team2} - {fixture.time}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Home;