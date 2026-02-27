# QuickToken – Hackathon PRD

## 1. Overview

QuickToken is a minimal web-based virtual queue management system built as a Ruby on Rails monolithic application.

It enables small businesses to:
- Instantly create a digital queue
- Share a link with customers
- Manage waiting customers in real time
- Eliminate physical waiting lines

This document defines only the hackathon scope. The goal is to build a clean, working MVP within 5 hours.

---

## 2. Problem Statement

Small businesses such as clinics, salons, banks, and service counters still rely on:

- Physical queues
- Manual token systems
- Verbal calling of customers
- Repeated “When is my turn?” questions

This results in:

- Crowding
- Poor customer experience
- No transparency in queue order
- No structured tracking

There is a need for a simple, lightweight, zero-login digital queue solution.

---

## 3. Hackathon Objective

Build a functional MVP that:

- Allows queue creation without requiring authentication
- Allows customers to join using a shareable link
- Displays live queue position to customers
- Allows an admin to serve the next customer
- Demonstrates real-time synchronization

The system should be minimal, stable, and demo-ready.

---

## 4. Target Users (Hackathon Scope)

Primary:
- Clinics
- Salons
- Small service counters
- College administration desks
- Event check-in desks

Secondary:
- Hackathon demo scenarios

---

## 5. Core Features (Strict Hackathon Scope)

### 5.1 Queue Creation

- A user can create a new queue by providing a name.
- The system generates a unique shareable link for that queue.
- The creator can access an admin view of the queue.
- No authentication or account creation is required.

---

### 5.2 Join Queue (Customer Experience)

When a customer opens the queue link:

- They can enter their name.
- They are assigned a position automatically.
- They can see:
  - Their current position
  - Total number of people waiting
  - The person currently being served
- The page updates automatically when the queue changes.

The experience should be simple and mobile-friendly.

---

### 5.3 Admin Dashboard

The queue creator (admin) can:

- View the list of all visitors
- See who is currently waiting
- See who has already been served
- View the current “Now Serving” person
- Click a “Next” button to serve the next waiting person

When the next person is served:

- The first waiting visitor is marked as served
- Remaining visitors shift forward in position
- All connected screens update in real time

---

### 5.4 Real-Time Behavior

The system must update all connected users automatically when:

- A new visitor joins
- A visitor is served
- Queue positions change

Users should not need to manually refresh the page.

---

## 6. User Experience Requirements

- Clean and minimal interface
- Mobile responsive design
- Clear visibility of:
  - Current position
  - Now Serving
  - Total waiting count
- Simple admin controls
- No unnecessary complexity

The design should prioritize clarity over styling.

---

## 7. Out of Scope (Not Included in Hackathon)

The following features are intentionally excluded:

- User authentication or accounts
- SMS or WhatsApp notifications
- Estimated wait time calculation
- Multi-branch or multi-admin management
- Payments or billing
- Analytics dashboard
- Role-based access control
- Production hardening and scaling optimizations

Only core queue functionality is required.

---

## 8. Non-Functional Requirements

- Must function as a single Rails monolithic web application
- Should support multiple simultaneous users in demo
- Real-time updates must be stable during presentation
- Should work smoothly on both desktop and mobile browsers

---

## 9. Hackathon Demo Flow

1. Introduce the problem:
   “Small clinics still use manual token systems.”

2. Create a new queue live.

3. Open the queue link on multiple devices.

4. Add several visitors.

5. Use the admin dashboard to serve the next person.

6. Show live position updates across all screens.

7. Conclude:
   “QuickToken eliminates physical lines with a simple digital queue system.”

---

## 10. Success Criteria

The hackathon MVP is considered successful if:

- A queue can be created instantly
- Customers can join using a shareable link
- Positions are assigned correctly
- Admin can serve the next visitor
- All updates happen in real time
- The demo runs smoothly without errors

No additional features are required.