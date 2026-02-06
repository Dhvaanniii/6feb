import { useState, useEffect } from 'react';
import '../../styles/transactions.css';

export function TransactionFilters() {
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('date_desc');

  useEffect(() => {
    // Set default dates to today
    const today = new Date().toISOString().split('T')[0];
    setFromDate(today);
    setToDate(today);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle filter logic
  };

  return (
    <div className="filters-container">
      <form onSubmit={handleSubmit} className="filters-form">
        <div className="filter-group">
          <label className="filter-label">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="filter-input"
            max={today}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="filter-input"
            max={today}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">Min Amount</label>
          <input
            type="number"
            value={amountMin}
            onChange={(e) => setAmountMin(e.target.value)}
            className="filter-input"
            placeholder="0"
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">Max Amount</label>
          <input
            type="number"
            value={amountMax}
            onChange={(e) => setAmountMax(e.target.value)}
            className="filter-input"
            placeholder="0"
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="filter-input"
            placeholder="Transaction description"
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {/* Map through categories */}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Sort By</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="filter-select"
          >
            <option value="date_desc">Date: Newest first</option>
            <option value="date_asc">Date: Oldest first</option>
            <option value="amount_desc">Amount: High to Low</option>
            <option value="amount_asc">Amount: Low to High</option>
          </select>
        </div>

        <button type="submit" className="filter-button">
          Apply Filters
        </button>
      </form>
    </div>
  );
}
