USE carebridge;

INSERT INTO account (fullname, phone, passhash, rolename, department, accountstatus) VALUES
('Grace Turner', '555-0101', 'demo-hash-grace', 'Nursing Supervisor', 'Care Management', 'Active'),
('Mia Johnson', '555-0102', 'demo-hash-mia', 'Caregiver', 'Floor A', 'Active'),
('David Lee', '555-0103', 'demo-hash-david', 'Nurse', 'Medical Team', 'Active'),
('Olivia Chen', '555-0104', 'demo-hash-olivia', 'Family Member', 'Family Portal', 'Active'),
('Aaron Patel', '555-0105', 'demo-hash-aaron', 'Caregiver', 'Floor B', 'Frozen'),
('Sophia Nguyen', '555-0106', 'demo-hash-sophia', 'Nurse', 'Medical Team', 'Active'),
('Noah Williams', '555-0107', 'demo-hash-noah', 'Family Member', 'Family Portal', 'Active');

INSERT INTO resident (fullname, gender, age, roomnumber, bednumber, floorname, carelevel, healthtags, admissiondate, residentstatus, emergencycontact) VALUES
('Eleanor Carter', 'Female', 82, 'A-308', 'Bed 2', 'Floor A', 'Level II Assisted', 'Hypertension, Mobility Risk', '2025-09-16', 'Active', 'Olivia Chen'),
('Robert Williams', 'Male', 76, 'B-112', 'Bed 1', 'Floor B', 'Level I Assisted', 'Diabetes, Medication Reminder', '2026-01-08', 'Active', 'Noah Williams'),
('Margaret Brown', 'Female', 88, 'C-205', 'Bed 3', 'Floor C', 'Level III Intensive', 'Memory Care, Fall Risk', '2024-11-21', 'Active', 'Emma Brown'),
('Samuel Davis', 'Male', 80, 'A-216', 'Bed 1', 'Floor A', 'Level II Assisted', 'Rehabilitation, Low Sodium Diet', '2025-06-03', 'Active', 'Ava Davis');

INSERT INTO familybinding (residentid, accountid, relationship, primaryflag, emergencyflag, reportflag, appointmentflag) VALUES
(1, 4, 'Daughter', 1, 1, 1, 1),
(2, 7, 'Son', 1, 1, 1, 1),
(3, 4, 'Niece', 0, 0, 1, 0);

INSERT INTO staffassignment (residentid, accountid, responsibility, startdate, assignstatus) VALUES
(1, 2, 'maincaregiver', '2026-01-01', 'Active'),
(1, 3, 'nurse', '2026-01-01', 'Active'),
(1, 1, 'supervisor', '2026-01-01', 'Active'),
(2, 5, 'maincaregiver', '2026-01-08', 'Active'),
(2, 3, 'nurse', '2026-01-08', 'Active'),
(3, 6, 'nurse', '2025-05-12', 'Active');

INSERT INTO conversation (residentid, conversationtype, title, conversationstatus, createdby) VALUES
(1, 'Family-staff conversation', 'Daily care update', 'pendingreply', 4),
(2, 'Service inquiry', 'Activity absence question', 'processing', 7),
(3, 'Staff internal conversation', 'Fall-risk mobility review', 'active', 2);

INSERT INTO participant (conversationid, accountid, participantrole) VALUES
(1, 4, 'family'),
(1, 2, 'caregiver'),
(2, 7, 'family'),
(2, 5, 'caregiver'),
(3, 2, 'caregiver'),
(3, 6, 'nurse');

INSERT INTO chatmessage (conversationid, senderid, messagetype, content, unreadflag) VALUES
(1, 4, 'Text', 'Could you tell me why Mom looked tired during yesterday call?', 1),
(1, 2, 'Text', 'She slept well overall but woke once at night. I will keep watching her energy.', 0),
(1, 4, 'Text', 'Please let me know if the blood pressure reading changes.', 1),
(2, 7, 'Text', 'Why did Dad not join the activity today?', 1),
(2, 1, 'Text', 'The caregiver is checking his lunch and rest notes before replying.', 0),
(3, 2, 'Text', 'Margaret needed two-person assistance near the garden path.', 1);

INSERT INTO serviceinquiry (residentid, conversationid, title, description, createdby, assignedto, inquirystatus, priority) VALUES
(2, 2, 'Activity absence question', 'Family asked why Robert did not join the afternoon activity.', 7, 5, 'Processing', 'Normal'),
(1, 1, 'Blood pressure follow-up', 'Family wants explanation if blood pressure is higher than usual.', 4, 3, 'Pending', 'High'),
(3, 3, 'Fall-risk mobility review', 'Staff requested supervisor review for mobility support.', 2, 1, 'Supervisor Review', 'High');

