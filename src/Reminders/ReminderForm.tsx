import { useState, useEffect } from 'react';
import { X, Clock, Calendar as CalendarIcon, Type, FileText } from 'lucide-react';
import { Reminder } from '../lib/types';
import '../styles/dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;

const COLOR_OPTIONS = [
  { label: 'Blue', value: '#2563eb' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Yellow', value: '#ca8a04' },
  { label: 'Purple', value: '#9333ea' },
  { label: 'Pink', value: '#db2777' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Teal', value: '#0d9488' },
];

interface ReminderFormProps {
  onClose: () => void;
  reminder?: Reminder | null;
  defaultDate?: Date | null;
}

export function ReminderForm({ onClose, reminder, defaultDate }: ReminderFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reminder_date: '',
    reminder_time: '',
    color: '#2563eb',
    completed: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (reminder) {
      setFormData({
        title: reminder.title,
        description: reminder.description || '',
        reminder_date: reminder.reminder_date,
        reminder_time: reminder.reminder_time || '',
        color: reminder.color,
        completed: reminder.completed,
      });
    } else if (defaultDate) {
      const year = defaultDate.getFullYear();
      const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
      const day = String(defaultDate.getDate()).padStart(2, '0');
      setFormData((prev) => ({
        ...prev,
        reminder_date: `${year}-${month}-${day}`,
      }));
    } else {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setFormData((prev) => ({
        ...prev,
        reminder_date: `${year}-${month}-${day}`,
      }));
    }
  }, [reminder, defaultDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.reminder_date) {
      setError('Date is required');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const url = reminder
        ? `${API_URL}/reminders/${reminder.id}`
        : `${API_URL}/reminders`;
      const method = reminder ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save reminder');

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save reminder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarIcon className="card-header-icon" />
            <h2 className="modal-title">{reminder ? 'Edit Reminder' : 'Add Reminder'}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="card-error">{error}</div>}

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-field">
            <label>
              <Type className="w-4 h-4" style={{ display: 'inline', marginRight: '0.35rem' }} />
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter reminder title"
              autoFocus
            />
          </div>

          <div className="form-field">
            <label>
              <FileText className="w-4 h-4" style={{ display: 'inline', marginRight: '0.35rem' }} />
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Add details (optional)"
            />
          </div>

          <div className="form-row two">
            <div className="form-field">
              <label>
                <CalendarIcon className="w-4 h-4" style={{ display: 'inline', marginRight: '0.35rem' }} />
                Date *
              </label>
              <input
                type="date"
                name="reminder_date"
                value={formData.reminder_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label>
                <Clock className="w-4 h-4" style={{ display: 'inline', marginRight: '0.35rem' }} />
                Time
              </label>
              <input
                type="time"
                name="reminder_time"
                value={formData.reminder_time}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-field">
            <label>Color</label>
            <div className="color-picker">
              {COLOR_OPTIONS.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  className={`color-option ${formData.color === colorOption.value ? 'selected' : ''}`}
                  style={{ backgroundColor: colorOption.value }}
                  onClick={() => setFormData((prev) => ({ ...prev, color: colorOption.value }))}
                  title={colorOption.label}
                />
              ))}
            </div>
          </div>

          {reminder && (
            <div className="checkbox-container">
              <input
                type="checkbox"
                checked={formData.completed}
                onChange={(e) => setFormData((prev) => ({ ...prev, completed: e.target.checked }))}
              />
              <span className="checkbox-label">Mark as completed</span>
            </div>
          )}

          <div className="button-group">
            <button type="button" onClick={onClose} className="secondary-button">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="primary-button">
              {loading ? 'Saving...' : reminder ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
