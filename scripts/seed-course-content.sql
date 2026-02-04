-- Seed course content for 12-week Full Stack Development Bootcamp
-- This script populates Week 1-12 with lectures, labs, quizzes, and exams

-- Create course (assuming instructor ID, adjust as needed)
INSERT INTO courses (instructor_id, title, description) VALUES
('00000000-0000-0000-0000-000000000001', 'Full Stack Development Bootcamp', 'Master modern web development in 12 weeks with hands-on projects and expert instruction')
ON CONFLICT DO NOTHING;

-- Get the course ID
WITH course_data AS (
  SELECT id FROM courses WHERE title = 'Full Stack Development Bootcamp' LIMIT 1
)

-- Create all 12 modules
INSERT INTO modules (course_id, week_number, title, description)
SELECT 
  c.id,
  week,
  'Week ' || week || ' - ' || title,
  description
FROM course_data c
CROSS JOIN (
  SELECT 1 as week, 'HTML & CSS Fundamentals' as title, 'Learn the building blocks of web pages' as description
  UNION ALL SELECT 2, 'JavaScript Essentials', 'Master JavaScript fundamentals and DOM manipulation'
  UNION ALL SELECT 3, 'JavaScript Advanced', 'Async/await, promises, and advanced patterns'
  UNION ALL SELECT 4, 'React Basics', 'Introduction to React and component-based architecture'
  UNION ALL SELECT 5, 'React Advanced', 'Hooks, state management, and performance optimization'
  UNION ALL SELECT 6, 'Backend Basics with Node.js', 'Create RESTful APIs with Express.js'
  UNION ALL SELECT 7, 'Database Design', 'SQL, PostgreSQL, and database optimization'
  UNION ALL SELECT 8, 'Full Stack Integration', 'Connect frontend and backend applications'
  UNION ALL SELECT 9, 'Authentication & Security', 'Implement secure user authentication and best practices'
  UNION ALL SELECT 10, 'DevOps & Deployment', 'Deploy applications to production environments'
  UNION ALL SELECT 11, 'Testing & Quality', 'Unit testing, integration testing, and QA practices'
  UNION ALL SELECT 12, 'Capstone Project', 'Build and deploy a complete full-stack application'
) weeks(week, title, description)
ON CONFLICT DO NOTHING;

-- Add Lectures for each week (3 per week on Mon/Wed/Fri)
-- Week 1: HTML & CSS
INSERT INTO lessons (module_id, title, content, video_url, order_number)
SELECT m.id, title, content, video_url, order_num
FROM (SELECT id FROM modules WHERE week_number = 1 LIMIT 1) m
CROSS JOIN (
  SELECT 1 as order_num, 'Monday: HTML Structure' as title, 'Learn semantic HTML, document structure, forms, and accessibility principles.' as content, 'https://www.youtube.com/embed/qz0aGYrrlhU' as video_url
  UNION ALL SELECT 2, 'Wednesday: CSS Basics', 'Master CSS selectors, box model, flexbox, and responsive design fundamentals.', 'https://www.youtube.com/embed/OXGznpKZ_sA'
  UNION ALL SELECT 3, 'Friday: CSS Advanced', 'Grid layout, animations, transitions, and modern CSS techniques like custom properties.', 'https://www.youtube.com/embed/9z6GouyWaKA'
) lectures(order_num, title, content, video_url)
ON CONFLICT DO NOTHING;

-- Week 2: JavaScript Essentials
INSERT INTO lessons (module_id, title, content, video_url, order_number)
SELECT m.id, title, content, video_url, order_num
FROM (SELECT id FROM modules WHERE week_number = 2 LIMIT 1) m
CROSS JOIN (
  SELECT 1, 'Monday: JavaScript Basics', 'Variables, data types, operators, and control flow (if/else, loops)', 'https://www.youtube.com/embed/jS4aFq5-91M'
  UNION ALL SELECT 2, 'Wednesday: Functions & Scope', 'Function declarations, arrow functions, closure, and scope management', 'https://www.youtube.com/embed/Qk0jCLh63SE'
  UNION ALL SELECT 3, 'Friday: DOM Manipulation', 'Select, create, modify, and delete DOM elements using vanilla JavaScript', 'https://www.youtube.com/embed/0fVJoMUxH-w'
) lectures(order_num, title, content, video_url)
ON CONFLICT DO NOTHING;

