# 🚀 Advanced Technical Simulation Features

## Overview

Three advanced features have been implemented to go beyond traditional LeetCode-style interviews, focusing on real-world engineering skills.

---

## 1. Interactive System Design Whiteboard

### Concept
Technical interviews for Senior roles require system design skills (e.g., "Design Netflix"). This feature integrates a whiteboard with AI-powered visual feedback.

### Features
- **Excalidraw Integration**: Professional whiteboard interface
- **Gemini Vision API**: AI analyzes drawn diagrams
- **Visual Feedback**: Points out specific component placement issues
- **Real-time Analysis**: Instant feedback on architecture decisions

### How It Works
1. User draws system design diagram (boxes, arrows, components)
2. User enters problem statement (e.g., "Design Twitter")
3. User clicks "Analyze"
4. Backend captures canvas as image
5. Gemini Vision API analyzes the diagram
6. AI provides:
   - Architecture correctness feedback
   - Missing components identification
   - Visual placement issues (e.g., "Cache should be before database")
   - Scalability concerns
   - Best practices violations
   - Score (0-100)

### Backend Endpoint
```
POST /system-design/analyze
Body: {
  "image_base64": "...",
  "problem_statement": "Design Twitter"
}
Response: {
  "score": 85,
  "feedback": [...],
  "visual_issues": [
    {
      "component": "Cache",
      "issue": "You placed the cache after the database, which defeats the purpose. Move it before the database."
    }
  ]
}
```

### Frontend Component
- `SystemDesignWhiteboard.js` - Full-screen whiteboard interface
- Uses `@excalidraw/excalidraw` for drawing
- Uses `html2canvas` for image capture

### Tech Stack
- **Frontend**: Excalidraw, html2canvas
- **Backend**: Gemini 2.5 Flash Vision API
- **Analysis**: Visual component placement detection

---

## 2. Broken Repo Debugging Round

### Concept
Real engineering involves reading and debugging existing code, not just writing from scratch. This feature provides pre-configured codebases with hidden bugs.

### Features
- **3 Pre-configured Bug Scenarios**:
  1. Payment Checkout 500 Error
  2. API Rate Limit Bypass
  3. Database Connection Leak
- **Multi-file Code Editor**: Navigate through project structure
- **File Tree Navigation**: Easy switching between files
- **Real Bug Detection**: Find and fix actual bugs

### How It Works
1. User selects a bug scenario
2. System loads a multi-file project with hidden bugs
3. User navigates through files using file tree
4. User edits code to fix bugs
5. User can save files and test fixes

### Bug Scenarios

#### 1. Payment Checkout 500 Error
- **Files**: `controllers/payment.js`, `services/paymentService.js`
- **Bugs**:
  - Missing validation for undefined amount
  - `items.map()` called without checking if items exists
  - Wrong parameters passed to `processPayment`
  - Error handling doesn't log details
  - Missing userId validation

#### 2. API Rate Limit Bypass
- **Files**: `middleware/rateLimiter.js`, `app.js`
- **Bugs**:
  - X-Forwarded-For header can be spoofed
  - No handler for rate limit exceeded
  - Admin path bypass without authentication
  - Rate limiter applied after routes

#### 3. Database Connection Leak
- **Files**: `db/connection.js`, `controllers/users.js`
- **Bugs**:
  - Connection not released after query
  - Connection not released on error
  - Multiple queries without proper connection pooling

### Backend Endpoints
```
GET /bug-scenarios
Response: {
  "scenarios": [
    {
      "id": "payment_checkout_500",
      "name": "Payment Checkout 500 Error",
      "description": "..."
    }
  ]
}

GET /bug-scenarios/{scenario_id}
Response: {
  "id": "...",
  "name": "...",
  "description": "...",
  "files": {
    "path/to/file.js": "file content..."
  }
}

POST /bug-scenarios/{scenario_id}/create-project/{session_id}
Response: {
  "project_id": "...",
  "files": [...],
  "scenario_id": "...",
  "scenario_name": "..."
}
```

### Frontend Component
- `BugDebuggingRound.js` - Multi-file debugging interface
- Integrates with existing `CodeEditor` component
- File tree sidebar for navigation

### Tech Stack
- **Backend**: Multi-file editor system
- **Frontend**: Monaco Editor, file tree navigation
- **Storage**: Temporary file system per session

---

## 3. Database Schema Optimization Lab

### Concept
Performance tuning is crucial for senior engineers. This feature provides a large dataset (1M rows) and analyzes query performance.

