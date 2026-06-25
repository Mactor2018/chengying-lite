CREATE DATABASE IF NOT EXISTS carebridge DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE carebridge;

DROP TABLE IF EXISTS auditlog;
DROP TABLE IF EXISTS carerecordauditlog;
DROP TABLE IF EXISTS carerecord;
DROP TABLE IF EXISTS serviceinquiry;
DROP TABLE IF EXISTS chatmessage;
DROP TABLE IF EXISTS participant;
DROP TABLE IF EXISTS conversation;
DROP TABLE IF EXISTS completionlog;
DROP TABLE IF EXISTS scheduleevent;
DROP TABLE IF EXISTS appointmentrequest;
DROP TABLE IF EXISTS groupmembership;
DROP TABLE IF EXISTS internalgroup;
DROP TABLE IF EXISTS residentfriendship;
DROP TABLE IF EXISTS residentaccount;
DROP TABLE IF EXISTS staffassignment;
DROP TABLE IF EXISTS familybinding;
DROP TABLE IF EXISTS resident;
DROP TABLE IF EXISTS account;

CREATE TABLE account (
    accountid INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE,
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
    birthdate DATE,
    hometown VARCHAR(100),
    roomnumber VARCHAR(50) NOT NULL,
    bednumber VARCHAR(50) NOT NULL,
    floorname VARCHAR(50) NOT NULL,
    carelevel VARCHAR(50) NOT NULL,
    healthtags TEXT,
    admissiondate DATE NOT NULL,
    residentstatus VARCHAR(30) NOT NULL DEFAULT 'Active',
    emergencycontact VARCHAR(100),
    createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (age BETWEEN 60 AND 120)
) ENGINE=InnoDB;

CREATE TABLE residentaccount (
    residentaccountid INT PRIMARY KEY AUTO_INCREMENT,
    residentid INT NOT NULL,
    accountid INT NOT NULL,
    createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_residentaccount_resident (residentid),
    UNIQUE KEY uq_residentaccount_account (accountid),
    FOREIGN KEY (residentid) REFERENCES resident(residentid) ON DELETE CASCADE,
    FOREIGN KEY (accountid) REFERENCES account(accountid) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE residentfriendship (
    friendshipid INT PRIMARY KEY AUTO_INCREMENT,
    residentid INT NOT NULL,
    friendresidentid INT NOT NULL,
    friendstatus VARCHAR(30) NOT NULL DEFAULT 'Accepted',
    createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_residentfriendship_pair (residentid, friendresidentid),
    FOREIGN KEY (residentid) REFERENCES resident(residentid) ON DELETE CASCADE,
    FOREIGN KEY (friendresidentid) REFERENCES resident(residentid) ON DELETE CASCADE,
    CHECK (residentid <> friendresidentid)
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
    staffscheduleflag TINYINT(1) NOT NULL DEFAULT 0,
    healthattachmentflag TINYINT(1) NOT NULL DEFAULT 0,
    createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_familybinding_resident_account (residentid, accountid),
    FOREIGN KEY (residentid) REFERENCES resident(residentid) ON DELETE CASCADE,
    FOREIGN KEY (accountid) REFERENCES account(accountid) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE staffassignment (
    assignid INT PRIMARY KEY AUTO_INCREMENT,
    residentid INT NOT NULL,
    accountid INT NOT NULL,
    responsibility VARCHAR(50) NOT NULL,
    startdate DATE NOT NULL,
    enddate DATE,
    assignstatus VARCHAR(30) NOT NULL DEFAULT 'Active',
    UNIQUE KEY uq_staffassignment_resident_account_responsibility (residentid, accountid, responsibility),
    FOREIGN KEY (residentid) REFERENCES resident(residentid) ON DELETE CASCADE,
    FOREIGN KEY (accountid) REFERENCES account(accountid) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE internalgroup (
    groupid INT PRIMARY KEY AUTO_INCREMENT,
    groupname VARCHAR(100) NOT NULL,
    grouptype VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE groupmembership (
    groupmembershipid INT PRIMARY KEY AUTO_INCREMENT,
    groupid INT NOT NULL,
    accountid INT NOT NULL,
    groupmemberrole VARCHAR(50) NOT NULL DEFAULT 'Member',
    createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_groupmembership_group_account (groupid, accountid),
    FOREIGN KEY (groupid) REFERENCES internalgroup(groupid) ON DELETE CASCADE,
    FOREIGN KEY (accountid) REFERENCES account(accountid) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE auditlog (
    logid INT PRIMARY KEY AUTO_INCREMENT,
    accountid INT NULL,
    actionname VARCHAR(100) NOT NULL,
    targettype VARCHAR(100) NOT NULL,
    targetid INT NOT NULL,
    detail TEXT,
    ipaddress VARCHAR(100),
    createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (accountid) REFERENCES account(accountid) ON DELETE SET NULL
) ENGINE=InnoDB;
