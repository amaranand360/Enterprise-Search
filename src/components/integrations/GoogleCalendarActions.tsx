'use client';

import { useState } from 'react';
import { Calendar, Clock, MapPin, Users, Video, Plus, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { realCalendarService } from '@/services/realCalendarService';
import { CalendarEvent } from '@/types';

interface GoogleCalendarActionsProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: (event: CalendarEvent) => void;
}

interface EventForm {
  title: string;
  description: string;
  start: string;
  end: string;
  location: string;
  attendees: string;
  createMeetLink: boolean;
}

export function GoogleCalendarActions({ isOpen, onClose, onEventCreated }: GoogleCalendarActionsProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<EventForm>({
    title: '',
    description: '',
    start: '',
    end: '',
    location: '',
    attendees: '',
    createMeetLink: false
  });

  const handleInputChange = (field: keyof EventForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateEvent = async () => {
    if (!form.title || !form.start || !form.end) {
      alert('Please fill in the required fields (Title, Start Time, End Time)');
      return;
    }

    setIsCreating(true);
    try {
      const eventData = {
        title: form.title,
        description: form.description,
        start: new Date(form.start),
        end: new Date(form.end),
        location: form.location,
        attendees: form.attendees ? form.attendees.split(',').map(email => email.trim()) : [],
        createMeetLink: form.createMeetLink
      };

      const createdEvent = await realCalendarService.createEvent(eventData);

      if (createdEvent) {
        onEventCreated?.(createdEvent);
        resetForm();
        onClose();
        alert('Event created successfully! Check your Google Calendar.');
      }
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event. Please make sure you have Calendar access and try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      start: '',
      end: '',
      location: '',
      attendees: '',
      createMeetLink: false
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Set default times (current time + 1 hour for start, + 2 hours for end)
  const getDefaultStartTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    return now.toISOString().slice(0, 16);
  };

  const getDefaultEndTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 2, 0, 0, 0);
    return now.toISOString().slice(0, 16);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Calendar Event">
      <div className="space-y-6">
        {/* Event Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Event Title *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter event title"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              Start Time *
            </label>
            <input
              type="datetime-local"
              value={form.start || getDefaultStartTime()}
              onChange={(e) => handleInputChange('start', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              End Time *
            </label>
            <input
              type="datetime-local"
              value={form.end || getDefaultEndTime()}
              onChange={(e) => handleInputChange('end', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter event description"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <MapPin className="h-4 w-4 inline mr-1" />
            Location
          </label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Enter location or meeting room"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Attendees */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Users className="h-4 w-4 inline mr-1" />
            Attendees
          </label>
          <input
            type="text"
            value={form.attendees}
            onChange={(e) => handleInputChange('attendees', e.target.value)}
            placeholder="Enter email addresses separated by commas"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Example: john@example.com, jane@example.com
          </p>
        </div>

        {/* Google Meet Link */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="createMeetLink"
            checked={form.createMeetLink}
            onChange={(e) => handleInputChange('createMeetLink', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="createMeetLink" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Video className="h-4 w-4" />
            Add Google Meet video conferencing
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isCreating}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleCreateEvent}
            disabled={isCreating || !form.title || !form.start || !form.end}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCreating ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Event
              </>
            )}
          </Button>
        </div>

        {/* Quick Templates */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Quick Templates
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const now = new Date();
                const start = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
                const end = new Date(now.getTime() + 90 * 60 * 1000); // +1.5 hours
                setForm(prev => ({
                  ...prev,
                  title: 'Team Meeting',
                  description: 'Weekly team sync meeting',
                  start: start.toISOString().slice(0, 16),
                  end: end.toISOString().slice(0, 16),
                  createMeetLink: true
                }));
              }}
            >
              Team Meeting
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const now = new Date();
                const start = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
                const end = new Date(now.getTime() + 120 * 60 * 1000); // +2 hours
                setForm(prev => ({
                  ...prev,
                  title: '1:1 Meeting',
                  description: 'One-on-one discussion',
                  start: start.toISOString().slice(0, 16),
                  end: end.toISOString().slice(0, 16),
                  createMeetLink: true
                }));
              }}
            >
              1:1 Meeting
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
