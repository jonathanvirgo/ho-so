-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jan 10, 2026 at 10:30 AM
-- Server version: 10.6.24-MariaDB-cll-lve-log
-- PHP Version: 8.4.16

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
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `email` varchar(256) DEFAULT NULL,
  `action` varchar(50) DEFAULT NULL,
  `resource` varchar(50) DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `active` tinyint(4) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auth_logs`
--

CREATE TABLE `auth_logs` (
  `id` int(11) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `action` varchar(50) DEFAULT NULL,
  `success` tinyint(1) DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `active` tinyint(4) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `campaign`
--

CREATE TABLE `campaign` (
  `id` int(11) UNSIGNED NOT NULL,
  `name` varchar(256) DEFAULT NULL,
  `active` tinyint(4) NOT NULL DEFAULT 1,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cat_gan_nho_kpa`
--

CREATE TABLE `cat_gan_nho_kpa` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `patient_id` bigint(20) DEFAULT NULL,
  `time` timestamp NULL DEFAULT NULL,
  `nd_duong_th` text DEFAULT NULL,
  `nd_tinh_mac` text DEFAULT NULL,
  `note` text DEFAULT NULL,
  `xet_nghiem` text NOT NULL,
  `y_kien_bs` text DEFAULT NULL,
  `active` tinyint(4) NOT NULL DEFAULT 1,
  `campaign_id` bigint(20) DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dishes`
--

CREATE TABLE `dishes` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL COMMENT 'Tên món ăn',
  `description` text DEFAULT NULL COMMENT 'Mô tả món ăn',
  `category` varchar(100) DEFAULT NULL COMMENT 'Loại món ăn (chính, phụ, tráng miệng, etc.)',
  `created_by` int(11) DEFAULT NULL COMMENT 'Người tạo',
  `campaign_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1: active, 0: inactive, -1: deleted',
  `share` tinyint(4) NOT NULL DEFAULT 0 COMMENT '1 share'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng món ăn';

-- --------------------------------------------------------

--
-- Table structure for table `dish_foods`
--

