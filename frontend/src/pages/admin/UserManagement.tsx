import { useEffect, useState } from "react";
import { adminService, type User } from "../../services/adminService";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Shield, ShieldAlert, ShieldCheck, UserPlus, X, Search, Eye, Pencil } from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "CANDIDATE" as 'ADMIN' | 'HR_OFFICER' | 'CANDIDATE',
    isActive: true
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number | undefined) => {
    if (!id) return;
    try {
      await adminService.changeUserStatus(id);
      await fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Failed to change user status", error);
      alert("Error changing user status");
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedUserId(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "CANDIDATE",
      isActive: true
    });
    setFormError("");
    setShowModal(true);
  };

  const openViewModal = async (user: User) => {
    if (!user.id) return;
    setModalMode('view');
    setSelectedUserId(user.id);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "CANDIDATE",
      isActive: user.isActive
    });
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = async (user: User) => {
    if (!user.id) return;
    setModalMode('edit');
    setSelectedUserId(user.id);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "", // Keep blank by default in edit mode
      role: user.role || "CANDIDATE",
      isActive: user.isActive
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'view') {
      setShowModal(false);
      return;
    }
    
    setFormError("");

    if (modalMode === 'create') {
      if (!formData.name?.trim()) {
        setFormError('Name is required.');
        return;
      }
      if (!formData.email?.trim()) {
        setFormError('Email is required.');
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        setFormError('Password must be at least 6 characters.');
        return;
      }
    }

    setSubmitting(true);

    try {
      if (modalMode === 'create') {
        await adminService.createUser(formData);
      } else if (modalMode === 'edit' && selectedUserId) {
        // Send fields for update
        await adminService.updateUser(selectedUserId, formData);
      }
      setShowModal(false);
      await fetchUsers(); // Refresh list
    } catch (error: any) {
      console.error("Failed to process user operation", error);
      setFormError(error.response?.data?.message || `Failed to ${modalMode} user. Please check your details.`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
          <p className="text-slate-500">Create, manage, and configure system users and their roles.</p>
        </div>
        <Button 
          onClick={openCreateModal} 
          className="gap-2 bg-fuchsia-600 hover:bg-fuchsia-700"
        >
          <UserPlus className="w-4 h-4" />
          Create User
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, email, or role..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3">User</th>
                <th scope="col" className="px-6 py-3">Role</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="bg-white border-b hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {user.role === 'ADMIN' ? (
                          <Shield className="w-4 h-4 text-fuchsia-600" />
                        ) : user.role === 'HR_OFFICER' ? (
                          <ShieldAlert className="w-4 h-4 text-blue-500" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        )}
                        <span className="font-medium text-slate-700">
                          {user.role === 'HR_OFFICER' ? 'HR / Recruiter' : user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        user.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openViewModal(user)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                        <button 
                          onClick={() => openEditModal(user)}
                          className="p-1.5 text-slate-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 rounded-md transition-colors"
                          title="Edit user"
                        >
                          <Pencil className="w-4.5 h-4.5" />
                        </button>
                        <Button 
                          variant={user.isActive ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleToggleStatus(user.id)}
                          className={!user.isActive ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "text-red-600 border-red-200 hover:bg-red-50"}
                        >
                          {user.isActive ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unified User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {modalMode === 'create' ? 'Create New User' : modalMode === 'edit' ? 'Edit User Info' : 'User Detail'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                  {formError}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="modal-name">
                  Full Name
                </label>
                <Input 
                  id="modal-name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={modalMode === 'view'}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="modal-email">
                  Email Address
                </label>
                <Input 
                  id="modal-email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={modalMode === 'view'}
                  required
                />
              </div>

              {modalMode !== 'view' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="modal-password">
                    Password {modalMode === 'edit' && <span className="text-xs text-slate-400 font-normal">(Leave blank to keep current)</span>}
                  </label>
                  <Input 
                    id="modal-password"
                    type="password"
                    placeholder={modalMode === 'edit' ? "••••••••" : ""}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={modalMode === 'create'}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="modal-role">
                  Role
                </label>
                <select
                  id="modal-role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  disabled={modalMode === 'view'}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2 disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="CANDIDATE">Candidate</option>
                  <option value="HR_OFFICER">HR / Recruiter</option>
                  <option value="ADMIN">System Admin</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="modal-active"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  disabled={modalMode === 'view'}
                  className="w-4 h-4 accent-fuchsia-600 rounded border-slate-300 disabled:opacity-50"
                />
                <label className="text-sm font-semibold text-slate-700" htmlFor="modal-active">
                  Active immediately
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  {modalMode === 'view' ? 'Close' : 'Cancel'}
                </Button>
                {modalMode !== 'view' && (
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="bg-fuchsia-600 hover:bg-fuchsia-700"
                  >
                    {submitting ? "Processing..." : modalMode === 'create' ? "Create User" : "Save Changes"}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
