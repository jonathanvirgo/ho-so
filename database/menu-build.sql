/*
SQLyog Community v13.3.0 (64 bit)
MySQL - 8.4.6-0ubuntu0.25.04.3 : Database - patients
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

/*Table structure for table `inventory_issue_items` */

DROP TABLE IF EXISTS `inventory_issue_items`;

CREATE TABLE `inventory_issue_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `issue_id` int NOT NULL COMMENT 'ID phiếu xuất',
  `food_id` int NOT NULL COMMENT 'ID thực phẩm',
  `receipt_item_id` int DEFAULT NULL COMMENT 'ID chi tiết phiếu nhập (FIFO)',
  `quantity` decimal(10,2) NOT NULL COMMENT 'Số lượng xuất (kg)',
  `unit` varchar(20) COLLATE utf8mb4_general_ci DEFAULT 'kg' COMMENT 'Đơn vị tính',
  `note` text COLLATE utf8mb4_general_ci COMMENT 'Ghi chú',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_issue_id` (`issue_id`),
  KEY `idx_food_id` (`food_id`),
  KEY `idx_receipt_item_id` (`receipt_item_id`),
  CONSTRAINT `inventory_issue_items_ibfk_1` FOREIGN KEY (`issue_id`) REFERENCES `inventory_issues` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inventory_issue_items_ibfk_2` FOREIGN KEY (`food_id`) REFERENCES `food_info` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `inventory_issue_items_ibfk_3` FOREIGN KEY (`receipt_item_id`) REFERENCES `inventory_receipt_items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Chi tiết phiếu xuất kho';

/*Data for the table `inventory_issue_items` */

/*Table structure for table `inventory_issues` */

DROP TABLE IF EXISTS `inventory_issues`;

