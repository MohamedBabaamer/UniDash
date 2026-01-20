import React from 'react';
import { StudentPayment } from '../types';

const AdminPayments: React.FC = () => {
  const payments: StudentPayment[] = [
    { id: '1', name: 'Alex Johnson', studentId: 'CS-2024-042', department: 'Comp Sci', amount: 2450.00, dueDate: 'Oct 15, 2023', status: 'Paid' },
    { id: '2', name: 'Maria Santos', studentId: 'MA-2024-118', department: 'Mathematics', amount: 1800.00, dueDate: 'Oct 28, 2023', status: 'Pending' },
    { id: '3', name: 'David Lee', studentId: 'CS-2024-009', department: 'Comp Sci', amount: 3100.00, dueDate: 'Oct 01, 2023', status: 'Overdue' },
    { id: '4', name: 'Rohan Kumar', studentId: 'MA-2024-204', department: 'Mathematics', amount: 1800.00, dueDate: 'Oct 30, 2023', status: 'Paid' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-amber-100 text-amber-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getDeptColor = (dept: string) => {
      return dept === 'Comp Sci' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Payment Management</h2>
        <p className="text-slate-500 mt-1">Track and manage student tuition and lab fees for Computer Science and Math departments.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <p className="text-slate-500 text-sm font-medium">Total Collected</p>
                <span className="material-symbols-outlined text-green-500">trending_up</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">$425,000</p>
            <p className="text-green-600 text-sm font-medium">+12% from last term</p>
        </div>
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <p className="text-slate-500 text-sm font-medium">Pending Payments</p>
                <span className="material-symbols-outlined text-amber-500">schedule</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">$12,400</p>
            <p className="text-amber-600 text-sm font-medium">85 students pending</p>
        </div>
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <p className="text-slate-500 text-sm font-medium">Overdue Accounts</p>
                <span className="material-symbols-outlined text-red-500">warning</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">18</p>
            <p className="text-red-500 text-sm font-medium">+2 new today</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                    <span className="material-symbols-outlined text-lg">filter_list</span>
                    Filter
                </button>
                 <select className="form-select text-sm rounded-lg border-slate-200 bg-transparent py-2 focus:ring-primary/50 text-slate-600">
                    <option>All Departments</option>
                    <option>Computer Science</option>
                    <option>Mathematics</option>
                </select>
            </div>
            <button className="text-sm font-medium text-primary px-3 py-2 hover:bg-primary/5 rounded-lg">Export CSV</button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                                        {payment.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{payment.name}</p>
                                        <p className="text-xs text-slate-500">ID: {payment.studentId}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getDeptColor(payment.department)}`}>
                                    {payment.department}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                ${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                             <td className={`px-6 py-4 text-sm ${payment.status === 'Overdue' ? 'text-red-500 font-medium' : 'text-slate-500'}`}>
                                {payment.dueDate}
                            </td>
                            <td className="px-6 py-4">
                                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                    {payment.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {payment.status !== 'Paid' && (
                                        <button className="px-3 py-1 text-xs font-bold bg-primary text-white rounded hover:bg-primary/90 transition-opacity">Mark Paid</button>
                                    )}
                                    <button className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors">
                                        <span className="material-symbols-outlined text-lg">more_vert</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/30">
             <p className="text-sm text-slate-500">Showing 1 to 4 of 245 students</p>
             <div className="flex gap-2">
                <button className="px-3 py-1 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 disabled:opacity-50" disabled>Previous</button>
                <button className="px-3 py-1 bg-primary text-white rounded-lg text-sm font-medium">1</button>
                <button className="px-3 py-1 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">2</button>
                <button className="px-3 py-1 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Next</button>
             </div>
        </div>

      </div>
    </div>
  );
};

export default AdminPayments;