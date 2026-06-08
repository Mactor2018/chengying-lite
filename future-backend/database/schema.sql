CREATE DATABASE IF NOT EXISTS carebridge;
USE carebridge;

DROP TABLE IF EXISTS auditlog;
DROP TABLE IF EXISTS dailyreport;
DROP TABLE IF EXISTS healthobservation;
DROP TABLE IF EXISTS carerecord;
DROP TABLE IF EXISTS completionlog;
DROP TABLE IF EXISTS appointmentrequest;
DROP TABLE IF EXISTS scheduleevent;
DROP TABLE IF EXISTS serviceinquiry;
DROP TABLE IF EXISTS chatmessage;
DROP TABLE IF EXISTS participant;
DROP TABLE IF EXISTS conversation;
DROP TABLE IF EXISTS staffassignment;
DROP TABLE IF EXISTS familybinding;
DROP TABLE IF EXISTS resident;
DROP TABLE IF EXISTS account;

CREATE TABLE account (
    accountid INT PRIMARY KEY AUTO_INCREMENT,
    fullname VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL UNIQUE,
    passhash VARCHAR(255) NOT NULL,
    rolename VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    avatarurl VARCHAR(255),
    accountstatus VARCHAR(30) NOT NULL DEFAULT 'Active',
    createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE resident (
    residentid INT PRIMARY KEY AUTO_INCREMENT,
    fullname VARCHAR(100) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    age INT NOT NULL,
    roomnumber VARCHAR(50) NOT NULL,
    bednumber VARCHAR(50) NOT NULL,
    floorname VARCHAR(50) NOT NULL,
    carelevel VARCHAR(50) NOT NULL,
    healthtags TEXT,
    admissiondate DATE NOT NULL,
    residentstatus VARCHAR(30) NOT NULL DEFAULT 'Active',
    emergencycontact VARCHAR(100),
    createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE familybinding (
    bindingid INT PRIMARY KEY AUTO_INCREMENT,
    residentid INT NOT NULL,
    accountid INT NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    primaryflag TINYINT(1) NOT NULL DEFAULT 0,
    emergencyflag TINYINT(1) NOT NULL DEFAULT 0,
    reportflag TINYINT(1) NOT NULL DEFAULT 1,
    appointmentflag TINYINT(1) NOT NULL DEFAULT 1,
    createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (residentid) REFERENCES resident(residentid),
    FOREIGN KEY (accountid) REFERENCES account(accountid)
) ENGINE=InnoDB;

CREATE TABLE staffassignment (
    assignid INT PRIMARY KEY AUTO_INCREMENT,
    residentid INT NOT NULL,
    accountid INT NOT NULL,
    responsibility VARCHAR(50) NOT NULL,
    startdate DATE NOT NULL,
    enddate DATE,
    assignstatus VARCHAR(30) NOT NULL DEFAULT 'Active',
    FOREIGN KEY (residentid) REFERENCES resident(residentid),
    FOREIGN KEY (accountid) REFERENCES account(accountid)
) ENGINE=InnoDB;

CREATE TABLE conversation (
    conversationid INT PRIMARY KEY AUTO_INCREMENT,
    residentid INT NOT NULL,
    conversationtype VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    conversationstatus VARCHAR(30) NOT NULL DEFAULT 'active',
    createdby INT NOT NULL,
    createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (residentid) REFERENCES resident(residentid),
    FOREIGN KEY (createdby) REFERENCES account(accountid)
) ENGINE=InnoDB;

CREATE TABLE participant (
    participantid INT PRIMARY KEY AUTO_INCREMENT,
    conversationid INT NOT NULL,
    accountid INT NOT NULL,
    participantrole VARCHAR(50) NOT NULL,
    joinedat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversationid) REFERENCES conversation(conversationid),
    FOREIGN KEY (accountid) REFERENCES account(accountid)
) ENGINE=InnoDB;

CREATE TABLE chatmessage (
    messageid INT PRIMARY KEY AUTO_INCREMENT,
    conversationid INT NOT NULL,
    senderid INT NOT NULL,
    messagetype VARCHAR(50) NOT NULL DEFAULT 'Text',
    content TEXT NOT NULL,
    attachmenturl VARCHAR(255),
    referencetype VARCHAR(50),
    referenceid INT,
    unreadflag TINYINT(1) NOT NULL DEFAULT 1,
    createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversationid) REFERENCES conversation(conversationid),
    FOREIGN KEY (senderid) REFERENCES account(accountid)
) ENGINE=InnoDB;

CREATE TABLE serviceinquiry (
    inquiryid INT PRIMARY KEY AUTO_INCREMENT,
    residentid INT NOT NULL,
    conversationid INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    createdby INT NOT NULL,
    assignedto INT NOT NULL,
    inquirystatus VARCHAR(50) NOT NULL DEFAULT 'Pending',
    priority VARCHAR(30) NOT NULL DEFAULT 'Normal',
    createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    closedat DATETIME,
    FOREIGN KEY (residentid) REFERENCES resident(residentid),
    FOREIGN KEY (conversationid) REFERENCES conversation(conversationid),
    FOREIGN KEY (createdby) REFERENCES account(accountid),
    FOREIGN KEY (assignedto) REFERENCES account(accountid)
) ENGINE=InnoDB;

