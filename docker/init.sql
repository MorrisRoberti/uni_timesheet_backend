-- MySQL dump 10.13  Distrib 8.0.30, for Win64 (x86_64)
--
-- Host: localhost    Database: uni_timesheet
-- ------------------------------------------------------
-- Server version	5.5.5-10.3.31-MariaDB-1:10.3.31+maria~focal

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE IF NOT EXISTS uni_timesheet;

USE uni_timesheet;
--
-- Table structure for table `hour_logs`
--

DROP TABLE IF EXISTS `hour_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hour_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `user_subject_id` int(11) NOT NULL,
  `hours` int(11) NOT NULL,
  `minutes` int(11) NOT NULL,
  `date` date NOT NULL,
  `weekly_log_id` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `user_id` (`user_id`),
  KEY `user_subject_id` (`user_subject_id`),
  KEY `weekly_log_id` (`weekly_log_id`),
  CONSTRAINT `hour_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `hour_logs_ibfk_2` FOREIGN KEY (`user_subject_id`) REFERENCES `user_subjects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `hour_logs_ibfk_3` FOREIGN KEY (`weekly_log_id`) REFERENCES `weekly_log_table` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hour_logs`
--

LOCK TABLES `hour_logs` WRITE;
/*!40000 ALTER TABLE `hour_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `hour_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subjects`
--

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;
INSERT INTO `subjects` VALUES (1,'Architettura degli elaboratori','2024-01-08 12:36:45','2024-01-08 12:36:45',NULL),(2,'Elementi di logica e strutture discrete','2024-01-08 12:36:45','2024-01-08 12:36:45',NULL);
/*!40000 ALTER TABLE `subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_config`
--

DROP TABLE IF EXISTS `user_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `faculty` varchar(255) DEFAULT NULL,
  `active` tinyint(1) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_config_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_config`
--

LOCK TABLES `user_config` WRITE;
/*!40000 ALTER TABLE `user_config` DISABLE KEYS */;
INSERT INTO `user_config` VALUES (1,1,'Informatica',1,'2024-01-08 12:36:45','2024-01-08 12:36:45',NULL),(2,2,'Informatica',1,'2024-02-29 13:35:22','2024-02-29 13:35:22',NULL);
/*!40000 ALTER TABLE `user_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_subjects`
--

DROP TABLE IF EXISTS `user_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `cfu` int(11) NOT NULL,
  `semester` int(11) DEFAULT NULL,
  `aa_left` year(4) NOT NULL,
  `aa_right` year(4) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `user_id` (`user_id`),
  KEY `subject_id` (`subject_id`),
  CONSTRAINT `user_subjects_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_subjects_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_subjects`
--

LOCK TABLES `user_subjects` WRITE;
/*!40000 ALTER TABLE `user_subjects` DISABLE KEYS */;
INSERT INTO `user_subjects` VALUES (1,1,1,6,1,2023,2024,'2024-08-01 10:10:10','2024-08-01 10:10:10',NULL,NULL);
/*!40000 ALTER TABLE `user_subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Patrick','Bateman','patrick.bateman@gmail.com','admin','2024-01-08 12:36:45','2024-01-08 12:36:45',NULL),(2,'morris','roberti','test@email4.com','$2b$10$2p.q9vWODnCU6qQR5QhRfeaJxNz59vD5b4Y5EaVgxVSUzUZn7Hrfq','2024-02-29 13:35:22','2024-02-29 13:35:22',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `weekly_log_table`
--

DROP TABLE IF EXISTS `weekly_log_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `weekly_log_table` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `week_start` date NOT NULL,
  `week_end` date NOT NULL,
  `hours` int(11) NOT NULL,
  `minutes` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `weekly_log_table_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `weekly_log_table`
--

LOCK TABLES `weekly_log_table` WRITE;
/*!40000 ALTER TABLE `weekly_log_table` DISABLE KEYS */;
INSERT INTO `weekly_log_table` VALUES (1,1,'2024-01-08','2024-01-14',0,0,'2024-08-01 10:10:10','2024-08-01 10:10:10',NULL);
/*!40000 ALTER TABLE `weekly_log_table` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'uni_timesheet'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-03-01  0:14:30
