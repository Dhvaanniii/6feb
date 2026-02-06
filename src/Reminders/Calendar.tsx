import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Check, X, Clock } from 'lucide-react';
import { Reminder, Transaction } from '../lib/types';
import { ReminderForm } from './ReminderForm';
import '../styles/calendar.css';

const API_URL = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionModalDate, setTransactionModalDate] = useState<string | null>(null);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const YEARS = Array.from({ length: 41 }, (_, i) => currentYear - 20 + i);

  useEffect(() => {
    loadReminders();
    loadTransactions();
  }, [currentMonth, currentYear]);

  const loadReminders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(
        `${API_URL}/reminders?month=${currentMonth + 1}&year=${currentYear}`,
        {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        }
      );
      
      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Backend server is not responding. Please ensure the server is running on port 5000.');
      }
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load reminders');
      setReminders(data || []);
    } catch (err) {
      console.error('Error loading reminders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reminders');
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/transactions`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load transactions');
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setTransactions([]);
    }
  };

  const toggleComplete = async (reminder: Reminder) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/reminders/${reminder.id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!res.ok) throw new Error('Failed to toggle reminder');
      loadReminders();
    } catch (err) {
      console.error('Error toggling reminder:', err);
    }
  };

  const deleteReminder = async (id: number) => {
    if (!confirm('Delete this reminder?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/reminders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!res.ok) throw new Error('Failed to delete reminder');
      loadReminders();
    } catch (err) {
      console.error('Error deleting reminder:', err);
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleMonthChange = (monthIndex: number) => {
    setCurrentDate(new Date(currentYear, monthIndex, 1));
  };

  const handleYearChange = (year: number) => {
    setCurrentDate(new Date(year, currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleAddReminder = (date?: Date) => {
    setSelectedDate(date || null);
    setEditingReminder(null);
    setShowForm(true);
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedDate(null);
    setEditingReminder(null);
    loadReminders();
  };

  const getRemindersForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return reminders.filter((r) => r.reminder_date === dateStr);
  };

  const toYmd = (input: string | Date | undefined | null) => {
    if (!input) return '';
    const d = typeof input === 'string' ? new Date(input) : input;
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const getTransactionsForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return transactions.filter((t) => toYmd(t.transaction_date) === dateStr || toYmd((t as any).created_at) === dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="calendar-container">
      {showForm && (
        <ReminderForm
          onClose={handleCloseForm}
          reminder={editingReminder}
          defaultDate={selectedDate}
        />
      )}

      <div className="calendar-header">
        <div className="calendar-controls">
          <button onClick={handlePrevMonth} className="calendar-nav-btn">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="calendar-month-year">
            <select
              className="calendar-select"
              value={currentMonth}
              onChange={(e) => handleMonthChange(parseInt(e.target.value, 10))}
            >
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>
            <select
              className="calendar-select"
              value={currentYear}
              onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button onClick={handleNextMonth} className="calendar-nav-btn">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="calendar-actions">
          <button onClick={handleToday} className="calendar-today-btn">
            Today
          </button>
          <button onClick={() => handleAddReminder()} className="calendar-add-btn">
            <Plus className="w-5 h-5" />
            Add Reminder
          </button>
        </div>
      </div>

      {error && (
        <div className="calendar-error">
          <p>{error}</p>
          <button onClick={loadReminders} className="calendar-retry-btn">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="calendar-loading">Loading reminders...</div>
      ) : (
        <div className="calendar-grid">
          <div className="calendar-weekdays">
            {DAYS.map((day) => (
              <div key={day} className="calendar-weekday">
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-days">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="calendar-day empty" />;
              }

              const dayReminders = getRemindersForDate(day);
              const dayTransactions = getTransactionsForDate(day);
              const hasReminders = dayReminders.length > 0;
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={day}
                  className={`calendar-day ${isCurrentDay ? 'today' : ''} ${hasReminders ? 'has-reminders' : ''}`}
                  onClick={() => handleAddReminder(new Date(currentYear, currentMonth, day))}
                >
                  <div className="calendar-day-number">{day}</div>
                  <div className="calendar-day-reminders">
                    {dayReminders.slice(0, 3).map((reminder) => (
                      <div
                        key={reminder.id}
                        className={`calendar-reminder ${reminder.completed ? 'completed' : ''}`}
                        style={{ borderLeftColor: reminder.color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditReminder(reminder);
                        }}
                      >
                        <div className="reminder-content">
                          {reminder.completed && (
                            <Check className="w-3 h-3 reminder-check" />
                          )}
                          <span className="reminder-title">{reminder.title}</span>
                          {reminder.reminder_time && (
                            <span className="reminder-time">
                              <Clock className="w-3 h-3" />
                              {reminder.reminder_time.slice(0, 5)}
                            </span>
                          )}
                        </div>
                        <div className="reminder-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleComplete(reminder);
                            }}
                            className="reminder-action-btn"
                            title={reminder.completed ? 'Mark incomplete' : 'Mark complete'}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteReminder(reminder.id);
                            }}
                            className="reminder-action-btn delete"
                            title="Delete reminder"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {dayReminders.length > 3 && (
                      <div className="calendar-more-reminders">
                        +{dayReminders.length - 3} more
                      </div>
                    )}
                    {dayTransactions.length > 0 && (
                      <div
                        className="calendar-reminder"
                        style={{ borderLeftColor: '#10b981' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          setTransactionModalDate(dateStr);
                        }}
                      >
                        <span className="reminder-title">Transaction</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {transactionModalDate && (
        <div className="modal-overlay" onClick={() => setTransactionModalDate(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Transactions</h2>
              <button className="modal-close" onClick={() => setTransactionModalDate(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="table-wrapper">
              <table className="data-table transactions-modal-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Scheme</th>
                    <th className="numeric">Amount</th>
                    <th className="numeric">Units</th>
                    <th>Folio</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .filter((t) => toYmd(t.transaction_date) === transactionModalDate || toYmd((t as any).created_at) === transactionModalDate)
                    .map((t) => (
                      <tr key={t.id}>
                        <td>{new Date((t as any).transaction_date || (t as any).created_at).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' })}</td>
                        <td>
                          <span className={`badge ${t.transaction_type === 'Purchase' ? 'badge-success' : 'badge-warning'}`}>
                            {t.transaction_type}
                          </span>
                        </td>
                        <td className="scheme-cell">{t.scheme_name || t.scheme_code}</td>
                        <td className="numeric">₹{(t.amount || 0).toFixed(2)}</td>
                        <td className="numeric">{(t.units || 0).toFixed(4)}</td>
                        <td>{t.folio_no || '-'}</td>
                        <td>
                          <span className={`badge ${t.status === 'Completed' ? 'badge-info' : 'badge-warning'}`}>{t.status}</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