CREATE TABLE `inventory_issues` (
  `id` int NOT NULL AUTO_INCREMENT,
  `warehouse_id` int NOT NULL COMMENT 'ID kho',
  `issue_code` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Mã phiếu xuất',
  `issue_date` date NOT NULL COMMENT 'Ngày xuất kho',
  `issue_type` enum('menu','manual','waste','return') COLLATE utf8mb4_general_ci DEFAULT 'manual' COMMENT 'Loại xuất: menu=theo thực đơn, manual=thủ công, waste=hao hụt, return=trả lại',
  `menu_build_id` int DEFAULT NULL COMMENT 'ID thực đơn (nếu xuất theo thực đơn)',
  `menu_week` int DEFAULT NULL COMMENT 'Tuần thực đơn',
  `menu_day` int DEFAULT NULL COMMENT 'Ngày thực đơn',
  `receiver` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Người nhận',
  `note` text COLLATE utf8mb4_general_ci COMMENT 'Ghi chú',
  `status` enum('draft','confirmed','cancelled') COLLATE utf8mb4_general_ci DEFAULT 'confirmed' COMMENT 'Trạng thái phiếu',
  `created_by` int NOT NULL COMMENT 'ID người tạo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_issue_code` (`issue_code`),
  KEY `idx_warehouse_id` (`warehouse_id`),
  KEY `idx_issue_date` (`issue_date`),
  KEY `idx_issue_type` (`issue_type`),
  KEY `idx_menu_build_id` (`menu_build_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `inventory_issues_ibfk_1` FOREIGN KEY (`warehouse_id`) REFERENCES `inventory_warehouses` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `inventory_issues_ibfk_2` FOREIGN KEY (`menu_build_id`) REFERENCES `menu_builds` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Phiếu xuất kho';

/*Data for the table `inventory_issues` */

/*Table structure for table `inventory_receipt_items` */

DROP TABLE IF EXISTS `inventory_receipt_items`;

CREATE TABLE `inventory_receipt_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `receipt_id` int NOT NULL COMMENT 'ID phiếu nhập',
  `food_id` int NOT NULL COMMENT 'ID thực phẩm',
  `quantity` decimal(10,2) NOT NULL COMMENT 'Số lượng nhập (kg)',
  `unit` varchar(20) COLLATE utf8mb4_general_ci DEFAULT 'kg' COMMENT 'Đơn vị tính',
  `unit_price` decimal(10,2) DEFAULT '0.00' COMMENT 'Đơn giá (VNĐ/kg)',
  `total_price` decimal(15,2) DEFAULT '0.00' COMMENT 'Thành tiền',
  `expiry_date` date DEFAULT NULL COMMENT 'Hạn sử dụng',
  `batch_code` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Mã lô',
  `note` text COLLATE utf8mb4_general_ci COMMENT 'Ghi chú',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_receipt_id` (`receipt_id`),
  KEY `idx_food_id` (`food_id`),
  KEY `idx_expiry_date` (`expiry_date`),
  KEY `idx_batch_code` (`batch_code`),
  CONSTRAINT `inventory_receipt_items_ibfk_1` FOREIGN KEY (`receipt_id`) REFERENCES `inventory_receipts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inventory_receipt_items_ibfk_2` FOREIGN KEY (`food_id`) REFERENCES `food_info` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Chi tiết phiếu nhập kho';

/*Data for the table `inventory_receipt_items` */

insert  into `inventory_receipt_items`(`id`,`receipt_id`,`food_id`,`quantity`,`unit`,`unit_price`,`total_price`,`expiry_date`,`batch_code`,`note`,`created_at`,`updated_at`) values 
(1,1,17,100.00,'kg',25000.00,2500000.00,'2026-04-12','GAO-2025-01',NULL,'2025-10-12 21:14:03',NULL),
(2,1,301,50.00,'kg',120000.00,6000000.00,'2025-10-19','THIT-2025-01',NULL,'2025-10-12 21:14:03',NULL),
(3,1,1560,30.00,'kg',80000.00,2400000.00,'2025-10-17','CA-2025-01',NULL,'2025-10-12 21:14:03',NULL),
(4,1,2377,20.00,'kg',15000.00,300000.00,'2025-10-15','RAU-2025-01',NULL,'2025-10-12 21:14:03',NULL),
(5,1,89,15.00,'kg',20000.00,300000.00,'2025-10-16','CACHUA-2025-01',NULL,'2025-10-12 21:14:03',NULL),
(6,1,1551,25.00,'kg',18000.00,450000.00,'2026-10-12','DUONG-2025-01',NULL,'2025-10-12 21:14:03',NULL),
(7,1,196,10.00,'kg',8000.00,80000.00,'2027-10-12','MUOI-2025-01',NULL,'2025-10-12 21:14:03',NULL),
(8,1,1144,20.00,'kg',35000.00,700000.00,'2025-10-22','TRUNG-2025-01',NULL,'2025-10-12 21:14:03',NULL),
(9,1,1191,15.00,'kg',28000.00,420000.00,'2026-04-12','SUA-2025-01',NULL,'2025-10-12 21:14:03',NULL),
(16,2,17,50.00,'kg',27000.00,1350000.00,'2026-04-12','GAO-2025-02',NULL,'2025-10-12 21:14:03',NULL),
(17,2,301,30.00,'kg',125000.00,3750000.00,'2025-10-19','THIT-2025-02',NULL,'2025-10-12 21:14:03',NULL),
(18,2,1560,20.00,'kg',85000.00,1700000.00,'2025-10-17','CA-2025-02',NULL,'2025-10-12 21:14:03',NULL),
(19,2,2377,15.00,'kg',16000.00,240000.00,'2025-10-15','RAU-2025-02',NULL,'2025-10-12 21:14:03',NULL);

/*Table structure for table `inventory_receipts` */

DROP TABLE IF EXISTS `inventory_receipts`;

CREATE TABLE `inventory_receipts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `warehouse_id` int NOT NULL COMMENT 'ID kho',
  `receipt_code` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Mã phiếu nhập',
  `receipt_date` date NOT NULL COMMENT 'Ngày nhập kho',
  `supplier` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Nhà cung cấp',
  `total_amount` decimal(15,2) DEFAULT '0.00' COMMENT 'Tổng tiền',
  `note` text COLLATE utf8mb4_general_ci COMMENT 'Ghi chú',
  `status` enum('draft','confirmed','cancelled') COLLATE utf8mb4_general_ci DEFAULT 'confirmed' COMMENT 'Trạng thái phiếu',
  `created_by` int NOT NULL COMMENT 'ID người tạo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_receipt_code` (`receipt_code`),
  KEY `idx_warehouse_id` (`warehouse_id`),
  KEY `idx_receipt_date` (`receipt_date`),
  KEY `idx_status` (`status`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `inventory_receipts_ibfk_1` FOREIGN KEY (`warehouse_id`) REFERENCES `inventory_warehouses` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Phiếu nhập kho';

/*Data for the table `inventory_receipts` */

insert  into `inventory_receipts`(`id`,`warehouse_id`,`receipt_code`,`receipt_date`,`supplier`,`total_amount`,`note`,`status`,`created_by`,`created_at`,`updated_at`) values 
(1,1,'PN202501010001','2025-01-01','Công ty TNHH Thực phẩm Sạch',15000000.00,NULL,'confirmed',1,'2025-10-12 21:14:03',NULL),
(2,1,'PN202501050001','2025-01-05','Siêu thị Thực phẩm An Toàn',8000000.00,NULL,'confirmed',1,'2025-10-12 21:14:03',NULL);

/*Table structure for table `inventory_stock` */

DROP TABLE IF EXISTS `inventory_stock`;

CREATE TABLE `inventory_stock` (
  `id` int NOT NULL AUTO_INCREMENT,
  `warehouse_id` int NOT NULL COMMENT 'ID kho',
  `food_id` int NOT NULL COMMENT 'ID thực phẩm',
  `receipt_item_id` int NOT NULL COMMENT 'ID chi tiết phiếu nhập (FIFO)',
  `batch_code` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Mã lô',
  `expiry_date` date DEFAULT NULL COMMENT 'Hạn sử dụng',
  `quantity_in` decimal(10,2) NOT NULL COMMENT 'Số lượng nhập',
  `quantity_out` decimal(10,2) DEFAULT '0.00' COMMENT 'Số lượng xuất',
  `quantity_available` decimal(10,2) NOT NULL COMMENT 'Số lượng còn lại',
  `unit` varchar(20) COLLATE utf8mb4_general_ci DEFAULT 'kg' COMMENT 'Đơn vị tính',
  `unit_price` decimal(10,2) DEFAULT '0.00' COMMENT 'Đơn giá',
  `receipt_date` date NOT NULL COMMENT 'Ngày nhập',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_receipt_item` (`warehouse_id`,`receipt_item_id`),
  KEY `idx_warehouse_food` (`warehouse_id`,`food_id`),
  KEY `idx_food_id` (`food_id`),
  KEY `idx_expiry_date` (`expiry_date`),
  KEY `idx_batch_code` (`batch_code`),
  KEY `idx_quantity_available` (`quantity_available`),
  KEY `receipt_item_id` (`receipt_item_id`),
  CONSTRAINT `inventory_stock_ibfk_1` FOREIGN KEY (`warehouse_id`) REFERENCES `inventory_warehouses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inventory_stock_ibfk_2` FOREIGN KEY (`food_id`) REFERENCES `food_info` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `inventory_stock_ibfk_3` FOREIGN KEY (`receipt_item_id`) REFERENCES `inventory_receipt_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tồn kho hiện tại (FIFO)';

/*Data for the table `inventory_stock` */

insert  into `inventory_stock`(`id`,`warehouse_id`,`food_id`,`receipt_item_id`,`batch_code`,`expiry_date`,`quantity_in`,`quantity_out`,`quantity_available`,`unit`,`unit_price`,`receipt_date`,`updated_at`) values 
(1,1,17,1,'GAO-2025-01','2026-04-12',100.00,0.00,100.00,'kg',25000.00,'2025-01-01','2025-10-12 21:14:03'),
(2,1,301,2,'THIT-2025-01','2025-10-19',50.00,0.00,50.00,'kg',120000.00,'2025-01-01','2025-10-12 21:14:03'),
(3,1,1560,3,'CA-2025-01','2025-10-17',30.00,0.00,30.00,'kg',80000.00,'2025-01-01','2025-10-12 21:14:03'),
(4,1,2377,4,'RAU-2025-01','2025-10-15',20.00,0.00,20.00,'kg',15000.00,'2025-01-01','2025-10-12 21:14:03'),
(5,1,89,5,'CACHUA-2025-01','2025-10-16',15.00,0.00,15.00,'kg',20000.00,'2025-01-01','2025-10-12 21:14:03'),
(6,1,1551,6,'DUONG-2025-01','2026-10-12',25.00,0.00,25.00,'kg',18000.00,'2025-01-01','2025-10-12 21:14:03'),
(7,1,196,7,'MUOI-2025-01','2027-10-12',10.00,0.00,10.00,'kg',8000.00,'2025-01-01','2025-10-12 21:14:03'),
(8,1,1144,8,'TRUNG-2025-01','2025-10-22',20.00,0.00,20.00,'kg',35000.00,'2025-01-01','2025-10-12 21:14:03'),
(9,1,1191,9,'SUA-2025-01','2026-04-12',15.00,0.00,15.00,'kg',28000.00,'2025-01-01','2025-10-12 21:14:03'),
(10,1,17,16,'GAO-2025-02','2026-04-12',50.00,0.00,50.00,'kg',27000.00,'2025-01-05','2025-10-12 21:14:03'),
(11,1,301,17,'THIT-2025-02','2025-10-19',30.00,0.00,30.00,'kg',125000.00,'2025-01-05','2025-10-12 21:14:03'),
(12,1,1560,18,'CA-2025-02','2025-10-17',20.00,0.00,20.00,'kg',85000.00,'2025-01-05','2025-10-12 21:14:03'),
(13,1,2377,19,'RAU-2025-02','2025-10-15',15.00,0.00,15.00,'kg',16000.00,'2025-01-05','2025-10-12 21:14:03');

/*Table structure for table `inventory_warehouses` */

DROP TABLE IF EXISTS `inventory_warehouses`;

CREATE TABLE `inventory_warehouses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Tên kho',
  `campaign_id` int NOT NULL COMMENT 'ID chiến dịch',
  `location` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Vị trí kho',
  `description` text COLLATE utf8mb4_general_ci COMMENT 'Mô tả',
  `active` tinyint DEFAULT '1' COMMENT '1: Hoạt động, 0: Ngừng hoạt động',
  `created_by` int NOT NULL COMMENT 'ID người tạo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_campaign_id` (`campaign_id`),
  KEY `idx_active` (`active`),
  KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Kho thực phẩm';

/*Data for the table `inventory_warehouses` */

insert  into `inventory_warehouses`(`id`,`name`,`campaign_id`,`location`,`description`,`active`,`created_by`,`created_at`,`updated_at`) values 
(1,'Kho 1',1,NULL,NULL,1,1,'2025-10-12 20:27:57',NULL);

/*Table structure for table `menu_build_details` */

DROP TABLE IF EXISTS `menu_build_details`;

CREATE TABLE `menu_build_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `menu_build_id` int NOT NULL COMMENT 'ID thực đơn',
  `week_number` tinyint NOT NULL COMMENT 'Tuần thứ mấy (1-4)',
  `day_of_week` tinyint NOT NULL COMMENT 'Thứ trong tuần (2-8, với 8 là Chủ nhật)',
  `menu_time_id` int NOT NULL DEFAULT '5' COMMENT 'ID giờ ăn từ bảng menu_time (3=Sáng, 4=Phụ sáng, 5=Trưa, 6=Chiều, 7=Tối, 8=Phụ tối)',
  `detail` longtext COLLATE utf8mb4_general_ci COMMENT 'Chi tiết thực đơn dạng JSON như menuExamine.json: {courses: [...], listFood: [...]}',
  `note` text COLLATE utf8mb4_general_ci COMMENT 'Ghi chú cho món ăn này',
  `active` tinyint DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_menu_build_details_menu` (`menu_build_id`),
  KEY `idx_menu_build_details_week` (`week_number`),
  KEY `idx_menu_build_details_day` (`day_of_week`),
  KEY `idx_menu_time_id` (`menu_time_id`),
  CONSTRAINT `fk_menu_build_details_menu_time` FOREIGN KEY (`menu_time_id`) REFERENCES `menu_time` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `menu_build_details_ibfk_1` FOREIGN KEY (`menu_build_id`) REFERENCES `menu_builds` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Chi tiết món ăn trong thực đơn theo từng ngày';

/*Data for the table `menu_build_details` */

insert  into `menu_build_details`(`id`,`menu_build_id`,`week_number`,`day_of_week`,`menu_time_id`,`detail`,`note`,`active`,`created_at`,`updated_at`) values 
(1,1,1,2,5,'{\"courses\":[{\"id\":1,\"name\":\"Cơm gà luộc\",\"category_key\":\"mon_chinh\"},{\"id\":2,\"name\":\"Rau muống xào tỏi\",\"category_key\":\"mon_canh\"}],\"listFood\":[{\"id\":1550,\"id_food\":1550,\"course_id\":1,\"food_id\":1550,\"weight\":1,\"order_index\":0,\"created_at\":\"2025-09-02T15:11:17.000Z\",\"created_by\":null,\"code\":null,\"name\":\"Bánh cam (1 cái)\",\"type\":\"cooked\",\"type_year\":\"2017\",\"ten\":\"Bánh cam (1 cái)\",\"active\":1,\"total_sugar\":4,\"galactose\":null,\"maltose\":null,\"lactose\":null,\"fructose\":null,\"glucose\":null,\"sucrose\":null,\"lycopene\":null,\"lutein_zeaxanthin\":null,\"total_isoflavone\":null,\"daidzein\":null,\"genistein\":null,\"glycetin\":null,\"phytosterol\":null,\"purine\":null,\"protein\":3.3,\"lysin\":null,\"methionin\":null,\"tryptophan\":null,\"phenylalanin\":null,\"threonin\":null,\"isoleucine\":null,\"arginine\":null,\"histidine\":null,\"alanine\":null,\"aspartic_acid\":null,\"glutamic_acid\":null,\"glycine\":null,\"proline\":null,\"serine\":null,\"animal_protein\":null,\"unanimal_protein\":null,\"cystine\":null,\"valine\":null,\"tyrosine\":null,\"leucine\":null,\"lignoceric\":null,\"animal_lipid\":null,\"unanimal_lipid\":null,\"riboflavin\":null,\"thiamine\":null,\"niacin\":null,\"pantothenic_acid\":null,\"folic_acid\":null,\"biotin\":null,\"caroten\":null,\"vitamin_a_rae\":0,\"vitamin_b6\":null,\"vitamin_b12\":null,\"vitamin_c\":0,\"vitamin_e\":null,\"vitamin_k\":null,\"b_carotene\":null,\"a_carotene\":null,\"b_cryptoxanthin\":null,\"edible\":null,\"energy\":192,\"water\":null,\"fat\":10.2,\"carbohydrate\":21.9,\"fiber\":null,\"ash\":null,\"calci\":61,\"phosphorous\":null,\"fe\":1,\"zinc\":null,\"sodium\":null,\"potassium\":null,\"magnesium\":null,\"manganese\":null,\"copper\":null,\"selenium\":null,\"fluoride\":null,\"iodine\":null,\"total_saturated_fat\":null,\"palmitic\":null,\"margaric\":null,\"stearic\":null,\"arachidic\":null,\"behenic\":null,\"mufa\":null,\"myristoleic\":null,\"palmitoleic\":null,\"oleic\":null,\"pufa\":null,\"linoleic\":null,\"linolenic\":null,\"arachidonic\":null,\"dha\":null,\"trans_fatty_acids\":null,\"cholesterol\":null,\"vitamin_d\":null,\"epa\":null,\"choline\":null,\"note\":\"Bột nếp, bột gạo, mè, đậu xanh, đường, dầu\",\"updated_at\":\"2025-09-02T15:11:17.000Z\",\"food_info_id\":1550,\"actual_weight\":1},{\"id\":432,\"id_food\":432,\"course_id\":2,\"food_id\":432,\"weight\":100,\"order_index\":0,\"created_at\":\"2025-08-26T08:52:59.000Z\",\"created_by\":null,\"code\":\"08057\",\"name\":\"Bột cá\",\"type\":\"raw\",\"type_year\":\"2017\",\"ten\":\"Bột cá\",\"active\":1,\"total_sugar\":null,\"galactose\":null,\"maltose\":null,\"lactose\":null,\"fructose\":null,\"glucose\":null,\"sucrose\":null,\"lycopene\":0,\"lutein_zeaxanthin\":0,\"total_isoflavone\":0,\"daidzein\":0,\"genistein\":0,\"glycetin\":0,\"phytosterol\":null,\"purine\":null,\"protein\":71.2,\"lysin\":null,\"methionin\":null,\"tryptophan\":null,\"phenylalanin\":null,\"threonin\":null,\"isoleucine\":null,\"arginine\":null,\"histidine\":null,\"alanine\":null,\"aspartic_acid\":null,\"glutamic_acid\":null,\"glycine\":null,\"proline\":null,\"serine\":null,\"animal_protein\":null,\"unanimal_protein\":null,\"cystine\":null,\"valine\":null,\"tyrosine\":null,\"leucine\":null,\"lignoceric\":null,\"animal_lipid\":null,\"unanimal_lipid\":null,\"riboflavin\":0.38,\"thiamine\":0.03,\"niacin\":null,\"pantothenic_acid\":null,\"folic_acid\":null,\"biotin\":null,\"caroten\":null,\"vitamin_a_rae\":0,\"vitamin_b6\":null,\"vitamin_b12\":null,\"vitamin_c\":0,\"vitamin_e\":null,\"vitamin_k\":null,\"b_carotene\":0,\"a_carotene\":0,\"b_cryptoxanthin\":0,\"edible\":100,\"energy\":323,\"water\":11.6,\"fat\":2.9,\"carbohydrate\":3,\"fiber\":0,\"ash\":11.3,\"calci\":505,\"phosphorous\":207,\"fe\":50,\"zinc\":null,\"sodium\":null,\"potassium\":null,\"magnesium\":null,\"manganese\":null,\"copper\":null,\"selenium\":null,\"fluoride\":null,\"iodine\":null,\"total_saturated_fat\":null,\"palmitic\":null,\"margaric\":null,\"stearic\":null,\"arachidic\":null,\"behenic\":null,\"mufa\":null,\"myristoleic\":null,\"palmitoleic\":null,\"oleic\":null,\"pufa\":null,\"linoleic\":null,\"linolenic\":null,\"arachidonic\":null,\"dha\":null,\"trans_fatty_acids\":null,\"cholesterol\":null,\"vitamin_d\":null,\"epa\":null,\"choline\":null,\"note\":null,\"updated_at\":\"2025-08-26T08:52:59.000Z\",\"food_info_id\":432,\"actual_weight\":100}]}',NULL,1,'2025-10-12 17:26:07',NULL),
(2,1,1,3,5,'{\"courses\":[{\"id\":1,\"name\":\"Rau muống xào tỏi\",\"category_key\":\"mon_canh\"}],\"listFood\":[{\"id\":432,\"id_food\":432,\"course_id\":1,\"food_id\":432,\"weight\":100,\"order_index\":0,\"created_at\":\"2025-08-26T08:52:59.000Z\",\"created_by\":null,\"code\":\"08057\",\"name\":\"Bột cá\",\"type\":\"raw\",\"type_year\":\"2017\",\"ten\":\"Bột cá\",\"active\":1,\"total_sugar\":null,\"galactose\":null,\"maltose\":null,\"lactose\":null,\"fructose\":null,\"glucose\":null,\"sucrose\":null,\"lycopene\":0,\"lutein_zeaxanthin\":0,\"total_isoflavone\":0,\"daidzein\":0,\"genistein\":0,\"glycetin\":0,\"phytosterol\":null,\"purine\":null,\"protein\":71.2,\"lysin\":null,\"methionin\":null,\"tryptophan\":null,\"phenylalanin\":null,\"threonin\":null,\"isoleucine\":null,\"arginine\":null,\"histidine\":null,\"alanine\":null,\"aspartic_acid\":null,\"glutamic_acid\":null,\"glycine\":null,\"proline\":null,\"serine\":null,\"animal_protein\":null,\"unanimal_protein\":null,\"cystine\":null,\"valine\":null,\"tyrosine\":null,\"leucine\":null,\"lignoceric\":null,\"animal_lipid\":null,\"unanimal_lipid\":null,\"riboflavin\":0.38,\"thiamine\":0.03,\"niacin\":null,\"pantothenic_acid\":null,\"folic_acid\":null,\"biotin\":null,\"caroten\":null,\"vitamin_a_rae\":0,\"vitamin_b6\":null,\"vitamin_b12\":null,\"vitamin_c\":0,\"vitamin_e\":null,\"vitamin_k\":null,\"b_carotene\":0,\"a_carotene\":0,\"b_cryptoxanthin\":0,\"edible\":100,\"energy\":323,\"water\":11.6,\"fat\":2.9,\"carbohydrate\":3,\"fiber\":0,\"ash\":11.3,\"calci\":505,\"phosphorous\":207,\"fe\":50,\"zinc\":null,\"sodium\":null,\"potassium\":null,\"magnesium\":null,\"manganese\":null,\"copper\":null,\"selenium\":null,\"fluoride\":null,\"iodine\":null,\"total_saturated_fat\":null,\"palmitic\":null,\"margaric\":null,\"stearic\":null,\"arachidic\":null,\"behenic\":null,\"mufa\":null,\"myristoleic\":null,\"palmitoleic\":null,\"oleic\":null,\"pufa\":null,\"linoleic\":null,\"linolenic\":null,\"arachidonic\":null,\"dha\":null,\"trans_fatty_acids\":null,\"cholesterol\":null,\"vitamin_d\":null,\"epa\":null,\"choline\":null,\"note\":null,\"updated_at\":\"2025-08-26T08:52:59.000Z\",\"food_info_id\":432,\"actual_weight\":100}]}',NULL,1,'2025-10-12 17:26:07',NULL),
(3,1,1,2,3,'{\"courses\":[{\"id\":1,\"name\":\"Canh bí đỏ thịt băm\",\"category_key\":\"mon_canh\"},{\"id\":2,\"name\":\"Cơm gà luộc\",\"category_key\":\"mon_chinh\"},{\"id\":3,\"name\":\"Canh cải xanh nấu thịt\",\"category_key\":\"mon_chinh\"}],\"listFood\":[{\"id\":87,\"id_food\":87,\"course_id\":1,\"food_id\":87,\"weight\":20,\"order_index\":0,\"created_at\":\"2025-08-26T08:52:59.000Z\",\"created_by\":null,\"code\":\"04003\",\"name\":\"Bí ngô\",\"type\":\"raw\",\"type_year\":\"2017\",\"ten\":\"Bí ngô\",\"active\":1,\"total_sugar\":null,\"galactose\":null,\"maltose\":null,\"lactose\":null,\"fructose\":null,\"glucose\":null,\"sucrose\":null,\"lycopene\":0,\"lutein_zeaxanthin\":300,\"total_isoflavone\":null,\"daidzein\":null,\"genistein\":null,\"glycetin\":null,\"phytosterol\":2.4,\"purine\":null,\"protein\":0.06,\"lysin\":12.6,\"methionin\":2.4,\"tryptophan\":3.6,\"phenylalanin\":6.8,\"threonin\":6.2,\"isoleucine\":9.4,\"arginine\":9.2,\"histidine\":4,\"alanine\":9.4,\"aspartic_acid\":30.2,\"glutamic_acid\":46.6,\"glycine\":6.2,\"proline\":5.8,\"serine\":7.4,\"animal_protein\":null,\"unanimal_protein\":null,\"cystine\":2,\"valine\":9.6,\"tyrosine\":3.6,\"leucine\":13.8,\"lignoceric\":0,\"animal_lipid\":null,\"unanimal_lipid\":null,\"riboflavin\":0.01,\"thiamine\":0.01,\"niacin\":0.08,\"pantothenic_acid\":0.06,\"folic_acid\":3.2,\"biotin\":0.08,\"caroten\":null,\"vitamin_a_rae\":47.37,\"vitamin_b6\":0.01,\"vitamin_b12\":0,\"vitamin_c\":1.8,\"vitamin_e\":0.21,\"vitamin_k\":0.22,\"b_carotene\":302.4,\"a_carotene\":103,\"b_cryptoxanthin\":429,\"edible\":17.2,\"price\":null,\"energy\":5.8,\"water\":18.4,\"fat\":0.01,\"carbohydrate\":1.37,\"fiber\":0.14,\"ash\":0.16,\"calci\":4.8,\"phosphorous\":3.2,\"fe\":0.1,\"zinc\":0.02,\"sodium\":1.6,\"potassium\":69.8,\"magnesium\":2,\"manganese\":3.2,\"copper\":42,\"selenium\":0.06,\"fluoride\":null,\"iodine\":null,\"total_saturated_fat\":0.01,\"palmitic\":0.01,\"margaric\":0,\"stearic\":0,\"arachidic\":0,\"behenic\":0,\"mufa\":0,\"myristoleic\":0,\"palmitoleic\":0,\"oleic\":0,\"pufa\":0,\"linoleic\":0,\"linolenic\":0,\"arachidonic\":0,\"dha\":0,\"trans_fatty_acids\":null,\"cholesterol\":0,\"vitamin_d\":null,\"epa\":0,\"choline\":null,\"note\":null,\"updated_at\":\"2025-09-12T05:12:11.000Z\",\"food_info_id\":17.4,\"actual_weight\":4},{\"id\":301,\"id_food\":301,\"course_id\":1,\"food_id\":301,\"weight\":5,\"order_index\":1,\"created_at\":\"2025-08-26T08:52:59.000Z\",\"created_by\":null,\"code\":\"07017\",\"name\":\"Thịt lợn nạc\",\"type\":\"raw\",\"type_year\":\"2017\",\"ten\":\"Thịt lợn nạc\",\"active\":1,\"total_sugar\":0,\"galactose\":0,\"maltose\":0,\"lactose\":0,\"fructose\":0,\"glucose\":0,\"sucrose\":0,\"lycopene\":0,\"lutein_zeaxanthin\":0,\"total_isoflavone\":0,\"daidzein\":0,\"genistein\":0,\"glycetin\":0,\"phytosterol\":null,\"purine\":8.3,\"protein\":0.95,\"lysin\":72,\"methionin\":20,\"tryptophan\":11.5,\"phenylalanin\":34.5,\"threonin\":37,\"isoleucine\":47,\"arginine\":50.5,\"histidine\":25.5,\"alanine\":49.5,\"aspartic_acid\":80.35,\"glutamic_acid\":130.15,\"glycine\":51.15,\"proline\":41.05,\"serine\":37.6,\"animal_protein\":null,\"unanimal_protein\":null,\"cystine\":10.1,\"valine\":45.5,\"tyrosine\":32.2,\"leucine\":59.5,\"lignoceric\":0,\"animal_lipid\":null,\"unanimal_lipid\":null,\"riboflavin\":0.01,\"thiamine\":0.05,\"niacin\":0.22,\"pantothenic_acid\":0.04,\"folic_acid\":0.25,\"biotin\":0.13,\"caroten\":null,\"vitamin_a_rae\":0.1,\"vitamin_b6\":0.02,\"vitamin_b12\":0.04,\"vitamin_c\":0.04,\"vitamin_e\":null,\"vitamin_k\":null,\"b_carotene\":0,\"a_carotene\":0,\"b_cryptoxanthin\":0,\"edible\":4.9,\"price\":\"120000.00\",\"energy\":6.95,\"water\":3.65,\"fat\":0.35,\"carbohydrate\":0,\"fiber\":0,\"ash\":0.05,\"calci\":0.34,\"phosphorous\":9.5,\"fe\":0.05,\"zinc\":0.13,\"sodium\":3.8,\"potassium\":17.05,\"magnesium\":1.6,\"manganese\":0,\"copper\":9.5,\"selenium\":1.2,\"fluoride\":null,\"iodine\":null,\"total_saturated_fat\":0.12,\"palmitic\":0.08,\"margaric\":0,\"stearic\":0.04,\"arachidic\":0,\"behenic\":0,\"mufa\":0.16,\"myristoleic\":0,\"palmitoleic\":0.01,\"oleic\":0.15,\"pufa\":0.04,\"linoleic\":0.03,\"linolenic\":0,\"arachidonic\":0,\"dha\":0,\"trans_fatty_acids\":null,\"cholesterol\":3.35,\"vitamin_d\":null,\"epa\":0,\"choline\":null,\"note\":null,\"updated_at\":\"2025-10-12T14:14:04.000Z\",\"food_info_id\":15.05,\"actual_weight\":0.25},{\"id\":1550,\"id_food\":1550,\"course_id\":2,\"food_id\":1550,\"weight\":1,\"order_index\":0,\"created_at\":\"2025-09-02T15:11:17.000Z\",\"created_by\":null,\"code\":null,\"name\":\"Bánh cam (1 cái)\",\"type\":\"cooked\",\"type_year\":\"2017\",\"ten\":\"Bánh cam (1 cái)\",\"active\":1,\"total_sugar\":4,\"galactose\":null,\"maltose\":null,\"lactose\":null,\"fructose\":null,\"glucose\":null,\"sucrose\":null,\"lycopene\":null,\"lutein_zeaxanthin\":null,\"total_isoflavone\":null,\"daidzein\":null,\"genistein\":null,\"glycetin\":null,\"phytosterol\":null,\"purine\":null,\"protein\":3.3,\"lysin\":null,\"methionin\":null,\"tryptophan\":null,\"phenylalanin\":null,\"threonin\":null,\"isoleucine\":null,\"arginine\":null,\"histidine\":null,\"alanine\":null,\"aspartic_acid\":null,\"glutamic_acid\":null,\"glycine\":null,\"proline\":null,\"serine\":null,\"animal_protein\":null,\"unanimal_protein\":null,\"cystine\":null,\"valine\":null,\"tyrosine\":null,\"leucine\":null,\"lignoceric\":null,\"animal_lipid\":null,\"unanimal_lipid\":null,\"riboflavin\":null,\"thiamine\":null,\"niacin\":null,\"pantothenic_acid\":null,\"folic_acid\":null,\"biotin\":null,\"caroten\":null,\"vitamin_a_rae\":0,\"vitamin_b6\":null,\"vitamin_b12\":null,\"vitamin_c\":0,\"vitamin_e\":null,\"vitamin_k\":null,\"b_carotene\":null,\"a_carotene\":null,\"b_cryptoxanthin\":null,\"edible\":null,\"price\":\"80000.00\",\"energy\":192,\"water\":null,\"fat\":10.2,\"carbohydrate\":21.9,\"fiber\":null,\"ash\":null,\"calci\":61,\"phosphorous\":null,\"fe\":1,\"zinc\":null,\"sodium\":null,\"potassium\":null,\"magnesium\":null,\"manganese\":null,\"copper\":null,\"selenium\":null,\"fluoride\":null,\"iodine\":null,\"total_saturated_fat\":null,\"palmitic\":null,\"margaric\":null,\"stearic\":null,\"arachidic\":null,\"behenic\":null,\"mufa\":null,\"myristoleic\":null,\"palmitoleic\":null,\"oleic\":null,\"pufa\":null,\"linoleic\":null,\"linolenic\":null,\"arachidonic\":null,\"dha\":null,\"trans_fatty_acids\":null,\"cholesterol\":null,\"vitamin_d\":null,\"epa\":null,\"choline\":null,\"note\":\"Bột nếp, bột gạo, mè, đậu xanh, đường, dầu\",\"updated_at\":\"2025-10-12T14:14:04.000Z\",\"food_info_id\":1550,\"actual_weight\":1},{\"id\":100,\"id_food\":100,\"course_id\":3,\"food_id\":100,\"weight\":20,\"order_index\":0,\"created_at\":\"2025-08-26T08:52:59.000Z\",\"created_by\":null,\"code\":\"04016\",\"name\":\"Cải xanh\",\"type\":\"raw\",\"type_year\":\"2017\",\"ten\":\"Cải xanh\",\"active\":1,\"total_sugar\":0.32,\"galactose\":null,\"maltose\":null,\"lactose\":null,\"fructose\":null,\"glucose\":null,\"sucrose\":null,\"lycopene\":0,\"lutein_zeaxanthin\":1980,\"total_isoflavone\":null,\"daidzein\":null,\"genistein\":null,\"glycetin\":null,\"phytosterol\":null,\"purine\":null,\"protein\":0.34,\"lysin\":24.6,\"methionin\":5,\"tryptophan\":6,\"phenylalanin\":14.4,\"threonin\":14.4,\"isoleucine\":19.6,\"arginine\":39.4,\"histidine\":9.6,\"alanine\":null,\"aspartic_acid\":null,\"glutamic_acid\":null,\"glycine\":null,\"proline\":null,\"serine\":null,\"animal_protein\":null,\"unanimal_protein\":null,\"cystine\":8,\"valine\":21,\"tyrosine\":28.6,\"leucine\":16.6,\"lignoceric\":0,\"animal_lipid\":null,\"unanimal_lipid\":null,\"riboflavin\":0.02,\"thiamine\":0.01,\"niacin\":0.16,\"pantothenic_acid\":0.04,\"folic_acid\":37.4,\"biotin\":null,\"caroten\":null,\"vitamin_a_rae\":105,\"vitamin_b6\":0.04,\"vitamin_b12\":0,\"vitamin_c\":10.2,\"vitamin_e\":0.4,\"vitamin_k\":99.46,\"b_carotene\":1260,\"a_carotene\":0,\"b_cryptoxanthin\":0,\"edible\":15.2,\"price\":\"80000.00\",\"energy\":4.6,\"water\":18.76,\"fat\":0.03,\"carbohydrate\":0.75,\"fiber\":0.36,\"ash\":0.12,\"calci\":17.8,\"phosphorous\":2.7,\"fe\":0.38,\"zinc\":0.18,\"sodium\":5.8,\"potassium\":44.2,\"magnesium\":4.6,\"manganese\":0.06,\"copper\":24,\"selenium\":0.18,\"fluoride\":null,\"iodine\":null,\"total_saturated_fat\":0,\"palmitic\":0,\"margaric\":0,\"stearic\":0,\"arachidic\":0,\"behenic\":0,\"mufa\":0.02,\"myristoleic\":0,\"palmitoleic\":0,\"oleic\":0,\"pufa\":0.01,\"linoleic\":0,\"linolenic\":0,\"arachidonic\":0,\"dha\":0,\"trans_fatty_acids\":null,\"cholesterol\":0,\"vitamin_d\":null,\"epa\":0,\"choline\":null,\"note\":null,\"updated_at\":\"2025-10-12T14:14:04.000Z\",\"food_info_id\":20,\"actual_weight\":4},{\"id\":301,\"id_food\":301,\"course_id\":3,\"food_id\":301,\"weight\":5,\"order_index\":1,\"created_at\":\"2025-08-26T08:52:59.000Z\",\"created_by\":null,\"code\":\"07017\",\"name\":\"Thịt lợn nạc\",\"type\":\"raw\",\"type_year\":\"2017\",\"ten\":\"Thịt lợn nạc\",\"active\":1,\"total_sugar\":0,\"galactose\":0,\"maltose\":0,\"lactose\":0,\"fructose\":0,\"glucose\":0,\"sucrose\":0,\"lycopene\":0,\"lutein_zeaxanthin\":0,\"total_isoflavone\":0,\"daidzein\":0,\"genistein\":0,\"glycetin\":0,\"phytosterol\":null,\"purine\":8.3,\"protein\":0.95,\"lysin\":72,\"methionin\":20,\"tryptophan\":11.5,\"phenylalanin\":34.5,\"threonin\":37,\"isoleucine\":47,\"arginine\":50.5,\"histidine\":25.5,\"alanine\":49.5,\"aspartic_acid\":80.35,\"glutamic_acid\":130.15,\"glycine\":51.15,\"proline\":41.05,\"serine\":37.6,\"animal_protein\":null,\"unanimal_protein\":null,\"cystine\":10.1,\"valine\":45.5,\"tyrosine\":32.2,\"leucine\":59.5,\"lignoceric\":0,\"animal_lipid\":null,\"unanimal_lipid\":null,\"riboflavin\":0.01,\"thiamine\":0.05,\"niacin\":0.22,\"pantothenic_acid\":0.04,\"folic_acid\":0.25,\"biotin\":0.13,\"caroten\":null,\"vitamin_a_rae\":0.1,\"vitamin_b6\":0.02,\"vitamin_b12\":0.04,\"vitamin_c\":0.04,\"vitamin_e\":null,\"vitamin_k\":null,\"b_carotene\":0,\"a_carotene\":0,\"b_cryptoxanthin\":0,\"edible\":4.9,\"price\":\"120000.00\",\"energy\":6.95,\"water\":3.65,\"fat\":0.35,\"carbohydrate\":0,\"fiber\":0,\"ash\":0.05,\"calci\":0.34,\"phosphorous\":9.5,\"fe\":0.05,\"zinc\":0.13,\"sodium\":3.8,\"potassium\":17.05,\"magnesium\":1.6,\"manganese\":0,\"copper\":9.5,\"selenium\":1.2,\"fluoride\":null,\"iodine\":null,\"total_saturated_fat\":0.12,\"palmitic\":0.08,\"margaric\":0,\"stearic\":0.04,\"arachidic\":0,\"behenic\":0,\"mufa\":0.16,\"myristoleic\":0,\"palmitoleic\":0.01,\"oleic\":0.15,\"pufa\":0.04,\"linoleic\":0.03,\"linolenic\":0,\"arachidonic\":0,\"dha\":0,\"trans_fatty_acids\":null,\"cholesterol\":3.35,\"vitamin_d\":null,\"epa\":0,\"choline\":null,\"note\":null,\"updated_at\":\"2025-10-12T14:14:04.000Z\",\"food_info_id\":15.05,\"actual_weight\":0.25}]}',NULL,1,'2025-10-12 21:23:54','2025-10-14 17:02:10');

/*Table structure for table `menu_builds` */

DROP TABLE IF EXISTS `menu_builds`;

CREATE TABLE `menu_builds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Tên thực đơn',
  `description` text COLLATE utf8mb4_general_ci COMMENT 'Mô tả thực đơn',
  `view_type` enum('week','month') COLLATE utf8mb4_general_ci DEFAULT 'month' COMMENT 'Loại hiển thị: week (theo tuần), month (theo tháng)',
  `selected_week` tinyint DEFAULT NULL COMMENT 'Tuần được chọn (1-4) nếu view_type = week',
  `visible_meal_times` longtext COLLATE utf8mb4_general_ci COMMENT 'Danh sách ID giờ ăn hiển thị (JSON array). VD: [3,5,7] = Sáng, Trưa, Tối',
  `visible_categories` longtext COLLATE utf8mb4_general_ci,
  `start_date` date DEFAULT NULL COMMENT 'Ngày bắt đầu áp dụng',
  `end_date` date DEFAULT NULL COMMENT 'Ngày kết thúc áp dụng',
  `status` enum('draft','active','archived') COLLATE utf8mb4_general_ci DEFAULT 'draft' COMMENT 'Trạng thái: draft (nháp), active (đang dùng), archived (lưu trữ)',
  `note` text COLLATE utf8mb4_general_ci COMMENT 'Ghi chú',
  `active` tinyint DEFAULT '1',
  `created_by` int NOT NULL,
  `campaign_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_menu_builds_created_by` (`created_by`),
  KEY `idx_menu_builds_status` (`status`),
  KEY `idx_menu_builds_view_type` (`view_type`),
  KEY `idx_menu_builds_dates` (`start_date`,`end_date`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Thực đơn xây dựng theo tuần/tháng';

/*Data for the table `menu_builds` */

insert  into `menu_builds`(`id`,`name`,`description`,`view_type`,`selected_week`,`visible_meal_times`,`visible_categories`,`start_date`,`end_date`,`status`,`note`,`active`,`created_by`,`campaign_id`,`created_at`,`updated_at`) values 
(1,'Dựa án 1',NULL,'week',1,'[5,3]','[\"mon_chinh\",\"mon_man\",\"mon_canh\",\"mon_xao\",\"mon_luoc\",\"mon_rau\"]',NULL,NULL,'draft',NULL,1,1,1,'2025-10-06 15:14:11','2025-10-14 17:02:10');

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