-- Week 3: JavaScript Advanced
INSERT INTO lessons (module_id, title, content, video_url, order_number)
SELECT m.id, title, content, video_url, order_num
FROM (SELECT id FROM modules WHERE week_number = 3 LIMIT 1) m
CROSS JOIN (
  SELECT 1, 'Monday: Promises & Callbacks', 'Understand callbacks, promises, and the basics of asynchronous JavaScript', 'https://www.youtube.com/embed/PoRJizFvM7s'
  UNION ALL SELECT 2, 'Wednesday: Async/Await', 'Master async/await syntax and error handling for cleaner asynchronous code', 'https://www.youtube.com/embed/V_Kr9OSfDeU'
  UNION ALL SELECT 3, 'Friday: REST APIs & Fetch', 'Call external APIs using fetch, handle responses, and manage data', 'https://www.youtube.com/embed/drK6mdA9d_M'
) lectures(order_num, title, content, video_url)
ON CONFLICT DO NOTHING;

-- Week 4: React Basics (with exam)
INSERT INTO lessons (module_id, title, content, video_url, order_number)
SELECT m.id, title, content, video_url, order_num
FROM (SELECT id FROM modules WHERE week_number = 4 LIMIT 1) m
CROSS JOIN (
  SELECT 1, 'Monday: React Fundamentals', 'JSX syntax, components, props, and component composition', 'https://www.youtube.com/embed/SqcY0GlETPk'
  UNION ALL SELECT 2, 'Wednesday: React State', 'useState hook, managing component state, and re-rendering', 'https://www.youtube.com/embed/O6P86IyJRKM'
  UNION ALL SELECT 3, 'Friday: React Events & Forms', 'Handle user input, form submission, and event handling in React', 'https://www.youtube.com/embed/W0dR0lB_gvc'
) lectures(order_num, title, content, video_url)
ON CONFLICT DO NOTHING;

-- Week 5: React Advanced
INSERT INTO lessons (module_id, title, content, video_url, order_number)
SELECT m.id, title, content, video_url, order_num
FROM (SELECT id FROM modules WHERE week_number = 5 LIMIT 1) m
CROSS JOIN (
  SELECT 1, 'Monday: React Hooks', 'useEffect, useContext, useReducer, and custom hooks', 'https://www.youtube.com/embed/gg2cx1DAQyM'
  UNION ALL SELECT 2, 'Wednesday: State Management', 'Context API, Redux basics, and managing complex application state', 'https://www.youtube.com/embed/poQXNp9ItL4'
  UNION ALL SELECT 3, 'Friday: Performance Optimization', 'Memoization, code splitting, lazy loading, and React Profiler', 'https://www.youtube.com/embed/h1fVP8JqAc8'
) lectures(order_num, title, content, video_url)
ON CONFLICT DO NOTHING;

-- Week 6: Backend Basics with Node.js
INSERT INTO lessons (module_id, title, content, video_url, order_number)
SELECT m.id, title, content, video_url, order_num
FROM (SELECT id FROM modules WHERE week_number = 6 LIMIT 1) m
CROSS JOIN (
  SELECT 1, 'Monday: Node.js & Express Setup', 'Node.js runtime, npm, Express framework, and middleware basics', 'https://www.youtube.com/embed/fZQKUcVyrg8'
  UNION ALL SELECT 2, 'Wednesday: RESTful APIs', 'HTTP methods (GET/POST/PUT/DELETE), routing, and response handling', 'https://www.youtube.com/embed/6c0eRfM_Vqg'
  UNION ALL SELECT 3, 'Friday: Middleware & Error Handling', 'Custom middleware, error handling, logging, and validation', 'https://www.youtube.com/embed/l8WPWK9mS5M'
) lectures(order_num, title, content, video_url)
ON CONFLICT DO NOTHING;

-- Week 7: Database Design
INSERT INTO lessons (module_id, title, content, video_url, order_number)
SELECT m.id, title, content, video_url, order_num
FROM (SELECT id FROM modules WHERE week_number = 7 LIMIT 1) m
CROSS JOIN (
  SELECT 1, 'Monday: SQL Fundamentals', 'Tables, schemas, CRUD operations, and query writing', 'https://www.youtube.com/embed/HXV3zeQKqGY'
  UNION ALL SELECT 2, 'Wednesday: Advanced SQL', 'Joins, subqueries, aggregation, and performance tuning', 'https://www.youtube.com/embed/27axs9dO7AE'
  UNION ALL SELECT 3, 'Friday: PostgreSQL & Indexing', 'PostgreSQL setup, indexing strategies, and database optimization', 'https://www.youtube.com/embed/qw--VYLvW1s'
) lectures(order_num, title, content, video_url)
ON CONFLICT DO NOTHING;

-- Week 8: Full Stack Integration (with exam)
INSERT INTO lessons (module_id, title, content, video_url, order_number)
SELECT m.id, title, content, video_url, order_num
FROM (SELECT id FROM modules WHERE week_number = 8 LIMIT 1) m
CROSS JOIN (
  SELECT 1, 'Monday: Database Connection', 'Connect Node.js to PostgreSQL using connection pools and ORM', 'https://www.youtube.com/embed/FP_i5n0R8pQ'
  UNION ALL SELECT 2, 'Wednesday: API Integration', 'Connect React frontend to backend APIs, handling data flow', 'https://www.youtube.com/embed/Y0gC887PxQ0'
  UNION ALL SELECT 3, 'Friday: Testing Integration', 'Full-stack testing strategies and debugging techniques', 'https://www.youtube.com/embed/MLCZDehLjSA'
) lectures(order_num, title, content, video_url)
ON CONFLICT DO NOTHING;

