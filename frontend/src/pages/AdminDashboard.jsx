import React, { useState, useEffect } from 'react';
import {
  Users, Calendar, Clock, Plus, Trash2, RefreshCw,
  CheckCircle, XCircle, ArrowLeft, Loader2, ChevronDown, ChevronRight
} from 'lucide-react';
import {
  getDoctors, updateDoctorStatus, getDoctorSlots,
  addSlot, deleteSlot, getAppointments, updateAppointmentStatus
} from '../utils/api';

const STATUS_COLORS = {
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  rescheduled: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-slate-100 text-slate-600',
};

export default function AdminDashboard() {
  const [tab, setTab] = useState('availability'); // availability | appointments
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');
  const [addingSlot, setAddingSlot] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadDoctors();
    loadAppointments();
  }, []);

  useEffect(() => {
    if (selectedDoctor) loadSlots(selectedDoctor.id);
  }, [selectedDoctor]);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadDoctors() {
    try {
      const data = await getDoctors();
      setDoctors(data);
    } catch (e) {
      showToast('Failed to load doctors', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadSlots(doctorId) {
    setSlotsLoading(true);
    try {
      const data = await getDoctorSlots(doctorId);
      setSlots(data);
    } catch (e) {
      showToast('Failed to load slots', 'error');
    } finally {
      setSlotsLoading(false);
    }
  }

  async function loadAppointments() {
    try {
      const data = await getAppointments();
      setAppointments(data);
    } catch (e) {
      console.error('Failed to load appointments');
    }
  }

  async function toggleDoctorActive(doctor) {
    try {
      const updated = await updateDoctorStatus(doctor.id, !doctor.active);
      setDoctors(prev => prev.map(d => d.id === doctor.id ? updated : d));
      showToast(`${doctor.name} is now ${updated.active ? 'active' : 'inactive'}`);
    } catch (e) {
      showToast('Failed to update doctor', 'error');
    }
  }

  async function handleAddSlot() {
    if (!newSlotDate || !newSlotTime || !selectedDoctor) return;
    setAddingSlot(true);
    try {
      const datetime = new Date(`${newSlotDate}T${newSlotTime}`).toISOString();
      const newSlot = await addSlot(selectedDoctor.id, datetime);
      setSlots(prev => [...prev, newSlot].sort((a, b) => new Date(a.slot_datetime) - new Date(b.slot_datetime)));
      setNewSlotDate('');
      setNewSlotTime('');
      showToast('Slot added successfully');
    } catch (e) {
      showToast('Failed to add slot', 'error');
    } finally {
      setAddingSlot(false);
    }
  }

  async function handleDeleteSlot(slotId) {
    try {
      await deleteSlot(slotId);
      setSlots(prev => prev.filter(s => s.id !== slotId));
      showToast('Slot removed');
    } catch (e) {
      showToast('Failed to remove slot', 'error');
    }
  }

  async function handleUpdateAppointment(id, status) {
    try {
      const updated = await updateAppointmentStatus(id, status);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: updated.status } : a));
      showToast(`Appointment ${status}`);
    } catch (e) {
      showToast('Failed to update appointment', 'error');
    }
  }

  function formatSlotTime(dt) {
    return new Date(dt).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-slide-up ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm transition-colors">
              <ArrowLeft size={16} />
              Patient Chat
            </a>
            <div className="w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-teal-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">KM</span>
              </div>
              <div>
                <h1 className="font-semibold text-slate-900 text-sm">Admin Dashboard</h1>
                <p className="text-xs text-slate-500">Kyron Medical</p>
              </div>
            </div>
          </div>
          <button onClick={() => { loadDoctors(); loadAppointments(); }} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-6 flex gap-1">
          {[
            { key: 'availability', label: 'Provider Availability', icon: Clock },
            { key: 'appointments', label: 'Appointments', icon: Calendar },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="text-brand-600 animate-spin" />
          </div>
        ) : tab === 'availability' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Doctor list */}
            <div className="lg:col-span-1">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Users size={15} />
                Providers
              </h2>
              <div className="space-y-2">
                {doctors.map(doctor => (
                  <button
                    key={doctor.id}
                    onClick={() => setSelectedDoctor(doctor)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedDoctor?.id === doctor.id
                        ? 'border-brand-500 bg-brand-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{doctor.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{doctor.specialty}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          doctor.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {doctor.active ? 'Active' : 'Inactive'}
                        </span>
                        <ChevronRight size={14} className="text-slate-400" />
                      </div>
                    </div>
                    {/* Active toggle */}
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); toggleDoctorActive(doctor); }}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                          doctor.active
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-green-200 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {doctor.active ? 'Set Inactive' : 'Set Active'}
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Slots panel */}
            <div className="lg:col-span-2">
              {!selectedDoctor ? (
                <div className="bg-white rounded-xl border border-slate-200 flex items-center justify-center h-64">
                  <div className="text-center text-slate-400">
                    <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Select a provider to manage their availability</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-5 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-900">{selectedDoctor.name}</h3>
                    <p className="text-sm text-slate-500">{selectedDoctor.specialty} · Manage availability slots</p>
                  </div>

                  {/* Add slot form */}
                  <div className="p-5 border-b border-slate-100 bg-slate-50">
                    <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">Add New Slot</p>
                    <div className="flex flex-wrap gap-3 items-end">
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">Date</label>
                        <input
                          type="date"
                          value={newSlotDate}
                          onChange={e => setNewSlotDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">Time</label>
                        <input
                          type="time"
                          value={newSlotTime}
                          onChange={e => setNewSlotTime(e.target.value)}
                          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <button
                        onClick={handleAddSlot}
                        disabled={!newSlotDate || !newSlotTime || addingSlot}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
                      >
                        {addingSlot ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        Add Slot
                      </button>
                    </div>
                  </div>

                  {/* Slots list */}
                  <div className="p-5">
                    <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">
                      Upcoming Slots ({slots.filter(s => !s.is_booked).length} available)
                    </p>
                    {slotsLoading ? (
                      <div className="flex items-center justify-center h-24">
                        <Loader2 size={20} className="text-brand-600 animate-spin" />
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">No upcoming slots</p>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {slots.map(slot => (
                          <div
                            key={slot.id}
                            className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm ${
                              slot.is_booked
                                ? 'bg-slate-50 border-slate-100 text-slate-400'
                                : 'bg-green-50 border-green-100 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${slot.is_booked ? 'bg-slate-300' : 'bg-green-500'}`} />
                              {formatSlotTime(slot.slot_datetime)}
                              {slot.is_booked && <span className="text-xs text-slate-400">(booked)</span>}
                            </div>
                            {!slot.is_booked && (
                              <button
                                onClick={() => handleDeleteSlot(slot.id)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Appointments tab
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Calendar size={15} />
              Upcoming Appointments ({appointments.length})
            </h2>
            {appointments.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 flex items-center justify-center h-48">
                <p className="text-slate-400 text-sm">No appointments found</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Doctor</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date & Time</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Reason</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {appointments.map(appt => (
                        <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-slate-900">
                              {appt.patients?.first_name} {appt.patients?.last_name}
                            </p>
                            <p className="text-xs text-slate-400">{appt.patients?.email}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-slate-700">{appt.doctors?.name}</p>
                            <p className="text-xs text-slate-400">{appt.doctors?.specialty}</p>
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                            {formatSlotTime(appt.appointment_datetime)}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 max-w-[200px] truncate">
                            {appt.reason}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[appt.status] || STATUS_COLORS.confirmed}`}>
                              {appt.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {appt.status === 'confirmed' && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleUpdateAppointment(appt.id, 'completed')}
                                  className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => handleUpdateAppointment(appt.id, 'cancelled')}
                                  className="text-xs px-2.5 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function formatSlotTime(dt) {
  return new Date(dt).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  });
}
