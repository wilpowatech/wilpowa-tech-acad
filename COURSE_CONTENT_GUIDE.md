# DevCourse Content Management Guide

## 12-Week Full Stack Development Curriculum

This guide explains how to add course content for each of the 12 weeks. The course is structured daily with lectures, labs, quizzes, and exams.

## Course Structure

### Timeline
- **Duration**: 12 weeks (84 days)
- **Lectures**: 3 lectures per week (lectures on Monday, Wednesday, Friday)
- **Labs**: 1 lab per week (hands-on practical work)
- **Quizzes**: 1 quiz per week (tests understanding)
- **Exams**: 4 exams total (weeks 4, 8, 10, 12)

### Grading Breakdown
- **Labs**: 40% of final grade
- **Quizzes**: 30% of final grade
- **Exams**: 30% of final grade
- **Passing Score**: 70% to earn certificate

## How to Add Content

### Access the Content Manager
1. Log in as an instructor
2. Click on your avatar (top right)
3. Select "Dashboard"
4. Navigate to "Content Manager"

### Step-by-Step: Adding Lectures

**Week 1 Example: HTML & CSS Basics**

1. Select "Week 1" from the week selector
2. Click the "Lectures" tab
3. Add first lecture:
   - **Title**: "HTML Fundamentals & Document Structure"
   - **Video URL**: Paste your YouTube/Vimeo embed link
   - **Description**: "Learn HTML basics, semantic elements, and page structure"
   - **Lecture Content**: Include code examples and notes
4. Click "Add Lecture"
5. Repeat for 3 lectures per week

### Step-by-Step: Adding Labs

**Week 1 Example: Build Your First Website**

1. Select "Week 1" from the week selector
2. Click the "Labs" tab
3. Fill in:
   - **Title**: "Build a Personal Portfolio Website"
   - **Description**: "Create a responsive portfolio website using HTML and CSS. Include about section, projects, and contact form."
   - Click "Add Lab"

### Step-by-Step: Adding Quizzes

**Week 1 Example: HTML & CSS Quiz**

1. Select "Week 1"
2. Click "Quizzes"
3. Fill in:
   - **Title**: "HTML & CSS Fundamentals Quiz"
   - **Description**: "Test your understanding of HTML structure and CSS styling"
   - Click "Add Quiz"

### Step-by-Step: Adding Exams

**Week 4: First Checkpoint Exam**

1. Select "Week 4"
2. Click "Exams"
3. Fill in:
   - **Title**: "Module 1 Comprehensive Exam - Frontend Basics"
   - **Description**: "4-hour comprehensive exam covering Weeks 1-4 content. Includes HTML, CSS, JavaScript basics, and DOM manipulation."
   - Click "Add Exam"

## 12-Week Sample Curriculum

### **Week 1: Web Development Fundamentals**
- **Lectures**:
  1. "HTML Fundamentals & Document Structure"
  2. "CSS Styling & Responsive Design"
  3. "Web Development Tools & Environment Setup"
- **Lab**: Build a Personal Portfolio Website
- **Quiz**: HTML & CSS Fundamentals Quiz

### **Week 2: JavaScript Essentials**
- **Lectures**:
  1. "JavaScript Basics & Variables"
  2. "Functions, Loops, & Conditionals"
  3. "DOM Manipulation & Events"
- **Lab**: Build an Interactive To-Do App
- **Quiz**: JavaScript Fundamentals Quiz

### **Week 3: Frontend Frameworks Intro**
- **Lectures**:
  1. "Introduction to React"
  2. "Components & JSX"
  3. "State & Props"
- **Lab**: Build a React Counter App
- **Quiz**: React Basics Quiz

### **Week 4: React Deep Dive** 
- **Lectures**:
  1. "Hooks & Custom Hooks"
  2. "Context API & State Management"
  3. "Routing with React Router"
- **Lab**: Build a Multi-Page React Application
- **Quiz**: Advanced React Quiz
- **EXAM**: Module 1 Comprehensive Exam (Weeks 1-4)

### **Week 5: Backend with Node.js**
- **Lectures**:
  1. "Node.js & Express Setup"
  2. "HTTP Requests & REST API Design"
  3. "Middleware & Error Handling"
- **Lab**: Build a RESTful API Server
- **Quiz**: Backend Fundamentals Quiz