CREATE TABLE scheduleevent (
    scheduleid INT PRIMARY KEY AUTO_INCREMENT,
    residentid INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    scheduletype VARCHAR(50) NOT NULL,
    starttime DATETIME NOT NULL,
    endtime DATETIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    staffid INT NOT NULL,
    visibility VARCHAR(50) NOT NULL,
    repeatrule VARCHAR(100) NOT NULL DEFAULT 'One-time',
    schedulestatus VARCHAR(50) NOT NULL DEFAULT 'Planned',
    createdby INT NOT NULL,
    createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (residentid) REFERENCES resident(residentid),
    FOREIGN KEY (staffid) REFERENCES account(accountid),
    FOREIGN KEY (createdby) REFERENCES account(accountid)
) ENGINE=InnoDB;

CREATE TABLE appointmentrequest (
    appointmentid INT PRIMARY KEY AUTO_INCREMENT,
    residentid INT NOT NULL,
    familyid INT NOT NULL,
    appointmenttype VARCHAR(50) NOT NULL,
    starttime DATETIME NOT NULL,
    endtime DATETIME NOT NULL,
    purpose TEXT NOT NULL,
    appointmentstatus VARCHAR(50) NOT NULL DEFAULT 'Pending',
    reviewedby INT,
    reviewcomment TEXT,
    createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (residentid) REFERENCES resident(residentid),
    FOREIGN KEY (familyid) REFERENCES account(accountid),
    FOREIGN KEY (reviewedby) REFERENCES account(accountid)
) ENGINE=InnoDB;

CREATE TABLE completionlog (
    completionid INT PRIMARY KEY AUTO_INCREMENT,
    scheduleid INT NOT NULL,
    accountid INT NOT NULL,
    completionstatus VARCHAR(50) NOT NULL,
    completionnote TEXT,
    completedat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scheduleid) REFERENCES scheduleevent(scheduleid),
    FOREIGN KEY (accountid) REFERENCES account(accountid)
) ENGINE=InnoDB;

CREATE TABLE carerecord (
    recordid INT PRIMARY KEY AUTO_INCREMENT,
    residentid INT NOT NULL,
    caregiverid INT NOT NULL,
    recorddate DATE NOT NULL,
    mealstatus VARCHAR(50) NOT NULL,
    sleepstatus VARCHAR(50) NOT NULL,
    moodstatus VARCHAR(50) NOT NULL,
    activitystatus VARCHAR(50) NOT NULL,
    hygienestatus VARCHAR(50) NOT NULL,
    mobilitystatus VARCHAR(50) NOT NULL,
    carenotes TEXT,
    familyflag TINYINT(1) NOT NULL DEFAULT 1,
    createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (residentid) REFERENCES resident(residentid),
    FOREIGN KEY (caregiverid) REFERENCES account(accountid)
) ENGINE=InnoDB;

CREATE TABLE healthobservation (
    observationid INT PRIMARY KEY AUTO_INCREMENT,
    residentid INT NOT NULL,
    nurseid INT NOT NULL,
    recordtime DATETIME NOT NULL,
    bloodpressure VARCHAR(50) NOT NULL,
    heartrate INT NOT NULL,
    temperature DECIMAL(4,1) NOT NULL,
    bloodsugar DECIMAL(5,2) NOT NULL,
    medicationstatus VARCHAR(50) NOT NULL,
    medicalnotes TEXT,
    familyflag TINYINT(1) NOT NULL DEFAULT 1,
    createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (residentid) REFERENCES resident(residentid),
    FOREIGN KEY (nurseid) REFERENCES account(accountid)
) ENGINE=InnoDB;

CREATE TABLE dailyreport (
    reportid INT PRIMARY KEY AUTO_INCREMENT,
    residentid INT NOT NULL,
    reportdate DATE NOT NULL,
    dietsummary TEXT NOT NULL,
    sleepsummary TEXT NOT NULL,
    moodsummary TEXT NOT NULL,
    activitysummary TEXT NOT NULL,
    healthsummary TEXT NOT NULL,
    familysummary TEXT,
    generatedby INT NOT NULL,
    reviewedby INT,
    reportstatus VARCHAR(50) NOT NULL DEFAULT 'Generated',
    createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (residentid) REFERENCES resident(residentid),
    FOREIGN KEY (generatedby) REFERENCES account(accountid),
    FOREIGN KEY (reviewedby) REFERENCES account(accountid)
) ENGINE=InnoDB;

CREATE TABLE auditlog (
    logid INT PRIMARY KEY AUTO_INCREMENT,
    accountid INT NOT NULL,
    actionname VARCHAR(100) NOT NULL,
    targettype VARCHAR(100) NOT NULL,
    targetid INT NOT NULL,
    detail TEXT,
    ipaddress VARCHAR(100),
    createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (accountid) REFERENCES account(accountid)
) ENGINE=InnoDB;
