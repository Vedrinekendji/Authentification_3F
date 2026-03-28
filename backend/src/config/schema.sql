
CREATE DATABASE IF NOT EXISTS sentinel_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sentinel_auth;

CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  phone       VARCHAR(20),
  totp_secret VARCHAR(255),           
  totp_setup  BOOLEAN DEFAULT FALSE,  
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  session_token VARCHAR(512) NOT NULL UNIQUE,
  user_id       INT NOT NULL,
  step          TINYINT DEFAULT 1,        
  email_otp     VARCHAR(6),
  email_otp_exp DATETIME,
  sms_otp       VARCHAR(6),
  sms_otp_exp   DATETIME,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at    DATETIME NOT NULL,          
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS auth_logs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT,
  action      VARCHAR(100) NOT NULL,
  success     BOOLEAN DEFAULT FALSE,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  details     JSON,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_auth_sessions_token ON auth_sessions(session_token);
CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_expires ON auth_sessions(expires_at);
CREATE INDEX idx_auth_logs_user ON auth_logs(user_id);

DELIMITER $$
CREATE EVENT IF NOT EXISTS cleanup_expired_sessions
ON SCHEDULE EVERY 10 MINUTE
DO
BEGIN
  DELETE FROM auth_sessions WHERE expires_at < NOW();
END $$
DELIMITER ;

INSERT IGNORE INTO users (email, password, phone, totp_setup)
VALUES ('admin@sentinel.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LfVB7yXz5OqmepSmO', '+33600000000', FALSE);
