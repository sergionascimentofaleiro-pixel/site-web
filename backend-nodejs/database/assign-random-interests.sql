-- Assign random interests to all profiles
-- Each profile gets between 5 and 15 random interests

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Clear existing profile interests
DELETE FROM profile_interests;

-- Assign interests to profile 1
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 1, interest_id FROM interests ORDER BY RAND() LIMIT 8;
-- Assign interests to profile 2
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 2, interest_id FROM interests ORDER BY RAND() LIMIT 12;
-- Assign interests to profile 3
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 3, interest_id FROM interests ORDER BY RAND() LIMIT 7;
-- Assign interests to profile 4
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 4, interest_id FROM interests ORDER BY RAND() LIMIT 10;
-- Assign interests to profile 5
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 5, interest_id FROM interests ORDER BY RAND() LIMIT 9;
-- Assign interests to profile 6
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 6, interest_id FROM interests ORDER BY RAND() LIMIT 11;
-- Assign interests to profile 7
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 7, interest_id FROM interests ORDER BY RAND() LIMIT 6;
-- Assign interests to profile 8
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 8, interest_id FROM interests ORDER BY RAND() LIMIT 13;
-- Assign interests to profile 9
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 9, interest_id FROM interests ORDER BY RAND() LIMIT 8;
-- Assign interests to profile 10
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 10, interest_id FROM interests ORDER BY RAND() LIMIT 14;
-- Assign interests to profile 11
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 11, interest_id FROM interests ORDER BY RAND() LIMIT 7;
-- Assign interests to profile 12
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 12, interest_id FROM interests ORDER BY RAND() LIMIT 10;
-- Assign interests to profile 13
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 13, interest_id FROM interests ORDER BY RAND() LIMIT 9;
-- Assign interests to profile 14
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 14, interest_id FROM interests ORDER BY RAND() LIMIT 12;
-- Assign interests to profile 15
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 15, interest_id FROM interests ORDER BY RAND() LIMIT 8;
-- Assign interests to profile 16
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 16, interest_id FROM interests ORDER BY RAND() LIMIT 11;
-- Assign interests to profile 17
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 17, interest_id FROM interests ORDER BY RAND() LIMIT 6;
-- Assign interests to profile 18
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 18, interest_id FROM interests ORDER BY RAND() LIMIT 13;
-- Assign interests to profile 19
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 19, interest_id FROM interests ORDER BY RAND() LIMIT 9;
-- Assign interests to profile 20
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 20, interest_id FROM interests ORDER BY RAND() LIMIT 10;
-- Assign interests to profile 21
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 21, interest_id FROM interests ORDER BY RAND() LIMIT 8;
-- Assign interests to profile 22
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 22, interest_id FROM interests ORDER BY RAND() LIMIT 14;
-- Assign interests to profile 23
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 23, interest_id FROM interests ORDER BY RAND() LIMIT 7;
-- Assign interests to profile 24
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 24, interest_id FROM interests ORDER BY RAND() LIMIT 11;
-- Assign interests to profile 25
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 25, interest_id FROM interests ORDER BY RAND() LIMIT 9;
-- Assign interests to profile 26
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 26, interest_id FROM interests ORDER BY RAND() LIMIT 12;
-- Assign interests to profile 27
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 27, interest_id FROM interests ORDER BY RAND() LIMIT 6;
-- Assign interests to profile 28
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 28, interest_id FROM interests ORDER BY RAND() LIMIT 13;
-- Assign interests to profile 29
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 29, interest_id FROM interests ORDER BY RAND() LIMIT 8;
-- Assign interests to profile 30
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 30, interest_id FROM interests ORDER BY RAND() LIMIT 10;
-- Assign interests to profile 31
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 31, interest_id FROM interests ORDER BY RAND() LIMIT 9;
-- Assign interests to profile 32
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 32, interest_id FROM interests ORDER BY RAND() LIMIT 11;
-- Assign interests to profile 33
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 33, interest_id FROM interests ORDER BY RAND() LIMIT 7;
-- Assign interests to profile 34
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 34, interest_id FROM interests ORDER BY RAND() LIMIT 12;
-- Assign interests to profile 35
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 35, interest_id FROM interests ORDER BY RAND() LIMIT 8;
-- Assign interests to profile 36
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 36, interest_id FROM interests ORDER BY RAND() LIMIT 14;
-- Assign interests to profile 37
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 37, interest_id FROM interests ORDER BY RAND() LIMIT 6;
-- Assign interests to profile 38
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 38, interest_id FROM interests ORDER BY RAND() LIMIT 13;
-- Assign interests to profile 39
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 39, interest_id FROM interests ORDER BY RAND() LIMIT 9;
-- Assign interests to profile 40
INSERT IGNORE INTO profile_interests (profile_id, interest_id) SELECT 40, interest_id FROM interests ORDER BY RAND() LIMIT 10;

-- Show summary
SELECT COUNT(*) as 'Total Interest Assignments' FROM profile_interests;
SELECT
  p.id,
  p.first_name,
  COUNT(pi.interest_id) as num_interests
FROM profiles p
LEFT JOIN profile_interests pi ON p.id = pi.profile_id
GROUP BY p.id, p.first_name
ORDER BY p.id
LIMIT 10;
