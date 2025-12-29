-- Viêm gan MT1 - bổ sung bảng dữ liệu

-- 1) Sơ gan
CREATE TABLE IF NOT EXISTS viem_gan_mt1_so_gan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  tinh_trang_gan TINYINT NULL, -- 1 còn bù, 2 mất bù
  muc_do_xo_gan TINYINT NULL,  -- 1 Child A, 2 Child B, 3 Child C
  albumin VARCHAR(50) NULL,
  tu_van_dd TINYINT NULL,      -- 1 Có, 2 Không
  so_bua_moi_ngay TINYINT NULL, -- 1 <=2, 2=3, 3=4, 4=5, 5=6
  bua_dem TINYINT NULL,        -- 1 Có, 2 Không
  active TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  created_by INT NULL,
  campaign_id INT NULL
);

-- 2) Khẩu phần ăn nội trú cho MT1 (bảng riêng)
CREATE TABLE IF NOT EXISTS viem_gan_mt1_kpa_not (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  time DATETIME NOT NULL,
  nd_duong_th_sang VARCHAR(255) NULL,
  nd_duong_th_trua VARCHAR(255) NULL,
  nd_duong_th_toi VARCHAR(255) NULL,
  nd_duong_th_bua_phu VARCHAR(255) NULL,
  nd_tinh_mac VARCHAR(255) NULL,
  note VARCHAR(255) NULL,
  active TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  created_by INT NULL,
  campaign_id INT NULL
);


