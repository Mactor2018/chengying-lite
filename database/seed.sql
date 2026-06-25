USE carebridge;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS carerecordauditlog;
DROP TABLE IF EXISTS carerecord;
DROP TABLE IF EXISTS serviceinquiry;
DROP TABLE IF EXISTS chatmessage;
DROP TABLE IF EXISTS participant;
DROP TABLE IF EXISTS conversation;
DROP TABLE IF EXISTS completionlog;
DROP TABLE IF EXISTS scheduleevent;
DROP TABLE IF EXISTS appointmentrequest;
TRUNCATE TABLE auditlog;
TRUNCATE TABLE groupmembership;
TRUNCATE TABLE internalgroup;
TRUNCATE TABLE residentfriendship;
TRUNCATE TABLE residentaccount;
TRUNCATE TABLE staffassignment;
TRUNCATE TABLE familybinding;
TRUNCATE TABLE resident;
TRUNCATE TABLE account;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO account
    (username, fullname, phone, passhash, rolename, department, accountstatus)
VALUES
    ('admin', 'Liam Brooks', '555-0100', '123456', 'Admin', 'Operations', 'Active'),
    ('supervisor', 'Grace Turner', '555-0101', '123456', 'Nursing Supervisor', 'Department 1 - Integrated Care Unit', 'Active'),
    ('nurse.david', 'David Lee', '555-0102', '123456', 'Nurse', 'Department 1 - Integrated Care Unit', 'Active'),
    ('nurse.sophia', 'Sophia Nguyen', '555-0103', '123456', 'Nurse', 'Department 1 - Integrated Care Unit', 'Active'),
    ('nurse.emily', 'Emily Roberts', '555-0104', '123456', 'Nurse', 'Department 1 - Integrated Care Unit', 'Active'),
    ('caregiver.mia', 'Mia Johnson', '555-0105', '123456', 'Caregiver', 'Department 1 - Integrated Care Unit', 'Active'),
    ('caregiver.aaron', 'Aaron Patel', '555-0106', '123456', 'Caregiver', 'Department 1 - Integrated Care Unit', 'Active'),
    ('caregiver.ava', 'Ava Martin', '555-0107', '123456', 'Caregiver', 'Department 1 - Integrated Care Unit', 'Active'),
    ('doctor.nora', 'Dr. Nora Singh', '555-0108', '123456', 'Doctor', 'Neurology', 'Active'),
    ('doctor.alan', 'Dr. Alan Kim', '555-0109', '123456', 'Doctor', 'Cardiology', 'Active'),
    ('doctor.priya', 'Dr. Priya Shah', '555-0110', '123456', 'Doctor', 'Rehabilitation', 'Active'),
    ('doctor.michael', 'Dr. Michael Brown', '555-0111', '123456', 'Doctor', 'Internal Medicine', 'Active'),
    ('doctor.lisa', 'Dr. Lisa Chen', '555-0112', '123456', 'Doctor', 'Endocrinology', 'Active'),
    ('doctor.kevin', 'Dr. Kevin Moore', '555-0113', '123456', 'Doctor', 'Nutrition', 'Active'),
    ('doctor.rachel', 'Dr. Rachel Adams', '555-0114', '123456', 'Doctor', 'Speech Therapy', 'Active'),
    ('family.olivia', 'Olivia Chen', '555-0115', '123456', 'Family Member', 'Family Portal', 'Active'),
    ('family.noah', 'Noah Williams', '555-0116', '123456', 'Family Member', 'Family Portal', 'Active'),
    ('family.ethan', 'Ethan King', '555-0117', '123456', 'Family Member', 'Family Portal', 'Active'),
    ('elder.eleanor', 'Eleanor Carter', '555-0118', '123456', 'Elderly Resident', 'Resident Portal', 'Active'),
    ('elder.robert', 'Robert Williams', '555-0119', '123456', 'Elderly Resident', 'Resident Portal', 'Active'),
    ('elder.helen', 'Helen Moore', '555-0120', '123456', 'Elderly Resident', 'Resident Portal', 'Active');

INSERT INTO resident
    (fullname, gender, age, birthdate, hometown, roomnumber, bednumber, floorname, carelevel, healthtags, admissiondate, residentstatus, emergencycontact)
VALUES
    ('Eleanor Carter', 'Female', 82, '1944-03-12', 'Wilmington, DE', 'A-308', 'Bed 2', 'Floor A', 'Level II Assisted', 'hypertension, mobility support, memory check', '2026-01-10', 'Active', 'Olivia Chen'),
    ('Robert Williams', 'Male', 76, '1950-07-04', 'Newark, DE', 'B-112', 'Bed 1', 'Floor B', 'Level I Assisted', 'diabetes, nutrition monitoring, cardiac review', '2026-01-14', 'Active', 'Noah Williams'),
    ('Helen Moore', 'Female', 84, '1942-05-08', 'Philadelphia, PA', 'B-209', 'Bed 2', 'Floor B', 'Level III Intensive', 'stroke recovery, speech therapy, fall risk', '2026-01-18', 'Active', 'Ethan King');

