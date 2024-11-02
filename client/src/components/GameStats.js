import React from 'react';

const FormBox = ({ result }) => {
  const color = result === 'W' ? 'success' : (result === 'D' ? 'secondary' : 'danger');
  return (
    <div className={`d-inline-block text-center me-1 bg-${color} text-white`} style={{width: '20px', height: '20px', fontSize: '12px'}}>
      {result}
    </div>
  );
};

const CustomPieChart = ({ probability }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = (probability / 100) * circumference;

  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="transparent"
        stroke="#add8e6"
        strokeWidth="20"
      />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="transparent"
        stroke="#1e90ff"
        strokeWidth="20"
        strokeDasharray={`${strokeDasharray} ${circumference}`}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="50" textAnchor="middle" dy=".3em" fontSize="20">
        {probability}%
      </text>
    </svg>
  );
};

const GameStats = ({ stats }) => {
  if (!stats) return null;

  const team1 = stats.team1.input_name;
  const team2 = stats.team2.input_name;

  const renderForm = (form) => {
    return form.split('').map((result, index) => <FormBox key={index} result={result} />);
  };

  const renderH2H = () => {
    const { [stats.team1.matched_name + '_wins']: team1Wins, [stats.team2.matched_name + '_wins']: team2Wins, draws } = stats.head_to_head;
    return `${team1Wins}-${draws}-${team2Wins}`;
  };

  const renderKeyPlayer = (team, isLaLiga) => {
    const playerData = isLaLiga ? stats.esp_key_players[team] : stats.key_players[team];
    if (!playerData) return null;

    return (
      <div className="col-5 text-center">
        <strong>Key Player</strong>
        <div>{playerData.name}</div>
        <div>Position: {playerData.position}</div>
        {isLaLiga ? (
          <>
            <div>Goals: {playerData.goals}</div>
            <div>Assists: {playerData.assists}</div>
            <div>Minutes Played: {playerData.minutes_played}</div>
            <div>Games Played: {playerData.games_played}</div>
            <div>Pass Completion: {playerData.pass_rate}%</div>
            <div>Expected Goals (xG): {playerData.expected_goals}</div>
          </>
        ) : (
          <div>Market Value: €{playerData.market_value.toLocaleString()}</div>
        )}
      </div>
    );
  };

  return (
    <div className="w-100 mt-3 game-stats">
      <h5 className="text-center mb-3">Game Stats</h5>
      
      <div className="row mb-3">
        <div className="col-5 text-end">
          <strong>{team1}</strong>
          <div>{renderForm(stats.recent_form[team1])}</div>
        </div>
        <div className="col-2 text-center">
          <strong>Recent Form</strong>
        </div>
        <div className="col-5 text-start">
          <strong>{team2}</strong>
          <div>{renderForm(stats.recent_form[team2])}</div>
        </div>
      </div>

      <div className="text-center mb-3">
        <strong>Head to Head: {renderH2H()}</strong>
        <div>Total games: {stats.head_to_head.total_games}</div>
      </div>

      {stats.high_scoring && (
        <div className="text-center mb-3">
          <strong>This fixture tends to have a lot of goals</strong>
        </div>
      )}

      {stats.high_card && (
        <div className="text-center mb-3">
          <strong>This fixture tends to have a high number of cards</strong>
        </div>
      )}

      <div className="row mb-3 align-items-center">
        <div className="col-5 text-center">
          <CustomPieChart probability={stats.clean_sheet[team1]} />
        </div>
        <div className="col-2 text-center">
          <strong>Clean Sheet Probability</strong>
        </div>
        <div className="col-5 text-center">
          <CustomPieChart probability={stats.clean_sheet[team2]} />
        </div>
      </div>

      <div className="row">
        {renderKeyPlayer(team1, stats.is_la_liga)}
        <div className="col-2"></div>
        {renderKeyPlayer(team2, stats.is_la_liga)}
      </div>
    </div>
  );
};

export default GameStats;