-- Week 9: Authentication & Security
INSERT INTO lessons (module_id, title, content, video_url, order_number)
SELECT m.id, title, content, video_url, order_num
FROM (SELECT id FROM modules WHERE week_number = 9 LIMIT 1) m
CROSS JOIN (
  SELECT 1, 'Monday: User Authentication', 'JWT tokens, session management, password hashing with bcrypt', 'https://www.youtube.com/embed/2jqok-WgelI'
  UNION ALL SELECT 2, 'Wednesday: OAuth & Social Login', 'Implement OAuth 2.0 and third-party authentication providers', 'https://www.youtube.com/embed/g6Ux7Ev5Wfg'
  UNION ALL SELECT 3, 'Friday: Security Best Practices', 'CORS, SQL injection prevention, XSS protection, and HTTPS', 'https://www.youtube.com/embed/zDZ54Ehu-Kw'
) lectures(order_num, title, content, video_url)
ON CONFLICT DO NOTHING;

-- Week 10: DevOps & Deployment (with exam)
INSERT INTO lessons (module_id, title, content, video_url, order_number)
SELECT m.id, title, content, video_url, order_num
FROM (SELECT id FROM modules WHERE week_number = 10 LIMIT 1) m
CROSS JOIN (
  SELECT 1, 'Monday: Docker & Containerization', 'Docker basics, Dockerfile creation, and container management', 'https://www.youtube.com/embed/3c-iBn73dRM'
  UNION ALL SELECT 2, 'Wednesday: CI/CD Pipelines', 'GitHub Actions, automated testing, and continuous deployment', 'https://www.youtube.com/embed/R8_veQiYBjI'
  UNION ALL SELECT 3, 'Friday: Cloud Deployment', 'Deploy to Vercel, AWS, or Heroku with proper configuration', 'https://www.youtube.com/embed/g5qJDpyQgqE'
) lectures(order_num, title, content, video_url)
ON CONFLICT DO NOTHING;

-- Week 11: Testing & Quality
INSERT INTO lessons (module_id, title, content, video_url, order_number)
SELECT m.id, title, content, video_url, order_num
FROM (SELECT id FROM modules WHERE week_number = 11 LIMIT 1) m
CROSS JOIN (
  SELECT 1, 'Monday: Unit Testing', 'Jest, testing libraries, test-driven development (TDD)', 'https://www.youtube.com/embed/FgnxcUQ5vho'
  UNION ALL SELECT 2, 'Wednesday: Integration Testing', 'Testing API endpoints, database interactions, and component integration', 'https://www.youtube.com/embed/7N__H-1OMkc'
  UNION ALL SELECT 3, 'Friday: E2E Testing & Quality Metrics', 'End-to-end testing with Cypress, code coverage, and performance metrics', 'https://www.youtube.com/embed/SjjIW6p1U5c'
) lectures(order_num, title, content, video_url)
ON CONFLICT DO NOTHING;

-- Week 12: Capstone Project
INSERT INTO lessons (module_id, title, content, video_url, order_number)
SELECT m.id, title, content, video_url, order_num
FROM (SELECT id FROM modules WHERE week_number = 12 LIMIT 1) m
CROSS JOIN (
  SELECT 1, 'Monday: Project Planning & Architecture', 'Plan your capstone project, design architecture, and setup', 'https://www.youtube.com/embed/h0RmLi8s5F8'
  UNION ALL SELECT 2, 'Wednesday: Development Sprint', 'Build core features and implement functionality', 'https://www.youtube.com/embed/0fZQnAW6MKA'
  UNION ALL SELECT 3, 'Friday: Deployment & Presentation', 'Deploy your project and prepare for final presentation', 'https://www.youtube.com/embed/fZQKUcVyrg8'
) lectures(order_num, title, content, video_url)
ON CONFLICT DO NOTHING;

