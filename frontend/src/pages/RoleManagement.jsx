import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2, Users, Loader2, Check, X, ChevronDown, ChevronUp, UserCog, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

const MODULE_LABELS = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  financial: 'Financial',
  procurement: 'Procurement',
  hrms: 'HRMS',
  compliance: 'Compliance',
  einvoicing: 'E-Invoicing',
  reports: 'Reports',
  ai_assistant: 'AI Assistant',
  settings: 'Settings',
  admin: 'Admin'
};

const ACTION_LABELS = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete'
};

export default function RoleManagement() {
  const { api, isAdmin } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [modules, setModules] = useState([]);
  const [actions, setActions] = useState([]);
  
  // Dialog states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);
  
  // Form state
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: {}
  });
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedRole, setExpandedRole] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, usersRes, statsRes, modulesRes] = await Promise.all([
        api.get('/rbac/roles'),
        api.get('/rbac/users'),
        api.get('/rbac/stats'),
        api.get('/rbac/modules')
      ]);
      setRoles(rolesRes.data);
      setUsers(usersRes.data);
      setStats(statsRes.data);
      setModules(modulesRes.data.modules);
      setActions(modulesRes.data.actions);
    } catch (error) {
      toast.error('Failed to load RBAC data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const initializeSystemRoles = async () => {
    try {
      const res = await api.post('/rbac/init');
      toast.success(res.data.message);
      fetchData();
    } catch (error) {
      toast.error('Failed to initialize roles');
    }
  };

  const openCreateRoleDialog = () => {
    setEditingRole(null);
    const initialPermissions = {};
    modules.forEach(m => {
      initialPermissions[m] = { view: false, create: false, edit: false, delete: false };
    });
    setRoleForm({ name: '', description: '', permissions: initialPermissions });
    setRoleDialogOpen(true);
  };

  const openEditRoleDialog = (role) => {
    setEditingRole(role);
    const permissions = {};
    modules.forEach(m => {
      const perm = role.permissions?.find(p => p.module === m);
      permissions[m] = {
        view: perm?.view || false,
        create: perm?.create || false,
        edit: perm?.edit || false,
        delete: perm?.delete || false
      };
    });
    setRoleForm({
      name: role.name,
      description: role.description || '',
      permissions
    });
    setRoleDialogOpen(true);
  };

  const handlePermissionChange = (module, action, checked) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [action]: checked
        }
      }
    }));
  };

  const selectAllForModule = (module) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: { view: true, create: true, edit: true, delete: true }
      }
    }));
  };

  const clearAllForModule = (module) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: { view: false, create: false, edit: false, delete: false }
      }
    }));
  };

  const saveRole = async () => {
    if (!roleForm.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    
    setSaving(true);
    try {
      const permissions = Object.entries(roleForm.permissions).map(([module, perms]) => ({
        module,
        ...perms
      }));
      
      const payload = {
        name: roleForm.name.trim(),
        description: roleForm.description,
        permissions
      };
      
      if (editingRole) {
        await api.put(`/rbac/roles/${editingRole.id}`, payload);
        toast.success('Role updated successfully');
      } else {
        await api.post('/rbac/roles', payload);
        toast.success('Role created successfully');
      }
      
      setRoleDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteRole = (role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const deleteRole = async () => {
    if (!roleToDelete) return;
    
    try {
      await api.delete(`/rbac/roles/${roleToDelete.id}`);
      toast.success('Role deleted successfully');
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete role');
    }
  };

  const openAssignDialog = (user) => {
    setSelectedUser(user);
    setSelectedRoleId(user.role_id || '');
    setAssignDialogOpen(true);
  };

  const assignRole = async () => {
    if (!selectedUser) return;
    
    try {
      if (selectedRoleId) {
        await api.post('/rbac/assign-role', {
          user_id: selectedUser.id,
          role_id: selectedRoleId
        });
        toast.success('Role assigned successfully');
      } else {
        await api.delete(`/rbac/users/${selectedUser.id}/role`);
        toast.success('Role removed, user will use legacy permissions');
      }
      setAssignDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to assign role');
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="rounded-sm max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need administrator privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="role-management-page">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Role Management
          </h1>
          <p className="page-subtitle">Manage roles and permissions for your organization</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={initializeSystemRoles} className="rounded-sm gap-2">
            <RefreshCw className="w-4 h-4" />
            Initialize Defaults
          </Button>
          <Button onClick={openCreateRoleDialog} className="action-btn-accent rounded-sm gap-2">
            <Plus className="w-4 h-4" />
            Create Role
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="rounded-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-sm">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active_roles}</p>
                  <p className="text-sm text-muted-foreground">Active Roles</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-sm">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_users}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-sm">
                  <UserCog className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.users_with_rbac_role}</p>
                  <p className="text-sm text-muted-foreground">RBAC Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-sm">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.users_with_legacy_role}</p>
                  <p className="text-sm text-muted-foreground">Legacy Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList className="rounded-sm">
          <TabsTrigger value="roles" className="rounded-sm gap-2">
            <Shield className="w-4 h-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-sm gap-2">
            <Users className="w-4 h-4" />
            User Assignments
          </TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles">
          <Card className="rounded-sm">
            <CardHeader>
              <CardTitle>Roles</CardTitle>
              <CardDescription>Configure roles and their module-wise permissions</CardDescription>
            </CardHeader>
            <CardContent>
              {roles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No roles defined yet.</p>
                  <p className="text-sm">Click "Initialize Defaults" to create system roles or "Create Role" to add custom roles.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {roles.map((role) => (
                    <Card key={role.id} className="rounded-sm border">
                      <CardHeader 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {expandedRole === role.id ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-base">{role.name}</CardTitle>
                                {role.is_system_role && (
                                  <Badge variant="secondary" className="rounded-sm text-xs">System</Badge>
                                )}
                                {!role.is_active && (
                                  <Badge variant="destructive" className="rounded-sm text-xs">Inactive</Badge>
                                )}
                              </div>
                              <CardDescription className="text-sm">{role.description || 'No description'}</CardDescription>
                            </div>
                          </div>
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button variant="outline" size="sm" onClick={() => openEditRoleDialog(role)} className="rounded-sm gap-1">
                              <Edit className="w-4 h-4" />
                              Edit
                            </Button>
                            {!role.is_system_role && (
                              <Button variant="outline" size="sm" onClick={() => confirmDeleteRole(role)} className="rounded-sm gap-1 text-red-500 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      {expandedRole === role.id && (
                        <CardContent className="border-t pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {modules.map((module) => {
                              const perm = role.permissions?.find(p => p.module === module);
                              const hasAny = perm?.view || perm?.create || perm?.edit || perm?.delete;
                              return (
                                <div key={module} className={`p-3 rounded-sm border ${hasAny ? 'bg-green-50 border-green-200' : 'bg-muted/30'}`}>
                                  <p className="font-medium text-sm mb-2">{MODULE_LABELS[module] || module}</p>
                                  <div className="flex flex-wrap gap-1">
                                    {actions.map((action) => (
                                      <Badge 
                                        key={action} 
                                        variant={perm?.[action] ? 'default' : 'outline'}
                                        className={`rounded-sm text-xs ${perm?.[action] ? 'bg-green-600' : 'text-muted-foreground'}`}
                                      >
                                        {perm?.[action] ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1 opacity-50" />}
                                        {ACTION_LABELS[action]}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="rounded-sm">
            <CardHeader>
              <CardTitle>User Role Assignments</CardTitle>
              <CardDescription>Assign roles to users to control their access permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Legacy Role</TableHead>
                    <TableHead>Assigned Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.department || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-sm capitalize">
                          {user.role?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.role_name ? (
                          <Badge className="rounded-sm bg-green-600">{user.role_name}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Using legacy</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => openAssignDialog(user)} className="rounded-sm gap-1">
                          <UserCog className="w-4 h-4" />
                          Assign Role
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
            <DialogDescription>
              {editingRole ? 'Modify the role details and permissions' : 'Define a new role with specific module permissions'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role Name *</Label>
                <Input
                  value={roleForm.name}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Project Manager"
                  className="rounded-sm"
                  disabled={editingRole?.is_system_role}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={roleForm.description}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this role"
                  className="rounded-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Module Permissions</Label>
              <p className="text-sm text-muted-foreground">Configure what actions this role can perform on each module</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {modules.map((module) => (
                  <Card key={module} className="rounded-sm">
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">{MODULE_LABELS[module] || module}</CardTitle>
                        <div className="flex gap-1">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-xs"
                            onClick={() => selectAllForModule(module)}
                          >
                            All
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-xs"
                            onClick={() => clearAllForModule(module)}
                          >
                            None
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="py-3 px-4 border-t">
                      <div className="grid grid-cols-2 gap-3">
                        {actions.map((action) => (
                          <div key={action} className="flex items-center gap-2">
                            <Checkbox
                              id={`${module}-${action}`}
                              checked={roleForm.permissions[module]?.[action] || false}
                              onCheckedChange={(checked) => handlePermissionChange(module, action, checked)}
                            />
                            <Label htmlFor={`${module}-${action}`} className="text-sm cursor-pointer">
                              {ACTION_LABELS[action]}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)} className="rounded-sm">
              Cancel
            </Button>
            <Button onClick={saveRole} disabled={saving} className="action-btn-accent rounded-sm">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
            <DialogDescription>
              Select a role to assign to {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Role</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger className="rounded-sm">
                  <SelectValue placeholder="Select a role (or leave empty for legacy)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Use Legacy Role ({selectedUser?.role})</SelectItem>
                  {roles.filter(r => r.is_active).map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                If no role is selected, the user will use their legacy role permissions.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)} className="rounded-sm">
              Cancel
            </Button>
            <Button onClick={assignRole} className="action-btn-accent rounded-sm">
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role "{roleToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-sm">
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteRole} className="rounded-sm">
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
