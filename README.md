Policy Assessment Project

This project is a Node.js + Express + MongoDB application that ingests policy-related data from a CSV/XLSX file and provides APIs for searching, aggregating, and scheduling tasks.
It also includes a utility to monitor CPU usage and restart the server if needed.

Features
Task 1: Data Management

Upload API – Upload CSV/XLSX files and import data into MongoDB using Worker Threads.

Search API – Find policy information by username.

Aggregate API – Retrieve aggregated policies grouped by user.

Collections – Data is stored across 6 collections:

agents

users

accounts

lobs (policy categories)

carriers (policy carriers)

policies

Task 2: Utilities

CPU Monitor – Tracks real-time CPU usage of the Node.js process.

If CPU usage exceeds 70% for consecutive intervals, the server restarts (when running with PM2).

Message Scheduler API – Accepts a message, day, and time as input and inserts the message into the DB at the scheduled time.
