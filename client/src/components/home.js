import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertCircle, LogOut } from 'lucide-react';

const FixtureRow = ({ fixture }) => (
  <Table.Row>
    <Table.Cell className="font-medium">{fixture.team1}</Table.Cell>
    <Table.Cell className="text-center">vs</Table.Cell>
    <Table.Cell>{fixture.team2}</Table.Cell>
    <Table.Cell className="text-right">{fixture.time}</Table.Cell>
  </Table.Row>
);

export default function Home() {
  const [username, setUsername] = useState('');
  const [fixtures, setFixtures] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndFixtures = async () => {
      try {
        const userResponse = await fetch('/api/user', { 
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUsername(userData.username);
          
          const fixturesResponse = await fetch('/api/fixtures', { 
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          });
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
    return (
      <Card className="w-[350px] mx-auto mt-10">
        <CardHeader>
          <CardTitle className="flex items-center text-red-500">
            <AlertCircle className="mr-2" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent>{error}</CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {username}!</h1>
        <Button onClick={handleLogout} variant="outline">
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Today's Fixtures</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Home Team</Table.Head>
                <Table.Head className="text-center">VS</Table.Head>
                <Table.Head>Away Team</Table.Head>
                <Table.Head className="text-right">Time</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {fixtures.map((fixture, index) => (
                <FixtureRow key={index} fixture={fixture} />
              ))}
            </Table.Body>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}