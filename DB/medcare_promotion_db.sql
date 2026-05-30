/*
 Navicat Premium Dump SQL

 Source Server         : mysql
 Source Server Type    : MySQL
 Source Server Version : 100432 (10.4.32-MariaDB)
 Source Host           : localhost:3306
 Source Schema         : medcare_promotion_db

 Target Server Type    : MySQL
 Target Server Version : 100432 (10.4.32-MariaDB)
 File Encoding         : 65001

 Date: 23/05/2026 18:04:34
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for user_vouchers
-- ----------------------------
DROP TABLE IF EXISTS `user_vouchers`;
CREATE TABLE `user_vouchers`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `is_used` bit(1) NULL DEFAULT NULL,
  `saved_at` datetime(6) NULL DEFAULT NULL,
  `user_id` bigint NOT NULL,
  `voucher_id` bigint NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `UKbkm2rdj5iur98b7u0ve192lq8`(`user_id` ASC, `voucher_id` ASC) USING BTREE,
  INDEX `FK40ig7khk2v79rbqaj98mf1g2q`(`voucher_id` ASC) USING BTREE,
  CONSTRAINT `FK40ig7khk2v79rbqaj98mf1g2q` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for voucher_usages
-- ----------------------------
DROP TABLE IF EXISTS `voucher_usages`;
CREATE TABLE `voucher_usages`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `voucher_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `order_id` bigint NOT NULL,
  `amount_saved` decimal(38, 2) NULL DEFAULT NULL,
  `used_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_usage`(`user_id` ASC) USING BTREE,
  INDEX `idx_voucher_user`(`voucher_id` ASC, `user_id` ASC) USING BTREE,
  CONSTRAINT `fk_voucher_usage` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for vouchers
-- ----------------------------
DROP TABLE IF EXISTS `vouchers`;
CREATE TABLE `vouchers`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `discount_type` enum('PERCENT','FIXED','FREESHIP') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` decimal(38, 2) NOT NULL,
  `max_discount` decimal(38, 2) NULL DEFAULT NULL,
  `min_order_value` decimal(38, 2) NULL DEFAULT NULL,
  `usage_limit` int NULL DEFAULT 999999,
  `limit_per_user` int NULL DEFAULT 1,
  `used_count` int NULL DEFAULT 0,
  `exclude_prescription_drugs` tinyint(1) NULL DEFAULT 1,
  `start_at` timestamp NULL DEFAULT NULL,
  `end_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime(6) NULL DEFAULT NULL,
  `applicable_category_id` bigint NULL DEFAULT NULL,
  `applicable_product_id` bigint NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `code`(`code` ASC) USING BTREE,
  INDEX `idx_voucher_code`(`code` ASC) USING BTREE,
  INDEX `idx_active_status`(`is_active` ASC, `start_at` ASC, `end_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 33 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
