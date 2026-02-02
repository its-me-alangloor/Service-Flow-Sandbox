import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Save, Calendar, ArrowRight, PlayCircle, PlusCircle, X, FileText, Printer, Copy, Check } from 'lucide-react';

const INITIAL_DATA = {
  "2026-03-01": {
    title: "Lamentations 1",
    subtitle: "Bittersweet",
    items: [
      { id: 1, section: "CHECKS", time900: "07:57am", time1045: "09:42am", length: "5:00", item: "Service Flow Meeting", notes: "" },
      { id: 2, section: "CHECKS", time900: "08:02am", time1045: "09:47am", length: "25:00", item: "Cue-to-Cue Rehearsal", notes: "8:00 am start" },
      { id: 3, section: "CHECKS", time900: "08:27am", time1045: "10:12am", length: "8:00", item: "Teaching Pastor Check", notes: "Pastor ready at 8:25" },
      { id: 4, section: "CHECKS", time900: "08:35am", time1045: "10:20am", length: "3:00", item: "Service Host Check", notes: "" },
      { id: 5, section: "CHECKS", time900: "08:38am", time1045: "10:23am", length: "5:00", item: "Video Checks", notes: "" },
      { id: 6, section: "CHECKS", time900: "08:43am", time1045: "10:28am", length: "15:00", item: "Doors", notes: "8:45 am" },
      { id: 7, section: "GATHERING", time900: "08:58am", time1045: "10:43am", length: "2:00", item: "Video Call to Worship", notes: "" },
      { id: 8, section: "GATHERING", time900: "09:00am", time1045: "10:45am", length: "1:30", item: "Connection Point / Welcome", notes: "Check-in reminder" },
      { id: 9, section: "WORD", time900: "09:01am", time1045: "10:46am", length: "1:30", item: "Next Steps", notes: "Give & Foot of the Cross" },
      { id: 10, section: "WORD", time900: "09:03am", time1045: "10:48am", length: "1:00", item: "Sermon Bumper", notes: "" },
      { id: 11, section: "WORD", time900: "09:04am", time1045: "10:49am", length: "36:00", item: "Sermon Title:", notes: "Lamentations 1" },
      { id: 12, section: "TABLE", time900: "09:40am", time1045: "11:25am", length: "5:00", item: "Communion", notes: "" },
      { id: 13, section: "BENEDICTION", time900: "09:45am", time1045: "11:30am", length: "0:30", item: "Benediction", notes: "" },
    ]
  }
};

const parseLocalDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const addMinutes = (timeStr, minsToAdd) => {
  if (!timeStr) return "00:00am";
  const match = timeStr.match(/(\d+):(\d+)(am|pm)/);
  if (!match) return timeStr;

  let [_, hours, minutes, modifier] = match;
  hours = parseInt(hours);
  minutes = parseInt(minutes);

  if (modifier === 'pm' && hours !== 12) hours += 12;
  if (modifier === 'am' && hours === 12) hours = 0;

  const date = new Date();
  date.setHours(hours, minutes + minsToAdd, 0);

  let newHours = date.getHours();
  const newMinutes = date.getMinutes().toString().padStart(2, '0');
  const newModifier = newHours >= 12 ? 'pm' : 'am';
  
  newHours = newHours % 12 || 12;
  return `${newHours.toString().padStart(2, '0')}:${newMinutes}${newModifier}`;
};

