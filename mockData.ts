
export const DWH_SCHEMA = `
TABLE: Sales
- id (INT)
- product_name (STRING)
- category (STRING)
- amount (FLOAT)
- quantity (INT)
- timestamp (DATE)
- region (STRING)

TABLE: Inventory
- product_id (INT)
- product_name (STRING)
- stock_available (INT)
- warehouse_location (STRING)
- min_threshold (INT)

TABLE: UsageLogs
- user_id (INT)
- module_name (STRING)
- duration_seconds (INT)
- status (STRING: success, fail)
- timestamp (DATE)

CONTEXT:
Today's date is 2024-05-20.
Top selling product is "Cloud Engine X".
Stock alert: "Edge Router v2" is below threshold (5 units left).
Overall usage trend is up 12% from last month.
`;

export const SAMPLE_QUESTIONS = [
  "What are our total sales for this month?",
  "Which products are low on stock?",
  "Show me sales trends across different regions",
  "How much has the API usage grown this week?",
  "What is our most used module?"
];
