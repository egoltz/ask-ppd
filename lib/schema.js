export const SCHEMA_DESCRIPTION = `
You have access to two SQLite tables about Portland Police Bureau public safety data.

TABLE 1: crimes
  Columns: id, case_number, date (YYYY-MM-DD), year, month, occur_time (HHMM 24hr),
           report_month_year, address, neighborhood, council_district,
           crime_against, offense_category, offense_type, custom_crime_category,
           offense_count, lat, lon

  - year range: 2015–2026 (all years present including 2019)
  - neighborhood: Portland neighborhood name e.g. 'Montavilla', 'Pearl', 'Buckman', 'Lents', 'Lloyd'
  - council_district: 'Council District 1' through 'Council District 5' (older data) or '1' through '5' (newer data)
  - crime_against: 'Person', 'Property', 'Society'
  - custom_crime_category (PREFER THIS over offense_category):
      'Assault: Aggravated', 'Assault: Simple/Intimidation', 'Robbery', 'Vandalism',
      'Arson', 'Sex Offenses', 'Weapon Law Violations', 'Drug Offenses',
      'Other Society Offenses', 'Kidnapping/Abduction', 'Burglary', 'Fraud',
      'Human Trafficking Offenses', 'Prostitution Offenses', 'Motor Vehicle Theft',
      'Larceny: Car Prowl - Other', 'Larceny: Other', 'Other Property Offenses',
      'Larceny: Car Prowl - Car Parts', 'Larceny: Shoplifting', 'Homicide',
      'Vehicular Manslaughter'
  - offense_count: usually 1. Always use SUM(offense_count), never COUNT(*) for totals.
  - lat/lon: nullable (~10% of rows)
  - Total rows: ~672,264

TABLE 2: dispatches
  Columns: id, call_number, date (YYYY-MM-DD), year, month, hour (0-23),
           report_month_year, priority, priority_number, call_group, call_category,
           neighborhood, address, time_in_queue_sec, travel_time_sec, response_time_sec,
           lat, lon

  - year range: 2016–2026
  - priority: 'High', 'Medium', 'Low'
  - priority_number: 1 (most urgent) to 7 (least urgent)
  - call_group: 'Crime', 'Disorder', 'Assist', 'Traffic', 'Alarm', 'Civil', 'Community Policing', 'Other'
  - call_category: 'Shots Fired', 'Welfare Check', 'Assault', 'Suspicious', 'Theft',
                   'Disturbance', 'Collision', 'Stolen Vehicle', 'Alarm', 'Vandalism', etc.
  - response_time_sec: total response time in seconds. Divide by 60 for minutes.
  - time_in_queue_sec: call received to officer dispatched
  - travel_time_sec: officer dispatched to on-scene
  - All response time fields are capped at 7200 seconds (2 hours)
  - Total rows: ~2,286,397

QUERY RULES:
  - Use LOWER(neighborhood) LIKE LOWER('%term%') for neighborhood/category matching
  - council_district values vary by year: filter with LIKE '%1%' or use exact match depending on question
  - For trends: GROUP BY year ORDER BY year
  - For rankings: ORDER BY value DESC LIMIT 10
  - Both tables share the same neighborhood naming and can be JOINed on neighborhood and/or year
  - Always include LIMIT (max 500 rows)
  - Only write SELECT statements
  - For "last year" treat as 2025 (most recent complete year)
`;