export default function App() {
  const [currentDate, setCurrentDate] = useState("2026-03-01");
  const [services, setServices] = useState(INITIAL_DATA);
  const [notification, setNotification] = useState(null);
  const [copied, setCopied] = useState(false);

  const recalculateTimes = (items) => {
    if (items.length === 0) return [];
    const updated = [...items];
    for (let i = 1; i < updated.length; i++) {
      const prev = updated[i-1];
      const lengthMins = parseInt(prev.length.split(':')[0] || 0);
      updated[i].time900 = addMinutes(prev.time900, lengthMins);
      updated[i].time1045 = addMinutes(prev.time1045, lengthMins);
    }
    return updated;
  };

  const handleUpdateItem = (id, field, value) => {
    setServices(prev => {
      const currentItems = prev[currentDate].items;
      const updatedItems = currentItems.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      );
      return {
        ...prev,
        [currentDate]: {
          ...prev[currentDate],
          items: recalculateTimes(updatedItems)
        }
      };
    });
  };

  const addItem = (index) => {
    const prevItem = services[currentDate].items[index];
    const newItem = {
      id: Math.random(),
      section: prevItem ? prevItem.section : "NEW",
      time900: "09:00am", 
      time1045: "10:45am",
      length: "5:00",
      item: "New Item",
      notes: ""
    };
    setServices(prev => {
      const newItems = [...prev[currentDate].items];
      newItems.splice(index + 1, 0, newItem);
      return {
        ...prev,
        [currentDate]: { ...prev[currentDate], items: recalculateTimes(newItems) }
      };
    });
    showNotification("Item added.");
  };

  const removeItem = (id) => {
    setServices(prev => {
      const newItems = prev[currentDate].items.filter(i => i.id !== id);
      return {
        ...prev,
        [currentDate]: { ...prev[currentDate], items: recalculateTimes(newItems) }
      };
    });
  };

  const addNewDate = () => {
    const lastDateStr = Object.keys(services).sort().pop();
    const lastDate = parseLocalDate(lastDateStr);
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + 7);
    const y = nextDate.getFullYear();
    const m = String(nextDate.getMonth() + 1).padStart(2, '0');
    const d = String(nextDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    
    setServices({
      ...services,
      [dateStr]: {
        title: `New Service`,
        subtitle: `Draft`,
        items: services[currentDate].items.map(item => ({ ...item, id: Math.random() }))
      }
    });
    setCurrentDate(dateStr);
    showNotification(`Added ${dateStr}.`);
  };

  const deleteDate = (dateToDelete) => {
    if (Object.keys(services).length <= 1) return;
    const remainingDates = Object.keys(services).filter(d => d !== dateToDelete);
    const newServices = { ...services };
    delete newServices[dateToDelete];
    setServices(newServices);
    if (currentDate === dateToDelete) setCurrentDate(remainingDates[0]);
  };

  const handlePrint = () => {
    window.print();
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2000);
  };

  const currentService = services[currentDate];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      {/* CSS for PDF Printing */}
      <style>{`
        @media print {
          @page { size: portrait; margin: 15mm; }
          body { background: white; padding: 0 !important; }
          .no-print { display: none !important; }
          .print-container { box-shadow: none !important; border: none !important; width: 100% !important; max-width: none !important; padding: 0 !important; margin: 0 !important; }
          .print-header { margin-bottom: 2rem !important; border-bottom: 2px solid #334155 !important; padding-bottom: 1rem !important; }
          table { width: 100% !important; border: 1px solid #e2e8f0 !important; }
          th { background-color: #0f172a !important; color: white !important; -webkit-print-color-adjust: exact; }
          td { border-bottom: 1px solid #e2e8f0 !important; }
          input { border: none !important; background: transparent !important; padding: 0 !important; }
          .section-label { color: #2563eb !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto print-container">
        {/* Header - Hidden on Print */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 no-print">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <PlayCircle className="text-blue-600" />
              Service Flow Sandbox
            </h1>
            <p className="text-slate-500 text-sm">Draft weekend plans. All times auto-calculate based on length.</p>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm"
            >
              <FileText size={18} />
              Download PDF
            </button>

            <div className="flex bg-white rounded-lg shadow-sm border p-1 overflow-x-auto max-w-full">
              {Object.keys(services).sort().map(date => (
                <div key={date} className="relative group">
                  <button
                    onClick={() => setCurrentDate(date)}
                    className={`px-4 py-2 rounded-md transition-all text-sm font-medium whitespace-nowrap pr-8 ${
                      currentDate === date 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {parseLocalDate(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </button>
                  {Object.keys(services).length > 1 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteDate(date); }}
                      className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                        currentDate === date ? 'text-blue-200 hover:bg-blue-500 hover:text-white' : 'text-slate-300 hover:bg-red-500 hover:text-white'
                      }`}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
              <button 
                onClick={addNewDate}
                className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="Add New Date"
              >
                <PlusCircle size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Service Info Card */}
        <div className="bg-white rounded-xl shadow-sm border mb-6 p-6 print-header">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest no-print">Series / Topic</label>
              <input 
                value={currentService.title}
                onChange={(e) => setServices({...services, [currentDate]: {...currentService, title: e.target.value}})}
                className="w-full text-xl font-bold border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest no-print">Theme</label>
              <input 
                value={currentService.subtitle}
                onChange={(e) => setServices({...services, [currentDate]: {...currentService, subtitle: e.target.value}})}
                className="w-full text-xl font-bold border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
            <div className="flex items-center justify-end col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg text-slate-600 text-sm font-bold border border-slate-200">
                <Calendar size={16} className="text-blue-500 no-print" />
                {parseLocalDate(currentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Flow Table */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden print-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-[0.15em]">
                  <th className="px-6 py-4 font-bold">9:00am</th>
                  <th className="px-6 py-4 font-bold">10:45am</th>
                  <th className="px-6 py-4 font-bold w-20 text-center">Length</th>
                  <th className="px-6 py-4 font-bold">Item Detail</th>
                  <th className="px-6 py-4 font-bold">Notes</th>
                  <th className="px-6 py-4 w-20 no-print"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentService.items.map((item, idx) => (
                  <tr key={item.id} className="group hover:bg-blue-50/40 transition-colors break-inside-avoid">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600 font-mono text-xs font-bold">
                        {item.time900}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs font-bold">
                      {item.time1045}
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        value={item.length}
                        onChange={(e) => handleUpdateItem(item.id, 'length', e.target.value)}
                        className="w-full text-center bg-slate-100 group-hover:bg-white border border-transparent rounded px-2 py-1 font-mono text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <input 
                          value={item.section}
                          onChange={(e) => handleUpdateItem(item.id, 'section', e.target.value.toUpperCase())}
                          className="section-label text-[9px] font-black text-blue-600 tracking-wider outline-none bg-transparent mb-0.5"
                        />
                        <input 
                          value={item.item}
                          onChange={(e) => handleUpdateItem(item.id, 'item', e.target.value)}
                          className="font-bold text-slate-800 outline-none bg-transparent w-full text-sm"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        value={item.notes}
                        onChange={(e) => handleUpdateItem(item.id, 'notes', e.target.value)}
                        className="text-xs text-slate-500 italic outline-none bg-transparent w-full"
                        placeholder="..."
                      />
                    </td>
                    <td className="px-6 py-4 no-print">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => addItem(idx)} className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-md"><Plus size={16} /></button>
                        <button onClick={() => removeItem(item.id)} className="p-1.5 hover:bg-red-100 text-red-600 rounded-md"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Print-only Footer */}
        <div className="hidden print:block mt-8 border-t pt-4 text-center text-[10px] text-slate-400">
          Generated via Service Flow Sandbox • Private Planning Draft
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 no-print">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium">{notification}</span>
          </div>
        )}
      </div>
    </div>
  );
}