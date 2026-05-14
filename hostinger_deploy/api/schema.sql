-- ─── Osoulk MySQL Schema ──────────────────────────────────────────────────────
-- Compatible with MySQL 5.7+ and MySQL 8.x (Hostinger)
-- Run this once to create all tables before starting the app.
-- Import existing data with: node server/database/migrate.js

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  data          JSON         NOT NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Subscribers ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscribers (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  data          JSON         NOT NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Reel Requests ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reel_requests (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  data          JSON         NOT NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── User Listings ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_listings (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  data          JSON         NOT NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Developer Projects (user-owned) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dev_projects (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  data          JSON         NOT NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Inquiries / CRM Leads ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inquiries (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  data          JSON         NOT NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Articles / Blog ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  data          JSON         NOT NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── FAQs ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faqs (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  data          JSON         NOT NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Public Projects / Compounds ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public_projects (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  data          JSON         NOT NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── CMS Pages ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pages (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  data          JSON         NOT NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── HTML Snippets ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS html_snippets (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  data          JSON         NOT NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Media Gallery ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  data          JSON         NOT NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Activity Log ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  data          JSON         NOT NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Email Queue ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_queue (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  data          JSON         NOT NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Content Sections ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sections (
  id            VARCHAR(50)  NOT NULL PRIMARY KEY,
  data          JSON         NOT NULL,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Key-Value Store (site-settings, seo, views, saved, notifications, etc.) ─
CREATE TABLE IF NOT EXISTS kv_store (
  name          VARCHAR(100) NOT NULL PRIMARY KEY,
  data          JSON         NOT NULL,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Property Views (optimized for frequent increments) ───────────────────────
CREATE TABLE IF NOT EXISTS property_views (
  property_id   VARCHAR(200) NOT NULL PRIMARY KEY,
  view_count    INT          NOT NULL DEFAULT 0,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