### Features
- **1 Million Row Dataset**: Simulated large dataset for testing
- **Query Performance Analysis**: Execution time measurement
- **Optimization Suggestions**: AI-powered recommendations
- **Severity Levels**: High, Medium, Low priority suggestions
- **Query Plan Analysis**: EXPLAIN QUERY PLAN integration

### How It Works
1. User creates a dataset (1M rows)
2. User writes a SQL query
3. System executes query and measures performance
4. System analyzes query plan
5. System provides optimization suggestions:
   - Missing indexes
   - Full table scans
   - Inefficient JOINs
   - SELECT * usage
   - Slow query warnings

### Optimization Suggestions

#### Missing Index
- **Severity**: High
- **Issue**: Query filters on column but no index exists
- **Fix**: `CREATE INDEX idx_column_name ON table_name(column_name);`
- **Impact**: 10-100x speedup

#### Full Table Scan
- **Severity**: High
- **Issue**: Query performing full table scan
- **Fix**: Add WHERE clause conditions with indexes
- **Impact**: Significant performance improvement

#### Inefficient JOIN
- **Severity**: Medium
- **Issue**: JOIN operation might be inefficient
- **Fix**: Ensure JOIN columns are indexed
- **Impact**: Faster JOIN operations

### Backend Endpoints
```
POST /db-lab/create-dataset
Params: dataset_id=default, num_rows=1000000
Response: {
  "status": "success",
  "dataset_id": "default",
  "num_rows": 1000000,
  "message": "Dataset created..."
}

POST /db-lab/analyze-query
Params: dataset_id=default, query="SELECT * FROM orders WHERE product_id = 100"
Response: {
  "status": "success",
  "execution_time_ms": 245.5,
  "row_count": 150,
  "is_slow": true,
  "query_plan": [...],
  "optimization_suggestions": [
    {
      "type": "missing_index",
      "severity": "high",
      "issue": "Query filters on product_id but no index exists",
      "suggestion": "CREATE INDEX idx_product_id ON orders(product_id);",
      "impact": "This could speed up queries by 10-100x"
    }
  ]
}

GET /db-lab/table-info/{dataset_id}
Response: {
  "status": "success",
  "columns": [...],
  "indexes": [...],
  "num_rows": 1000000
}
```

### Frontend Component
- `DatabaseOptimizationLab.js` - SQL optimization interface
- Query editor with syntax highlighting
- Performance metrics display
- Optimization suggestions with severity badges

### Tech Stack
- **Backend**: SQLite in-memory database
- **Analysis**: Query plan parsing, performance measurement
- **Frontend**: Monaco Editor (SQL mode)

---

## Integration

All three features can be integrated into the main interview flow:

1. **System Design Round**: Use whiteboard for architecture questions
2. **Debugging Round**: Use bug scenarios for debugging skills
3. **Database Round**: Use optimization lab for SQL performance questions

## File Structure

### Backend
```
backend/
├── system_design.py          # Enhanced with visual feedback
├── bug_scenarios.py          # Pre-configured bug scenarios
├── db_optimization_lab.py    # Database performance analysis
└── main.py                   # New endpoints added
```

### Frontend
```
frontend/src/components/
├── SystemDesignWhiteboard.js/css
├── BugDebuggingRound.js/css
└── DatabaseOptimizationLab.js/css
```

## Dependencies

### Frontend
- `@excalidraw/excalidraw` - Whiteboard drawing
- `html2canvas` - Canvas to image conversion

### Backend
- Existing dependencies (no new packages required)

## Usage Examples

### System Design Whiteboard
```javascript
<SystemDesignWhiteboard 
  apiUrl="http://localhost:8000"
  onClose={() => setShowWhiteboard(false)}
/>
```

### Bug Debugging Round
```javascript
<BugDebuggingRound 
  apiUrl="http://localhost:8000"
  sessionId={sessionId}
  onClose={() => setShowDebugging(false)}
/>
```

### Database Optimization Lab
```javascript
<DatabaseOptimizationLab 
  apiUrl="http://localhost:8000"
  onClose={() => setShowDBLab(false)}
/>
```

---

## Future Enhancements

1. **More Bug Scenarios**: Add scenarios for different tech stacks
2. **Custom Scenarios**: Allow users to create their own bug scenarios
3. **Query History**: Track optimization improvements over time
4. **Visual Query Builder**: Drag-and-drop query builder
5. **Real Database Integration**: Connect to actual databases for testing

---

**Status**: ✅ All three features fully implemented and ready for use!