### **Week 6: Databases & Data Management**
- **Lectures**:
  1. "Relational Databases with PostgreSQL"
  2. "SQL Queries & CRUD Operations"
  3. "Database Design Principles"
- **Lab**: Design & Build Database for E-Commerce
- **Quiz**: SQL & Database Quiz

### **Week 7: Backend Integration**
- **Lectures**:
  1. "Connecting Node.js to Databases"
  2. "User Authentication & JWT"
  3. "Environment Variables & Security"
- **Lab**: Build Authentication System
- **Quiz**: Backend Security Quiz

### **Week 8: Full-Stack Integration**
- **Lectures**:
  1. "Connecting Frontend to Backend"
  2. "API Integration in React"
  3. "Deployment Basics"
- **Lab**: Build Full-Stack Todo Application
- **Quiz**: Full-Stack Integration Quiz
- **EXAM**: Module 2 Comprehensive Exam (Weeks 5-8)

### **Week 9: Advanced Frontend**
- **Lectures**:
  1. "Performance Optimization"
  2. "Testing React Applications"
  3. "Advanced State Management"
- **Lab**: Optimize & Test Existing Project
- **Quiz**: Frontend Advanced Topics Quiz

### **Week 10: DevOps & Deployment**
- **Lectures**:
  1. "Docker & Containerization"
  2. "CI/CD Pipelines"
  3. "Cloud Deployment (AWS, Vercel, Heroku)"
- **Lab**: Dockerize & Deploy Application
- **Quiz**: DevOps Fundamentals Quiz
- **EXAM**: Module 3 Comprehensive Exam (Weeks 9-10)

### **Week 11: Real-World Project Planning**
- **Lectures**:
  1. "Software Architecture Patterns"
  2. "Scalability & System Design"
  3. "Career Preparation & Portfolio Building"
- **Lab**: Plan & Start Capstone Project
- **Quiz**: System Design Quiz

### **Week 12: Capstone Project & Graduation**
- **Lectures**:
  1. "Capstone Project Mentoring"
  2. "Interview Preparation"
  3. "Course Review & Next Steps"
- **Lab**: Complete Capstone Project
- **Quiz**: Professional Development Assessment
- **EXAM**: Final Comprehensive Exam (Weeks 11-12 + Project)

## Content Tips

### Video URLs
- YouTube: Use embed URLs like `https://www.youtube.com/embed/VIDEO_ID`
- Vimeo: Use embed URLs like `https://vimeo.com/VIDEO_ID`
- Any platform that supports embeds

### Lecture Notes
Use markdown format:
```markdown
# Topic Title

## Key Concepts
- Concept 1
- Concept 2

## Code Example
```js
console.log("Hello World");
```

## Practice Exercise
1. Try building X
2. Implement feature Y
```

### Lab Descriptions
Should include:
- Learning objectives
- Step-by-step instructions
- Acceptance criteria
- Resources/links
- Time estimate (usually 4-6 hours per lab)

### Quiz Structure
Each quiz should have:
- 10-15 questions
- Mix of multiple choice and short answer
- Questions testing practical knowledge
- Time limit (30-45 minutes)

## Example Content

### Sample Lecture Note
```
# React Hooks Mastery

## Learning Objectives
By the end of this lecture, you will:
- Understand React Hooks and their purpose
- Master useState, useEffect, useContext
- Create custom hooks
- Avoid common Hooks pitfalls

## useState Hook
The useState hook allows you to add state to functional components.

### Syntax
```js
const [state, setState] = useState(initialValue);
```

### Example: Counter Component
```js
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

## Practice Exercise
Create a form component that tracks:
- Username input
- Email input
- Password input
- Form submission

Validate that all fields are required.
```

## Plagiarism Detection

The platform automatically checks lab submissions for code similarity:
- **>70% similarity** = Flagged for review
- **3 strikes** = Student ineligible for certificate
- Helps maintain academic integrity

## Student Experience

Students will see:
- Week-by-week breakdown
- Daily lecture videos
- Lab assignments with deadlines
- Weekly quizzes
- Progress tracking with 12-week countdown
- Exam schedules (weeks 4, 8, 10, 12)
- Final certificate upon completion (70%+ score)

## Support & Troubleshooting

If content isn't showing:
1. Check the week number is correct
2. Verify the content type matches the tab
3. Ensure all required fields are filled
4. Check for errors in video URLs

Contact technical support if issues persist.

---

**Start building your course today! Your students are ready to learn.**