INSERT INTO scheduleevent (residentid, title, scheduletype, starttime, endtime, location, staffid, visibility, repeatrule, schedulestatus, createdby) VALUES
(1, 'Blood pressure measurement', 'Daily care task', '2026-06-08 09:00:00', '2026-06-08 09:15:00', 'Room A-308', 3, 'familyvisible', 'Daily', 'Planned', 1),
(1, 'Calligraphy activity', 'Activity schedule', '2026-06-08 10:00:00', '2026-06-08 10:45:00', 'Activity Room 2', 2, 'allvisible', 'Weekly', 'Planned', 1),
(1, 'Daughter video call', 'Video call appointment', '2026-06-08 15:00:00', '2026-06-08 15:30:00', 'Family Booth', 2, 'allvisible', 'One-time', 'Approved', 1),
(2, 'Medication reminder', 'Medical schedule', '2026-06-08 20:00:00', '2026-06-08 20:10:00', 'Room B-112', 3, 'familyvisible', 'Daily', 'Planned', 1),
(3, 'Walking support', 'Daily care task', '2026-06-08 16:00:00', '2026-06-08 16:20:00', 'Garden', 2, 'staffonly', 'Daily', 'Planned', 1);

INSERT INTO appointmentrequest (residentid, familyid, appointmenttype, starttime, endtime, purpose, appointmentstatus, reviewedby, reviewcomment) VALUES
(2, 7, 'Visit', '2026-06-09 14:30:00', '2026-06-09 15:00:00', 'Weekend family visit review', 'Pending', NULL, NULL),
(3, 4, 'Video call', '2026-06-08 19:00:00', '2026-06-08 19:30:00', 'Evening family check-in', 'Approved', 1, 'Caregiver support available'),
(1, 4, 'Visit', '2026-06-10 10:00:00', '2026-06-10 10:30:00', 'Discuss daily care report', 'Rejected', 1, 'Room unavailable');

INSERT INTO completionlog (scheduleid, accountid, completionstatus, completionnote, completedat) VALUES
(1, 3, 'Completed', 'Blood pressure recorded as stable.', '2026-06-08 09:12:00'),
(2, 2, 'Completed', 'Resident joined activity.', '2026-06-08 10:45:00'),
(4, 3, 'Pending', 'Scheduled for evening medication.', '2026-06-08 12:00:00');

INSERT INTO carerecord (residentid, caregiverid, recorddate, mealstatus, sleepstatus, moodstatus, activitystatus, hygienestatus, mobilitystatus, carenotes, familyflag) VALUES
(1, 2, '2026-06-08', 'Normal', 'Good', 'Stable', 'Joined activity', 'Completed', 'Needs assistance', 'Asked to video call family this weekend.', 1),
(2, 5, '2026-06-08', 'Ate less', 'Average', 'Stable', 'Absent', 'Completed', 'Independent', 'Preferred resting after lunch.', 1),
(3, 2, '2026-06-08', 'Normal', 'Woke up twice', 'Anxious', 'Short walk', 'Completed', 'Unstable walking', 'Supervisor review recommended for fall-risk note.', 0);

INSERT INTO healthobservation (residentid, nurseid, recordtime, bloodpressure, heartrate, temperature, bloodsugar, medicationstatus, medicalnotes, familyflag) VALUES
(1, 3, '2026-06-08 09:08:00', '135/85', 78, 36.6, 5.80, 'Taken', 'Condition stable.', 1),
(2, 3, '2026-06-08 08:45:00', '128/80', 74, 36.5, 7.20, 'Taken', 'Blood sugar requires routine tracking.', 1),
(3, 6, '2026-06-08 10:20:00', '142/90', 82, 36.7, 6.10, 'Taken', 'Fall-risk review needed.', 0);

INSERT INTO dailyreport (residentid, reportdate, dietsummary, sleepsummary, moodsummary, activitysummary, healthsummary, familysummary, generatedby, reviewedby, reportstatus) VALUES
(1, '2026-06-08', 'Breakfast and lunch were normal.', 'Slept well and woke once.', 'Mood was stable.', 'Joined the morning calligraphy activity.', 'Blood pressure was 135/85.', 'Resident mentioned wanting a family video call.', 1, 1, 'Reviewed'),
(2, '2026-06-08', 'Ate less than usual at lunch.', 'Sleep quality was average.', 'Mood stayed stable.', 'Did not join the afternoon activity.', 'Blood sugar was tracked by nurse.', 'Staff will encourage a short walk tomorrow.', 1, NULL, 'Generated'),
(3, '2026-06-08', 'Meal status was normal.', 'Woke up twice overnight.', 'Mood was anxious.', 'Completed a short assisted walk.', 'Nurse requested fall-risk review.', 'Some notes are staff-only.', 1, NULL, 'Generated');

INSERT INTO auditlog (accountid, actionname, targettype, targetid, detail, ipaddress) VALUES
(1, 'Generated daily report', 'resident', 1, 'Report created for Eleanor Carter.', '127.0.0.1'),
(2, 'Submitted care record', 'resident', 3, 'Caregiver submitted special mobility note.', '127.0.0.1'),
(1, 'Reviewed appointment', 'appointment', 2, 'Video call request approved.', '127.0.0.1');