-- Add Labs for each week (1 per week)
INSERT INTO labs (module_id, title, description, instructions, total_points)
SELECT m.id, title, description, instructions, 100
FROM (SELECT id, week_number FROM modules) m
CROSS JOIN (
  SELECT 1 as week, 'Build Your First Website' as title, 'Create a responsive personal portfolio website' as description, 'Create an HTML/CSS website with at least 3 pages, responsive design, and semantic HTML.' as instructions
  UNION ALL SELECT 2, 'Todo List App', 'Build a dynamic todo application with JavaScript', 'Create a todo list app with add, delete, edit functionality and local storage persistence.'
  UNION ALL SELECT 3, 'Weather App API', 'Fetch data from a weather API and display it', 'Build an app that fetches weather data from OpenWeatherMap API and displays it dynamically.'
  UNION ALL SELECT 4, 'React Component Library', 'Create reusable React components', 'Build a component library with at least 8 reusable components with proper props documentation.'
  UNION ALL SELECT 5, 'React Ecommerce Store', 'Build a full ecommerce application with React', 'Create a shopping cart app with product filtering, cart management, and checkout functionality.'
  UNION ALL SELECT 6, 'Express API Server', 'Build a RESTful API with Express', 'Create an API with at least 5 endpoints covering CRUD operations with proper error handling.'
  UNION ALL SELECT 7, 'Database Schema Design', 'Design a complex database schema', 'Design a schema for a social media app with proper relationships and indexing strategy.'
  UNION ALL SELECT 8, 'Full Stack Blog App', 'Create a complete blog application', 'Build a blog with user authentication, create/edit/delete posts, and comments system.'
  UNION ALL SELECT 9, 'Secure Auth System', 'Implement JWT-based authentication', 'Build a secure auth system with JWT tokens, password hashing, and role-based access control.'
  UNION ALL SELECT 10, 'Deploy Your App', 'Deploy an application to production', 'Deploy your full-stack app to a cloud provider with proper CI/CD pipeline setup.'
  UNION ALL SELECT 11, 'Test Suite Creation', 'Write comprehensive tests for an application', 'Create unit, integration, and E2E tests achieving 80%+ code coverage.'
  UNION ALL SELECT 12, 'Capstone Deployment', 'Deploy your capstone project', 'Deploy your final capstone project with all features, proper documentation, and README.'
) labs_data(week, title, description, instructions)
WHERE m.week_number = labs_data.week
ON CONFLICT DO NOTHING;

-- Add Quizzes for each week (1 per week)
INSERT INTO quizzes (course_id, week_number, title, description, total_points)
SELECT c.id, week, title, description, 50
FROM (SELECT id FROM courses WHERE title = 'Full Stack Development Bootcamp' LIMIT 1) c
CROSS JOIN (
  SELECT 1 as week, 'HTML & CSS Quiz' as title, 'Test your understanding of semantic HTML and CSS layouts' as description
  UNION ALL SELECT 2, 'JavaScript Fundamentals Quiz', 'Assess your knowledge of JavaScript basics and DOM manipulation'
  UNION ALL SELECT 3, 'Async JavaScript Quiz', 'Test async/await, promises, and API handling'
  UNION ALL SELECT 4, 'React Basics Quiz', 'Verify your understanding of components, props, and state'
  UNION ALL SELECT 5, 'React Hooks Quiz', 'Test knowledge of hooks, context, and performance optimization'
  UNION ALL SELECT 6, 'Node.js & Express Quiz', 'Assess backend development and API creation skills'
  UNION ALL SELECT 7, 'SQL & Database Quiz', 'Test database design and SQL query knowledge'
  UNION ALL SELECT 8, 'Full Stack Integration Quiz', 'Verify frontend-backend integration understanding'
  UNION ALL SELECT 9, 'Authentication & Security Quiz', 'Test security best practices and authentication methods'
  UNION ALL SELECT 10, 'DevOps & Deployment Quiz', 'Assess deployment and DevOps knowledge'
  UNION ALL SELECT 11, 'Testing & Quality Quiz', 'Test testing strategies and quality assurance'
  UNION ALL SELECT 12, 'Capstone Review Quiz', 'Final comprehensive assessment of all concepts'
) quizzes_data(week, title, description)
ON CONFLICT DO NOTHING;

-- Add Exams (4 exams at weeks 4, 8, 10, 12)
INSERT INTO exams (course_id, week_number, title, description, duration_minutes, total_points)
VALUES
('00000000-0000-0000-0000-000000000001'::uuid, 4, 'Midterm Exam 1: Frontend Fundamentals', 'Comprehensive exam covering HTML, CSS, JavaScript basics, and React fundamentals', 120, 200),
('00000000-0000-0000-0000-000000000001'::uuid, 8, 'Midterm Exam 2: Full Stack Basics', 'Test your knowledge of React, Node.js, databases, and full-stack integration', 120, 200),
('00000000-0000-0000-0000-000000000001'::uuid, 10, 'Midterm Exam 3: Advanced Concepts', 'Advanced topics including DevOps, security, and deployment practices', 120, 200),
('00000000-0000-0000-0000-000000000001'::uuid, 12, 'Final Exam: Comprehensive Assessment', 'Cumulative exam covering all 12 weeks of material and capstone project review', 180, 250)
ON CONFLICT DO NOTHING;
