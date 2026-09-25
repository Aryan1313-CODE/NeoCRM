# NeoCRM + Inventory Enterprise Platform

> Enterprise CRM, Inventory, Quality Control, Dispatch, Automation and AI Platform

NeoCRM + Inventory is an enterprise platform that unifies the organization's
sales and operational workflows into a single transactional system.

The platform consists of two cooperating business domains:

- **NeoCRM** — Sales and commercial operations
- **Stock & Operations** — Inventory, Quality Control and Dispatch

Both domains share a PostgreSQL-backed transactional core and a centralized
append-only inventory ledger.

---

## Table of Contents

- [Overview](#overview)
- [Business Objectives](#business-objectives)
- [Core Architectural Principle](#core-architectural-principle)
- [System Architecture](#system-architecture)
- [Modules](#modules)
- [Core Business Flows](#core-business-flows)
- [Key Features](#key-features)
- [Automation](#automation)
- [AI Capabilities](#ai-capabilities)
- [External Integrations](#external-integrations)
- [Security](#security)
- [Data Architecture](#data-architecture)
- [API Architecture](#api-architecture)
- [Concurrency & Inventory Safety](#concurrency--inventory-safety)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [78-Day Development Plan](#78-day-development-plan)
- [Testing](#testing)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Development Team](#development-team)
- [Definition of Done](#definition-of-done)
- [Future Scope](#future-scope)

---

# Overview

NeoCRM + Inventory is designed to eliminate the disconnect between:

1. What the Sales team believes can be sold
2. What Operations physically has available
3. What inventory has actually been reserved
4. What has passed Quality Control
5. What has been dispatched

The platform provides a unified workflow from:

```text
Lead
  ↓
Quotation
  ↓
Pricing Validation
  ↓
Win Snapshot
  ↓
Reservation
  ↓
Quality Control
  ↓
Dispatch
  ↓
Inventory Ledger