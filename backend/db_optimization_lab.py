"""
Database Schema Optimization Lab
Performance tuning and query optimization analysis
"""
import sqlite3
import time
import json
from typing import Dict, List, Optional
import random
import string

class DatabaseOptimizationLab:
    """Database performance analysis and optimization suggestions"""
    
    def __init__(self):
        self.large_datasets = {}
    
    def create_large_dataset(self, dataset_id: str = "default", num_rows: int = 1000000) -> Dict:
        """Create a large dataset for performance testing"""
        try:
            # Use in-memory database for simulation
            conn = sqlite3.connect(':memory:')
            cursor = conn.cursor()
            
            # Create table with realistic schema
            cursor.execute('''
                CREATE TABLE orders (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER,
                    product_id INTEGER,
                    quantity INTEGER,
                    price REAL,
                    order_date TEXT,
                    status TEXT,
                    shipping_address TEXT
                )
            ''')
            
            # Create indexes (some missing intentionally for optimization practice)
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_id ON orders(user_id)')
            # Note: No index on product_id, order_date, or status - these are optimization opportunities
            
            # Generate sample data (simulated - not actually inserting 1M rows for performance)
            # In production, this would use bulk insert
            print(f"[DB Lab] Creating dataset with {num_rows} rows (simulated)...")
            
            # For demo, we'll insert a smaller sample but explain it represents 1M rows
            sample_size = min(10000, num_rows)  # Insert 10k for actual testing
            for i in range(sample_size):
                cursor.execute('''
                    INSERT INTO orders (user_id, product_id, quantity, price, order_date, status, shipping_address)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    random.randint(1, 10000),  # 10k users
                    random.randint(1, 1000),    # 1k products
                    random.randint(1, 10),
                    round(random.uniform(10.0, 1000.0), 2),
                    f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
                    random.choice(['pending', 'completed', 'cancelled', 'shipped']),
                    f"Address {random.randint(1, 1000)}"
                ))
            
            conn.commit()
            
            # Store connection info (in production, would use connection pooling)
            self.large_datasets[dataset_id] = {
                "conn": conn,
                "num_rows": num_rows,
                "sample_size": sample_size
            }
            
            return {
                "status": "success",
                "dataset_id": dataset_id,
                "num_rows": num_rows,
                "sample_size": sample_size,
                "message": f"Dataset created with {num_rows} rows (using {sample_size} sample for testing)"
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }
    
    def analyze_query_performance(self, dataset_id: str, query: str) -> Dict:
        """Analyze query performance and provide optimization suggestions"""
        if dataset_id not in self.large_datasets:
            return {
                "status": "error",
                "error": "Dataset not found. Create dataset first."
            }
        
        dataset = self.large_datasets[dataset_id]
        conn = dataset["conn"]
        cursor = conn.cursor()
        
        try:
            # Enable query plan
            cursor.execute("EXPLAIN QUERY PLAN " + query)
            query_plan = cursor.fetchall()
            
            # Execute query and measure time
            start_time = time.time()
            cursor.execute(query)
            
            # Check if it's a SELECT query
            if query.strip().upper().startswith('SELECT'):
                results = cursor.fetchall()
                execution_time = time.time() - start_time
                row_count = len(results)
            else:
                conn.commit()
                execution_time = time.time() - start_time
                row_count = cursor.rowcount
            
            # Analyze query plan for optimization opportunities
            optimization_suggestions = self._analyze_query_plan(query, query_plan, execution_time)
            
            return {
                "status": "success",
                "execution_time_ms": round(execution_time * 1000, 2),
                "row_count": row_count,
                "query_plan": query_plan,
                "optimization_suggestions": optimization_suggestions,
                "is_slow": execution_time > 0.1  # Consider slow if > 100ms
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "execution_time_ms": 0
            }
    
    def _analyze_query_plan(self, query: str, query_plan: List, execution_time: float) -> List[Dict]:
        """Analyze query plan and suggest optimizations"""
        suggestions = []
        query_upper = query.upper()
        
        # Check for missing indexes
        if 'WHERE' in query_upper:
            # Check for common columns that might need indexes
            if 'product_id' in query_upper and 'idx_product_id' not in str(query_plan):
                suggestions.append({
                    "type": "missing_index",
                    "severity": "high",
                    "issue": "Query filters on product_id but no index exists",
                    "suggestion": "CREATE INDEX idx_product_id ON orders(product_id);",
                    "impact": "This could speed up queries by 10-100x"
                })
            
            if 'order_date' in query_upper and 'idx_order_date' not in str(query_plan):
                suggestions.append({
                    "type": "missing_index",
                    "severity": "high",
                    "issue": "Query filters on order_date but no index exists",
                    "suggestion": "CREATE INDEX idx_order_date ON orders(order_date);",
                    "impact": "Date range queries will be much faster with an index"
                })
            
            if 'status' in query_upper and 'idx_status' not in str(query_plan):
                suggestions.append({
                    "type": "missing_index",
                    "severity": "medium",
                    "issue": "Query filters on status but no index exists",
                    "suggestion": "CREATE INDEX idx_status ON orders(status);",
                    "impact": "Status filtering will be faster with an index"
                })
        
        # Check for full table scans
        if 'SCAN TABLE orders' in str(query_plan) and execution_time > 0.05:
            suggestions.append({
                "type": "full_table_scan",
                "severity": "high",
                "issue": "Query is performing a full table scan",
                "suggestion": "Add appropriate WHERE clause conditions with indexes",
                "impact": "Full table scans are slow on large tables"
            })
        
        # Check for inefficient JOINs
        if 'JOIN' in query_upper and execution_time > 0.1:
            suggestions.append({
                "type": "join_optimization",
                "severity": "medium",
                "issue": "JOIN operation might be inefficient",
                "suggestion": "Ensure JOIN columns are indexed and consider query order",
                "impact": "Proper indexing on JOIN columns can significantly improve performance"
            })
        
        # Check for SELECT *
        if 'SELECT *' in query_upper:
            suggestions.append({
                "type": "select_all",
                "severity": "low",
                "issue": "Using SELECT * retrieves all columns",
                "suggestion": "Select only the columns you need",
                "impact": "Reduces data transfer and can improve performance"
            })
        
        # Check execution time
        if execution_time > 0.5:
            suggestions.append({
                "type": "slow_query",
                "severity": "high",
                "issue": f"Query takes {execution_time:.2f}s to execute",
                "suggestion": "Review query plan and add appropriate indexes",
                "impact": "This query is too slow for production use"
            })
        
        return suggestions if suggestions else [{
            "type": "optimized",
            "severity": "info",
            "issue": "Query appears to be well-optimized",
            "suggestion": "No immediate optimizations needed",
            "impact": "Query performance is acceptable"
        }]
    
    def get_table_info(self, dataset_id: str) -> Dict:
        """Get table schema and index information"""
        if dataset_id not in self.large_datasets:
            return {"status": "error", "error": "Dataset not found"}
        
        dataset = self.large_datasets[dataset_id]
        conn = dataset["conn"]
        cursor = conn.cursor()
        
        # Get table schema
        cursor.execute("PRAGMA table_info(orders)")
        columns = cursor.fetchall()
        
        # Get indexes
        cursor.execute("SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='orders'")
        indexes = cursor.fetchall()
        
        return {
            "status": "success",
            "columns": columns,
            "indexes": indexes,
            "num_rows": dataset["num_rows"]
        }
    
    def cleanup_dataset(self, dataset_id: str):
        """Clean up dataset"""
        if dataset_id in self.large_datasets:
            dataset = self.large_datasets[dataset_id]
            dataset["conn"].close()
            del self.large_datasets[dataset_id]