CREATE TABLE `dish_foods` (
  `id` int(11) NOT NULL,
  `dish_id` int(11) NOT NULL COMMENT 'ID món ăn',
  `food_id` int(11) NOT NULL COMMENT 'ID thực phẩm',
  `weight` int(11) NOT NULL DEFAULT 0 COMMENT 'Khối lượng thực phẩm trong món ăn (g)',
  `order_index` int(11) DEFAULT 0 COMMENT 'Thứ tự sắp xếp',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng chi tiết thực phẩm trong món ăn';

-- --------------------------------------------------------

--
-- Table structure for table `food_info`
--

CREATE TABLE `food_info` (
  `id` int(11) NOT NULL,
  `code` varchar(128) DEFAULT NULL,
  `name` varchar(512) NOT NULL,
  `type` enum('raw','cooked','cooked_vdd','milk','ddd','cake') DEFAULT 'raw' COMMENT 'Loại thực phẩm: raw=sống, cooked=chín, cooked_vdd = chín viện dinh dưỡng',
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
  `vitamin_a_ui` double DEFAULT NULL,
  `vitamin_d_ui` double DEFAULT NULL,
  `vitamin_d` double DEFAULT NULL,
  `epa` double DEFAULT NULL,
  `choline` double DEFAULT NULL,
  `taurine` double DEFAULT NULL,
  `mct` double DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `note` longtext DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_issues`
--

CREATE TABLE `inventory_issues` (
  `id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL COMMENT 'ID kho',
  `issue_code` varchar(50) NOT NULL COMMENT 'Mã phiếu xuất',
  `issue_date` date NOT NULL COMMENT 'Ngày xuất kho',
  `issue_type` enum('menu','manual','waste','return') DEFAULT 'manual' COMMENT 'Loại xuất: menu=theo thực đơn, manual=thủ công, waste=hao hụt, return=trả lại',
  `menu_build_id` int(11) DEFAULT NULL COMMENT 'ID thực đơn (nếu xuất theo thực đơn)',
  `menu_week` int(11) DEFAULT NULL COMMENT 'Tuần thực đơn',
  `menu_day` int(11) DEFAULT NULL COMMENT 'Ngày thực đơn',
  `receiver` varchar(255) DEFAULT NULL COMMENT 'Người nhận',
  `note` text DEFAULT NULL COMMENT 'Ghi chú',
  `status` enum('draft','confirmed','cancelled') DEFAULT 'confirmed' COMMENT 'Trạng thái phiếu',
  `created_by` int(11) NOT NULL COMMENT 'ID người tạo',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Phiếu xuất kho';

-- --------------------------------------------------------

--
-- Table structure for table `inventory_issue_items`
--

CREATE TABLE `inventory_issue_items` (
  `id` int(11) NOT NULL,
  `issue_id` int(11) NOT NULL COMMENT 'ID phiếu xuất',
  `food_id` int(11) NOT NULL COMMENT 'ID thực phẩm',
  `receipt_item_id` int(11) DEFAULT NULL COMMENT 'ID chi tiết phiếu nhập (FIFO)',
  `quantity` decimal(10,2) NOT NULL COMMENT 'Số lượng xuất (kg)',
  `unit` varchar(20) DEFAULT 'kg' COMMENT 'Đơn vị tính',
  `note` text DEFAULT NULL COMMENT 'Ghi chú',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Chi tiết phiếu xuất kho';

-- --------------------------------------------------------

--
-- Table structure for table `inventory_receipts`
--

CREATE TABLE `inventory_receipts` (
  `id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL COMMENT 'ID kho',
  `receipt_code` varchar(50) NOT NULL COMMENT 'Mã phiếu nhập',
  `receipt_date` date NOT NULL COMMENT 'Ngày nhập kho',
  `supplier` varchar(255) DEFAULT NULL COMMENT 'Nhà cung cấp',
  `total_amount` decimal(15,2) DEFAULT 0.00 COMMENT 'Tổng tiền',
  `note` text DEFAULT NULL COMMENT 'Ghi chú',
  `status` enum('draft','confirmed','cancelled') DEFAULT 'confirmed' COMMENT 'Trạng thái phiếu',
  `created_by` int(11) NOT NULL COMMENT 'ID người tạo',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Phiếu nhập kho';

-- --------------------------------------------------------

--
-- Table structure for table `inventory_receipt_items`
--

CREATE TABLE `inventory_receipt_items` (
  `id` int(11) NOT NULL,
  `receipt_id` int(11) NOT NULL COMMENT 'ID phiếu nhập',
  `food_id` int(11) NOT NULL COMMENT 'ID thực phẩm',
  `quantity` decimal(10,2) NOT NULL COMMENT 'Số lượng nhập (kg)',
  `unit` varchar(20) DEFAULT 'kg' COMMENT 'Đơn vị tính',
  `unit_price` decimal(10,2) DEFAULT 0.00 COMMENT 'Đơn giá (VNĐ/kg)',
  `total_price` decimal(15,2) DEFAULT 0.00 COMMENT 'Thành tiền',
  `expiry_date` date DEFAULT NULL COMMENT 'Hạn sử dụng',
  `batch_code` varchar(50) DEFAULT NULL COMMENT 'Mã lô',
  `note` text DEFAULT NULL COMMENT 'Ghi chú',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Chi tiết phiếu nhập kho';

-- --------------------------------------------------------

--
-- Table structure for table `inventory_stock`
--

CREATE TABLE `inventory_stock` (
  `id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL COMMENT 'ID kho',
  `food_id` int(11) NOT NULL COMMENT 'ID thực phẩm',
  `receipt_item_id` int(11) NOT NULL COMMENT 'ID chi tiết phiếu nhập (FIFO)',
  `batch_code` varchar(50) DEFAULT NULL COMMENT 'Mã lô',
  `expiry_date` date DEFAULT NULL COMMENT 'Hạn sử dụng',
  `quantity_in` decimal(10,2) NOT NULL COMMENT 'Số lượng nhập',
  `quantity_out` decimal(10,2) DEFAULT 0.00 COMMENT 'Số lượng xuất',
  `quantity_available` decimal(10,2) NOT NULL COMMENT 'Số lượng còn lại',
  `unit` varchar(20) DEFAULT 'kg' COMMENT 'Đơn vị tính',
  `unit_price` decimal(10,2) DEFAULT 0.00 COMMENT 'Đơn giá',
  `receipt_date` date NOT NULL COMMENT 'Ngày nhập',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tồn kho hiện tại (FIFO)';

-- --------------------------------------------------------

--
-- Table structure for table `inventory_warehouses`
--

CREATE TABLE `inventory_warehouses` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL COMMENT 'Tên kho',
  `campaign_id` int(11) NOT NULL COMMENT 'ID chiến dịch',
  `location` varchar(255) DEFAULT NULL COMMENT 'Vị trí kho',
  `description` text DEFAULT NULL COMMENT 'Mô tả',
  `active` tinyint(4) DEFAULT 1 COMMENT '1: Hoạt động, 0: Ngừng hoạt động',
  `created_by` int(11) NOT NULL COMMENT 'ID người tạo',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Kho thực phẩm';

-- --------------------------------------------------------

--
-- Table structure for table `log_activities`
--

CREATE TABLE `log_activities` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `full_message` text DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `method` varchar(255) DEFAULT NULL,
  `ip` varchar(255) DEFAULT NULL,
  `agent` varchar(255) DEFAULT NULL,
  `form_data` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `active` tinyint(4) DEFAULT 1,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `menu_builds`
--

CREATE TABLE `menu_builds` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL COMMENT 'Tên thực đơn',
  `description` text DEFAULT NULL COMMENT 'Mô tả thực đơn',
  `view_type` enum('week','month') DEFAULT 'month' COMMENT 'Loại hiển thị: week (theo tuần), month (theo tháng)',
  `selected_week` tinyint(4) DEFAULT NULL COMMENT 'Tuần được chọn (1-4) nếu view_type = week',
  `visible_meal_times` longtext DEFAULT NULL COMMENT 'Danh sách ID giờ ăn hiển thị (JSON array). VD: [3,5,7] = Sáng, Trưa, Tối',
  `visible_categories` longtext DEFAULT NULL,
  `start_date` date DEFAULT NULL COMMENT 'Ngày bắt đầu áp dụng',
  `end_date` date DEFAULT NULL COMMENT 'Ngày kết thúc áp dụng',
  `status` enum('draft','active','archived') DEFAULT 'draft' COMMENT 'Trạng thái: draft (nháp), active (đang dùng), archived (lưu trữ)',
  `note` text DEFAULT NULL COMMENT 'Ghi chú',
  `active` tinyint(4) DEFAULT 1,
  `created_by` int(11) NOT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Thực đơn xây dựng theo tuần/tháng';

-- --------------------------------------------------------

--
-- Table structure for table `menu_build_details`
--

CREATE TABLE `menu_build_details` (
  `id` int(11) NOT NULL,
  `menu_build_id` int(11) NOT NULL COMMENT 'ID thực đơn',
  `week_number` tinyint(4) NOT NULL COMMENT 'Tuần thứ mấy (1-4)',
  `day_of_week` tinyint(4) NOT NULL COMMENT 'Thứ trong tuần (2-8, với 8 là Chủ nhật)',
  `menu_time_id` int(11) NOT NULL DEFAULT 5 COMMENT 'ID giờ ăn từ bảng menu_time (3=Sáng, 4=Phụ sáng, 5=Trưa, 6=Chiều, 7=Tối, 8=Phụ tối)',
  `detail` longtext DEFAULT NULL COMMENT 'Chi tiết thực đơn dạng JSON như menuExamine.json: {courses: [...], listFood: [...]}',
  `note` text DEFAULT NULL COMMENT 'Ghi chú cho món ăn này',
  `active` tinyint(4) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Chi tiết món ăn trong thực đơn theo từng ngày';

-- --------------------------------------------------------

--
-- Table structure for table `menu_example`
--

CREATE TABLE `menu_example` (
  `id` int(11) NOT NULL,
  `name_menu` varchar(255) NOT NULL,
  `detail` longtext NOT NULL,
  `share` tinyint(4) DEFAULT NULL,
  `active` tinyint(4) DEFAULT 1,
  `campaign_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `menu_time`
--

CREATE TABLE `menu_time` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `time` varchar(255) NOT NULL,
  `share` tinyint(4) DEFAULT NULL,
  `order_sort` smallint(6) DEFAULT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification_settings`
--

CREATE TABLE `notification_settings` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `survey_config_id` varchar(36) DEFAULT NULL,
  `notification_type` varchar(50) NOT NULL,
  `event_type` varchar(50) NOT NULL,
  `enabled` tinyint(1) DEFAULT 1,
  `settings` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `id` bigint(20) NOT NULL,
  `fullname` varchar(255) NOT NULL DEFAULT '',
  `phone` varchar(255) DEFAULT NULL,
  `gender` tinyint(1) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `address` varchar(1024) DEFAULT NULL,
  `ngay_nhap_vien` timestamp NULL DEFAULT NULL,
  `ma_benh_an` varchar(255) DEFAULT NULL,
  `phong_dieu_tri` varchar(255) DEFAULT NULL,
  `dan_toc` varchar(512) DEFAULT NULL,
  `dan_toc_khac` varchar(512) DEFAULT NULL,
  `trinh_do` tinyint(4) DEFAULT NULL,
  `nghe_nghiep` tinyint(4) DEFAULT NULL,
  `nghe_nghiep_khac` varchar(1024) DEFAULT NULL,
  `noi_o` varchar(1024) DEFAULT NULL,
  `xep_loai_kt` tinyint(4) DEFAULT NULL COMMENT 'xep loai kinh te',
  `chuan_doan` text DEFAULT NULL,
  `khoa` varchar(128) DEFAULT NULL,
  `que_quan` varchar(256) DEFAULT NULL,
  `type` tinyint(4) NOT NULL COMMENT '3 viem gan 4 uon van 5 cat gan',
  `moi_quan_he` text DEFAULT NULL,
  `dieu_tra_vien` varchar(1024) DEFAULT NULL,
  `tien_su_benh` text DEFAULT NULL,
  `cn` varchar(128) DEFAULT NULL,
  `cc` varchar(128) DEFAULT NULL,
  `bien_ban` tinyint(4) DEFAULT 0,
  `khan_cap` tinyint(4) DEFAULT 0,
  `ngay_hoi_chan` timestamp NULL DEFAULT NULL,
  `ngay_dieu_tra` timestamp NULL DEFAULT NULL,
  `active` tinyint(4) NOT NULL DEFAULT 1,
  `created_by` bigint(20) DEFAULT NULL,
  `campaign_id` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patients_research`
--

CREATE TABLE `patients_research` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `fullname` varchar(512) DEFAULT NULL,
  `phone` varchar(128) DEFAULT NULL,
  `gender` tinyint(1) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `address` varchar(3072) DEFAULT NULL,
  `ngay_nhap_vien` timestamp NULL DEFAULT NULL,
  `ma_benh_an` varchar(128) DEFAULT NULL,
  `phong_dieu_tri` varchar(128) DEFAULT NULL,
  `dan_toc` varchar(256) DEFAULT NULL,
  `dan_toc_khac` varchar(256) DEFAULT NULL,
  `trinh_do` tinyint(4) DEFAULT NULL,
  `nghe_nghiep` tinyint(4) DEFAULT NULL,
  `nghe_nghiep_khac` varchar(512) DEFAULT NULL,
  `noi_o` varchar(1024) DEFAULT NULL,
  `xep_loai_kt` tinyint(4) DEFAULT NULL,
  `chuan_doan` text DEFAULT NULL,
  `khoa` varchar(128) DEFAULT NULL,
  `que_quan` varchar(256) DEFAULT NULL,
  `id_research` bigint(20) DEFAULT NULL,
  `menu_example` longtext DEFAULT NULL,
  `active` tinyint(4) NOT NULL DEFAULT 1,
  `campaign_id` int(11) DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patient_photos`
--

CREATE TABLE `patient_photos` (
  `id` int(11) NOT NULL,
  `patient_id` bigint(20) NOT NULL,
  `photo_url` varchar(500) NOT NULL,
  `public_id` varchar(255) NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `phieu_hoi_chan_danh_gia`
--

CREATE TABLE `phieu_hoi_chan_danh_gia` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `patient_id` bigint(20) DEFAULT NULL,
  `time_id` bigint(20) DEFAULT NULL,
  `tinh_trang_nguoi_benh` text DEFAULT NULL,
  `khau_phan_an_24h` text DEFAULT NULL,
  `tieu_hoa` text DEFAULT NULL,
  `danh_gia` text DEFAULT NULL,
  `ket_qua_can_lam_sang` text DEFAULT NULL,
  `can_thiep_kcal` varchar(96) DEFAULT NULL,
  `can_thiep_kg` varchar(96) DEFAULT NULL,
  `can_thiep_note` text DEFAULT NULL,
  `che_do_dinh_duong` varchar(96) DEFAULT NULL,
  `che_do_dinh_duong_note` text DEFAULT NULL,
  `bo_sung` text DEFAULT NULL,
  `chu_y` text DEFAULT NULL,
  `active` tinyint(4) DEFAULT 1,
  `campaign_id` int(11) DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `phieu_hoi_chan_ttc`
--

CREATE TABLE `phieu_hoi_chan_ttc` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `patient_id` bigint(20) DEFAULT NULL,
  `cn` varchar(384) DEFAULT NULL,
  `cc` varchar(384) DEFAULT NULL,
  `ctc` varchar(384) DEFAULT NULL,
  `chuan_doan_ls` text DEFAULT NULL,
  `ngay_hoi_chan` date DEFAULT NULL,
  `cn_1_thang` varchar(96) DEFAULT NULL,
  `khau_phan_an` varchar(96) DEFAULT NULL,
  `trieu_chung_th` varchar(96) DEFAULT NULL,
  `giam_chuc_nang_hd` varchar(96) DEFAULT NULL,
  `nhu_cau_chuyen_hoa` varchar(96) DEFAULT NULL,
  `kham_lam_sang` varchar(96) DEFAULT NULL,
  `chon_tt_1` varchar(96) DEFAULT NULL,
  `tien_su_benh` text DEFAULT NULL,
  `tinh_trang_nguoi_benh` text DEFAULT NULL,
  `khau_phan_an_24h` text DEFAULT NULL,
  `tieu_hoa` text DEFAULT NULL,
  `che_do_dinh_duong` varchar(96) DEFAULT NULL,
  `che_do_dinh_duong_note` text DEFAULT NULL,
  `duong_nuoi` varchar(32) DEFAULT NULL,
  `dich_vao` int(11) DEFAULT NULL,
  `dich_ra` int(11) DEFAULT NULL,
  `e_nckn` varchar(384) DEFAULT NULL,
  `can_thiep_kcal` varchar(384) DEFAULT NULL,
  `can_thiep_kg` varchar(384) DEFAULT NULL,
  `can_thiep_note` text DEFAULT NULL,
  `ket_qua_can_lam_sang` text DEFAULT NULL,
  `bo_sung` text DEFAULT NULL,
  `chu_y` text DEFAULT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `active` tinyint(4) DEFAULT 1,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL COMMENT 'Tên dự án',
  `description` text DEFAULT NULL COMMENT 'Mô tả dự án',
  `start_date` date DEFAULT NULL COMMENT 'Ngày bắt đầu',
  `end_date` date DEFAULT NULL COMMENT 'Ngày kết thúc',
  `google_sheet_id` varchar(255) DEFAULT NULL COMMENT 'ID của Google Sheet để lưu dữ liệu',
  `google_sheet_url` text DEFAULT NULL COMMENT 'URL của Google Sheet',
  `created_by` int(11) NOT NULL COMMENT 'ID người tạo',
  `sqlite_db_path` text DEFAULT NULL,
  `campaign_id` int(11) DEFAULT NULL COMMENT 'ID chiến dịch',
  `active` tinyint(4) DEFAULT 1 COMMENT '1: Hoạt động, 0: Tạm dừng, -1: Đã xóa',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `research`
--

CREATE TABLE `research` (
  `id` bigint(20) NOT NULL,
  `name` varchar(1024) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `campaign_id` int(11) DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `active` tinyint(4) DEFAULT 1,
  `note` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `role`
--

CREATE TABLE `role` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(60) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `role_user`
--

CREATE TABLE `role_user` (
  `id` bigint(20) NOT NULL,
  `role_id` int(11) NOT NULL,
  `user_id` int(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `setting`
--

CREATE TABLE `setting` (
  `id` int(11) NOT NULL,
  `systemname` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `body` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `survey_configs`
--

CREATE TABLE `survey_configs` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL COMMENT 'ID dự án',
  `name` varchar(255) NOT NULL COMMENT 'Tên cấu hình khảo sát',
  `description` text DEFAULT NULL COMMENT 'Mô tả khảo sát',
  `survey_url_slug` varchar(255) NOT NULL COMMENT 'Slug URL cho khảo sát công khai',
  `allow_multiple_responses` tinyint(4) DEFAULT 0 COMMENT '1: Cho phép nhiều phản hồi, 0: Chỉ 1 lần',
  `require_email` tinyint(4) DEFAULT 0 COMMENT '1: Bắt buộc email, 0: Không bắt buộc',
  `success_message` text DEFAULT NULL COMMENT 'Thông báo sau khi submit thành công',
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Các cài đặt khác (theme, validation, etc.)' CHECK (json_valid(`settings`)),
  `created_by` int(11) NOT NULL COMMENT 'ID người tạo',
  `campaign_id` int(11) DEFAULT NULL COMMENT 'ID chiến dịch',
  `active` tinyint(4) DEFAULT 1 COMMENT '1: Hoạt động, 0: Tạm dừng',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `survey_fields`
--

CREATE TABLE `survey_fields` (
  `id` int(11) NOT NULL,
  `survey_config_id` int(11) NOT NULL COMMENT 'ID cấu hình khảo sát',
  `field_name` varchar(255) NOT NULL COMMENT 'Tên trường (dùng làm name attribute)',
  `field_label` varchar(255) NOT NULL COMMENT 'Nhãn hiển thị',
  `field_type` enum('text','textarea','select','multiselect','radio','checkbox','datetime','date','time','number','email','url') NOT NULL COMMENT 'Loại trường',
  `field_options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Các tùy chọn cho select, radio, checkbox (array of {value, label})' CHECK (json_valid(`field_options`)),
  `is_required` tinyint(4) DEFAULT 0 COMMENT '1: Bắt buộc, 0: Không bắt buộc',
  `placeholder` varchar(255) DEFAULT NULL COMMENT 'Placeholder text',
  `help_text` text DEFAULT NULL COMMENT 'Text hướng dẫn',
  `validation_rules` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Các rule validation (min, max, pattern, etc.)' CHECK (json_valid(`validation_rules`)),
  `field_order` int(11) DEFAULT 0 COMMENT 'Thứ tự hiển thị',
  `field_settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Cài đặt riêng cho từng loại field' CHECK (json_valid(`field_settings`)),
  `created_by` int(11) NOT NULL COMMENT 'ID người tạo',
  `active` tinyint(4) DEFAULT 1 COMMENT '1: Hiển thị, 0: Ẩn',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `survey_responses`
--

CREATE TABLE `survey_responses` (
  `id` int(11) NOT NULL,
  `survey_config_id` int(11) NOT NULL COMMENT 'ID cấu hình khảo sát',
  `respondent_email` varchar(255) DEFAULT NULL COMMENT 'Email người trả lời (nếu có)',
  `respondent_ip` varchar(45) DEFAULT NULL COMMENT 'IP address người trả lời',
  `user_agent` text DEFAULT NULL COMMENT 'User agent của browser',
  `session_id` varchar(255) DEFAULT NULL COMMENT 'Session ID để track multiple responses',
  `is_completed` tinyint(4) DEFAULT 0 COMMENT '1: Hoàn thành, 0: Chưa hoàn thành',
  `submitted_at` datetime DEFAULT NULL COMMENT 'Thời gian submit',
  `google_sheet_row_id` int(11) DEFAULT NULL COMMENT 'ID dòng trong Google Sheet',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Metadata khác (referrer, utm params, etc.)' CHECK (json_valid(`metadata`)),
  `active` tinyint(4) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `survey_response_data`
--

CREATE TABLE `survey_response_data` (
  `id` int(11) NOT NULL,
  `survey_response_id` int(11) NOT NULL COMMENT 'ID phản hồi khảo sát',
  `survey_field_id` int(11) NOT NULL COMMENT 'ID trường khảo sát',
  `field_name` varchar(255) NOT NULL COMMENT 'Tên trường (để backup)',
  `field_value` text DEFAULT NULL COMMENT 'Giá trị trả lời',
  `field_value_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Giá trị dạng JSON (cho multiselect, checkbox)' CHECK (json_valid(`field_value_json`)),
  `active` tinyint(4) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `times`
--

CREATE TABLE `times` (
  `id` bigint(20) NOT NULL,
  `patient_id` bigint(20) NOT NULL,
  `time` timestamp NULL DEFAULT NULL,
  `type` varchar(128) DEFAULT NULL COMMENT '1 tinh trang dd 2 can thiep dd 3 sga',
  `active` tinyint(4) DEFAULT 1,
  `project` varchar(128) DEFAULT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `uon_van_kpa`
--

CREATE TABLE `uon_van_kpa` (
  `id` bigint(20) NOT NULL,
  `patient_id` bigint(20) NOT NULL,
  `time` timestamp NULL DEFAULT NULL,
  `nd_duong_th` text DEFAULT NULL,
  `nd_tinh_mac` text DEFAULT NULL,
  `note` text DEFAULT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `active` tinyint(4) DEFAULT 1,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `uon_van_ls`
--

CREATE TABLE `uon_van_ls` (
  `id` bigint(20) NOT NULL,
  `patient_id` bigint(20) DEFAULT NULL,
  `time_id` bigint(20) DEFAULT NULL,
  `cn` varchar(128) DEFAULT NULL,
  `vong_bap_chan` varchar(128) DEFAULT NULL,
  `cc` varchar(128) DEFAULT NULL,
  `albumin` varchar(128) DEFAULT NULL,
  `pre_albumin` varchar(128) DEFAULT NULL,
  `hemoglobin` varchar(128) DEFAULT NULL,
  `protein` varchar(128) DEFAULT NULL,
  `phospho` varchar(128) DEFAULT NULL,
  `glucose` varchar(128) DEFAULT NULL,
  `magie` varchar(128) DEFAULT NULL,
  `kali` varchar(128) DEFAULT NULL,
  `ck` varchar(128) DEFAULT NULL,
  `ure` varchar(128) DEFAULT NULL,
  `bilirubin` varchar(128) DEFAULT NULL,
  `creatinin` varchar(128) DEFAULT NULL,
  `benh_ly` text DEFAULT NULL,
  `thuoc` text DEFAULT NULL,
  `active` tinyint(4) DEFAULT 1,
  `campaign_id` int(11) DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `uon_van_med`
--

CREATE TABLE `uon_van_med` (
  `id` bigint(20) NOT NULL,
  `name` varchar(256) NOT NULL,
  `type` varchar(128) NOT NULL,
  `active` tinyint(4) DEFAULT 1,
  `campaign_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `uon_van_sga`
--

CREATE TABLE `uon_van_sga` (
  `id` bigint(20) NOT NULL,
  `patient_id` bigint(20) NOT NULL,
  `time_id` bigint(20) NOT NULL,
  `cn_6_thang` tinyint(4) DEFAULT NULL,
  `cn_2_tuan` tinyint(4) DEFAULT NULL,
  `khau_phan_an_ht` tinyint(4) DEFAULT NULL,
  `tieu_chung_th` tinyint(4) DEFAULT NULL,
  `giam_chuc_nang` tinyint(4) DEFAULT NULL,
  `nc_chuyen_hoa` tinyint(4) DEFAULT NULL,
  `mo_duoi_da` tinyint(4) DEFAULT NULL,
  `teo_co` tinyint(4) DEFAULT NULL,
  `phu` tinyint(4) DEFAULT NULL,
  `co_chuong` tinyint(4) DEFAULT NULL,
  `phan_loai` tinyint(4) DEFAULT NULL,
  `total_point` int(11) DEFAULT NULL,
  `active` tinyint(4) DEFAULT 1,
  `campaign_id` int(11) DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `uon_van_ttth`
--

CREATE TABLE `uon_van_ttth` (
  `id` bigint(20) NOT NULL,
  `patient_id` bigint(20) DEFAULT NULL,
  `time_id` bigint(20) DEFAULT NULL,
  `chuong_bung` tinyint(4) DEFAULT NULL,
  `trao_nguoc` tinyint(4) DEFAULT NULL,
  `tao_bon` tinyint(4) DEFAULT NULL,
  `phan_long_3_ngay` tinyint(4) DEFAULT NULL,
  `duong_mau_10` tinyint(4) DEFAULT NULL,
  `duong_mau_20` tinyint(4) DEFAULT NULL,
  `so_lan_di_ngoai` int(11) DEFAULT NULL,
  `tinh_trang_phan` varchar(512) DEFAULT NULL,
  `dich_ton_du` varchar(128) DEFAULT NULL,
  `active` tinyint(4) DEFAULT 1,
  `campaign_id` int(11) DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `uploaded_files`
--

CREATE TABLE `uploaded_files` (
  `id` varchar(36) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `file_path` text NOT NULL,
  `thumbnail_path` text DEFAULT NULL,
  `mime_type` varchar(100) NOT NULL,
  `file_size` bigint(20) NOT NULL,
  `file_hash` varchar(32) NOT NULL,
  `survey_id` varchar(36) DEFAULT NULL,
  `uploaded_by` varchar(36) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int(10) UNSIGNED NOT NULL,
  `fullname` varchar(250) NOT NULL,
  `password` text NOT NULL,
  `email` varchar(400) NOT NULL,
  `phone` varchar(45) DEFAULT NULL,
  `gender` tinyint(4) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 0,
  `jwt_token_id` varchar(255) DEFAULT NULL COMMENT 'JWT token identifier cho single device login',
  `device_info` text DEFAULT NULL COMMENT 'Thông tin thiết bị (user agent, IP, etc.)',
  `token_created_at` timestamp NULL DEFAULT NULL COMMENT 'Thời gian tạo token',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `max_sessions` int(11) DEFAULT 5 COMMENT 'Số lượng session tối đa cho phép',
  `allow_multiple_devices` tinyint(1) DEFAULT 1 COMMENT 'Cho phép đăng nhập nhiều thiết bị',
  `campaign_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `jwt_token_id` varchar(255) NOT NULL,
  `device_name` varchar(255) DEFAULT NULL COMMENT 'Tên thiết bị (tự động detect)',
  `device_type` enum('desktop','mobile','tablet','unknown') DEFAULT 'unknown',
  `browser` varchar(100) DEFAULT NULL,
  `os` varchar(100) DEFAULT NULL,
  `device_info` text DEFAULT NULL COMMENT 'Thông tin thiết bị chi tiết',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL COMMENT 'Vị trí đăng nhập (nếu có)',
  `login_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_activity` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `logout_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_current_session` tinyint(1) DEFAULT 0 COMMENT 'Session hiện tại'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Lịch sử đăng nhập của user';

-- --------------------------------------------------------

--
-- Table structure for table `user_session_settings`
--

CREATE TABLE `user_session_settings` (
  `id` int(11) NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `max_sessions` int(11) DEFAULT 5,
  `session_timeout_hours` int(11) DEFAULT 24,
  `allow_multiple_devices` tinyint(1) DEFAULT 1,
  `notify_new_login` tinyint(1) DEFAULT 1 COMMENT 'Thông báo khi có đăng nhập mới',
  `auto_logout_inactive` tinyint(1) DEFAULT 1 COMMENT 'Tự động logout khi không hoạt động',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Cài đặt session của user';

-- --------------------------------------------------------

--
-- Table structure for table `viem_gam_ttcb`
--

CREATE TABLE `viem_gam_ttcb` (
  `id` bigint(20) NOT NULL,
  `patient_id` bigint(20) NOT NULL,
  `so_lan_vgc` tinyint(4) DEFAULT NULL COMMENT 'so lan dieu tri vgc',
  `thoi_gian_vgm` tinyint(4) DEFAULT NULL COMMENT 'thoi gian mac vg man',
  `thoi_gian_vg_ruou` tinyint(4) DEFAULT NULL COMMENT 'thoi giam mac vg ruou',
  `thoi_gian_vg_virus` tinyint(4) DEFAULT NULL COMMENT 'thoi giam mac vg virus',
  `benh_gan_mat_khac` varchar(1024) DEFAULT NULL,
  `thoi_gian_gm_khac` tinyint(4) DEFAULT NULL,
  `ts_benh_khac_1` varchar(1024) DEFAULT NULL,
  `ts_benh_1_so_nam` tinyint(4) DEFAULT NULL,
  `ts_benh_khac_2` varchar(1024) DEFAULT NULL,
  `ts_benh_2_so_nam` tinyint(4) DEFAULT NULL,
  `ts_benh_khac_3` varchar(1024) DEFAULT NULL,
  `ts_benh_3_so_nam` tinyint(4) DEFAULT NULL,
  `ts_benh_khac_4` varchar(1024) DEFAULT NULL,
  `ts_benh_4_so_nam` tinyint(4) DEFAULT NULL,
  `ts_benh_khac_5` varchar(1024) DEFAULT NULL,
  `ts_benh_5_so_nam` tinyint(4) DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `viem_gan_ctdd`
--

CREATE TABLE `viem_gan_ctdd` (
  `id` bigint(20) NOT NULL,
  `patient_id` bigint(20) NOT NULL,
  `time_id` bigint(20) NOT NULL,
  `chan_an` tinyint(4) DEFAULT NULL,
  `chan_an_note` varchar(1024) DEFAULT NULL,
  `an_khong_ngon` tinyint(4) DEFAULT NULL,
  `an_khong_ngon_note` varchar(1024) DEFAULT NULL,
  `buon_non` tinyint(4) DEFAULT NULL,
  `buon_non_note` varchar(1024) DEFAULT NULL,
  `non` tinyint(4) DEFAULT NULL,
  `non_note` varchar(1024) DEFAULT NULL,
  `tao_bon` tinyint(4) DEFAULT NULL,
  `tao_bon_note` varchar(1024) DEFAULT NULL,
  `tieu_chay` tinyint(4) DEFAULT NULL,
  `tieu_chay_note` varchar(1024) DEFAULT NULL,
  `song_phan` tinyint(4) DEFAULT NULL,
  `song_phan_note` varchar(1024) DEFAULT NULL,
  `nhiet_mieng` tinyint(4) DEFAULT NULL,
  `nhiet_mieng_note` varchar(1024) DEFAULT NULL,
  `thay_doi_vi_giac` tinyint(4) DEFAULT NULL,
  `thay_doi_vi_giac_note` varchar(1024) DEFAULT NULL,
  `khac` tinyint(4) DEFAULT NULL,
  `khac_note` text DEFAULT NULL,
  `co_chuong` tinyint(4) DEFAULT NULL,
  `co_chuong_note` varchar(1024) DEFAULT NULL,
  `met_moi` tinyint(4) DEFAULT NULL,
  `met_moi_note` varchar(1024) DEFAULT NULL,
  `dau` tinyint(4) DEFAULT NULL,
  `dau_note` varchar(1024) DEFAULT NULL,
  `active` tinyint(4) DEFAULT 1,
  `created_by` bigint(20) DEFAULT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `viem_gan_dhnv`
--

CREATE TABLE `viem_gan_dhnv` (
  `id` bigint(20) NOT NULL,
  `patient_id` bigint(20) NOT NULL,
  `chan_an_met_moi` tinyint(4) DEFAULT NULL,
  `bieu_hien_tieu_hoa` tinyint(4) DEFAULT NULL,
  `bieu_hien_tieu_hoa_khac` varchar(1024) DEFAULT NULL,
  `dau_tuc_hsp` tinyint(4) DEFAULT NULL,
  `dau_tuc_hsp_khi` tinyint(4) DEFAULT NULL,
  `dau_tuc_hsp_khac` varchar(1024) DEFAULT NULL,
  `vang_da_vang_mat` tinyint(4) DEFAULT NULL,
  `bieu_hien_phu` tinyint(4) DEFAULT NULL,
  `bieu_hien_co_chuong` tinyint(4) DEFAULT NULL,
  `ngua_da` tinyint(4) DEFAULT NULL,
  `ngua_da_khac` varchar(1024) DEFAULT NULL,
  `xuat_huyet_tieu_hoa` tinyint(4) DEFAULT NULL,
  `active` tinyint(4) DEFAULT 1,
  `created_by` bigint(20) DEFAULT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `viem_gan_mt1_dhnv`
--

CREATE TABLE `viem_gan_mt1_dhnv` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `patient_id` bigint(20) DEFAULT NULL,
  `chan_doan_benh` tinyint(4) DEFAULT NULL,
  `nguyen_nhan` tinyint(4) DEFAULT NULL,
  `nguyen_nhan_khac` varchar(1024) DEFAULT NULL,
  `cn` varchar(512) DEFAULT NULL,
  `cc` varchar(384) DEFAULT NULL,
  `vong_bap_chan` varchar(384) DEFAULT NULL,
  `got` varchar(384) DEFAULT NULL,
  `gpt` varchar(384) DEFAULT NULL,
  `hemoglobin` varchar(384) DEFAULT NULL,
  `bua_chinh` tinyint(4) DEFAULT NULL,
  `bua_phu` tinyint(4) DEFAULT NULL,
  `bua_phu_an` varchar(255) DEFAULT NULL,
  `bua_phu_an_khac` varchar(1024) DEFAULT NULL,
  `an_kieng` tinyint(4) DEFAULT NULL,
  `an_kieng_loai` varchar(255) DEFAULT NULL,
  `an_kieng_loai_khac` varchar(1024) DEFAULT NULL,
  `ruou_bia` tinyint(4) DEFAULT NULL,
  `ruou_bia_ts` tinyint(4) DEFAULT NULL,
  `ml_ruou` int(11) DEFAULT NULL,
  `ml_bia` int(11) DEFAULT NULL,
  `do_uong_khac` tinyint(4) DEFAULT NULL,
  `do_uong_khac_ts` tinyint(4) DEFAULT NULL,
  `loai_do_uong` varchar(255) DEFAULT NULL,
  `loai_do_uong_khac` varchar(3072) DEFAULT NULL,
  `su_dung_la_cay` tinyint(4) DEFAULT NULL,
  `loai_la_cay` varchar(1024) DEFAULT NULL,
  `note` text NOT NULL,
  `active` tinyint(4) NOT NULL DEFAULT 1,
  `created_by` bigint(20) DEFAULT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `viem_gan_mt1_kpa_not`
--

CREATE TABLE `viem_gan_mt1_kpa_not` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `time` datetime NOT NULL,
  `nd_duong_th_sang` varchar(255) DEFAULT NULL,
  `nd_duong_th_trua` varchar(255) DEFAULT NULL,
  `nd_duong_th_toi` varchar(255) DEFAULT NULL,
  `nd_duong_th_bua_phu` varchar(255) DEFAULT NULL,
  `nd_tinh_mac` varchar(255) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `active` tinyint(4) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `campaign_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `viem_gan_mt1_sga`
--

CREATE TABLE `viem_gan_mt1_sga` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `patient_id` bigint(20) DEFAULT NULL,
  `time_id` bigint(20) DEFAULT NULL,
  `cn_6_thang` tinyint(4) DEFAULT NULL,
  `cn_2_tuan` tinyint(4) DEFAULT NULL,
  `khau_phan_an_ht` tinyint(4) DEFAULT NULL,
  `tieu_chung_th` tinyint(4) DEFAULT NULL,
  `giam_chuc_nang` tinyint(4) DEFAULT NULL,
  `nc_chuyen_hoa` tinyint(4) DEFAULT NULL,
  `mo_duoi_da` tinyint(4) DEFAULT NULL,
  `teo_co` tinyint(4) DEFAULT NULL,
  `phu` tinyint(4) DEFAULT NULL,
  `co_chuong` tinyint(4) DEFAULT NULL,
  `phan_loai` tinyint(4) DEFAULT NULL,
  `total_point` int(11) DEFAULT NULL,
  `active` tinyint(4) NOT NULL DEFAULT 1,
  `created_by` bigint(20) DEFAULT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `viem_gan_mt1_so_gan`
--

CREATE TABLE `viem_gan_mt1_so_gan` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `tinh_trang_gan` tinyint(4) DEFAULT NULL,
  `muc_do_xo_gan` tinyint(4) DEFAULT NULL,
  `albumin` varchar(50) DEFAULT NULL,
  `tu_van_dd` tinyint(4) DEFAULT NULL,
  `so_bua_moi_ngay` tinyint(4) DEFAULT NULL,
  `bua_dem` tinyint(4) DEFAULT NULL,
  `benh_ly_kem_theo` varchar(255) DEFAULT NULL,
  `benh_ly_kem_theo_khac` varchar(512) DEFAULT NULL,
  `active` tinyint(4) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `campaign_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `viem_gan_sga`
--

CREATE TABLE `viem_gan_sga` (
  `id` bigint(20) NOT NULL,
  `patient_id` bigint(20) NOT NULL,
  `time_id` bigint(20) NOT NULL,
  `cn_6_thang` tinyint(4) DEFAULT NULL,
  `cn_2_tuan` tinyint(4) DEFAULT NULL,
  `khau_phan_an_ht` tinyint(4) DEFAULT NULL,
  `tieu_chung_th` tinyint(4) DEFAULT NULL,
  `giam_chuc_nang` tinyint(4) DEFAULT NULL,
  `nc_chuyen_hoa` tinyint(4) DEFAULT NULL,
  `mo_duoi_da` tinyint(4) DEFAULT NULL,
  `teo_co` tinyint(4) DEFAULT NULL,
  `phu` tinyint(4) DEFAULT NULL,
  `co_chuong` tinyint(4) DEFAULT NULL,
  `phan_loai` tinyint(4) DEFAULT NULL,
  `total_point` int(11) DEFAULT NULL,
  `active` tinyint(4) DEFAULT 1,
  `created_by` bigint(20) DEFAULT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `viem_gan_td_ngt`
--

CREATE TABLE `viem_gan_td_ngt` (
  `id` bigint(20) NOT NULL,
  `patient_id` bigint(20) NOT NULL,
  `time` timestamp NULL DEFAULT NULL,
  `cn` float DEFAULT NULL,
  `bat_thuong` text DEFAULT NULL,
  `tu_van` text DEFAULT NULL,
  `note` text DEFAULT NULL,
  `active` tinyint(4) DEFAULT 1,
  `created_by` bigint(20) DEFAULT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `viem_gan_td_not`
--

CREATE TABLE `viem_gan_td_not` (
  `id` bigint(20) NOT NULL,
  `patient_id` bigint(20) NOT NULL,
  `time` timestamp NULL DEFAULT NULL,
  `nd_duong_th` text DEFAULT NULL,
  `nd_tinh_mac` text DEFAULT NULL,
  `note` text DEFAULT NULL,
  `active` tinyint(4) DEFAULT 1,
  `created_by` bigint(20) DEFAULT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `viem_gan_tqau`
--

CREATE TABLE `viem_gan_tqau` (
  `id` bigint(20) NOT NULL,
  `patient_id` bigint(20) NOT NULL,
  `bua_chinh` tinyint(4) DEFAULT NULL,
  `bua_phu` tinyint(4) DEFAULT NULL,
  `bua_phu_an` varchar(255) DEFAULT NULL,
  `bua_phu_an_khac` varchar(1024) DEFAULT NULL,
  `an_kieng` tinyint(4) DEFAULT NULL,
  `an_kieng_loai` varchar(255) DEFAULT NULL,
  `an_kieng_loai_khac` varchar(1024) DEFAULT NULL,
  `ruou_bia` tinyint(4) DEFAULT NULL,
  `ruou_bia_ts` tinyint(4) DEFAULT NULL,
  `ml_ruou` int(11) DEFAULT NULL,
  `ml_bia` int(11) DEFAULT NULL,
  `do_uong_khac` tinyint(4) DEFAULT NULL,
  `do_uong_khac_ts` tinyint(4) DEFAULT NULL,
  `loai_do_uong` varchar(255) DEFAULT NULL,
  `loai_do_uong_khac` varchar(1024) DEFAULT NULL,
  `su_dung_la_cay` tinyint(4) DEFAULT NULL,
  `loai_la_cay` varchar(1024) DEFAULT NULL,
  `cham_soc_dd` tinyint(4) DEFAULT NULL,
  `cham_soc_dd_khac` varchar(1024) DEFAULT NULL,
  `active` tinyint(4) DEFAULT 1,
  `created_by` bigint(20) DEFAULT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `viem_gan_ttdd`
--

CREATE TABLE `viem_gan_ttdd` (
  `id` bigint(20) NOT NULL,
  `patient_id` bigint(20) NOT NULL,
  `time_id` bigint(20) NOT NULL,
  `cn` varchar(128) DEFAULT NULL,
  `cc` varchar(128) DEFAULT NULL,
  `vong_bap_chan` varchar(128) DEFAULT NULL,
  `glucose` varchar(128) DEFAULT NULL,
  `ure` varchar(128) DEFAULT NULL,
  `creatinin` varchar(128) DEFAULT NULL,
  `got` varchar(128) DEFAULT NULL,
  `gpt` varchar(128) DEFAULT NULL,
  `ggt` varchar(128) DEFAULT NULL,
  `hong_cau` varchar(128) DEFAULT NULL,
  `hemoglobin` varchar(128) DEFAULT NULL,
  `pre_albumin` varchar(128) DEFAULT NULL,
  `albumin` varchar(128) DEFAULT NULL,
  `protein_tp` varchar(128) DEFAULT NULL,
  `sat_huyet_thanh` varchar(128) DEFAULT NULL,
  `ferritin` varchar(128) DEFAULT NULL,
  `active` tinyint(4) DEFAULT 1,
  `created_by` bigint(20) DEFAULT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `auth_logs`
--
ALTER TABLE `auth_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `campaign`
--
ALTER TABLE `campaign`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cat_gan_nho_kpa`
--
ALTER TABLE `cat_gan_nho_kpa`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dishes`
--
ALTER TABLE `dishes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_active` (`active`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_created_by` (`created_by`);

--
-- Indexes for table `dish_foods`
--
ALTER TABLE `dish_foods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dish_id` (`dish_id`);

--
-- Indexes for table `food_info`
--
ALTER TABLE `food_info`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_type_year` (`type`,`type_year`),
  ADD KEY `idx_name_type_year` (`name`,`type`,`type_year`);

--
-- Indexes for table `inventory_issues`
--
ALTER TABLE `inventory_issues`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_issue_code` (`issue_code`),
  ADD KEY `idx_warehouse_id` (`warehouse_id`),
  ADD KEY `idx_issue_date` (`issue_date`),
  ADD KEY `idx_issue_type` (`issue_type`),
  ADD KEY `idx_menu_build_id` (`menu_build_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_by` (`created_by`);

--
-- Indexes for table `inventory_issue_items`
--
ALTER TABLE `inventory_issue_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_issue_id` (`issue_id`),
  ADD KEY `idx_food_id` (`food_id`),
  ADD KEY `idx_receipt_item_id` (`receipt_item_id`);

--
-- Indexes for table `inventory_receipts`
--
ALTER TABLE `inventory_receipts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_receipt_code` (`receipt_code`),
  ADD KEY `idx_warehouse_id` (`warehouse_id`),
  ADD KEY `idx_receipt_date` (`receipt_date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_by` (`created_by`);

--
-- Indexes for table `inventory_receipt_items`
--
ALTER TABLE `inventory_receipt_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_receipt_id` (`receipt_id`),
  ADD KEY `idx_food_id` (`food_id`),
  ADD KEY `idx_expiry_date` (`expiry_date`),
  ADD KEY `idx_batch_code` (`batch_code`);

--
-- Indexes for table `inventory_stock`
--
ALTER TABLE `inventory_stock`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_receipt_item` (`warehouse_id`,`receipt_item_id`),
  ADD KEY `idx_warehouse_food` (`warehouse_id`,`food_id`),
  ADD KEY `idx_food_id` (`food_id`),
  ADD KEY `idx_expiry_date` (`expiry_date`),
  ADD KEY `idx_batch_code` (`batch_code`),
  ADD KEY `idx_quantity_available` (`quantity_available`),
  ADD KEY `receipt_item_id` (`receipt_item_id`);

--
-- Indexes for table `inventory_warehouses`
--
ALTER TABLE `inventory_warehouses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_campaign_id` (`campaign_id`),
  ADD KEY `idx_active` (`active`),
  ADD KEY `idx_created_by` (`created_by`);

--
-- Indexes for table `log_activities`
--
ALTER TABLE `log_activities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `menu_builds`
--
ALTER TABLE `menu_builds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_menu_builds_created_by` (`created_by`),
  ADD KEY `idx_menu_builds_status` (`status`),
  ADD KEY `idx_menu_builds_view_type` (`view_type`),
  ADD KEY `idx_menu_builds_dates` (`start_date`,`end_date`);

--
-- Indexes for table `menu_build_details`
--
ALTER TABLE `menu_build_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_menu_build_details_menu` (`menu_build_id`),
  ADD KEY `idx_menu_build_details_week` (`week_number`),
  ADD KEY `idx_menu_build_details_day` (`day_of_week`),
  ADD KEY `idx_menu_time_id` (`menu_time_id`);

--
-- Indexes for table `menu_example`
--
ALTER TABLE `menu_example`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `menu_time`
--
ALTER TABLE `menu_time`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notification_settings`
--
ALTER TABLE `notification_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_survey_notification` (`user_id`,`survey_config_id`,`notification_type`,`event_type`),
  ADD KEY `idx_notification_settings_user` (`user_id`),
  ADD KEY `idx_notification_settings_survey` (`survey_config_id`),
  ADD KEY `idx_notification_settings_type` (`notification_type`),
  ADD KEY `idx_notification_settings_event` (`event_type`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `patients_research`
--
ALTER TABLE `patients_research`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `patient_photos`
--
ALTER TABLE `patient_photos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_patient_id` (`patient_id`);

--
-- Indexes for table `phieu_hoi_chan_danh_gia`
--
ALTER TABLE `phieu_hoi_chan_danh_gia`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `phieu_hoi_chan_ttc`
--
ALTER TABLE `phieu_hoi_chan_ttc`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_campaign_id` (`campaign_id`);

--
-- Indexes for table `research`
--
ALTER TABLE `research`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `role`
--
ALTER TABLE `role`
  ADD PRIMARY KEY (`role_id`);

--
-- Indexes for table `role_user`
--
ALTER TABLE `role_user`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_role_user_role` (`role_id`);

--
-- Indexes for table `setting`
--
ALTER TABLE `setting`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `survey_configs`
--
ALTER TABLE `survey_configs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `survey_url_slug` (`survey_url_slug`),
  ADD KEY `idx_project_id` (`project_id`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_campaign_id` (`campaign_id`),
  ADD KEY `idx_survey_url_slug` (`survey_url_slug`);

--
-- Indexes for table `survey_fields`
--
ALTER TABLE `survey_fields`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `survey_fields_unique` (`survey_config_id`,`field_name`,`active`),
  ADD KEY `idx_survey_config_id` (`survey_config_id`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_display_order` (`field_order`);

--
-- Indexes for table `survey_responses`
--
ALTER TABLE `survey_responses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_survey_config_id` (`survey_config_id`),
  ADD KEY `idx_respondent_email` (`respondent_email`),
  ADD KEY `idx_submitted_at` (`submitted_at`),
  ADD KEY `idx_is_completed` (`is_completed`);

--
-- Indexes for table `survey_response_data`
--
ALTER TABLE `survey_response_data`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_survey_response_id` (`survey_response_id`),
  ADD KEY `idx_survey_field_id` (`survey_field_id`),
  ADD KEY `idx_field_name` (`field_name`);

--
-- Indexes for table `times`
--
ALTER TABLE `times`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `uon_van_kpa`
--
ALTER TABLE `uon_van_kpa`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `uon_van_ls`
--
ALTER TABLE `uon_van_ls`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `uon_van_med`
--
ALTER TABLE `uon_van_med`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `uon_van_sga`
--
ALTER TABLE `uon_van_sga`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `uon_van_ttth`
--
ALTER TABLE `uon_van_ttth`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `uploaded_files`
--
ALTER TABLE `uploaded_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_uploaded_files_survey_id` (`survey_id`),
  ADD KEY `idx_uploaded_files_uploaded_by` (`uploaded_by`),
  ADD KEY `idx_uploaded_files_file_hash` (`file_hash`),
  ADD KEY `idx_uploaded_files_created_at` (`created_at`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_jwt_token_id` (`jwt_token_id`);

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_jwt_token_id` (`jwt_token_id`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_is_current_session` (`is_current_session`),
  ADD KEY `idx_last_activity` (`last_activity`);

--
-- Indexes for table `user_session_settings`
--
ALTER TABLE `user_session_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_user_id` (`user_id`);

--
-- Indexes for table `viem_gam_ttcb`
--
ALTER TABLE `viem_gam_ttcb`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `viem_gan_ctdd`
--
ALTER TABLE `viem_gan_ctdd`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `viem_gan_dhnv`
--
ALTER TABLE `viem_gan_dhnv`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `viem_gan_mt1_dhnv`
--
ALTER TABLE `viem_gan_mt1_dhnv`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `viem_gan_mt1_kpa_not`
--
ALTER TABLE `viem_gan_mt1_kpa_not`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `viem_gan_mt1_sga`
--
ALTER TABLE `viem_gan_mt1_sga`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `viem_gan_mt1_so_gan`
--
ALTER TABLE `viem_gan_mt1_so_gan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `viem_gan_sga`
--
ALTER TABLE `viem_gan_sga`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `viem_gan_td_ngt`
--
ALTER TABLE `viem_gan_td_ngt`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `viem_gan_td_not`
--
ALTER TABLE `viem_gan_td_not`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `viem_gan_tqau`
--
ALTER TABLE `viem_gan_tqau`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `viem_gan_ttdd`
--
ALTER TABLE `viem_gan_ttdd`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `auth_logs`
--
ALTER TABLE `auth_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `campaign`
--
ALTER TABLE `campaign`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cat_gan_nho_kpa`
--
ALTER TABLE `cat_gan_nho_kpa`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dishes`
--
ALTER TABLE `dishes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dish_foods`
--
ALTER TABLE `dish_foods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `food_info`
--
ALTER TABLE `food_info`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_issues`
--
ALTER TABLE `inventory_issues`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_issue_items`
--
ALTER TABLE `inventory_issue_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_receipts`
--
ALTER TABLE `inventory_receipts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_receipt_items`
--
ALTER TABLE `inventory_receipt_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_stock`
--
ALTER TABLE `inventory_stock`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_warehouses`
--
ALTER TABLE `inventory_warehouses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `log_activities`
--
ALTER TABLE `log_activities`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `menu_builds`
--
ALTER TABLE `menu_builds`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `menu_build_details`
--
ALTER TABLE `menu_build_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `menu_example`
--
ALTER TABLE `menu_example`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `menu_time`
--
ALTER TABLE `menu_time`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `patients_research`
--
ALTER TABLE `patients_research`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `patient_photos`
--
ALTER TABLE `patient_photos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `phieu_hoi_chan_danh_gia`
--
ALTER TABLE `phieu_hoi_chan_danh_gia`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `phieu_hoi_chan_ttc`
--
ALTER TABLE `phieu_hoi_chan_ttc`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `research`
--
ALTER TABLE `research`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `role`
--
ALTER TABLE `role`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `role_user`
--
ALTER TABLE `role_user`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `setting`
--
ALTER TABLE `setting`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `survey_configs`
--
ALTER TABLE `survey_configs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `survey_fields`
--
ALTER TABLE `survey_fields`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `survey_responses`
--
ALTER TABLE `survey_responses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `survey_response_data`
--
ALTER TABLE `survey_response_data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `times`
--
ALTER TABLE `times`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `uon_van_kpa`
--
ALTER TABLE `uon_van_kpa`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `uon_van_ls`
--
ALTER TABLE `uon_van_ls`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `uon_van_med`
--
ALTER TABLE `uon_van_med`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `uon_van_sga`
--
ALTER TABLE `uon_van_sga`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `uon_van_ttth`
--
ALTER TABLE `uon_van_ttth`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_session_settings`
--
ALTER TABLE `user_session_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `viem_gam_ttcb`
--
ALTER TABLE `viem_gam_ttcb`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `viem_gan_ctdd`
--
ALTER TABLE `viem_gan_ctdd`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `viem_gan_dhnv`
--
ALTER TABLE `viem_gan_dhnv`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `viem_gan_mt1_dhnv`
--
ALTER TABLE `viem_gan_mt1_dhnv`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `viem_gan_mt1_kpa_not`
--
ALTER TABLE `viem_gan_mt1_kpa_not`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `viem_gan_mt1_sga`
--
ALTER TABLE `viem_gan_mt1_sga`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `viem_gan_mt1_so_gan`
--
ALTER TABLE `viem_gan_mt1_so_gan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `viem_gan_sga`
--
ALTER TABLE `viem_gan_sga`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `viem_gan_td_ngt`
--
ALTER TABLE `viem_gan_td_ngt`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `viem_gan_td_not`
--
ALTER TABLE `viem_gan_td_not`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `viem_gan_tqau`
--
ALTER TABLE `viem_gan_tqau`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `viem_gan_ttdd`
--
ALTER TABLE `viem_gan_ttdd`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `inventory_issues`
--
ALTER TABLE `inventory_issues`
  ADD CONSTRAINT `inventory_issues_ibfk_1` FOREIGN KEY (`warehouse_id`) REFERENCES `inventory_warehouses` (`id`),
  ADD CONSTRAINT `inventory_issues_ibfk_2` FOREIGN KEY (`menu_build_id`) REFERENCES `menu_builds` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `inventory_issue_items`
--
ALTER TABLE `inventory_issue_items`
  ADD CONSTRAINT `inventory_issue_items_ibfk_1` FOREIGN KEY (`issue_id`) REFERENCES `inventory_issues` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventory_issue_items_ibfk_2` FOREIGN KEY (`food_id`) REFERENCES `food_info` (`id`),
  ADD CONSTRAINT `inventory_issue_items_ibfk_3` FOREIGN KEY (`receipt_item_id`) REFERENCES `inventory_receipt_items` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `inventory_receipts`
--
ALTER TABLE `inventory_receipts`
  ADD CONSTRAINT `inventory_receipts_ibfk_1` FOREIGN KEY (`warehouse_id`) REFERENCES `inventory_warehouses` (`id`);

--
-- Constraints for table `inventory_receipt_items`
--
ALTER TABLE `inventory_receipt_items`
  ADD CONSTRAINT `inventory_receipt_items_ibfk_1` FOREIGN KEY (`receipt_id`) REFERENCES `inventory_receipts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventory_receipt_items_ibfk_2` FOREIGN KEY (`food_id`) REFERENCES `food_info` (`id`);

--
-- Constraints for table `inventory_stock`
--
ALTER TABLE `inventory_stock`
  ADD CONSTRAINT `inventory_stock_ibfk_1` FOREIGN KEY (`warehouse_id`) REFERENCES `inventory_warehouses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventory_stock_ibfk_2` FOREIGN KEY (`food_id`) REFERENCES `food_info` (`id`),
  ADD CONSTRAINT `inventory_stock_ibfk_3` FOREIGN KEY (`receipt_item_id`) REFERENCES `inventory_receipt_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `menu_build_details`
--
ALTER TABLE `menu_build_details`
  ADD CONSTRAINT `fk_menu_build_details_menu_time` FOREIGN KEY (`menu_time_id`) REFERENCES `menu_time` (`id`),
  ADD CONSTRAINT `menu_build_details_ibfk_1` FOREIGN KEY (`menu_build_id`) REFERENCES `menu_builds` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `patient_photos`
--
ALTER TABLE `patient_photos`
  ADD CONSTRAINT `patient_photos_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `role_user`
--
ALTER TABLE `role_user`
  ADD CONSTRAINT `fk_role_user_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `survey_configs`
--
ALTER TABLE `survey_configs`
  ADD CONSTRAINT `survey_configs_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `survey_fields`
--
ALTER TABLE `survey_fields`
  ADD CONSTRAINT `survey_fields_ibfk_1` FOREIGN KEY (`survey_config_id`) REFERENCES `survey_configs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `survey_responses`
--
ALTER TABLE `survey_responses`
  ADD CONSTRAINT `survey_responses_ibfk_1` FOREIGN KEY (`survey_config_id`) REFERENCES `survey_configs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `survey_response_data`
--
ALTER TABLE `survey_response_data`
  ADD CONSTRAINT `survey_response_data_ibfk_1` FOREIGN KEY (`survey_response_id`) REFERENCES `survey_responses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `survey_response_data_ibfk_2` FOREIGN KEY (`survey_field_id`) REFERENCES `survey_fields` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `fk_user_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_session_settings`
--
ALTER TABLE `user_session_settings`
  ADD CONSTRAINT `fk_user_session_settings_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