INSERT INTO residentaccount (residentid, accountid)
VALUES
    (1, 19),
    (2, 20),
    (3, 21);

INSERT INTO familybinding
    (residentid, accountid, relationship, primaryflag, emergencyflag, reportflag, appointmentflag, staffscheduleflag, healthattachmentflag)
VALUES
    (1, 16, 'Daughter', 1, 1, 1, 1, 0, 1),
    (2, 17, 'Son', 1, 1, 1, 1, 0, 0),
    (3, 18, 'Grandson', 1, 1, 1, 1, 1, 1);

INSERT INTO staffassignment
    (residentid, accountid, responsibility, startdate, assignstatus)
VALUES
    (1, 6, 'maincaregiver', '2026-01-10', 'Active'),
    (1, 3, 'nurse', '2026-01-10', 'Active'),
    (1, 2, 'supervisor', '2026-01-10', 'Active'),
    (1, 10, 'doctor', '2026-01-10', 'Active'),
    (1, 9, 'doctor', '2026-01-10', 'Active'),
    (1, 11, 'doctor', '2026-01-10', 'Active'),
    (1, 12, 'doctor', '2026-01-10', 'Active'),
    (2, 7, 'maincaregiver', '2026-01-14', 'Active'),
    (2, 4, 'nurse', '2026-01-14', 'Active'),
    (2, 2, 'supervisor', '2026-01-14', 'Active'),
    (2, 13, 'doctor', '2026-01-14', 'Active'),
    (2, 12, 'doctor', '2026-01-14', 'Active'),
    (2, 14, 'doctor', '2026-01-14', 'Active'),
    (3, 8, 'maincaregiver', '2026-01-18', 'Active'),
    (3, 5, 'nurse', '2026-01-18', 'Active'),
    (3, 2, 'supervisor', '2026-01-18', 'Active'),
    (3, 9, 'doctor', '2026-01-18', 'Active'),
    (3, 11, 'doctor', '2026-01-18', 'Active'),
    (3, 15, 'doctor', '2026-01-18', 'Active'),
    (3, 12, 'doctor', '2026-01-18', 'Active');

INSERT INTO residentfriendship
    (residentid, friendresidentid, friendstatus)
VALUES
    (1, 2, 'Accepted'),
    (2, 1, 'Accepted'),
    (1, 3, 'Accepted'),
    (3, 1, 'Accepted'),
    (2, 3, 'Pending'),
    (3, 2, 'Pending');

INSERT INTO internalgroup
    (groupname, grouptype, department)
VALUES
    ('Department 1 - Integrated Care Unit', 'Department', 'Department 1 - Integrated Care Unit'),
    ('Nursing Team - Department 1', 'Nursing Team', 'Department 1 - Integrated Care Unit'),
    ('Doctor Collaboration Board', 'Clinical Group', 'Department 1 - Integrated Care Unit'),
    ('Caregiver Team - Department 1', 'Care Team', 'Department 1 - Integrated Care Unit');

INSERT INTO groupmembership
    (groupid, accountid, groupmemberrole)
VALUES
    (1, 2, 'Nurse Manager'),
    (1, 3, 'Primary Nurse'),
    (1, 4, 'Primary Nurse'),
    (1, 5, 'Primary Nurse'),
    (1, 6, 'Caregiver'),
    (1, 7, 'Caregiver'),
    (1, 8, 'Caregiver'),
    (1, 9, 'Consulting Doctor'),
    (1, 10, 'Consulting Doctor'),
    (1, 11, 'Consulting Doctor'),
    (1, 12, 'Consulting Doctor'),
    (1, 13, 'Consulting Doctor'),
    (1, 14, 'Consulting Doctor'),
    (1, 15, 'Consulting Doctor'),
    (2, 2, 'Nurse Manager'),
    (2, 3, 'Primary Nurse'),
    (2, 4, 'Primary Nurse'),
    (2, 5, 'Primary Nurse'),
    (3, 9, 'Neurology'),
    (3, 10, 'Cardiology'),
    (3, 11, 'Rehabilitation'),
    (3, 12, 'Internal Medicine'),
    (3, 13, 'Endocrinology'),
    (3, 14, 'Nutrition'),
    (3, 15, 'Speech Therapy'),
    (4, 6, 'Caregiver'),
    (4, 7, 'Caregiver'),
    (4, 8, 'Caregiver');

INSERT INTO auditlog
    (accountid, actionname, targettype, targetid, detail, ipaddress)
VALUES
    (1, 'Seeded personnel module demo accounts', 'account', 21, 'Representative role accounts use password 123456.', '127.0.0.1'),
    (1, 'Seeded Department 1 resident network', 'resident', 3, 'Three patients with nurses, nurse manager, caregivers, family accounts, portal accounts, and multi-specialty doctors.', '127.0.0.1'),
    (1, 'Seeded graph relationship rows', 'staffassignment', 20, 'Patient care team, nursing management, doctor collaboration, and friendship graph data.', '127.0.0.1');
