-- Top Up Agent Server Queue System Database Schema
-- This allows multiple WordPress sites to use the same automation server

-- Main automation queue table
CREATE TABLE IF NOT EXISTS automation_queue (
    id INT PRIMARY KEY AUTO_INCREMENT,
    queue_type ENUM('manual', 'order', 'group') DEFAULT 'manual',
    source_site VARCHAR(255) NOT NULL DEFAULT 'localhost',
    site_id VARCHAR(100) DEFAULT NULL,
    order_id INT DEFAULT NULL,
    product_id INT DEFAULT NULL,
    product_name VARCHAR(255) DEFAULT NULL,
    license_key VARCHAR(255) NOT NULL,
    player_id VARCHAR(255) NOT NULL,
    automation_type ENUM('single', 'group_master', 'group_child') DEFAULT 'single',
    group_id VARCHAR(100) DEFAULT NULL,
    group_position INT DEFAULT 1,
    group_total INT DEFAULT 1,
    status ENUM('pending', 'processing', 'running', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    priority INT DEFAULT 0,
    scheduled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME DEFAULT NULL,
    completed_at DATETIME DEFAULT NULL,
    server_response TEXT DEFAULT NULL,
    error_message TEXT DEFAULT NULL,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    created_by VARCHAR(50) DEFAULT 'system',
    webhook_url VARCHAR(500) DEFAULT NULL,
    api_key VARCHAR(255) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_queue_type (queue_type),
    INDEX idx_group_id (group_id),
    INDEX idx_scheduled_at (scheduled_at),
    INDEX idx_source_site (source_site)
);

-- Automation execution results table
CREATE TABLE IF NOT EXISTS automation_results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    queue_id INT NOT NULL,
    source_site VARCHAR(255) NOT NULL,
    order_id INT DEFAULT NULL,
    license_key VARCHAR(255) NOT NULL,
    player_id VARCHAR(255) NOT NULL,
    status ENUM('success', 'failed', 'timeout', 'cancelled') NOT NULL,
    server_response TEXT DEFAULT NULL,
    error_message TEXT DEFAULT NULL,
    execution_time DECIMAL(10,3) DEFAULT NULL,
    screenshot_path VARCHAR(500) DEFAULT NULL,
    browser_logs TEXT DEFAULT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_queue_id (queue_id),
    INDEX idx_source_site (source_site),
    INDEX idx_status (status),
    INDEX idx_completed_at (completed_at),
    FOREIGN KEY (queue_id) REFERENCES automation_queue(id) ON DELETE CASCADE
);

-- Server status tracking
CREATE TABLE IF NOT EXISTS server_status (
    id INT PRIMARY KEY AUTO_INCREMENT,
    is_busy BOOLEAN DEFAULT FALSE,
    current_automation_id INT DEFAULT NULL,
    current_automation_start DATETIME DEFAULT NULL,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    server_version VARCHAR(50) DEFAULT NULL,
    total_processed INT DEFAULT 0,
    total_failed INT DEFAULT 0,
    uptime_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Initialize server status
INSERT INTO server_status (id, is_busy, server_version) 
VALUES (1, FALSE, '2.0.0') 
ON DUPLICATE KEY UPDATE 
    server_version = '2.0.0',
    updated_at = CURRENT_TIMESTAMP;

-- Connected sites registry
CREATE TABLE IF NOT EXISTS connected_sites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_url VARCHAR(255) NOT NULL UNIQUE,
    site_name VARCHAR(255) DEFAULT NULL,
    api_key VARCHAR(255) NOT NULL,
    last_connected DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_requests INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_api_key (api_key),
    INDEX idx_site_url (site_url),
    INDEX idx_last_connected (last_connected)
);
