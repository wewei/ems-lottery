import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Switch
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import { useTranslation } from 'react-i18next';
import api from '../../utils/axios';

interface User {
  _id: string;
  alias: string;
  nickname: string;
  isActive: boolean;
}

const UserManagement: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{
    newUsers: any[];
    updateUsers: any[];
    unchangedUsers: any[];
  } | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [batchDeleteDialog, setBatchDeleteDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [createDialog, setCreateDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    alias: '',
    nickname: ''
  });
  const [batchActivateDialog, setBatchActivateDialog] = useState(false);
  const [batchDeactivateDialog, setBatchDeactivateDialog] = useState(false);
  const [activateAllDialog, setActivateAllDialog] = useState(false);
  const [deactivateAllDialog, setDeactivateAllDialog] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search
        }
      });
      setUsers(response.data.users);
      setTotal(response.data.total);
    } catch (err) {
      console.error(t('user.fetchFailed'), err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, search]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          const rows = text.split(/\r\n|\r|\n/)
            .filter(row => row.trim())
            .slice(1)
            .map(row => {
              const [alias, nickname] = row
                .split(',')
                .map(field => field.trim().replace(/^["']|["']$/g, ''));
              return { alias, nickname };
            })
            .filter(({ alias, nickname }) => alias && nickname);

          const response = await api.post('/api/users/preview-import', { users: rows });
          setImportPreview(response.data);
        } catch (err) {
          alert(t('user.parseFailed'));
        }
      };
      reader.readAsText(selectedFile);
    } catch (err) {
      alert(t('user.readFailed'));
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview) return;

    try {
      await api.post('/api/users/batch-import', {
        newUsers: importPreview.newUsers,
        updateUsers: importPreview.updateUsers
      });
      setImportPreview(null);
      setSelectedFile(null);
      fetchUsers();
      alert(t('user.importSuccess'));
    } catch (err) {
      alert(t('user.importFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/users/${id}`);
      fetchUsers();
      setDeleteDialog(false);
    } catch (err) {
      alert(t('user.deleteFailed'));
    }
  };

  const handleBatchDelete = async () => {
    if (!selectedUsers.length) return;

    try {
      await api.post('/api/users/batch-delete', { ids: selectedUsers });
      setSelectedUsers([]);
      fetchUsers();
      setBatchDeleteDialog(false);
    } catch (err) {
      alert(t('user.batchDeleteFailed'));
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      if (user.isActive) {
        await api.post(`/api/users/deactivate/${user.alias}`);
      } else {
        await api.post(`/api/users/admin/activate/${user._id}`);
      }
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || t(user.isActive ? 'user.deactivateFailed' : 'user.activateFailed'));
    }
  };

  const handleEdit = async () => {
    if (!editingUser) return;
    
    try {
      await api.post(`/api/users/${editingUser._id}`, {
        alias: editingUser.alias,
        nickname: editingUser.nickname
      });
      setEditDialog(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || t('user.updateFailed'));
    }
  };

  const handleCreateUser = async () => {
    try {
      await api.post('/api/users', newUser);
      setCreateDialog(false);
      setNewUser({ alias: '', nickname: '' });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || t('user.createFailed'));
    }
  };

  const handleBatchActivate = async () => {
    try {
      const aliases = selectedUsers
        .map(id => users.find(u => u._id === id))
        .filter(user => user && !user.isActive)
        .map(user => user!.alias);

      if (aliases.length === 0) {
        alert(t('user.noUsersToActivate'));
        return;
      }

      const response = await api.post('/api/users/batch-activate', { aliases });
      
      if (response.data.activated.length > 0) {
        alert(t('user.batchActivateSuccess', { count: response.data.activated.length }));
      }

      setSelectedUsers([]);
      fetchUsers();
      setBatchActivateDialog(false);
    } catch (err: any) {
      alert(err.response?.data?.message || t('user.batchActivateFailed'));
    }
  };

  const handleBatchDeactivate = async () => {
    try {
      const aliases = selectedUsers
        .map(id => users.find(u => u._id === id))
        .filter(user => user && user.isActive)
        .map(user => user!.alias);

      if (aliases.length === 0) {
        alert(t('user.noUsersToDeactivate'));
        return;
      }

      const response = await api.post('/api/users/batch-deactivate', { aliases });

      if (response.data.deactivated.length > 0) {
        alert(t('user.batchDeactivateSuccess', { count: response.data.deactivated.length }));
      }

      setSelectedUsers([]);
      fetchUsers();
      setBatchDeactivateDialog(false);
    } catch (err: any) {
      alert(err.response?.data?.message || t('user.batchDeactivateFailed'));
    }
  };

  const handleGenerateTestUsers = async () => {
    try {
      const response = await api.post('/api/users/generate-test?count=10');
      alert(response.data.message);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || t('user.generateTestFailed'));
    }
  };

  const handleDeleteTestUsers = async () => {
    try {
      const response = await api.post('/api/users/delete-test-users');
      alert(response.data.message);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || t('user.deleteTestFailed'));
    }
  };

  const handleActivateAll = async () => {
    try {
      const response = await api.post('/api/users/activate-all');
      alert(t('user.activateAllSuccess', { count: response.data.activated }));
      fetchUsers();
      setActivateAllDialog(false);
    } catch (err: any) {
      alert(err.response?.data?.message || t('user.activateAllFailed'));
    }
  };

  const handleDeactivateAll = async () => {
    try {
      const response = await api.post('/api/users/deactivate-all');
      alert(t('user.deactivateAllSuccess', { count: response.data.deactivated }));
      fetchUsers();
      setDeactivateAllDialog(false);
    } catch (err: any) {
      alert(err.response?.data?.message || t('user.deactivateAllFailed'));
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
        />
        <Button
          variant="contained"
          color="info"
          startIcon={<AddIcon />}
          onClick={handleGenerateTestUsers}
        >
          {t('user.generateTest')}
        </Button>
        <Button
          variant="contained"
          color="warning"
          startIcon={<CleaningServicesIcon />}
          onClick={handleDeleteTestUsers}
        >
          {t('user.cleanTest')}
        </Button>
        <Button
          variant="contained"
          onClick={() => setCreateDialog(true)}
        >
          {t('user.create')}
        </Button>
        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUploadIcon />}
        >
          {t('user.import')}
          <input
            type="file"
            hidden
            accept=".csv,.txt"
            onChange={handleFileChange}
          />
        </Button>
        {selectedFile && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleImport}
          >
            {t('user.previewImport')}
          </Button>
        )}
        <Button
          variant="contained"
          color="success"
          onClick={() => setActivateAllDialog(true)}
        >
          {t('user.activateAll')}
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={() => setDeactivateAllDialog(true)}
        >
          {t('user.deactivateAll')}
        </Button>
        {selectedUsers.length > 0 && (
          <>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteSweepIcon />}
              onClick={() => setBatchDeleteDialog(true)}
            >
              {t('user.batchDelete')}
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => setBatchActivateDialog(true)}
              disabled={!selectedUsers.some(id => 
                users.find(u => u._id === id && !u.isActive)
              )}
            >
              {t('user.batchActivate')}
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={() => setBatchDeactivateDialog(true)}
              disabled={!selectedUsers.some(id => 
                users.find(u => u._id === id && u.isActive)
              )}
            >
              {t('user.batchDeactivate')}
            </Button>
          </>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(users.map(user => user._id));
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                />
              </TableCell>
              <TableCell>{t('user.alias')}</TableCell>
              <TableCell>{t('user.nickname')}</TableCell>
              <TableCell align="center">{t('user.status')}</TableCell>
              <TableCell align="center">{t('common.edit')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell padding="checkbox">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user._id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell>{user.alias}</TableCell>
                <TableCell>{user.nickname}</TableCell>
                <TableCell align="center">
                  <Switch
                    checked={user.isActive}
                    onChange={() => handleToggleActive(user)}
                    color="primary"
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    color="primary"
                    onClick={() => {
                      setEditingUser(user);
                      setEditDialog(true);
                    }}
                    title={t('user.edit')}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => {
                      setSelectedUsers([user._id]);
                      setDeleteDialog(true);
                    }}
                    title={t('user.delete')}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50, 100, 200]}
      />

      <Dialog open={!!importPreview} onClose={() => setImportPreview(null)}>
        <DialogTitle>{t('user.importPreview')}</DialogTitle>
        <DialogContent>
          <Box>
            <Typography variant="subtitle1">
              {t('user.newUsers')}: {importPreview?.newUsers.length || 0}
            </Typography>
            <Typography variant="subtitle1">
              {t('user.updateUsers')}: {importPreview?.updateUsers.length || 0}
            </Typography>
            <Typography variant="subtitle1">
              {t('user.unchangedUsers')}: {importPreview?.unchangedUsers.length || 0}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportPreview(null)}>{t('common.cancel')}</Button>
          <Button onClick={handleConfirmImport} color="primary">
            {t('user.confirmImport')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>{t('user.confirmDelete')}</DialogTitle>
        <DialogContent>
          <Typography>{t('user.confirmDeleteMessage')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>{t('common.cancel')}</Button>
          <Button onClick={() => handleDelete(users[0]._id)} color="error">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={batchDeleteDialog} onClose={() => setBatchDeleteDialog(false)}>
        <DialogTitle>{t('user.confirmBatchDelete')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('user.confirmBatchDeleteMessage', { count: selectedUsers.length })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchDeleteDialog(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleBatchDelete} color="error">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialog} onClose={() => setEditDialog(false)}>
        <DialogTitle>{t('user.edit')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label={t('user.alias')}
              value={editingUser?.alias || ''}
              onChange={(e) => setEditingUser(prev => prev ? { ...prev, alias: e.target.value } : null)}
              fullWidth
            />
            <TextField
              label={t('user.nickname')}
              value={editingUser?.nickname || ''}
              onChange={(e) => setEditingUser(prev => prev ? { ...prev, nickname: e.target.value } : null)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleEdit} color="primary">{t('common.save')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createDialog} onClose={() => setCreateDialog(false)}>
        <DialogTitle>{t('user.create')}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label={t('user.alias')}
              value={newUser.alias}
              onChange={(e) => setNewUser(prev => ({ ...prev, alias: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label={t('user.nickname')}
              value={newUser.nickname}
              onChange={(e) => setNewUser(prev => ({ ...prev, nickname: e.target.value }))}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>{t('common.cancel')}</Button>
          <Button 
            onClick={handleCreateUser}
            disabled={!newUser.alias || !newUser.nickname}
          >
            {t('user.create')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={batchActivateDialog} onClose={() => setBatchActivateDialog(false)}>
        <DialogTitle>{t('user.confirmBatchActivate')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('user.confirmBatchActivateMessage', { count: selectedUsers.length })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchActivateDialog(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleBatchActivate} color="success">
            {t('user.activate')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={batchDeactivateDialog} onClose={() => setBatchDeactivateDialog(false)}>
        <DialogTitle>{t('user.confirmBatchDeactivate')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('user.confirmBatchDeactivateMessage', { 
              count: selectedUsers.filter(id => 
                users.find(u => u._id === id && u.isActive)
              ).length 
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchDeactivateDialog(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleBatchDeactivate} color="warning">
            {t('user.deactivate')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={activateAllDialog} onClose={() => setActivateAllDialog(false)}>
        <DialogTitle>{t('user.confirmActivateAll')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('user.confirmActivateAllMessage')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivateAllDialog(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleActivateAll} color="success">
            {t('user.activate')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deactivateAllDialog} onClose={() => setDeactivateAllDialog(false)}>
        <DialogTitle>{t('user.confirmDeactivateAll')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('user.confirmDeactivateAllMessage')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeactivateAllDialog(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleDeactivateAll} color="warning">
            {t('user.deactivate')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 