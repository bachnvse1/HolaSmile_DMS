-- MySQL dump 10.13  Distrib 8.0.29, for Win64 (x86_64)
--
-- Host: localhost    Database: holasmile_dms
-- ------------------------------------------------------
-- Server version	8.0.29

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `__efmigrationshistory`
--

DROP TABLE IF EXISTS `__efmigrationshistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `__efmigrationshistory` (
  `MigrationId` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ProductVersion` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`MigrationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `__efmigrationshistory`
--

LOCK TABLES `__efmigrationshistory` WRITE;
/*!40000 ALTER TABLE `__efmigrationshistory` DISABLE KEYS */;
INSERT INTO `__efmigrationshistory` VALUES ('20250612102730_InitialCreate','8.0.6');
/*!40000 ALTER TABLE `__efmigrationshistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `administrators`
--

DROP TABLE IF EXISTS `administrators`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `administrators` (
  `AdministratorId` int NOT NULL AUTO_INCREMENT,
  `UserId` int NOT NULL,
  PRIMARY KEY (`AdministratorId`),
  KEY `IX_Administrators_UserId` (`UserId`),
  CONSTRAINT `FK_Administrators_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `administrators`
--

LOCK TABLES `administrators` WRITE;
/*!40000 ALTER TABLE `administrators` DISABLE KEYS */;
/*!40000 ALTER TABLE `administrators` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `AppointmentId` int NOT NULL AUTO_INCREMENT,
  `PatientId` int DEFAULT NULL,
  `DentistId` int NOT NULL,
  `Status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `IsNewPatient` tinyint(1) NOT NULL,
  `AppointmentType` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `AppointmentDate` date NOT NULL,
  `AppointmentTime` time NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `CreatedBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`AppointmentId`),
  KEY `IX_Appointments_DentistId` (`DentistId`),
  KEY `IX_Appointments_PatientId` (`PatientId`),
  CONSTRAINT `FK_Appointments_Dentists_DentistId` FOREIGN KEY (`DentistId`) REFERENCES `dentists` (`DentistId`) ON DELETE CASCADE,
  CONSTRAINT `FK_Appointments_Patients_PatientId` FOREIGN KEY (`PatientId`) REFERENCES `patients` (`PatientID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assistants`
--

DROP TABLE IF EXISTS `assistants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assistants` (
  `AssistantId` int NOT NULL AUTO_INCREMENT,
  `UserId` int NOT NULL,
  PRIMARY KEY (`AssistantId`),
  KEY `IX_Assistants_UserId` (`UserId`),
  CONSTRAINT `FK_Assistants_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assistants`
--

LOCK TABLES `assistants` WRITE;
/*!40000 ALTER TABLE `assistants` DISABLE KEYS */;
/*!40000 ALTER TABLE `assistants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dentists`
--

DROP TABLE IF EXISTS `dentists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dentists` (
  `DentistId` int NOT NULL AUTO_INCREMENT,
  `UserId` int NOT NULL,
  PRIMARY KEY (`DentistId`),
  KEY `IX_Dentists_UserId` (`UserId`),
  CONSTRAINT `FK_Dentists_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dentists`
--

LOCK TABLES `dentists` WRITE;
/*!40000 ALTER TABLE `dentists` DISABLE KEYS */;
/*!40000 ALTER TABLE `dentists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipmentmaintenances`
--

DROP TABLE IF EXISTS `equipmentmaintenances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipmentmaintenances` (
  `MaintenanceId` int NOT NULL AUTO_INCREMENT,
  `MaintenanceDate` datetime(6) NOT NULL,
  `Description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Price` int NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `CreatedBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`MaintenanceId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipmentmaintenances`
--

LOCK TABLES `equipmentmaintenances` WRITE;
/*!40000 ALTER TABLE `equipmentmaintenances` DISABLE KEYS */;
/*!40000 ALTER TABLE `equipmentmaintenances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `images`
--

DROP TABLE IF EXISTS `images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `images` (
  `ImageId` int NOT NULL AUTO_INCREMENT,
  `PatientId` int DEFAULT NULL,
  `TreatmentRecordId` int DEFAULT NULL,
  `ImageURL` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `CreatedBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`ImageId`),
  KEY `IX_Images_PatientId` (`PatientId`),
  KEY `IX_Images_TreatmentRecordId` (`TreatmentRecordId`),
  CONSTRAINT `FK_Images_Patients_PatientId` FOREIGN KEY (`PatientId`) REFERENCES `patients` (`PatientID`),
  CONSTRAINT `FK_Images_TreatmentRecords_TreatmentRecordId` FOREIGN KEY (`TreatmentRecordId`) REFERENCES `treatmentrecords` (`TreatmentRecordID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `images`
--

LOCK TABLES `images` WRITE;
/*!40000 ALTER TABLE `images` DISABLE KEYS */;
/*!40000 ALTER TABLE `images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `instructions`
--

DROP TABLE IF EXISTS `instructions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `instructions` (
  `InstructionID` int NOT NULL AUTO_INCREMENT,
  `TreatmentRecord_Id` int DEFAULT NULL,
  `Instruc_TemplateID` int DEFAULT NULL,
  `Content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreateBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`InstructionID`),
  KEY `IX_Instructions_Instruc_TemplateID` (`Instruc_TemplateID`),
  KEY `IX_Instructions_TreatmentRecord_Id` (`TreatmentRecord_Id`),
  CONSTRAINT `FK_Instructions_InstructionTemplates_Instruc_TemplateID` FOREIGN KEY (`Instruc_TemplateID`) REFERENCES `instructiontemplates` (`Instruc_TemplateID`),
  CONSTRAINT `FK_Instructions_TreatmentRecords_TreatmentRecord_Id` FOREIGN KEY (`TreatmentRecord_Id`) REFERENCES `treatmentrecords` (`TreatmentRecordID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `instructions`
--

LOCK TABLES `instructions` WRITE;
/*!40000 ALTER TABLE `instructions` DISABLE KEYS */;
/*!40000 ALTER TABLE `instructions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `instructiontemplates`
--

DROP TABLE IF EXISTS `instructiontemplates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `instructiontemplates` (
  `Instruc_TemplateID` int NOT NULL AUTO_INCREMENT,
  `Instruc_TemplateName` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Instruc_TemplateContext` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`Instruc_TemplateID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `instructiontemplates`
--

LOCK TABLES `instructiontemplates` WRITE;
/*!40000 ALTER TABLE `instructiontemplates` DISABLE KEYS */;
/*!40000 ALTER TABLE `instructiontemplates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `InvoiceId` int NOT NULL AUTO_INCREMENT,
  `PatientId` int NOT NULL,
  `TreatmentRecord_Id` int NOT NULL,
  `TotalAmount` int NOT NULL,
  `PaymentMethod` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `TransactionType` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `PaymentDate` datetime(6) NOT NULL,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `PaidAmount` decimal(65,30) DEFAULT NULL,
  `CreatedBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`InvoiceId`),
  KEY `IX_Invoices_PatientId` (`PatientId`),
  KEY `IX_Invoices_TreatmentRecord_Id` (`TreatmentRecord_Id`),
  CONSTRAINT `FK_Invoices_Patients_PatientId` FOREIGN KEY (`PatientId`) REFERENCES `patients` (`PatientID`) ON DELETE CASCADE,
  CONSTRAINT `FK_Invoices_TreatmentRecords_TreatmentRecord_Id` FOREIGN KEY (`TreatmentRecord_Id`) REFERENCES `treatmentrecords` (`TreatmentRecordID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenancesupplies`
--

DROP TABLE IF EXISTS `maintenancesupplies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenancesupplies` (
  `SupplyId` int NOT NULL,
  `MaintenanceId` int NOT NULL,
  PRIMARY KEY (`SupplyId`,`MaintenanceId`),
  KEY `IX_MaintenanceSupplies_MaintenanceId` (`MaintenanceId`),
  CONSTRAINT `FK_MaintenanceSupplies_EquipmentMaintenances_MaintenanceId` FOREIGN KEY (`MaintenanceId`) REFERENCES `equipmentmaintenances` (`MaintenanceId`) ON DELETE CASCADE,
  CONSTRAINT `FK_MaintenanceSupplies_Supplies_SupplyId` FOREIGN KEY (`SupplyId`) REFERENCES `supplies` (`SupplyId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenancesupplies`
--

LOCK TABLES `maintenancesupplies` WRITE;
/*!40000 ALTER TABLE `maintenancesupplies` DISABLE KEYS */;
/*!40000 ALTER TABLE `maintenancesupplies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `NotificationId` int NOT NULL AUTO_INCREMENT,
  `UserId` int NOT NULL,
  `Title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Message` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `IsRead` tinyint(1) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `RelatedObjectId` int DEFAULT NULL,
  PRIMARY KEY (`NotificationId`),
  KEY `IX_Notifications_UserId` (`UserId`),
  CONSTRAINT `FK_Notifications_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orthodontictreatmentplans`
--

DROP TABLE IF EXISTS `orthodontictreatmentplans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orthodontictreatmentplans` (
  `PlanId` int NOT NULL AUTO_INCREMENT,
  `PatientId` int NOT NULL,
  `DentistId` int NOT NULL,
  `PlanTitle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `TemplateName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `TreatmentHistory` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ReasonForVisit` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ExaminationFindings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `IntraoralExam` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `XRayAnalysis` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ModelAnalysis` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `TreatmentPlanContent` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `TotalCost` int NOT NULL,
  `PaymentMethod` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `CreatedBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`PlanId`),
  KEY `IX_OrthodonticTreatmentPlans_DentistId` (`DentistId`),
  KEY `IX_OrthodonticTreatmentPlans_PatientId` (`PatientId`),
  CONSTRAINT `FK_OrthodonticTreatmentPlans_Dentists_DentistId` FOREIGN KEY (`DentistId`) REFERENCES `dentists` (`DentistId`) ON DELETE CASCADE,
  CONSTRAINT `FK_OrthodonticTreatmentPlans_Patients_PatientId` FOREIGN KEY (`PatientId`) REFERENCES `patients` (`PatientID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orthodontictreatmentplans`
--

LOCK TABLES `orthodontictreatmentplans` WRITE;
/*!40000 ALTER TABLE `orthodontictreatmentplans` DISABLE KEYS */;
/*!40000 ALTER TABLE `orthodontictreatmentplans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `owners`
--

DROP TABLE IF EXISTS `owners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `owners` (
  `OwnerId` int NOT NULL AUTO_INCREMENT,
  `UserId` int NOT NULL,
  PRIMARY KEY (`OwnerId`),
  KEY `IX_Owners_UserId` (`UserId`),
  CONSTRAINT `FK_Owners_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `owners`
--

LOCK TABLES `owners` WRITE;
/*!40000 ALTER TABLE `owners` DISABLE KEYS */;
/*!40000 ALTER TABLE `owners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patients`
--

DROP TABLE IF EXISTS `patients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patients` (
  `PatientID` int NOT NULL AUTO_INCREMENT,
  `UserID` int DEFAULT NULL,
  `PatientGroup` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `UnderlyingConditions` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `FullName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Gender` tinyint(1) DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  `PhoneNumber` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Address` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `ImageUser` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `CreatedBy` int DEFAULT NULL,
  PRIMARY KEY (`PatientID`),
  KEY `IX_Patients_UserID` (`UserID`),
  CONSTRAINT `FK_Patients_Users_UserID` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patients`
--

LOCK TABLES `patients` WRITE;
/*!40000 ALTER TABLE `patients` DISABLE KEYS */;
/*!40000 ALTER TABLE `patients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescriptions`
--

DROP TABLE IF EXISTS `prescriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescriptions` (
  `PrescriptionId` int NOT NULL AUTO_INCREMENT,
  `TreatmentRecord_Id` int DEFAULT NULL,
  `Pre_TemplateID` int DEFAULT NULL,
  `Content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreateBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`PrescriptionId`),
  KEY `IX_Prescriptions_Pre_TemplateID` (`Pre_TemplateID`),
  KEY `IX_Prescriptions_TreatmentRecord_Id` (`TreatmentRecord_Id`),
  CONSTRAINT `FK_Prescriptions_PrescriptionTemplates_Pre_TemplateID` FOREIGN KEY (`Pre_TemplateID`) REFERENCES `prescriptiontemplates` (`PreTemplateID`),
  CONSTRAINT `FK_Prescriptions_TreatmentRecords_TreatmentRecord_Id` FOREIGN KEY (`TreatmentRecord_Id`) REFERENCES `treatmentrecords` (`TreatmentRecordID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescriptions`
--

LOCK TABLES `prescriptions` WRITE;
/*!40000 ALTER TABLE `prescriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `prescriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescriptiontemplates`
--

DROP TABLE IF EXISTS `prescriptiontemplates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescriptiontemplates` (
  `PreTemplateID` int NOT NULL AUTO_INCREMENT,
  `PreTemplateName` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `PreTemplateContext` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`PreTemplateID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescriptiontemplates`
--

LOCK TABLES `prescriptiontemplates` WRITE;
/*!40000 ALTER TABLE `prescriptiontemplates` DISABLE KEYS */;
/*!40000 ALTER TABLE `prescriptiontemplates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `procedures`
--

DROP TABLE IF EXISTS `procedures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procedures` (
  `ProcedureId` int NOT NULL AUTO_INCREMENT,
  `ProcedureName` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Price` decimal(65,30) NOT NULL,
  `Description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Discount` float DEFAULT NULL,
  `WarrantyPeriod` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `OriginalPrice` decimal(65,30) DEFAULT NULL,
  `ConsumableCost` decimal(65,30) DEFAULT NULL,
  `ReferralCommissionRate` float DEFAULT NULL,
  `DoctorCommissionRate` float DEFAULT NULL,
  `AssistantCommissionRate` float DEFAULT NULL,
  `TechnicianCommissionRate` float DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `CreatedBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `TreatmentRecordID` int DEFAULT NULL,
  PRIMARY KEY (`ProcedureId`),
  KEY `IX_Procedures_TreatmentRecordID` (`TreatmentRecordID`),
  CONSTRAINT `FK_Procedures_TreatmentRecords_TreatmentRecordID` FOREIGN KEY (`TreatmentRecordID`) REFERENCES `treatmentrecords` (`TreatmentRecordID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `procedures`
--

LOCK TABLES `procedures` WRITE;
/*!40000 ALTER TABLE `procedures` DISABLE KEYS */;
/*!40000 ALTER TABLE `procedures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receptionists`
--

DROP TABLE IF EXISTS `receptionists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receptionists` (
  `ReceptionistId` int NOT NULL AUTO_INCREMENT,
  `UserId` int NOT NULL,
  PRIMARY KEY (`ReceptionistId`),
  KEY `IX_Receptionists_UserId` (`UserId`),
  CONSTRAINT `FK_Receptionists_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receptionists`
--

LOCK TABLES `receptionists` WRITE;
/*!40000 ALTER TABLE `receptionists` DISABLE KEYS */;
/*!40000 ALTER TABLE `receptionists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `salaries`
--

DROP TABLE IF EXISTS `salaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salaries` (
  `SalaryId` int NOT NULL AUTO_INCREMENT,
  `UserId` int NOT NULL,
  `SalaryMonth` int NOT NULL,
  `SalaryYear` int NOT NULL,
  `TotalSalary` decimal(65,30) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `CreatedBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`SalaryId`),
  KEY `IX_Salaries_UserId` (`UserId`),
  CONSTRAINT `FK_Salaries_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `salaries`
--

LOCK TABLES `salaries` WRITE;
/*!40000 ALTER TABLE `salaries` DISABLE KEYS */;
/*!40000 ALTER TABLE `salaries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `salarycomponents`
--

DROP TABLE IF EXISTS `salarycomponents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salarycomponents` (
  `SalaryComponentId` int NOT NULL AUTO_INCREMENT,
  `SalaryId` int NOT NULL,
  `ComponentType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Amount` decimal(65,30) NOT NULL,
  `Type` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `CreatedBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`SalaryComponentId`),
  KEY `IX_SalaryComponents_SalaryId` (`SalaryId`),
  CONSTRAINT `FK_SalaryComponents_Salaries_SalaryId` FOREIGN KEY (`SalaryId`) REFERENCES `salaries` (`SalaryId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `salarycomponents`
--

LOCK TABLES `salarycomponents` WRITE;
/*!40000 ALTER TABLE `salarycomponents` DISABLE KEYS */;
/*!40000 ALTER TABLE `salarycomponents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schedules`
--

DROP TABLE IF EXISTS `schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedules` (
  `ScheduleId` int NOT NULL AUTO_INCREMENT,
  `DentistId` int NOT NULL,
  `WorkDate` datetime(6) NOT NULL,
  `Shift` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `WeekStartDate` datetime(6) NOT NULL,
  `Status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `CreatedBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  PRIMARY KEY (`ScheduleId`),
  KEY `IX_Schedules_DentistId` (`DentistId`),
  CONSTRAINT `FK_Schedules_Dentists_DentistId` FOREIGN KEY (`DentistId`) REFERENCES `dentists` (`DentistId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schedules`
--

LOCK TABLES `schedules` WRITE;
/*!40000 ALTER TABLE `schedules` DISABLE KEYS */;
/*!40000 ALTER TABLE `schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `smses`
--

DROP TABLE IF EXISTS `smses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `smses` (
  `SMSId` int NOT NULL AUTO_INCREMENT,
  `Patient_Id` int DEFAULT NULL,
  `SMSContent` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedBy` int DEFAULT NULL,
  `UpdateBy` int DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `Purpose` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`SMSId`),
  KEY `IX_SMSes_Patient_Id` (`Patient_Id`),
  CONSTRAINT `FK_SMSes_Patients_Patient_Id` FOREIGN KEY (`Patient_Id`) REFERENCES `patients` (`PatientID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `smses`
--

LOCK TABLES `smses` WRITE;
/*!40000 ALTER TABLE `smses` DISABLE KEYS */;
/*!40000 ALTER TABLE `smses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplies`
--

DROP TABLE IF EXISTS `supplies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplies` (
  `SupplyId` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Unit` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `QuantityInStock` int NOT NULL,
  `ExpiryDate` datetime(6) DEFAULT NULL,
  `Price` decimal(65,30) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `CreatedBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`SupplyId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplies`
--

LOCK TABLES `supplies` WRITE;
/*!40000 ALTER TABLE `supplies` DISABLE KEYS */;
/*!40000 ALTER TABLE `supplies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliesuseds`
--

DROP TABLE IF EXISTS `suppliesuseds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliesuseds` (
  `ProcedureId` int NOT NULL,
  `SupplyId` int NOT NULL,
  PRIMARY KEY (`ProcedureId`,`SupplyId`),
  KEY `IX_SuppliesUseds_SupplyId` (`SupplyId`),
  CONSTRAINT `FK_SuppliesUseds_Procedures_ProcedureId` FOREIGN KEY (`ProcedureId`) REFERENCES `procedures` (`ProcedureId`) ON DELETE CASCADE,
  CONSTRAINT `FK_SuppliesUseds_Supplies_SupplyId` FOREIGN KEY (`SupplyId`) REFERENCES `supplies` (`SupplyId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliesuseds`
--

LOCK TABLES `suppliesuseds` WRITE;
/*!40000 ALTER TABLE `suppliesuseds` DISABLE KEYS */;
/*!40000 ALTER TABLE `suppliesuseds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `TaskID` int NOT NULL AUTO_INCREMENT,
  `AssistantID` int DEFAULT NULL,
  `TreatmentProgressID` int DEFAULT NULL,
  `ProgressName` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `StartTime` time(6) DEFAULT NULL,
  `EndTime` time(6) DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `CreatedBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  PRIMARY KEY (`TaskID`),
  KEY `IX_Tasks_AssistantID` (`AssistantID`),
  KEY `IX_Tasks_TreatmentProgressID` (`TreatmentProgressID`),
  CONSTRAINT `FK_Tasks_Assistants_AssistantID` FOREIGN KEY (`AssistantID`) REFERENCES `assistants` (`AssistantId`),
  CONSTRAINT `FK_Tasks_TreatmentProgresses_TreatmentProgressID` FOREIGN KEY (`TreatmentProgressID`) REFERENCES `treatmentprogresses` (`TreatmentProgressID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `treatmentprogresses`
--

DROP TABLE IF EXISTS `treatmentprogresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `treatmentprogresses` (
  `TreatmentProgressID` int NOT NULL AUTO_INCREMENT,
  `DentistID` int NOT NULL,
  `TreatmentRecordID` int NOT NULL,
  `PatientID` int NOT NULL,
  `ProgressName` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `ProgressContent` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Duration` float DEFAULT NULL,
  `Description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `EndTime` datetime(6) DEFAULT NULL,
  `Note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `CreatedBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  PRIMARY KEY (`TreatmentProgressID`),
  KEY `IX_TreatmentProgresses_DentistID` (`DentistID`),
  KEY `IX_TreatmentProgresses_PatientID` (`PatientID`),
  KEY `IX_TreatmentProgresses_TreatmentRecordID` (`TreatmentRecordID`),
  CONSTRAINT `FK_TreatmentProgresses_Dentists_DentistID` FOREIGN KEY (`DentistID`) REFERENCES `dentists` (`DentistId`) ON DELETE CASCADE,
  CONSTRAINT `FK_TreatmentProgresses_Patients_PatientID` FOREIGN KEY (`PatientID`) REFERENCES `patients` (`PatientID`) ON DELETE CASCADE,
  CONSTRAINT `FK_TreatmentProgresses_TreatmentRecords_TreatmentRecordID` FOREIGN KEY (`TreatmentRecordID`) REFERENCES `treatmentrecords` (`TreatmentRecordID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `treatmentprogresses`
--

LOCK TABLES `treatmentprogresses` WRITE;
/*!40000 ALTER TABLE `treatmentprogresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `treatmentprogresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `treatmentrecords`
--

DROP TABLE IF EXISTS `treatmentrecords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `treatmentrecords` (
  `TreatmentRecordID` int NOT NULL AUTO_INCREMENT,
  `AppointmentID` int NOT NULL,
  `DentistID` int NOT NULL,
  `ProcedureID` int NOT NULL,
  `ToothPosition` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Quantity` int NOT NULL,
  `UnitPrice` decimal(65,30) NOT NULL,
  `DiscountAmount` decimal(65,30) DEFAULT NULL,
  `DiscountPercentage` float DEFAULT NULL,
  `TotalAmount` decimal(65,30) NOT NULL,
  `ConsultantEmployeeID` int DEFAULT NULL,
  `TreatmentStatus` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Symptoms` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Diagnosis` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `TreatmentDate` date NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `CreatedBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`TreatmentRecordID`),
  KEY `IX_TreatmentRecords_AppointmentID` (`AppointmentID`),
  KEY `IX_TreatmentRecords_DentistID` (`DentistID`),
  KEY `IX_TreatmentRecords_ProcedureID` (`ProcedureID`),
  CONSTRAINT `FK_TreatmentRecords_Appointments_AppointmentID` FOREIGN KEY (`AppointmentID`) REFERENCES `appointments` (`AppointmentId`) ON DELETE CASCADE,
  CONSTRAINT `FK_TreatmentRecords_Dentists_DentistID` FOREIGN KEY (`DentistID`) REFERENCES `dentists` (`DentistId`) ON DELETE CASCADE,
  CONSTRAINT `FK_TreatmentRecords_Procedures_ProcedureID` FOREIGN KEY (`ProcedureID`) REFERENCES `procedures` (`ProcedureId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `treatmentrecords`
--

LOCK TABLES `treatmentrecords` WRITE;
/*!40000 ALTER TABLE `treatmentrecords` DISABLE KEYS */;
/*!40000 ALTER TABLE `treatmentrecords` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `UserID` int NOT NULL AUTO_INCREMENT,
  `Username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Password` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Fullname` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Gender` tinyint(1) DEFAULT NULL,
  `Address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `DOB` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Phone` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `IsVerify` tinyint(1) DEFAULT NULL,
  `Email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Avatar` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `CreatedBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  PRIMARY KEY (`UserID`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin01','hashpw1','Nguyen Van A',1,'123 Le Loi, Q1, TP.HCM','1990-01-01','0909123456','active',1,'admin01@email.com','/avatars/1.png','2024-06-01 09:00:00.000000',NULL,NULL,NULL),(2,'user02','hashpw2','Tran Thi B',0,'45 Nguyen Trai, Q5','1995-05-20','0911222333','active',1,'user02@email.com','/avatars/2.png','2024-06-02 10:10:00.000000',NULL,1,NULL),(3,'ketoan03','hashpw3','Le Van C',1,'56 Dien Bien Phu, Q3','1992-08-10','0988777666','inactive',0,'ketoan03@email.com','/avatars/3.png','2024-06-03 11:15:00.000000','2024-06-11 09:00:00.000000',NULL,1),(4,'bacsi04','hashpw4','Pham Minh D',1,'99 Su Van Hanh, Q10','1987-03-14','0909112233','active',1,'bacsi04@email.com','/avatars/4.png','2024-06-04 13:30:00.000000',NULL,1,2),(5,'guest05',NULL,NULL,NULL,NULL,NULL,NULL,'pending',0,NULL,NULL,'2024-06-05 08:08:00.000000',NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warrantycards`
--

DROP TABLE IF EXISTS `warrantycards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warrantycards` (
  `WarrantyCardID` int NOT NULL AUTO_INCREMENT,
  `TreatmentRecordID` int DEFAULT NULL,
  `ProcedureID` int DEFAULT NULL,
  `StartDate` datetime(6) NOT NULL,
  `EndDate` datetime(6) NOT NULL,
  `Term` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Status` tinyint(1) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `CreateBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  PRIMARY KEY (`WarrantyCardID`),
  KEY `IX_WarrantyCards_ProcedureID` (`ProcedureID`),
  KEY `IX_WarrantyCards_TreatmentRecordID` (`TreatmentRecordID`),
  CONSTRAINT `FK_WarrantyCards_Procedures_ProcedureID` FOREIGN KEY (`ProcedureID`) REFERENCES `procedures` (`ProcedureId`),
  CONSTRAINT `FK_WarrantyCards_TreatmentRecords_TreatmentRecordID` FOREIGN KEY (`TreatmentRecordID`) REFERENCES `treatmentrecords` (`TreatmentRecordID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warrantycards`
--

LOCK TABLES `warrantycards` WRITE;
/*!40000 ALTER TABLE `warrantycards` DISABLE KEYS */;
/*!40000 ALTER TABLE `warrantycards` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-12 17:41:22
