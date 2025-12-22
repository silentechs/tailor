'use client';

import type { WorkerRole } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Shield, UserPlus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { fetchApi } from '@/lib/fetch-api';
import { PERMISSIONS, type Permission, ROLE_PERMISSIONS } from '@/lib/permissions';
import { cn } from '@/lib/utils';
export default function TeamPage() {
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('WORKER');

  // Editing State
  const [editingMember, setEditingMember] = useState<any>(null);
  const [editRole, setEditRole] = useState('');
  const [editPermissions, setEditPermissions] = useState<Permission[]>([]);

  // 1. Fetch current user & organization context
  const { data: userData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetchApi('/api/auth/me');
      return res.json();
    },
  });

  const user = userData?.user;
  const organization = user?.memberships?.[0]?.organization || user?.ownedOrganizations?.[0];
  const orgId = organization?.id;

  // 2. Fetch invitations
  const { data: invitationsData } = useQuery({
    queryKey: ['organizations', orgId, 'invitations'],
    queryFn: async () => {
      if (!orgId) return { data: [] };
      const res = await fetchApi(`/api/organizations/${orgId}/invitations`);
      return res.json();
    },
    enabled: !!orgId,
  });

  // 3. Create invitation mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetchApi(`/api/organizations/${orgId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send invitation');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Invitation sent successfully');
      setIsInviteOpen(false);
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'invitations'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // 4. Revoke invitation mutation
  const revokeMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const res = await fetchApi(`/api/organizations/${orgId}/invitations/${inviteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to revoke invitation');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Invitation revoked');
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'invitations'] });
    },
  });

  // 4.5. Resend invitation mutation
  const resendMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const res = await fetchApi(`/api/organizations/${orgId}/invitations/${inviteId}/resend`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to resend invitation');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Invitation resent successfully');
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'invitations'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // 5. Fetch members
  const { data: membersData, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['organizations', orgId, 'members'],
    queryFn: async () => {
      if (!orgId) return { data: [] };
      const res = await fetchApi(`/api/organizations/${orgId}/members`);
      return res.json();
    },
    enabled: !!orgId,
  });

  // 6. Update member mutation
  const updateMemberMutation = useMutation({
    mutationFn: async ({ memberId, data }: { memberId: string; data: any }) => {
      const res = await fetchApi(`/api/organizations/${orgId}/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update member');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Member updated successfully');
      setEditingMember(null);
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'members'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // 7. Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetchApi(`/api/organizations/${orgId}/members/${memberId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to remove member');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Member removed');
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'members'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    // Calculate only custom Permissions: ones that are NOT in the default role set?
    // Actually, the backend overrides, so we can just send the full list and let the backend/logic decide.
    // Wait, logic says: effective = role_perms + custom.
    // If we want to REVOKE a default role perm, the current logic assumes ADDITIVE only permissions.
    // "effectivePermissions = [...ROLE_PERMISSIONS[role], ...custom]"
    // This means we CANNOT revoke default role permissions. We can only ADD extra ones.
    // I will explain this in the UI.

    updateMemberMutation.mutate({
      memberId: editingMember.id,
      data: { role: editRole, permissions: editPermissions },
    });
  };

  const openEdit = (member: any) => {
    setEditingMember(member);
    setEditRole(member.role);
    setEditPermissions(member.permissions || []);
  };

  // Calculate permissions implied by the currently selected role
  const defaultRolePermissions = useMemo(() => {
    if (!editRole) return [];
    return ROLE_PERMISSIONS[editRole as WorkerRole] || [];
  }, [editRole]);

  if (!orgId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <Shield className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
        <h2 className="text-2xl font-bold mb-2">No Organization Found</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          You need to be part of an organization to manage a team. If you are a tailor, your
          organization should have been created automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black font-heading tracking-tight text-foreground/90">
            Team Management
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Manage your workforce at{' '}
            <span className="text-foreground font-semibold">{organization.name}</span>
          </p>
        </div>

        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="font-bold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all rounded-full px-8"
            >
              <UserPlus className="mr-2 h-5 w-5" /> Invite Worker
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleInvite} className="space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black font-heading">
                  Invite a Team Member
                </DialogTitle>
                <DialogDescription className="text-base">
                  Send an invitation to join your organization on StitchCraft.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="worker@example.com"
                      className="pl-10 h-12 bg-muted/30 border-none focus-visible:ring-primary/30"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="role"
                    className="text-sm font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Role
                  </Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="h-12 bg-muted/30 border-none">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="SENIOR">Senior Tailor</SelectItem>
                      <SelectItem value="WORKER">Worker/Tailor</SelectItem>
                      <SelectItem value="APPRENTICE">Apprentice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-bold h-12 rounded-xl"
                  disabled={inviteMutation.isPending}
                >
                  {inviteMutation.isPending ? 'Sending Invitation...' : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-8">
        {/* Current Members */}
        <Card className="shadow-2xl shadow-primary/5 border-none bg-background/50 backdrop-blur-sm overflow-hidden rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-black font-heading">Active Team Members</CardTitle>
            <CardDescription className="text-base font-medium">
              Everyone currently working at {organization.name}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMembers ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : membersData?.data?.length > 0 ? (
              <div className="mt-4 border rounded-2xl overflow-hidden bg-card">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="py-4 px-6 font-bold uppercase text-[10px] tracking-widest">
                        Member
                      </TableHead>
                      <TableHead className="py-4 px-6 font-bold uppercase text-[10px] tracking-widest">
                        Role
                      </TableHead>
                      <TableHead className="py-4 px-6 font-bold uppercase text-[10px] tracking-widest text-right">
                        Joined
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {membersData.data.map((member: any) => (
                      <TableRow
                        key={member.id}
                        className="hover:bg-muted/10 transition-colors border-muted/20"
                      >
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary border-2 border-primary/20">
                              {member.user.name[0]}
                            </div>
                            <div>
                              <div className="font-bold text-foreground">{member.user.name}</div>
                              <div className="text-xs text-muted-foreground font-medium">
                                {member.user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge
                            className={cn(
                              'uppercase text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full border-none',
                              member.role === 'MANAGER'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right text-sm font-medium text-muted-foreground">
                          {new Date(member.joinedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right space-x-2">
                          {/* Do not allow editing the Owner/Self if complex logic needed, but mainly Owner needs protection */}
                          {/* We can check if the member is the owner of the organization. 
                                                        We need ownerId available in organization object. */}
                          {organization?.ownerId !== member.user.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="font-bold text-primary"
                              onClick={() => openEdit(member)}
                            >
                              Edit / Perms
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <Users className="h-16 w-16 mb-4" />
                <p className="text-xl font-bold">No members found</p>
                <p className="max-w-xs text-sm mt-1">
                  Start by inviting your colleagues to join your organization.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {invitationsData?.data?.length > 0 && (
          <Card className="border-none shadow-xl bg-muted/20 rounded-3xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-black font-heading flex items-center gap-2">
                <Mail className="h-6 w-6 text-primary" /> Pending Invitations
              </CardTitle>
              <CardDescription className="text-sm font-medium">
                People invited but haven't joined yet.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t border-muted-foreground/10">
                <Table>
                  <TableHeader className="bg-transparent">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="py-4 px-6 font-bold uppercase text-[10px] tracking-widest">
                        Email
                      </TableHead>
                      <TableHead className="py-4 px-6 font-bold uppercase text-[10px] tracking-widest">
                        Role
                      </TableHead>
                      <TableHead className="py-4 px-6 font-bold uppercase text-[10px] tracking-widest">
                        Sent
                      </TableHead>
                      <TableHead className="py-4 px-6 font-bold uppercase text-[10px] tracking-widest text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitationsData.data.map((invite: any) => (
                      <TableRow
                        key={invite.id}
                        className="hover:bg-background/50 border-muted/10 transition-colors"
                      >
                        <TableCell className="py-4 px-6 font-bold text-foreground/80">
                          {invite.email}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold tracking-widest border-primary/20 text-primary"
                          >
                            {invite.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-muted-foreground text-xs font-medium">
                          {new Date(invite.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-full font-bold text-primary hover:text-primary hover:bg-primary/10 px-4"
                            onClick={() => resendMutation.mutate(invite.id)}
                            disabled={resendMutation.isPending}
                          >
                            {resendMutation.isPending && resendMutation.variables === invite.id
                              ? 'Resending...'
                              : 'Resend'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-full font-bold text-destructive hover:text-destructive hover:bg-destructive/10 px-4"
                            onClick={() => {
                              if (confirm('Are you sure you want to revoke this invitation?')) {
                                revokeMutation.mutate(invite.id);
                              }
                            }}
                            disabled={revokeMutation.isPending}
                          >
                            Revoke
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Edit Member Dialog */}
        <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
          <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Member Permissions</DialogTitle>
              <DialogDescription>
                Manage access level for {editingMember?.user?.name}.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="space-y-6">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANAGER">Manager (Full Access)</SelectItem>
                    <SelectItem value="SENIOR">Senior Tailor</SelectItem>
                    <SelectItem value="WORKER">Worker</SelectItem>
                    <SelectItem value="APPRENTICE">Apprentice</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Roles provide a default set of permissions. You can grant{' '}
                  <strong>additional</strong> permissions below.
                </p>
              </div>

              <div className="space-y-3">
                <Label>Additional Permissions</Label>
                <div className="grid grid-cols-2 gap-3 border rounded-lg p-4 bg-muted/20">
                  {Object.entries(PERMISSIONS).map(([key, label]) => {
                    const isDefault = defaultRolePermissions.includes(key as Permission);
                    const isChecked = isDefault || editPermissions.includes(key as Permission);

                    return (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`perm-${key}`}
                          checked={isChecked}
                          disabled={isDefault}
                          onCheckedChange={(checked) => {
                            // Can only toggle if NOT default
                            if (isDefault) return;

                            if (checked) {
                              setEditPermissions([...editPermissions, key as Permission]);
                            } else {
                              setEditPermissions(editPermissions.filter((p) => p !== key));
                            }
                          }}
                        />
                        <label
                          htmlFor={`perm-${key}`}
                          className={cn(
                            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer',
                            isDefault && 'opacity-70 cursor-default'
                          )}
                        >
                          {label}{' '}
                          {isDefault && (
                            <span className="text-[10px] text-muted-foreground ml-1">
                              (Role Default)
                            </span>
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-4 flex justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (
                      confirm(
                        'Review Access: This will permanently remove the member from your organization.'
                      )
                    ) {
                      removeMemberMutation.mutate(editingMember.id);
                    }
                  }}
                >
                  Remove Member
                </Button>
                <Button type="submit" disabled={updateMemberMutation.isPending}>
                  {updateMemberMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
