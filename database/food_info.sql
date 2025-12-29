-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Sep 12, 2025 at 12:16 PM
-- Server version: 10.6.18-MariaDB-cll-lve-log
-- PHP Version: 8.4.11

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `lbsjazko_hoso`
--

-- --------------------------------------------------------

--
-- Table structure for table `food_info`
--

CREATE TABLE `food_info` (
  `id` int(11) NOT NULL,
  `code` varchar(128) DEFAULT NULL,
  `name` varchar(512) NOT NULL,
  `type` enum('raw','cooked','cooked_vdd','milk','ddd') DEFAULT 'raw' COMMENT 'Loại thực phẩm: raw=sống, cooked=chín, cooked_vdd = chín viện dinh dưỡng',
  `type_year` enum('2000','2007','2017','2025') DEFAULT '2017' COMMENT 'Năm dữ liệu thực phẩm',
  `ten` varchar(512) DEFAULT NULL,
  `active` tinyint(1) DEFAULT NULL,
  `total_sugar` double DEFAULT NULL,
  `galactose` double DEFAULT NULL,
  `maltose` double DEFAULT NULL,
  `lactose` double DEFAULT NULL,
  `fructose` double DEFAULT NULL,
  `glucose` double DEFAULT NULL,
  `sucrose` double DEFAULT NULL,
  `lycopene` double DEFAULT NULL,
  `lutein_zeaxanthin` double DEFAULT NULL,
  `total_isoflavone` double DEFAULT NULL,
  `daidzein` double DEFAULT NULL,
  `genistein` double DEFAULT NULL,
  `glycetin` double DEFAULT NULL,
  `phytosterol` double DEFAULT NULL,
  `purine` double DEFAULT NULL,
  `weight` int(11) DEFAULT NULL,
  `protein` double DEFAULT NULL,
  `lysin` double DEFAULT NULL,
  `methionin` double DEFAULT NULL,
  `tryptophan` double DEFAULT NULL,
  `phenylalanin` double DEFAULT NULL,
  `threonin` double DEFAULT NULL,
  `isoleucine` double DEFAULT NULL,
  `arginine` double DEFAULT NULL,
  `histidine` double DEFAULT NULL,
  `alanine` double DEFAULT NULL,
  `aspartic_acid` double DEFAULT NULL,
  `glutamic_acid` double DEFAULT NULL,
  `glycine` double DEFAULT NULL,
  `proline` double DEFAULT NULL,
  `serine` double DEFAULT NULL,
  `animal_protein` double DEFAULT NULL,
  `unanimal_protein` double DEFAULT NULL,
  `cystine` double DEFAULT NULL,
  `valine` double DEFAULT NULL,
  `tyrosine` double DEFAULT NULL,
  `leucine` double DEFAULT NULL,
  `lignoceric` double DEFAULT NULL,
  `animal_lipid` double DEFAULT NULL,
  `unanimal_lipid` double DEFAULT NULL,
  `riboflavin` double DEFAULT NULL COMMENT 'Vitamin B2',
  `thiamine` double DEFAULT NULL COMMENT 'Vitamin B1',
  `niacin` double DEFAULT NULL COMMENT 'Vitamin PP',
  `pantothenic_acid` double DEFAULT NULL COMMENT 'Vitamin B5',
  `folic_acid` double DEFAULT NULL COMMENT 'Vitamin B9',
  `biotin` double DEFAULT NULL COMMENT 'Vitamin B7',
  `caroten` double DEFAULT NULL,
  `vitamin_a_rae` double DEFAULT NULL,
  `vitamin_b6` double DEFAULT NULL,
  `vitamin_b12` double DEFAULT NULL,
  `vitamin_c` double DEFAULT NULL,
  `vitamin_e` double DEFAULT NULL,
  `vitamin_k` double DEFAULT NULL,
  `b_carotene` double DEFAULT NULL,
  `a_carotene` double DEFAULT NULL,
  `b_cryptoxanthin` double DEFAULT NULL,
  `edible` int(11) DEFAULT NULL,
  `energy` int(11) DEFAULT NULL,
  `water` double DEFAULT NULL,
  `fat` double DEFAULT NULL,
  `carbohydrate` double DEFAULT NULL,
  `fiber` double DEFAULT NULL,
  `ash` double DEFAULT NULL,
  `calci` double DEFAULT NULL,
  `phosphorous` double DEFAULT NULL,
  `fe` double DEFAULT NULL,
  `zinc` double DEFAULT NULL,
  `sodium` int(11) DEFAULT NULL,
  `potassium` int(11) DEFAULT NULL,
  `magnesium` int(11) DEFAULT NULL,
  `manganese` double DEFAULT NULL,
  `copper` int(11) DEFAULT NULL,
  `selenium` double DEFAULT NULL,
  `fluoride` double DEFAULT NULL,
  `iodine` double DEFAULT NULL,
  `total_saturated_fat` double DEFAULT NULL,
  `palmitic` double DEFAULT NULL,
  `margaric` double DEFAULT NULL,
  `stearic` double DEFAULT NULL,
  `arachidic` double DEFAULT NULL,
  `behenic` double DEFAULT NULL,
  `mufa` double DEFAULT NULL,
  `myristoleic` double DEFAULT NULL,
  `palmitoleic` double DEFAULT NULL,
  `oleic` double DEFAULT NULL,
  `pufa` double DEFAULT NULL,
  `linoleic` double DEFAULT NULL,
  `linolenic` double DEFAULT NULL,
  `arachidonic` double DEFAULT NULL,
  `dha` double DEFAULT NULL,
  `trans_fatty_acids` double DEFAULT NULL,
  `cholesterol` double DEFAULT NULL,
  `vitamin_d` double DEFAULT NULL,
  `epa` double DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `food_info`
--
ALTER TABLE `food_info`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_type_year` (`type`,`type_year`),
  ADD KEY `idx_name_type_year` (`name`,`type`,`type_year`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `food_info`
--
ALTER TABLE `food_info`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
