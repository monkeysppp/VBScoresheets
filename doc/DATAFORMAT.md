# Data format
Data is stored as JSON.  The root of a single JSON document is a `team`; separate teams have separate documents.
The schema for a `team` is availabe in [../schemas/team.json](../schemas/team.json).  Note that a team document
may have incomplete parts; it just means that the season is incomplete, and the editor should reflect that.

If a team plays in more than one competition, you will have to enter them as separate teams, and include the league
in the team name.

## Example Data

```json
{
  "name": "Super Stars",
  "seasons": [
    {
      "name": "2016/2017",
      "players": [
        {"id": 1, "name": "Alice Alison"},
        {"id": 2, "name": "Bob Roberts"},
        {"id": 3, "name": "Charlie Charlson"},
        {"id": 4, "name": "Debbie Davis"},
        {"id": 5, "name": "Emma Emerton"},
        {"id": 6, "name": "Freda Ferguson"},
        {"id": 7, "name": "Gabi Gunderson"},
        {"id": 8, "name": "Helen Henderson"},
      ],
      "matches": [
        {
          "id": 1,
          "venue": "Sports Centre",
          "home_or_away": "home",
          "date": "2017-05-21",
          "time": "11:00",
          "squads": {
            "us": [
              {"id": 1, "number": 10},
              {"id": 2, "number": 3},
              {"id": 3, "number": 7},
              {"id": 4, "number": 4},
              {"id": 5, "number": 5},
              {"id": 6, "number": 12},
              {"id": 7, "number": 2},
              {"id": 8, "number": 9},
            ],
            "opponent": {
              "name": "Newtown City",
              "players": [
                {"name": "Alice Player", "number": 1},
                {"name": "Betty Player", "number": 4},
                {"name": "Clare Player", "number": 7},
                {"name": "Diane Player", "number": 2},
                {"name": "Ellie Player", "number": 5},
                {"name": "Fiona Player", "number": 9},
              ]
            }
          },
          "mvp": 1,
          "sets": [
            {
              "serve": true,
              "lineups": {
                "us": [ 1,2,3,4,5,6 ],
                "opponent": [ 1,2,3,4,5,6 ]
              },
              "scores": {
                "us": [ 3,4,6,7,10,12,14,17,18,25 ],
                "opponent": [ 1,3,5,7,8,10,11,12,21,22 ]
              },
              "timeouts": {
                "us": [ [17,16], [17,20] ],
                "opponent": [[3,6]]
              },
              "substitutions": [
                {"off": 3, "on": 7, "score": [17,18]}
              ]
            }
          ]
        }
      ]
    }
  ]
}
```
