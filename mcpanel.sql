/*
 Navicat Premium Data Transfer

 Source Server         : localhost
 Source Server Type    : MySQL
 Source Server Version : 50714
 Source Host           : 127.0.0.1:3306
 Source Schema         : mcpanel

 Target Server Type    : MySQL
 Target Server Version : 50714
 File Encoding         : 65001

 Date: 27/10/2022 15:51:36
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for dispose
-- ----------------------------
DROP TABLE IF EXISTS `dispose`;
CREATE TABLE `dispose`  (
  `instance_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `name` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '服务器实例',
  `game_port` int(11) NULL DEFAULT NULL,
  `max_players` int(11) NULL DEFAULT NULL,
  `max_memory_size` int(11) NULL DEFAULT NULL,
  `frendly_fire` tinyint(1) NULL DEFAULT NULL,
  `min_memory_size` int(11) NULL DEFAULT NULL,
  `jar_name` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `java_dict_id` int(11) NULL DEFAULT NULL COMMENT '关联 sys_dict 字典 id（dict_type=java_path），启动时对字典查询真实 JAVA 路径',
  `launch_mode` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT 'jar' COMMENT '启动模式：jar=java -jar 常规模式；raw=原始启动参数模式',
  `raw_args` varchar(2000) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '原始启动参数（java 之后的完整参数，raw 模式生效）',
  `expire_at` datetime(0) NULL DEFAULT NULL COMMENT '实例到期时间：为空表示不限制使用；非空且已过期则禁止启动',
  PRIMARY KEY (`instance_id`) USING BTREE,
  UNIQUE KEY `uk_tenant_instance` (`tenant_id`, `instance_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of dispose（每条记录 = 一个服务器实例；tenant_id=0 为平台默认实例）
-- ----------------------------
INSERT INTO `dispose` (`tenant_id`, `name`, `game_port`, `max_players`, `max_memory_size`, `frendly_fire`, `min_memory_size`, `jar_name`) VALUES (0, '默认服务器实例', 25565, 25, 4000, 0, 1024, 'MITE-HDS-196.jar');

-- ----------------------------
-- Table structure for location
-- ----------------------------
DROP TABLE IF EXISTS `location`;
CREATE TABLE `location`  (
  `user_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `tenant_id` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `instance_id` int(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT '所属服务器实例',
  `coordinate` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `remarks` int(11) NULL DEFAULT NULL,
  `name` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `create_time` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `location_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`location_id`) USING BTREE,
  KEY `idx_tenant_instance` (`tenant_id`, `instance_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of location
-- ----------------------------

-- ----------------------------
-- Table structure for logs
-- ----------------------------
DROP TABLE IF EXISTS `logs`;
CREATE TABLE `logs`  (
  `user_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `tenant_id` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `instance_id` int(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT '所属服务器实例',
  `operation` varchar(500) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `op_time` datetime(0) NULL DEFAULT NULL,
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`log_id`) USING BTREE,
  KEY `idx_tenant_instance` (`tenant_id`, `instance_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 52 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of logs
-- ----------------------------

-- ----------------------------
-- Table structure for permission（统一权限树：菜单 / 页签 / 按钮）
-- ----------------------------
DROP TABLE IF EXISTS `permission`;
CREATE TABLE `permission`  (
  `perm_id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) NOT NULL DEFAULT 0 COMMENT '父级权限ID，0=顶级(菜单)',
  `perm_type` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT 'menu' COMMENT 'menu/tab/button',
  `perm_key` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '唯一权限码',
  `perm_name` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `assign_scope` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT 'tenant' COMMENT 'platform=仅平台管理员可分配；tenant=租户可分配',
  `sort` int(11) NULL DEFAULT 0,
  PRIMARY KEY (`perm_id`) USING BTREE,
  UNIQUE KEY `uk_perm_key` (`perm_key`)
) ENGINE = InnoDB AUTO_INCREMENT = 100 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of permission（perm_id 1~11 为菜单级，>=100 为页签/按钮级）
-- ----------------------------
INSERT INTO `permission` (`perm_id`, `parent_id`, `perm_type`, `perm_key`, `perm_name`, `assign_scope`, `sort`) VALUES
(1, 0, 'menu', 'systemManage', '系统管理', 'platform', 1),
(2, 0, 'menu', 'cmd', '指令输入', 'tenant', 2),
(3, 0, 'menu', 'userManage', '用户管理', 'tenant', 3),
(4, 0, 'menu', 'locationManage', '坐标管理', 'tenant', 4),
(5, 0, 'menu', 'uploadFile', '文件上传', 'tenant', 5),
(6, 0, 'menu', 'playerFiles', '存档/回档', 'tenant', 6),
(7, 0, 'menu', 'addNewUser', '新增用户', 'tenant', 7),
(8, 0, 'menu', 'roleManage', '角色管理', 'tenant', 8),
(9, 0, 'menu', 'programManage', '配置管理', 'tenant', 9),
(10, 0, 'menu', 'logManage', '日志管理', 'platform', 10),
(11, 0, 'menu', 'fileManage', '文件管理', 'tenant', 11),
(100, 2, 'tab', 'cmd.tab.status', '状态管理', 'tenant', 1),
(101, 2, 'tab', 'cmd.tab.location', '坐标管理', 'tenant', 2),
(102, 2, 'tab', 'cmd.tab.config', '配置管理', 'tenant', 3),
(103, 2, 'tab', 'cmd.tab.playerFiles', '玩家存档', 'tenant', 4),
(104, 2, 'tab', 'cmd.tab.fileManage', '文件管理', 'tenant', 5),
(105, 9, 'button', 'programManage.btn.save', '保存配置', 'tenant', 1),
(106, 2, 'button', 'cmd.status.btn.teamsFire', '队友伤害开关', 'tenant', 2),
(107, 4, 'button', 'locationManage.btn.record', '记录坐标', 'tenant', 1),
(108, 4, 'button', 'locationManage.btn.teleport', '传送', 'tenant', 2),
(109, 4, 'button', 'locationManage.btn.delete', '删除坐标', 'tenant', 3),
(110, 8, 'button', 'roleManage.btn.edit', '编辑角色', 'tenant', 1),
(111, 3, 'button', 'userManage.btn.delete', '删除用户', 'tenant', 1),
(112, 10, 'button', 'logManage.btn.clear', '清理日志', 'platform', 1);

-- ----------------------------
-- Table structure for privilege
-- ----------------------------
DROP TABLE IF EXISTS `privilege`;
CREATE TABLE `privilege`  (
  `tenant_id` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `role_id` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `perm_id` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  UNIQUE KEY `uk_trp` (`tenant_id`, `role_id`, `perm_id`)
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of privilege（平台超级管理员拥有全部权限；租户角色仅拥有租户级权限）
-- ----------------------------
-- 平台超级管理员(tenant_id=0, role_id=1) 授予全部权限（含 platform 级）
INSERT INTO `privilege` (`tenant_id`, `role_id`, `perm_id`)
SELECT 0, '1', perm_id FROM permission;

-- ----------------------------
-- Table structure for role
-- ----------------------------
DROP TABLE IF EXISTS `role`;
CREATE TABLE `role`  (
  `role_id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `role_name` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`role_id`) USING BTREE,
  KEY `idx_tenant` (`tenant_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of role（tenant_id=0 为平台默认角色，租户开通时需复制到各自 tenant_id）
-- ----------------------------
INSERT INTO `role` (`tenant_id`, `role_id`, `role_name`) VALUES (0, 1, '超级管理员');
INSERT INTO `role` (`tenant_id`, `role_id`, `role_name`) VALUES (0, 2, '管理员');
INSERT INTO `role` (`tenant_id`, `role_id`, `role_name`) VALUES (0, 3, '玩家');

-- 存量租户角色补齐租户级权限（置于 role 表定义之后；全新库无租户角色时为空操作，已存在租户则不丢失页签/按钮权限）
INSERT INTO `privilege` (`tenant_id`, `role_id`, `perm_id`)
SELECT r.tenant_id, r.role_id, p.perm_id
FROM role r, permission p
WHERE r.tenant_id != 0 AND p.assign_scope = 'tenant'
ON DUPLICATE KEY UPDATE perm_id = VALUES(perm_id);


-- ----------------------------
-- Table structure for tenant
-- ----------------------------
DROP TABLE IF EXISTS `tenant`;
CREATE TABLE `tenant`  (
  `tenant_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_name` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `storage_path` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '租户服务器存储根目录，实例在其下以子目录隔离',
  `status` tinyint(1) NULL DEFAULT 1,
  `expire_at` datetime(0) NULL DEFAULT NULL,
  `create_time` datetime(0) NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`tenant_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `user_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `account` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '自定义登录账号',
  `player_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `login_ip` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `role_id` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `password` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`) USING BTREE,
  UNIQUE KEY `uk_tenant_account` (`tenant_id`, `account`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1002 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user（tenant_id=0 即平台管理员；account 为登录账号）
-- ----------------------------
INSERT INTO `user` (`tenant_id`, `account`, `player_id`, `login_ip`, `role_id`, `password`) VALUES (0, 'admin', 'wensc', '127.0.0.1', '1', 'e10adc3949ba59abbe56e057f20f883e');

-- ----------------------------
-- Table structure for sys_dict（平台级字典表，无 tenant_id 隔离，全平台共享）
-- ----------------------------
DROP TABLE IF EXISTS `sys_dict`;
CREATE TABLE `sys_dict`  (
  `dict_id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `dict_type` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '字典类型，用于归类，如 java_path',
  `dict_key` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '字典键：由后端生成的「时间戳+随机串」唯一 id，不存放业务值（如路径）',
  `dict_value` varchar(1000) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '字典值（如 java 可执行文件完整路径）',
  `dict_name` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '展示名称/标签',
  `sort` int(11) NOT NULL DEFAULT 0 COMMENT '排序号，越小越靠前',
  `remark` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '备注',
  `create_time` datetime(0) NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`dict_id`) USING BTREE,
  KEY `idx_dict_type` (`dict_type`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for dispose_history（租户实例配置历史快照，按 tenant_id + name 唯一 upsert）
-- ----------------------------
DROP TABLE IF EXISTS `dispose_history`;
CREATE TABLE `dispose_history`  (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id` int(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT '所属租户',
  `name` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '实例名称：同租户下唯一键，再次保存同名实例配置则直接覆盖更新',
  `config` json NULL COMMENT '该实例完整配置快照（json），切换历史时直接回填表单',
  `create_time` datetime(0) NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime(0) NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_tenant_name` (`tenant_id`, `name`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
