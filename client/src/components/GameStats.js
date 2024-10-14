import React from 'react';

const GameStats = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="w-100 mt-2 game-stats">
      <h6>Game Stats:</h6>
      <p>Teams: {stats.team1.matched_name} vs {stats.team2.matched_name}</p>
      <p>Recent Form: 
        {stats.team1.input_name}: {stats.recent_form[stats.team1.input_name]} | 
        {stats.team2.input_name}: {stats.recent_form[stats.team2.input_name]}
      </p>
      <p>Head to Head: 
        Total games: {stats.head_to_head.total_games},
        First game: {stats.head_to_head.first_game_date}<br />
        {stats.team1.matched_name} wins: {stats.head_to_head[`${stats.team1.matched_name}_wins`]},
        {stats.team2.matched_name} wins: {stats.head_to_head[`${stats.team2.matched_name}_wins`]},
        Draws: {stats.head_to_head.draws}
      </p>
      <p>High Scoring: {stats.high_scoring ? 'Yes' : 'No'}</p>
      <p>High Card: {stats.high_card ? 'Yes' : 'No'}</p>
      <p>Clean Sheet Probability: 
        {stats.team1.input_name}: {stats.clean_sheet[stats.team1.input_name]}% | 
        {stats.team2.input_name}: {stats.clean_sheet[stats.team2.input_name]}%
      </p>
      <p>Key Players: 
        <br />
        {stats.team1.input_name}: {stats.key_players[stats.team1.input_name].name} ({stats.key_players[stats.team1.input_name].position}) - Value: €{stats.key_players[stats.team1.input_name].market_value.toLocaleString()}
        <br />
        {stats.team2.input_name}: {stats.key_players[stats.team2.input_name].name} ({stats.key_players[stats.team2.input_name].position}) - Value: €{stats.key_players[stats.team2.input_name].market_value.toLocaleString()}
      </p>
    </div>
  );
};

export default GameStats;